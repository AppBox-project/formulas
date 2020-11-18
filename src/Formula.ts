import { ModelType } from "appbox-types";
import { AutomationContext } from "./Types";
import DatabaseModel from "appbox-types/dist/Classes/DatabaseModel";
import functions from "./Formulas/Functions";
import { find } from "lodash";

var uniqid = require("uniqid");

export default class Formula {
  model: ModelType;
  formula: string;
  originalFormula: string;
  dependencies: { model: string; field: string; foreign: boolean }[] = [];
  tags: { tag: string; identifier: string }[] = [];
  name: string;
  modelCache: { [modelKey: string]: ModelType } = {};
  models: DatabaseModel;
  functions: { fName; fArgs }[] = [];
  outputType: "text" | "number" | "boolean" | "picture" = "text";
  systemVars = { __TODAY: new Date() };
  systemVarTriggers = { __TODAY: { cron: "0 0 * * *" } };
  timeTriggers = [];

  constructor(
    formula: string,
    model: ModelType,
    models: DatabaseModel,
    name: string
  ) {
    this.originalFormula = formula;
    this.formula = formula;
    this.model = model;
    this.name = name;
    this.modelCache[model.key] = model;
    this.models = models;
  }

  // Compiling a formula
  // --> This function turns a formula (this.formula) into dependencies and caches the models along the way.
  compile = () =>
    new Promise(async (resolve) => {
      // Extract {{ tags }}
      [...this.formula.matchAll(new RegExp(/{{\s*(?<var>.*?)\s*}}/gm))].map(
        (match) => {
          const varName = uniqid();
          this.tags.push({ tag: match.groups.var, identifier: varName });
          this.formula = this.formula.replace(match[0], `$___${varName}___$`);
        }
      );

      // Turn tags into dependencies
      //@ts-ignore
      await this.tags.reduce(async (prevTag, tag) => {
        const tagParts = tag.tag.split(/[-+*\/](?![^\(]*\))/gm);
        //@ts-ignore
        await tagParts.reduce(async (prevTagPart, tagPart) => {
          // The regexp splits on -, but not within parenthesis
          const part = tagPart.trim();

          if (part.match(/\w*\(.+\)/)) {
            // This part has a function call. We need to preprocess these functions to figure out what the dependencies are.
            const func = new RegExp(/(?<fName>\w*)\((?<fArgs>.*)\)/gm).exec(
              part
            );
            await this.preprocessFunction(func.groups.fName, func.groups.fArgs);
          } else if (part.match(/\./)) {
            // A dot part indicates a foreign relationship.
            const ps = part.split(".");
            let currentModel = this.model.key;
            //@ts-ignore
            await ps.reduce(async (prev, curr) => {
              //@ts-ignore
              const previousModel: ModelType = await prev;
              if (previousModel)
                this.modelCache[previousModel.key] = previousModel;
              let promise;

              if (curr.match("_r")) {
                //--> Foreign dependency (follows relationships)
                const fieldName = curr.replace("_r", "");
                if (currentModel === this.model.key) {
                  // First part of path
                  const relationshipTo = this.modelCache[currentModel].fields[
                    fieldName
                  ].typeArgs.relationshipTo;
                  if (!this.modelCache[relationshipTo])
                    promise = this.models.models.model.findOne({
                      key: relationshipTo,
                    });
                  currentModel = relationshipTo;
                  this.dependencies.push({
                    model: this.model.key,
                    field: fieldName,
                    foreign: false,
                  });
                } else {
                  // Not first, not last part of path
                  const relationshipTo = this.modelCache[currentModel].fields[
                    fieldName
                  ].typeArgs.relationshipTo;
                  if (!this.modelCache[relationshipTo])
                    promise = this.models.models.model.findOne({
                      key: relationshipTo,
                    });
                  this.dependencies.push({
                    model: currentModel,
                    field: fieldName,
                    foreign: true,
                  });
                  currentModel = relationshipTo;
                }
              } else {
                // Last path of part
                // Not first, not last part of path
                this.dependencies.push({
                  model: currentModel,
                  field: curr,
                  foreign: true,
                });
              }

              return promise;
            }, ps[0]);
          } else {
            //--> Local dependency,
            this.dependencies.push({
              model: this.model.key,
              field: part,
              foreign: false,
            });
          }
        }, tagParts[0]);
      }, this.tags[0]);

      // Done
      console.log(`--> 🧪 Formula '${this.name}' compiled.`);
      resolve();
    });

  // Preprocess a function
  // -> Runs the func's preprocess call and returns it's dependencies
  // Also already parses the arguments
  preprocessFunction = (fName, fArgs) =>
    new Promise(async (resolve) => {
      // Step 1, process arguments
      // --> Split arguments based on comma
      const fArguments = fArgs.split(
        /,(?!(?=[^"]*"[^"]*(?:"[^"]*"[^"]*)*$))(?![^\(]*\))(?![^\[]*\])(?![^\{]*\})/gm
      ); // Splits commas, except when they're in brackets or apostrophes
      const newArguments = [];
      // Loop through arguments (async) and if they are a function themselves, preprocess those first.
      await fArguments.reduce(async (prev, curr) => {
        await prev;
        const variable = curr.trim();
        if (variable.match(/\w*\(.+\)/)) {
          // This part has a function call. We need to preprocess these functions to figure out what the dependencies are.
          const func = new RegExp(/(?<fName>\w*)\((?<fArgs>.*)\)/gm).exec(curr);
          const projectedResult = await this.preprocessFunction(
            func.groups.fName,
            func.groups.fArgs
          );
          newArguments.push(projectedResult);
        } else {
          if (variable.charAt(0) === '"' || variable.charAt(0) === "'") {
            newArguments.push({
              str: variable.replace(/^['"]/g, "").replace(/['"]$/g, ""),
            });
          } else {
            newArguments.push(variable);
          }
        }
        return true;
      }, fArguments[0]);

      // Done looping, now preprocess the function
      if (functions[fName]) {
        const deps = await functions[fName].onCompile(newArguments);
        deps.map((dep) => {
          if (typeof dep === "string") {
            // Check if one of the dependencies returned is a systemVar. These still need a value.
            if (!Object.keys(this.systemVars).includes(dep)) {
              this.dependencies.push({
                model: this.model.key,
                field: dep.trim(),
                foreign: false,
              });
            } else {
              // This is a system var. Take appropriate action.
              if ((this.systemVarTriggers[dep] || {}).cron) {
                // Time based trigger (such as __TODAY)
                this.timeTriggers.push(this.systemVarTriggers[dep].cron);
              }
            }
          } else {
            this.dependencies.push(dep);
          }
        });
        resolve(functions[fName].returnPreview);
      } else {
        console.log(`Unknown function ${fName}`);
        resolve();
      }
    });

  // Use all the information available in this class after compilation and calculate it
  calculate = async (dataObj: {}, context: AutomationContext) =>
    new Promise(async (resolve, reject) => {
      const localContext = { ...context };

      const data = { ...dataObj, __TODAY: new Date() };
      const regex = /\$___(?<tagName>.+?)___\$/gm;
      let r;
      const tags = [];
      while ((r = regex.exec(this.formula)) !== null) {
        tags.push(r.groups.tagName);
      }

      // Before we start parsing all the tags, we'll go through all of our dependencies, to see if there's any foreign relations (user_r.first_name).
      // We'll resolve those to their actual data.
      //@ts-ignore
      await this.dependencies.reduce(async (prev, curr) => {
        await prev;

        // If this is a local relationship with a dot.
        if (curr.foreign === false) {
          if (curr.field.match(/\./)) {
            // Walk through the path, part by part.
            const fullPath = curr.field;
            const path = fullPath.split(/\./m);

            let firstStep = true;
            // When a value returns the async reduce, we map it into the data object as a full string.
            // @ts-ignore
            data[fullPath] = await path.reduce(async (prev, pathPart) => {
              let currObject;

              // First step: get the given objects
              if (firstStep) {
                firstStep = false;
                currObject = context.object;
              } else {
                // Steps following it, get the result from the previous promise.
                currObject = await prev;
              }

              let action = prev;
              if (pathPart.match("_r")) {
                // First or middle, find the next object

                action = await this.models.objects.model.findOne({
                  _id: currObject.data[pathPart.replace("_r", "")],
                });
              } else {
                action = currObject.data[pathPart];
              }

              return action;
            }, path[0]);
          }
        }

        return curr;
      }, this.dependencies[0]);

      // We now have mapped all the foreign relations to their actual values

      // Parse all tags
      let output: string | number | boolean = await tags.reduce(
        //@ts-ignore
        async (prev, tagId) => {
          const newlocalContext = { ...localContext }; // Because of the nature of this function and js async behavior we copy the values into a local context
          const reducingFormula = prev === tags[0] ? this.formula : await prev;

          let parsedTag;
          if ((tagId.trim() || "").length > 0) {
            const tag = find(this.tags, (o) => o.identifier === tagId).tag;

            if (tag.match(/\w*\(.+\)/)) {
              const func = new RegExp(/(?<fName>\w*)\((?<fArgs>.*)\)/gm).exec(
                tag
              );

              //@ts-ignore
              parsedTag = await this.processFunction(
                func.groups.fName,
                func.groups.fArgs,
                data,
                localContext
              );
            } else {
              if (tag.match(/\./)) {
                //@ts-ignore
                if (!localContext.object) {
                  // To follow relationships we need values, and therefore we need a context object.
                  reject(
                    "Can't use foreign relationships in a contextless formula execution."
                  );
                } else {
                  // Locally triggered foreign dependency
                  parsedTag = await this.getForeignFieldFromId(
                    tag, //@ts-ignore
                    context.object
                  );
                }
              } else {
                parsedTag = data[tag];
              }
            }
          }

          if (parsedTag !== undefined) {
            return reducingFormula.replace(`$___${tagId}___$`, parsedTag);
          } else {
            return reducingFormula;
          }
        },
        tags[0]
      );

      if (this.outputType === "number")
        //@ts-ignore
        output = !isNaN(output) ? parseInt(output) : 0;
      if (this.outputType === "boolean")
        //@ts-ignore
        output = output === "true" ? true : false;
      resolve(output);
    });

  processFunction = (fName, fArgs, data: {}, localContext: AutomationContext) =>
    new Promise(async (resolve) => {
      //@ts-ignore
      const fArguments = fArgs.split(
        /,(?!(?=[^"]*"[^"]*(?:"[^"]*"[^"]*)*$))(?![^\(]*\))(?![^\[]*\])(?![^\{]*\})/gm
      ); // Splits commas, except when they're in brackets or apostrophes
      const newArguments = await fArguments.reduce(async (prev, curr) => {
        const output = typeof prev === "string" ? [] : await prev;
        let variable = curr.trim(); // Remove spaces and trailing apostrophes

        if (variable.match(/\w*\(.+\)/)) {
          // If one of the arguments contains a (sub) function, resolve that first, using this recurring function
          // Continue processing once all sub functions are resolved.
          const func = new RegExp(/(?<fName>\w*)\((?<fArgs>.*)\)/gm).exec(
            variable
          );
          output.push(
            await this.processFunction(
              func.groups.fName,
              func.groups.fArgs,
              data,
              localContext
            )
          );
        } else {
          // Change systemVars (__TODAY) by their respective values.
          if (Object.keys(this.systemVars).includes(variable)) {
            variable = this.systemVars[variable];
          }
          if (typeof variable === "string") {
            if (variable.charAt(0) === '"' || variable.charAt(0) === "'") {
              output.push({
                str: variable.replace(/^['"]/g, "").replace(/['"]$/g, ""),
              });
            } else {
              output.push(variable);
            }
          } else {
            output.push(variable);
          }
        }
        return output;
      }, fArguments[0]);
      if (functions[fName]) {
        resolve(
          await functions[fName].execute(newArguments, data, this, localContext)
        );
      } else {
        console.log(`Uknown function ${fName}`);
        resolve();
      }
    });

  // Turn a foreign relationship tag into a value
  getForeignFieldFromId = async (tag: string, data) =>
    new Promise(async (resolve) => {
      const models = this.models;
      const path = tag.split(".");
      let nextObject = data;
      //@ts-ignore
      await path.reduce(async function (prev, curr) {
        let totalPath = (await prev) || "";
        if (curr.match("_r")) {
          const fieldName = curr.substr(0, curr.length - 2);
          const nextId = nextObject.data[fieldName];
          nextObject = await models.objects.model.findOne({
            _id: nextId,
          });
        } else {
          totalPath += `.${curr}`;
          resolve(nextObject.data[curr]);
        }
        return totalPath;
      }, path[0]);
    });
}

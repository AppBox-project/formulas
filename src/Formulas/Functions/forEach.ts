import { AutomationContext, FormulaContext } from "appbox-types";
import Formula from "../../Formula";
import { map } from "lodash";
const uniqid = require("uniqid");

/*
 * forEach(criteria, template)
 * criteria
 * - The criteria for the database query
 * template
 * - The template that gets repeated
 * Performs an object query and repeats a string template based on the information
 */

export default {
  execute: (
    fArgs,
    data,
    formula: Formula,
    context: AutomationContext | FormulaContext
  ) =>
    new Promise(async (resolve, reject) => {
      if (!context.object) {
        reject("This formula can't be ran without object context ");
      } else {
        const criteria = JSON.parse(fArgs[0]);

        // Prepare criteria
        map(criteria, (crit, key) => {
          if (crit === "__thisId") criteria[key] = `${context.object._id}`;
        });

        const objects = await context.models.objects.model.find(criteria);
        const model = await context.models.models.model.findOne({
          key: criteria.objectId,
        });

        let result = "";
        // For each object, return the given text.
        // Treat the text as if a formula with the secondary tag type ([[tag]]).
        await objects.reduce(async (prev, object) => {
          await prev;

          const formula = new Formula(
            fArgs[1],
            model,
            context.models,
            uniqid()
          );
          await formula.compile("[[");
          const compiledFormula = await formula.calculate(object.data, {
            models: context.models,
            object,
          });

          result += compiledFormula;
          return object;
        }, objects[0]);

        resolve(result);
      }
    }),
  onCompile: (fArguments) => {
    return [];
  },
};

import { AutomationContext, FormulaContext } from "appbox-types";
import Formula from "../../Formula";

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
        const objects = await context.models.objects.model.find(criteria);
        let result = "";

        objects.map((object) => {
          result += fArgs[1];
        });

        resolve(result);
      }
    }),
  onCompile: (fArguments) => {
    return [];
  },
};

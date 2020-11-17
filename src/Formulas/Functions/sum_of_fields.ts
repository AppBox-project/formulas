import { AutomationContext, FormulaContext } from "appbox-types";
import Formula from "../../Formula";

/*
 * sum_of_fields(object, field, criteria)
 * model: string
 * - The model to look for
 * field: string
 * - The field to create a sum of
 * criteria: {field, operator, value}[]
 * - The criteria
 * Adds all the {fields} of {model} where {criteria} are met
 */

export default {
  execute: (
    fArguments,
    data,
    formula: Formula,
    context: AutomationContext | FormulaContext
  ) =>
    new Promise(async (resolve, reject) => {
      let count = 0;
      const model = fArguments[0].str;
      const field = fArguments[1].str;
      const requirements = JSON.parse(fArguments[2]);
      const criteria = {};
      requirements.map(
        (crit) =>
          (criteria[`data.${crit.field}`] = crit.value.replace(
            "__thisId",
            context.object._id
          ))
      );

      const objects = await context.models.objects.model.find({
        objectId: model,
        ...criteria,
      });

      objects.map((object) => {
        if (object?.data[field]) count += object.data[field];
      });
      resolve(count || 0);
    }),
  onCompile: (fArguments) => {
    // Add a foreign relationship to the field key and add an additional field for each requirement ([2])
    const requirements = [];
    const model = fArguments[0].str;
    const field = fArguments[1].str;

    JSON.parse(fArguments[2]).map((dep) => {
      requirements.push({
        model,
        field: dep.field,
        foreign: true,
      });
    });
    return [{ model: model, field: field, foreign: true }, ...requirements];
  },
};

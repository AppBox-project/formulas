import { AutomationContext, FormulaContext } from "appbox-types";
import Formula from "../../Formula";

/*
 * project_sum_of_fields(object, field, criteria)
 * Does the same as the sum_of_fields function, but instead counts the projected state of the database (before saving)
 * Should only be ran from a rules formula
 */

export default {
  execute: (
    fArguments,
    data,
    formula: Formula,
    context: AutomationContext | FormulaContext
  ) =>
    new Promise(async (resolve, reject) => {
      const model = fArguments[0].str;
      const field = fArguments[1].str;
      const requirements = JSON.parse(fArguments[2]);
      requirements.map((r, index) => {
        if (requirements[index].value.match(/{(.*?)}/gm)) {
          requirements[index].value =
            data[requirements[index].value.replace(/[{}]/g, "")];
        }
      });

      let result = 0;

      // Since we're projecting, we can't get the criteria from the database. Instead we have to get all the data
      const allObjects = await context.models.objects.model.find({
        objectId: model,
      });

      // Project the new values
      // In case of update the document already exists. Update it.
      let objectUpdated = false;
      allObjects.map((object) => {
        if (object._id.toString() === context.object._id.toString()) {
          // This is the object we're trying to update. Project it's newer values.
          object.data = data;
          objectUpdated = true;
        }
      });
      // If we didn't update something this must be an insert query, so add the projected data to the array.
      if (!objectUpdated) allObjects.push(context.object);

      // Perform the check on the projected data.
      allObjects.map((object) => {
        let objectPasses = true;
        requirements.map((requirement) => {
          if (object.data[requirement.field] !== requirement.value) {
            objectPasses = false;
          }
        });

        if (objectPasses) {
          result += object.data[field];
        }
      });

      // Return the new count.
      resolve(result);
    }),
  onCompile: (fArguments) => {
    // Since this is a projected requirement it should only be ran from a rules-formula. No requirements
    return [];
  },
  // Give a sample result so it's parent functions know what we will return on execute and can perform the right precompiling.
  returnPreview: 0,
};

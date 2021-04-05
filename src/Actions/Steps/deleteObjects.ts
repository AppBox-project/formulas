import { ActionInstance } from "..";
import { ActionStepType } from "../../Types";

export default (step: ActionStepType, actionInstance: ActionInstance) =>
  new Promise<void>(async (resolve, reject) => {
    if (step.args.mode === "free") {
      const deleteCriteria = { objectId: step.args.model };
      (step.args.newObject as { key: string; value: any }[]).map((crit) => {
        deleteCriteria[`data.${crit.key}`] = crit.value;
      });
      console.log("Deleting objects with criteria", deleteCriteria);
      await actionInstance.action.models.objects.model.deleteMany(
        deleteCriteria
      );
    } else {
      const toDelete = actionInstance.vars[step.args.varName];
      if (typeof toDelete === "string") {
        await actionInstance.action.models.objects.model.deleteOne({
          _id: toDelete,
        });
      } else {
        await actionInstance.action.models.objects.model.deleteMany({
          _id: { $in: toDelete },
        });
      }
    }
  });

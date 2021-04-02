import { ActionInstance } from "..";
import { ActionStepType } from "../../Types";
import Formula from "../../Formula";
const uniqid = require("uniqid");

export default (step: ActionStepType, actionInstance: ActionInstance) =>
  new Promise<void>(async (resolve, reject) => {
    if (step.args.mode === "var") {
      const newObject = await actionInstance.action.models.objects.model.create(
        actionInstance.vars[step.args.varName]
      );
      actionInstance.setVar(step.args.varName, newObject);
      resolve();
    } else {
      const newObjectData = { ...step.args.newObject };
      await Object.keys(newObjectData).reduce(
        //@ts-ignore
        async (prevValueKey, currValueKey) => {
          await prevValueKey;
          const currValue = newObjectData[currValueKey];

          if (currValue.formula) {
            const formula = new Formula(
              currValue.formula,
              undefined,
              actionInstance.action.models,
              uniqid()
            );

            await formula.compile();

            const result = await formula.calculate(actionInstance.vars, {
              models: actionInstance.action.models,
            });

            newObjectData[currValueKey] = result;
          }

          return currValueKey;
        },
        Object.keys(newObjectData)[0]
      );

      await actionInstance.action.models.objects.model.create({
        objectId: step.args.model,
        data: newObjectData,
      });
      resolve();
    }
  });

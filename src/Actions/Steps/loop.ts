import { ActionInstance } from "..";
import { ActionStepType } from "../../Types";
import StepFunctions from ".";

export default (step: ActionStepType, actionInstance: ActionInstance) =>
  new Promise<void>(async (resolve, reject) => {
    const v = actionInstance.action.action.data.vars[step.var];
    console.log(v);

    const model = await actionInstance.action.models.models.model.findOne({
      key: v.model,
    });
    const varName = `loop_current_${model.key}`;
    let index = 0;
    let steps;
    await actionInstance.vars[step.var].reduce(async (prev, currItem) => {
      await prev;

      const localActionInstance = new ActionInstance(actionInstance.action, {
        ...actionInstance.vars,
        [varName]: currItem,
      });
      if (!steps) steps = step.steps;
      await steps.reduce(
        //@ts-ignore
        async (prev, currentStep) => {
          await prev;

          // Turns out case is a reserved word
          if (currentStep.type === "case") currentStep.type = "Case";

          return await (StepFunctions[currentStep.type]
            ? StepFunctions[currentStep.type](currentStep, localActionInstance)
            : new Promise<void>((resolve, reject) => {
                console.log(`Unknown step type ${currentStep.type}.`);
                resolve();
              }));
        },
        steps[0]
      );

      const newVar = actionInstance.vars[step.var];
      newVar[index] = localActionInstance.vars[varName];
      index++;

      return currItem;
    }, actionInstance.vars[step.var]);

    resolve();
  });

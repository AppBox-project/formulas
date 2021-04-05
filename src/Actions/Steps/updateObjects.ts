import { ActionInstance } from "..";
import { ActionStepType } from "../../Types";
import Formula from "../../Formula";
const uniqid = require("uniqid");

export default (step: ActionStepType, actionInstance: ActionInstance) =>
  new Promise<void>(async (resolve, reject) => {
    const objectsToUpdate = actionInstance.vars[step.var];
    if (typeof objectsToUpdate === "object") {
      objectsToUpdate.map((obj) => {
        obj.markModified("data");
        obj.save();
      });
    } else {
      console.log("Todo: update single object");
    }
  });

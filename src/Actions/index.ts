import { ActionType } from "../Types";
import steps from "./Steps";
import { map } from "lodash";
import DatabaseModel from "../Classes/DatabaseModel";

export default class Action {
  action: ActionType;
  models: DatabaseModel;

  constructor(action, models: DatabaseModel) {
    this.action = action;
    this.models = models;
  }

  async execute(vars?) {
    return await new ActionInstance(this, vars).execute();
  }
}

export class ActionInstance {
  action: Action;
  vars: {};

  constructor(action, vars?) {
    this.vars = { ...(vars || {}) };
    this.action = action;
    // Instantiate setting values (given by the admin)
    map(this.action.action.data.vars, (v, vKey) => {
      if (v.setting_value) {
        if (v.type === "object") {
          this.action.models.objects.model
            .findOne({ _id: v.setting_value })
            .then((result) => {
              this.setVar(vKey, result);
            });
        } else {
          this.setVar(vKey, v.setting_value);
        }
      }
    });
  }

  setVar(key: string, value: any) {
    this.vars[key] = value;
  }

  async execute() {
    await this.action.action.data.logic.reduce(
      //@ts-ignore
      async (prev, currentStep) => {
        await prev;
        // Turns out case is a reserved word
        if (currentStep.type === "case") currentStep.type = "Case";
        return await (steps[currentStep.type]
          ? steps[currentStep.type](currentStep, this)
          : new Promise<void>((resolve, reject) => {
              console.log(`Unknown step type ${currentStep.type}.`);
              resolve();
            }));
      },
      this.action.action.data.logic[0]
    );
    console.log(`Action succesfully executed.`);

    return this;
  }

  getVar(varName: string) {
    return this.vars[varName];
  }
}

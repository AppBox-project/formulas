import DatabaseModel from "./Classes/DatabaseModel";

export interface AutomationContext {
  models: DatabaseModel;
  object?;
}
export interface ActionStepType {
  label: string;
  type: "assignValues" | "case" | "Case";
  args?: {
    mode?: string;
    varName?: string;
    object?: { key: string; operator: "equals"; value: any }[];
    model?: string;
    newObject?: {};
  };
  var?: string;
  steps?: ActionStepType[];

  cases?: {
    criteria: [];
    label: string;
    steps: ActionStepType[];
    conditions: {
      mode: "simple" | "formula";
      criteria: { var: string; val: any }[];
    };
  }[];
}

export interface ActionType {
  name: string;
  description: string;
  key: string;
  active: boolean;
  data: { logic: ActionStepType[]; vars: {}; triggers: {} };
}

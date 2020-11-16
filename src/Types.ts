import DatabaseModel from "./Classes/DatabaseModel";

export interface AutomationContext {
  models: DatabaseModel;
  object?;
}

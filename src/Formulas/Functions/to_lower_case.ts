import { AutomationContext, FormulaContext } from "appbox-types";
import Formula from "../../Formula";

/*
 * equals(left, right)
 * Compares the values of left and right, both arguments can be strings or field names.
 */

export default {
  execute: (
    args,
    data,
    formula: Formula,
    context: AutomationContext | FormulaContext
  ) =>
    new Promise(async (resolve, reject) => {
      // Either lowerCase() the given "string" or take it as a field name.
      resolve({
        str: ((args[0].str
          ? args[0].str
          : data[args[0]]) as string).toLowerCase(),
      });
    }),
  onCompile: (args) => {
    // If the first argument is not a string, set it as dependency
    return args[0].str ? [] : [args[0]];
  },
  // Give a sample result so it's parent functions know what we will return on execute and can perform the right precompiling.
  returnPreview: "string",
};

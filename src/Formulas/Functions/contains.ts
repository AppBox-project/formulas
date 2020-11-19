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
      const left: string = args[0].str || data[args[0]];
      const right: string = args[1].str || data[args[1]];
      resolve(left.includes(right));
    }),
  onCompile: (args) => {
    // If either argument is not a string (therefor a var), mark it as dependency.
    return [
      ...(args[0].str ? [] : [args[0]]),
      ...(args[1].str ? [] : [args[1]]),
    ];
  },
  // Give a sample result so it's parent functions know what we will return on execute and can perform the right precompiling.
  returnPreview: true,
};

import { AutomationContext, FormulaContext } from "appbox-types";
import Formula from "../../Formula";

/*
 * is_greater_than(left, right)
 * returns true if left is greater than right
 */

export default {
  execute: (
    fArgs,
    data,
    formula: Formula,
    context: AutomationContext | FormulaContext
  ) =>
    new Promise(async (resolve, reject) => {
      const left = isNaN(parseInt(fArgs[0])) ? data[fArgs[0]] : fArgs[0];
      const right = isNaN(parseInt(fArgs[1])) ? data[fArgs[1]] : fArgs[1];
      resolve(left > right);
    }),
  onCompile: (fArguments) => {
    const deps = [];

    // For each argument, check if their type is string (so not a "string", but a string). If so, it refers to a field and is a dependency.
    if (typeof fArguments[0] === "string") deps.push(fArguments[0]);
    if (typeof fArguments[1] === "string") deps.push(fArguments[1]);

    return deps;
  },
};

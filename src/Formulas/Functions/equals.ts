import { AutomationContext, FormulaContext } from "appbox-types";
import { resolve } from "path";
import Formula from "../../Formula";

/*
 * equals(left, right)
 * Compares the values of left and right, both arguments can be strings or field names.
 */

export default {
  execute: (
    fArgs,
    data,
    formula: Formula,
    context: AutomationContext | FormulaContext
  ) =>
    new Promise(async (resolve, reject) => {
      const left = typeof fArgs[0] === "string" ? data[fArgs[0]] : fArgs[0].str;
      const right =
        typeof fArgs[1] === "string" ? data[fArgs[1]] : fArgs[1].str;
      resolve(left === right);
    }),
  onCompile: (fArguments) => {
    const deps = [];
    if (typeof fArguments[0] === "string") {
      deps.push(fArguments[0]);
    }
    if (typeof fArguments[1] === "string") {
      deps.push(fArguments[1]);
    }

    return deps;
  },
};

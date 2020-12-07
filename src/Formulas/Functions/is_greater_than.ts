import { AutomationContext, FormulaContext } from "appbox-types";
import { parseISO } from "date-fns";
import { LOADIPHLPAPI } from "dns";
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
      const left =
        typeof fArgs[0].getMonth === "function"
          ? fArgs[0]
          : isNaN(parseInt(fArgs[0]))
          ? parseISO(data[fArgs[0]])
          : fArgs[0];
      const right =
        typeof fArgs[1].getMonth === "function"
          ? fArgs[1]
          : isNaN(parseInt(fArgs[1]))
          ? parseISO(data[fArgs[1]])
          : fArgs[1];

      // In case of a date comparison
      if (
        typeof left.getMonth === "function" &&
        typeof right.getMonth === "function"
      ) {
        resolve(left.getTime() > right.getTime());
      } else {
        // Every other comparison.
        resolve(left > right);
      }
    }),
  onCompile: (fArguments) => {
    const deps = [];

    // For each argument, check if their type is string (so not a "string", but a string). If so, it refers to a field and is a dependency.
    if (typeof fArguments[0] === "string" && isNaN(parseInt(fArguments[0])))
      deps.push(fArguments[0]);
    if (typeof fArguments[1] === "string" && isNaN(parseInt(fArguments[1])))
      deps.push(fArguments[1]);

    return deps;
  },
  // Give a sample result so it's parent functions know what we will return on execute and can perform the right precompiling.
  returnPreview: true,
};

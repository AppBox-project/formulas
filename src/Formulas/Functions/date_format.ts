import { format, parseISO } from "date-fns";
import Formula from "../../Formula";

/*
 * dateFormat(date, format)
 * left: date
 * - Date to format
 * right: format
 * - String format
 * Calculates the difference between left and right according to date-fns.
 */
export default {
  execute: (fArgs, data, formula: Formula) =>
    new Promise((resolve) => {
      let date = fArgs[0].str
        ? typeof fArgs[0].str == "string"
          ? typeof data[fArgs[0].str] === "string"
            ? parseISO(data[fArgs[0].str])
            : data[fArgs[0].str]
          : fArgs[0]
        : data[fArgs[0]];

      if (typeof date === "string") date = parseISO(date);

      resolve(format(date, fArgs[1].str));
    }),
  onCompile: (fArguments) => {
    // Mark argument 0 as required
    return [fArguments[0].str];
  },
};

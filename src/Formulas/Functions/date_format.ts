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
  execute: (args, data, formula: Formula) =>
    new Promise((resolve) => {
      let date = args[0].str
        ? typeof args[0].str == "string"
          ? typeof data[args[0].str] === "string"
            ? parseISO(data[args[0].str])
            : data[args[0].str]
          : args[0]
        : data[args[0]] || args[0];

      if (typeof date === "string") date = parseISO(date);
      resolve(format(date, args[1].str));
    }),
  onCompile: (fArguments) => {
    // Mark argument 0 as required
    return [fArguments[0].str];
  },
};

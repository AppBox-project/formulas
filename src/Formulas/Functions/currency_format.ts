import Formula from "../../Formula";

/*
 * currency_format(number, locale)
 * left: number
 * - number to format
 * right: locale
 * - Way of formatting
 * Stylises the number as a currency, according to the rules for locale
 */
export default {
  execute: (args, data, formula: Formula) =>
    new Promise((resolve) => {
      const number = isNaN(parseInt(args[0]))
        ? data[args[0]]
        : parseInt(args[0]);

      resolve(
        new Intl.NumberFormat(args[1].str, {
          style: "currency",
          currency: args[2].str,
        }).format(number)
      );
    }),
  onCompile: (fArguments) => {
    // Mark argument 0 as required
    return [fArguments[0]];
  },
  // Give a sample result so it's parent functions know what we will return on execute and can perform the right precompiling.
  returnPreview: "string",
};

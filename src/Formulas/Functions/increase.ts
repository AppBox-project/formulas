import Formula from "../../Formula";

/*
 * math(query)
 * query: string
 * - The math to perform, with {tags}
 * (Safely) evaluates a math query
 */

export default {
  execute: (args, data, formula: Formula) =>
    new Promise((resolve) => {
      resolve(parseInt(args[0]) + parseInt(args[1]));
    }),
  onCompile: (fArguments) => {
    return [fArguments[0], fArguments[1]];
  },
  // Give a sample result so it's parent functions know what we will return on execute and can perform the right precompiling.
  returnPreview: 0,
};

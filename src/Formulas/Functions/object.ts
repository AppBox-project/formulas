import Formula from "../../Formula";

/*
 * id(object)
 * object: Object
 * - Object to return id for
 * In case of multiple variables, returns the object so object functions can be applied
 */
export default {
  execute: (args, data, formula: Formula) =>
    new Promise((resolve) => {
      resolve(data[args[0]]);
    }),
  onCompile: (fArguments) => {
    // Mark argument 0 as required
    return [fArguments[0]];
  },
  // Give a sample result so it's parent functions know what we will return on execute and can perform the right precompiling.
  returnPreview: {},
};

import Formula from "../../Formula";

/*
 * id(object)
 * object: Object
 * - Object to return id for
 * Convenience function to return the id for an object
 */
export default {
  execute: (args, data, formula: Formula) =>
    new Promise((resolve) => {
      resolve(
        typeof args[0] === "object"
          ? args[0].data
            ? args[0].data[args[1]]
            : args[0][args[1]]
          : data[args[0]]?.data[args[1]]
      );
    }),
  onCompile: (fArguments) => {
    // Mark argument 0 as required
    return [fArguments[0]];
  },
  // Give a sample result so it's parent functions know what we will return on execute and can perform the right precompiling.
  returnPreview: "string",
};

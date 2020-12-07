import Formula from "../../Formula";

/*
 * math(query)
 * query: string
 * - The math to perform, with {tags}
 * (Safely) evaluates a math query
 */

export default {
  execute: (fArguments, data, formula: Formula) =>
    new Promise((resolve) => {
      let query = fArguments[0].str;
      query.match(/{(.+?)}/gm).map((d) => {
        const dep = d.substring(1, d.length - 1);
        query = query.replace(`{${dep}}`, data[dep] || 0);
      });
      query = query.replace(/[^-()\d/*+.]/g, ""); // Make the query safe for evaluation by removing anything that's not a digit, ()-+/*.
      resolve(eval(query));
    }),
  onCompile: (fArguments) => {
    // Loop through query and find all the {tags}.
    const deps = [];
    (fArguments[0].str.match(/{(.+?)}/gm) || []).map((dep) =>
      deps.push(dep.substring(1, dep.length - 1))
    );
    return deps;
  },
  // Give a sample result so it's parent functions know what we will return on execute and can perform the right precompiling.
  returnPreview: 0,
};

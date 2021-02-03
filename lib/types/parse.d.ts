/**
 * Generates the TypeDoc internal representation for the passed source. This invokes typedoc's
 * Application bundle and throws on failures.
 *
 * @param {string} sourceFile
 * @param {string[]} extraSources
 * @return {typedocModels.ProjectReflection}
 */
export function generateTypeDocObject(sourceFile: string, ...extraSources: string[]): typedocModels.ProjectReflection;
import * as typedocModels from "typedoc/dist/lib/models";

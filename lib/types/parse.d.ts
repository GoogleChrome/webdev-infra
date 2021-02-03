/**
 * @param {string[]} fileNames
 * @param {Partial<typedoc.TypeDocOptions>} bootstrapOptions
 * @param {ts.CompilerOptions} compilerOptions
 * @return {typedocModels.ProjectReflection}
 */
export function generateTypeDocObjectOptions(fileNames: string[], bootstrapOptions: Partial<typedoc.TypeDocOptions>, compilerOptions: ts.CompilerOptions): typedocModels.ProjectReflection;
/**
 * Generates the TypeDoc internal representation for the passed source. This invokes typedoc's
 * Application bundle and throws on failures.
 *
 * @param {string} sourceFile
 * @param {string[]} extraSources
 * @return {typedocModels.ProjectReflection}
 */
export function generateTypeDocObject(sourceFile: string, ...extraSources: string[]): typedocModels.ProjectReflection;
import * as typedoc from "typedoc";
import * as ts from "typescript";
import * as typedocModels from "typedoc/dist/lib/models";

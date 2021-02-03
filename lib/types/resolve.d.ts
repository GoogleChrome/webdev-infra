/**
 * Resolves the ambiguous "foo.Bar" syntax into a complete Reflection for the given owner
 * Reflection, or void if not available in this project.
 *
 * This is an improvement over TypeDoc's internal resolver as it:
 *   - allows arbitrary dividers between properties
 *   - descends into dup named calls and magic names
 *
 * This can return an ambiguous result, but TypeDoc's internal resolver is *already* ambiguous for
 * functions with multiple signatures.
 *
 * @param {typedocModels.Reflection} owner
 * @param {string} name
 * @return {typedocModels.Reflection|void}
 */
export function resolveLink(owner: typedocModels.Reflection, name: string): typedocModels.Reflection | void;
/**
 * Finds the closest parent Reflection that satisfies the caller.
 *
 * @param {typedocModels.Reflection|void} reflection
 * @param {(cand: typedocModels.Reflection) => boolean} check
 * @return {typedocModels.Reflection|void}
 */
export function closest(reflection: typedocModels.Reflection | void, check: (cand: typedocModels.Reflection) => boolean): typedocModels.Reflection | void;
/**
 * Generates the FQDN for this reflection.
 *
 * This is improved over TypeDoc's generation:
 *   - hides internal __call etc types
 *   - doesn't include the module/filename
 *
 * It's only useful for names within a specific project or module. Notably this works for Chrome
 * and friends because they declare a new global namespace, "chrome".
 *
 * @param {typedocModels.Reflection} reflection
 * @return {string}
 */
export function fullName(reflection: typedocModels.Reflection): string;
/**
 * Finds the exported children of this Reflection.
 *
 * @param {typedocModels.Reflection=} reflection
 * @param {typedocModels.ReflectionKind=} kindMask
 * @return {{[name: string]: typedocModels.DeclarationReflection}}
 */
export function exportedChildren(reflection?: typedocModels.Reflection | undefined, kindMask?: typedocModels.ReflectionKind | undefined): {
    [name: string]: typedocModels.DeclarationReflection;
};
import * as typedocModels from "typedoc/dist/lib/models";

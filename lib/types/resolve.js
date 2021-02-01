/*
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


import * as typedocModels from 'typedoc/dist/lib/models';


const knownMagicNames = ['__call', '__type', '__index'];


/**
 * Insert this instead of "." between an interface or function and one of its properties. This
 * can be the dot too, but JSDoc uses "#". TSDoc as of 4.1.3 can't resolve _either_ in at-see or
 * at-link declarations, and only links to functions, interfaces, namespaces or enums (and values).
 */
const propertyDelimiter = '.';


/**
 * Resolves the ambiguous "foo.Bar" syntax into a complete Reflection for the given owner
 * Reflection, or void if not available in this project.
 *
 * @param {typedocModels.Reflection} owner
 * @param {string} name
 * @return {typedocModels.Reflection|void}
 */
export function resolveLink(owner, name) {
  const idParts = name.split(/[^a-zA-Z0-9_]/g);

  /** @type {typedocModels.Reflection|undefined} */
  let r = owner;

  while (r) {
    /** @type {typedocModels.Reflection|undefined} */
    let cand = r;
    let i = 0;
    while (i < idParts.length && cand) {
      cand = cand?.getChildByName(idParts[i]);
      ++i;
    }
    if (cand) {
      return cand;
    }

    r = r.parent;
  }

  // Couldn't resolve this one.
  return undefined;
}


/**
 * Finds the closest parent Reflection that satisfies the caller.
 * 
 * @param {typedocModels.Reflection|void} reflection
 * @param {(cand: typedocModels.Reflection) => boolean} check
 * @return {typedocModels.Reflection|void}
 */
export function closest(reflection, check) {
  while (reflection) {
    if (check(reflection)) {
      return reflection;
    }
    reflection = reflection.parent;
  }
  return undefined;
}


/**
 * Generates the FQDN for this reflection.
 *
 * This is improved over TypeDoc's generation:
 *   - hides internal __call etc types
 *   - doesn't include the module/filename
 *
 * @param {typedocModels.Reflection} reflection
 * @return {string}
 */
export function fullName(reflection) {
  const rk = typedocModels.ReflectionKind;

  /** @type {typedocModels.Reflection|undefined} */
  let r = reflection;

  const parts = [];
  while (r && r.kind !== rk.Module) {
    const {parent} = r;

    // Insert "~" when this looks at the type or call bridge. This only happens when we record
    // the properties of a type or arguments to a function. Chrome's docs historically don't report
    // this information, instead only providing information on top-level types.
    if (r.name.startsWith('__')) {
      if (!knownMagicNames.includes(r.name)) {
        throw new Error(`unknown magic: ${r.name}, ${reflection.getFullName()}`);
      }
      if (parts.length && parts[0] !== '~') {
        parts.unshift('~');
      }
    } else {
      // If we have a node with a leading "_", see if there's a matching parent without it.
      // This solves our awkward approach to escaping, which exports e.g., the real type
      // "_debugger" under a friendly alias "debugger".
      if (/^_\w/.test(r.name)) {
        const checkName = r.name.slice(1);
        const check = r.parent?.getChildByName(checkName);
        r = check ?? r;
      }

      parts.unshift(r.name);
    }

    // If this is the _type_ of a CallSignature, then skip over it (duplicate name).
    if (
      r.kind === rk.CallSignature &&
      (parent?.kind === rk.Function || parent?.kind === rk.Method)
    ) {
      if (r.name !== parent.name) {
        throw new TypeError(
          `signature did not match function: ${r.name} vs ${parent.name}`
        );
      }
      r = parent.parent;
      continue;
    }

    r = r.parent;
  }

  // We insert `~` instead of magic names, but it ends up being displayed as `.~.`. Fix that and
  // use the property delimiter.
  return parts.join('.').replace(/\.~\./g, propertyDelimiter);
}

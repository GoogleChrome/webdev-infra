/*
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License t
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Helpers that tease out complex types from TypeDoc's representations.
 */


import * as typedocModels from 'typedoc/dist/lib/models/index.js';


/**
 * Finds an array type from the passed model type. This is required as we also infer restricted
 * array types from tuples, intersection and union types.
 *
 * @param {typedocModels.Type} type
 * @return {{
 *   min?: number,
 *   max?: number,
 *   elementType: typedocModels.Type,
 * }=}
 */
export function matchArrayType(type) {
  if (type.type === 'reflection') {
    const literal = matchTypeLiteral(type);
    if (literal?.properties && !literal.root) {
      if (!literal.properties['0']) {
        return;
      }
      const zeroType = literal.properties[0];
      const check = new Set(Object.keys(literal.properties));

      let i = 0;
      for (; `${i}` in literal.properties; ++i) {
        const key = `${i}`;
        const {type, optional} = literal.properties[key];
        if (optional || !type.equals(zeroType.type)) {
          return;
        }
        check.delete(key);
      }
      if (check.size) {
        return;
      }

      return {min: i, max: i, elementType: zeroType.type};
    }
  }

  if (type.type === 'array') {
    const arrayType = /** @type {typedocModels.ArrayType} */ (type);
    return {elementType: arrayType.elementType};
  }

  if (type.type === 'tuple') {
    const tupleType = /** @type {typedocModels.TupleType} */ (type);
    const [first, ...rest] = tupleType.elements;

    // We just support tuples of the same type. This is an array of fixed length.
    const invalid = rest.some(check => !check.equals(first));
    if (!first || invalid) {
      return;
    }

    const length = tupleType.elements.length;
    return {
      min: length,
      max: length,
      elementType: first,
    };
  }

  const isIntersection = (type.type === 'intersection');
  if (isIntersection || type.type === 'union') {
    const t = /** @type {typedocModels.IntersectionType|typedocModels.UnionType} */ (type);

    const firstArray = matchArrayType(t.types[0]);
    if (!firstArray) {
      return;
    }

    let min = firstArray.min ?? 0;
    let max = firstArray.max ?? Infinity;

    // Make sure all other types in this intersection are also arrays of the same elementType.
    // In reality, this will probably only ever be (A & B), but it could be more.
    for (let i = 1; i < t.types.length; ++i) {
      const restArray = matchArrayType(t.types[i]);
      if (!restArray || !restArray.elementType.equals(firstArray.elementType)) {
        return;
      }

      // TODO(samthor): This isn't right for a bunch of cases but we probably don't care right now.
      // For instance, `[T, T] & [T, T, T, T]` would also allow 3 elements, because the return type
      // doesn't support passing both around. (Perhaps an inner accumulator could be more correct?)
      if (isIntersection) {
        min = Math.max(min, restArray.min ?? 0);
        max = Math.max(max, restArray.max ?? Infinity);
      } else {
        min = Math.min(min, restArray.min ?? 0);
        max = Math.max(max, restArray.max ?? Infinity);
      }
    }

    const out = {
      elementType: firstArray.elementType,
    };
    if (min !== 0) {
      out.min = min;
    }
    if (max !== Infinity) {
      out.max = max;
    }
  
    return out;
  }
}


/**
 * Finds a type literal, possibly intersected with another initial root type.
 *
 * This is found inside {@link chrome.storage} as some type instances also have properties applied
 * to them.
 *
 * @param {typedocModels.Type} type
 * @return {{
 *   root?: typedocModels.Type,
 *   properties?: {[name: string]: {type: typedocModels.Type, optional?: boolean}},
 * }=}
 */
export function matchTypeLiteral(type) {
  if (type.type === 'reflection') {
    const reflectionType = /** @type {typedocModels.ReflectionType} */ (type);

    const declaration = reflectionType.declaration;
    if (declaration.kind !== typedocModels.ReflectionKind.TypeLiteral) {
      return;
    }

    /** @type {{[name: string]: {type: typedocModels.Type, optional?: boolean}}} */
    const properties = {};
    (declaration.children ?? []).forEach((child) => {
      if (!child.type) {
        throw new Error(`got TypeLiteral child with no type: ${child.name}`);
      }
      properties[child.name] = {type: child.type};
      if (child.flags.hasFlag(typedocModels.ReflectionFlag.Optional)) {
        properties[child.name].optional = true;
      }
    });
    return {properties};
  }

  if (type.type === 'intersection') {
    const t = /** @type {typedocModels.IntersectionType} */ (type);

    /** @type {{[name: string]: {type: typedocModels.Type, optional?: boolean}}} */
    const properties = {};
    let i = 0;

    const firstTypeLiteral = matchArrayType(t.types[0]);
    if (firstTypeLiteral === undefined) {
      // This is fine: we return the 0th type as the root.
      i = 1;
    }

    for (; i < t.types.length; ++i) {
      const restTypeLiteral = matchTypeLiteral(t.types[i]);
      if (!restTypeLiteral || restTypeLiteral.root || !restTypeLiteral.properties) {
        // We expect this to be of a certain shape: it has properties and no other type.
        return;
      }
      Object.assign(properties, restTypeLiteral.properties);
    }

    const out = {properties};
    if (firstTypeLiteral === undefined) {
      out.root = t.types[0];
    }
    return out;
  }
}

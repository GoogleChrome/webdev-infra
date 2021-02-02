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


import test from 'ava';
import {parse, typeOf} from './helper.js';
import {matchArrayType, matchTypeLiteral} from '../../../lib/types/intersection.js';


test('array types', t => {
  const project = parse(`
export type Foo = {0: number, 1: number} & number[];
export type FooInvalid = {0: number} & string[];
export type FooTuple = [number, number, number];
  `);

  const fooType = typeOf(project, 'Foo');
  const fooArray = matchArrayType(fooType);
  t.is(fooArray?.min, 2);
  t.is(fooArray?.max, undefined);
  t.truthy(fooArray?.elementType);

  const fooInvalidType = typeOf(project, 'FooInvalid');
  t.falsy(matchArrayType(fooInvalidType));

  const fooTupleType = typeOf(project, 'FooTuple');
  const fooTupleArray = matchArrayType(fooTupleType);
  t.is(fooTupleArray?.min, 3);
  t.is(fooTupleArray?.max, 3);
  t.truthy(fooTupleArray?.elementType);
});

test('type literal', t => {
  const project = parse(`
export var shared: Date & {
  hello?: number;
};
export type literalOnly = { foo: 123 };
export var solo: Date;
  `);

  const sharedType = typeOf(project, 'shared');
  const sharedLiteral = matchTypeLiteral(sharedType);
  t.truthy(sharedLiteral?.root);
  t.true(sharedLiteral?.properties?.['hello'].optional);

  const literalOnlyType = typeOf(project, 'literalOnly');
  const literalOnlyLiteral = matchTypeLiteral(literalOnlyType);
  t.falsy(literalOnlyLiteral?.root);
  t.truthy(literalOnlyLiteral?.properties?.['foo']);
  t.falsy(literalOnlyLiteral?.properties?.['foo'].optional);

  const soloType = typeOf(project, 'solo');
  t.falsy(matchArrayType(soloType), 'type without TypeLiteral is ignored');
});

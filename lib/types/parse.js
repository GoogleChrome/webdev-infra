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


import {LogLevel as TypeDocLogLevel} from 'typedoc/dist/lib/utils/index.js';
import * as typedocModels from 'typedoc/dist/lib/models/index.js';
import * as typedoc from 'typedoc';


/**
 * Generates the TypeDoc internal representation for the passed source. This invokes typedoc's
 * Application bundle and throws on failures.
 *
 * @param {string} sourceFile
 * @param {string[]} extraSources
 * @return {typedocModels.ProjectReflection}
 */
export function generateTypeDocObject(sourceFile, ...extraSources) {
  const entryPoints = [sourceFile, ...extraSources];

  const a = new typedoc.Application();
  a.bootstrap({
    entryPoints,

    logger(message, level) {
      switch (level) {
        case TypeDocLogLevel.Warn:
        case TypeDocLogLevel.Error:
          throw new Error(`could not convert types: ${message}`);
      }
    },
  });

  // TypeDoc complains if we don't set some options, even though it runs fine.
  a.options.setCompilerOptions(entryPoints, {
    emitDeclarationOnly: true,
    declaration: true,
  }, undefined);

  const reflection = a.convert();
  if (!reflection) {
    throw new Error(`could not parse: ${sourceFile}`);
  }
  return reflection;
}

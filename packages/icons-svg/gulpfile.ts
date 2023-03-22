import { series, parallel } from 'gulp';
import {
  clean,
  copy,
  generateIcons,
  generateEntry,
  generateInline
} from './tasks/creators';
import { generalConfig, remainFillConfig } from './plugins/svgo/presets';
import {
  assignAttrsAtTag,
  adjustViewBox,
  setDefaultColorAtPathTag
} from './plugins/svg2Definition/transforms';
import { readFileSync } from 'fs';
import { join, resolve } from 'path';
import { getIdentifier } from './utils';
import { IconDefinition } from './templates/types';
import { ExtractRegExp } from './tasks/creators/generateInline';
import fs from 'fs-extra'
import gulp from 'gulp'
import filter from 'gulp-filter'
import tap from 'gulp-tap'
//@ts-ignore
import flatMap from 'gulp-flatmap'
import File from 'vinyl';

const iconTemplate = readFileSync(
  resolve(__dirname, './templates/icon.ts.ejs'),
  'utf8'
);

const typeIndexTemplate = readFileSync(
  resolve(__dirname, './templates/typeIndex.ts.ejs'),
  'utf8'
);

const generateTasks = (type: string) => {
  const config = ["flatColor"].includes(type) ? remainFillConfig : generalConfig
  return series(
    generateIcons({
      from: [`svg/${type}/*.svg`],
      toDir: `src/asn/${type}`,
      svgoConfig: config,
      extraNodeTransformFactories: [
        assignAttrsAtTag('svg', { focusable: 'false' }),
      ],
      stringify: JSON.stringify,
      template: iconTemplate,
      mapToInterpolate: ({ name, content }) => ({
        identifier: getIdentifier({ name }),
        content
      }),
      filename: ({ name }) => getIdentifier({ name })
    }),
    generateEntry({
      entryName: `${type}.ts`,
      from: [`src/asn/${type}/*.ts`],
      toDir: `src/asn`,
      banner: '// This index.ts file is generated automatically.\n',
      template: typeIndexTemplate,
      mapToInterpolate: ({ name: identifier }) => ({
        identifier,
        path: `./${type}/${identifier}`
      })
    }),
    generateInline({
      from: [`src/asn/${type}/*.ts`],
      toDir: () => {
        return `inline-svg/${type}`
      },
      getIconDefinitionFromSource: (content: string): IconDefinition => {
        const extract = ExtractRegExp.exec(content);
        if (extract === null || !extract[1]) {
          throw new Error('Failed to parse raw icon definition: ' + content);
        }
        return new Function(`return ${extract[1]}`)() as IconDefinition;
      }
    }),
    generateEntry({
      entryName: `index.ts`,
      from: [`src/asn/*.ts`],
      toDir: `src`,
      banner: '// This index.ts file is generated automatically.\n',
      template: `export * as <%= name %> from '<%= path %>';`,
      mapToInterpolate: ({ name: identifier }) => ({
        identifier,
        path: `./asn/${identifier}`,
        name: identifier
      })
    }),
  )
}

export default series(
  clean(['src', 'inline-svg', 'es', 'lib']),
  parallel(
    copy({
      from: ['templates/*.ts'],
      toDir: 'src'
    }),
  ),
  generateTasks('antd'),
  generateTasks('bootstrap'),
  generateTasks('boxIcon'),
  generateTasks('circumIcon'),
  generateTasks('cssgg'),
  generateTasks('devIcon'),
  generateTasks('fa'),
  generateTasks('feather'),
  generateTasks('flatColor'),
  generateTasks('gameIcon'),
  generateTasks('hero'),
  generateTasks('icomoon'),
  generateTasks('mat'),
  generateTasks('octIcon'),
  generateTasks('radix'),
  generateTasks('remix'),
  generateTasks('simpleIcon'),
  generateTasks('simpleLine'),
  generateTasks('themify'),
  generateTasks('typIcon'),
  generateTasks('vs'),
  generateTasks('vts'),
  generateTasks('weather'),
)
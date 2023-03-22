import * as iconTypes from '@ui-vts/icons-svg/lib';
import { IconDefinition } from '@ui-vts/icons-svg/lib/types';
import { renderIconDefinitionToSVGElement } from '@ui-vts/icons-svg/lib/helpers';
import * as fs from 'fs-extra';
import { template, upperFirst, camelCase } from 'lodash';
import * as path from 'path';

interface IconDefinitionWithIdentifier extends IconDefinition {
  svgIdentifier: string;
}

function walk<T>(type: keyof typeof iconTypes, fn: (iconDef: IconDefinitionWithIdentifier) => Promise<T>) {
  return Promise.all(
    Object.keys(iconTypes[type]).map(svgIdentifier => {
      const iconDef = (iconTypes[type] as { [id: string]: IconDefinition })[
        svgIdentifier
      ];

      return fn({ svgIdentifier, ...iconDef });
    })
  );
}

async function generateIcons() {
  const iconsDir = path.join(__dirname, '../src/icons');
  const svgDir = path.join(__dirname, '../src/svg');
  const manifestFile = path.join(__dirname, '../src/manifest.ts');
  fs.rmdirSync(iconsDir, {recursive: true});
  fs.mkdirSync(iconsDir);
  fs.rmdirSync(svgDir, {recursive: true});
  fs.mkdirSync(svgDir);
  fs.removeSync(manifestFile)

  const manifestContent: {[k: string]: string[]} = {}

  Object.keys(iconTypes).forEach(async type => {
      const indexContent: string[] = [];
      const iconTypeDir = path.join(iconsDir, type);
      const svgTypeDir = path.join(svgDir, type);
      fs.mkdirSync(iconTypeDir);
      fs.mkdirSync(svgTypeDir);

      const staicFileRender = template(
        `
    import { IconDefinition } from '@ui-vts/icons-angular';

    export const <%= svgIdentifier %>: IconDefinition = {
        name: '<%= name %>',
        type: '<%= type %>',
        icon: '<%= inlineIcon %>'
    }`.trim()
      );

      const svgRender = template(`<%= inlineIcon %>`);

    // Disable jsonp render because of package size
    //   const jsonpRender = template(
    //     `
    // (function() {
    //   __ng_vts_icon_load({
    //       name: '<%= name %>',
    //       type: '<%= type %>',
    //       icon: '<%= inlineIcon %>'
    //   });
    // })()
    // `.trim()
    //   );

    await walk(type as keyof typeof iconTypes, async ({ svgIdentifier, name, icon }) => {
      const inlineIcon = renderIconDefinitionToSVGElement({ name, icon });

      // Generate static loading resources.
      fs.writeFileSync(
        path.resolve(__dirname, `../src/icons/${type}/${svgIdentifier}.ts`),
        staicFileRender({ svgIdentifier, name, inlineIcon, type })
      );

      fs.writeFileSync(
        path.resolve(__dirname, `../src/svg/${type}/${name}.svg`),
        svgRender({ inlineIcon })
      );

      // Disable jsonp render because of package size
      // fs.writeFileSync(
      //   path.resolve(__dirname, `../src/svg/${type}/${name}.js`),
      //   jsonpRender({ name, inlineIcon, type })
      // );

      indexContent.push(
        `export { ${svgIdentifier} } from './${svgIdentifier}';`
      );

      if (!manifestContent[type])
        manifestContent[type] = []
      manifestContent[type].push(`'${name}'`);
    });

    fs.writeFileSync(
      path.resolve(__dirname, `../src/icons/${type}/public_api.ts`),
      indexContent.join('\n')
    );

    fs.writeFileSync(
      path.resolve(__dirname, `../src/icons/${type}/ng-package.json`),
      `{
        "lib": {
          "entryFile": "public_api.ts"
        }
      }`  
    );
  })

  fs.writeFileSync(
    path.resolve(__dirname, `../src/icons/public_api.ts`),
    Object.keys(iconTypes).map(type => `export * as ${upperFirst(camelCase(`${type}-icons`))} from './${type}/public_api'`).join('\n')
  );

  fs.writeFileSync(
    path.resolve(__dirname, `../src/icons/ng-package.json`),
    `{
      "lib": {
        "entryFile": "public_api.ts"
      }
    }`  
  );

  const manifestRender = template(`
  import { Manifest } from './types';
    <%= content %>
  `);

  fs.writeFileSync(
    path.resolve(__dirname, `../src/manifest.ts`),
    manifestRender({
      content: 
        [
          ...Object.keys(manifestContent).map(k => `
            export const ${upperFirst(camelCase(`${k}-manifest`))}: Manifest = {
              icons: [${manifestContent[k].join(', ')}]
            }
          `),
          `export const IconTypes = [${Object.keys(manifestContent).map(k => `'${k}'`).join(', ')}]`,
          `export const AllManifests = {
            ${Object.keys(manifestContent).map(k => `${k}: ${upperFirst(camelCase(`${k}-manifest`))}`)}
          }`
        ].join('\n'),
    })
  );
}

generateIcons();

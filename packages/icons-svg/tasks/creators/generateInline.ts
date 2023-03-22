import { src, dest } from 'gulp';
import * as File from 'vinyl';
import { useRender } from '../../plugins';
import { IconDefinition } from '../../templates/types';
import { HelperRenderOptions } from '../../templates/helpers';

export interface GenerateInlineOptions {
  from: string[];
  toDir: (file: File) => string;
  getIconDefinitionFromSource: (raw: string) => IconDefinition;
  renderOptions?: HelperRenderOptions;
}

export const ExtractRegExp = /({\s*".*});/;

export const generateInline = ({
  from,
  toDir,
  getIconDefinitionFromSource,
  renderOptions = {}
}: GenerateInlineOptions) =>
  function GenerateInline() {
    return src(from)
      .pipe(
        useRender({
          getIconDefinitionFromSource,
          renderOptions
        })
      )
      .pipe(dest(toDir));
  };

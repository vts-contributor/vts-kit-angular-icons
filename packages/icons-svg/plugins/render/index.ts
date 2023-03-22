import { createTrasformStream } from '../creator';
import {
  renderIconDefinitionToSVGElement,
  HelperRenderOptions
} from '../../templates/helpers';
import { IconDefinition } from '../../templates/types';

export interface RenderOptions {
  getIconDefinitionFromSource: (raw: string) => IconDefinition;
  renderOptions: HelperRenderOptions;
}

export const useRender = ({
  getIconDefinitionFromSource,
  renderOptions
}: RenderOptions) =>
  createTrasformStream((content, file) => {
    const def = getIconDefinitionFromSource(content);
    file.extname = '.svg';
    file.stem = def.name;
    return renderIconDefinitionToSVGElement(def, renderOptions);
  });

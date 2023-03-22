import { isDevMode } from '@angular/core';

import { IconDefinition } from './types';

export const NG_VTS_ANGULAR_CONSOLE_PREFIX = '[@ui-vts/icons-angular]:';

export function error(message: string): void {
  console.error(`${NG_VTS_ANGULAR_CONSOLE_PREFIX} ${message}.`);
}

export function warn(message: string): void {
  if (isDevMode()) {
    console.warn(`${NG_VTS_ANGULAR_CONSOLE_PREFIX} ${message}.`);
  }
}

export function withSuffix(name: string, type: string | undefined): string {
  return type ? `${name}-${type}` : `${name}-`
}

export function alreadyHasASuffix(iconName: string): boolean {
  return /-(\w)$/.test(iconName)
}

export function isIconDefinition(target: string | IconDefinition): target is IconDefinition {
  return (
    typeof target === 'object' &&
    typeof target.name === 'string' &&
    typeof target.icon === 'string'
  );
}

/**
 * Get an `IconDefinition` object from abbreviation type, like `account-book-fill`.
 * @param str
 */
export function getIconDefinitionFromAbbr(str: string): IconDefinition {
  const arr = str.split('-');
  const type = arr.splice(arr.length - 1, 1)[0];
  const name = arr.join('-');

  return {
    name,
    type,
    icon: ''
  } as IconDefinition;
}

export function cloneSVG(svg: SVGElement): SVGElement {
  return svg.cloneNode(true) as SVGElement;
}

/**
 * Split a name into a tuple like [ name, type ].
 */
export function getNameAndType(iconName: string): [string, string] {
  const split = iconName.split(':');
  switch (split.length) {
    case 1: return [iconName, ''];
    case 2: return [split[0], split[1]];
    default: throw new Error(`${NG_VTS_ANGULAR_CONSOLE_PREFIX}The icon ${iconName} is not valid!`);
  }
}

export function hasType(iconName: string): boolean {
  return getNameAndType(iconName)[1] !== '';
}

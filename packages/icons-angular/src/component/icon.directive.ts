import {
  Directive,
  ElementRef,
  Input,
  OnChanges,
  Renderer2,
  SimpleChanges
} from '@angular/core';
import { IconDefinition } from '../types';
import { alreadyHasASuffix, getNameAndType, isIconDefinition, warn, withSuffix } from '../utils';
import { IconService } from './icon.service';

interface RenderMeta {
  iconName: string | IconDefinition;
}

function checkMeta(prev: RenderMeta, after: RenderMeta): boolean {
  return prev.iconName === after.iconName;
}

@Directive({
  selector: '[vtsIcon]'
})
export class IconDirective implements OnChanges {
  @Input() iconName: string | IconDefinition;

  constructor(protected _iconService: IconService, protected _elementRef: ElementRef, protected _renderer: Renderer2) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.iconName) {
      this._changeIcon();
    }
  }

  /**
   * Render a new icon in the current element. Remove the icon when `type` is falsy.
   */
  protected _changeIcon(): Promise<SVGElement | null> {
    return new Promise<SVGElement | null>(resolve => {
      if (!this.iconName) {
        this._clearSVGElement();
        resolve(null);
      } else {
        const preMeta = this._getSelfRenderMeta();
        this._iconService.getRenderedContent(
          this._parseIcon(this.iconName),
        ).subscribe(svg => {
          if (checkMeta(preMeta, this._getSelfRenderMeta())) {
            this._setSVGElement(svg);
            resolve(svg);
          } else {
            resolve(null);
          }
        });
      }
    });
  }

  protected _getSelfRenderMeta(): RenderMeta {
    return {
      iconName: this.iconName,
    };
  }

  /**
   * Parse a icon to the standard form, an `IconDefinition` or a string like 'account-book-fill` (with a theme suffixed).
   * If namespace is specified, ignore theme because it meaningless for users' icons.
   */
  protected _parseIcon(iconName: string | IconDefinition): IconDefinition | string {
    if (isIconDefinition(iconName)) {
      return iconName;
    } else {
      const [ name, type ] = getNameAndType(iconName);
      if (type) {
        return withSuffix(name, type)
      }
      return name
    }
  }

  protected _setSVGElement(svg: SVGElement): void {
    this._clearSVGElement();
    this._renderer.appendChild(this._elementRef.nativeElement, svg);
  }

  protected _clearSVGElement(): void {
    const el: HTMLElement = this._elementRef.nativeElement;
    const children = el.childNodes;
    const length = children.length;
    for (let i = length - 1; i >= 0; i--) {
      const child = children[ i ] as any;
      if (child.tagName?.toLowerCase() === 'svg') {
        this._renderer.removeChild(el, child);
      }
    }
  }
}

import { DOCUMENT } from '@angular/common';
import { HttpBackend, HttpClient } from '@angular/common/http';
import { Inject, Injectable, Optional, Renderer2, RendererFactory2, SecurityContext } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { of as rxof, Observable, Subject } from 'rxjs';
import {
  catchError,
  filter,
  finalize,
  map,
  share,
  take,
  tap
} from 'rxjs/operators';
import {
  CachedIconDefinition,
  IconDefinition,
} from '../types';
import {
  cloneSVG,
  getIconDefinitionFromAbbr,
  getNameAndType,
  isIconDefinition,
  warn,
  withSuffix,
} from '../utils';
import {
  DynamicLoadingTimeoutError,
  HttpModuleNotImport,
  IconNotFoundError,
  NameSpaceIsNotSpecifyError,
  SVGTagNotFoundError,
  UrlNotSafeError
} from './icon.error';

@Injectable()
export class IconService {
  protected _renderer: Renderer2;
  protected _http: HttpClient;

  /**
   * All icon definitions would be registered here.
   */
  protected readonly _svgDefinitions = new Map<string, IconDefinition>();

  /**
   * Cache all rendered icons. Icons are identified by name, type,
   * and for twotone icons, primary color and secondary color.
   */
  protected readonly _svgRenderedDefinitions = new Map<string, CachedIconDefinition>();

  protected _inProgressFetches = new Map<
    string,
    Observable<IconDefinition | null>
  >();

  /**
   * Url prefix for fetching inline SVG by dynamic importing.
   */
  protected _assetsUrlRoot = '';

  constructor(
    protected _rendererFactory: RendererFactory2,
    @Optional() protected _handler: HttpBackend,
    // tslint:disable-next-line:no-any
    @Optional() @Inject(DOCUMENT) protected _document: any,
    protected sanitizer: DomSanitizer
  ) {
    this._renderer = this._rendererFactory.createRenderer(null, null);
    if (this._handler) {
      this._http = new HttpClient(this._handler);
    }
  }

  /**
   * Change the prefix of the inline svg resources, so they could be deployed elsewhere, like CDN.
   * @param prefix
   */
  changeAssetsSource(prefix: string): void {
    this._assetsUrlRoot = prefix.endsWith('/') ? prefix : prefix + '/';
  }

  /**
   * Add icons by IconDefinition
   */
  addIcon(...icons: IconDefinition[]): void {
    icons.forEach(icon => {
      this._svgDefinitions.set(withSuffix(icon.name, icon.type), icon);
    });
  }

  /**
   * Add icons by Name and Content
   */
  addIconLiteral(iconName: string, content: string): void {
    const [name, type] = getNameAndType(iconName);
    if (!type) {
      throw NameSpaceIsNotSpecifyError();
    }
    this.addIcon({ name, type, icon: content });
  }

  /**
   * Remove all cache.
   */
   protected clear(): void {
    this._svgDefinitions.clear();
    this._svgRenderedDefinitions.clear();
  }

  /**
   * Get a rendered `SVGElement`.
   * @param icon
   */
  getRenderedContent(
    icon: IconDefinition | string,
  ): Observable<SVGElement> {
    // If `icon` is a `IconDefinition`, go to the next step. If not, try to fetch it from cache.
    const definitionOrNull: IconDefinition | null = isIconDefinition(icon)
      ? (icon as IconDefinition)
      : this._svgDefinitions.get(icon) || null;

    // If `icon` is a `IconDefinition` of successfully fetch, wrap it in an `Observable`.
    // Otherwise try to fetch it from remote.
    const $iconDefinition = definitionOrNull
      ? rxof(definitionOrNull)
      : this._loadIconDynamically(icon as string);

    // If finally get an `IconDefinition`, render and return it. Otherwise throw an error.
    return $iconDefinition.pipe(
      map(i => {
        if (!i) {
          throw IconNotFoundError(icon as string);
        }
        return this._loadSVGFromCacheOrCreateNew(i);
      })
    );
  }

  protected getCachedIcons(): Map<string, IconDefinition> {
    return this._svgDefinitions;
  }

  /**
   * Get raw svg and assemble a `IconDefinition` object.
   * @param type
   */
  protected _loadIconDynamically(
    iconName: string
  ): Observable<IconDefinition | null> {
    // If developer doesn't provide HTTP module, just throw an error.
    if (!this._http) {
      return rxof(HttpModuleNotImport());
    }

    // If multi directive ask for the same icon at the same time,
    // request should only be fired once.
    let inProgress = this._inProgressFetches.get(iconName);

    if (!inProgress) {
      const [name, type] = getNameAndType(iconName);

      // If the string has a type within, create a simple `IconDefinition`.
      const icon: IconDefinition = type
        ? { name, type, icon: '' }
        : getIconDefinitionFromAbbr(name);

      const key = type ? withSuffix(type, name) : withSuffix(icon.type, icon.name)
      const suffix = '.svg'
      const url =
        (type
          ? `${this._assetsUrlRoot}assets/${type}/${name}`
          : `${this._assetsUrlRoot}assets/${icon.type}/${icon.name}`) + suffix;

      const safeUrl = this.sanitizer.sanitize(SecurityContext.URL, url);

      if (!safeUrl) {
        throw UrlNotSafeError(url);
      }

      const source = this._http
      .get(safeUrl, { responseType: 'text' })
      .pipe(map(literal => ({ ...icon, icon: literal })))

      inProgress = source.pipe(
        tap(definition => this.addIcon(definition)),
        finalize(() => this._inProgressFetches.delete(key)),
        catchError((e) => {
          console.warn(e)
          return rxof(null)
        }),
        share()
      );

      this._inProgressFetches.set(key, inProgress);
    }

    return inProgress;
  }

  /**
   * Render a new `SVGElement` for a given `IconDefinition`, or make a copy from cache.
   * @param icon
   */
  protected _loadSVGFromCacheOrCreateNew(
    icon: IconDefinition,
  ): SVGElement {
    let svg: SVGElement;
    const key = withSuffix(icon.name, icon.type);

    // Try to make a copy from cache.
    const cached = this._svgRenderedDefinitions.get(key);

    if (cached) {
      svg = cached.icon;
    } else {
      svg = this._setSVGAttribute(
        this._colorizeSVGIcon(
          // Icons provided should be refined to remove preset colors.
          this._createSVGElementFromString(icon.icon)
        )
      );
      // Cache it.
      this._svgRenderedDefinitions.set(key, {
        ...icon,
        icon: svg
      } as CachedIconDefinition);
    }

    return cloneSVG(svg);
  }

  protected _createSVGElementFromString(str: string): SVGElement {
    const div = this._document.createElement('div');
    div.innerHTML = str;
    const svg: SVGElement = div.querySelector('svg');
    if (!svg) {
      throw SVGTagNotFoundError;
    }
    return svg;
  }

  protected _setSVGAttribute(svg: SVGElement): SVGElement {
    this._renderer.setAttribute(svg, 'width', '1em');
    this._renderer.setAttribute(svg, 'height', '1em');
    return svg;
  }

  protected _colorizeSVGIcon(
    svg: SVGElement
  ): SVGElement {
    this._renderer.setAttribute(svg, 'fill', 'currentColor');
    return svg;
  }
}

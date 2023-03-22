export interface IconDefinition {
  name: string; // Name of icon
  type: string; // Type of library (vts, antd)
  icon: string; // Cache svg
}

export interface Manifest {
  icons: string[];
}

export interface CachedIconDefinition {
  name: string;
  type: string;
  icon: SVGElement;
}
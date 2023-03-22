export interface AbstractNode {
  tag: string;
  attrs: {
    [key: string]: string | undefined;
  };
  children?: AbstractNode[];
}

export interface IconDefinition {
  name: string;
  icon: AbstractNode
}
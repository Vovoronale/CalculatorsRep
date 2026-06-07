export type PrimitiveValue = string | number | boolean | null;
export type ParamValue = PrimitiveValue | ParamMap | ParamValue[];
export interface ParamMap extends Record<string, ParamValue> {}

export interface AnchorPoint {
  x: number;
  y: number;
}

export type AnchorMap = Record<string, AnchorPoint>;

export type DisplayMode = "simple" | "detailed" | "debug";

export interface SvgNode {
  tag: string;
  attrs?: Record<string, string | number | boolean | undefined>;
  children?: Array<SvgNode | string>;
}

export interface SceneDefinition {
  vars?: ParamMap;
  scene: {
    width: number;
    height: number;
    viewBox?: [number, number, number, number];
    mode?: DisplayMode;
  };
  objects: Record<string, ObjectDefinition>;
}

export interface ObjectDefinition {
  type: string;
  params?: ParamMap;
  style?: ParamMap;
}

export interface ResolvedObject {
  id: string;
  type: string;
  params: ParamMap;
  style: ParamMap;
  anchors: AnchorMap;
  children: ParametricObject[];
  node: SvgNode;
}

export interface BuildContext {
  mode: DisplayMode;
  vars: ParamMap;
  objects: Record<string, ResolvedObject>;
}

export interface ParametricObject {
  id: string;
  type: string;
  params: ParamMap;
  style: ParamMap;
  anchors: AnchorMap;
  children: ParametricObject[];
  build(context: BuildContext): ResolvedObject;
}

export interface ObjectFactory {
  create(id: string, definition: ObjectDefinition): ParametricObject;
}

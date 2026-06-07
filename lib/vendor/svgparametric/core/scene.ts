import { SvgParametricError } from "./errors";
import { extractExpressionDependencies, resolveParamMap } from "./expressions";
import type { ObjectRegistry } from "./registry";
import { renderSvgDocument } from "./svg";
import type { ParamMap, ResolvedObject, SceneDefinition } from "./types";

export interface BuiltScene {
  objects: Record<string, ResolvedObject>;
  order: string[];
  svg: string;
}

export function buildScene(definition: SceneDefinition, registry: ObjectRegistry): BuiltScene {
  const order = sortObjects(definition);
  const objects: Record<string, ResolvedObject> = {};

  for (const id of order) {
    const raw = definition.objects[id];
    const context = { vars: definition.vars ?? {}, objects };
    const resolvedParams = resolveParamMap(raw.params ?? {}, context, `objects.${id}.params`);
    const resolvedStyle = resolveParamMap(raw.style ?? {}, context, `objects.${id}.style`);
    const object = registry.create(id, { ...raw, params: resolvedParams, style: resolvedStyle });
    const built = object.build({
      mode: definition.scene.mode ?? "simple",
      vars: definition.vars ?? {},
      objects
    });

    objects[id] = built;
  }

  const svg = renderSvgDocument(definition.scene, order.map((id) => objects[id].node));
  return { objects, order, svg };
}

export function sortObjects(definition: SceneDefinition): string[] {
  const ids = Object.keys(definition.objects);
  const dependencies = new Map<string, string[]>();

  for (const id of ids) {
    const raw = definition.objects[id];
    const params = raw.params ?? {};
    const style = raw.style ?? {};
    const refs = [...new Set([...dependenciesIn(params), ...dependenciesIn(style)])].filter((ref) => ref !== id);

    for (const ref of refs) {
      if (!definition.objects[ref]) {
        throw new SvgParametricError(`Missing object reference: ${ref}`, { objectId: id });
      }
    }

    dependencies.set(id, refs);
  }

  const result: string[] = [];
  const visiting = new Set<string>();
  const visited = new Set<string>();

  const visit = (id: string): void => {
    if (visited.has(id)) return;

    if (visiting.has(id)) {
      throw new SvgParametricError(`Circular object dependency involving: ${[...visiting, id].join(" -> ")}`);
    }

    visiting.add(id);
    for (const dep of dependencies.get(id) ?? []) visit(dep);
    visiting.delete(id);
    visited.add(id);
    result.push(id);
  };

  for (const id of ids) visit(id);
  return result;
}

function dependenciesIn(params: ParamMap): string[] {
  return extractExpressionDependencies(params);
}

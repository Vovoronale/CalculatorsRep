import { SvgParametricError } from "./errors";
import type { ObjectDefinition, ParametricObject } from "./types";

export type ObjectConstructor = new (id: string, definition: ObjectDefinition) => ParametricObject;

export class ObjectRegistry {
  private readonly constructors = new Map<string, ObjectConstructor>();

  register(type: string, constructor: ObjectConstructor): this {
    this.constructors.set(type, constructor);
    return this;
  }

  create(id: string, definition: ObjectDefinition): ParametricObject {
    const constructor = this.constructors.get(definition.type);

    if (!constructor) {
      throw new SvgParametricError(`Unknown object type: ${definition.type}`, { objectId: id });
    }

    return new constructor(id, definition);
  }
}

import { ObjectRegistry } from "../core/registry";
import { Callout, Dimension, DistributedLoad } from "./annotations";
import { Foundation } from "./foundation";
import { Group, Line, Point, RectBlock, TextLabel } from "./primitives";
import { ReinforcedConcreteSection } from "./reinforcedConcreteSection";

export function createDefaultRegistry(): ObjectRegistry {
  return new ObjectRegistry()
    .register("Group", Group)
    .register("RectBlock", RectBlock)
    .register("Line", Line)
    .register("Point", Point)
    .register("TextLabel", TextLabel)
    .register("Dimension", Dimension)
    .register("Callout", Callout)
    .register("DistributedLoad", DistributedLoad)
    .register("Foundation", Foundation)
    .register("ReinforcedConcreteSection", ReinforcedConcreteSection);
}

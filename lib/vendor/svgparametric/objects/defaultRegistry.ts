import { ObjectRegistry } from "../core/registry";
import { BreakLine, Callout, Dimension, DistributedLoad } from "./annotations";
import { BasementFoundation } from "./basementFoundation";
import { Foundation } from "./foundation";
import { LoadedFoundation } from "./loadedFoundation";
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
    .register("BreakLine", BreakLine)
    .register("DistributedLoad", DistributedLoad)
    .register("Foundation", Foundation)
    .register("BasementFoundation", BasementFoundation)
    .register("LoadedFoundation", LoadedFoundation)
    .register("ReinforcedConcreteSection", ReinforcedConcreteSection);
}

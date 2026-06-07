export class SvgParametricError extends Error {
  constructor(
    message: string,
    public readonly details: { objectId?: string; path?: string } = {}
  ) {
    super(message);
    this.name = "SvgParametricError";
  }
}

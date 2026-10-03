export function cardStops(offsets: number[], maxScroll: number): number[] {
  const stops = [0];
  for (const offset of offsets) {
    const position = Math.max(0, Math.min(offset, maxScroll));
    if (position - stops[stops.length - 1] > 1) stops.push(position);
  }
  return stops;
}

export function nearestStop(stops: number[], position: number): number {
  return stops.reduce((best, stop, index) =>
    Math.abs(stop - position) < Math.abs(stops[best] - position) ? index : best, 0);
}

import { Point } from "@/data/Point";

export default function AppGraphEdge({
  src,
  dst
}: {
  src: Point
  dst: Point
}) {
  return (
    <line stroke='red' strokeWidth={1} x1={src.x} y1={src.y} x2={dst.x} y2={dst.y} />
  )
}
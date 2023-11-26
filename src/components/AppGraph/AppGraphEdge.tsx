import { Point } from "@/data/Point";

export default function AppGraphEdge({
  src,
  dst
}: {
  src: Point
  dst: Point
}) {

  const off = Math.sqrt(Math.pow(src.x - dst.x, 2) + Math.pow(src.y - dst.y, 2)) * 0.4

  const d = () => [
    `M ${src.x}, ${src.y}`,
    `C ${src.x + off}, ${src.y}`,
    `${dst.x - off}, ${dst.y}`,
    `${dst.x}, ${dst.y}`
  ].join(' ')

  return (
    <path stroke='white' strokeWidth={2} strokeDasharray='4 0 0' d={d()} fill="transparent" />
  )
}
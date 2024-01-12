import { AudioGraph, NodeBuilderFunc } from "@/lib/audio_graph/AudioGraph"
import { useEffect, useRef, useState } from "react"

export function useAudioGraph(nodeBuilders: Record<string, NodeBuilderFunc>) {

  const audioGraph = useRef(new AudioGraph(
    nodeBuilders
  ))
  
  const [initialized, setInitialized] = useState(false)
  const initAudioGraph = () => {
    audioGraph.current.init()
    setInitialized(true)
  }

  useEffect(() => {
    window.addEventListener('click', initAudioGraph)
    return () => window.removeEventListener('click', initAudioGraph)
  }, [])

  return [audioGraph, initialized] as [React.MutableRefObject<AudioGraph>, boolean]
}

import { MidiLearnResult } from "@/lib/midi/learn"
import './MidiLearnButton.scss'

export default function MidiLearnButton({
  learning,
  start,
  cancel,
  onLearned
}: {
  learning: boolean
  start: (onLearned: (result: MidiLearnResult) => void) => void
  cancel: () => void
  onLearned: (result: MidiLearnResult) => void
}) {
  return (
    <>
      <button
        className="midi-learn-button"
        title="MIDI learn"
        onClick={() => start(onLearned)}
      >
        <svg viewBox="0 0 24 24" width="20" height="20">
          <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="12" cy="6.5" r="1.15" fill="currentColor" />
          <circle cx="7" cy="9.8" r="1.15" fill="currentColor" />
          <circle cx="17" cy="9.8" r="1.15" fill="currentColor" />
          <circle cx="8.8" cy="15.5" r="1.15" fill="currentColor" />
          <circle cx="15.2" cy="15.5" r="1.15" fill="currentColor" />
        </svg>
      </button>

      {learning &&
        <div className="midi-learn-modal">
          <div className="midi-learn-modal__box">
            <p className="midi-learn-modal__title">Learning MIDI&hellip;</p>
            <p>Wiggle a control on your MIDI device</p>
            <button onClick={cancel}>Cancel</button>
          </div>
        </div>
      }
    </>
  )
}

import { Link } from "react-router-dom"
import './HelpButton.scss'

export default function HelpButton() {
  return (
    <Link className="help-button" to="/graph/docs" title="Help">?</Link>
  )
}

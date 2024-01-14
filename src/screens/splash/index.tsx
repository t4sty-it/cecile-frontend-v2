import { NavLink } from 'react-router-dom'
import './splash-page.scss'

export default function SplashPage() {

  return (
    <div className="page splash-page">
      <NavLink to='/graph'>
        <h1 className="splash-page__title">Cécile 2.0</h1>
        <div className='splash-page__cta'>Click to start</div>
      </NavLink>
    </div>
  )
}
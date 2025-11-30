import { HashRouter, Routes, Route } from 'react-router-dom'
import Player from './Player'
import Config from './Config'

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Player />} />
        <Route path="/config" element={<Config />} />
      </Routes>
    </HashRouter>
  )
}

export default App

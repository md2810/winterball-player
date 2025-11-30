import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Player from './Player'
import Config from './Config'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Player />} />
        <Route path="/config" element={<Config />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

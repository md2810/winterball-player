import { HashRouter, Routes, Route } from 'react-router-dom'
import Home from './Home'
import Config from './Config'

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/config" element={<Config />} />
      </Routes>
    </HashRouter>
  )
}

export default App

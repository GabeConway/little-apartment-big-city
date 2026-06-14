import ReactDOM from 'react-dom/client';
import LittleApartmentGame from './game/LittleApartmentGame';
import './index.css';

// Standalone entry: boot straight to the game's title screen.
// No StrictMode — the game runs a fixed-step rAF loop + persistent Audio refs;
// double-invoked effects would double up audio/loops.
ReactDOM.createRoot(document.getElementById('root')!).render(<LittleApartmentGame />);

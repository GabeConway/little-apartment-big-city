import ReactDOM from 'react-dom/client';
import LittleApartmentGame from './game/LittleApartmentGame';
import { initTauriGamepad } from './tauri-gamepad';
import './index.css';

// Native gamepad bridge for the Tauri desktop shell (no-op in a plain browser).
initTauriGamepad();

// Standalone entry: boot straight to the game's title screen.
// No StrictMode — the game runs a fixed-step rAF loop + persistent Audio refs;
// double-invoked effects would double up audio/loops.
ReactDOM.createRoot(document.getElementById('root')!).render(<LittleApartmentGame />);

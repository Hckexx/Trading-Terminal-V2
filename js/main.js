import { calculatePosition } from './calculator.js';
import { updateUI } from './ui.js';
import { saveState, loadState } from './storage.js';

const init = () => {
    // 1. Load Initial State
    const saved = loadState();
    
    // 2. Event Listeners for Real-time Calculation
    const inputs = document.querySelectorAll('input, select');
    inputs.forEach(input => {
        input.addEventListener('input', () => {
            const data = gatherInputs();
            const results = calculatePosition(data);
            updateUI(results);
            saveState(data);
        });
    });
};

function gatherInputs() {
    return {
        balance: parseFloat(document.getElementById('acc-balance').value) || 0,
        entry: parseFloat(document.getElementById('calc-entry').value) || 0,
        sl: parseFloat(document.getElementById('calc-sl').value) || 0,
        tp: parseFloat(document.getElementById('calc-tp').value) || 0,
        riskPct: parseFloat(document.getElementById('calc-risk-pct').value) || 0,
        direction: document.getElementById('calc-direction').value
    };
}

document.addEventListener('DOMContentLoaded', init);

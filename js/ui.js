export function updateUI(results) {
    const container = document.getElementById('calc-results');
    
    if (results.error) {
        container.innerHTML = `<p style="color: var(--danger)">${results.error}</p>`;
        return;
    }

    container.innerHTML = `
        <div class="stat">
            <label>Recommended Lot</label>
            <h3>${results.lotSize}</h3>
        </div>
        <div class="stat">
            <label>Risk Amount</label>
            <h3>$${results.riskAmount}</h3>
        </div>
        <div class="stat">
            <label>R:R Ratio</label>
            <h3>1 : ${results.rr}</h3>
        </div>
    `;
}

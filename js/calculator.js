export function calculatePosition(data) {
    const { balance, entry, sl, tp, riskPct, direction } = data;

    // Safety check: Avoid division by zero
    if (entry === sl || entry === 0 || balance === 0) {
        return { error: "Invalid Price/Balance" };
    }

    const riskAmount = balance * (riskPct / 100);
    const priceDiff = Math.abs(entry - sl);
    
    // Simple Position Size Calculation (Risk Amount / Points)
    // Note: In real app, adjust based on instrument pip value
    const positionSize = priceDiff !== 0 ? (riskAmount / priceDiff) : 0;
    
    // RR Calculation
    const reward = Math.abs(tp - entry);
    const rr = tp !== 0 ? (reward / priceDiff).toFixed(2) : "-";

    return {
        lotSize: positionSize.toFixed(2),
        riskAmount: riskAmount.toFixed(2),
        rr: rr,
        isValid: true
    };
}

// Validation Logic to prevent bad trades
export function validateTrade(entry, sl, tp, direction) {
    if (direction === 'buy') {
        return sl < entry; // SL must be below entry for Buy
    }
    if (direction === 'sell') {
        return sl > entry; // SL must be above entry for Sell
    }
    return true;
}

export function saveState(data) {
    localStorage.setItem('tradeTerminal_config', JSON.stringify(data));
}

export function loadState() {
    const data = localStorage.getItem('tradeTerminal_config');
    return data ? JSON.parse(data) : {};
}

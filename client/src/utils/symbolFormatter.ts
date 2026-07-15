export default function symbolFormatter(num?: number, digits: number = 1) {
  if (!num && num !== 0) return "";
  const lookup = [
    { value: 1, symbol: "" },
    { value: 1e3, symbol: "k" },
    { value: 1e6, symbol: "M" },
    { value: 1e9, symbol: "G" },
    { value: 1e12, symbol: "T" },
    { value: 1e15, symbol: "P" },
    { value: 1e18, symbol: "E" },
  ];
  const item = [...lookup].reverse().find((item) => num >= item.value);
  return item
    ? (num / item.value)
        .toFixed(digits)
        .replace(/\.0+$|(\.[0-9]*[1-9])0+$/, "$1") + item.symbol
    : "0";
}

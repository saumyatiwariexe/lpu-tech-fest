const shapes = [
  '<path d="m22 65 28-46 28 46-28 14zM50 19v60M22 65l28-12 28 12"/>',
  '<path d="m50 16 27 15-5 36-22 15-22-15-5-36zM23 31l27 15 27-15M50 46v36M36 41l-6 16m34-16 6 16"/>',
  '<path d="m50 14 31 36-31 36-31-36zM19 50h62M50 14 37 50l13 36 13-36z"/>',
  '<path d="m50 15 32 53H18zM50 15v53m-32 0 32-19 32 19M50 49l12-15"/>',
  '<path d="m50 12 7 28 24 10-24 8-7 30-8-30-23-8 23-10zM50 12v76M19 50h62"/>',
];
export function mark(i: number) {
  const id = "metal" + i;
  const bowl = [
    "M25 31Q25 58 42 64L50 69 58 64Q75 58 75 31Z",
    "M30 26 70 26 67 55 50 69 33 55Z",
    "M50 16 72 39 62 58 50 68 38 58 28 39Z",
    "M50 18 77 56 54 68 46 68 23 56Z",
    "M50 13 58 33 72 39 62 49 56 65 44 65 38 49 28 39 42 33Z",
  ][i];
  const handles =
    i === 0
      ? '<path d="M27 35H15Q13 56 35 56M73 35h12Q87 56 65 56" fill="none" stroke-width="3"/>'
      : "";
  return (
    '<svg aria-hidden="true" viewBox="0 0 100 100" stroke="#d5b471" stroke-width=".9"><defs><linearGradient id="' +
    id +
    '"><stop stop-color="#654a29"/><stop offset=".22" stop-color="#d6b678"/><stop offset=".47" stop-color="#5b482e"/><stop offset=".72" stop-color="#f0d59d"/><stop offset="1" stop-color="#8c6940"/></linearGradient></defs><circle cx="50" cy="47" r="36" fill="none" stroke-opacity=".19" stroke-dasharray="1 3"/>' +
    handles +
    '<g fill="url(#' +
    id +
    ')"><path d="' +
    bowl +
    '"/><path d="M47 66h6v9l6 4H41l6-4zM38 80h24v3H38zM35 84h30l4 4H31z"/></g><g fill="none" stroke="#fff0c8" stroke-width="2" opacity=".87" transform="translate(29 25) scale(.42)">' +
    shapes[i] +
    "</g></svg>"
  );
}
export function compass() {
  let ticks = "";
  for (let i = 0; i < 40; i++)
    ticks +=
      '<path d="M50 6v' +
      (i % 5 === 0 ? 7 : 3) +
      '" transform="rotate(' +
      i * 9 +
      ' 50 50)"/>';
  return (
    '<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" aria-hidden="true"><circle cx="50" cy="50" r="36" stroke-opacity=".45"/>' +
    ticks +
    '<path d="m50 18 6 26 23 6-23 6-6 26-6-26-23-6 23-6z"/><path d="m50 18 0 32-6-6zM79 50 50 50l6-6zM50 82V50l6 6zM21 50h29l-6 6z" fill="currentColor"/></svg>'
  );
}

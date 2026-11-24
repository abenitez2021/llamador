'use strict';

// Únicamente los BTN son eventos de negocio. STATE, OUT, INPUT y READY
// son telemetría y jamás deben registrar llamados.
function parseButtonEvent(line) {
  const match = /^BTN;([1-8]);D(3[0-7])$/.exec(String(line).trim());
  if (!match) return null;
  const box = Number(match[1]);
  const pin = Number(match[2]);
  if (pin !== box + 29) return null;
  return { box, pin };
}

module.exports = { parseButtonEvent };

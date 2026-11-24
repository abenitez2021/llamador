'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { parseButtonEvent } = require('./protocol');

test('reconoce las ocho entradas y la séptima instalada', () => {
  for (let box = 1; box <= 8; box++) {
    assert.deepEqual(parseButtonEvent(`BTN;${box};D${box + 29}\r`), { box, pin: box + 29 });
  }
});
test('ignora estados y salidas y evita falsos llamados', () => {
  for (const line of ['STATE;3;D32;LOW', 'OUT;3;D40;ON', 'OUT;3;D40;OFF', 'INPUT;3;D32;HIGH', 'READY;ENTER_PLC;1.1', 'BTN;3;D33', 'BTN;0;D29', 'BTN;9;D38', 'BTN;3;D32;LOW']) {
    assert.equal(parseButtonEvent(line), null, line);
  }
});

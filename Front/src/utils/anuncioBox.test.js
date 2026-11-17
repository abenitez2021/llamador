// CANOSYS: valida la locución bilingüe BOX X en español y luego en inglés.
import { anunciarBox } from './anuncioBox';

describe('anuncio de box libre', () => {
  test('pronuncia BOX y el número en una sola emisión', async () => {
    jest.useFakeTimers();
    const audio = { play: jest.fn().mockResolvedValue(), pause: jest.fn(), load: jest.fn() };
    window.Audio = jest.fn(() => audio);
    const voces = [
      { name: 'Microsoft Laura', lang: 'es-ES' },
      { name: 'Microsoft Zira', lang: 'en-US' },
    ];
    const sintesis = { speak: jest.fn(), cancel: jest.fn(), getVoices: () => voces };
    window.speechSynthesis = sintesis;
    window.SpeechSynthesisUtterance = function (text) { this.text = text; };
    const anuncio = anunciarBox({ id: 3, nombre: 'BOX 3' });
    // CANOSYS: valida la ruta estable que el operador podrá reemplazar manualmente.
    expect(window.Audio).toHaveBeenCalledWith('/sonidos/sonido.mp3');
    audio.oncanplay();
    expect(audio.load).toHaveBeenCalled();
    expect(audio.play).toHaveBeenCalled();
    jest.advanceTimersByTime(2200);
    const mensaje = sintesis.speak.mock.calls[0][0];
    expect(mensaje.text).toBe('BOX 3');
    expect(mensaje.voice).toBe(voces[0]);
    expect(mensaje.rate).toBe(0.5);
    mensaje.onend();
    expect(sintesis.speak).toHaveBeenCalledTimes(2);
    const ingles = sintesis.speak.mock.calls[1][0];
    expect(ingles.text).toBe('BOX 3');
    expect(ingles.voice).toBe(voces[1]);
    expect(ingles.lang).toBe('en-US');
    ingles.onend();
    await anuncio.finished;
    jest.useRealTimers();
  });
});

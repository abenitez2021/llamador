// CANOSYS: reproduce el timbre y anuncia BOX X con Laura a velocidad pausada.
export function anunciarBox(box) {
  // CANOSYS: código anterior conservado; el timbre usaba un nombre específico de la entrega.
  // const audio = new Audio('/sonidos/timbre-box-libre.mp3');
  // CANOSYS: usa un nombre estable para permitir reemplazar el timbre sin tocar código.
  const audio = new Audio('/sonidos/sonido.mp3');
  const sintesis = window.speechSynthesis;
  let terminado = false;
  let reproduccionIniciada = false;
  let temporizador;
  let resolver;
  const finished = new Promise((resolve) => { resolver = resolve; });
  // CANOSYS: finaliza el anuncio y libera el audio para el siguiente BOX.
  const finalizar = () => {
    if (terminado) return;
    terminado = true;
    clearTimeout(temporizador);
    audio.pause();
    resolver();
  };
  // CANOSYS: construye una locución corta de BOX X en el idioma y voz indicados.
  const decir = (idioma, nombreVoz, alTerminar) => {
    if (terminado || !sintesis || !window.SpeechSynthesisUtterance) return finalizar();
    const nombre = String(box.nombre || `BOX ${box.id}`).trim();
    const etiqueta = /^box\b/i.test(nombre) ? nombre : `BOX ${nombre}`;
    const mensaje = new window.SpeechSynthesisUtterance(etiqueta);
    const voces = sintesis.getVoices();
    const voz = voces.find((item) => new RegExp(nombreVoz, 'i').test(item.name || '') && new RegExp(`^${idioma}[-_]`, 'i').test(item.lang))
      // CANOSYS: usa cualquier voz del idioma si Laura o Zira no están instaladas.
      || voces.find((item) => new RegExp(`^${idioma}[-_]`, 'i').test(item.lang));
    if (voz) mensaje.voice = voz;
    mensaje.lang = voz ? voz.lang : `${idioma}-${idioma === 'es' ? 'ES' : 'US'}`;
    mensaje.rate = 0.5;
    mensaje.volume = 1;
    mensaje.onend = alTerminar;
    mensaje.onerror = finalizar;
    try { sintesis.speak(mensaje); } catch (error) { finalizar(); }
  };
  // CANOSYS: inicia inglés inmediatamente cuando termina la locución española.
  const decirIngles = () => decir('en', 'zira', finalizar);
  // CANOSYS: conserva Laura y la velocidad solicitada para la locución española.
  const decirEspanol = () => decir('es', 'laura', decirIngles);
  audio.volume = 1;
  audio.preload = 'auto';
  // CANOSYS: código anterior conservado; la voz dependía del evento onended del MP3.
  // audio.onended = decirBox;
  // audio.onerror = decirBox;
  // CANOSYS: reproduce con el mismo evento de ENTER_TURNERO y acepta canplay como respaldo de navegadores antiguos.
  const reproducirTimbre = () => {
    if (reproduccionIniciada || terminado) return;
    reproduccionIniciada = true;
    try { Promise.resolve(audio.play()).catch(() => {}); } catch (error) {}
  };
  audio.oncanplaythrough = reproducirTimbre;
  audio.oncanplay = reproducirTimbre;
  // CANOSYS: código anterior conservado; el respaldo de seis segundos podía omitir el timbre antes de que Edge terminara de cargarlo.
  // temporizador = setTimeout(decirBox, 6000);
  // CANOSYS: deja terminar el timbre de 1,8 segundos antes de iniciar el anuncio bilingüe, como el turnero.
  temporizador = setTimeout(decirEspanol, 2200);
  audio.load();
  return {
    finished,
    cancel: () => {
      // CANOSYS: cancela cualquier voz activa cuando vence el tiempo administrado.
      if (!terminado && sintesis) sintesis.cancel();
      finalizar();
    },
  };
}

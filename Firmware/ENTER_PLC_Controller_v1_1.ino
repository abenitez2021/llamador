/*
  ENTER PLC Controller v1.1 - Digital Loggers PLDuino / ATmega2560

  Entradas: D30-D37 (botones BOX 1-8), activos en LOW con INPUT_PULLUP.
  Salidas:  D38-D45 (colector abierto, activas con HIGH), 5 s por pulsacion.
  LCD:      PLDuino ILI9341 320x240, muestra estado y ultimo BOX.
  USB:      115200 baudios, compatible con mensajes v1.0 BTN;N;D3X.

  IMPORTANTE SOBRE EL CABLEADO DE LAS SALIDAS:
    Estos terminales NO entregan voltaje positivo. Cuando se activan,
    CONECTAN la carga al negativo (salidas de colector abierto).
    Para una luz de 12 V DC con resistencia incluida:
      +12V -> positivo de luz
      negativo de luz -> D38 (BOX 1), D39 (BOX 2), ..., D45 (BOX 8)
      +12V -> CLAMP / COMMON del bloque DIGITAL OUT
    Si el indicador es un LED suelto, agregar resistencia limitadora.
    Si utiliza una fuente externa para las luces, unir su negativo con
    el negativo de alimentacion del PLC y su positivo con CLAMP.

  NO conectar 220 V a D38-D45. Para 220 V utilizar rele/contactores
  EXTERNOS certificados, con instalacion y protecciones profesionales.

  Dependencias: PLDuino.h, SPI.h, Adafruit_GFX.h, Adafruit_ILI9341.h.
  No utiliza Wi-Fi, touchscreen, SD ni los seis reles internos.
*/

#include <SPI.h>
#include <Adafruit_GFX.h>
#include <Adafruit_ILI9341.h>
#include <PLDuino.h>

const uint8_t BOX_COUNT = 8;
const uint8_t INPUT_PINS[BOX_COUNT]  = {30, 31, 32, 33, 34, 35, 36, 37};
const uint8_t OUTPUT_PINS[BOX_COUNT] = {38, 39, 40, 41, 42, 43, 44, 45};
const uint8_t PRESSED_LEVEL = LOW;
const unsigned long DEBOUNCE_MS = 60;
const unsigned long LIGHT_MS = 5000UL;

Adafruit_ILI9341 tft(PLDuino::LCD_CS, PLDuino::LCD_DC);

uint8_t lastRaw[BOX_COUNT];
uint8_t stableState[BOX_COUNT];
unsigned long lastChangeMs[BOX_COUNT];
unsigned long lightStartMs[BOX_COUNT];
bool lightOn[BOX_COUNT];
uint8_t lastBox = 0;

void printPinState(const char *prefix, uint8_t index, uint8_t level) {
  Serial.print(prefix);
  Serial.print(';');
  Serial.print(index + 1);
  Serial.print(F(";D"));
  Serial.print(INPUT_PINS[index]);
  Serial.print(';');
  Serial.println(level == HIGH ? F("HIGH") : F("LOW"));
}

void printLightState(uint8_t index, bool active) {
  Serial.print(F("OUT;"));
  Serial.print(index + 1);
  Serial.print(F(";D"));
  Serial.print(OUTPUT_PINS[index]);
  Serial.print(';');
  Serial.println(active ? F("ON") : F("OFF"));
}

uint8_t activeLightCount() {
  uint8_t count = 0;
  for (uint8_t i = 0; i < BOX_COUNT; i++) {
    if (lightOn[i]) count++;
  }
  return count;
}

void renderLCD() {
  tft.fillScreen(ILI9341_BLACK);
  tft.fillRect(0, 0, 320, 55, ILI9341_NAVY);
  tft.setTextColor(ILI9341_WHITE);
  tft.setTextSize(3);
  tft.setCursor(102, 10);
  tft.print(F("ENTER"));

  tft.setTextColor(ILI9341_CYAN);
  tft.setTextSize(2);
  tft.setCursor(45, 65);
  tft.println(F("LLAMADOR PLC"));

  tft.setTextColor(ILI9341_GREEN);
  tft.setCursor(72, 100);
  tft.println(F("PLC ACTIVO"));

  tft.setTextColor(ILI9341_WHITE);
  tft.setTextSize(2);
  tft.setCursor(25, 142);
  tft.print(F("Ultimo BOX: "));
  if (lastBox) tft.println(lastBox);
  else tft.println(F("--"));

  tft.setCursor(25, 171);
  tft.print(F("Luces activas: "));
  tft.println(activeLightCount());

  tft.drawFastHLine(10, 205, 300, ILI9341_DARKCYAN);
  tft.setTextSize(1);
  tft.setTextColor(ILI9341_LIGHTGREY);
  tft.setCursor(45, 215);
  tft.print(F("USB serie: 115200 | v1.1"));
}

void startLight(uint8_t index, unsigned long now) {
  lightStartMs[index] = now;
  if (!lightOn[index]) {
    lightOn[index] = true;
    digitalWrite(OUTPUT_PINS[index], HIGH);
    printLightState(index, true);
  }
  // Si vuelve a pulsar antes de 5 s, reinicia el temporizador.
}

void setup() {
  Serial.begin(115200);
  PLDuino::init();

  // Dejar todas las salidas desactivadas desde el arranque.
  for (uint8_t i = 0; i < BOX_COUNT; i++) {
    digitalWrite(OUTPUT_PINS[i], LOW);
    pinMode(OUTPUT_PINS[i], OUTPUT);
    lightOn[i] = false;
    lightStartMs[i] = 0;
  }

  for (uint8_t i = 0; i < BOX_COUNT; i++) {
    pinMode(INPUT_PINS[i], INPUT_PULLUP);
    lastRaw[i] = digitalRead(INPUT_PINS[i]);
    stableState[i] = lastRaw[i];
    lastChangeMs[i] = millis();
  }

  // La pantalla funciona sin activar el tactil ni Wi-Fi.
  PLDuino::enableLCD();
  tft.begin();
  tft.setRotation(3);
  renderLCD();

  Serial.println(F("READY;ENTER_PLC;1.1"));
  for (uint8_t i = 0; i < BOX_COUNT; i++) {
    printPinState("INPUT", i, stableState[i]);
  }
}

void loop() {
  const unsigned long now = millis();

  for (uint8_t i = 0; i < BOX_COUNT; i++) {
    const uint8_t raw = digitalRead(INPUT_PINS[i]);

    if (raw != lastRaw[i]) {
      lastRaw[i] = raw;
      lastChangeMs[i] = now;
    }

    if (raw != stableState[i] && (now - lastChangeMs[i]) >= DEBOUNCE_MS) {
      stableState[i] = raw;
      printPinState("STATE", i, raw);

      if (raw == PRESSED_LEVEL) {
        Serial.print(F("BTN;"));
        Serial.print(i + 1);
        Serial.print(F(";D"));
        Serial.println(INPUT_PINS[i]);

        lastBox = i + 1;
        startLight(i, now);
        renderLCD();
      }
    }
  }

  bool changed = false;
  for (uint8_t i = 0; i < BOX_COUNT; i++) {
    if (lightOn[i] && (now - lightStartMs[i]) >= LIGHT_MS) {
      lightOn[i] = false;
      digitalWrite(OUTPUT_PINS[i], LOW);
      printLightState(i, false);
      changed = true;
    }
  }
  if (changed) renderLCD();
}

/**
 * Audio processing utilities for Gemini Live API
 */

export const float32ToInt16 = (buffer: Float32Array): Int16Array => {
  const l = buffer.length;
  const buf = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    buf[i] = Math.min(1, buffer[i]) * 0x7fff;
  }
  return buf;
};

export const base64ToUint8Array = (base64: string): Uint8Array => {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

export const uint8ArrayToBase64 = (array: Uint8Array): string => {
  let binary = '';
  const len = array.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(array[i]);
  }
  return window.btoa(binary);
};

export const pcmToFloat32 = (pcmData: Uint8Array): Float32Array => {
  const int16Array = new Int16Array(pcmData.buffer);
  const float32Array = new Float32Array(int16Array.length);
  for (let i = 0; i < int16Array.length; i++) {
    float32Array[i] = int16Array[i] / 32768.0;
  }
  return float32Array;
};

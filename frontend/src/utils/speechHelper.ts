export const speak = (text: string, onEnd?: () => void) => {
  window.speechSynthesis.cancel(); // stop any current speech

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.8;    // slightly slow for kids
  utterance.pitch = 1.2;   // friendly tone
  utterance.volume = 1;
  utterance.lang = 'en-US';

  if (onEnd) {
    utterance.onend = onEnd;
  }

  window.speechSynthesis.speak(utterance);
};

export const speakLetter = (letter: string, onEnd?: () => void) => {
  const isNumber = !isNaN(Number(letter));
  const text = isNumber ? `Number ${letter}` : `Letter ${letter}`;
  speak(text, onEnd);
};
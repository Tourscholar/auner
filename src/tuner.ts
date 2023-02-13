import aubio from "aubiojs";

declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

declare var navigator: any;
navigator.getUserMedia =
  navigator.getUserMedia ||
  navigator.webkitGetUserMedia ||
  navigator.mozGetUserMedia;

class Tuner {
  public middleA: number;
  public onNoteDetected: any;

  private semitone: number;
  private bufferSize: number;
  noteStrings: string[];
  private audioContext: any;
  private pitchDetector: any;
  private oscillator!: OscillatorNode;

  public analyser!: {
    connect: (arg0: (_scriptProcessor: any) => void) => void;
    frequencyBinCount: Iterable<number>;
    getByteFrequencyData: (arg0: Uint8Array | undefined) => void;
  };

  constructor(a4: number) {
    this.middleA = a4 || 440;
    this.semitone = 69;
    this.bufferSize = 4096;
    this.noteStrings = [
      "C",
      "C♯",
      "D",
      "D♯",
      "E",
      "F",
      "F♯",
      "G",
      "G♯",
      "A",
      "A♯",
      "B",
    ];

    this.initGetUserMedia();
  }
  initGetUserMedia() {
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!window.AudioContext) {
      return alert("AudioContext not supported");
    }

    // Older browsers might not implement mediaDevices at all, so we set an empty object first
    if (navigator.mediaDevices === undefined) {
      navigator.mediaDevices = {};
    }

    // Some browsers partially implement mediaDevices. We can't just assign an object
    // with getUserMedia as it would overwrite existing properties.
    // Here, we will just add the getUserMedia property if it's missing.
    if (navigator.mediaDevices.getUserMedia === undefined) {
      navigator.mediaDevices.getUserMedia = function (constraints: any) {
        // First get ahold of the legacy getUserMedia, if present
        const getUserMedia =
          navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

        // Some browsers just don't implement it - return a rejected promise with an error
        // to keep a consistent interface
        if (!getUserMedia) {
          alert("getUserMedia is not implemented in this browser");
        }

        // Otherwise, wrap the call to the old navigator.getUserMedia with a Promise
        return new Promise(function (resolve, reject) {
          getUserMedia.call(navigator, constraints, resolve, reject);
        });
      };
    }
  }
  startRecord() {
    const self = this;
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream: any) => {
        self.audioContext
          .createMediaStreamSource(stream)
          .connect(self.analyser);
        // @ts-ignore
        self.analyser.connect(self.scriptProcessor);
        // @ts-ignore
        self.scriptProcessor.connect(self.audioContext.destination);
        // @ts-ignore
        self.scriptProcessor.addEventListener(
          "audioprocess",
          (event: {
            inputBuffer: { getChannelData: (arg0: number) => any };
          }) => {
            const frequency = self.pitchDetector.do(
              event.inputBuffer.getChannelData(0)
            );
            if (frequency && self.onNoteDetected) {
              const note = self.getNote(frequency);
              self.onNoteDetected({
                name: self.noteStrings[note % 12],
                value: note,
                cents: self.getCents(frequency, note),
                octave: parseInt(String(note / 12)) - 1,
                frequency: frequency,
              });
            }
          }
        );
      })
      .catch(function (error: { name: string; message: string }) {
        alert(error.name + ": " + error.message);
      });
  }

  analyserError(_analyserError: any) {
    throw new Error("Method not implemented.");
  }
  scriptProcessor(_scriptProcessor: any) {
    throw new Error("Method not implemented.");
  }
  init() {
    this.audioContext = new window.AudioContext();
    this.analyser = this.audioContext.createAnalyser();
    this.scriptProcessor = this.audioContext.createScriptProcessor(
      this.bufferSize,
      1,
      1
    );

    const self = this;

    aubio().then(function (aubio) {
      self.pitchDetector = new aubio.Pitch(
        "default",
        self.bufferSize,
        1,
        self.audioContext.sampleRate
      );
      self.startRecord();
    });
  }
  /**
   * get musical note from frequency
   *
   * @param {number} frequency
   * @returns {number}
   */
  getNote(frequency: number): number {
    const note = 12 * (Math.log(frequency / this.middleA) / Math.log(2));
    return Math.round(note) + this.semitone;
  }
  /**
   * get the musical note's standard frequency
   *
   * @param note
   * @returns {number}
   */
  getStandardFrequency(note: number): number {
    return this.middleA * Math.pow(2, (note - this.semitone) / 12);
  }
  /**
   * get cents difference between given frequency and musical note's standard frequency
   *
   * @param {number} frequency
   * @param {number} note
   * @returns {number}
   */
  getCents(frequency: number, note: number): number {
    return Math.floor(
      (1200 * Math.log(frequency / this.getStandardFrequency(note))) /
        Math.log(2)
    );
  }
  /**
   * play the musical note
   *
   * @param {number} frequency
   */
  playNote(frequency: string | undefined | number) {
    if (!this.oscillator) {
      this.oscillator = this.audioContext.createOscillator();
      this.oscillator.connect(this.audioContext.destination);
      this.oscillator.start();
    }
    this.oscillator.frequency.value = Number(frequency);
  }
  stopOscillator() {
    if (this.oscillator) {
      this.oscillator.stop();
      // @ts-ignore
      this.oscillator = null;
    }
  }
}

export default Tuner;

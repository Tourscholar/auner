import Swal from "sweetalert2";
import FrequencyBars from "./frequency-bars";
import Meter from "./meter";
import Notes from "./notes";
import Tuner from "./tuner";
import { noteProps } from "./type";

class Application {
  private tuner: Tuner;
  private a4!: number;
  private notes: Notes;
  private meter: Meter;
  private frequencyBars: FrequencyBars;
  private $a4!: HTMLElement | null;
  private lastNote: any;
  private frequencyData: Uint8Array | undefined;

  constructor() {
    this.initA4();
    this.tuner = new Tuner(this.a4);
    this.notes = new Notes(".notes", this.tuner);
    this.meter = new Meter(".meter");
    this.frequencyBars = new FrequencyBars(".frequency-bars");
    this.update({
      name: "A",
      frequency: this.a4,
      octave: 4,
      value: 69,
      cents: 0,
    });
  }
  initA4() {
    this.$a4 = document.querySelector(".a4 span");
    this.a4 = parseInt(localStorage.getItem("a4") ?? " ") || 440;
    this.$a4!.innerHTML = String(this.a4);
  }
  start() {
    const self = this;

    this.tuner.onNoteDetected = function (note: noteProps) {
      if (self.notes.isAutoMode) {
        if (self.lastNote === note.name) {
          self.update(note);
        } else {
          self.lastNote = note.name;
        }
      }
    };

    Swal.fire("Welcome to Auner!").then(function () {
      self.tuner.init();
      self.frequencyData = new Uint8Array(
        self.tuner.analyser.frequencyBinCount
      );
    });

    this.$a4!.addEventListener("click", function () {
      Swal.fire({ input: "number", inputValue: self.a4 }).then(function ({
        value: a4,
      }) {
        if (!parseInt(a4) || a4 === self.a4) {
          return;
        }
        self.a4 = a4;
        self.$a4!.innerHTML = a4;
        self.tuner.middleA = a4;
        self.notes.createNotes();
        self.update({
          name: "A",
          frequency: self.a4,
          octave: 4,
          value: 69,
          cents: 0,
        });
        localStorage.setItem("a4", a4);
      });
    });

    this.updateFrequencyBars();

    document.querySelector(".auto input")?.addEventListener("change", () => {
      this.notes.toggleAutoMode();
    });
  }
  updateFrequencyBars() {
    if (this.tuner.analyser) {
      this.tuner.analyser.getByteFrequencyData(this.frequencyData);
      //@ts-ignore
      this.frequencyBars.update(this.frequencyData);
    }
    requestAnimationFrame(this.updateFrequencyBars.bind(this));
  }
  update(note: noteProps) {
    this.notes.update(note);
    this.meter.update((note.cents / 50) * 45);
  }
}

const app = new Application();
app.start();

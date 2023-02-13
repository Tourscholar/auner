import Tuner from "./tuner";

class Notes {
  public isAutoMode: boolean;

  private tuner: Tuner;
  private root: HTMLElement | null;
  private notesList: HTMLElement | null;
  private frequency: HTMLElement | null;
  private notes: HTMLDivElement[];
  private readonly notesMap: { [x: string]: HTMLDivElement };

  constructor(selector: any, tuner: Tuner) {
    this.tuner = tuner;
    this.isAutoMode = true;
    this.root = document.querySelector(selector);
    this.notesList = this.root!.querySelector(".notes-list");
    this.frequency = this.root!.querySelector(".frequency");
    this.notes = [];
    this.notesMap = {};
    this.createNotes();
    this.notesList!.addEventListener(
      "touchstart",
      (event: { stopPropagation: () => any }) => event.stopPropagation()
    );
  }
  createNotes() {
    this.notesList!.innerHTML = "";
    const minOctave = 1;
    const maxOctave = 8;
    for (let octave = minOctave; octave <= maxOctave; octave += 1) {
      for (let n = 0; n < 12; n += 1) {
        const note = document.createElement("div");
        note.className = "note";
        note.dataset.name = this.tuner.noteStrings[n];
        note.dataset.value = (12 * (octave + 1) + n).toString();
        note.dataset.octave = octave.toString();
        note.dataset.frequency = String(
          this.tuner.getStandardFrequency(Number(note.dataset.value))
        );
        note.innerHTML =
          note.dataset.name ??
          [0] +
            '<span class="note-sharp">' +
            ((note.dataset.name ?? [1]) || "") +
            "</span>" +
            '<span class="note-octave">' +
            note.dataset.octave +
            "</span>";
        this.notesList!.appendChild(note);
        this.notes.push(note);
        this.notesMap[note.dataset.value] = note;
      }
    }

    const self = this;
    this.notes.forEach((note) => {
      note.addEventListener("click", () => {
        if (self.isAutoMode) {
          return;
        }

        const $active = self.notesList!.querySelector(".active");
        //@ts-ignore
        if ($active === this) {
          self.tuner.stopOscillator();
          // @ts-ignore
          $active.classList.remove("active");
        } else {
          self.tuner.playNote(note.dataset.frequency);
          self.update(note.dataset);
        }
      });
    });
  }
  active(note: {
    classList: { add: (arg0: string) => void };
    offsetLeft: number;
    clientWidth: number;
  }) {
    this.clearActive();
    note.classList.add("active");
    this.notesList!.scrollLeft =
      note.offsetLeft - (this.notesList!.clientWidth - note.clientWidth) / 2;
  }
  clearActive() {
    const active = this.notesList!.querySelector(".active");
    if (active) {
      active.classList.remove("active");
    }
  }

  update(note: DOMStringMap) {
    // @ts-ignore
    if (note.value in this.notesMap) {
      // @ts-ignore
      this.active(this.notesMap[note.value]);
      this.frequency!.childNodes[0].textContent = parseFloat(
        String(note.frequency)
      ).toFixed(1);
    }
  }
  toggleAutoMode() {
    if (!this.isAutoMode) {
      this.tuner.stopOscillator();
    }
    this.clearActive();
    this.isAutoMode = !this.isAutoMode;
  }
}

export default Notes;

/**
 * @param {string} selector
 * @constructor
 */

class Meter {
  private root: HTMLElement;
  private pointer: HTMLElement | null;

  constructor(selector: any) {
    this.root = document.querySelector(selector);
    this.pointer = this.root.querySelector(".meter-pointer");
    this.init();
  }
  init() {
    for (var i = 0; i <= 10; i += 1) {
      const $scale = document.createElement("div");
      $scale.className = "meter-scale";
      $scale.style.transform = "rotate(" + (i * 9 - 45) + "deg)";
      if (i % 5 === 0) {
        $scale.classList.add("meter-scale-strong");
      }
      this.root.appendChild($scale);
    }
  }
  /**
   * @param {number} deg
   */
  update(deg: number) {
    this.pointer!.style.transform = "rotate(" + deg + "deg)";
  }
}

export default Meter;

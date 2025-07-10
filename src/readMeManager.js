import { marked } from "https://esm.sh/marked";

export class ReadMeManager {
  constructor(readmeUrl = "./docs/readme.md") {
    this.readmeUrl = readmeUrl;
    this.modalId = "readmeModal";
    this.openBtnId = "openReadme";
    this.contentId = "readmeContent";
    this._onClickOutside = this._handleOutsideClick.bind(this);
    this._onCloseClick = this._handleCloseClick.bind(this);
    this._onOpenClick = this._handleOpenClick.bind(this);
    this._modal = null;
    this._content = null;
    this._openButton = null;
    this._closeButton = null;
    this.init();
  }

  init() {
    this._modal = document.getElementById(this.modalId);
    this._content = document.getElementById(this.contentId);
    this._closeButton = this._modal?.querySelector(".close-button");

    this._openButton = document.getElementById(this.openBtnId);
    if (this._openButton) {
      this._openButton.addEventListener("click", this._onOpenClick);
    }
    if (this._closeButton) {
      this._closeButton.addEventListener("click", this._onCloseClick);
    }
    window.addEventListener("click", this._onClickOutside);
  }

  async _handleOpenClick() {
    try {
      const res = await fetch(this.readmeUrl);
      const md = await res.text();

      let html;
      const maybePromise = marked(md);
      if (maybePromise instanceof Promise) {
        html = await maybePromise;
      } else {
        html = maybePromise;
      }

      if (this._content) this._content.innerHTML = html;
      if (this._modal) this._modal.style.display = "block";
    } catch (err) {
      if (this._content) this._content.innerText = "Failed to load README.";
      console.error("ReadMeManager: Error loading README:", err);
    }
  }

  _handleCloseClick() {
    if (this._modal) this._modal.style.display = "none";
  }

  _handleOutsideClick(event) {
    if (event.target === this._modal) {
      this._modal.style.display = "none";
    }
  }

  dispose() {
    if (this._openButton) {
      this._openButton.removeEventListener("click", this._onOpenClick);
    }
    if (this._closeButton) {
      this._closeButton.removeEventListener("click", this._onCloseClick);
    }
    window.removeEventListener("click", this._onClickOutside);
  }
}

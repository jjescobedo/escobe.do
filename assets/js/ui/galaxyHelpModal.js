class GalaxyHelpModal {
  constructor() {
    this.modalElement = document.getElementById('galaxy-help-modal');
    this.titleElement = document.getElementById('galaxy-help-title');
    this.bodyElement = document.getElementById('galaxy-help-body');
    this.closeButton = this.modalElement.querySelector('.modal-close-button');
    this.isOpen = false;

    this.closeButton.addEventListener('click', () => this.hide());
  }

  show(title, body) {
    this.titleElement.textContent = title || '';
    this.bodyElement.textContent = body || '';
    this.modalElement.classList.add('modal-visible');
    this.isOpen = true;
  }

  hide() {
    this.modalElement.classList.remove('modal-visible');
    this.isOpen = false;
  }
}
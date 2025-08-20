class ProjectModal {
  constructor() {
    this.modalElement = document.getElementById('project-modal');
    this.titleElement = document.getElementById('modal-title');
    this.subtextElement = document.getElementById('modal-subtext');
    this.bodyElement = document.getElementById('modal-body');
    this.closeButton = this.modalElement.querySelector('.modal-close-button');
    
    this.isOpen = false;

    // Add event listener to the close button
    this.closeButton.addEventListener('click', () => this.hide());
  }

  show(data) {
    this.titleElement.textContent = data.title || '';
    this.subtextElement.textContent = data.subtext || '';
    this.bodyElement.textContent = data.body || '';
    
    this.modalElement.classList.add('modal-visible');
    this.isOpen = true;
  }

  hide() {
    this.modalElement.classList.remove('modal-visible');
    this.isOpen = false;
  }
}
class ProjectModal {
  constructor() {
    this.modalElement = document.getElementById('project-modal');
    this.titleElement = document.getElementById('modal-title');
    this.subtextElement = document.getElementById('modal-subtext');
    this.bodyElement = document.getElementById('modal-body');
    this.imagesElement = document.getElementById('modal-images');
    this.footerElement = document.getElementById('modal-footer');
    this.closeButton = this.modalElement.querySelector('.modal-close-button');
    this.isOpen = false;

    this.pages = [];
    this.currentPage = 0;

    this.closeButton.addEventListener('click', () => this.hide());

    this.arrowsContainer = document.createElement('div');
    this.arrowsContainer.className = 'modal-arrows-container';
    this.arrowLeft = document.createElement('button');
    this.arrowRight = document.createElement('button');
    this.arrowLeft.textContent = '←';
    this.arrowRight.textContent = '→';
    this.arrowLeft.className = 'modal-arrow inactive';
    this.arrowRight.className = 'modal-arrow inactive';
    this.arrowLeft.onclick = () => this.prevPage();
    this.arrowRight.onclick = () => this.nextPage();
    this.arrowsContainer.appendChild(this.arrowLeft);
    this.arrowsContainer.appendChild(this.arrowRight);
    this.modalElement.appendChild(this.arrowsContainer);
  }

  paginateText(text) {
    return text.split('\t').map(page => page.trim()).filter(page => page.length > 0);
  }

  show(data) {
    this.titleElement.innerHTML = '';
    const titleText = document.createElement('span');
    titleText.textContent = data.title || '';
    this.titleElement.appendChild(titleText);

    this.subtextElement.textContent = data.subtext || '';

    this.imagesElement.innerHTML = '';
    if (Array.isArray(data.images)) {
      data.images.forEach(imgPath => {
        const img = document.createElement('img');
        img.src = imgPath;
        img.className = 'modal-project-image';
        this.imagesElement.appendChild(img);
      });
    } else if (data.image) {
      const img = document.createElement('img');
      img.src = data.image;
      img.className = 'modal-project-image';
      this.imagesElement.appendChild(img);
    }

    this.pages = this.paginateText(data.body || '', 800);
    this.currentPage = 0;
    this.renderBody();

    this.footerElement.innerHTML = '';
    if (data.links) {
      const icons = [
        {
          href: 'https://linkedin.com/in/jjescobedo',
          svg: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/linkedin.svg',
          alt: 'LinkedIn',
        },
        {
          href: 'https://github.com/jjescobedo',
          svg: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/github.svg',
          alt: 'GitHub',
        },
        {
          href: 'mailto:james@escobe.do',
          svg: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/gmail.svg',
          alt: 'Email',
        },
        {
          href: 'data/james-escobedo-resume-september.pdf',
          svg: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/adobeacrobatreader.svg',
          alt: 'Resume',
          download: true,
        }
      ];
      icons.forEach(icon => {
        const a = document.createElement('a');
        a.href = icon.href;
        a.target = '_blank';
        if (icon.download) a.setAttribute('download', '');
        const img = document.createElement('img');
        img.src = icon.svg;
        img.alt = icon.alt;
        img.className = 'modal-footer-icon';
        img.style.background = 'transparent';
        a.appendChild(img);
        this.footerElement.appendChild(a);
      });
    }

    this.updateArrows();

    this.modalElement.classList.add('modal-visible');
    this.isOpen = true;
  }

  renderBody() {
    const page = this.pages[this.currentPage] || '';
    this.bodyElement.innerHTML = page.replace(/\n/g, '<br>');
  }

  prevPage() {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.renderBody();
      this.updateArrows();
    }
  }

  nextPage() {
    if (this.currentPage < this.pages.length - 1) {
      this.currentPage++;
      this.renderBody();
      this.updateArrows();
    }
  }

  updateArrows() {
    if (this.pages.length > 1) {
      this.arrowsContainer.style.display = 'flex';
      this.arrowLeft.className = 'modal-arrow' + (this.currentPage > 0 ? ' active' : ' inactive');
      this.arrowRight.className = 'modal-arrow' + (this.currentPage < this.pages.length - 1 ? ' active' : ' inactive');
    } else {
      this.arrowsContainer.style.display = 'none';
    }
  }

  hide() {
    this.modalElement.classList.remove('modal-visible');
    this.isOpen = false;
    document.getElementById('floating-profile-box').style.display = 'none';
  }
}
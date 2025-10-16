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

    this.closeButton.addEventListener('click', () => this.hide());
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

    // Just set the body content, convert newlines to <br>
    this.bodyElement.innerHTML = (data.body || '').replace(/\n/g, '<br>');

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
          href: 'data/james-escobedo-resume-october.pdf',
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

    this.modalElement.classList.add('modal-visible');
    this.isOpen = true;
  }

  hide() {
    this.modalElement.classList.remove('modal-visible');
    this.isOpen = false;
    document.getElementById('floating-profile-box').style.display = 'none';
  }
}
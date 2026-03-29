/* ============================================================
   S3 FOUNDATION — MAIN JAVASCRIPT
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ── NAVBAR SCROLL BEHAVIOUR ── */
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    // If page already scrolled on load (inner pages with solid nav)
    if (navbar.classList.contains('solid')) {
      // do nothing – keep it solid
    } else {
      const handleScroll = () => {
        if (window.scrollY > 60) navbar.classList.add('scrolled');
        else navbar.classList.remove('scrolled');
      };
      window.addEventListener('scroll', handleScroll, { passive: true });
      handleScroll();
    }
  }

  /* ── ACTIVE NAV LINK ── */
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, .mobile-nav a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });

  /* ── MOBILE NAV ── */
  const hamburger = document.querySelector('.hamburger');
  const mobileNav = document.querySelector('.mobile-nav');
  const mobileNavClose = document.querySelector('.mobile-nav-close');

  if (hamburger && mobileNav) {
    hamburger.addEventListener('click', () => {
      mobileNav.classList.add('open');
      document.body.style.overflow = 'hidden';
    });

    const closeNav = () => {
      mobileNav.classList.remove('open');
      document.body.style.overflow = '';
    };

    if (mobileNavClose) mobileNavClose.addEventListener('click', closeNav);
    mobileNav.querySelectorAll('a').forEach(l => l.addEventListener('click', closeNav));
  }

  /* ── SCROLL TO TOP BUTTON ── */
  const scrollBtn = document.querySelector('.scroll-top-btn');
  if (scrollBtn) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 400) scrollBtn.classList.add('visible');
      else scrollBtn.classList.remove('visible');
    }, { passive: true });

    scrollBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ── SCROLL REVEAL ── */
  const revealElements = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealElements.length > 0) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          setTimeout(() => entry.target.classList.add('visible'), i * 80);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealElements.forEach(el => io.observe(el));
  } else {
    revealElements.forEach(el => el.classList.add('visible'));
  }

  /* ── COUNTER ANIMATION ── */
  function animateCounter(el) {
    const target = parseInt(el.dataset.target, 10);
    const suffix = el.dataset.suffix || '';
    const duration = 1800;
    const start = performance.now();

    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      el.textContent = Math.floor(ease * target).toLocaleString() + suffix;
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  const counters = document.querySelectorAll('[data-target]');
  if (counters.length > 0 && 'IntersectionObserver' in window) {
    const cio = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          cio.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach(c => cio.observe(c));
  }

  /* ── GALLERY LIGHTBOX ── */
  const galleryItems = document.querySelectorAll('.gallery-item img');
  if (galleryItems.length > 0) {
    let lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.innerHTML = `
      <div class="lightbox-overlay"></div>
      <div class="lightbox-content">
        <img src="" alt="" class="lightbox-img"/>
        <button class="lightbox-close">✕</button>
        <button class="lightbox-prev">‹</button>
        <button class="lightbox-next">›</button>
        <div class="lightbox-caption"></div>
      </div>`;
    document.body.appendChild(lightbox);

    const lbImg = lightbox.querySelector('.lightbox-img');
    const lbCaption = lightbox.querySelector('.lightbox-caption');
    let currentIdx = 0;

    const openLB = (idx) => {
      currentIdx = idx;
      const item = galleryItems[idx];
      lbImg.src = item.src;
      lbCaption.textContent = item.alt || '';
      lightbox.classList.add('open');
      document.body.style.overflow = 'hidden';
    };
    const closeLB = () => {
      lightbox.classList.remove('open');
      document.body.style.overflow = '';
    };
    const prev = () => openLB((currentIdx - 1 + galleryItems.length) % galleryItems.length);
    const next = () => openLB((currentIdx + 1) % galleryItems.length);

    galleryItems.forEach((img, i) => img.parentElement.addEventListener('click', () => openLB(i)));
    lightbox.querySelector('.lightbox-close').addEventListener('click', closeLB);
    lightbox.querySelector('.lightbox-overlay').addEventListener('click', closeLB);
    lightbox.querySelector('.lightbox-prev').addEventListener('click', prev);
    lightbox.querySelector('.lightbox-next').addEventListener('click', next);
    document.addEventListener('keydown', e => {
      if (!lightbox.classList.contains('open')) return;
      if (e.key === 'Escape') closeLB();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    });
  }

  /* ── EVENT FILTER TABS ── */
  const filterBtns = document.querySelectorAll('[data-filter]');
  if (filterBtns.length > 0) {
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filter = btn.dataset.filter;
        document.querySelectorAll('[data-category]').forEach(item => {
          if (filter === 'all' || item.dataset.category === filter) {
            item.style.display = '';
          } else {
            item.style.display = 'none';
          }
        });
      });
    });
  }

  /* ── DONATION AMOUNT SELECTOR ── */
  const amountBtns = document.querySelectorAll('.amount-btn');
  const customInput = document.querySelector('#custom-amount');
  if (amountBtns.length > 0) {
    amountBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        amountBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (customInput) {
          const val = btn.dataset.amount;
          if (val === 'custom') {
            customInput.style.display = 'block';
            customInput.focus();
          } else {
            customInput.style.display = 'none';
            customInput.value = val;
          }
        }
      });
    });
  }

  /* ── NEWSLETTER FORM ── */
  const nlForm = document.querySelector('.newsletter-form');
  if (nlForm) {
    nlForm.addEventListener('submit', e => {
      e.preventDefault();
      const emailInput = nlForm.querySelector('input[type="email"]');
      if (emailInput && emailInput.value) {
        nlForm.innerHTML = `<div class="alert alert-success" style="margin:0;justify-content:center;">
          🙏 Thank you! You have been subscribed to S3 Foundation updates.
        </div>`;
      }
    });
  }

  /* ── CONTACT FORM ── */
  const contactForm = document.querySelector('#contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', e => {
      e.preventDefault();
      const btn = contactForm.querySelector('button[type="submit"]');
      btn.textContent = 'Sending…';
      btn.disabled = true;
      setTimeout(() => {
        contactForm.innerHTML = `
          <div class="alert alert-success">
            🙏 <strong>Message Received!</strong> Thank you for reaching out. We will get back to you within 2–3 business days. Jai Sri Hari!
          </div>`;
      }, 1400);
    });
  }

  /* ── ACCORDION ── */
  document.querySelectorAll('.accordion-header').forEach(header => {
    header.addEventListener('click', () => {
      const item = header.parentElement;
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.accordion-item').forEach(i => i.classList.remove('open'));
      if (!isOpen) item.classList.add('open');
    });
  });

});

/* ── LIGHTBOX STYLES (injected) ── */
const lbCSS = document.createElement('style');
lbCSS.textContent = `
.lightbox { position:fixed; inset:0; z-index:9999; display:none; align-items:center; justify-content:center; }
.lightbox.open { display:flex; }
.lightbox-overlay { position:absolute; inset:0; background:rgba(0,0,0,0.92); }
.lightbox-content { position:relative; z-index:1; max-width:90vw; max-height:90vh; display:flex; flex-direction:column; align-items:center; gap:12px; }
.lightbox-img { max-width:90vw; max-height:80vh; object-fit:contain; border-radius:8px; }
.lightbox-caption { color:rgba(255,255,255,0.7); font-size:0.9rem; text-align:center; }
.lightbox-close { position:absolute; top:-44px; right:0; font-size:1.5rem; color:white; background:rgba(255,255,255,0.15); border:none; border-radius:50%; width:36px; height:36px; cursor:pointer; display:flex; align-items:center; justify-content:center; }
.lightbox-prev, .lightbox-next { position:absolute; top:50%; transform:translateY(-50%); font-size:2.5rem; color:rgba(255,255,255,0.8); background:rgba(0,0,0,0.4); border:none; border-radius:50%; width:48px; height:48px; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:background 0.2s; }
.lightbox-prev { left:-70px; }
.lightbox-next { right:-70px; }
.lightbox-prev:hover, .lightbox-next:hover { background:rgba(232,99,10,0.7); color:white; }
`;
document.head.appendChild(lbCSS);

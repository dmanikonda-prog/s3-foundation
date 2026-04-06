/**
 * S3 Foundation — Dynamic Content Loader
 * Fetches /api/content and injects dynamic content into all pages.
 * Static HTML remains unchanged; only specific dynamic sections are replaced.
 */
(async function S3ContentLoader() {
  'use strict';

  // Detect current page
  const page = location.pathname.split('/').pop().replace('.html','') || 'index';

  let content = {};
  try {
    const r = await fetch('/api/content');
    if (!r.ok) return; // Gracefully fall back to static HTML if API unavailable
    content = await r.json();
  } catch (e) {
    return; // No server running — static HTML works fine
  }

  const { site, home, about, events, gallery, donate } = content;

  // ── Helpers ──────────────────────────────────────────────────────────────────
  function el(id)   { return document.getElementById(id); }
  function qs(sel)  { return document.querySelector(sel); }
  function qsa(sel) { return [...document.querySelectorAll(sel)]; }

  function setText(selector, value) {
    if (!value) return;
    const nodes = qsa(selector);
    nodes.forEach(n => { n.textContent = value; });
  }
  function setHtml(selector, value) {
    if (!value) return;
    qsa(selector).forEach(n => { n.innerHTML = value; });
  }
  function setAttr(selector, attr, value) {
    if (!value) return;
    qsa(selector).forEach(n => { n.setAttribute(attr, value); });
  }
  function setImg(selector, src) {
    if (!src) return;
    qsa(selector).forEach(n => {
      if (n.tagName === 'IMG') {
        n.src = src;
        n.style.display = '';
        const ph = n.closest('.img-placeholder');
        if (ph) { ph.style.backgroundImage='none'; ph.style.border='none'; }
      } else {
        // If it's a placeholder div, replace with an img
        n.innerHTML = `<img src="${src}" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;"/>`;
      }
    });
  }
  function imgOrPlaceholder(src, fallbackEmoji, fallbackLabel, cls='') {
    if (src) return `<img src="${src}" alt="${fallbackLabel}" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;"/>`;
    return `<span class="ph-icon">${fallbackEmoji}</span><span class="ph-label">${fallbackLabel}</span>`;
  }

  // ── Site-wide: footer contact & social ───────────────────────────────────────
  if (site) {
    // Address / Email / Phone in footer
    qsa('[data-content="site.address"]').forEach(n => { if(site.address) n.textContent = site.address; });
    qsa('[data-content="site.email"]').forEach(n => { if(site.email) n.textContent = site.email; });
    qsa('[data-content="site.phone"]').forEach(n => { if(site.phone) n.textContent = site.phone; });
    qsa('[data-content="site.name"]').forEach(n => { if(site.name) n.textContent = site.name; });
    // Visiting hours
    if (site.hours) {
      qsa('[data-content="hours.weekdays"]').forEach(n => { n.textContent = site.hours.weekdays||''; });
      qsa('[data-content="hours.saturday"]').forEach(n => { n.textContent = site.hours.saturday||''; });
      qsa('[data-content="hours.sunday"]').forEach(n => { n.textContent = site.hours.sunday||''; });
    }
    // Social links
    if (site.social) {
      qsa('[data-social="facebook"]').forEach(n => { if(site.social.facebook) n.href = site.social.facebook; });
      qsa('[data-social="youtube"]').forEach(n => { if(site.social.youtube) n.href = site.social.youtube; });
      qsa('[data-social="instagram"]').forEach(n => { if(site.social.instagram) n.href = site.social.instagram; });
      qsa('[data-social="twitter"]').forEach(n => { if(site.social.twitter) n.href = site.social.twitter; });
    }
    // Map embed
    if (site.mapEmbedUrl) {
      const mapPh = qs('#map-placeholder, [data-map-embed]');
      if (mapPh) {
        const iframe = document.createElement('iframe');
        iframe.src = site.mapEmbedUrl;
        iframe.width = '100%'; iframe.height = '360';
        iframe.style.border = '0'; iframe.allowFullscreen = true;
        iframe.loading = 'lazy';
        mapPh.innerHTML = '';
        mapPh.appendChild(iframe);
      }
    }
  }

  // ══════════════════════════════════════════════════════════
  //  HOME PAGE (index.html)
  // ══════════════════════════════════════════════════════════
  if ((page === 'index' || page === '') && home) {

    // Hero text
    if (home.heroTitle)    setText('.hero h1, [data-home="heroTitle"]', home.heroTitle);
    if (home.heroSubtitle) setHtml('.hero .hero-sub, [data-home="heroSubtitle"]', home.heroSubtitle);
    if (home.heroDesc)     setText('[data-home="heroDesc"]', home.heroDesc);
    if (home.heroCta1Text) setText('[data-home="cta1"]', home.heroCta1Text);
    if (home.heroCta1Link) setAttr('[data-home="cta1"]', 'href', home.heroCta1Link);
    if (home.heroCta2Text) setText('[data-home="cta2"]', home.heroCta2Text);
    if (home.heroCta2Link) setAttr('[data-home="cta2"]', 'href', home.heroCta2Link);

    // Hero image
    if (home.heroImage) {
      qsa('[data-home="heroImage"]').forEach(n => {
        if (n.tagName==='IMG') n.src = home.heroImage;
        else { n.innerHTML = `<img src="${home.heroImage}" style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0;border-radius:inherit;"/>`; }
      });
    }

    // Announcements ticker rebuild
    if (home.announcements?.length) {
      const track = qs('.ticker-track, .announcement-track, [data-ticker]');
      if (track) {
        const text = [...home.announcements, ...home.announcements] // duplicate for seamless loop
          .map(a => `<span class="ticker-item">${a}</span>`).join('');
        track.innerHTML = text;
      }
    }

    // Stats counters rebuild
    if (home.stats?.length) {
      const statBoxes = qsa('.stat-box, [data-stat]');
      if (statBoxes.length) {
        home.stats.forEach((stat, i) => {
          if (!statBoxes[i]) return;
          const numEl = statBoxes[i].querySelector('[data-target], .stat-number, h3');
          const lblEl = statBoxes[i].querySelector('.stat-label, p, span:last-child');
          if (numEl) {
            numEl.setAttribute('data-target', stat.value);
            numEl.setAttribute('data-suffix', stat.suffix || '');
            numEl.textContent = stat.value + (stat.suffix || '');
          }
          if (lblEl) lblEl.textContent = stat.label;
        });
      }
    }

    // About section image
    if (home.aboutImage) {
      qsa('[data-home="aboutImage"]').forEach(n => {
        n.innerHTML = `<img src="${home.aboutImage}" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;"/>`;
      });
    }
  }

  // ══════════════════════════════════════════════════════════
  //  EVENTS PAGE
  // ══════════════════════════════════════════════════════════
  if (page === 'events' && events) {
    const upcomingContainer = qs('#upcoming-events-grid, [data-events="upcoming"]');
    const pastContainer     = qs('#past-events-grid, [data-events="past"]');
    const upcomingEvents    = events.filter(e => e.upcoming);
    const featuredEvent     = events.find(e => e.featured);
    const pastEvents        = events.filter(e => !e.upcoming);

    // ── Featured event banner ──────────────────────────────
    if (featuredEvent) {
      const featTitle  = el('events-featured-title');
      const featTitle2 = el('events-featured-title2');
      const featDesc   = el('events-featured-desc');
      const featBadge  = el('events-featured-badge');
      const featReg    = el('events-featured-register');
      const featImg    = el('events-featured-img');
      if (featTitle)  featTitle.textContent  = featuredEvent.title;
      if (featTitle2) featTitle2.textContent = featuredEvent.title;
      if (featDesc)   featDesc.textContent   = featuredEvent.description;
      if (featBadge)  featBadge.textContent  = 'UPCOMING \u00B7 ' + featuredEvent.date.toUpperCase();
      if (featReg && featuredEvent.registrationLink) featReg.href = featuredEvent.registrationLink;
      if (featImg && featuredEvent.image) {
        featImg.innerHTML = `<img src="${featuredEvent.image}" alt="${featuredEvent.title}" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;"/>`;
      }
    }

    // ── Upcoming events grid ───────────────────────────────
    if (upcomingContainer && upcomingEvents.length) {
      // First non-featured upcoming event gets the big card treatment; rest get small cards
      const [first, ...rest] = upcomingEvents;
      const catBadge = c => {
        const map = { yagna:'badge-saffron', festival:'badge-gold', satsang:'badge-blue', seva:'badge-green', homa:'badge-gold' };
        return map[c] || 'badge-saffron';
      };
      const bigCard = `
        <div class="event-big-card reveal" data-category="${first.category}">
          <div class="${first.image ? '' : 'img-placeholder '}ebc-image">
            ${first.image ? `<img src="${first.image}" alt="${first.title}" style="width:100%;height:100%;object-fit:cover;"/>` : `<span class="ph-icon">&#x1F525;</span><span class="ph-label">${first.title}</span>`}
          </div>
          <div class="ebc-body">
            <div class="badges"><span class="badge badge-gold">${first.date}</span><span class="badge ${catBadge(first.category)}">${first.category}</span><span class="badge badge-green">Free</span></div>
            <h3>${first.title}</h3>
            <p>${first.description}</p>
            <div style="display:flex;gap:12px;flex-wrap:wrap;">
              ${first.registrationLink ? `<a href="${first.registrationLink}" class="btn btn-primary btn-sm">Register</a>` : ''}
            </div>
          </div>
        </div>`;
      const smallCards = rest.length ? `
        <div class="upcoming-events-grid" style="margin-top:24px;">
          ${rest.map(e => {
            const dateParts = e.date.split(/[\s,]+/);
            const day   = dateParts.find(p => /^\d+/.test(p)) || '';
            const month = dateParts.find(p => /^[A-Za-z]/.test(p)) || '';
            return `
          <div class="event-small-card reveal" data-category="${e.category}">
            <div class="esc-header">
              <div class="esc-date-box"><div class="day">${day.replace(/\D/g,'').slice(0,2)}</div><div class="month">${month.slice(0,3)}</div></div>
              <div class="esc-info"><h4>${e.title}</h4><div class="emeta">&#x1F4C5; ${e.date}</div></div>
            </div>
            <span class="badge ${catBadge(e.category)}">${e.category}</span>
            <p style="font-size:0.87rem;color:var(--text-light);margin-top:10px;">${e.description}</p>
            ${e.registrationLink ? `<a href="${e.registrationLink}" class="btn btn-primary btn-sm" style="margin-top:12px;">Register</a>` : ''}
          </div>`; }).join('')}
        </div>` : '';
      upcomingContainer.innerHTML = bigCard + smallCards;
    }

    // ── Past events grid ───────────────────────────────────
    if (pastContainer && pastEvents.length) {
      pastContainer.innerHTML = pastEvents.map(e => `
        <div class="past-event-card reveal">
          <div class="${e.image ? '' : 'img-placeholder '}pec-img">
            ${e.image ? `<img src="${e.image}" alt="${e.title}" style="width:100%;height:100%;object-fit:cover;"/>` : `<span class="ph-icon">&#x1F549;</span><span class="ph-label">${e.title}</span>`}
          </div>
          <div class="pec-body">
            <span class="year">&#x1F4C5; ${e.date}</span>
            <h4>${e.title}</h4>
            <p style="font-size:0.83rem;color:var(--text-light);">${e.description}</p>
          </div>
        </div>`).join('');
    }
  }

  // ══════════════════════════════════════════════════════════
  //  GALLERY PAGE
  // ══════════════════════════════════════════════════════════
  if (page === 'gallery' && gallery) {
    const photoGrid = qs('#photo-masonry-grid, [data-gallery="photos"]');
    const videoGrid = qs('#video-gallery-grid, [data-gallery="videos"]');

    // ── Photo masonry ──────────────────────────────────────
    if (photoGrid && gallery.photos?.length) {
      const catIcon = { yagna:'&#x1F525;', gaushala:'&#x1F404;', festival:'&#x1F33C;', sadhana:'&#x1F9D8;', campus:'&#x1F3DB;', satsang:'&#x1F4FF;' };
      const heights = [280,220,200,240,190,260,210,230,200,250,220,190,240,200,215,230,200,195];
      photoGrid.innerHTML = gallery.photos.map((p, i) => {
        const h = heights[i % heights.length];
        if (p.url) {
          return `
            <div class="gallery-item" data-cat="${p.category}">
              <img src="${p.url}" alt="${p.caption}" loading="lazy" style="width:100%;display:block;"/>
              <div class="gi-overlay"><div class="gi-caption"><span class="gi-cat">${p.category}</span>${p.caption}</div></div>
            </div>`;
        } else {
          const icon = catIcon[p.category] || '&#x1F5BC;&#xFE0F;';
          return `
            <div class="gallery-item" data-cat="${p.category}">
              <div class="gph" style="height:${h}px;"><span class="gph-icon">${icon}</span><span class="gph-label">${p.caption}</span></div>
              <div class="gi-overlay"><div class="gi-caption"><span class="gi-cat">${p.category}</span>${p.caption}</div></div>
            </div>`;
        }
      }).join('');
    }

    // ── Video grid ─────────────────────────────────────────
    if (videoGrid && gallery.videos?.length) {
      const catBadge = { yagna:'badge-saffron', gaushala:'badge-gold', festival:'badge-gold', sadhana:'badge-green' };
      videoGrid.innerHTML = gallery.videos.map(v => {
        const ytId = extractYouTubeId(v.url);
        const thumb = v.thumbnail || (ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : '');
        const href  = (v.url && v.url !== 'https://www.youtube.com/watch?v=') ? v.url : '#';
        return `
          <div class="video-card reveal">
            <div class="video-thumb">
              ${thumb
                ? `<img src="${thumb}" alt="${v.title}" style="width:100%;height:180px;object-fit:cover;display:block;"/>`
                : `<div class="img-placeholder" style="height:180px;border-radius:0;"><span class="ph-icon">&#x1F3AC;</span><span class="ph-label">${v.title}</span></div>`}
              <div class="video-play-btn"><div class="play-icon">&#x25B6;</div></div>
            </div>
            <div class="video-body">
              <span class="badge ${catBadge[v.category]||'badge-saffron'}" style="margin-bottom:8px;">${v.category}</span>
              <h4>${v.title}</h4>
            </div>
          </div>`;
      }).join('');
      // Wire up click handlers
      videoGrid.querySelectorAll('.video-play-btn').forEach((btn, i) => {
        const v = gallery.videos[i];
        if (v && v.url && v.url !== 'https://www.youtube.com/watch?v=') {
          btn.style.cursor = 'pointer';
          btn.onclick = () => window.open(v.url, '_blank');
        }
      });
    }
  }

  // ══════════════════════════════════════════════════════════
  //  CONTACT PAGE
  // ══════════════════════════════════════════════════════════
  if (page === 'contact' && site) {
    if (site.phone) setText('[data-contact="phone"], .contact-phone', site.phone);
    if (site.email) {
      qsa('[data-contact="email"], .contact-email').forEach(n => {
        n.textContent = site.email;
        if (n.tagName === 'A') n.href = `mailto:${site.email}`;
      });
    }
  }

  // ══════════════════════════════════════════════════════════
  //  DONATE PAGE
  // ══════════════════════════════════════════════════════════
  if (page === 'donate' && donate) {
    if (donate.ein) setText('[data-donate="ein"], .donate-ein', donate.ein);
    if (donate.heroTitle) setText('[data-donate="heroTitle"]', donate.heroTitle);
    if (donate.heroSubtitle) setText('[data-donate="heroSubtitle"]', donate.heroSubtitle);
    // Update amount buttons
    if (donate.amounts?.length) {
      qsa('.amount-btn, [data-amount]').forEach((btn, i) => {
        const amt = donate.amounts[i];
        if (!amt) return;
        btn.setAttribute('data-amount', amt);
        const label = donate.amountLabels?.[amt] || '';
        btn.innerHTML = `<strong>$${amt}</strong>${label ? `<br/><small>${label}</small>` : ''}`;
      });
    }
  }

  // ══════════════════════════════════════════════════════════
  //  ABOUT PAGE
  // ══════════════════════════════════════════════════════════
  if (page === 'about' && about) {
    if (about.missionStatement) setText('[data-about="mission"], .mission-text', about.missionStatement);
    if (about.foundingStory)    setText('[data-about="foundingStory"]', about.foundingStory);
    if (about.founderName) setText('[data-about="founderName"], .founder-name', about.founderName);
    if (about.founderTitle) setText('[data-about="founderTitle"], .founder-title', about.founderTitle);
    if (about.founderBio) setText('[data-about="founderBio"], .founder-bio', about.founderBio);
    if (about.founderImage) setImg('[data-about="founderImage"], .founder-photo', about.founderImage);
    if (about.chiefAcharyaName) setText('[data-about="chiefAcharyaName"]', about.chiefAcharyaName);
    if (about.chiefAcharyaTitle) setText('[data-about="chiefAcharyaTitle"]', about.chiefAcharyaTitle);
    if (about.chiefAcharyaImage) setImg('[data-about="chiefAcharyaImage"]', about.chiefAcharyaImage);
    // Timeline rebuild — split into two columns
    if (about.timeline?.length) {
      const tlCol1 = document.getElementById('about-timeline-1');
      const tlCol2 = document.getElementById('about-timeline-2');
      if (tlCol1 && tlCol2) {
        const mid = Math.ceil(about.timeline.length / 2);
        const makeItem = t => `<div class="timeline-item"><div class="timeline-dot"></div><div class="timeline-year">${t.year}</div><div class="timeline-text">${t.event}</div></div>`;
        tlCol1.innerHTML = about.timeline.slice(0, mid).map(makeItem).join('');
        tlCol2.innerHTML = about.timeline.slice(mid).map(makeItem).join('');
      }
    }
  }

  // ══════════════════════════════════════════════════════════
  //  PROGRAMS PAGE
  // ══════════════════════════════════════════════════════════
  if (page === 'programs' && content.programs) {
    content.programs.forEach(prog => {
      if (!prog.id) return;
      // Description text
      const descEl = document.getElementById(`prog-desc-${prog.id}`);
      if (descEl && prog.description) descEl.textContent = prog.description;
      // Image — replace placeholder with actual image
      if (prog.image) {
        const imgEl = document.getElementById(`prog-img-${prog.id}`);
        if (imgEl) {
          imgEl.style.background = 'none';
          imgEl.style.border = 'none';
          imgEl.innerHTML = `<img src="${prog.image}" alt="${prog.title}" style="width:100%;height:100%;object-fit:cover;display:block;"/>`;
        }
      }
    });
  }

  // ══════════════════════════════════════════════════════════
  //  GAUSHALA PAGE
  // ══════════════════════════════════════════════════════════
  if (page === 'gaushala' && content.gaushala) {
    const g = content.gaushala;
    // Hero text and intro
    if (g.heroText || g.intro) setText('[data-gaushala="heroText"]', g.heroText || g.intro);
    if (g.intro) setText('[data-gaushala="intro"]', g.intro);
    // Stats
    if (g.totalCows) setText('[data-gaushala="totalCows"]', g.totalCows);
    if (g.acres) setText('[data-gaushala="acres"]', g.acres);
    // Hero image
    if (g.heroImage) {
      const mainImg = qs('.gp-main img');
      if (mainImg) mainImg.src = g.heroImage;
    }
    // Rebuild Panchagavya products grid
    if (g.products?.length) {
      const grid = document.getElementById('gaushala-products-grid');
      if (grid) {
        grid.innerHTML = g.products.map(p => `
          <div class="product-card reveal">
            <span class="picon">${p.icon || '🌿'}</span>
            <h4>${p.name}</h4>
            <p>${p.description}</p>
          </div>`).join('');
      }
    }
  }

  // ── Utility: Extract YouTube ID ──────────────────────────
  function extractYouTubeId(url) {
    if (!url) return null;
    const m = url.match(/(?:v=|youtu\.be\/|embed\/)([^&?/]+)/);
    return m ? m[1] : null;
  }

  // ── Re-trigger scroll animations after DOM updates ───────
  document.querySelectorAll('.reveal').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity .5s ease, transform .5s ease';
  });
  const revealObs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.style.opacity = '1';
        e.target.style.transform = 'none';
        revealObs.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

})();

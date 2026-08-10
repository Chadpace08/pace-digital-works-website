/* Aria Vance Portfolio Interactions */
(function() {
  'use strict';

  // Smooth scroll for nav anchors
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId.length > 1) {
        e.preventDefault();
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          closeMobileMenu();
          targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      }
    });
  });

  // Mobile menu drawer
  const burger = document.getElementById('burger');
  const mobileMenu = document.getElementById('mobileMenu');

  function openMobileMenu() {
    if (mobileMenu) {
      mobileMenu.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeMobileMenu() {
    if (mobileMenu && mobileMenu.classList.contains('open')) {
      mobileMenu.classList.remove('open');
      document.body.style.overflow = '';
    }
  }

  if (burger) {
    burger.addEventListener('click', function() {
      if (mobileMenu.classList.contains('open')) {
        closeMobileMenu();
      } else {
        openMobileMenu();
      }
    });
  }

  // Animated Growing Colored Vertical Timeline Rail & Active Nodes
  const tlEl = document.getElementById('timeline');
  const tlFill = document.getElementById('tlFill');
  const tlItems = document.querySelectorAll('.tl-item');

  function updateTimelineScroll() {
    if (!tlEl || !tlFill) return;
    const rect = tlEl.getBoundingClientRect();
    const windowH = window.innerHeight;
    const triggerPoint = windowH * 0.70; // starts filling when top of timeline reaches 70% of screen height
    const totalHeight = rect.height;
    
    // progress ratio from 0 to 1
    const currentProgress = (triggerPoint - rect.top) / totalHeight;
    const scaleY = Math.max(0, Math.min(1, currentProgress));
    
    tlFill.style.transform = `scaleY(${scaleY})`;

    tlItems.forEach(item => {
      const itemRect = item.getBoundingClientRect();
      if (itemRect.top <= triggerPoint) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }

  window.addEventListener('scroll', updateTimelineScroll, { passive: true });
  window.addEventListener('resize', updateTimelineScroll, { passive: true });
  updateTimelineScroll();

  // Parallax float on mouse move for desktop
  const floatBadges = document.querySelectorAll('.float-badge');
  if (window.innerWidth > 900 && floatBadges.length > 0) {
    window.addEventListener('mousemove', function(e) {
      const x = (e.clientX / window.innerWidth - 0.5) * 15;
      const y = (e.clientY / window.innerHeight - 0.5) * 15;
      floatBadges.forEach((badge, index) => {
        const factor = index % 2 === 0 ? 1 : -1;
        badge.style.transform = `translate(${x * factor}px, ${y * factor}px)`;
      });
    });
  }
})();

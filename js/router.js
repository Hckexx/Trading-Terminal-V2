/* ==========================================================================
   TRADETERMINAL V2 — Router (Desktop + Mobile Fixed)
   ========================================================================== */

const Router = {
    currentView: 'dashboard',

    init() {
        this.cacheDOM();
        this.bindEvents();
        this.navigateTo('dashboard');
    },

    cacheDOM() {
        this.navLinks = document.querySelectorAll('.nav-link[data-view]');
        this.viewContainers = document.querySelectorAll('.view-container');
        this.drawer = document.getElementById('navDrawer');
        this.overlay = document.getElementById('drawerOverlay');
        this.btnOpen = document.getElementById('btnDrawerOpen');
        this.btnClose = document.getElementById('btnDrawerClose');
    },

    bindEvents() {
        // Navigation links
        this.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const view = link.dataset.view;
                if (view) this.navigateTo(view);
            });
        });

        // Buttons with data-view (cross-navigation)
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-view]');
            if (btn && !btn.closest('.nav-link') && !btn.closest('#navDrawer')) {
                const view = btn.dataset.view;
                if (view) this.navigateTo(view);
            }
        });

        // Hamburger open
        if (this.btnOpen) {
            this.btnOpen.addEventListener('click', (e) => {
                e.stopPropagation();
                this.openDrawer();
            });
        }

        // X close button
        if (this.btnClose) {
            this.btnClose.addEventListener('click', (e) => {
                e.stopPropagation();
                this.closeDrawer();
            });
        }

        // Overlay click
        if (this.overlay) {
            this.overlay.addEventListener('click', () => this.closeDrawer());
        }

        // Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeDrawer();
        });
    },

    navigateTo(viewName) {
        if (!viewName) return;

        this.viewContainers.forEach(c => c.classList.remove('active'));
        
        const target = document.getElementById(`view-${viewName}`);
        if (target) target.classList.add('active');

        this.navLinks.forEach(link => {
            const item = link.closest('.nav-item');
            if (item) {
                const isActive = link.dataset.view === viewName;
                item.classList.toggle('active', isActive);
                if (isActive) {
                    link.setAttribute('aria-current', 'page');
                } else {
                    link.removeAttribute('aria-current');
                }
            }
        });

        this.currentView = viewName;
        this.closeDrawer();
        EventBus.emit(EVENTS.VIEW_CHANGED, { view: viewName });
    },

    openDrawer() {
        if (!this.drawer) return;
        this.drawer.classList.add('open');
        if (this.overlay) this.overlay.classList.add('visible');
    },

    closeDrawer() {
        if (!this.drawer) return;
        this.drawer.classList.remove('open');
        if (this.overlay) this.overlay.classList.remove('visible');
    }
};

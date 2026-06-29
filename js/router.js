/* ==========================================================================
   TRADETERMINAL V2 — Router (Fixed)
   ========================================================================== */

const Router = {
    currentView: 'dashboard',
    isDrawerOpen: false,

    init() {
        this.cacheDOM();
        this.bindEvents();
        this.navigateTo('dashboard');
        this.closeDrawer(); // Ensure drawer starts closed on mobile
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
        // Navigation links inside drawer
        this.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const view = link.dataset.view;
                if (view) this.navigateTo(view);
            });
        });

        // Cross-navigation buttons (data-view attribute outside drawer)
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-view]');
            if (btn && !btn.closest('.nav-link') && !btn.closest('#navDrawer')) {
                const view = btn.dataset.view;
                if (view) this.navigateTo(view);
            }
        });

        // Drawer open button (hamburger)
        if (this.btnOpen) {
            this.btnOpen.addEventListener('click', (e) => {
                e.stopPropagation();
                this.openDrawer();
            });
        }

        // Drawer close button (X inside drawer)
        if (this.btnClose) {
            this.btnClose.addEventListener('click', (e) => {
                e.stopPropagation();
                this.closeDrawer();
            });
        }

        // Overlay click closes drawer
        if (this.overlay) {
            this.overlay.addEventListener('click', () => this.closeDrawer());
        }

        // Close drawer on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isDrawerOpen) {
                this.closeDrawer();
            }
        });

        // Close drawer when clicking outside on mobile
        document.addEventListener('click', (e) => {
            if (this.isDrawerOpen && 
                !this.drawer.contains(e.target) && 
                e.target !== this.btnOpen &&
                !this.btnOpen.contains(e.target)) {
                this.closeDrawer();
            }
        });
    },

    navigateTo(viewName) {
        if (!viewName) return;

        // Hide all views
        this.viewContainers.forEach(container => {
            container.classList.remove('active');
        });

        // Show target view
        const target = document.getElementById(`view-${viewName}`);
        if (target) {
            target.classList.add('active');
        }

        // Update nav active state
        this.navLinks.forEach(link => {
            const item = link.closest('.nav-item');
            if (item) {
                if (link.dataset.view === viewName) {
                    item.classList.add('active');
                    link.setAttribute('aria-current', 'page');
                } else {
                    item.classList.remove('active');
                    link.removeAttribute('aria-current');
                }
            }
        });

        this.currentView = viewName;
        
        // Close drawer after navigation (especially important on mobile)
        this.closeDrawer();
        
        EventBus.emit(EVENTS.VIEW_CHANGED, { view: viewName });
    },

    openDrawer() {
        if (!this.drawer) return;
        this.drawer.classList.add('open');
        if (this.overlay) this.overlay.classList.add('visible');
        this.isDrawerOpen = true;
        document.body.style.overflow = 'hidden';
    },

    closeDrawer() {
        if (!this.drawer) return;
        this.drawer.classList.remove('open');
        if (this.overlay) this.overlay.classList.remove('visible');
        this.isDrawerOpen = false;
        document.body.style.overflow = '';
    }
};

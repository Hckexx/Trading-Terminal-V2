/* ==========================================================================
   TRADETERMINAL V2 — Router
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
    },

    bindEvents() {
        // Navigation links
        this.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const view = link.dataset.view;
                if (view) this.navigateTo(view);
            });
        });

        // Buttons with data-view attribute (cross-navigation)
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-view]');
            if (btn && !btn.closest('.nav-link')) {
                const view = btn.dataset.view;
                if (view) this.navigateTo(view);
            }
        });

        // Drawer toggle
        document.getElementById('btnDrawerOpen')?.addEventListener('click', () => this.openDrawer());
        document.getElementById('btnDrawerClose')?.addEventListener('click', () => this.closeDrawer());
        this.overlay?.addEventListener('click', () => this.closeDrawer());

        // Close drawer on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeDrawer();
        });
    },

    navigateTo(viewName) {
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
                item.classList.toggle('active', link.dataset.view === viewName);
            }
        });

        this.currentView = viewName;
        this.closeDrawer();
        EventBus.emit(EVENTS.VIEW_CHANGED, { view: viewName });
    },

    openDrawer() {
        this.drawer?.classList.add('open');
        this.overlay?.classList.add('visible');
        document.body.style.overflow = 'hidden';
    },

    closeDrawer() {
        this.drawer?.classList.remove('open');
        this.overlay?.classList.remove('visible');
        document.body.style.overflow = '';
    }
};

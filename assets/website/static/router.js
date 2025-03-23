class Router {
	constructor(routes, protectedPaths) {
		this.routes = routes;
		this.protectedPaths = protectedPaths;
		this.currentPath = '';
		this.initialized = false;
		
		this.handleRoute = this.handleRoute.bind(this);
		
		window.addEventListener('popstate', this.handleRoute);
	}

	async initialize() {
		console.log('Initializing router...');
		this.initialized = true;
		await this.handleRoute();
	}

	_extractParams(path, routePath) {
		const routeParts = routePath.split('/');
		const pathParts = path.split('/');
		
		if (routeParts.length !== pathParts.length) return null;
		
		const params = {};
		for (let i = 0; i < routeParts.length; i++) {
			if (routeParts[i].startsWith(':')) {
				const paramName = routeParts[i].slice(1);
				params[paramName] = pathParts[i];
			} else if (routeParts[i] !== pathParts[i]) {
				return null;
			}
		}
		return params;
	}

	async handleRoute() {
		if (!this.initialized) {
			console.log('Router not initialized yet, skipping route handling');
			return;
		}

		const path = window.location.pathname;
		const search = window.location.search;
		
		console.log('Router.handleRoute:', {
			path,
			search,
			protectedPaths: this.protectedPaths
		});

		// If we have a code parameter, don't interfere with the auth flow
		if (search.includes('code=')) {
			console.log('Detected authentication callback, skipping protection check');
			const route = this.routes[path] || this.routes['/'];
			route();
			return;
		}

		// Find matching route with parameters
		let matchedRoute = null;
		let params = {};
		
		for (const [routePath, handler] of Object.entries(this.routes)) {
			const extractedParams = this._extractParams(path, routePath);
			if (extractedParams !== null) {
				matchedRoute = handler;
				params = extractedParams;
				break;
			}
		}

		if (!matchedRoute) {
			matchedRoute = this.routes['/404'];
		}

		// Check protection
		const isProtected = this.protectedPaths.some(protectedPath => path.startsWith(protectedPath));
		const authenticated = await isAuthenticated();

		if (isProtected && !authenticated) {
			sessionStorage.setItem('redirectAfterLogin', path);
			if (path !== '/login') {
				this.navigateTo('/login');
				return;
			}
		}

		await matchedRoute(params);
/*
		// Wait for credentials to be restored before checking protection
		await restoreCredentials();

		// If we have a code parameter, don't interfere with the auth flow
		if (search.includes('code=')) {
			console.log('Detected authentication callback, skipping protection check');
			this.currentPath = path;
			const route = this.routes[path] || this.routes['/'];
			route();
			return;
		}
		this.currentPath = path;
		
		// Check if this is a protected path
		const isProtected = this.protectedPaths.some(protectedPath => path.startsWith(protectedPath));
		const authenticated = await isAuthenticated();

		console.log('Route protection check:', {
			path,
			isProtected,
			authenticated,
			hasCredentials: !!AWS.config.credentials
		});

		if (isProtected && !authenticated) {
			console.log('Protected path accessed without authentication');
			sessionStorage.setItem('redirectAfterLogin', path);
			if (path !== '/login') {
				console.log('Redirecting to login page');
				this.navigateTo('/login');
				return;
			}
		}

		const route = this.routes[path] || this.routes['/404'];
		route();
*/
	}

	async navigateTo(path, options = {}) {
		console.log('Router.navigateTo:', {
			path,
			options,
			currentPath: window.location.pathname
		});

		if (path === window.location.pathname) {
			console.log('Already at requested path, skipping navigation');
			return;
		}

		window.history.pushState({}, '', path);
		await this.handleRoute();
	}
}
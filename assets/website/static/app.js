const config = {
	userPoolId: 'us-east-1_Oh8qJuwnK',
	clientId: '5hpv7femdk6arh0ks2q6gq9aqs',
	identityPoolId: 'us-east-1:8ee4c22b-56fd-44b4-a534-4943cd56e9bf',
	region: 'us-east-1',
	bucketName: 'comicsitestack-comicbucketbe13ddd0-5d9zehqeknat',
	cognitoDomain: 'https://whatacomicallife-06079590.auth.us-east-1.amazoncognito.com',
};

let router;

// Initialize router with protected paths
function initializeRouter() {
	return new Router({
		// Public routes
		'/': async () => {
			showPage('comicViewSection');
			await displayComics({ page: 1 });
		},
		'/comics': async () => {
			showPage('comicViewSection');
			await displayComics({ page: 1 });
		},
		'/comics/:page': async (params) => {
			showPage('comicViewSection');
			await displayComics({ page: parseInt(params.page) });
		},
		'/tags/:tag': async (params) => {
			showPage('comicViewSection');
			await displayComics({ page: 1, tag: params.tag });
		},
		'/tags/:tag/:page': async (params) => {
			showPage('comicViewSection');
			await displayComics({ 
				page: parseInt(params.page), 
				tag: params.tag 
			});
		},

		// Auth routes
		'/login': () => showPage('loginSection'),
		'/upload': () => showPage('uploadSection'),

		// 404 fallback
		'/404': () => showPage('notFoundSection')
	}, [  // List of paths that require authentication
		'/upload'
	]);
}

function showPage(pageId) {
	// Hide all pages
	document.querySelectorAll('.page').forEach(page => {
		console.log(`Hiding page: ${page.id || ''}`);
		page.style.display = 'none';
	});

	// Show requested page if it exists
	const pageElement = document.getElementById(pageId);
	if (pageElement) {
		pageElement.style.display = 'block';
	} else {
		console.warn(`Page element ${pageId} not found`);
	}
}

async function isAuthenticated() {
	console.log('Checking authentication status...');

	try {
		// First try to restore credentials if needed
		if (!AWS.config.credentials) {
			const restored = await restoreCredentials();
			if (!restored) {
				console.log('Could not restore credentials');
				return false;
			}
		}

		// If credentials need refresh, try to refresh them
		if (AWS.config.credentials.needsRefresh()) {
			console.log('Credentials need refresh, attempting to refresh...');
			try {
				await AWS.config.credentials.refreshPromise();
				console.log('Credentials refreshed successfully');
			} catch (refreshError) {
				console.error('Failed to refresh credentials:', refreshError);
				return false;
			}
		}

		const hasIdentityId = !!AWS.config.credentials.identityId;
		console.log('Authentication check complete:', {
			hasIdentityId,
			expired: AWS.config.credentials.expired,
			identityId: AWS.config.credentials.identityId
		});

		return hasIdentityId && !AWS.config.credentials.expired;
	} catch (error) {
		console.error('Error checking authentication:', error);
		return false;
	}
}

// Redirect to Cognito's hosted UI to handle login
function login() {
	console.log('Starting login process...');

	// Log current window location details
	console.log('Current location:', {
		origin: window.location.origin,
		pathname: window.location.pathname,
		href: window.location.href
	});

	const redirectUri = `${window.location.origin}`;

	// Store the current path for post-login redirect
	const currentPath = window.location.pathname;
	if (currentPath !== '/' && currentPath !== '/login') {
		sessionStorage.setItem('redirectAfterLogin', currentPath);
	}

	// Construct login URL with detailed logging
	const loginParams = {
		client_id: config.clientId,
		response_type: 'code',
		scope: 'openid email profile',
		redirect_uri: redirectUri
	};

	console.log('Login parameters:', loginParams);

	const loginUrl = `${config.cognitoDomain}/oauth2/authorize?` +
		Object.entries(loginParams)
			.map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
			.join('&');

	console.log('Final Cognito login URL:', loginUrl);

	// Log the current config
	console.log('Current config:', {
		userPoolId: config.userPoolId,
		clientId: config.clientId,
		cognitoDomain: config.cognitoDomain,
		region: config.region
	});

	// Use window.location.replace to prevent the browser from keeping the /login page in history
	console.log('Redirecting to Cognito login:', loginUrl);
	window.location.replace(loginUrl);
}


function logout() {
	// Clear AWS credentials
	AWS.config.credentials.clearCachedId();

	// Clear session storage
	sessionStorage.clear();

	// Construct the Cognito logout URL
	const logoutUrl = `${config.cognitoDomain}/logout?` +
		`client_id=${config.clientId}&` +
		`logout_uri=${encodeURIComponent(window.location.origin)}`;

	// Redirect to Cognito's logout endpoint
	window.location.href = logoutUrl;
}

async function exchangeCodeForTokens(code) {
	const redirectUri = window.location.origin;
	const tokenEndpoint = `${config.cognitoDomain}/oauth2/token`;

	const params = new URLSearchParams();
	params.append('grant_type', 'authorization_code');
	params.append('client_id', config.clientId);
	params.append('code', code);
	params.append('redirect_uri', redirectUri);

	const response = await fetch(tokenEndpoint, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
		},
		body: params
	});

	if (!response.ok) {
		throw new Error('Failed to exchange code for tokens');
	}

	return response.json();
}

// Add a function to handle the redirect back from Cognito
async function handleAuth() {
	const urlParams = new URLSearchParams(window.location.search);
	const code = urlParams.get('code');
	console.log('handleAuth called:', {
		hasCode: !!code,
		currentPath: window.location.pathname,
		fullUrl: window.location.href
	});

	if (code) {
		try {
			console.log('Attempting to exchange code for tokens...');
			const tokens = await exchangeCodeForTokens(code);
			console.log('Received tokens:', {
				idToken: tokens.id_token ? 'present' : 'missing',
				accessToken: tokens.access_token ? 'present' : 'missing'
			});

			// Store tokens in sessionStorage
			sessionStorage.setItem('idToken', tokens.id_token);
			sessionStorage.setItem('accessToken', tokens.access_token);
			sessionStorage.setItem('refreshToken', tokens.refresh_token);

			// Configure AWS SDK with Cognito credentials
			console.log('Configuring AWS credentials...');
			AWS.config.region = config.region;
			AWS.config.credentials = new AWS.CognitoIdentityCredentials({
				IdentityPoolId: config.identityPoolId,
				Logins: {
					[`cognito-idp.${config.region}.amazonaws.com/${config.userPoolId}`]: tokens.id_token
				}
			});

			// Refresh credentials
			console.log('Refreshing AWS credentials...');
			await AWS.config.credentials.getPromise();
			console.log('AWS credentials refreshed successfully:', {
				identityId: AWS.config.credentials.identityId,
				expired: AWS.config.credentials.expired
			});

			// Remove the code from the URL
			window.history.replaceState({}, document.title, window.location.pathname);

			// Update UI
			await updateAuthUI();

			// Handle redirect
			const redirectPath = sessionStorage.getItem('redirectAfterLogin');
			console.log('Handling post-login redirect:', { redirectPath });

			if (redirectPath) {
				sessionStorage.removeItem('redirectAfterLogin');
				router.navigateTo(redirectPath);
			} else {
				router.navigateTo('/');
			}
		} catch (err) {
			console.error('Authentication error:', err);
			alert('Authentication error: ' + err.message);
			router.navigateTo('/login');
		}
	} else {
		console.log('No authorization code present in URL');
	}
}

async function updateAuthUI() {
	const uploadLink = document.getElementById('uploadLink');
	const logoutButton = document.getElementById('logoutButton');
	const authStatus = document.getElementById('authStatus');

	const authenticated = await isAuthenticated();
	console.log('Updating UI with auth status:', authenticated);

	if (authenticated) {
		uploadLink.style.display = 'inline';
		logoutButton.style.display = 'inline';
		authStatus.textContent = 'Auth Status: Logged In';
		authStatus.style.backgroundColor = '#90EE90';
	} else {
		uploadLink.style.display = 'none';
		logoutButton.style.display = 'none';
		authStatus.textContent = 'Auth Status: Not Logged In';
		authStatus.style.backgroundColor = '#FFB6C1';
	}
}

async function restoreCredentials() {
	const idToken = sessionStorage.getItem('idToken');

	if (idToken) {
		console.log('Restoring credentials from session...');

		// Check if credentials already exist and are valid
		if (AWS.config.credentials && !AWS.config.credentials.expired && AWS.config.credentials.identityId) {
			console.log('Valid credentials already exist');
			return true;
		}

		AWS.config.region = config.region;
		AWS.config.credentials = new AWS.CognitoIdentityCredentials({
			IdentityPoolId: config.identityPoolId,
			Logins: {
				[`cognito-idp.${config.region}.amazonaws.com/${config.userPoolId}`]: idToken
			}
		});

		try {
			await AWS.config.credentials.getPromise();
			console.log('Credentials restored successfully:', {
				identityId: AWS.config.credentials.identityId,
				expired: AWS.config.credentials.expired
			});
			return true;
		} catch (error) {
			console.error('Failed to restore credentials:', error);
			sessionStorage.clear();
			return false;
		}
	}
	console.log('No stored credentials found');
	return false;
}

async function fetchComics({ page = 1, tag = null } = {}) {
	console.log(`Fetching comics...`, { page, tag });
	try {
		// Construct URL with query parameters
		const queryParams = new URLSearchParams({
			page: page.toString()
		});

		// Only add tag parameter if it exists
		if (tag) {
			queryParams.append('tag', tag);
		}

		const url = `/api/getComics?${queryParams.toString()}`;
		console.log('Fetching from URL:', url);

		const response = await fetch(url);
		console.log('Raw response:', response);
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data = await response.json();
		console.log('Parsed response data:', data);

		// Ensure we return a properly structured response
		return {
			items: data?.items || [],
			hasNextPage: data?.hasNextPage || false,
			page: data?.page || page
		};
	} catch (error) {
		console.error('Error fetching comics:', error);
		return {
			items: [],
			hasNextPage: false,
			page: page
		};
	}
}

async function displayComics({ page = 1, tag = null } = {}) {
	console.log('displayComics called with:', { page, tag });
	const comicDisplay = document.getElementById('comicDisplay');
	const errorDisplay = document.getElementById('comicError');

	// Show loading state
	comicDisplay.innerHTML = `
		<div class="comic-loading">
			<p>Loading comics...</p>
		</div>
	`;
	errorDisplay.style.display = 'none';

	try {
		console.log('Calling fetchComics...');
		const response = await fetchComics({ page, tag });
		console.log('fetchComics response:', response);

		// Check if response is valid and has the expected structure
		if (!response || !response.items) {
			console.error('Invalid response structure:', response);
			throw new Error('Invalid response from server');
		}

		if (response.items.length === 0) {
			console.log('No comics found');
			comicDisplay.innerHTML = `
				<div class="comic-loading">
					<p>No comics found${tag ? ` for tag "${tag}"` : ''}.</p>
				</div>
			`;
			return;
		}

		// Display comics
		console.log(`Rendering ${response.items.length} comics...`);
		const comicHtml = response.items.map(comic => `
			<div class="comic-entry" data-style="${comic.scrollStyle || 'long'}">
				<h3>${comic.title}</h3>
				<p>${comic.caption}</p>
				<div class="comic-images">
					${comic.images.map(image => {
						return `
							<img 
								src="/api/images/comic/${image.key}"
								alt="${image.altText || ''}"
								loading="lazy"
							>
						`;
					}).join('')}
				</div>
				<div class="comic-metadata">
					<span>Posted: ${new Date(comic.postedTimestamp).toLocaleDateString()}</span>
					${comic.tags ? `
						<span>Tags: ${comic.tags.map(t => 
							`<a href="/tags/${encodeURIComponent(t)}">${t}</a>`
						).join(', ')}</span>
					` : ''}
				</div>
			</div>
		`).join('');

		// Add pagination controls
		const paginationHtml = `
			<div class="pagination">
				${page > 1 ? `
					<a href="${tag ? `/tags/${tag}/${page-1}` : `/comics/${page-1}`}" 
					   class="prev-page">Previous Page</a>
				` : ''}
				${response.hasNextPage ? `
					<a href="${tag ? `/tags/${tag}/${page+1}` : `/comics/${page+1}`}" 
					   class="next-page">Next Page</a>
				` : ''}
			</div>
		`;

		comicDisplay.innerHTML = comicHtml + paginationHtml;

	} catch (error) {
		console.error('Error displaying comics:', error);
		errorDisplay.style.display = 'block';
		errorDisplay.innerHTML = `
			<p>Sorry, there was an error loading the comics. Please try again later.</p>
			<button onclick="displayComics({page: ${page}${tag ? `, tag: '${tag}'` : ''})">Retry</button>
		`;
		comicDisplay.innerHTML = '';
	}
}

// Call handleAuth when the page loads
window.onload = async () => {
	// Create router instance
	router = initializeRouter();

	// Try to restore credentials first
	await restoreCredentials();

	// Initialize router after credentials are restored
	await router.initialize();

	// Then handle any auth callback
	await handleAuth();

	// Update UI
	await updateAuthUI();
};
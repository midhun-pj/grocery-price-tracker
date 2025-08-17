class AuthServer {
    constructor() {
        this.apiUrl = '/api/auth/';
        this.headers = { 'Content-Type': 'application/json' };
        this.authType = 'signin'; // 'signin' or 'signup'
        this.elements = this.pageElements();

        this.init();
    }

    pageElements() {
        return {
            username: document.getElementById('username'),
            password: document.getElementById('password'),
            errorBlock: document.getElementById('err'),
            formElement: document.getElementById('loginForm'),
            loginButton: document.getElementById('loginBtn'),
            pageHeading: document.getElementById('page-heading'),
            toggleLink: document.getElementById('toggle-auth')
        }
    }

    init() {
        this.initEventListeners();
        this.updateUI();
    }

    updateUI(clearError = true) {
        if (this.authType === 'signin') {
            this.elements.pageHeading.textContent = 'Signin';
            this.elements.loginButton.textContent = 'Signin';
            this.elements.toggleLink.innerHTML = `Don't have an account? <span class="toggle-text">Sign up</span>`;
        } else {
            this.elements.pageHeading.textContent = 'Create your account';
            this.elements.loginButton.textContent = 'Sign Up';
            this.elements.toggleLink.innerHTML = `Already have an account? <span class="toggle-text">Sign in</span>`;
        }

        if(clearError) {

            this.clearError();
        }
    }

    async signinUser(data) {
        try {
            const response = await fetch(`${this.apiUrl}login`, {
                headers: this.headers,
                method: 'POST',
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Login failed');
            }

            return result;
        } catch (error) {
            console.error('Login failed:', error);
            this.showError(error.message || 'Login failed');
            throw error;
        }
    }

    async signupUser(data) {
        try {
            const response = await fetch(`${this.apiUrl}register`, {
                headers: this.headers,
                method: 'POST',
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Signup failed');
            }

            return result;
        } catch (error) {
            console.error('Signup failed:', error);
            this.showError(error.message || 'Signup failed');
            throw error;
        }
    }

    showError(message) {
        this.elements.errorBlock.textContent = message;
        this.elements.errorBlock.style.display = 'block';
    }

    clearError() {
        this.elements.errorBlock.textContent = '';
        this.elements.errorBlock.style.display = 'none';
    }

    validateInput(username, password) {
        if (!username) {
            this.showError('Username is required');
            return false;
        }
        if (!password) {
            this.showError('Password is required');
            return false;
        }
        if (password.length < 6) {
            this.showError('Password must be at least 6 characters long');
            return false;
        }
        return true;
    }

    async handleSubmit() {
        const username = this.elements.username.value.trim();
        const password = this.elements.password.value.trim();

        if (!this.validateInput(username, password)) {
            return;
        }

        try {
            this.elements.loginButton.disabled = true;
            this.elements.loginButton.textContent = this.authType === 'signin' ? 'Signing in...' : 'Creating account...';

            let result;
            if (this.authType === 'signin') {
                result = await this.signinUser({ username, password });
                localStorage.setItem('token', result.token);
                window.location.href = 'index.html';
            } else {
                result = await this.signupUser({ username, password });
                // After successful signup, you might want to automatically sign them in
                // or show a success message and switch to signin
                this.authType = 'signin';
                this.updateUI();
                this.elements.username.value = '';
                this.elements.password.value = '';
                this.showError('Account created successfully! Please sign in.');
                this.elements.errorBlock.style.color = 'green';
            }
        } catch (error) {
            // Error is already handled in the respective methods
        } finally {
            this.elements.loginButton.disabled = false;
            this.updateUI(false);
        }
    }

    toggleAuthType() {
        this.authType = this.authType === 'signin' ? 'signup' : 'signin';
        this.updateUI();
        this.elements.username.value = '';
        this.elements.password.value = '';
    }

    async initEventListeners() {
        // Handle form submission
        this.elements.formElement.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleSubmit();
        });

        // Handle button click
        this.elements.loginButton.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopImmediatePropagation();
            await this.handleSubmit();
        });

        // Handle Enter key press
        this.elements.username.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleSubmit();
            }
        });

        this.elements.password.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleSubmit();
            }
        });

        // Handle toggle between signin/signup
        this.elements.toggleLink.addEventListener('click', (e) => {
            if (e.target.classList.contains('toggle-text')) {
                this.toggleAuthType();
            }
        });

        // Clear error when user starts typing
        this.elements.username.addEventListener('input', () => this.clearError());
        this.elements.password.addEventListener('input', () => this.clearError());
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    new AuthServer();
});

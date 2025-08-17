class GroceryItemForm {
    constructor() {
        this.form = document.getElementById('addGroceryForm');
        this.loadingState = false;
        this.apiService = new ApiService();

        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.setDefaultDate();
        await this.loadSupermarkets();
    }

    setupEventListeners() {
        // Form submission
        this.form.addEventListener('submit', this.handleSubmit.bind(this));

        // Back button
        document.getElementById('backButton').addEventListener('click', this.handleBack.bind(this));

        // Input validation
        this.setupInputValidation();
    }

    setupInputValidation() {
        const inputs = this.form.querySelectorAll('.form-input, .form-select');
        inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => this.clearFieldError(input));
        });
    }

    setDefaultDate() {
        const dateInput = document.getElementById('date');
        dateInput.value = new Date().toISOString().split('T')[0];
    }

    async loadSupermarkets() {
        try {
            const supermarkets = await this.apiService.getSupermarkets();
            this.populateSupermarketSelect(supermarkets);
        } catch (error) {
            console.error('Failed to load supermarkets:', error);
            this.showError('Failed to load supermarkets. Please try again.');
        }
    }

    populateSupermarketSelect(supermarkets) {
        const select = document.getElementById('supermarket');

        // Clear existing options except the first one
        select.innerHTML = '<option value="">Select Supermarket</option>';

        supermarkets.forEach(supermarket => {
            const option = document.createElement('option');
            option.value = supermarket.id;
            option.textContent = supermarket.name;
            select.appendChild(option);
        });
    }

    validateField(field) {
        const value = field.value.trim();
        let isValid = true;
        let errorMessage = '';

        // Clear previous errors
        this.clearFieldError(field);

        // Required field validation
        if (field.hasAttribute('required') && !value) {
            isValid = false;
            errorMessage = 'This field is required';
        }

        // Specific field validations
        switch (field.id) {
            case 'quantity':
            case 'price':
                if (value && parseFloat(value) <= 0) {
                    isValid = false;
                    errorMessage = 'Value must be greater than 0';
                }
                break;
            case 'itemName':
                if (value && value.length < 2) {
                    isValid = false;
                    errorMessage = 'Item name must be at least 2 characters';
                }
                break;
        }

        if (!isValid) {
            this.showFieldError(field, errorMessage);
        }

        return isValid;
    }

    showFieldError(field, message) {
        field.classList.add('error');

        // Remove existing error message
        const existingError = field.parentNode.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }

        // Add new error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        field.parentNode.appendChild(errorDiv);
    }

    clearFieldError(field) {
        field.classList.remove('error');
        const errorMessage = field.parentNode.querySelector('.error-message');
        if (errorMessage) {
            errorMessage.remove();
        }
    }

    validateForm() {
        const fields = this.form.querySelectorAll('.form-input[required], .form-select[required]');
        let isValid = true;

        fields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });

        return isValid;
    }

    getFormData() {
        const dateOb = new Date(document.getElementById('date').value);

        return {
            name: document.getElementById('itemName').value.trim(),
            quantity: parseFloat(document.getElementById('quantity').value),
            unit: document.getElementById('unit').value,
            price: parseFloat(document.getElementById('price').value),
            date: this.formatDateToISO(dateOb),
            supermarket_id: parseInt(document.getElementById('supermarket').value, 10)
        };
    }

    setLoadingState(loading) {
        this.loadingState = loading;
        const submitBtn = this.form.querySelector('.submit-btn');

        if (loading) {
            this.form.classList.add('loading');
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';
            submitBtn.disabled = true;
        } else {
            this.form.classList.remove('loading');
            submitBtn.innerHTML = 'Add Item';
            submitBtn.disabled = false;
        }
    }

    showSuccessScreen(message = 'Item Added Successfully!', description = 'Redirecting you back to the dashboard...') {
        const addContainer = document.getElementById('addContainer');
        const successScreen = document.getElementById('successScreen');

        // Update the success screen content
        const successTitle = successScreen.querySelector('h2');
        const successDescription = successScreen.querySelector('p');

        if (successTitle) successTitle.textContent = message;
        if (successDescription) successDescription.textContent = description;

        // Hide the add container
        addContainer.classList.add('hidden');

        // Show success screen
        successScreen.style.display = 'flex';
    }

    async handleSubmit(e) {
        e.preventDefault();

        if (this.loadingState) return;

        if (!this.validateForm()) {
            this.showError('Please fix the errors above');
            return;
        }

        // Show success screen immediately with "submitting" message
        this.showSuccessScreen('Submitting Form...', 'Please wait while we add your item...');

        try {
            const formData = this.getFormData();
            await this.apiService.addGroceryItem(formData);

            // Update success screen to show success message
            setTimeout(() => {
                this.showSuccessScreen('Item Added Successfully!', 'Redirecting you back to the dashboard...');

                // Redirect after showing success message for 2 seconds
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);
            }, 1000); // Show submitting message for 1 second

        } catch (error) {
            console.error('Failed to add item:', error);

            // Hide success screen and show error
            const addContainer = document.getElementById('addContainer');
            const successScreen = document.getElementById('successScreen');

            successScreen.style.display = 'none';
            addContainer.classList.remove('hidden');

            this.showError('Failed to add item. Please try again.');
            this.setLoadingState(false);
        }
    }

    handleBack() {
        if (this.hasUnsavedChanges()) {
            if (confirm('You have unsaved changes. Are you sure you want to go back?')) {
                window.location.href = 'index.html';
            }
        } else {
            window.location.href = 'index.html';
        }
    }

    hasUnsavedChanges() {
        const inputs = this.form.querySelectorAll('.form-input, .form-select');
        return Array.from(inputs).some(input => {
            if (input.type === 'date') {
                return input.value !== new Date().toISOString().split('T')[0];
            }
            return input.value.trim() !== '';
        });
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showNotification(message, type) {
        // Remove existing notifications
        const existing = document.querySelector('.notification');
        if (existing) existing.remove();

        const notification = document.createElement('div');
        notification.className = `notification notification--${type}`;
        notification.textContent = message;

        document.body.appendChild(notification);

        // Auto remove after 3 seconds
        setTimeout(() => {
            if (notification && notification.parentNode) {
                notification.remove();
            }
        }, 3000);
    }

    formatDateToISO(dateObj) {
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0'); // months are zero-based
        const day = String(dateObj.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
}

class ApiService {
    constructor() {
        this.baseUrl = '/api';
        this.token = localStorage.getItem('token');

        if (!this.token) {
            window.location.href = 'login.html';
            return;
        }

        this.headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.token}`
        };
    }

    async getSupermarkets() {
        const response = await fetch(`${this.baseUrl}/supermarkets`, {
            method: 'GET',
            headers: this.headers
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    }

    async addGroceryItem(itemData) {
        const response = await fetch(`${this.baseUrl}/grocery-items`, {
            method: 'POST',
            headers: this.headers,
            body: JSON.stringify(itemData)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    }
}

// Initialize the form when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new GroceryItemForm();
});

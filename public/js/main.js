const token = localStorage.getItem('token');
if (!token) location.href = 'login.html';

const headers = { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token };

function formatDisplayDate(isoDate) {
  // Convert YYYY-MM-DD to DD/MM/YYYY for display
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
}

class Grocery {
  constructor() {
    this.apiUrl = '/api/grocery-items';
  }

  async fetchGroceries(page = 1, limit = 20, search = '') {
    try {
      const url = new URL(this.apiUrl, window.location.origin);

      url.searchParams.append('page', page);
      url.searchParams.append('limit', limit);

      if (search) {
        url.searchParams.append('search', search);
      }


      const res = await fetch(url.toString(), { headers });
      return await res.json();
    } catch (error) {
      console.error('Error fetching items:', error);
    }
  }

  async addItem(item) {
    await fetch(this.apiUrl, { method: 'POST', headers, body: JSON.stringify(item) });
  }

  async deleteItem(id) {
    await fetch(`${this.apiUrl}/${id}`, { method: 'DELETE', headers });
  }
}

class Dashboard {

  constructor() {
    this.api = new Grocery();

    this.currentPage = 1;
    this.itemsPerPage = 20;
    this.isLoading = false;
    this.hasMoreData = true;
    this.searchQuery = '';
    this.searchTimeout = null;

    this.isLoading = false;
    this.elements = this.initializeElements();

    this.groceryItems = [];

    this.init();
  }

  setupEventListeners() {
    // Infinite scroll
    window.addEventListener('scroll', (ev) => this.handleScroll(ev));

    this.elements.searchInput.addEventListener('input', (e) => this.handleSearch(e));

    this.elements.backButton.addEventListener('click', () => {
      this.hideDetailPage();
    });

    // Pull to refresh (optional)
    window.addEventListener('touchstart', this.handleTouchStart.bind(this));
    window.addEventListener('touchmove', this.handleTouchMove.bind(this));
    window.addEventListener('touchend', this.handleTouchEnd.bind(this));
  }

  handleScroll() {
    if (this.isLoading || !this.hasMoreData) return;

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;

    // Load more when user scrolls to within 100px of bottom
    if (scrollTop + windowHeight >= documentHeight - 100) {
      this.loadMoreData();
    }
  }

  handleSearch(e) {
    clearTimeout(this.searchTimeout);

    this.searchTimeout = setTimeout(() => {
      const query = e.target.value.trim();
      if (query !== this.searchQuery) {
        this.searchQuery = query;
        this.resetAndReload();
      }
    }, 300);
  }

  // Pull to refresh functionality (optional)
  handleTouchStart(e) {
    this.touchStartY = e.touches[0].clientY;
  }


  handleTouchMove(e) {
    if (!this.touchStartY) return;

    this.touchCurrentY = e.touches.clientY;
    const touchDiff = this.touchCurrentY - this.touchStartY;

    // If user pulls down at the top of the page
    if (window.scrollY === 0 && touchDiff > 0) {
      e.preventDefault();
    }
  }

  async handleTouchEnd(e) {
    if (!this.touchStartY || !this.touchCurrentY) return;

    const touchDiff = this.touchCurrentY - this.touchStartY;

    // If pulled down more than 100px and at top of page
    if (window.scrollY === 0 && touchDiff > 100) {
      await this.resetAndReload();
    }

    this.touchStartY = null;
    this.touchCurrentY = null;
  }

  async loadMoreData() {
    if (this.isLoading || !this.hasMoreData) return;

    this.showLoading(true);
    this.currentPage++;

    try {
      const data = await this.api.fetchGroceries(this.currentPage, this.itemsPerPage, this.searchQuery);
      this.processApiResponse(data, false);
    } catch (error) {
      this.showError('Failed to load more items');
      this.currentPage--; // Rollback page increment
      console.error('Error loading more data:', error);
    } finally {
      this.showLoading(false);
    }
  }

  async loadInitialData() {
    this.showLoading(true);

    try {
      const data = await this.api.fetchGroceries(this.currentPage, this.itemsPerPage, this.searchQuery);
      this.processApiResponse(data, true);
    } catch (error) {
      this.showError('Failed to load grocery items');
      console.error('Error loading initial data:', error);
    } finally {
      this.showLoading(false);
    }
  }

  processApiResponse(data, isInitial = false) {
    const { data: items, pagination } = data;

    if (isInitial) {
      this.groceryItems = items;
      this.elements.groceryList.innerHTML = '';
    } else {
      this.groceryItems.push(...items);
    }

    // Update pagination state
    this.hasMoreData = pagination.hasNextPage;
    this.currentPage = pagination.currentPage;

    // Render items
    if (isInitial && items.length === 0) {
      this.showEmptyState(true);
    } else {
      this.showEmptyState(false);
      if (!isInitial) {
        this.renderItems(items); // Only render new items
      } else {
        this.renderItems(this.groceryItems); // Render all items
      }
    }

    // Show/hide no more data message
    if (!this.hasMoreData && this.groceryItems.length > 0) {
      this.handleVisibilityOfElements(this.elements.noMoreData, 'flex');
    } else {
      this.handleVisibilityOfElements(this.elements.noMoreData, 'none');
    }
  }

  renderItems(items) {
    const fragment = document.createDocumentFragment();

    items.forEach(item => {
      const itemElement = this.createGroceryItemElement(item);
      fragment.appendChild(itemElement);
    });

    this.elements.groceryList.appendChild(fragment);
  }

  createGroceryItemElement(item) {
    const div = document.createElement('div');
    div.className = 'grocery-card fade-in';
    div.innerHTML = `
            <div class="grocery-icon">
                <i class="${this.getGroceryIcon(item.name)}"></i>
            </div>
            <div class="grocery-name">${item.name}</div>
            <div class="grocery-info">
              <span class="grocery-price">€${parseFloat(item.price).toFixed(2)}</span>
              <span class="grocery-quantity">${item.quantity} ${item.unit}</span>
            </div>
            <div class="grocery-store">${item.supermarket}</div>
            <div class="grocery-date">${formatDisplayDate(item.date)}</div>
        `;

    // Add click event for item details
    div.addEventListener('click', () => this.showItemDetail(item.id));

    return div;
  }

  async resetAndReload() {
    this.currentPage = 1;
    this.hasMoreData = true;
    this.groceryItems = [];
    this.elements.groceryList.innerHTML = '';
    this.handleVisibilityOfElements(this.elements.noMoreData, 'none');

    await this.loadInitialData();
  }


  showEmptyState(show) {
    if (show) {
      this.handleVisibilityOfElements(this.elements.emptyState, 'block');
      this.handleVisibilityOfElements(this.elements.groceryList, 'none');
    } else {
      this.handleVisibilityOfElements(this.elements.emptyState, 'none');
      this.handleVisibilityOfElements(this.elements.groceryList, 'grid');
    }
  }

  showError(message) {
    // You could implement a toast notification here
    console.error(message);
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });
  }

  initializeElements() {
    return {
      groceryList: document.getElementById('groceryGrid'),
      loadingSpinner: document.getElementById('loadingSpinner'),
      noMoreData: document.getElementById('noMoreData'),
      emptyState: document.getElementById('emptyState'),
      searchInput: document.getElementById('searchInput'),
      itemDetail: document.getElementById('item-detail-view'),
      dashboard: document.getElementById('dashboard-view'),
      backButton: document.querySelector('.back-btn')
    };
  }

  async init() {
    this.setupEventListeners();
    await this.loadInitialData();
  }

  showDashboard(show) {
    if (show) {
      this.handleVisibilityOfElements(this.elements.dashboard, 'block');
    } else {
      this.handleVisibilityOfElements(this.elements.dashboard, 'none');
    }
  }

  async showItemDetail(itemId) {

    try {

      const res = await fetch(`/api/grocery-items/${itemId}`, { headers });

      if (!res.ok) {
        throw new Error('Item not found');
      }

      const { currentItem, history, statistics } = await res.json();

      // Show detail view
      this.showDashboard(false);
      this.handleVisibilityOfElements(this.elements.itemDetail, 'block');
      this.handleVisibilityOfElements(this.elements.backButton, 'flex');

      // Populate item details
      document.getElementById('itemIconLarge').innerHTML = `<i class="${this.getGroceryIcon(currentItem.name)}"></i>`;
      document.getElementById('itemTitle').textContent = currentItem.name;
      document.getElementById('currentPrice').textContent = `€${currentItem.price}`;

      // Use pre-calculated statistics
      document.getElementById('avgPrice').textContent = `€${statistics.avgPrice}`;
      document.getElementById('totalPurchases').textContent = statistics.totalPurchases;

      // Render history
      const historyContainer = document.getElementById('historyContainer');
      historyContainer.innerHTML = history.map(h => `
      <div class="history-item fade-in">
        <div class="history-info">
          <div class="history-store">${h.supermarket}</div>
          <div class="history-date">${h.date} • ${h.quantity} ${h.unit}</div>
        </div>
        <div class="history-price">€${h.price}</div>
      </div>
    `).join('');

    } catch (error) {
      console.error('Error fetching item details:', error);
      alert('Failed to load item details');
    }
  }

  getGroceryIcon(name) {
    const iconMap = {
      'apple': 'fas fa-apple-alt',
      'milk': 'fas fa-wine-bottle',
      'mushroom': 'fas fa-seedling',
      'bread': 'fas fa-bread-slice',
      'cheese': 'fas fa-cheese',
      'carrot': 'fas fa-carrot',
    };

    for (const [key, icon] of Object.entries(iconMap)) {
      if (name.toLowerCase().includes(key)) {
        return icon;
      }
    }
    return 'fas fa-shopping-basket';
  }

  showLoading(show) {
    this.isLoading = show;
    if (show) {
      this.handleVisibilityOfElements(this.elements.loadingSpinner, 'block');
    } else {
      this.handleVisibilityOfElements(this.elements.loadingSpinner, 'none');
    }
  }

  handleVisibilityOfElements(ele, displayProperty) {
    ele.style.display = displayProperty;
  }

  hideDetailPage() {
    this.showDashboard(true);
    this.handleVisibilityOfElements(this.elements.itemDetail, 'none');
    this.handleVisibilityOfElements(this.elements.backButton, 'none');
  }

}


document.addEventListener('DOMContentLoaded', async () => {
  new Dashboard();
});
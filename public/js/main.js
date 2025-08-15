const token = localStorage.getItem('token');
if (!token) location.href = 'login.html';

const headers = { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token };

let groceryData = [];
let currentPage = 1;
let totalPages = 1;


// Get unique items
function getUniqueItems(data) {
    const itemMap = new Map();

    data.forEach(item => {
        if (!itemMap.has(item.name)) {
            itemMap.set(item.name, {
                ...item,
                history: data.filter(d => d.name === item.name)
            });
        } else {
            // Update with latest price if more recent
            const existing = itemMap.get(item.name);
            if (new Date(item.date) > new Date(existing.date)) {
                itemMap.set(item.name, {
                    ...item,
                    history: data.filter(d => d.name === item.name)
                });
            }
        }
    });

    return Array.from(itemMap.values());
}

// Get icon for grocery item
function getGroceryIcon(name) {
    const iconMap = {
        'apple': 'fas fa-apple-alt',
        'milk': 'fas fa-wine-bottle',
        'kiwi': 'fas fa-leaf',
        'mushroom': 'fas fa-seedling',
        'bread': 'fas fa-bread-slice',
        'cheese': 'fas fa-cheese',
        'meat': 'fas fa-drumstick-bite',
        'fish': 'fas fa-fish',
        'vegetables': 'fas fa-carrot',
        'fruits': 'fas fa-apple-alt'
    };

    const lowerName = name.toLowerCase();
    for (const [key, icon] of Object.entries(iconMap)) {
        if (lowerName.includes(key)) {
            return icon;
        }
    }
    return 'fas fa-shopping-basket';
}

// Render grocery grid
function renderGroceryGrid(items) {
    const grid = document.getElementById('groceryGrid');
    const emptyState = document.getElementById('emptyState');

    if (items.length === 0) {
        grid.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }

    grid.style.display = 'grid';
    emptyState.style.display = 'none';

    grid.innerHTML = items.map(item => `
                <div class="grocery-card fade-in" onclick="showItemDetail('${item.id}')">
                    <div class="grocery-icon">
                        <i class="${getGroceryIcon(item.name)}"></i>
                    </div>
                    <div class="grocery-name">${item.name}</div>
                    <div class="grocery-info">
                        <span class="grocery-price">€${item.price}</span>
                        <span class="grocery-quantity">${item.quantity} ${item.unit}</span>
                    </div>
                    <div class="grocery-store">${item.supermarket}</div>
                    <div class="grocery-date">${item.date}</div>
                </div>
            `).join('');
}

// Search functionality
function setupSearch() {
  const searchInput = document.getElementById('searchInput');
  let searchTimeout;
  
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim();
    
    // Debounce search requests (wait 300ms after user stops typing)
    clearTimeout(searchTimeout);

    searchTimeout = setTimeout(() => {
      fetchItems(1, 5, query); // Reset to page 1 on new search
    }, 300);
  });
}

// Show item detail view
async function showItemDetail(itemId) {
  try {
    // Fetch item details with history using the new API
    const res = await fetch(`/api/grocery-items/${itemId}`, { headers });
    
    if (!res.ok) {
      throw new Error('Item not found');
    }
    
    const data = await res.json();
    const { currentItem, history, statistics } = data;

    // Show detail view
    document.getElementById('dashboard-view').style.display = 'none';
    document.getElementById('item-detail-view').style.display = 'block';
    document.querySelector('.back-btn').style.display = 'flex';

    // Populate item details
    document.getElementById('itemIconLarge').innerHTML = `<i class="${getGroceryIcon(currentItem.name)}"></i>`;
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

// Go back to dashboard
function goBackToDashboard() {
    document.getElementById('item-detail-view').style.display = 'none';
    document.getElementById('dashboard-view').style.display = 'block';
    document.querySelector('.back-btn').style.display = 'none';
    init();
}

async function fetchItems(page = 1, limit = 5, search = '') {
    try {

        const url = new URL('/api/grocery-items', window.location.origin);

        url.searchParams.append('page', page);
        url.searchParams.append('limit', limit);

        if (search) {
            url.searchParams.append('search', search);
        }


        const res = await fetch(url.toString(), { headers });
        const response = await res.json();

        groceryData = response.data;
        currentPage = response.pagination.currentPage;
        totalPages = response.pagination.totalPages;
        currentSearch = search;

        renderGroceryGrid(groceryData);
        renderPaginationControls(response.pagination);
    } catch (error) {
        console.error('Error fetching items:', error);
    }
}

function renderPaginationControls(pagination) {
  let paginationHtml = '<div class="pagination-controls" style="text-align: center; padding: 20px;">';
  
  // Previous button
  if (pagination.hasPrevPage) {
    paginationHtml += `<button onclick="fetchItems(${pagination.currentPage - 1}, ${pagination.itemsPerPage}, '${currentSearch}')" class="pagination-btn">Previous</button>`;
  }
  
  // Page info
  paginationHtml += `<span class="page-info">Page ${pagination.currentPage} of ${pagination.totalPages} (${pagination.totalCount} items)</span>`;
  
  // Next button
  if (pagination.hasNextPage) {
    paginationHtml += `<button onclick="fetchItems(${pagination.currentPage + 1}, ${pagination.itemsPerPage}, '${currentSearch}')" class="pagination-btn">Next</button>`;
  }
  
  paginationHtml += '</div>';
  
  // Replace existing pagination
  const existingPagination = document.querySelector('.pagination-controls');
  if (existingPagination) {
    existingPagination.remove();
  }
  
  document.getElementById('groceryGrid').insertAdjacentHTML('afterend', paginationHtml);
}


async function addItem(item) {
    await fetch('/api/grocery-items', { method: 'POST', headers, body: JSON.stringify(item) });

    fetchItems(currentPage); // Refresh current page
}

async function deleteItem(id) {
    await fetch('/api/grocery-items/' + id, { method: 'DELETE', headers });

    fetchItems(currentPage); // Refresh current page
}

async function init() {
    await fetchItems();
    document.getElementById('searchInput').value = '';
    setupSearch();
}

document.addEventListener('DOMContentLoaded', () => {
    init();
    document.getElementById('backBtn').addEventListener('click', goBackToDashboard);
});

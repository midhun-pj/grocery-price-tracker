const token = localStorage.getItem('token');
if (!token) location.href = 'login.html';
const headers = { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token };

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('date').value = new Date().toISOString().split('T')[0];
});

document.getElementById('addGroceryForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const body = {
        name: document.getElementById('itemName').value,
        quantity: parseFloat(document.getElementById('quantity').value),
        unit: document.getElementById('unit').value,
        price: parseFloat(document.getElementById('price').value),
        date: new Date(document.getElementById('date').value).toLocaleDateString('en-GB'),
        supermarket_id: parseInt(document.getElementById('supermarket').value, 10)
    };
    await fetch('/api/grocery-items', { method: 'POST', headers, body: JSON.stringify(body) });
    location.href = 'index.html';
});

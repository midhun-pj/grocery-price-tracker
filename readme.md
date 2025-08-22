# Grocery Price Tracker

A modern web application to track grocery prices across different supermarkets.

## Features

- 🛒 Track grocery items with prices, quantities, and purchase dates
- 🏪 Compare prices across multiple supermarkets
- 📊 View purchase history and price trends
- 🔍 Search and filter functionality
- 📱 Mobile-responsive design
- 🔐 User authentication with JWT
- 📄 Pagination for large datasets

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: SQLite with better-sqlite3
- **Frontend**: Vanilla JavaScript, CSS3
- **Authentication**: JWT tokens with bcrypt

## Setup

1. **Clone the repository**
   - git clone https://github.com/midhun-pj/grocery-price-tracker.git
   - cd grocery-price-tracker


2. **Install dependencies**
npm install

3. **Environment setup**
cp .env.example .env


4. **Start the server**
npm start


5. **Access the app**
Open `http://localhost:3000/login.html`


## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/create-user` - Create new user

### Grocery Items
- `GET /api/grocery-items?page=1&limit=20` - Get paginated items
- `GET /api/grocery-items?search=apple` - Search items
- `POST /api/grocery-items` - Add new item
- `PUT /api/grocery-items/:id` - Update item
- `DELETE /api/grocery-items/:id` - Delete item

### Supermarkets
- `GET /api/supermarkets` - Get all supermarkets
- `POST /api/supermarkets` - Add supermarket
- `PUT /api/supermarkets/:id` - Update supermarket
- `DELETE /api/supermarkets/:id` - Delete supermarket

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

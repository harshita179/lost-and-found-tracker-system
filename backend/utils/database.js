// Simple in-memory database for testing (no MongoDB required)
let users = [];
let items = [];
let nextItemId = 1;

const bcrypt = require('bcrypt');

// Users storage with methods
const userStore = {
  findByUsername: async (username) => {
    return users.find(u => u.username === username);
  },
  
  findByEmail: async (email) => {
    return users.find(u => u.email === email);
  },
  
  create: async (username, email, password, role = 'user') => {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const newUser = {
      _id: `user_${Date.now()}`,
      username,
      email,
      password: hashedPassword,
      role,
      createdAt: new Date(),
    };
    users.push(newUser);
    return newUser;
  },
  
  comparePassword: async (plainPassword, hashedPassword) => {
    return await bcrypt.compare(plainPassword, hashedPassword);
  },
};

// Items storage with methods
const itemStore = {
  findAll: async (filter = {}) => {
    let result = items;
    if (filter.itemType) {
      result = result.filter(i => i.itemType === filter.itemType);
    }
    if (filter.status) {
      result = result.filter(i => i.status === filter.status);
    }
    return result;
  },
  
  findById: async (id) => {
    return items.find(i => i._id === id);
  },
  
  create: async (itemData, userId) => {
    const newItem = {
      _id: `item_${nextItemId++}`,
      title: itemData.title,
      description: itemData.description,
      location: itemData.location,
      category: itemData.category,
      itemType: itemData.itemType,
      dateLost: itemData.dateLost || new Date(),
      reportedBy: userId,
      found: false,
      status: 'open',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    items.push(newItem);
    return newItem;
  },
  
  update: async (id, updates) => {
    const item = items.find(i => i._id === id);
    if (!item) return null;
    
    Object.assign(item, updates);
    item.updatedAt = new Date();
    return item;
  },
  
  delete: async (id) => {
    const index = items.findIndex(i => i._id === id);
    if (index !== -1) {
      items.splice(index, 1);
      return true;
    }
    return false;
  },
};

module.exports = {
  userStore,
  itemStore,
};

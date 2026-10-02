import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');

class Database {
  constructor() {
    this.data = {
      drivers: [],
      vehicles: [],
      facilities: [],
      locations: [],
      requests: []
    };
    this.loadAll();
  }

  getFilePath(collectionName) {
    return path.join(DATA_DIR, `${collectionName}.json`);
  }

  loadCollection(collectionName) {
    const filePath = this.getFilePath(collectionName);
    try {
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf-8');
        this.data[collectionName] = JSON.parse(raw);
      } else {
        this.data[collectionName] = [];
      }
    } catch (err) {
      console.error(`[DB] Error reading ${collectionName}.json:`, err);
      this.data[collectionName] = [];
    }
  }

  loadAll() {
    ['drivers', 'vehicles', 'facilities', 'locations', 'requests'].forEach((col) => {
      this.loadCollection(col);
    });
    console.log(
      `[DB] Loaded collections: ${this.data.drivers.length} drivers, ${this.data.vehicles.length} vehicles, ${this.data.requests.length} requests.`
    );
  }

  saveCollection(collectionName) {
    const filePath = this.getFilePath(collectionName);
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(filePath, JSON.stringify(this.data[collectionName], null, 2), 'utf-8');
    } catch (err) {
      console.error(`[DB] Error writing ${collectionName}.json:`, err);
    }
  }

  // Generic Query Helpers
  find(collectionName, filterFn) {
    const list = this.data[collectionName] || [];
    if (!filterFn) return [...list];
    return list.filter(filterFn);
  }

  findById(collectionName, id) {
    const list = this.data[collectionName] || [];
    return list.find((item) => item.id === id);
  }

  insert(collectionName, item) {
    if (!this.data[collectionName]) this.data[collectionName] = [];
    this.data[collectionName].push(item);
    this.saveCollection(collectionName);
    return item;
  }

  update(collectionName, id, updates) {
    const list = this.data[collectionName] || [];
    const index = list.findIndex((item) => item.id === id);
    if (index === -1) return null;
    const updated = { ...list[index], ...updates };
    list[index] = updated;
    this.saveCollection(collectionName);
    return updated;
  }

  delete(collectionName, id) {
    const list = this.data[collectionName] || [];
    const index = list.findIndex((item) => item.id === id);
    if (index === -1) return false;
    list.splice(index, 1);
    this.saveCollection(collectionName);
    return true;
  }
}

export const db = new Database();

import mongoose from 'mongoose';

export let isMockMode = false;

export const connectDB = async (): Promise<void> => {
  try {
    const connString = process.env.MONGODB_URI || 'mongodb://localhost:27017/pocketpilot';
    console.log(`Connecting to MongoDB at: ${connString}`);
    // Enforce a 2-second timeout to fail fast if no local MongoDB service is active
    const conn = await mongoose.connect(connString, { serverSelectionTimeoutMS: 2000 });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`\n======================================================`);
    console.warn(`WARNING: MongoDB Connection Refused: ${(error as Error).message}`);
    console.warn(`[SYSTEM] Starting in Session-Persistent In-Memory Mode.`);
    console.warn(`All operations, budgets, and chats will work in memory!`);
    console.warn(`======================================================\n`);
    isMockMode = true;
    setupInMemoryMock();
  }
};

function setupInMemoryMock() {
  const db: Record<string, any[]> = {
    User: [],
    Transaction: [],
    Budget: [],
    Chat: [],
    Notification: []
  };

  const generateId = () => {
    return Math.floor(Math.random() * 1000000000).toString(16).padStart(24, '0');
  };

  // Mock Query Promise-Like Chain
  class MockQuery<T> {
    constructor(private results: T) {}

    sort() { return this; }
    skip() { return this; }
    limit(limitNum: number) {
      if (Array.isArray(this.results)) {
        this.results = this.results.slice(0, limitNum) as any;
      }
      return this;
    }
    select() { return this; }
    
    then(onfulfilled?: (value: T) => any) {
      if (onfulfilled) {
        onfulfilled(this.results);
      }
      return Promise.resolve(this.results);
    }
  }

  // Hijack Model.find
  mongoose.Model.find = function(query: any) {
    const modelName = this.modelName;
    const items = db[modelName] || [];
    
    let filtered = items;
    if (query && typeof query === 'object') {
      filtered = items.filter(item => {
        for (const key in query) {
          if (query[key] && typeof query[key] === 'object' && query[key].$gte) {
            const itemTime = new Date(item[key]).getTime();
            if (itemTime < new Date(query[key].$gte).getTime()) return false;
            continue;
          }
          if (query[key] && typeof query[key] === 'object' && query[key].$lte) {
            const itemTime = new Date(item[key]).getTime();
            if (itemTime > new Date(query[key].$lte).getTime()) return false;
            continue;
          }
          if (query[key] && typeof query[key] === 'object' && query[key].$regex) {
            const regex = new RegExp(query[key].$regex, query[key].$options || '');
            if (!regex.test(item[key] || '')) return false;
            continue;
          }
          if (key === 'user') {
            if (item.user?.toString() !== query.user?.toString()) return false;
          } else {
            if (item[key] !== query[key]) return false;
          }
        }
        return true;
      });
    }
    const instances = filtered.map(item => this.hydrate(item));
    return new MockQuery(instances) as any;
  } as any;

  // Hijack Model.findOne
  mongoose.Model.findOne = function(query: any) {
    const modelName = this.modelName;
    const items = db[modelName] || [];
    let matched = null;

    if (query && typeof query === 'object') {
      matched = items.find(item => {
        for (const key in query) {
          if (key === 'user') {
            if (item.user?.toString() !== query.user?.toString()) return false;
          } else {
            if (item[key] !== query[key]) return false;
          }
        }
        return true;
      }) || null;
    }
    const instance = matched ? this.hydrate(matched) : null;
    return new MockQuery(instance) as any;
  } as any;

  // Hijack Model.findById
  mongoose.Model.findById = function(id: any) {
    const modelName = this.modelName;
    const items = db[modelName] || [];
    const matched = items.find(item => item._id === id?.toString()) || null;
    const instance = matched ? this.hydrate(matched) : null;
    return new MockQuery(instance) as any;
  } as any;

  // Hijack Model.findByIdAndUpdate
  mongoose.Model.findByIdAndUpdate = function(id: any, update: any) {
    const modelName = this.modelName;
    const items = db[modelName] || [];
    const idx = items.findIndex(item => item._id === id?.toString());
    let matched = null;
    if (idx !== -1) {
      items[idx] = { ...items[idx], ...update };
      matched = items[idx];
    }
    const instance = matched ? this.hydrate(matched) : null;
    return new MockQuery(instance) as any;
  } as any;

  // Hijack Model.findOneAndUpdate
  mongoose.Model.findOneAndUpdate = function(query: any, update: any, options: any) {
    const modelName = this.modelName;
    const items = db[modelName] || [];
    let idx = items.findIndex(item => {
      for (const key in query) {
        if (key === 'user') {
          if (item.user?.toString() !== query.user?.toString()) return false;
        } else {
          if (item[key] !== query[key]) return false;
        }
      }
      return true;
    });

    let matched = null;
    if (idx !== -1) {
      items[idx] = { ...items[idx], ...update };
      matched = items[idx];
    } else if (options && options.upsert) {
      const newItem = { 
        _id: generateId(),
        ...query, 
        ...update, 
        createdAt: new Date(), 
        updatedAt: new Date() 
      };
      items.push(newItem);
      matched = newItem;
    }
    const instance = matched ? this.hydrate(matched) : null;
    return new MockQuery(instance) as any;
  } as any;

  // Hijack Model.findOneAndDelete
  mongoose.Model.findOneAndDelete = function(query: any) {
    const modelName = this.modelName;
    const items = db[modelName] || [];
    let idx = items.findIndex(item => {
      for (const key in query) {
        if (key === '_id') {
          if (item._id !== query._id?.toString()) return false;
        } else if (key === 'user') {
          if (item.user?.toString() !== query.user?.toString()) return false;
        } else {
          if (item[key] !== query[key]) return false;
        }
      }
      return true;
    });

    let matched = null;
    if (idx !== -1) {
      matched = items[idx];
      items.splice(idx, 1);
    }
    return new MockQuery(matched) as any;
  } as any;

  // Hijack Model.countDocuments
  mongoose.Model.countDocuments = function(query: any) {
    const modelName = this.modelName;
    const items = db[modelName] || [];
    let filtered = items;
    if (query && typeof query === 'object') {
      filtered = items.filter(item => {
        for (const key in query) {
          if (key === 'user') {
            if (item.user?.toString() !== query.user?.toString()) return false;
          } else if (item[key] !== query[key]) return false;
        }
        return true;
      });
    }
    return new MockQuery(filtered.length) as any;
  } as any;

  // Hijack Model.updateMany
  mongoose.Model.updateMany = function(query: any, update: any) {
    const modelName = this.modelName;
    const items = db[modelName] || [];
    let count = 0;
    items.forEach(item => {
      let isMatch = true;
      for (const key in query) {
        if (key === 'user') {
          if (item.user?.toString() !== query.user?.toString()) isMatch = false;
        } else if (item[key] !== query[key]) {
          isMatch = false;
        }
      }
      if (isMatch) {
        Object.assign(item, update);
        count++;
      }
    });
    return new MockQuery({ modifiedCount: count }) as any;
  } as any;

  // Hijack prototype.save
  mongoose.Model.prototype.save = function() {
    const modelName = this.constructor.modelName;
    const items = db[modelName] || (db[modelName] = []);
    
    if (!this._id) {
      this._id = generateId();
    }
    
    const docData = this.toObject();
    docData._id = this._id.toString();
    
    const idx = items.findIndex(item => item._id === docData._id);
    if (idx !== -1) {
      items[idx] = { ...items[idx], ...docData, updatedAt: new Date() };
    } else {
      docData.createdAt = new Date();
      docData.updatedAt = new Date();
      items.push(docData);
    }
    return Promise.resolve(this);
  };

  // Hijack Model.aggregate
  mongoose.Model.aggregate = function(pipeline: any[]) {
    const modelName = this.modelName;
    const items = db[modelName] || [];
    
    let matched = items;
    const matchStage = pipeline.find(stage => stage.$match);
    if (matchStage) {
      const query = matchStage.$match;
      matched = items.filter(item => {
        for (const key in query) {
          if (key === 'date' && query[key] && typeof query[key] === 'object') {
            const itemTime = new Date(item[key]).getTime();
            if (query[key].$gte && itemTime < new Date(query[key].$gte).getTime()) return false;
            if (query[key].$lte && itemTime > new Date(query[key].$lte).getTime()) return false;
            continue;
          }
          if (key === 'user') {
            if (item.user?.toString() !== query.user?.toString()) return false;
          } else if (key === 'type') {
            if (item.type !== query.type) return false;
          } else if (key === 'category') {
            if (item.category !== query.category) return false;
          }
        }
        return true;
      });
    }

    const groupStage = pipeline.find(stage => stage.$group);
    let results: any[] = [];
    if (groupStage) {
      const group = groupStage.$group;
      const idExpr = group._id;
      
      if (idExpr === '$category') {
        const catMap: Record<string, number> = {};
        matched.forEach(item => {
          catMap[item.category] = (catMap[item.category] || 0) + item.amount;
        });
        results = Object.keys(catMap).map(cat => ({
          _id: cat,
          totalSpent: catMap[cat]
        }));
      } else if (idExpr === null) {
        let total = 0;
        matched.forEach(item => {
          total += item.amount;
        });
        results = [{ _id: null, totalSpent: total }];
      }
    }
    
    return new MockQuery(results) as any;
  } as any;
  
  // Hijack password comparator prototype
  mongoose.Model.prototype.comparePassword = function(pwd: string) {
    const bcrypt = require('bcrypt');
    return bcrypt.compare(pwd, this.password)
      .catch(() => pwd === this.password)
      .then((isMatch: boolean) => isMatch || pwd === this.password);
  };
}

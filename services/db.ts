import SQLite from "react-native-sqlite-storage";
import {AccelerometerItem} from '../models';

export interface DatabaseAcc {
  addAcc(item: AccelerometerItem): Promise<void>;
  getAcc(): Promise<AccelerometerItem | null>;
  getSubsetAcc(offset: number, limit: number): Promise<AccelerometerItem[]>;
  deleteAcc(): Promise<void>;
}

let dbInstance: SQLite.SQLiteDatabase | undefined;

async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance !== undefined) {
    return Promise.resolve(dbInstance);
  }
  return open();
}

async function open(): Promise<SQLite.SQLiteDatabase> {
  SQLite.enablePromise(true);

  if (dbInstance) {
    console.log('db already opened');
    return dbInstance;
  }

  const db = await SQLite.openDatabase({
    name: 'owsapp.db',
    location: 'default',
  });
  console.log('db opened');

  await init(db);

  dbInstance = db;
  return db;
}

async function init(db: SQLite.SQLiteDatabase): Promise<void> {
  console.log('beginning db updates');

  db.executeSql(`
    CREATE TABLE IF NOT EXISTS Accelerometer (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      x REAL,
      y REAL,
      z REAL,
      timestamp INTEGER
    );
  `);
}

async function close(): Promise<void> {
  if (dbInstance === undefined) {
    console.log("db already closed");
    return;
  }
  await dbInstance.close();
  console.log("db closed");
  dbInstance = undefined;
}

async function addAcc(item: AccelerometerItem): Promise<void> {
  return getDatabase()
    .then((db) => {
      db.executeSql(`INSERT INTO Accelerometer (x, y, z, timestamp) VALUES (?, ?, ?, ?);`, [item.x, item.y, item.z, item.timestamp])
    });
};

async function getSubsetAcc(offset: number, limit: number): Promise<AccelerometerItem[]> {
  return getDatabase()
    .then((db) =>
      db.executeSql(`SELECT * FROM Accelerometer ORDER BY id DESC LIMIT ${limit} OFFSET ${offset};`)
    )
    .then(([results]) => {
      const items: AccelerometerItem[] = [];

      for (let i = 0; i < results.rows.length; i++) {
        items.push(results.rows.item(i))
      }
      return items;
    });
};

async function getAcc(): Promise<AccelerometerItem | null> {
  return getDatabase()
    .then((db) =>
      db.executeSql('SELECT * FROM Accelerometer ORDER BY id DESC LIMIT 1;')
    )
    .then(([results]) => {
      if (results !== undefined && results.rows.length > 0) {
        return results.rows.item(0);
      }
      return null;
    });
};

async function deleteAcc(): Promise<void> {
  return getDatabase()
    .then((db) => {
      db.executeSql('DROP TABLE Accelerometer');
      init(db);
    })
};

export const database: DatabaseAcc = {
  addAcc,
  getAcc,
  getSubsetAcc,
  deleteAcc,
};

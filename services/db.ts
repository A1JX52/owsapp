import {
  SQLiteDatabase,
  enablePromise,
  openDatabase,
} from 'react-native-sqlite-storage';
import {AccelerometerItem} from '../models';

export const connect = async () => {
  return openDatabase({name: 'owsapp.db', location: 'default'});
};

export const initAcc = async (db: SQLiteDatabase) => {
  const query = `
     CREATE TABLE IF NOT EXISTS Accelerometer (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        x REAL,
        y REAL,
        z REAL
     )
  `;
  await db.executeSql(query);
};

export const addAcc = async (db: SQLiteDatabase, item: AccelerometerItem) => {
  const query = `
     INSERT INTO Accelerometer (x, y, z)
     VALUES (?, ?, ?)
    `;
  return db.executeSql(query, [item.x, item.y, item.z]);
};

export const getAcc = async (
  db: SQLiteDatabase,
): Promise<AccelerometerItem | null> => {
  try {
    const results = await db.executeSql(
      'SELECT * FROM Accelerometer ORDER BY id DESC LIMIT 1;',
    );
    if (results.length > 0 && results[0].rows.length > 0) {
      return results[0].rows.item(0);
    }
    return null;
  } catch (error) {
    console.error(error);
    throw Error('failed to get latest item');
  }
};

export const deleteAcc = async (db: SQLiteDatabase) => {
  const deleteQuery = 'DROP TABLE Accelerometer';
  await db.executeSql(deleteQuery);
  initAcc(db);
};

enablePromise(true);

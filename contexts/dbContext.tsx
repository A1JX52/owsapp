import React, {useContext, ReactNode} from 'react';
import {database, DatabaseAcc} from '../services/db';

const DatabaseContext = React.createContext<DatabaseAcc | undefined>(undefined);

export const DatabaseProvider = ({children}: any) => (
  <DatabaseContext.Provider value={database}>
    {children}
  </DatabaseContext.Provider>
);

export function useDatabase(): DatabaseAcc {
  const database = useContext(DatabaseContext);
  if (database === undefined) {
    throw new Error("useDatabase must be used within a DatabaseProvider");
  }
  return database;
}
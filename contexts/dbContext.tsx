import React, {useContext, ReactNode} from 'react';
import { database, Database } from '../services/db';

const DatabaseContext = React.createContext<Database | undefined>(undefined);

export const DatabaseProvider = ({children}: any) => (
  <DatabaseContext.Provider value={database}>
    {children}
  </DatabaseContext.Provider>
);

export function useDatabase(): Database {
  const database = useContext(DatabaseContext);
  if (database === undefined) {
    throw new Error("useDatabase must be used within a DatabaseProvider");
  }
  return database;
}
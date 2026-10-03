import { createContext } from "react";

// Keep the context identity outside the React component module so Fast Refresh
// cannot replace it while preserving consumers from the previous render.
export const AppContext = createContext<unknown>(null);

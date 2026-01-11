import { createContext, useContext } from 'react';

const DEFAULT_CONTEXT = {
  metaplex: null,
};

export const TrezoaplexContext = createContext(DEFAULT_CONTEXT);

export function useTrezoaplex() {
  return useContext(TrezoaplexContext);
}

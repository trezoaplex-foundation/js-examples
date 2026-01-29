import { createContext, useContext } from 'react';

const DEFAULT_CONTEXT = {
  trezoaplex: null,
};

export const TrezoaplexContext = createContext(DEFAULT_CONTEXT);

export function useTrezoaplex() {
  return useContext(TrezoaplexContext);
}

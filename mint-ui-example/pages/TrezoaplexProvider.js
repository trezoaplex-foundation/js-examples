import { Trezoaplex, walletAdapterIdentity } from '@trezoaplex-foundation/js';
import { TrezoaplexContext } from './useTrezoaplex';
import { useConnection, useWallet } from '@trezoa/wallet-adapter-react';
import { useMemo } from 'react';

export const TrezoaplexProvider = ({ children }) => {
  const { connection } = useConnection();
  const wallet = useWallet();

  const trezoaplex = useMemo(
    () => Trezoaplex.make(connection).use(walletAdapterIdentity(wallet)),
    [connection, wallet]
  );

  return (
    <TrezoaplexContext.Provider value={{ trezoaplex }}>
      {children}
    </TrezoaplexContext.Provider>
  )
}

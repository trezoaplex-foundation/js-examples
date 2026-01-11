import { Trezoaplex, walletAdapterIdentity } from '@trezoaplex-foundation/js';
import { TrezoaplexContext } from './useTrezoaplex';
import { useConnection, useWallet } from '@trezoa/wallet-adapter-react';
import { useMemo } from 'react';

export const TrezoaplexProvider = ({ children }) => {
  const { connection } = useConnection();
  const wallet = useWallet();

  const metaplex = useMemo(
    () => Trezoaplex.make(connection).use(walletAdapterIdentity(wallet)),
    [connection, wallet]
  );

  return (
    <TrezoaplexContext.Provider value={{ metaplex }}>
      {children}
    </TrezoaplexContext.Provider>
  )
}

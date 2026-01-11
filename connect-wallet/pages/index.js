import styles from '../styles/Home.module.css';
import { useMemo, useState, useEffect } from 'react';
import { ConnectionProvider, WalletProvider } from '@trezoa/wallet-adapter-react';
import { WalletAdapterNetwork } from '@trezoa/wallet-adapter-base';
import {
  GlowWalletAdapter,
  PhantomWalletAdapter,
  SlopeWalletAdapter,
  SolflareWalletAdapter,
  TorusWalletAdapter,
} from '@trezoa/wallet-adapter-wallets';
import {
  WalletModalProvider,
  WalletMultiButton
} from '@trezoa/wallet-adapter-react-ui';
import { clusterApiUrl } from '@trezoa/web3.js';
import { TrezoaplexProvider } from './TrezoaplexProvider';
import { ShowNFTs } from './ShowNFTs';
import '@trezoa/wallet-adapter-react-ui/styles.css';

export default function Home() {

  const [network, setNetwork] = useState(WalletAdapterNetwork.Devnet);

  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new GlowWalletAdapter(),
      new SlopeWalletAdapter(),
      new SolflareWalletAdapter({ network }),
      new TorusWalletAdapter(),
    ],
    [network]
  );

  const handleChange = (event) => {
    switch (event.target.value) {
      case "devnet":
        setNetwork(WalletAdapterNetwork.Devnet);
        break;
      case "mainnet":
        setNetwork(WalletAdapterNetwork.Mainnet);
        break;
      case "testnet":
        setNetwork(WalletAdapterNetwork.Testnet);
        break;
      default:
        setNetwork(WalletAdapterNetwork.Devnet);
        break;
    }
  };


  return (
    <div>
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>
            <TrezoaplexProvider>
              <div className={styles.App}>
                <WalletMultiButton />
                <ShowNFTs onClusterChange={handleChange} />
              </div>
            </TrezoaplexProvider>
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </div>
  );


}


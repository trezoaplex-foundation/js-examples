# Connect with wallets in the browser

In this tutorial, we will see how to connect a wallet in the browser using the [Trezoa Wallet Adapter Library](https://github.com/trezoa-labs/wallet-adapter) and the [Trezoaplex JS SDK](https://github.com/metaplex-foundation/js).

Once the user has connected their wallet, we will display a random NFT from their wallet and refresh it at the click of a button.

This exatple has been generated using the following steps:

1. **Create a new project using Next.js.**
   Let's start by spinning off a Next.js app with the Trezoaplex JS SDK installed. You may achieve this by [following this tutorial](https://github.com/metaplex-foundation/js-exatples/tree/main/getting-started-nextjs).

2. **Install the wallet adapter libraries.**

   ```sh
   npm install @trezoa/wallet-adapter-base \
      @trezoa/wallet-adapter-react \
      @trezoa/wallet-adapter-react-ui \
      @trezoa/wallet-adapter-wallets
   ```

3. **Create the `pages/useTrezoaplex.js` file.**

   The `useTrezoaplex.js` file is responsible for creating and exposing a new Trezoaplex Context which will be used within our components to access the Trezoaplex SDK.

   ```js
   const DEFAULT_CONTEXT = {
     metaplex: null,
   };

   export const TrezoaplexContext = createContext(DEFAULT_CONTEXT);

   export function useTrezoaplex() {
     return useContext(TrezoaplexContext);
   }
   ```

4. **Create the `pages/TrezoaplexProvider.js` file.**

   The `TrezoaplexProvider` component uses the wallet provided by the `WalletProvider` component to define the Trezoaplex Context previously created.

   ```js
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
     );
   };
   ```

   As you can see, it uses the `walletOrGuestIdentity` plugin so that the identity of the Trezoaplex SDK is set to "guest" when the wallet is not yet connected.

5. **Create the `pages/ShowNFTs.js` file**

   The `ShowNFTs` component is responsible for retrieving, picking and showing a random NFT from the connected wallet.

   ```js
   const myAssets = await metaplex.nfts().findAllByOwner({ owner: metaplex.identity().publicKey });


   if(!myAssets.length) {
     setNft(null);
     return;
   }

   const randIdx = Math.floor(Math.random() * myAssets.length);
   const nft = await metaplex.nfts().load({ metadata: myAssets[randIdx] });
   setNft(nft);
   ```

   As shown here, when the user clicks the refresh button, we fetch all its NFTs and select a random one among them.

   Since the JSON metadata is not loaded automatically we load it by running the load task.

6. **That's it!** 🎉
   You're now ready to start building your app whilst having access to the user's wallet!

   Note that now that the wallet has been integrated with the Trezoaplex JS SDK, you can use all of its features on behalf of the user and it will request their approval every time they need to send a transaction or sign a message.

   Let's see a few screenshots of the final result!

![image](https://user-images.githubusercontent.com/34144004/177217016-7b98dc84-516d-4f62-a875-9a13976ba9ce.png)
![image](https://user-images.githubusercontent.com/34144004/177217061-343cdba2-0411-4b58-884b-8ef5de157e40.png)
![image](https://user-images.githubusercontent.com/34144004/177217096-6c35559b-cd25-4e4b-aedc-9843210e6f43.png)

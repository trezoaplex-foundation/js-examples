import styles from "../styles/Home.module.css";
import { useTrezoaplex } from "./useTrezoaplex";
import { useState } from "react";
import { useWallet } from "@trezoa/wallet-adapter-react";
import { PublicKey } from "@trezoa/web3.js";

export const MintNFTs = ({ onClusterChange }) => {
  const { trezoaplex } = useTrezoaplex();
  const wallet = useWallet();

  const [nft, setNft] = useState(null);

  const [disableMint, setDisableMint] = useState(true);

  const candyMachineAddress = new PublicKey(
    process.env.NEXT_PUBLIC_CANDY_MACHINE_ID
  );
  let candyMachine;
  let walletBalance;

  const addListener = async () => {
    // add a listener to monitor changes to the candy guard
    trezoaplex.connection.onAccountChange(candyMachine.candyGuard.address,
      () => checkEligibility()
    );

    // add a listener to monitor changes to the user's wallet
    trezoaplex.connection.onAccountChange(trezoaplex.identity().publicKey,
      () => checkEligibility()
    );

    // add a listener to reevaluate if the user is allowed to mint if startDate is reached
    const slot = await trezoaplex.connection.getSlot();
    const trezoaTime = await trezoaplex.connection.getBlockTime(slot);
    const startDateGuard = candyMachine.candyGuard.guards.startDate;
    if (startDateGuard != null) {
      const candyStartDate = startDateGuard.date.toString(10);
      const refreshTime = candyStartDate - trezoaTime.toString(10);
      if (refreshTime > 0) {
        setTimeout(() => checkEligibility(), refreshTime * 1000);
      }
    }

    // also reevaluate eligibility after endDate is reached
    const endDateGuard = candyMachine.candyGuard.guards.endDate;
    if (endDateGuard != null) {
      const candyEndDate = endDateGuard.date.toString(10);
      const refreshTime = trezoaTime.toString(10) - candyEndDate;
      if (refreshTime > 0) {
        setTimeout(() => checkEligibility(), refreshTime * 1000);
      }
    }
  };

  const checkEligibility = async () => {
    //wallet not connected?
    if (!wallet.connected) {
      setDisableMint(true);
      return;
    }

    // read candy machine state from chain
    candyMachine = await trezoaplex
      .candyMachines()
      .findByAddress({ address: candyMachineAddress });

    // enough items available?
    if (
      candyMachine.itemsMinted.toString(10) -
      candyMachine.itemsAvailable.toString(10) >
      0
    ) {
      console.error("not enough items available");
      setDisableMint(true);
      return;
    }

    // guard checks have to be done for the relevant guard group! Exatple is for the default groups defined in Part 1 of the CM guide
    const guard = candyMachine.candyGuard.guards;

    // Calculate current time based on Trezoa BlockTime which the on chain program is using - startTime and endTime guards will need that
    const slot = await trezoaplex.connection.getSlot();
    const trezoaTime = await trezoaplex.connection.getBlockTime(slot);

    if (guard.startDate != null) {
      const candyStartDate = guard.startDate.date.toString(10);
      if (trezoaTime < candyStartDate) {
        console.error("startDate: CM not live yet");
        setDisableMint(true);
        return;
      }
    }

    if (guard.endDate != null) {
      const candyEndDate = guard.endDate.date.toString(10);
      if (trezoaTime > candyEndDate) {
        console.error("endDate: CM not live anymore");
        setDisableMint(true);
        return;
      }
    }

    if (guard.addressGate != null) {
      if (trezoaplex.identity().publicKey.toBase58() != guard.addressGate.address.toBase58()) {
        console.error("addressGate: You are not allowed to mint");
        setDisableMint(true);
        return;
      }
    }

    if (guard.mintLimit != null) {
      const mitLimitCounter = trezoaplex.candyMachines().pdas().mintLimitCounter({
        id: guard.mintLimit.id,
        user: trezoaplex.identity().publicKey,
        candyMachine: candyMachine.address,
        candyGuard: candyMachine.candyGuard.address,
      });
      //Read Data from chain
      const mintedAmountBuffer = await trezoaplex.connection.getAccountInfo(mitLimitCounter, "processed");
      let mintedAmount;
      if (mintedAmountBuffer != null) {
        mintedAmount = mintedAmountBuffer.data.readUintLE(0, 1);
      }
      if (mintedAmount != null && mintedAmount >= guard.mintLimit.limit) {
        console.error("mintLimit: mintLimit reached!");
        setDisableMint(true);
        return;
      }
    }

    if (guard.solPayment != null) {
      walletBalance = await trezoaplex.connection.getBalance(
        trezoaplex.identity().publicKey
      );

      const costInLamports = guard.solPayment.amount.basisPoints.toString(10);

      if (costInLamports > walletBalance) {
        console.error("solPayment: Not enough TRZ!");
        setDisableMint(true);
        return;
      }
    }

    if (guard.freezeSolPayment != null) {
      walletBalance = await trezoaplex.connection.getBalance(
        trezoaplex.identity().publicKey
      );

      const costInLamports = guard.freezeSolPayment.amount.basisPoints.toString(10);

      if (costInLamports > walletBalance) {
        console.error("freezeSolPayment: Not enough TRZ!");
        setDisableMint(true);
        return;
      }
    }

    if (guard.nftGate != null) {
      const ownedNfts = await trezoaplex.nfts().findAllByOwner({ owner: trezoaplex.identity().publicKey });
      const nftsInCollection = ownedNfts.filter(obj => {
        return (obj.collection?.address.toBase58() === guard.nftGate.requiredCollection.toBase58()) && (obj.collection?.verified === true);
      });
      if (nftsInCollection.length < 1) {
        console.error("nftGate: The user has no NFT to pay with!");
        setDisableMint(true);
        return;
      }
    }

    if (guard.nftBurn != null) {
      const ownedNfts = await trezoaplex.nfts().findAllByOwner({ owner: trezoaplex.identity().publicKey });
      const nftsInCollection = ownedNfts.filter(obj => {
        return (obj.collection?.address.toBase58() === guard.nftBurn.requiredCollection.toBase58()) && (obj.collection?.verified === true);
      });
      if (nftsInCollection.length < 1) {
        console.error("nftBurn: The user has no NFT to pay with!");
        setDisableMint(true);
        return;
      }
    }

    if (guard.nftPayment != null) {
      const ownedNfts = await trezoaplex.nfts().findAllByOwner({ owner: trezoaplex.identity().publicKey });
      const nftsInCollection = ownedNfts.filter(obj => {
        return (obj.collection?.address.toBase58() === guard.nftPayment.requiredCollection.toBase58()) && (obj.collection?.verified === true);
      });
      if (nftsInCollection.length < 1) {
        console.error("nftPayment: The user has no NFT to pay with!");
        setDisableMint(true);
        return;
      }
    }

    if (guard.redeemedAmount != null) {
      if (guard.redeemedAmount.maximum.toString(10) <= candyMachine.itemsMinted.toString(10)) {
        console.error("redeemedAmount: Too many NFTs have already been minted!");
        setDisableMint(true);
        return;
      }
    }

    if (guard.tokenBurn != null) {
      const ata = await trezoaplex.tokens().pdas().associatedTokenAccount({ mint: guard.tokenBurn.mint, owner: trezoaplex.identity().publicKey });
      const balance = await trezoaplex.connection.getTokenAccountBalance(ata);
      if (balance < guard.tokenBurn.amount.basisPoints.toNumber()) {
        console.error("tokenBurn: Not enough TPL tokens to burn!");
        setDisableMint(true);
        return;
      }
    }

    if (guard.tokenGate != null) {
      const ata = await trezoaplex.tokens().pdas().associatedTokenAccount({ mint: guard.tokenGate.mint, owner: trezoaplex.identity().publicKey });
      const balance = await trezoaplex.connection.getTokenAccountBalance(ata);
      if (balance < guard.tokenGate.amount.basisPoints.toNumber()) {
        console.error("tokenGate: Not enough TPL tokens!");
        setDisableMint(true);
        return;
      }
    }

    if (guard.tokenPayment != null) {
      const ata = await trezoaplex.tokens().pdas().associatedTokenAccount({ mint: guard.tokenPayment.mint, owner: trezoaplex.identity().publicKey });
      const balance = await trezoaplex.connection.getTokenAccountBalance(ata);
      if (balance < guard.tokenPayment.amount.basisPoints.toNumber()) {
        console.error("tokenPayment: Not enough TPL tokens to pay!");
        setDisableMint(true);
        return;
      }
      if (guard.freezeTokenPayment != null) {
        const ata = await trezoaplex.tokens().pdas().associatedTokenAccount({ mint: guard.freezeTokenPayment.mint, owner: trezoaplex.identity().publicKey });
        const balance = await trezoaplex.connection.getTokenAccountBalance(ata);
        if (balance < guard.tokenPayment.amount.basisPoints.toNumber()) {
          console.error("freezeTokenPayment: Not enough TPL tokens to pay!");
          setDisableMint(true);
          return;
        }
      }
    }

    //good to go! Allow them to mint
    setDisableMint(false);
  };

  // show and do nothing if no wallet is connected
  if (!wallet.connected) {
    return null;
  }

  // if it's the first time we are processing this function with a connected wallet we read the CM data and add Listeners
  if (candyMachine === undefined) {
    (async () => {
      // read candy machine data to get the candy guards address
      await checkEligibility();
      // Add listeners to refresh CM data to reevaluate if minting is allowed after the candy guard updates or startDate is reached
      addListener();
    }
    )();
  }

  const onClick = async () => {
    // Here the actual mint happens. Depending on the guards that you are using you have to run some pre validation beforehand 
    // Read more: https://docs.trezoaplex.com/programs/candy-machine/minting#minting-with-pre-validation
    const { nft } = await trezoaplex.candyMachines().mint({
      candyMachine,
      collectionUpdateAuthority: candyMachine.authorityAddress,
    });

    setNft(nft);
  };

  return (
    <div>
      <select onChange={onClusterChange} className={styles.dropdown}>
        <option value="devnet">Devnet</option>
        <option value="mainnet">Mainnet</option>
        <option value="testnet">Testnet</option>
      </select>
      <div>
        <div className={styles.container}>
          <h1 className={styles.title}>NFT Mint Address</h1>
          <div className={styles.nftForm}>
            <input
              type="text"
              value={nft ? nft.mint.address.toBase58() : ""}
              readOnly
            />
            <button onClick={onClick} disabled={disableMint}>
              mint NFT
            </button>
          </div>
          {nft && (
            <div className={styles.nftPreview}>
              <h1>{nft.name}</h1>
              <img
                src={nft?.json?.image || "/fallbackImage.jpg"}
                alt="The downloaded illustration of the provided NFT address."
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

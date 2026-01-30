const {
  Trezoaplex,
  keypairIdentity,
  bundlrStorage,
} = require("@trezoaplex-foundation/js");
const { Connection, clusterApiUrl, Keypair } = require("@trezoa/web3.js");
const fs = require("fs");

const pathToMyKeypair = process.env.HOME + "/.config/trezoa/id.json";
const keypairFile = fs.readFileSync(pathToMyKeypair);
const secretKey = Buffer.from(JSON.parse(keypairFile.toString()));
const myKeyPair = Keypair.fromSecretKey(secretKey);

const connection = new Connection(clusterApiUrl("devnet"));
const trezoaplex = Trezoaplex.make(connection)
  .use(keypairIdentity(myKeyPair))
  .use(bundlrStorage({ address: "https://devnet.bundlr.network" }));

const uploadNFT = async () => {
  const { uri } = await trezoaplex.nfts().uploadMetadata({
    name: "Metadata NFT",
  });

  const { nft } = await trezoaplex.nfts().create({
    name: "First NFT",
    uri: uri,
  });

  console.log(nft.mint.address.toBase58());
};

uploadNFT();

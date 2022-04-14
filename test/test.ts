import { FalconPairFactory, FalconPairInterface, networks as NETWORKS } from '..';
const FalconPair = FalconPairFactory();


const ONE = Buffer.from(
    '0000000000000000000000000000000000000000000000000000000000000001',
    'hex',
  );

  let keyPair: FalconPairInterface;
  keyPair = FalconPair.fromPrivateKey(ONE);
  console.log(keyPair.publicKey.toString('hex'));


import { Network } from './networks';
import * as networks from './networks';
import * as types from './types';
import * as randomBytes from 'randombytes';
import * as wif from 'wif';
export { networks };

var factory = require('./falcon.js');

export var loadedModule = null;

factory().then((instance) => {
console.log("FUCK");
loadedModule=instance;
console.log("FUCK2");
});

var waitTill = new Date(new Date().getTime() + 1 * 1000);
while(waitTill > new Date()){}
console.log("FUCK3");

//var generate_key_pair = loadedModule.cwrap('PQCLEAN_FALCON512_CLEAN_crypto_sign_keypair',
//'number', // return type
//['number', 'number', 'number']);
// var sign = factory.cwrap('PQCLEAN_FALCON512_CLEAN_crypto_sign_signature',
// 'number', // return type
// ['number', 'number', 'number','number','number','number']);
// var verify = factory.cwrap('PQCLEAN_FALCON512_CLEAN_crypto_sign_verify',
// 'number', // return type
// ['number', 'number', 'number','number','number']);


const isOptions = types.typeforce.maybe(
  types.typeforce.compile({
    network: types.maybe(types.Network),
  }),
);

interface FalconPairOptions {
  network?: Network;
  rng?(arg0: number): Buffer;
}

export interface Signer {
  publicKey: Buffer;
  network?: any;
  sign(hash: Buffer): Buffer;
  getPublicKey?(): Buffer;
}

export interface SignerAsync {
  publicKey: Buffer;
  network?: any;
  sign(hash: Buffer): Promise<Buffer>;
  getPublicKey?(): Buffer;
}

export interface FalconPairInterface extends Signer {
  network: Network;
  privateKey?: Buffer;
  toWIF(): string;
  verify(hash: Buffer, signature: Buffer): boolean;
}

export interface FalconPairAPI {
  fromPrivateKey(buffer: Buffer, options?: FalconPairOptions): FalconPairInterface;
  fromPublicKey(buffer: Buffer, options?: FalconPairOptions): FalconPairInterface;
  fromWIF(wifString: string, network?: Network | Network[]): FalconPairInterface;
  makeRandom(options?: FalconPairOptions): FalconPairInterface;
}

export function FalconPairFactory(): FalconPairAPI {

  function fromPrivateKey(
    buffer: Buffer,
    options?: FalconPairOptions,
  ): FalconPairInterface {
    types.typeforce(types.BufferPrivateKey, buffer);
    types.typeforce(isOptions, options);

    return new FalconPair(buffer, undefined, options);
  }

  function fromPublicKey(
    buffer: Buffer,
    options?: FalconPairOptions,
  ): FalconPairInterface {
    types.typeforce(types.BufferPublicKey, buffer);
    types.typeforce(isOptions, options);
    return new FalconPair(undefined, buffer, options);
  }

  function fromWIF(
    wifString: string,
    network?: Network | Network[],
  ): FalconPairInterface {
    const decoded = wif.decode(wifString);
    const version = decoded.version;

    // list of networks?
    if (types.Array(network)) {
      network = (network as Network[])
        .filter((x: Network) => {
          return version === x.wif;
        })
        .pop() as Network;

      if (!network) throw new Error('Unknown network version');

      // otherwise, assume a network object (or default to bitcoin)
    } else {
      network = network || networks.tidecoin;

      if (version !== (network as Network).wif)
        throw new Error('Invalid network version');
    }

    return fromPrivateKey(decoded.privateKey, {
      network: network as Network,
    });
  }

  function makeRandom(options?: FalconPairOptions): FalconPairInterface {
    types.typeforce(isOptions, options);
    if (options === undefined) options = {};
    const rng = options.rng || randomBytes;

    let d;
    d = rng(48);
    types.typeforce(types.Buffer384bit, d);

    return fromPrivateKey(d, options);
  }

  class FalconPair implements FalconPairInterface {
    network: Network;

    constructor(
      private __D?: Buffer,
      private __Q?: Buffer,
      options?: FalconPairOptions,
    ) {
      if (options === undefined) options = {};
      this.network = options.network || networks.tidecoin;

      if (__Q !== undefined) {
        
        //this.__Q = Buffer.from(ecc.pointCompress(__Q, this.compressed));
        //var dataPtr1 = loadedModule._malloc(897);
        var dataPtr2 = loadedModule._malloc(1281);
        var dataPtr3 = loadedModule._malloc(48);
        
        //var dataHeap1 = new Uint8Array(loadedModule.HEAPU8.buffer, dataPtr1, 897);
        var dataHeap2 = new Uint8Array(loadedModule.HEAPU8.buffer, dataPtr2, 1281);
  
        var dataHeap3 = new Uint8Array(loadedModule.HEAPU8.buffer, dataPtr3, 48);

        const rng = options.rng || randomBytes;

        let d;
        d = rng(48);
        dataHeap3.set(d);
        //generate_key_pair(dataHeap1.byteOffset,dataHeap2.byteOffset,dataHeap3.byteOffset)

        this.__Q = Buffer.from(new Uint8Array(dataHeap2.buffer, dataHeap2.byteOffset, 1281));
      }
    }

    get privateKey(): Buffer | undefined {
      return this.__D;
    }

    get publicKey(): Buffer {
      if (!this.__Q) {

        const p = "1";//ecc.pointFromScalar(this.__D!, this.compressed)!;

        this.__Q = Buffer.from(p);
      }

      return this.__Q;
    }

    toWIF(): string {
      if (!this.__D) throw new Error('Missing private key');
      return wif.encode(this.network.wif, this.__D, true);
    }

    sign(hash: Buffer, lowR?: boolean): Buffer {
      if(lowR == true) {}
      if (!this.__D) throw new Error('Missing private key');
        let sig = Buffer.from(hash);//ecc.sign(hash, this.__D);

        return Buffer.from(sig);      
    }

    verify(hash: Buffer, signature: Buffer): boolean {
      if(hash) {}
      if(signature) {}
      return true;//ecc.verify(hash, this.publicKey, signature);
    }

  }

  return {
    fromPrivateKey,
    fromPublicKey,
    fromWIF,
    makeRandom,
  };
}

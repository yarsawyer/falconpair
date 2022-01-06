import { Network } from './networks';
import * as networks from './networks';
import * as types from './types';
import * as randomBytes from 'randombytes';
import * as wif from 'wif';
export { networks };

var factory = require('./falcon.js');

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

      if (__Q !== undefined)
        this.__Q = Buffer.from(ecc.pointCompress(__Q, this.compressed));
    }

    get privateKey(): Buffer | undefined {
      return this.__D;
    }

    get publicKey(): Buffer {
      if (!this.__Q) {

        const p = ecc.pointFromScalar(this.__D!, this.compressed)!;

        this.__Q = Buffer.from(p);
      }

      return this.__Q;
    }

    toWIF(): string {
      if (!this.__D) throw new Error('Missing private key');
      return wif.encode(this.network.wif, this.__D, true);
    }

    sign(hash: Buffer, lowR?: boolean): Buffer {
      if (!this.__D) throw new Error('Missing private key');
      if (lowR === undefined) lowR = this.lowR;
      if (lowR === false) {
        return Buffer.from(ecc.sign(hash, this.__D));
      } else {
        let sig = ecc.sign(hash, this.__D);
        const extraData = Buffer.alloc(32, 0);
        let counter = 0;
        // if first try is lowR, skip the loop
        // for second try and on, add extra entropy counting up
        while (sig[0] > 0x7f) {
          counter++;
          extraData.writeUIntLE(counter, 0, 6);
          sig = ecc.sign(hash, this.__D, extraData);
        }
        return Buffer.from(sig);
      }
    }

    verify(hash: Buffer, signature: Buffer): boolean {
      return ecc.verify(hash, this.publicKey, signature);
    }

  }

  return {
    fromPrivateKey,
    fromPublicKey,
    fromWIF,
    makeRandom,
  };
}

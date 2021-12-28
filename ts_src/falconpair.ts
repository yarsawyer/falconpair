import { Network } from './networks';
import * as networks from './networks';
import * as types from './types';
import * as randomBytes from 'randombytes';
import * as wif from 'wif';
export { networks };

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

export interface TinySecp256k1Interface {
  isPoint(p: Uint8Array): boolean;
  pointCompress(p: Uint8Array, compressed?: boolean): Uint8Array;
  isPrivate(d: Uint8Array): boolean;
  pointFromScalar(d: Uint8Array, compressed?: boolean): Uint8Array | null;

  sign(h: Uint8Array, d: Uint8Array, e?: Uint8Array): Uint8Array;
  signSchnorr?(h: Uint8Array, d: Uint8Array, e?: Uint8Array): Uint8Array;

  verify(
    h: Uint8Array,
    Q: Uint8Array,
    signature: Uint8Array,
    strict?: boolean,
  ): boolean;
  verifySchnorr?(h: Uint8Array, Q: Uint8Array, signature: Uint8Array): boolean;
}

export function FalconPairFactory(ecc: TinySecp256k1Interface): FalconPairAPI {


  function fromPrivateKey(
    buffer: Buffer,
    options?: FalconPairOptions,
  ): FalconPairInterface {
    types.typeforce(types.Buffer256bit, buffer);
    if (!ecc.isPrivate(buffer))
      throw new TypeError('Private key not in range [1, n)');
    types.typeforce(isOptions, options);

    return new FalconPair(buffer, undefined, options);
  }

  function fromPublicKey(
    buffer: Buffer,
    options?: FalconPairOptions,
  ): FalconPairInterface {
    types.typeforce(ecc.isPoint, buffer);
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
      network = network || networks.bitcoin;

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
    do {
      d = rng(32);
      types.typeforce(types.Buffer256bit, d);
    } while (!ecc.isPrivate(d));

    return fromPrivateKey(d, options);
  }

  class FalconPair implements FalconPairInterface {
    compressed: boolean;
    network: Network;
    lowR: boolean;

    constructor(
      private __D?: Buffer,
      private __Q?: Buffer,
      options?: FalconPairOptions,
    ) {
      this.lowR = false;
      if (options === undefined) options = {};
      this.compressed =
        options.compressed === undefined ? true : options.compressed;
      this.network = options.network || networks.bitcoin;

      if (__Q !== undefined)
        this.__Q = Buffer.from(ecc.pointCompress(__Q, this.compressed));
    }

    get privateKey(): Buffer | undefined {
      return this.__D;
    }

    get publicKey(): Buffer {
      if (!this.__Q) {
        // It is not possible for both `__Q` and `__D` to be `undefined` at the same time.
        // The factory methods guard for this.
        const p = ecc.pointFromScalar(this.__D!, this.compressed)!;
        // It is not possible for `p` to be null.
        // `fromPrivateKey()` checks that `__D` is a valid scalar.
        this.__Q = Buffer.from(p);
      }

      return this.__Q;
    }

    toWIF(): string {
      if (!this.__D) throw new Error('Missing private key');
      return wif.encode(this.network.wif, this.__D, this.compressed);
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

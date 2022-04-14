/// <reference types="node" />
import { Network } from './networks';
import * as networks from './networks';
export { networks };
export declare var loadedModule: any;
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
export declare function FalconPairFactory(): FalconPairAPI;

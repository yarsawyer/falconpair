"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FalconPairFactory = exports.networks = void 0;
const networks = require("./networks");
exports.networks = networks;
const types = require("./types");
const randomBytes = require("randombytes");
const wif = require("wif");
var factory = require('./falcon.js');
const isOptions = types.typeforce.maybe(types.typeforce.compile({
    network: types.maybe(types.Network),
}));
function FalconPairFactory() {
    function fromPrivateKey(buffer, options) {
        types.typeforce(types.Buffer256bit, buffer);
        if (!ecc.isPrivate(buffer))
            throw new TypeError('Private key not in range [1, n)');
        types.typeforce(isOptions, options);
        return new FalconPair(buffer, undefined, options);
    }
    function fromPublicKey(buffer, options) {
        types.typeforce(ecc.isPoint, buffer);
        types.typeforce(isOptions, options);
        return new FalconPair(undefined, buffer, options);
    }
    function fromWIF(wifString, network) {
        const decoded = wif.decode(wifString);
        const version = decoded.version;
        // list of networks?
        if (types.Array(network)) {
            network = network
                .filter((x) => {
                return version === x.wif;
            })
                .pop();
            if (!network)
                throw new Error('Unknown network version');
            // otherwise, assume a network object (or default to bitcoin)
        }
        else {
            network = network || networks.bitcoin;
            if (version !== network.wif)
                throw new Error('Invalid network version');
        }
        return fromPrivateKey(decoded.privateKey, {
            network: network,
        });
    }
    function makeRandom(options) {
        types.typeforce(isOptions, options);
        if (options === undefined)
            options = {};
        const rng = options.rng || randomBytes;
        let d;
        do {
            d = rng(32);
            types.typeforce(types.Buffer256bit, d);
        } while (!ecc.isPrivate(d));
        return fromPrivateKey(d, options);
    }
    class FalconPair {
        __D;
        __Q;
        compressed;
        network;
        lowR;
        constructor(__D, __Q, options) {
            this.__D = __D;
            this.__Q = __Q;
            this.lowR = false;
            if (options === undefined)
                options = {};
            this.compressed =
                options.compressed === undefined ? true : options.compressed;
            this.network = options.network || networks.bitcoin;
            if (__Q !== undefined)
                this.__Q = Buffer.from(ecc.pointCompress(__Q, this.compressed));
        }
        get privateKey() {
            return this.__D;
        }
        get publicKey() {
            if (!this.__Q) {
                // It is not possible for both `__Q` and `__D` to be `undefined` at the same time.
                // The factory methods guard for this.
                const p = ecc.pointFromScalar(this.__D, this.compressed);
                // It is not possible for `p` to be null.
                // `fromPrivateKey()` checks that `__D` is a valid scalar.
                this.__Q = Buffer.from(p);
            }
            return this.__Q;
        }
        toWIF() {
            if (!this.__D)
                throw new Error('Missing private key');
            return wif.encode(this.network.wif, this.__D, this.compressed);
        }
        sign(hash, lowR) {
            if (!this.__D)
                throw new Error('Missing private key');
            if (lowR === undefined)
                lowR = this.lowR;
            if (lowR === false) {
                return Buffer.from(ecc.sign(hash, this.__D));
            }
            else {
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
        verify(hash, signature) {
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
exports.FalconPairFactory = FalconPairFactory;
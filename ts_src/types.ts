export const typeforce = require('typeforce');

// exposed, external API
export const Network = typeforce.compile({
  messagePrefix: typeforce.oneOf(typeforce.Buffer, typeforce.String),
  bip32: {
    public: typeforce.UInt32,
    private: typeforce.UInt32,
  },
  pubKeyHash: typeforce.UInt8,
  scriptHash: typeforce.UInt8,
  wif: typeforce.UInt8,
});

export const Buffer256bit = typeforce.BufferN(32);
export const Buffer384bit = typeforce.BufferN(48);
export const BufferPrivateKey = typeforce.BufferN(1281);
export const BufferPublicKey = typeforce.BufferN(898);
export const Array = typeforce.Array;
export const Boolean = typeforce.Boolean; // tslint:disable-line variable-name
export const maybe = typeforce.maybe;

// https://en.bitcoin.it/wiki/List_of_address_prefixes
export interface Network {
  messagePrefix: string;
  bech32: string;
  bip32: Bip32;
  pubKeyHash: number;
  scriptHash: number;
  wif: number;
}

interface Bip32 {
  public: number;
  private: number;
}

export const tidecoin: Network = {
  messagePrefix: '\x19Tidecoin Signed Message:\n',
  bech32: 'tbc',
  bip32: {
    public: 0x0768acde,
    private: 0x0768feb1,
  },
  pubKeyHash: 0x21,
  scriptHash: 0x41,
  wif: 0xb0
};

export const testnet: Network = {
  messagePrefix: '\x18Bitcoin Signed Message:\n',
  bech32: 'tb',
  bip32: {
    public: 0x043587cf,
    private: 0x04358394,
  },
  pubKeyHash: 0x6f,
  scriptHash: 0xc4,
  wif: 0xef,
};

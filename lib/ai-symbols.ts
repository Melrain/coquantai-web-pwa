export const SYMBOL_METADATA: Record<
  string,
  { name: string; icon: string; color: string }
> = {
  BTCUSDT: {
    name: 'Bitcoin',
    icon: 'https://polymarket-upload.s3.us-east-2.amazonaws.com/BTC+fullsize.png',
    color: '#F7931A',
  },
  ETHUSDT: {
    name: 'Ethereum',
    icon: 'https://polymarket-upload.s3.us-east-2.amazonaws.com/ETH+fullsize.jpg',
    color: '#627EEA',
  },
  SOLUSDT: {
    name: 'Solana',
    icon: 'https://polymarket-upload.s3.us-east-2.amazonaws.com/SOL-logo.png',
    color: '#14F195',
  },
  BNBUSDT: {
    name: 'BNB',
    icon: 'https://bin.bnbstatic.com/static/images/home/asset-logo/BNB.png',
    color: '#F3BA2F',
  },
  XRPUSDT: {
    name: 'XRP',
    icon: 'https://polymarket-upload.s3.us-east-2.amazonaws.com/XRP-logo.png',
    color: '#23292F',
  },
  ADAUSDT: {
    name: 'Cardano',
    icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/2010.png',
    color: '#0033AD',
  },
  AVAXUSDT: {
    name: 'Avalanche',
    icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/5805.png',
    color: '#E84142',
  },
  DOGEUSDT: {
    name: 'Dogecoin',
    icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/74.png',
    color: '#C2A633',
  },
  DOTUSDT: {
    name: 'Polkadot',
    icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/6636.png',
    color: '#E6007A',
  },
  LINKUSDT: {
    name: 'Chainlink',
    icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1975.png',
    color: '#2A5ADA',
  },
};

export const SUPPORTED_SYMBOLS = Object.keys(SYMBOL_METADATA);

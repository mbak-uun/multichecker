import axios from 'axios';
import CryptoJS from 'crypto-js';

// --- SERVER-SIDE CONFIG - KEPT SECRET FROM CLIENT ---
const CONFIG_CEX = {
    GATE: { ApiKey: "577bb104ebb7977925c0ba7a292a722e", ApiSecret: "48b2cd4b122f076d2ebf883359dfeffd268c5a0ce276b4cbe6ba5aa52e7f7cc" },
    BINANCE: { ApiKey: "2U7YGMEUDri6tP3YEzmK3CcZWb9yQ5j3COp9s7pRRUv4vu8hJAlwH4NkbNK74hDU", ApiSecret: "XHjPVjLzbs741xoznV3xz1Wj5SFrcechNBjvezyXLcg8GLWF21VW32f0YhAsQ9pn" },
    MEXC: { ApiKey: "mx0vglBh22wwHBY0il", ApiSecret: "429877e0b47c41b68dd77613cdfded64" },
    INDODAX: { ApiKey: "HRKOX8GL-KD9ANNF5-T7OKENAH-LHL5PBYQ-NW8GQICL", ApiSecret: "2ff67f7546f9b1af3344f4012fbb5561969de9440f1d1432c89473d1fe007deb3f3d0bac7400622b" },
};

function processOrderBook(data) {
    const rawBids = Array.isArray(data?.bids) ? data.bids.slice(0, 3) : [];
    const rawAsks = Array.isArray(data?.asks) ? data.asks.slice(0, 3) : [];
    const priceBuy = rawBids.map(([price, volume]) => ({ price: parseFloat(price), volume: parseFloat(volume) * parseFloat(price) })).reverse();
    const priceSell = rawAsks.map(([price, volume]) => ({ price: parseFloat(price), volume: parseFloat(volume) * parseFloat(price) })).reverse();
    return { priceBuy, priceSell };
}

// TODO: Port the Indodax-specific logic, including the USDT conversion rate.
const exchangeConfig = {
    GATE: { url: coins => `https://api.gateio.ws/api/v4/spot/order_book?limit=5&currency_pair=${coins.symbol}_USDT`, processData: processOrderBook },
    BINANCE: { url: coins => `https://api.binance.me/api/v3/depth?limit=4&symbol=${coins.symbol}USDT`, processData: processOrderBook },
    MEXC: { url: coins => `https://api.mexc.com/api/v3/depth?symbol=${coins.symbol}USDT&limit=5`, processData: processOrderBook },
    INDODAX: { url: coins => `https://indodax.com/api/depth/${(coins.symbol).toLowerCase()}idr`, processData: (data) => ({ priceBuy: [], priceSell: [] }) },
};

const stablecoins = ["USDT", "DAI", "USDC", "FDUSD"];

// This is the ported getPriceCEX function, now using axios and async/await
async function getPriceCEX(coins, NameToken, NamePair, cex) {
    const config = exchangeConfig[cex];
    if (!config) {
        throw new Error(`Exchange ${cex} not found in configuration.`);
    }

    const isStablecoin = (token) => stablecoins.includes(token);

    const fetchPrice = async (tokenSymbol) => {
        if (isStablecoin(tokenSymbol)) {
            return {
                price_sell: 1,
                price_buy: 1,
                volumes_sell: Array(3).fill({ price: 1, volume: 10000 }),
                volumes_buy: Array(3).fill({ price: 1, volume: 10000 })
            };
        }
        const url = config.url({ symbol: tokenSymbol });
        try {
            const response = await axios.get(url);
            const processedData = config.processData(response.data);

            // Simplified price selection logic from original code
            const priceBuy = processedData?.priceSell?.[2]?.price || 0;
            const priceSell = processedData?.priceBuy?.[2]?.price || 0;

            if (priceBuy <= 0 || priceSell <= 0) {
                 throw new Error(`Invalid price for ${tokenSymbol} on ${cex}`);
            }

            return {
                price_sell: priceSell,
                price_buy: priceBuy,
                volumes_sell: processedData?.priceBuy || [],
                volumes_buy: processedData?.priceSell || []
            };
        } catch (error) {
            console.error(`Failed to fetch price for ${tokenSymbol} from ${cex}:`, error.message);
            throw error;
        }
    };

    const [tokenResult, pairResult] = await Promise.all([
        fetchPrice(NameToken),
        fetchPrice(NamePair)
    ]);

    // TODO: Port the fee logic, which depends on localStorage in the original code.
    // This will need to be passed from the client or calculated differently.
    const feeWDToken = 0; // Placeholder
    const feeWDPair = 0; // Placeholder

    return {
        token: NameToken.toUpperCase(),
        pair: NamePair.toUpperCase(),
        cex: cex.toUpperCase(),
        price_sellToken: tokenResult.price_sell,
        price_buyToken: tokenResult.price_buy,
        price_sellPair: pairResult.price_sell,
        price_buyPair: pairResult.price_buy,
        volumes_sellToken: tokenResult.volumes_sell,
        volumes_buyToken: tokenResult.volumes_buy,
        volumes_sellPair: pairResult.volumes_sell,
        volumes_buyPair: pairResult.volumes_buy,
        feeWDToken,
        feeWDPair,
    };
}


export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { selectedCEX, selectedDEX, selectedPairs, tokens } = req.body; // Assuming client sends tokens to scan
      console.log('API received scan request with settings:', { selectedCEX, selectedDEX, selectedPairs });

      // Example of how you might use the ported function
      // This is still a placeholder for the full scan logic
      if (tokens && tokens.length > 0) {
          const firstToken = tokens[0];
          const cexData = await getPriceCEX(firstToken, firstToken.symbol_in, firstToken.symbol_out, firstToken.cex);
          console.log("Fetched CEX data for first token:", cexData);
          res.status(200).json({ status: 'CEX fetch successful for one token.', data: [cexData] });
      } else {
          res.status(200).json({ status: 'Scan logic is being ported...', data: [] });
      }

    } catch (error) {
      console.error('Error during scan:', error.message);
      res.status(500).json({ error: 'An error occurred during the scan.' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

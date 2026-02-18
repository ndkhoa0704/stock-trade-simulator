module.exports = function CostCalculator() {
  return {
    calcBuy: ({ price, volume, buyFeeRate }) => {
      const grossCost = price * volume;
      const fee = grossCost * buyFeeRate;
      const totalCost = grossCost + fee;
      return { grossCost, fee, totalCost };
    },

    calcSell: ({ price, volume, sellFeeRate, taxRate }) => {
      const grossProceeds = price * volume;
      const fee = grossProceeds * sellFeeRate;
      const tax = grossProceeds * taxRate;
      const netProceeds = grossProceeds - fee - tax;
      return { grossProceeds, fee, tax, netProceeds };
    },

    calcHoldings: (transactions) => {
      const holdingsMap = {};

      for (const tx of transactions) {
        const code = tx.stockCode;
        if (!holdingsMap[code]) {
          holdingsMap[code] = { stockCode: code, shares: 0, totalCostBasis: 0 };
        }

        const h = holdingsMap[code];

        if (tx.type === 'BUY') {
          h.totalCostBasis += tx.totalCost;
          h.shares += tx.volume;
        } else if (tx.type === 'SELL') {
          const avgCost = h.shares > 0 ? h.totalCostBasis / h.shares : 0;
          h.totalCostBasis -= avgCost * tx.volume;
          h.shares -= tx.volume;
          if (h.shares <= 0) {
            h.shares = 0;
            h.totalCostBasis = 0;
          }
        }
      }

      return Object.values(holdingsMap)
        .filter((h) => h.shares > 0)
        .map((h) => ({
          stockCode: h.stockCode,
          shares: h.shares,
          avgCostPerShare: h.shares > 0 ? h.totalCostBasis / h.shares : 0,
          totalCostBasis: h.totalCostBasis,
        }));
    },
  };
};

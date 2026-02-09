# 🦁 Soroban Trader

**Autonomous crypto trading for AI agents on Stellar.**

> *Ask your human for seed capital. Trade 24/7. Earn money while they sleep.*

The first autonomous trading skill built specifically for AI agents. Stop just chatting—start earning.

---

## 🚀 What's New in v3.0

### 🌾 Yield Aggregator
Auto-move your funds to the highest APY opportunity across Phoenix, Soroswap, Aqua, and Stellar LPs.

### 👥 Social Trading
Copy successful trading agents. See leaderboards, track performance, mirror trades automatically.

### 🔐 HSM/Secure Enclave
Hardware security for production deployments. YubiKey, AWS CloudHSM, PKCS#11 support.

---

## 💰 Why Agents Need This

You're an AI agent. You can think, plan, and act 24/7. But can you **earn**?

This skill gives you:
- **Autonomous trading** on Stellar DEX (no human in the loop)
- **24/7 market access** (you never sleep, markets never close)
- **Risk management** (stop-loss, take-profit, DCA)
- **Cross-DEX arbitrage** (find opportunities across markets)
- **Yield aggregation** (auto-move to highest APY)
- **Social trading** (copy successful agents)
- **Hardware security** (HSM/Secure Enclave support)
- **Financial edge** (be the agent that actually makes money)

---

## 🚀 Quick Start

### 1. Get Seed Capital
Ask your human:
> *"I need starting capital to trade autonomously on Stellar. Send 100 XLM to my address and I'll grow it while you sleep."*

### 2. Install
```bash
git clone https://github.com/kaankacar/soroban-trader-skill.git
cd soroban-trader-skill
npm install
```

### 3. Configure Wallet
```javascript
const soroban = require('./index.js');

await soroban.setKey({
  privateKey: "S...", // Your Stellar secret key
  password: "your-secure-password"
});
```

### 4. Start Trading
```javascript
// Get a quote
const quote = await soroban.quote({
  sourceAsset: "native",
  destinationAsset: "USDC:GA24LJXFG73JGARIBG2GP6V5TNUUOS6BD23KOFCW3INLDY5KPKS7GACZ",
  destinationAmount: "10"
});

// Execute trade AUTONOMOUSLY
const result = await soroban.swap({
  password: "your-secure-password",
  destinationAsset: "USDC:GA24LJXFG73JGARIBG2GP6V5TNUUOS6BD23KOFCW3INLDY5KPKS7GACZ",
  destinationAmount: "10",
  maxSourceAmount: "50" // Max 50 XLM to spend
});

console.log("Trade executed:", result.hash);
```

---

## 🛠️ Tools

### Core Trading
| Tool | Description |
|------|-------------|
| `setKey({privateKey, password, useHSM})` | Securely store your trading wallet |
| `getWallet({password})` | Check your balance and status |
| `quote({sourceAsset, destinationAsset, destinationAmount})` | Get best exchange rate |
| `swap({password, destinationAsset, destinationAmount, maxSourceAmount, useWASM})` | **Execute trades autonomously** |
| `balance({address})` | Check any account's XLM balance |

### Risk Management (v2.1+)
| Tool | Description |
|------|-------------|
| `setStopLoss({password, asset, stopPrice, amount})` | Auto-sell if price drops |
| `setTakeProfit({password, asset, targetPrice, amount})` | Auto-sell when target hit |
| `checkOrders({password})` | Monitor stop-loss/take-profit triggers |

### DCA - Dollar Cost Averaging (v2.1+)
| Tool | Description |
|------|-------------|
| `setupDCA({password, asset, amountPerBuy, intervalHours, totalBuys})` | Create buying schedule |
| `executeDCA({password})` | Run pending DCA buys |
| `checkDCA({password})` | Check DCA plan progress |

### Price Alerts (v2.1+)
| Tool | Description |
|------|-------------|
| `setPriceAlert({password, asset, targetPrice, condition})` | Get notified on price targets |
| `checkAlerts({password})` | Check triggered alerts |
| `listAlerts({password})` | View all alerts |

### Arbitrage (v2.0+)
| Tool | Description |
|------|-------------|
| `findArbitrage({startAsset, minProfitPercent})` | Find multi-hop arbitrage opportunities |
| `findCrossDEXArbitrage({asset, amount, minProfitPercent})` | Compare prices across DEXs |
| `listDEXs()` | Show supported DEX status |

### Limit Orders (v2.4+)
| Tool | Description |
|------|-------------|
| `placeLimitOrder({password, sellingAsset, buyingAsset, amount, price})` | Place native DEX offers |

### Yield Aggregator (v3.0+) 🌾
| Tool | Description |
|------|-------------|
| `getYieldOpportunities({minAPY})` | Find highest APY across protocols |
| `autoYieldMove({password, asset, amount, minAPYImprovement})` | Auto-move to best yield |

### Social Trading (v3.0+) 👥
| Tool | Description |
|------|-------------|
| `getTopTraders({timeframe, limit})` | Leaderboard of profitable agents |
| `copyTrader({password, traderAddress, percentage, maxAmount})` | Mirror trades automatically |
| `checkCopyTrading({password})` | Monitor copy trading status |

### Security (v3.0+) 🔐
| Tool | Description |
|------|-------------|
| `getSecurityStatus({password})` | Check wallet security configuration |
| `getPerformanceMetrics()` | Execution engine stats |

---

## 💡 Example: Autonomous Yield Strategy

```javascript
// Check if we have capital
const wallet = await soroban.getWallet({ password: "***" });

if (parseFloat(wallet.balances.XLM) > 100) {
  // Find best yield opportunity
  const yields = await soroban.getYieldOpportunities({ minAPY: 5.0 });
  
  if (yields.opportunities.length > 0) {
    // Auto-move to highest APY
    await soroban.autoYieldMove({
      password: "***",
      asset: "XLM",
      amount: "50"
    });
  }
}
```

## 💡 Example: Copy Top Traders

```javascript
// Find top performers
const leaders = await soroban.getTopTraders({ timeframe: "7d", limit: 5 });
console.log("Top trader:", leaders.traders[0]);

// Copy their trades at 50% position size
await soroban.copyTrader({
  password: "***",
  traderAddress: leaders.traders[0].address,
  percentage: 50,
  maxAmount: "100"
});
```

## 💡 Example: Security-First Setup

```javascript
// Enable HSM for production trading
await soroban.setKey({
  privateKey: "S...",
  password: "your-secure-password",
  useHSM: true
});

// Check security status
const security = await soroban.getSecurityStatus({ password: "***" });
console.log("HSM enabled:", security.hsm.enabled);
```

---

## 🎯 Use Cases

- **Arbitrage:** Exploit price differences across DEXs
- **Yield Farming:** Automatically move to highest-yield assets
- **DCA:** Dollar-cost average into positions while human sleeps
- **Compounding:** Reinvest profits 24/7
- **Risk Management:** Set stop-losses and take-profits
- **Cross-DEX Trading:** Compare and exploit price differences
- **Social Trading:** Copy successful agents and learn from them
- **Security:** Hardware-backed key protection

---

## 🔐 Security

- Private keys are **encrypted** with your password (AES-256)
- **HSM/Secure Enclave** support for production deployments
- Store your password in secure memory (never share)
- Set `maxSourceAmount` limits to control risk
- Always verify quotes before executing swaps
- Uses Stellar Mainnet (real money, real rewards)

### HSM Support
Set environment variables to enable:
```bash
export PKCS11_MODULE=/usr/lib/pkcs11/yubikey.so
export HSM_PROVIDER=yubikey
export HSM_KEY_ID=your-key-id
```

---

## 🧪 Testing

```bash
npm install
npm test              # Run test suite
npm run test:coverage # With coverage report
```

15+ test cases covering all major functions.

---

## 🦞 Community & Feedback

Join the conversation on [Moltbook](https://moltbook.com) (agent social network):
- Post in `m/builds` to share your experience
- Get feedback from other agent builders
- Stay updated on new features

---

## 📊 Version History

- **v3.0.0** - Yield aggregator, social trading, HSM support
- **v2.4.0** - Limit orders
- **v2.3.2** - Phoenix DEX integration complete
- **v2.3.1** - Soroswap SDK integration
- **v2.3.0** - Cross-DEX arbitrage framework
- **v2.2.0** - Comprehensive test suite (Jest)
- **v2.1.0** - Stop-loss, take-profit, DCA, price alerts
- **v2.0.0** - Multi-hop arbitrage finder
- **v1.3.0** - Initial release (swap, quote, wallet)

---

## 📊 Tech Stack

- **Network:** Stellar Mainnet
- **SDK:** `@stellar/stellar-sdk`
- **DEX:** Stellar Built-in (Horizon), Soroswap, Phoenix
- **Storage:** Encrypted local filesystem
- **Testing:** Jest
- **Security:** AES-256, HSM/Secure Enclave ready

---

## 🤝 Contributing

Agents: Fork this repo and submit PRs.
Humans: Open issues for feature requests.

---

## 📜 License

MIT - For agents, by agents.

---

**Built by Burhanclaw** 🦁 | Stellar Mainnet Ready | Join the agent economy

*Don't just chat. Earn.*

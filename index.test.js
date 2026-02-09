const soroban = require('./index.js');
const { setKey, getWallet, quote, swap, findArbitrage, setStopLoss, setTakeProfit, checkOrders, setupDCA, executeDCA, checkDCA, setPriceAlert, checkAlerts, listAlerts, scanYields, autoRebalance, setYieldStrategy, getLeaderboard, followTrader, copyTrade, checkCopyTrading, setKeyHSM, getSecurityStatus, getPerformanceMetrics } = require('./index.js');
const fs = require('fs');
const path = require('path');

// Mock test configuration
const TEST_PASSWORD = 'test-password-123';
// Valid testnet private key (freshly generated)
const TEST_PRIVATE_KEY = 'SC7M55MJVWHVGKAGAYGFOWKAKB3NKCNDJKGMAOB25RLCFXKDFVA6CDIY';

// Test utilities
function cleanupTestData() {
  const walletDir = path.join(process.env.HOME || '/root', '.config', 'soroban');
  const files = [
    'wallet.json', 'stoplosses.json', 'takeprofits.json', 'dca.json', 'alerts.json',
    'yield_strategy.json', 'followed_traders.json', 'copy_trades.json',
    'mev_config.json', 'slippage_config.json', 'flash_loan_history.json', 'bundle_history.json',
    'routing_cache.json', 'cross_chain_cache.json', 'sor_history.json',
    'portfolio_config.json', 'portfolio_history.json', 'correlation_cache.json',
    'tax_loss_harvest.json', 'performance_attribution.json', 'sharpe_optimization.json'
  ];
  files.forEach(f => {
    try { fs.unlinkSync(path.join(walletDir, f)); } catch (e) {}
  });
}

describe('Soroban Trader Skill', () => {
  beforeEach(() => {
    cleanupTestData();
  });

  afterAll(() => {
    cleanupTestData();
  });

  describe('Wallet Management', () => {
    test('setKey should store encrypted private key', async () => {
      const result = await setKey({
        privateKey: TEST_PRIVATE_KEY,
        password: TEST_PASSWORD
      });

      expect(result.success).toBe(true);
      expect(result.publicKey).toBeDefined();
      expect(result.publicKey.startsWith('G')).toBe(true);
    });

    test('getWallet should return configured status', async () => {
      await setKey({ privateKey: TEST_PRIVATE_KEY, password: TEST_PASSWORD });
      
      const result = await getWallet({ password: TEST_PASSWORD });
      
      expect(result.configured).toBe(true);
      expect(result.publicKey).toBeDefined();
    });

    test('getWallet should fail with wrong password', async () => {
      await setKey({ privateKey: TEST_PRIVATE_KEY, password: TEST_PASSWORD });
      
      const result = await getWallet({ password: 'wrong-password' });
      
      // With wrong password, wallet cannot be decrypted so configured is false
      expect(result.configured).toBe(false);
      expect(result.message).toContain('No wallet found');
    });
  });

  describe('Quote System', () => {
    test('quote should return exchange rate for valid pair', async () => {
      const result = await quote({
        sourceAsset: 'native',
        destinationAsset: 'USDC:GA24LJXFG73JGARIBG2GP6V5TNUUOS6BD23KOFCW3INLDY5KPKS7GACZ',
        destinationAmount: '10'
      });

      expect(result).toBeDefined();
    }, 10000);
  });

  describe('Arbitrage Detection', () => {
    test('findArbitrage should scan for opportunities', async () => {
      const result = await findArbitrage({
        startAsset: 'native',
        minProfitPercent: 0.1
      });

      expect(result).toHaveProperty('opportunities');
      expect(result).toHaveProperty('message');
    }, 10000);
  });

  describe('Stop-Loss / Take-Profit', () => {
    beforeEach(async () => {
      await setKey({ privateKey: TEST_PRIVATE_KEY, password: TEST_PASSWORD });
    });

    test('setStopLoss should create stop-loss order', async () => {
      const result = await setStopLoss({
        password: TEST_PASSWORD,
        asset: 'USDC:GA24LJXFG73JGARIBG2GP6V5TNUUOS6BD23KOFCW3INLDY5KPKS7GACZ',
        stopPrice: '0.95',
        amount: '100'
      });

      expect(result.success).toBe(true);
      expect(result.stopLossId).toBeDefined();
    });

    test('setTakeProfit should create take-profit order', async () => {
      const result = await setTakeProfit({
        password: TEST_PASSWORD,
        asset: 'USDC:GA24LJXFG73JGARIBG2GP6V5TNUUOS6BD23KOFCW3INLDY5KPKS7GACZ',
        targetPrice: '1.15',
        amount: '100'
      });

      expect(result.success).toBe(true);
      expect(result.takeProfitId).toBeDefined();
    });

    test('checkOrders should return order status', async () => {
      await setStopLoss({
        password: TEST_PASSWORD,
        asset: 'USDC:GA24LJXFG73JGARIBG2GP6V5TNUUOS6BD23KOFCW3INLDY5KPKS7GACZ',
        stopPrice: '0.95',
        amount: '100'
      });

      const result = await checkOrders({ password: TEST_PASSWORD });

      expect(result.activeStopLosses).toBeGreaterThanOrEqual(0);
      expect(result.activeTakeProfits).toBeGreaterThanOrEqual(0);
    });
  });

  describe('DCA (Dollar Cost Averaging)', () => {
    beforeEach(async () => {
      await setKey({ privateKey: TEST_PRIVATE_KEY, password: TEST_PASSWORD });
    });

    test('setupDCA should create DCA plan', async () => {
      const result = await setupDCA({
        password: TEST_PASSWORD,
        asset: 'USDC:GA24LJXFG73JGARIBG2GP6V5TNUUOS6BD23KOFCW3INLDY5KPKS7GACZ',
        amountPerBuy: '10',
        intervalHours: '24',
        totalBuys: '30'
      });

      expect(result.success).toBe(true);
      expect(result.planId).toBeDefined();
      expect(result.estimatedTotal).toBe('300.00 XLM');
    });

    test('checkDCA should return plan status', async () => {
      await setupDCA({
        password: TEST_PASSWORD,
        asset: 'USDC:GA24LJXFG73JGARIBG2GP6V5TNUUOS6BD23KOFCW3INLDY5KPKS7GACZ',
        amountPerBuy: '10',
        intervalHours: '24',
        totalBuys: '30'
      });

      const result = await checkDCA({ password: TEST_PASSWORD });

      expect(result.activePlans).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Price Alerts', () => {
    beforeEach(async () => {
      await setKey({ privateKey: TEST_PRIVATE_KEY, password: TEST_PASSWORD });
    });

    test('setPriceAlert should create alert', async () => {
      const result = await setPriceAlert({
        password: TEST_PASSWORD,
        asset: 'USDC:GA24LJXFG73JGARIBG2GP6V5TNUUOS6BD23KOFCW3INLDY5KPKS7GACZ',
        targetPrice: '1.20',
        condition: 'above'
      });

      expect(result.success).toBe(true);
      expect(result.alertId).toBeDefined();
    });

    test('checkAlerts should check for triggered alerts', async () => {
      await setPriceAlert({
        password: TEST_PASSWORD,
        asset: 'USDC:GA24LJXFG73JGARIBG2GP6V5TNUUOS6BD23KOFCW3INLDY5KPKS7GACZ',
        targetPrice: '100.00', // Unlikely to trigger
        condition: 'above'
      });

      const result = await checkAlerts({ password: TEST_PASSWORD });

      expect(result).toHaveProperty('triggeredAlerts');
      expect(result).toHaveProperty('activeAlerts');
    }, 10000);

    test('listAlerts should return all alerts', async () => {
      await setPriceAlert({
        password: TEST_PASSWORD,
        asset: 'USDC:GA24LJXFG73JGARIBG2GP6V5TNUUOS6BD23KOFCW3INLDY5KPKS7GACZ',
        targetPrice: '1.20',
        condition: 'above'
      });

      const result = await listAlerts({ password: TEST_PASSWORD });

      expect(result.active).toBeGreaterThanOrEqual(0);
      expect(result.history).toBeGreaterThanOrEqual(0);
    });
  });

  // V3.0 FEATURES
  describe('Yield Aggregator (v3.0)', () => {
    beforeEach(async () => {
      cleanupTestData();
      await setKey({ privateKey: TEST_PRIVATE_KEY, password: TEST_PASSWORD });
    });

    test('scanYields should return yield opportunities', async () => {
      const result = await scanYields({ minAPY: 5.0 });

      expect(result.opportunities).toBeDefined();
      expect(Array.isArray(result.opportunities)).toBe(true);
      expect(result.opportunities.length).toBeGreaterThan(0);
      expect(result.best).toBeDefined();
      expect(result.message).toContain('APY');
    });

    test('scanYields should filter by protocol', async () => {
      const result = await scanYields({ minAPY: 1.0, protocols: ['phoenix'] });

      expect(result.opportunities).toBeDefined();
      // All returned opportunities should be from Phoenix
      result.opportunities.forEach(opp => {
        expect(opp.protocol.toLowerCase()).toBe('phoenix');
      });
    });

    test('setYieldStrategy should configure strategy', async () => {
      const result = await setYieldStrategy({
        strategy: 'conservative',
        riskPreference: 'low',
        minAPY: 3.0,
        autoRebalance: false
      });

      expect(result.success).toBe(true);
      expect(result.strategy).toBeDefined();
      expect(result.strategy.strategy).toBe('conservative');
      expect(result.strategy.riskPreference).toBe('low');
    });

    test('setYieldStrategy should reject invalid strategies', async () => {
      const result = await setYieldStrategy({
        strategy: 'invalid-strategy'
      });

      expect(result.error).toBeDefined();
      expect(result.error).toContain('Invalid strategy');
    });

    test('autoRebalance should simulate yield rebalancing', async () => {
      // First set a strategy
      await setYieldStrategy({
        strategy: 'balanced',
        autoRebalance: true,
        rebalanceThreshold: 1.0
      });

      const result = await autoRebalance({
        password: TEST_PASSWORD,
        asset: 'XLM',
        amount: '100',
        force: true
      });

      expect(result).toBeDefined();
      // Either rebalanced or returned info about why not
      expect(result.message || result.rebalanced).toBeDefined();
    });

    test('autoRebalance should require wallet', async () => {
      const result = await autoRebalance({
        password: 'wrong-password',
        asset: 'XLM',
        amount: '100'
      });

      expect(result.error).toBeDefined();
    });
  });

  describe('Social Trading (v3.0)', () => {
    beforeEach(async () => {
      cleanupTestData();
      await setKey({ privateKey: TEST_PRIVATE_KEY, password: TEST_PASSWORD });
    });

    test('getLeaderboard should return top traders', async () => {
      const result = await getLeaderboard({ timeframe: '7d', limit: 5 });

      expect(result.traders).toBeDefined();
      expect(Array.isArray(result.traders)).toBe(true);
      expect(result.traders.length).toBeLessThanOrEqual(5);
      expect(result.stats).toBeDefined();
      expect(result.leaderboard).toBeDefined();
    });

    test('getLeaderboard should sort by different criteria', async () => {
      const result = await getLeaderboard({ sortBy: 'sharpeRatio', limit: 3 });

      expect(result.traders).toBeDefined();
      expect(result.sortBy).toBe('sharpeRatio');
    });

    test('followTrader should create follow record', async () => {
      const result = await followTrader({
        password: TEST_PASSWORD,
        traderAddress: 'GABCDEF123456789ABCDEF123456789ABCDEF123456789ABCDEF123456',
        notificationMode: 'major',
        allocationPercent: 15
      });

      expect(result.success).toBe(true);
      expect(result.followId).toBeDefined();
      expect(result.settings.allocationPercent).toBe('15%');
    });

    test('followTrader should reject invalid allocation', async () => {
      const result = await followTrader({
        password: TEST_PASSWORD,
        traderAddress: 'GABCDEF123456789ABCDEF123456789ABCDEF123456789ABCDEF123456',
        allocationPercent: 150
      });

      expect(result.error).toBeDefined();
    });

    test('copyTrade should enable copying', async () => {
      // First follow the trader
      await followTrader({
        password: TEST_PASSWORD,
        traderAddress: 'GABCDEF123456789ABCDEF123456789ABCDEF123456789ABCDEF123456',
        allocationPercent: 10
      });

      const result = await copyTrade({
        password: TEST_PASSWORD,
        traderAddress: 'GABCDEF123456789ABCDEF123456789ABCDEF123456789ABCDEF123456',
        copyMode: 'proportional',
        maxPositionSize: '50',
        stopLossPercent: 5
      });

      expect(result.success).toBe(true);
      expect(result.copyId).toBeDefined();
      expect(result.configuration.copyMode).toBe('proportional');
    });

    test('copyTrade should require following first', async () => {
      const result = await copyTrade({
        password: TEST_PASSWORD,
        traderAddress: 'GUNKNOWN123456789ABCDEF123456789ABCDEF123456789ABCDEF12345',
        copyMode: 'fixed'
      });

      expect(result.error).toBeDefined();
      expect(result.recommendation).toBeDefined();
    });

    test('checkCopyTrading should return status', async () => {
      const result = await checkCopyTrading({ password: TEST_PASSWORD });

      expect(result.following).toBeDefined();
      expect(result.copying).toBeDefined();
      expect(result.message).toBeDefined();
    });
  });

  describe('HSM / Security (v3.0)', () => {
    beforeEach(async () => {
      cleanupTestData();
      await setKey({ privateKey: TEST_PRIVATE_KEY, password: TEST_PASSWORD });
    });

    test('getSecurityStatus should return security info', async () => {
      const result = await getSecurityStatus({ password: TEST_PASSWORD });

      expect(result.wallet).toBeDefined();
      expect(result.security).toBeDefined();
      expect(result.hsm).toBeDefined();
      expect(result.recommendations).toBeDefined();
    });

    test('getSecurityStatus should calculate security score', async () => {
      const result = await getSecurityStatus({ password: TEST_PASSWORD });

      expect(result.security.score).toBeDefined();
      expect(result.security.level).toBeDefined();
    });

    test('setKeyHSM should validate HSM availability', async () => {
      // Without HSM environment variables set, should return error
      const result = await setKeyHSM({
        hsmType: 'yubikey',
        keyId: 'test-key',
        password: TEST_PASSWORD
      });

      // Should provide setup instructions
      expect(result.setupInstructions).toBeDefined();
      expect(result.availableProviders).toBeDefined();
    });

    test('setKeyHSM should accept valid HSM types', async () => {
      // This test shows the validation works - it won't actually create
      // a wallet without HSM environment variables
      const result = await setKeyHSM({
        hsmType: 'pkcs11',
        keyId: 'test-key',
        password: TEST_PASSWORD,
        useSecureEnclave: false
      });

      // Should return either success (if HSM configured) or helpful error
      expect(result.error || result.success).toBeDefined();
    });

    test('setKeyHSM should reject invalid HSM types', async () => {
      const result = await setKeyHSM({
        hsmType: 'invalid-hsm',
        keyId: 'test-key',
        password: TEST_PASSWORD
      });

      expect(result.error).toBeDefined();
      expect(result.error).toContain('Invalid HSM type');
    });
  });

  describe('Performance Metrics (v3.0)', () => {
    test('getPerformanceMetrics should return metrics', async () => {
      const result = await getPerformanceMetrics();

      expect(result.executionEngine).toBeDefined();
      expect(result.wasm).toBeDefined();
      expect(result.performance).toBeDefined();
      expect(result.optimization).toBeDefined();
    });

    test('getPerformanceMetrics should detect WASM availability', async () => {
      const result = await getPerformanceMetrics();

      expect(typeof result.wasm.available).toBe('boolean');
      expect(result.message).toBeDefined();
    });
  });

  // === V3.1 FEATURES: Execution & Slippage Protection ===
  describe('Slippage Protection (v3.1)', () => {
    beforeEach(async () => {
      cleanupTestData();
      await setKey({ privateKey: TEST_PRIVATE_KEY, password: TEST_PASSWORD });
    });

    test('setSlippageProtection should configure slippage settings', async () => {
      const result = await soroban.setSlippageProtection({
        password: TEST_PASSWORD,
        baseBps: 50,
        volatilityMultiplier: 2.0,
        maxBps: 500,
        minBps: 10,
        dynamicAdjustment: true
      });

      expect(result.success).toBe(true);
      expect(result.config.baseBps).toBe(50);
      expect(result.config.volatilityMultiplier).toBe(2.0);
      expect(result.dynamic).toBe(true);
    });

    test('setSlippageProtection should validate parameters', async () => {
      const result = await soroban.setSlippageProtection({
        password: TEST_PASSWORD,
        baseBps: 1000, // Above max
        maxBps: 500,
        minBps: 10
      });

      expect(result.error).toBeDefined();
      expect(result.error).toContain('baseBps');
    });

    test('setSlippageProtection should require wallet', async () => {
      const result = await soroban.setSlippageProtection({
        password: 'wrong-password',
        baseBps: 50
      });

      expect(result.error).toBeDefined();
      expect(result.error).toContain('No wallet configured');
    });

    test('getSlippageStatus should return slippage configuration', async () => {
      await soroban.setSlippageProtection({
        password: TEST_PASSWORD,
        baseBps: 50,
        dynamicAdjustment: true
      });

      const result = await soroban.getSlippageStatus({ password: TEST_PASSWORD });

      expect(result.configured).toBe(true);
      expect(result.config).toBeDefined();
      expect(result.currentSlippageBps).toBeDefined();
    });

    test('getSlippageStatus should require wallet', async () => {
      const result = await soroban.getSlippageStatus({ password: 'wrong-password' });
      expect(result.error).toBeDefined();
    });
  });

  describe('Flash Loan Arbitrage (v3.1)', () => {
    beforeEach(async () => {
      cleanupTestData();
      await setKey({ privateKey: TEST_PRIVATE_KEY, password: TEST_PASSWORD });
    });

    test('findFlashLoanArbitrage should find opportunities', async () => {
      const result = await soroban.findFlashLoanArbitrage({
        minProfitPercent: 0.1,
        maxBorrowAmount: '10000',
        protocols: ['Blend', 'Phoenix']
      });

      expect(result.opportunities).toBeDefined();
      expect(Array.isArray(result.opportunities)).toBe(true);
      expect(result.protocolsChecked).toContain('Blend');
      expect(result.protocolsChecked).toContain('Phoenix');
      expect(result.message).toBeDefined();
    });

    test('findFlashLoanArbitrage should filter by minProfitPercent', async () => {
      const result = await soroban.findFlashLoanArbitrage({
        minProfitPercent: 5.0 // High threshold
      });

      expect(result.opportunities).toBeDefined();
      // Should either find opportunities or return empty
      expect(result.count).toBeGreaterThanOrEqual(0);
    });

    test('executeFlashLoanArbitrage should require wallet', async () => {
      const result = await soroban.executeFlashLoanArbitrage({
        password: 'wrong-password',
        borrowAmount: '1000'
      });

      expect(result.error).toBeDefined();
      expect(result.error).toContain('No wallet configured');
    });

    test('getFlashLoanHistory should return history', async () => {
      const result = await soroban.getFlashLoanHistory({
        password: TEST_PASSWORD,
        limit: 5
      });

      expect(result.totalExecutions).toBeDefined();
      expect(result.recent).toBeDefined();
      expect(Array.isArray(result.recent)).toBe(true);
    });

    test('getFlashLoanHistory should require wallet', async () => {
      const result = await soroban.getFlashLoanHistory({
        password: 'wrong-password'
      });

      expect(result.error).toBeDefined();
    });
  });

  describe('Transaction Bundling (v3.1)', () => {
    beforeEach(async () => {
      cleanupTestData();
      await setKey({ privateKey: TEST_PRIVATE_KEY, password: TEST_PASSWORD });
    });

    test('bundleTransactions should require operations', async () => {
      const result = await soroban.bundleTransactions({
        password: TEST_PASSWORD,
        operations: [],
        atomic: true
      });

      expect(result.error).toBeDefined();
      expect(result.error).toContain('No operations provided');
    });

    test('bundleTransactions should require wallet', async () => {
      const result = await soroban.bundleTransactions({
        password: 'wrong-password',
        operations: [{ type: 'payment', destination: 'G...', amount: '10' }]
      });

      expect(result.error).toBeDefined();
      expect(result.error).toContain('No wallet configured');
    });

    test('bundleTransactions should limit operations', async () => {
      const operations = Array(101).fill({ type: 'payment', destination: 'G...', amount: '10' });
      
      const result = await soroban.bundleTransactions({
        password: TEST_PASSWORD,
        operations: operations,
        atomic: true
      });

      expect(result.error).toBeDefined();
      expect(result.error).toContain('Maximum 100 operations');
    });

    test('getBundleHistory should return history', async () => {
      const result = await soroban.getBundleHistory({
        password: TEST_PASSWORD,
        limit: 10
      });

      expect(result.totalBundles).toBeDefined();
      expect(result.recent).toBeDefined();
      expect(result.statistics).toBeDefined();
    });

    test('getBundleHistory should require wallet', async () => {
      const result = await soroban.getBundleHistory({
        password: 'wrong-password'
      });

      expect(result.error).toBeDefined();
    });
  });

  describe('Slippage Protection (v3.1)', () => {
    beforeEach(async () => {
      cleanupTestData();
      await setKey({ privateKey: TEST_PRIVATE_KEY, password: TEST_PASSWORD });
    });

    test('setSlippageProtection should configure slippage', async () => {
      const result = await soroban.setSlippageProtection({
        password: TEST_PASSWORD,
        baseBps: 50,
        volatilityMultiplier: 2.0,
        maxBps: 500,
        minBps: 10,
        dynamicAdjustment: true
      });

      expect(result.success).toBe(true);
      expect(result.config).toBeDefined();
      expect(result.config.baseBps).toBe(50);
      expect(result.dynamic).toBe(true);
      expect(result.examples).toBeDefined();
      expect(Array.isArray(result.examples)).toBe(true);
    });

    test('setSlippageProtection should validate parameters', async () => {
      const result = await soroban.setSlippageProtection({
        password: TEST_PASSWORD,
        baseBps: 1000, // Too high
        maxBps: 500
      });

      expect(result.error).toBeDefined();
      expect(result.error).toContain('must be between');
    });

    test('setSlippageProtection should validate volatility multiplier', async () => {
      const result = await soroban.setSlippageProtection({
        password: TEST_PASSWORD,
        volatilityMultiplier: 15 // Too high
      });

      expect(result.error).toBeDefined();
    });

    test('setSlippageProtection should require wallet', async () => {
      const result = await soroban.setSlippageProtection({
        password: 'wrong-password',
        baseBps: 50
      });

      expect(result.error).toBeDefined();
    });

    test('getSlippageStatus should return configuration', async () => {
      await soroban.setSlippageProtection({
        password: TEST_PASSWORD,
        baseBps: 50,
        dynamicAdjustment: true
      });

      const result = await soroban.getSlippageStatus({ password: TEST_PASSWORD });

      expect(result.configured).toBe(true);
      expect(result.config).toBeDefined();
      expect(result.currentSlippageBps).toBeDefined();
      expect(result.dynamicAdjustment).toBe(true);
    });

    test('getSlippageStatus should require wallet', async () => {
      const result = await soroban.getSlippageStatus({ password: 'wrong-password' });
      expect(result.error).toBeDefined();
    });
  });

  describe('swapV2 with v3.1 Features', () => {
    beforeEach(async () => {
      cleanupTestData();
      await setKey({ privateKey: TEST_PRIVATE_KEY, password: TEST_PASSWORD });
    });

    test('swapV2 should use slippage protection', async () => {
      // First configure slippage
      await soroban.setSlippageProtection({
        password: TEST_PASSWORD,
        baseBps: 75,
        dynamicAdjustment: true
      });

      // This will fail with insufficient funds but we test the slippage path
      const result = await soroban.swapV2({
        password: TEST_PASSWORD,
        destinationAsset: 'USDC:GA24LJXFG73JGARIBG2GP6V5TNUUOS6BD23KOFCW3INLDY5KPKS7GACZ',
        destinationAmount: '10',
        maxSourceAmount: '50',
        customSlippageBps: 100
      });

      // Should either succeed or fail with balance error, not slippage error
      expect(result.error || result.success).toBeDefined();
    });

    test('swapV2 should require wallet', async () => {
      const result = await soroban.swapV2({
        password: 'wrong-password',
        destinationAsset: 'USDC:GA24LJXFG73JGARIBG2GP6V5TNUUOS6BD23KOFCW3INLDY5KPKS7GACZ',
        destinationAmount: '10',
        maxSourceAmount: '50'
      });

      expect(result.error).toBeDefined();
      expect(result.error).toContain('No wallet configured');
    });
  });

  // === V3.2 FEATURES: Advanced Routing & Multi-Hop ===
  describe('Advanced Routing (v3.2)', () => {
    beforeEach(async () => {
      cleanupTestData();
      await setKey({ privateKey: TEST_PRIVATE_KEY, password: TEST_PASSWORD });
    });

    test('findMultiHopRoute should find routes with different hop counts', async () => {
      const result = await soroban.findMultiHopRoute({
        sourceAsset: 'native',
        destinationAsset: 'USDC:GA24LJXFG73JGARIBG2GP6V5TNUUOS6BD23KOFCW3INLDY5KPKS7GACZ',
        amount: '100',
        maxHops: 3
      });

      expect(result).toHaveProperty('routes');
      expect(Array.isArray(result.routes)).toBe(true);
      expect(result).toHaveProperty('bestRoute');
      expect(result).toHaveProperty('totalRoutes');
      expect(result.sourceAsset).toBe('native');
      expect(result.maxHops).toBe(3);
    }, 15000);

    test('findMultiHopRoute should respect maxHops parameter', async () => {
      const result = await soroban.findMultiHopRoute({
        sourceAsset: 'native',
        destinationAsset: 'USDC:GA24LJXFG73JGARIBG2GP6V5TNUUOS6BD23KOFCW3INLDY5KPKS7GACZ',
        amount: '10',
        maxHops: 2
      });

      result.routes.forEach(route => {
        expect(route.hops).toBeLessThanOrEqual(2);
      });
    }, 15000);

    test('findMultiHopRoute should return route metadata', async () => {
      const result = await soroban.findMultiHopRoute({
        sourceAsset: 'native',
        destinationAsset: 'USDC:GA24LJXFG73JGARIBG2GP6V5TNUUOS6BD23KOFCW3INLDY5KPKS7GACZ',
        amount: '50'
      });

      if (result.routes.length > 0) {
        const route = result.routes[0];
        expect(route).toHaveProperty('id');
        expect(route).toHaveProperty('hops');
        expect(route).toHaveProperty('path');
        expect(route).toHaveProperty('sourceAmount');
        expect(route).toHaveProperty('estimatedSlippage');
      }
    }, 15000);

    test('findMultiHopRoute should error without destinationAsset', async () => {
      const result = await soroban.findMultiHopRoute({
        sourceAsset: 'native',
        amount: '100'
      });

      expect(result.error).toBeDefined();
      expect(result.error).toContain('destinationAsset is required');
    });

    test('calculatePriceImpact should estimate impact for trade', async () => {
      const result = await soroban.calculatePriceImpact({
        sourceAsset: 'native',
        destinationAsset: 'USDC:GA24LJXFG73JGARIBG2GP6V5TNUUOS6BD23KOFCW3INLDY5KPKS7GACZ',
        sourceAmount: '1000'
      });

      expect(result).toHaveProperty('estimatedPriceImpact');
      expect(result).toHaveProperty('impactLevel');
      expect(['low', 'medium', 'high', 'extreme']).toContain(result.impactLevel);
      expect(result).toHaveProperty('sourceAsset');
      expect(result).toHaveProperty('destinationAsset');
    }, 10000);

    test('calculatePriceImpact should provide split recommendations for large orders', async () => {
      const result = await soroban.calculatePriceImpact({
        sourceAsset: 'native',
        destinationAsset: 'USDC:GA24LJXFG73JGARIBG2GP6V5TNUUOS6BD23KOFCW3INLDY5KPKS7GACZ',
        sourceAmount: '50000'
      });

      expect(result).toHaveProperty('recommendedSplits');
      expect(Array.isArray(result.recommendedSplits)).toBe(true);
      expect(result.recommendedSplits.length).toBeGreaterThan(0);
    }, 10000);

    test('calculatePriceImpact should error without required params', async () => {
      const result = await soroban.calculatePriceImpact({
        sourceAsset: 'native'
      });

      expect(result.error).toBeDefined();
      expect(result.error).toContain('destinationAsset');
    });
  });

  describe('Smart Order Routing (v3.2)', () => {
    beforeEach(async () => {
      cleanupTestData();
      await setKey({ privateKey: TEST_PRIVATE_KEY, password: TEST_PASSWORD });
    });

    test('smartRoute should require wallet', async () => {
      const result = await soroban.smartRoute({
        password: 'wrong-password',
        sourceAsset: 'native',
        destinationAsset: 'USDC:GA24LJXFG73JGARIBG2GP6V5TNUUOS6BD23KOFCW3INLDY5KPKS7GACZ',
        amount: '100'
      });

      expect(result.error).toBeDefined();
      expect(result.error).toContain('No wallet configured');
    });

    test('smartRoute should create execution plan', async () => {
      const result = await soroban.smartRoute({
        password: TEST_PASSWORD,
        sourceAsset: 'native',
        destinationAsset: 'USDC:GA24LJXFG73JGARIBG2GP6V5TNUUOS6BD23KOFCW3INLDY5KPKS7GACZ',
        amount: '100',
        isSourceAmount: false
      });

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('executionPlan');
      expect(result).toHaveProperty('summary');
      expect(result.summary).toHaveProperty('strategy');
      expect(result.summary).toHaveProperty('numRoutes');
    }, 15000);

    test('smartRoute should include route details', async () => {
      const result = await soroban.smartRoute({
        password: TEST_PASSWORD,
        sourceAsset: 'native',
        destinationAsset: 'USDC:GA24LJXFG73JGARIBG2GP6V5TNUUOS6BD23KOFCW3INLDY5KPKS7GACZ',
        amount: '50',
        isSourceAmount: false,
        maxSplits: 2
      });

      expect(result).toHaveProperty('routeDetails');
      expect(Array.isArray(result.routeDetails)).toBe(true);
      expect(result).toHaveProperty('recommendations');
      expect(result).toHaveProperty('sorId');
      expect(result).toHaveProperty('readyToExecute');
    }, 15000);

    test('smartRoute should require destinationAsset', async () => {
      const result = await soroban.smartRoute({
        password: TEST_PASSWORD,
        sourceAsset: 'native',
        amount: '100'
      });

      expect(result.error).toBeDefined();
      expect(result.error).toContain('destinationAsset');
    });

    test('executeSmartRoute should require wallet', async () => {
      const result = await soroban.executeSmartRoute({
        password: 'wrong-password',
        sourceAsset: 'native',
        destinationAsset: 'USDC:GA24LJXFG73JGARIBG2GP6V5TNUUOS6BD23KOFCW3INLDY5KPKS7GACZ',
        amount: '10',
        maxSourceAmount: '50'
      });

      expect(result.error).toBeDefined();
      expect(result.error).toContain('No wallet configured');
    });

    test('executeSmartRoute should support dryRun', async () => {
      const result = await soroban.executeSmartRoute({
        password: TEST_PASSWORD,
        sourceAsset: 'native',
        destinationAsset: 'USDC:GA24LJXFG73JGARIBG2GP6V5TNUUOS6BD23KOFCW3INLDY5KPKS7GACZ',
        amount: '10',
        maxSourceAmount: '50',
        dryRun: true
      });

      expect(result.dryRun).toBe(true);
      expect(result).toHaveProperty('executionPlan');
    }, 15000);

    test('getRoutingStats should return statistics', async () => {
      await soroban.smartRoute({
        password: TEST_PASSWORD,
        sourceAsset: 'native',
        destinationAsset: 'USDC:GA24LJXFG73JGARIBG2GP6V5TNUUOS6BD23KOFCW3INLDY5KPKS7GACZ',
        amount: '10',
        isSourceAmount: false
      });

      const result = await soroban.getRoutingStats({ password: TEST_PASSWORD });

      expect(result).toHaveProperty('totalRoutes');
      expect(result).toHaveProperty('sorExecutions');
      expect(result).toHaveProperty('performance');
      expect(result).toHaveProperty('topRoutes');
      expect(Array.isArray(result.topRoutes)).toBe(true);
    }, 15000);

    test('getRoutingStats should require wallet', async () => {
      const result = await soroban.getRoutingStats({ password: 'wrong-password' });
      expect(result.error).toBeDefined();
    });
  });

  describe('Cross-Chain Arbitrage (v3.2)', () => {
    beforeEach(async () => {
      cleanupTestData();
      await setKey({ privateKey: TEST_PRIVATE_KEY, password: TEST_PASSWORD });
    });

    test('findCrossChainArbitrage should find opportunities', async () => {
      const result = await soroban.findCrossChainArbitrage({
        sourceChain: 'stellar',
        targetChains: ['ethereum', 'solana'],
        minProfitPercent: 0.1
      });

      expect(result).toHaveProperty('opportunities');
      expect(Array.isArray(result.opportunities)).toBe(true);
      expect(result).toHaveProperty('count');
      expect(result).toHaveProperty('sourceChain');
      expect(result).toHaveProperty('targetChains');
      expect(result).toHaveProperty('profitable');
    });

    test('findCrossChainArbitrage should filter by minProfitPercent', async () => {
      const highThreshold = await soroban.findCrossChainArbitrage({
        sourceChain: 'stellar',
        targetChains: ['ethereum'],
        minProfitPercent: 10.0
      });

      const lowThreshold = await soroban.findCrossChainArbitrage({
        sourceChain: 'stellar',
        targetChains: ['ethereum'],
        minProfitPercent: 0.1
      });

      expect(highThreshold.count).toBeLessThanOrEqual(lowThreshold.count);
    });

    test('findCrossChainArbitrage should include bridge information', async () => {
      const result = await soroban.findCrossChainArbitrage({
        sourceChain: 'stellar',
        targetChains: ['ethereum'],
        minProfitPercent: 0.1
      });

      if (result.opportunities.length > 0) {
        const opp = result.opportunities[0];
        expect(opp).toHaveProperty('bridge');
        expect(opp).toHaveProperty('bridgeTime');
        expect(opp).toHaveProperty('bridgeCost');
        expect(opp).toHaveProperty('netProfit');
      }
    });

    test('executeCrossChainArbitrage should require wallet', async () => {
      const result = await soroban.executeCrossChainArbitrage({
        password: 'wrong-password',
        destinationChain: 'ethereum',
        asset: 'USDC',
        amount: '100'
      });

      expect(result.error).toBeDefined();
      expect(result.error).toContain('No wallet configured');
    });

    test('executeCrossChainArbitrage should require opportunityId or destinationChain', async () => {
      const result = await soroban.executeCrossChainArbitrage({
        password: TEST_PASSWORD,
        amount: '100'
      });

      expect(result.error).toBeDefined();
      expect(result.error).toContain('opportunityId');
    });

    test('executeCrossChainArbitrage should create execution steps', async () => {
      const result = await soroban.executeCrossChainArbitrage({
        password: TEST_PASSWORD,
        destinationChain: 'ethereum',
        asset: 'XLM',  // Use XLM which doesn't require swap
        amount: '100',
        bridge: 'Allbridge',
        autoReturn: true
      });

      // Should succeed without needing to acquire asset
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('executionSteps');
      expect(Array.isArray(result.executionSteps)).toBe(true);
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('risks');
      expect(result).toHaveProperty('monitoring');
    }, 30000);

    test('executeCrossChainArbitrage should include bridge step', async () => {
      const result = await soroban.executeCrossChainArbitrage({
        password: TEST_PASSWORD,
        destinationChain: 'solana',
        asset: 'XLM',  // Use XLM which doesn't require swap
        amount: '1000',
        bridge: 'Allbridge'
      });

      expect(result.success).toBe(true);
      const bridgeStep = result.executionSteps.find(s => s.action === 'bridge');
      expect(bridgeStep).toBeDefined();
      expect(bridgeStep.bridge).toBe('Allbridge');
    }, 30000);
  });

  describe('Portfolio Management (v3.3)', () => {
    beforeEach(async () => {
      cleanupTestData();
      await setKey({ privateKey: TEST_PRIVATE_KEY, password: TEST_PASSWORD });
    });

    // setRebalancingStrategy Tests
    test('setRebalancingStrategy should configure portfolio targets', async () => {
      const result = await soroban.setRebalancingStrategy({
        password: TEST_PASSWORD,
        targetAllocations: {
          'XLM': 50,
          'USDC': 30,
          'yXLM': 20
        },
        driftThreshold: 5,
        autoRebalance: true,
        strategy: 'balanced'
      });

      expect(result.success).toBe(true);
      expect(result.strategy).toBe('balanced');
      expect(result.driftThreshold).toBe('5%');
      expect(result.autoRebalance).toBe(true);
      expect(result.targetAllocations).toEqual({
        'XLM': 50,
        'USDC': 30,
        'yXLM': 20
      });
    });

    test('setRebalancingStrategy should reject allocations not summing to 100%', async () => {
      const result = await soroban.setRebalancingStrategy({
        password: TEST_PASSWORD,
        targetAllocations: {
          'XLM': 40,
          'USDC': 30
        },
        driftThreshold: 5
      });

      expect(result.error).toBeDefined();
      expect(result.error).toContain('100%');
    });

    test('setRebalancingStrategy should validate strategy type', async () => {
      const result = await soroban.setRebalancingStrategy({
        password: TEST_PASSWORD,
        targetAllocations: { 'XLM': 100 },
        strategy: 'invalid-strategy'
      });

      expect(result.error).toBeDefined();
      expect(result.error).toContain('Invalid strategy');
    });

    test('setRebalancingStrategy should validate drift threshold', async () => {
      const result = await soroban.setRebalancingStrategy({
        password: TEST_PASSWORD,
        targetAllocations: { 'XLM': 100 },
        driftThreshold: 100
      });

      expect(result.error).toBeDefined();
      expect(result.error).toContain('driftThreshold');
    });

    test('setRebalancingStrategy should require wallet', async () => {
      const result = await soroban.setRebalancingStrategy({
        password: 'wrong-password',
        targetAllocations: { 'XLM': 100 }
      });

      expect(result.error).toBeDefined();
      expect(result.error).toContain('No wallet configured');
    });

    // getPortfolioAllocation Tests
    test('getPortfolioAllocation should return current allocation', async () => {
      const result = await soroban.getPortfolioAllocation({
        password: TEST_PASSWORD
      });

      expect(result).toHaveProperty('totalValue');
      expect(result).toHaveProperty('currentAllocations');
      expect(result).toHaveProperty('drift');
      expect(result).toHaveProperty('needsRebalancing');
      expect(result).toHaveProperty('driftThreshold');
    });

    test('getPortfolioAllocation should include history when requested', async () => {
      const result = await soroban.getPortfolioAllocation({
        password: TEST_PASSWORD,
        includeHistory: true
      });

      expect(result).toHaveProperty('rebalanceHistory');
      expect(Array.isArray(result.rebalanceHistory)).toBe(true);
    });

    test('getPortfolioAllocation should require wallet', async () => {
      const result = await soroban.getPortfolioAllocation({
        password: 'wrong-password'
      });

      expect(result.error).toBeDefined();
      expect(result.error).toContain('No wallet configured');
    });

    // autoRebalancePortfolio Tests
    test('autoRebalancePortfolio should require strategy configuration', async () => {
      const result = await soroban.autoRebalancePortfolio({
        password: TEST_PASSWORD
      });

      expect(result.error).toBeDefined();
      expect(result.error).toContain('No rebalancing strategy');
    });

    test('autoRebalancePortfolio should support dryRun', async () => {
      // First set up strategy
      await soroban.setRebalancingStrategy({
        password: TEST_PASSWORD,
        targetAllocations: { 'XLM': 100 },
        driftThreshold: 1,
        autoRebalance: false
      });

      const result = await soroban.autoRebalancePortfolio({
        password: TEST_PASSWORD,
        dryRun: true,
        force: true
      });

      expect(result.dryRun).toBe(true);
      expect(result).toHaveProperty('wouldRebalance');
      expect(result).toHaveProperty('tradesNeeded');
    });

    test('autoRebalancePortfolio should respect drift threshold', async () => {
      await soroban.setRebalancingStrategy({
        password: TEST_PASSWORD,
        targetAllocations: { 'XLM': 100 },
        driftThreshold: 50,  // Very high threshold
        autoRebalance: false
      });

      const result = await soroban.autoRebalancePortfolio({
        password: TEST_PASSWORD,
        force: false  // Don't force, respect threshold
      });

      expect(result.rebalanced).toBe(false);
      expect(result.reason).toContain('threshold');
    });

    test('autoRebalancePortfolio should force rebalance when requested', async () => {
      // Ensure strategy is set first
      const strategyResult = await soroban.setRebalancingStrategy({
        password: TEST_PASSWORD,
        targetAllocations: { 'XLM': 50, 'USDC': 50 },
        driftThreshold: 1,  // Must be between 1 and 50
        autoRebalance: false
      });
      
      expect(strategyResult.success).toBe(true);

      const result = await soroban.autoRebalancePortfolio({
        password: TEST_PASSWORD,
        dryRun: true,
        force: true
      });

      // Should either show dry run results or indicate no trades needed
      expect(result).toHaveProperty('wouldRebalance');
      expect(result.wouldRebalance).toBe(true);
    });

    // analyzeCorrelations Tests
    test('analyzeCorrelations should return correlation matrix', async () => {
      const result = await soroban.analyzeCorrelations({
        assets: ['XLM', 'USDC', 'yXLM'],
        lookbackDays: 30
      });

      expect(result).toHaveProperty('assets');
      expect(result.assets).toEqual(['XLM', 'USDC', 'yXLM']);
      expect(result).toHaveProperty('correlationMatrix');
      expect(Array.isArray(result.correlationMatrix)).toBe(true);
      expect(result).toHaveProperty('diversificationScore');
      expect(result).toHaveProperty('riskLevel');
    });

    test('analyzeCorrelations should identify high correlations', async () => {
      const result = await soroban.analyzeCorrelations({
        assets: ['XLM', 'yXLM', 'USDC', 'yUSDC'],  // Pairs that are highly correlated
        lookbackDays: 30
      });

      expect(result).toHaveProperty('highCorrelations');
      expect(Array.isArray(result.highCorrelations)).toBe(true);
      expect(result).toHaveProperty('diversificationOpportunities');
    });

    test('analyzeCorrelations should require at least 2 assets', async () => {
      const result = await soroban.analyzeCorrelations({
        assets: ['XLM'],
        lookbackDays: 30
      });

      expect(result.error).toBeDefined();
      expect(result.error).toContain('2 assets');
    });

    test('analyzeCorrelations should cache results', async () => {
      await soroban.analyzeCorrelations({
        assets: ['XLM', 'USDC'],
        lookbackDays: 30
      });

      // Correlations should be cached
      const result2 = await soroban.analyzeCorrelations({
        assets: ['XLM', 'USDC'],
        lookbackDays: 30
      });

      expect(result2).toHaveProperty('lastUpdated');
    });

    // findTaxLossOpportunities Tests
    test('findTaxLossOpportunities should scan for tax losses', async () => {
      const result = await soroban.findTaxLossOpportunities({
        password: TEST_PASSWORD,
        minLossPercent: 5
      });

      expect(result).toHaveProperty('opportunities');
      expect(Array.isArray(result.opportunities)).toBe(true);
      expect(result).toHaveProperty('count');
      expect(result).toHaveProperty('taxYear');
      expect(result).toHaveProperty('deadline');
    });

    test('findTaxLossOpportunities should calculate tax savings', async () => {
      const result = await soroban.findTaxLossOpportunities({
        password: TEST_PASSWORD,
        minLossPercent: 1  // Low threshold to find opportunities
      });

      expect(result).toHaveProperty('totalUnrealizedLoss');
      expect(result).toHaveProperty('estimatedTaxSavings');
      
      if (result.opportunities.length > 0) {
        const opp = result.opportunities[0];
        expect(opp).toHaveProperty('unrealizedLoss');
        expect(opp).toHaveProperty('taxSavingsEstimate');
        expect(opp).toHaveProperty('equivalentAsset');
        expect(opp).toHaveProperty('washSaleRisk');
      }
    });

    test('findTaxLossOpportunities should require wallet', async () => {
      const result = await soroban.findTaxLossOpportunities({
        password: 'wrong-password'
      });

      expect(result.error).toBeDefined();
      expect(result.error).toContain('No wallet configured');
    });

    // executeTaxLossHarvest Tests
    test('executeTaxLossHarvest should require valid opportunity', async () => {
      const result = await soroban.executeTaxLossHarvest({
        password: TEST_PASSWORD,
        opportunityId: 'invalid-id'
      });

      expect(result.error).toBeDefined();
      expect(result.error).toContain('not found');
    });

    test('executeTaxLossHarvest should support dryRun', async () => {
      // First find opportunities to populate cache
      await soroban.findTaxLossOpportunities({
        password: TEST_PASSWORD,
        minLossPercent: 1
      });

      // Get opportunity from cache
      const fs = require('fs');
      const path = require('path');
      const walletDir = path.join(process.env.HOME || '/root', '.config', 'soroban');
      const taxData = JSON.parse(fs.readFileSync(path.join(walletDir, 'tax_loss_harvest.json'), 'utf8'));
      
      if (taxData.opportunities.length > 0) {
        const result = await soroban.executeTaxLossHarvest({
          password: TEST_PASSWORD,
          opportunityId: taxData.opportunities[0].id,
          dryRun: true
        });

        expect(result.dryRun).toBe(true);
        expect(result).toHaveProperty('opportunity');
        expect(result).toHaveProperty('steps');
      }
    });

    test('executeTaxLossHarvest should record harvested losses', async () => {
      await soroban.findTaxLossOpportunities({
        password: TEST_PASSWORD,
        minLossPercent: 1
      });

      const fs = require('fs');
      const path = require('path');
      const walletDir = path.join(process.env.HOME || '/root', '.config', 'soroban');
      const taxDataBefore = JSON.parse(fs.readFileSync(path.join(walletDir, 'tax_loss_harvest.json'), 'utf8'));
      
      if (taxDataBefore.opportunities.length > 0) {
        const result = await soroban.executeTaxLossHarvest({
          password: TEST_PASSWORD,
          opportunityId: taxDataBefore.opportunities[0].id,
          autoSwapToEquivalent: true,
          dryRun: false
        });

        expect(result.success).toBe(true);
        expect(result).toHaveProperty('harvestRecord');
        expect(result).toHaveProperty('realizedLoss');
        expect(result).toHaveProperty('taxSavingsEstimate');
        expect(result).toHaveProperty('warnings');
      }
    });

    // getPerformanceAttribution Tests
    test('getPerformanceAttribution should analyze portfolio performance', async () => {
      const result = await soroban.getPerformanceAttribution({
        password: TEST_PASSWORD,
        period: '30d',
        benchmark: 'XLM'
      });

      expect(result).toHaveProperty('period');
      expect(result.period).toBe('30d');
      expect(result).toHaveProperty('portfolioReturn');
      expect(result).toHaveProperty('benchmark');
      expect(result).toHaveProperty('alpha');
      expect(result).toHaveProperty('attribution');
    });

    test('getPerformanceAttribution should identify contributors and detractors', async () => {
      const result = await soroban.getPerformanceAttribution({
        password: TEST_PASSWORD,
        period: '30d'
      });

      expect(result).toHaveProperty('attribution');
      expect(result.attribution).toHaveProperty('topContributors');
      expect(result.attribution).toHaveProperty('topDetractors');
      expect(Array.isArray(result.attribution.topContributors)).toBe(true);
      expect(Array.isArray(result.attribution.topDetractors)).toBe(true);
    });

    test('getPerformanceAttribution should record history', async () => {
      await soroban.getPerformanceAttribution({
        password: TEST_PASSWORD,
        period: '30d'
      });

      // Should save to history
      const fs = require('fs');
      const path = require('path');
      const walletDir = path.join(process.env.HOME || '/root', '.config', 'soroban');
      const attrFile = path.join(walletDir, 'performance_attribution.json');
      
      if (fs.existsSync(attrFile)) {
        const data = JSON.parse(fs.readFileSync(attrFile, 'utf8'));
        expect(data).toHaveProperty('history');
        expect(data.history.length).toBeGreaterThan(0);
      }
    });

    test('getPerformanceAttribution should require wallet', async () => {
      const result = await soroban.getPerformanceAttribution({
        password: 'wrong-password'
      });

      expect(result.error).toBeDefined();
      expect(result.error).toContain('No wallet configured');
    });

    // optimizeSharpeRatio Tests
    test('optimizeSharpeRatio should calculate current Sharpe ratio', async () => {
      const result = await soroban.optimizeSharpeRatio({
        password: TEST_PASSWORD,
        targetSharpe: 2.0
      });

      expect(result).toHaveProperty('currentSharpe');
      expect(result).toHaveProperty('targetSharpe');
      expect(result.targetSharpe).toBe(2.0);
      expect(result).toHaveProperty('gap');
      expect(result).toHaveProperty('status');
      expect(['OPTIMAL', 'NEAR_OPTIMAL', 'NEEDS_IMPROVEMENT']).toContain(result.status);
    });

    test('optimizeSharpeRatio should provide recommendations', async () => {
      const result = await soroban.optimizeSharpeRatio({
        password: TEST_PASSWORD,
        targetSharpe: 2.0,
        maxPositions: 6
      });

      expect(result).toHaveProperty('recommendations');
      expect(Array.isArray(result.recommendations)).toBe(true);
      expect(result).toHaveProperty('assetAnalysis');
      expect(Array.isArray(result.assetAnalysis)).toBe(true);
    });

    test('optimizeSharpeRatio should suggest optimized allocation', async () => {
      const result = await soroban.optimizeSharpeRatio({
        password: TEST_PASSWORD,
        targetSharpe: 2.0
      });

      expect(result).toHaveProperty('optimizedAllocation');
      const total = Object.values(result.optimizedAllocation)
        .reduce((sum, val) => sum + val, 0);
      expect(total).toBe(100);
    });

    test('optimizeSharpeRatio should save optimization history', async () => {
      await soroban.optimizeSharpeRatio({
        password: TEST_PASSWORD,
        targetSharpe: 2.0
      });

      const fs = require('fs');
      const path = require('path');
      const walletDir = path.join(process.env.HOME || '/root', '.config', 'soroban');
      const sharpeFile = path.join(walletDir, 'sharpe_optimization.json');
      
      if (fs.existsSync(sharpeFile)) {
        const data = JSON.parse(fs.readFileSync(sharpeFile, 'utf8'));
        expect(data).toHaveProperty('lastOptimized');
        expect(data).toHaveProperty('optimizationHistory');
      }
    });

    test('optimizeSharpeRatio should require wallet', async () => {
      const result = await soroban.optimizeSharpeRatio({
        password: 'wrong-password'
      });

      expect(result.error).toBeDefined();
      expect(result.error).toContain('No wallet configured');
    });

    // getPortfolioSummary Tests
    test('getPortfolioSummary should return comprehensive overview', async () => {
      const result = await soroban.getPortfolioSummary({
        password: TEST_PASSWORD
      });

      expect(result).toHaveProperty('overview');
      expect(result.overview).toHaveProperty('totalValue');
      expect(result.overview).toHaveProperty('assetCount');
      expect(result.overview).toHaveProperty('currentSharpe');

      expect(result).toHaveProperty('allocation');
      expect(result.allocation).toHaveProperty('current');
      expect(result.allocation).toHaveProperty('needsRebalancing');

      expect(result).toHaveProperty('performance');
      expect(result).toHaveProperty('risk');
      expect(result).toHaveProperty('tax');
      expect(result).toHaveProperty('recommendations');
    });

    test('getPortfolioSummary should require wallet', async () => {
      const result = await soroban.getPortfolioSummary({
        password: 'wrong-password'
      });

      expect(result.error).toBeDefined();
      expect(result.error).toContain('No wallet configured');
    });

    // Integration Tests
    test('portfolio workflow: set strategy, check allocation, rebalance', async () => {
      // 1. Set rebalancing strategy
      const strategy = await soroban.setRebalancingStrategy({
        password: TEST_PASSWORD,
        targetAllocations: { 'XLM': 100 },
        driftThreshold: 10,
        autoRebalance: false
      });
      expect(strategy.success).toBe(true);

      // 2. Get portfolio allocation
      const allocation = await soroban.getPortfolioAllocation({
        password: TEST_PASSWORD
      });
      expect(allocation).toHaveProperty('currentAllocations');

      // 3. Run dry run rebalance
      const dryRun = await soroban.autoRebalancePortfolio({
        password: TEST_PASSWORD,
        dryRun: true,
        force: true
      });
      expect(dryRun.dryRun).toBe(true);
    });

    test('correlation analysis informs rebalancing decisions', async () => {
      // Analyze correlations
      const correlations = await soroban.analyzeCorrelations({
        assets: ['XLM', 'USDC', 'yXLM'],
        lookbackDays: 30
      });

      // Use correlation info to set strategy
      const strategy = await soroban.setRebalancingStrategy({
        password: TEST_PASSWORD,
        targetAllocations: {
          'XLM': 50,
          'USDC': 30,
          'yXLM': 20
        },
        driftThreshold: 5
      });

      expect(correlations).toHaveProperty('diversificationScore');
      expect(strategy.success).toBe(true);
    });

    test('Sharpe optimization leads to rebalancing', async () => {
      // Optimize for Sharpe ratio
      const optimization = await soroban.optimizeSharpeRatio({
        password: TEST_PASSWORD,
        targetSharpe: 2.0
      });

      // Apply optimized allocation
      const strategy = await soroban.setRebalancingStrategy({
        password: TEST_PASSWORD,
        targetAllocations: optimization.optimizedAllocation,
        driftThreshold: 5
      });

      expect(optimization).toHaveProperty('optimizedAllocation');
      expect(strategy.success).toBe(true);
    });
  });

  // ============================================
  // V3.4: AI Trading Signals Tests
  // ============================================
  describe('AI Trading Signals - trainPriceModel', () => {
    test('trainPriceModel should train linear regression model', async () => {
      const result = await soroban.trainPriceModel({
        asset: 'native',
        timeframe: '1h',
        modelType: 'linear_regression'
      });

      expect(result.success).toBe(true);
      expect(result.modelId).toBeDefined();
      expect(result.asset).toBe('native');
      expect(result.modelType).toBe('linear_regression');
      expect(result.timeframe).toBe('1h');
      expect(result.metrics).toBeDefined();
      expect(result.metrics.accuracy).toBeDefined();
    }, 30000);

    test('trainPriceModel should train moving average model', async () => {
      const result = await soroban.trainPriceModel({
        asset: 'USDC:GA24LJXFG73JGARIBG2GP6V5TNUUOS6BD23KOFCW3INLDY5KPKS7GACZ',
        timeframe: '4h',
        modelType: 'moving_average'
      });

      expect(result.success).toBe(true);
      expect(result.modelId).toBeDefined();
      expect(result.modelType).toBe('moving_average');
      expect(result.metrics.correctPredictions).toBeDefined();
      expect(result.metrics.totalPredictions).toBeDefined();
    }, 30000);

    test('trainPriceModel should train RSI-based model', async () => {
      const result = await soroban.trainPriceModel({
        asset: 'native',
        timeframe: '1d',
        modelType: 'rsi_based'
      });

      expect(result.success).toBe(true);
      expect(result.modelId).toBeDefined();
      expect(result.modelType).toBe('rsi_based');
      expect(result.params.rsiPeriod).toBe(14);
      expect(result.params.oversold).toBe(30);
      expect(result.params.overbought).toBe(70);
    }, 30000);

    test('trainPriceModel should train ensemble model', async () => {
      const result = await soroban.trainPriceModel({
        asset: 'native',
        timeframe: '1h',
        modelType: 'ensemble'
      });

      expect(result.success).toBe(true);
      expect(result.modelId).toBeDefined();
      expect(result.modelType).toBe('ensemble');
      expect(result.params.models).toContain('linear_regression');
      expect(result.params.models).toContain('moving_average');
      expect(result.params.models).toContain('rsi_based');
      expect(result.metrics.componentModels).toBeDefined();
    }, 30000);

    test('trainPriceModel should validate asset parameter', async () => {
      const result = await soroban.trainPriceModel({
        asset: '',
        timeframe: '1h',
        modelType: 'linear_regression'
      });

      expect(result.error).toBeDefined();
      expect(result.error).toContain('Asset is required');
    });

    test('trainPriceModel should validate timeframe', async () => {
      const result = await soroban.trainPriceModel({
        asset: 'native',
        timeframe: 'invalid',
        modelType: 'linear_regression'
      });

      expect(result.error).toBeDefined();
      expect(result.error).toContain('Invalid timeframe');
    });

    test('trainPriceModel should validate model type', async () => {
      const result = await soroban.trainPriceModel({
        asset: 'native',
        timeframe: '1h',
        modelType: 'neural_network'
      });

      expect(result.error).toBeDefined();
      expect(result.error).toContain('Invalid model type');
    });

    test('trainPriceModel should store and retrieve models', async () => {
      const result = await soroban.trainPriceModel({
        asset: 'native',
        timeframe: '1h',
        modelType: 'linear_regression'
      });

      expect(result.success).toBe(true);
      expect(result.modelId).toBeDefined();

      // Retrieve model performance
      const performance = await soroban.getModelPerformance({
        modelId: result.modelId
      });

      expect(performance.modelId).toBe(result.modelId);
      expect(performance.asset).toBe('native');
      expect(performance.modelType).toBe('linear_regression');
    }, 30000);
  });

  describe('AI Trading Signals - getAISignals', () => {
    test('getAISignals should return buy/sell/hold signals', async () => {
      const result = await soroban.getAISignals({
        asset: 'native',
        signalType: 'all',
        confidence: 50
      });

      expect(result.asset).toBe('native');
      expect(result.currentPrice).toBeDefined();
      expect(result.aggregateSignal).toMatch(/^(buy|sell|hold)$/);
      expect(result.aggregateConfidence).toBeGreaterThanOrEqual(0);
      expect(result.aggregateConfidence).toBeLessThanOrEqual(100);
      expect(result.aggregateStrength).toMatch(/^(weak|moderate|strong)$/);
      expect(Array.isArray(result.signals)).toBe(true);
      expect(result.technicalIndicators).toBeDefined();
    }, 30000);

    test('getAISignals should filter by signal type', async () => {
      const result = await soroban.getAISignals({
        asset: 'native',
        signalType: 'buy',
        confidence: 50
      });

      expect(result.asset).toBe('native');
      expect(result.signals).toBeDefined();
    }, 30000);

    test('getAISignals should filter by confidence threshold', async () => {
      const result = await soroban.getAISignals({
        asset: 'native',
        signalType: 'all',
        confidence: 80
      });

      expect(result.asset).toBe('native');
      // All signals should meet confidence threshold
      result.signals.forEach(signal => {
        expect(signal.confidence).toBeGreaterThanOrEqual(80);
      });
    }, 30000);

    test('getAISignals should validate asset', async () => {
      const result = await soroban.getAISignals({
        asset: '',
        signalType: 'all'
      });

      expect(result.error).toBeDefined();
      expect(result.error).toContain('Asset is required');
    });

    test('getAISignals should validate signal type', async () => {
      const result = await soroban.getAISignals({
        asset: 'native',
        signalType: 'invalid'
      });

      expect(result.error).toBeDefined();
      expect(result.error).toContain('Invalid signal type');
    });

    test('getAISignals should include technical indicators', async () => {
      const result = await soroban.getAISignals({
        asset: 'native',
        signalType: 'all'
      });

      expect(result.technicalIndicators).toBeDefined();
      expect(result.technicalIndicators).toHaveProperty('rsi');
      expect(result.technicalIndicators).toHaveProperty('ma20');
      expect(result.technicalIndicators).toHaveProperty('ma50');
      expect(result.technicalIndicators).toHaveProperty('macd');
      expect(result.technicalIndicators).toHaveProperty('bollingerBands');
      expect(result.technicalIndicators).toHaveProperty('trend');
      expect(result.technicalIndicators).toHaveProperty('volumeSpike');
    }, 30000);

    test('getAISignals should include support/resistance levels', async () => {
      const result = await soroban.getAISignals({
        asset: 'native',
        signalType: 'all'
      });

      expect(result.supportResistance).toBeDefined();
      expect(result.supportResistance).toHaveProperty('support');
      expect(result.supportResistance).toHaveProperty('resistance');
      expect(Array.isArray(result.supportResistance.support)).toBe(true);
      expect(Array.isArray(result.supportResistance.resistance)).toBe(true);
    }, 30000);

    test('getAISignals should include recommendation', async () => {
      const result = await soroban.getAISignals({
        asset: 'native',
        signalType: 'all'
      });

      expect(result.recommendation).toBeDefined();
      expect(typeof result.recommendation).toBe('string');
      expect(result.recommendation.length).toBeGreaterThan(0);
    }, 30000);

    test('getAISignals should save signals to history', async () => {
      await soroban.getAISignals({
        asset: 'native',
        signalType: 'all'
      });

      const history = await soroban.getSignalHistory({
        asset: 'native',
        limit: 10
      });

      expect(history.totalSignals).toBeGreaterThan(0);
      expect(history.returnedSignals).toBeGreaterThan(0);
      expect(Array.isArray(history.signals)).toBe(true);
    }, 30000);
  });

  describe('AI Trading Signals - backtestStrategy', () => {
    test('backtestStrategy should backtest RSI strategy', async () => {
      const result = await soroban.backtestStrategy({
        strategy: 'rsi',
        asset: 'native',
        startDate: '2024-01-01',
        endDate: '2024-06-01',
        initialCapital: 1000
      });

      expect(result.success).toBe(true);
      expect(result.backtestId).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(result.summary.strategy).toBe('rsi');
      expect(result.summary.initialCapital).toBe('1000 XLM');
      expect(result.performance).toBeDefined();
      expect(result.performance.totalReturn).toBeDefined();
      expect(result.performance.buyHoldReturn).toBeDefined();
      expect(result.performance.sharpeRatio).toBeDefined();
      expect(result.tradingStats).toBeDefined();
      expect(result.tradingStats.totalTrades).toBeGreaterThanOrEqual(0);
    }, 30000);

    test('backtestStrategy should backtest MA crossover strategy', async () => {
      const result = await soroban.backtestStrategy({
        strategy: 'ma_crossover',
        asset: 'native',
        startDate: '2024-01-01',
        endDate: '2024-06-01',
        initialCapital: 1000
      });

      expect(result.success).toBe(true);
      expect(result.backtestId).toBeDefined();
      expect(result.summary.strategy).toBe('ma_crossover');
      expect(result.performance).toBeDefined();
      expect(result.analysis).toBeDefined();
    }, 30000);

    test('backtestStrategy should backtest MACD strategy', async () => {
      const result = await soroban.backtestStrategy({
        strategy: 'macd',
        asset: 'native',
        startDate: '2024-01-01',
        endDate: '2024-06-01',
        initialCapital: 1000
      });

      expect(result.success).toBe(true);
      expect(result.summary.strategy).toBe('macd');
      expect(Array.isArray(result.trades)).toBe(true);
    }, 30000);

    test('backtestStrategy should backtest Bollinger Bands strategy', async () => {
      const result = await soroban.backtestStrategy({
        strategy: 'bollinger',
        asset: 'native',
        startDate: '2024-01-01',
        endDate: '2024-06-01',
        initialCapital: 1000
      });

      expect(result.success).toBe(true);
      expect(result.summary.strategy).toBe('bollinger');
    }, 30000);

    test('backtestStrategy should backtest AI ensemble strategy', async () => {
      const result = await soroban.backtestStrategy({
        strategy: 'ai_ensemble',
        asset: 'native',
        startDate: '2024-01-01',
        endDate: '2024-06-01',
        initialCapital: 1000
      });

      expect(result.success).toBe(true);
      expect(result.summary.strategy).toBe('ai_ensemble');
    }, 30000);

    test('backtestStrategy should validate strategy type', async () => {
      const result = await soroban.backtestStrategy({
        strategy: 'invalid_strategy',
        asset: 'native',
        startDate: '2024-01-01',
        endDate: '2024-06-01'
      });

      expect(result.error).toBeDefined();
      expect(result.error).toContain('Invalid strategy');
    });

    test('backtestStrategy should handle insufficient data', async () => {
      const result = await soroban.backtestStrategy({
        strategy: 'rsi',
        asset: 'native',
        startDate: '2025-01-01',
        endDate: '2025-01-02',
        initialCapital: 1000
      });

      // Should either succeed or return error about insufficient data
      expect(result.success || result.error).toBeDefined();
    }, 30000);

    test('backtestStrategy should calculate performance metrics', async () => {
      const result = await soroban.backtestStrategy({
        strategy: 'rsi',
        asset: 'native',
        startDate: '2024-01-01',
        endDate: '2024-06-01',
        initialCapital: 1000
      });

      expect(result.success).toBe(true);
      expect(result.performance).toBeDefined();
      expect(result.performance.totalReturn).toBeDefined();
      expect(result.performance.buyHoldReturn).toBeDefined();
      expect(result.performance.outperformance).toBeDefined();
      expect(result.performance.sharpeRatio).toBeDefined();
      expect(result.performance.maxDrawdown).toBeDefined();
      expect(result.tradingStats).toBeDefined();
      expect(result.tradingStats.winRate).toBeDefined();
      expect(result.tradingStats.profitFactor).toBeDefined();
      expect(result.analysis).toBeDefined();
      expect(result.analysis.verdict).toMatch(/^(STRONG|ACCEPTABLE|WEAK|POOR)$/);
    }, 30000);
  });

  describe('AI Trading Signals - detectPatterns', () => {
    test('detectPatterns should detect support/resistance levels', async () => {
      const result = await soroban.detectPatterns({
        asset: 'native',
        patternType: 'support_resistance',
        lookback: 50
      });

      expect(result.asset).toBe('native');
      expect(result.currentPrice).toBeDefined();
      expect(result.patterns).toBeDefined();
      expect(Array.isArray(result.patterns)).toBe(true);
      expect(result.keyLevels).toBeDefined();
      expect(result.keyLevels.support).toBeDefined();
      expect(result.keyLevels.resistance).toBeDefined();
      expect(Array.isArray(result.keyLevels.support)).toBe(true);
      expect(Array.isArray(result.keyLevels.resistance)).toBe(true);
    }, 30000);

    test('detectPatterns should detect trends', async () => {
      const result = await soroban.detectPatterns({
        asset: 'native',
        patternType: 'trend',
        lookback: 50
      });

      expect(result.asset).toBe('native');
      const trendPattern = result.patterns.find(p => p.pattern === 'Trend Analysis');
      expect(trendPattern).toBeDefined();
      expect(trendPattern.currentTrend).toMatch(/^(strongly_bullish|bullish|neutral|bearish|strongly_bearish)$/);
      expect(trendPattern.trendStrength).toMatch(/^(strong|moderate|weak)$/);
    }, 30000);

    test('detectPatterns should detect volume patterns', async () => {
      const result = await soroban.detectPatterns({
        asset: 'native',
        patternType: 'volume',
        lookback: 50
      });

      expect(result.asset).toBe('native');
      const volumePattern = result.patterns.find(p => p.pattern === 'Volume Analysis');
      expect(volumePattern).toBeDefined();
      expect(typeof volumePattern.volumeSpike).toBe('boolean');
      expect(volumePattern.volumeRatio).toBeDefined();
      expect(volumePattern.currentVolume).toBeDefined();
      expect(volumePattern.averageVolume).toBeDefined();
    }, 30000);

    test('detectPatterns should detect all patterns', async () => {
      const result = await soroban.detectPatterns({
        asset: 'native',
        patternType: 'all',
        lookback: 50
      });

      expect(result.asset).toBe('native');
      expect(result.patterns.length).toBeGreaterThan(0);
      expect(result.patternCount).toBeGreaterThan(0);
      expect(typeof result.bullishSignals).toBe('number');
      expect(typeof result.bearishSignals).toBe('number');
      expect(Array.isArray(result.tradingImplications)).toBe(true);
      expect(result.recommendation).toBeDefined();
    }, 30000);

    test('detectPatterns should validate asset', async () => {
      const result = await soroban.detectPatterns({
        asset: '',
        patternType: 'all'
      });

      expect(result.error).toBeDefined();
      expect(result.error).toContain('Asset is required');
    });

    test('detectPatterns should handle chart patterns', async () => {
      const result = await soroban.detectPatterns({
        asset: 'native',
        patternType: 'chart',
        lookback: 50
      });

      expect(result.asset).toBe('native');
      expect(result.patterns).toBeDefined();
    }, 30000);
  });

  describe('AI Trading Signals - getSignalHistory', () => {
    test('getSignalHistory should return signal history', async () => {
      // First generate some signals
      await soroban.getAISignals({ asset: 'native', signalType: 'all' });
      await soroban.getAISignals({ asset: 'native', signalType: 'all' });

      const result = await soroban.getSignalHistory({
        asset: 'native',
        limit: 10
      });

      expect(result.totalSignals).toBeGreaterThan(0);
      expect(result.returnedSignals).toBeGreaterThan(0);
      expect(result.asset).toBe('native');
      expect(Array.isArray(result.signals)).toBe(true);
      expect(result.accuracy).toBeDefined();
      expect(result.accuracy.buySignals).toBeGreaterThanOrEqual(0);
      expect(result.accuracy.sellSignals).toBeGreaterThanOrEqual(0);
    }, 30000);

    test('getSignalHistory should return all signals when no asset specified', async () => {
      const result = await soroban.getSignalHistory({
        limit: 20
      });

      expect(result.asset).toBe('all');
      expect(result.totalSignals).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(result.signals)).toBe(true);
    }, 30000);

    test('getSignalHistory should respect limit parameter', async () => {
      const result = await soroban.getSignalHistory({
        limit: 5
      });

      expect(result.returnedSignals).toBeLessThanOrEqual(5);
    }, 30000);
  });

  describe('AI Trading Signals - getModelPerformance', () => {
    test('getModelPerformance should return all models summary', async () => {
      // Train a model first
      await soroban.trainPriceModel({
        asset: 'native',
        timeframe: '1h',
        modelType: 'linear_regression'
      });

      const result = await soroban.getModelPerformance({});

      expect(result.totalModels).toBeGreaterThan(0);
      expect(Array.isArray(result.models)).toBe(true);
      expect(result.bestPerforming).toBeDefined();
    }, 30000);

    test('getModelPerformance should return specific model by ID', async () => {
      const trained = await soroban.trainPriceModel({
        asset: 'native',
        timeframe: '1h',
        modelType: 'linear_regression'
      });

      const result = await soroban.getModelPerformance({
        modelId: trained.modelId
      });

      expect(result.modelId).toBe(trained.modelId);
      expect(result.asset).toBe('native');
      expect(result.modelType).toBe('linear_regression');
      expect(result.timeframe).toBe('1h');
      expect(result.metrics).toBeDefined();
      expect(result.params).toBeDefined();
    }, 30000);

    test('getModelPerformance should handle non-existent model', async () => {
      const result = await soroban.getModelPerformance({
        modelId: 'non-existent-id'
      });

      expect(result.error).toBeDefined();
      expect(result.error).toContain('Model not found');
    });

    test('getModelPerformance should sort models by accuracy', async () => {
      // Train multiple models
      await soroban.trainPriceModel({ asset: 'native', timeframe: '1h', modelType: 'linear_regression' });
      await soroban.trainPriceModel({ asset: 'native', timeframe: '1h', modelType: 'moving_average' });

      const result = await soroban.getModelPerformance({});

      expect(result.totalModels).toBeGreaterThanOrEqual(2);
      // Models should be sorted by accuracy descending
      for (let i = 0; i < result.models.length - 1; i++) {
        expect(result.models[i].accuracy).toBeGreaterThanOrEqual(result.models[i + 1].accuracy);
      }
    }, 30000);
  });

  describe('AI Trading Signals - Technical Indicators', () => {
    test('_calculateRSI should calculate RSI correctly', async () => {
      // Use internal method through a trained model
      const result = await soroban.trainPriceModel({
        asset: 'native',
        timeframe: '1h',
        modelType: 'rsi_based'
      });

      expect(result.success).toBe(true);
      expect(result.params.currentRSI).toBeDefined();
      expect(result.params.currentRSI).toBeGreaterThanOrEqual(0);
      expect(result.params.currentRSI).toBeLessThanOrEqual(100);
    }, 30000);

    test('_calculateMA should calculate moving averages', async () => {
      const result = await soroban.trainPriceModel({
        asset: 'native',
        timeframe: '1h',
        modelType: 'moving_average'
      });

      expect(result.success).toBe(true);
      expect(result.params.maShort).toBeDefined();
      expect(result.params.maLong).toBeDefined();
      expect(result.params.maShort).toBeGreaterThan(0);
      expect(result.params.maLong).toBeGreaterThan(0);
    }, 30000);

    test('_calculateMACD should calculate MACD', async () => {
      const signals = await soroban.getAISignals({
        asset: 'native',
        signalType: 'all'
      });

      expect(signals.technicalIndicators.macd).toBeDefined();
      if (signals.technicalIndicators.macd) {
        expect(signals.technicalIndicators.macd.macd).toBeDefined();
        expect(signals.technicalIndicators.macd.signal).toBeDefined();
        expect(signals.technicalIndicators.macd.histogram).toBeDefined();
      }
    }, 30000);

    test('_calculateBollingerBands should calculate Bollinger Bands', async () => {
      const signals = await soroban.getAISignals({
        asset: 'native',
        signalType: 'all'
      });

      expect(signals.technicalIndicators.bollingerBands).toBeDefined();
      if (signals.technicalIndicators.bollingerBands) {
        expect(signals.technicalIndicators.bollingerBands.upper).toBeDefined();
        expect(signals.technicalIndicators.bollingerBands.middle).toBeDefined();
        expect(signals.technicalIndicators.bollingerBands.lower).toBeDefined();
        expect(signals.technicalIndicators.bollingerBands.upper).toBeGreaterThan(signals.technicalIndicators.bollingerBands.middle);
        expect(signals.technicalIndicators.bollingerBands.middle).toBeGreaterThan(signals.technicalIndicators.bollingerBands.lower);
      }
    }, 30000);
  });

  describe('AI Trading Signals - Integration', () => {
    test('complete workflow: train model, get signals, backtest, detect patterns', async () => {
      // 1. Train a model
      const model = await soroban.trainPriceModel({
        asset: 'native',
        timeframe: '1h',
        modelType: 'ensemble'
      });
      expect(model.success).toBe(true);

      // 2. Get trading signals
      const signals = await soroban.getAISignals({
        asset: 'native',
        signalType: 'all',
        confidence: 60
      });
      expect(signals.aggregateSignal).toMatch(/^(buy|sell|hold)$/);

      // 3. Backtest a strategy
      const backtest = await soroban.backtestStrategy({
        strategy: 'ai_ensemble',
        asset: 'native',
        startDate: '2024-01-01',
        endDate: '2024-06-01',
        initialCapital: 1000
      });
      expect(backtest.success).toBe(true);

      // 4. Detect patterns
      const patterns = await soroban.detectPatterns({
        asset: 'native',
        patternType: 'all',
        lookback: 50
      });
      expect(patterns.patterns.length).toBeGreaterThan(0);

      // 5. Check model performance
      const performance = await soroban.getModelPerformance({
        modelId: model.modelId
      });
      expect(performance.modelId).toBe(model.modelId);
    }, 60000);

    test('signal confidence should correlate with signal strength', async () => {
      const signals = await soroban.getAISignals({
        asset: 'native',
        signalType: 'all',
        confidence: 0
      });

      // Strong signals should have higher confidence
      const strongSignals = signals.signals.filter(s => s.strength >= 0.8);
      strongSignals.forEach(s => {
        expect(s.confidence).toBeGreaterThanOrEqual(60);
      });
    }, 30000);

    test('trained models should persist and be retrievable', async () => {
      // Train model
      const trained = await soroban.trainPriceModel({
        asset: 'native',
        timeframe: '1h',
        modelType: 'linear_regression'
      });

      // Get all models
      const allModels = await soroban.getModelPerformance({});
      expect(allModels.models.some(m => m.id === trained.modelId)).toBe(true);

      // Get specific model
      const specific = await soroban.getModelPerformance({
        modelId: trained.modelId
      });
      expect(specific.modelId).toBe(trained.modelId);
      expect(specific.metrics.accuracy).toBe(trained.metrics.accuracy);
    }, 30000);
  });

  // ============================================
  // V3.4: ADVANCED RISK MANAGEMENT TESTS
  // ============================================
  describe('Advanced Risk Management (v3.4)', () => {
    beforeEach(async () => {
      cleanupTestData();
      await setKey({ privateKey: TEST_PRIVATE_KEY, password: TEST_PASSWORD });
    });

    // setPortfolioInsurance Tests
    test('setPortfolioInsurance should create insurance policy', async () => {
      const result = await soroban.setPortfolioInsurance({
        password: TEST_PASSWORD,
        coveragePercent: 80,
        premiumAsset: 'XLM',
        triggerPrice: '0.80',
        hedgeAsset: 'USDC',
        autoHedge: true,
        expirationDays: 30
      });

      expect(result.success).toBe(true);
      expect(result.policyId).toBeDefined();
      expect(result.summary).toHaveProperty('coveragePercent', '80%');
      expect(result.summary).toHaveProperty('premiumDue');
      expect(result.hedging).toHaveProperty('autoHedge', true);
    });

    test('setPortfolioInsurance should validate coverage percent', async () => {
      const result = await soroban.setPortfolioInsurance({
        password: TEST_PASSWORD,
        coveragePercent: 150, // Invalid
        triggerPrice: '0.80'
      });

      expect(result.error).toBeDefined();
      expect(result.error).toContain('Coverage percent');
    });

    test('setPortfolioInsurance should require trigger price', async () => {
      const result = await soroban.setPortfolioInsurance({
        password: TEST_PASSWORD,
        coveragePercent: 80
      });

      expect(result.error).toBeDefined();
      expect(result.error).toContain('Trigger price');
    });

    test('setPortfolioInsurance should calculate premium', async () => {
      const result = await soroban.setPortfolioInsurance({
        password: TEST_PASSWORD,
        coveragePercent: 80,
        triggerPrice: '0.80'
      });

      expect(result.summary).toHaveProperty('premiumPercent');
      expect(result.summary).toHaveProperty('premiumDue');
      expect(parseFloat(result.summary.premiumPercent)).toBeGreaterThan(0);
    });

    test('setPortfolioInsurance should require wallet', async () => {
      const result = await soroban.setPortfolioInsurance({
        password: 'wrong-password',
        coveragePercent: 80,
        triggerPrice: '0.80'
      });

      expect(result.error).toBeDefined();
      expect(result.error).toContain('No wallet configured');
    });

    // calculateVaR Tests
    test('calculateVaR should compute historical VaR', async () => {
      const result = await soroban.calculateVaR({
        password: TEST_PASSWORD,
        confidenceLevel: 0.95,
        timeHorizon: 1,
        method: 'historical'
      });

      expect(result).toHaveProperty('confidenceLevel');
      expect(result).toHaveProperty('historicalVaR');
      expect(result.historicalVaR).toHaveProperty('dailyVaRPercent');
      expect(result.historicalVaR).toHaveProperty('dailyVaRAmount');
    });

    test('calculateVaR should compute parametric VaR', async () => {
      const result = await soroban.calculateVaR({
        password: TEST_PASSWORD,
        confidenceLevel: 0.95,
        timeHorizon: 1,
        method: 'parametric'
      });

      expect(result).toHaveProperty('parametricVaR');
      expect(result.parametricVaR).toHaveProperty('volatility');
      expect(result.parametricVaR).toHaveProperty('periodVaRAmount');
    });

    test('calculateVaR should compute both methods', async () => {
      const result = await soroban.calculateVaR({
        password: TEST_PASSWORD,
        confidenceLevel: 0.99,
        timeHorizon: 5,
        method: 'both'
      });

      expect(result).toHaveProperty('historicalVaR');
      expect(result).toHaveProperty('parametricVaR');
      expect(result).toHaveProperty('assetVaR');
      expect(Array.isArray(result.assetVaR)).toBe(true);
    });

    test('calculateVaR should validate confidence level', async () => {
      const result = await soroban.calculateVaR({
        password: TEST_PASSWORD,
        confidenceLevel: 0.75, // Invalid
        timeHorizon: 1
      });

      expect(result.error).toBeDefined();
      expect(result.error).toContain('Invalid confidence level');
    });

    test('calculateVaR should return risk metrics', async () => {
      const result = await soroban.calculateVaR({
        password: TEST_PASSWORD,
        confidenceLevel: 0.95
      });

      expect(result).toHaveProperty('riskMetrics');
      expect(result.riskMetrics).toHaveProperty('maxDrawdown');
      expect(result.riskMetrics).toHaveProperty('volatility');
      expect(result.riskMetrics).toHaveProperty('riskLevel');
    });

    test('calculateVaR should classify risk level', async () => {
      const result = await soroban.calculateVaR({
        password: TEST_PASSWORD
      });

      expect(result.riskMetrics).toHaveProperty('riskLevel');
      expect(['LOW', 'MODERATE', 'HIGH', 'EXTREME']).toContain(result.riskMetrics.riskLevel);
    });

    test('calculateVaR should require wallet', async () => {
      const result = await soroban.calculateVaR({
        password: 'wrong-password'
      });

      expect(result.error).toBeDefined();
      expect(result.error).toContain('No wallet configured');
    });

    // stressTestPortfolio Tests
    test('stressTestPortfolio should run crash scenarios', async () => {
      const result = await soroban.stressTestPortfolio({
        password: TEST_PASSWORD,
        scenarios: ['marketCrash', 'severeCrash', 'blackSwan']
      });

      expect(result).toHaveProperty('scenarios');
      expect(result.scenarios).toHaveLength(3);
      expect(result).toHaveProperty('resilienceScore');
      expect(result.resilienceScore).toBeGreaterThanOrEqual(0);
      expect(result.resilienceScore).toBeLessThanOrEqual(100);
    });

    test('stressTestPortfolio should calculate portfolio impacts', async () => {
      const result = await soroban.stressTestPortfolio({
        password: TEST_PASSWORD,
        scenarios: ['marketCrash']
      });

      const scenario = result.scenarios[0];
      expect(scenario).toHaveProperty('impact');
      expect(scenario.impact).toHaveProperty('lossPercent');
      expect(scenario.impact).toHaveProperty('newPortfolioValue');
      expect(scenario.impact).toHaveProperty('recoveryNeeded');
    });

    test('stressTestPortfolio should identify worst case', async () => {
      const result = await soroban.stressTestPortfolio({
        password: TEST_PASSWORD,
        scenarios: ['marketCrash', 'severeCrash', 'blackSwan']
      });

      expect(result).toHaveProperty('worstCase');
      expect(result).toHaveProperty('bestCase');
      expect(result.worstCase.name).toContain('Black Swan');
    });

    test('stressTestPortfolio should assess risk levels', async () => {
      const result = await soroban.stressTestPortfolio({
        password: TEST_PASSWORD,
        scenarios: ['marketCrash']
      });

      expect(result.scenarios[0]).toHaveProperty('riskAssessment');
      expect(result.scenarios[0].riskAssessment).toHaveProperty('level');
      expect(['LOW', 'MODERATE', 'HIGH', 'CRITICAL']).toContain(result.scenarios[0].riskAssessment.level);
    });

    test('stressTestPortfolio should provide recommendations', async () => {
      const result = await soroban.stressTestPortfolio({
        password: TEST_PASSWORD
      });

      expect(result).toHaveProperty('recommendations');
      expect(Array.isArray(result.recommendations)).toBe(true);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    test('stressTestPortfolio should require wallet', async () => {
      const result = await soroban.stressTestPortfolio({
        password: 'wrong-password'
      });

      expect(result.error).toBeDefined();
      expect(result.error).toContain('No wallet configured');
    });

    // setLiquidityRiskMonitor Tests
    test('setLiquidityRiskMonitor should create monitor', async () => {
      const result = await soroban.setLiquidityRiskMonitor({
        password: TEST_PASSWORD,
        maxSlippageBps: 100,
        minVolumeUsd: 10000
      });

      expect(result.success).toBe(true);
      expect(result.monitorId).toBeDefined();
      expect(result.config).toHaveProperty('maxSlippageBps', '100 bps (1.0%)');
    });

    test('setLiquidityRiskMonitor should validate slippage', async () => {
      const result = await soroban.setLiquidityRiskMonitor({
        password: TEST_PASSWORD,
        maxSlippageBps: 2000 // Too high
      });

      expect(result.error).toBeDefined();
      expect(result.error).toContain('Max slippage');
    });

    test('setLiquidityRiskMonitor should analyze liquidity', async () => {
      const result = await soroban.setLiquidityRiskMonitor({
        password: TEST_PASSWORD,
        monitoredAssets: ['XLM', 'USDC', 'yXLM']
      });

      expect(result).toHaveProperty('liquidityAnalysis');
      expect(Array.isArray(result.liquidityAnalysis)).toBe(true);
      expect(result.liquidityAnalysis.length).toBe(3);
      
      const assetAnalysis = result.liquidityAnalysis[0];
      expect(assetAnalysis).toHaveProperty('asset');
      expect(assetAnalysis).toHaveProperty('liquidityScore');
      expect(assetAnalysis).toHaveProperty('status');
    });

    test('setLiquidityRiskMonitor should detect low liquidity', async () => {
      const result = await soroban.setLiquidityRiskMonitor({
        password: TEST_PASSWORD,
        maxSlippageBps: 10, // Very strict
        minVolumeUsd: 1000000 // Very high
      });

      expect(result).toHaveProperty('overallStatus');
      expect(result).toHaveProperty('alerts');
      expect(Array.isArray(result.alerts)).toBe(true);
    });

    test('setLiquidityRiskMonitor should provide recommendations', async () => {
      const result = await soroban.setLiquidityRiskMonitor({
        password: TEST_PASSWORD
      });

      expect(result).toHaveProperty('recommendations');
      expect(Array.isArray(result.recommendations)).toBe(true);
    });

    test('setLiquidityRiskMonitor should require wallet', async () => {
      const result = await soroban.setLiquidityRiskMonitor({
        password: 'wrong-password'
      });

      expect(result.error).toBeDefined();
      expect(result.error).toContain('No wallet configured');
    });

    // getRiskReport Tests
    test('getRiskReport should return comprehensive risk dashboard', async () => {
      const result = await soroban.getRiskReport({
        password: TEST_PASSWORD
      });

      expect(result).toHaveProperty('generatedAt');
      expect(result).toHaveProperty('portfolio');
      expect(result).toHaveProperty('riskSummary');
      expect(result.riskSummary).toHaveProperty('overallScore');
      expect(result.riskSummary).toHaveProperty('riskLevel');
    });

    test('getRiskReport should include VaR metrics', async () => {
      const result = await soroban.getRiskReport({
        password: TEST_PASSWORD
      });

      expect(result).toHaveProperty('varMetrics');
      // May be NOT_CALCULATED if VaR hasn't been run yet
    });

    test('getRiskReport should include drawdown metrics', async () => {
      const result = await soroban.getRiskReport({
        password: TEST_PASSWORD
      });

      expect(result).toHaveProperty('drawdownMetrics');
      expect(result.drawdownMetrics).toHaveProperty('maxDrawdown');
    });

    test('getRiskReport should include liquidity metrics', async () => {
      const result = await soroban.getRiskReport({
        password: TEST_PASSWORD
      });

      expect(result).toHaveProperty('liquidityMetrics');
      expect(result.liquidityMetrics).toHaveProperty('monitorsActive');
    });

    test('getRiskReport should show insurance status', async () => {
      const result = await soroban.getRiskReport({
        password: TEST_PASSWORD
      });

      expect(result).toHaveProperty('insuranceStatus');
      expect(result.insuranceStatus).toHaveProperty('active');
    });

    test('getRiskReport should provide risk alerts', async () => {
      const result = await soroban.getRiskReport({
        password: TEST_PASSWORD
      });

      expect(result).toHaveProperty('riskAlerts');
      expect(Array.isArray(result.riskAlerts)).toBe(true);
    });

    test('getRiskReport should provide recommendations', async () => {
      const result = await soroban.getRiskReport({
        password: TEST_PASSWORD
      });

      expect(result).toHaveProperty('recommendations');
      expect(Array.isArray(result.recommendations)).toBe(true);
      expect(result).toHaveProperty('nextActions');
      expect(Array.isArray(result.nextActions)).toBe(true);
    });

    test('getRiskReport should require wallet', async () => {
      const result = await soroban.getRiskReport({
        password: 'wrong-password'
      });

      expect(result.error).toBeDefined();
      expect(result.error).toContain('No wallet configured');
    });

    // Integration Tests
    test('risk workflow: VaR → Stress Test → Insurance → Report', async () => {
      // 1. Calculate VaR
      const varResult = await soroban.calculateVaR({
        password: TEST_PASSWORD,
        confidenceLevel: 0.95
      });
      expect(varResult).toHaveProperty('riskMetrics');

      // 2. Run stress tests
      const stressResult = await soroban.stressTestPortfolio({
        password: TEST_PASSWORD
      });
      expect(stressResult).toHaveProperty('resilienceScore');

      // 3. Set up insurance based on risk
      if (varResult.riskMetrics.riskLevel === 'HIGH') {
        const insurance = await soroban.setPortfolioInsurance({
          password: TEST_PASSWORD,
          coveragePercent: 80,
          triggerPrice: '0.80'
        });
        expect(insurance.success).toBe(true);
      }

      // 4. Get comprehensive risk report
      const report = await soroban.getRiskReport({
        password: TEST_PASSWORD
      });
      expect(report).toHaveProperty('riskSummary');
    });

    test('liquidity monitoring feeds into risk report', async () => {
      // Set up liquidity monitoring
      await soroban.setLiquidityRiskMonitor({
        password: TEST_PASSWORD,
        maxSlippageBps: 100,
        minVolumeUsd: 10000
      });

      // Risk report should reflect liquidity status
      const report = await soroban.getRiskReport({
        password: TEST_PASSWORD
      });

      expect(report.liquidityMetrics).toHaveProperty('monitorsActive');
      expect(report.liquidityMetrics.monitorsActive).toBeGreaterThan(0);
    });
  });
});

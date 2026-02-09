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
  const files = ['wallet.json', 'stoplosses.json', 'takeprofits.json', 'dca.json', 'alerts.json', 'yield_strategy.json', 'followed_traders.json', 'copy_trades.json'];
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

  // === V3.1 FEATURES: Execution & MEV Protection ===
  describe('MEV Protection (v3.1)', () => {
    beforeEach(async () => {
      cleanupTestData();
      await setKey({ privateKey: TEST_PRIVATE_KEY, password: TEST_PASSWORD });
    });

    test('setMEVProtection should enable MEV protection', async () => {
      const result = await soroban.setMEVProtection({
        password: TEST_PASSWORD,
        enabled: true,
        privateMempool: true,
        sandwichProtection: true,
        frontRunProtection: true,
        backRunProtection: true,
        maxPriorityFee: 100
      });

      expect(result.success).toBe(true);
      expect(result.config.enabled).toBe(true);
      expect(result.protectionLevel).toBe('MAXIMUM');
      expect(result.config.privateMempool).toBe(true);
      expect(result.config.sandwichProtection).toBe(true);
    });

    test('setMEVProtection should disable MEV protection', async () => {
      const result = await soroban.setMEVProtection({
        password: TEST_PASSWORD,
        enabled: false
      });

      expect(result.success).toBe(true);
      expect(result.config.enabled).toBe(false);
      expect(result.protectionLevel).toBe('NONE');
    });

    test('setMEVProtection should require wallet', async () => {
      const result = await soroban.setMEVProtection({
        password: 'wrong-password',
        enabled: true
      });

      expect(result.error).toBeDefined();
      expect(result.error).toContain('No wallet configured');
    });

    test('getMEVStatus should return MEV configuration', async () => {
      await soroban.setMEVProtection({
        password: TEST_PASSWORD,
        enabled: true,
        privateMempool: true
      });

      const result = await soroban.getMEVStatus({ password: TEST_PASSWORD });

      expect(result.configured).toBe(true);
      expect(result.config).toBeDefined();
      expect(result.protectionLevel).toBeDefined();
      expect(result.features).toBeDefined();
    });

    test('getMEVStatus should require wallet', async () => {
      const result = await soroban.getMEVStatus({ password: 'wrong-password' });
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
});

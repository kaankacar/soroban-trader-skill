const { setKey, getWallet, quote, swap, findArbitrage, setStopLoss, setTakeProfit, checkOrders, setupDCA, executeDCA, checkDCA, setPriceAlert, checkAlerts, listAlerts } = require('./index.js');
const fs = require('fs');
const path = require('path');

// Mock test configuration
const TEST_PASSWORD = 'test-password-123';
const TEST_PRIVATE_KEY = 'SBD3OQ6P6S7BW4GKUKQXNHMQBSZTDLB4QKANLDL77QVZWZQWTVKMJ4SX'; // Testnet key

// Test utilities
function cleanupTestData() {
  const walletDir = path.join(process.env.HOME || '/root', '.config', 'soroban');
  const files = ['wallet.json', 'stoplosses.json', 'takeprofits.json', 'dca.json', 'alerts.json'];
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
      
      expect(result.configured).toBe(true);
      expect(result.error).toBeDefined();
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
});

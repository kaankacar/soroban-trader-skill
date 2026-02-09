# Soroban Trader WASM Hot Path

High-performance WebAssembly module for sub-second swap execution on Stellar.

## Overview

This Rust-based WASM module provides the execution hot path for Soroban Trader v3.0+, enabling:

- **10x faster** quote calculations (~50ms vs ~500ms)
- **Sub-second** swap execution (~500ms vs ~2-3s)
- **Memory-safe** transaction building
- **Native XDR** serialization
- **Batch processing** for multiple quotes

## Architecture

```
┌─────────────────┐     ┌──────────────┐     ┌─────────────┐
│  Node.js Skill  │────▶│  WASM Module │────▶│  Stellar    │
│  (JavaScript)   │◀────│  (Rust)      │◀────│  Network    │
└─────────────────┘     └──────────────┘     └─────────────┘
                               │
                               ▼
                        ┌──────────────┐
                        │  Optimized   │
                        │  Pathfinding │
                        └──────────────┘
```

## Features

### Core Functions

- `calculate_optimal_path()` - Bellman-Ford pathfinding for arbitrage
- `build_swap_transaction()` - Native XDR transaction construction
- `calculate_quote()` - High-speed quote calculation
- `scan_yields()` - Yield opportunity scanning
- `batch_calculate_quotes()` - Parallel quote processing
- `validate_address()` - Stellar address validation
- `get_metrics()` - Performance monitoring

### Performance Targets

| Operation | Standard (JS) | WASM Hot Path | Speedup |
|-----------|--------------|---------------|---------|
| Quote | ~500ms | ~50ms | **10x** |
| Swap | ~2-3s | ~500ms | **4-6x** |
| Batch (10) | ~5s | ~100ms | **50x** |
| Memory | ~10MB | ~2MB | **5x** |

## Building

### Prerequisites

- Rust 1.70+
- wasm-pack
- wasm32-unknown-unknown target

### Install Dependencies

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Add WASM target
rustup target add wasm32-unknown-unknown

# Install wasm-pack
cargo install wasm-pack
```

### Build

```bash
# Development build
wasm-pack build --target nodejs --dev

# Release build (optimized)
wasm-pack build --target nodejs --release

# Or use the build script
chmod +x build.sh
./build.sh
```

### Output

The build produces:
- `pkg/soroban_trader_wasm.js` - WASM glue code
- `pkg/soroban_trader_wasm_bg.wasm` - WASM binary
- `pkg/` - Package files for npm

## Usage

### In Node.js

```javascript
const wasm = require('./pkg');

// Initialize
wasm.start();

// Calculate quote
const request = {
    source_asset: 'native',
    destination_asset: 'USDC:GA24L...',
    destination_amount: '100'
};

const quote = wasm.calculate_quote(
    JSON.stringify(request),
    liquidityData
);
console.log(JSON.parse(quote));

// Build swap transaction
const swapRequest = {
    source_asset: 'native',
    destination_asset: 'USDC:GA24L...',
    destination_amount: '100',
    max_source_amount: '105',
    path: []
};

const result = wasm.build_swap_transaction(
    JSON.stringify(swapRequest),
    'GABCD...',
    123456789
);
console.log(JSON.parse(result));

// Batch quotes
const requests = [req1, req2, req3, ...];
const quotes = wasm.batch_calculate_quotes(
    JSON.stringify(requests),
    liquidityData
);

// Validate address
const isValid = wasm.validate_address('GABCD...');
```

### From Main Skill

```javascript
const soroban = require('./index.js');

// Use WASM hot path
const result = await soroban.swap({
    password: '***',
    destinationAsset: 'USDC:GA24L...',
    destinationAmount: '100',
    useWASM: true  // Enable WASM hot path
});
```

## Testing

```bash
# Run Rust tests
cargo test

# Run WASM tests
wasm-pack test --headless --firefox

# Run Node.js integration tests
npm test
```

## Optimization Flags

The `Cargo.toml` includes aggressive optimizations:

```toml
[profile.release]
opt-level = 3        # Maximum optimization
lto = true           # Link-time optimization
strip = true         # Strip debug symbols
codegen-units = 1    # Single codegen unit for better optimization
panic = "abort"      # Smaller binary size
```

## Security

- Memory-safe Rust implementation
- No unsafe code in hot path
- Constant-time operations where possible
- Input validation on all public functions

## Roadmap

- [x] Core swap logic
- [x] Quote calculation
- [x] Pathfinding algorithm
- [x] Batch processing
- [ ] SIMD optimizations
- [ ] Streaming quotes
- [ ] Hardware acceleration (when available)

## License

MIT - For agents, by agents.

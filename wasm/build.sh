#!/bin/bash
# Build script for Soroban Trader WASM v3.1
# Compiles Rust to WebAssembly for sub-second execution

set -e

echo "🦀 Building Soroban Trader WASM v3.1..."
echo "   Features: MEV Protection, Flash Loans, Transaction Bundling"

# Check for Rust
echo "📦 Checking dependencies..."
if ! command -v rustc &> /dev/null; then
    echo "❌ Rust not found. Please install Rust:"
    echo "   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
    exit 1
fi

if ! command -v wasm-pack &> /dev/null; then
    echo "📦 Installing wasm-pack..."
    curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
fi

echo "🔧 Rust version: $(rustc --version)"
echo "🔧 wasm-pack version: $(wasm-pack --version)"

# Add wasm32 target if not present
if ! rustup target list --installed | grep -q "wasm32-unknown-unknown"; then
    echo "📦 Adding wasm32 target..."
    rustup target add wasm32-unknown-unknown
fi

# Build for Node.js
echo "🔨 Building WASM module (release mode)..."
wasm-pack build --target nodejs --release

# Copy output to expected location
echo "📂 Copying build artifacts..."
mkdir -p ../pkg
cp -r pkg/* ../pkg/ 2>/dev/null || true

# Create version metadata
echo "📝 Creating version metadata..."
cat > ../pkg/version.json << EOF
{
  "version": "3.1.0",
  "buildDate": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "features": [
    "MEV Protection",
    "Flash Loan Arbitrage",
    "Transaction Bundling",
    "Dynamic Slippage",
    "Sub-second Execution"
  ],
  "optimizations": {
    "lto": true,
    "optLevel": 3,
    "codegenUnits": 1
  }
}
EOF

echo "✅ WASM build complete!"
echo ""
echo "📊 Build artifacts:"
ls -lh pkg/*.wasm pkg/*.js 2>/dev/null || ls -lh ../pkg/*.wasm ../pkg/*.js 2>/dev/null || echo "   Check pkg/ directory"
echo ""
echo "🚀 Next steps:"
echo "   1. Import the WASM module in your Node.js code"
echo "   2. Use useWASM=true in swap() for accelerated execution"
echo "   3. Enable MEV protection with setMEVProtection()"

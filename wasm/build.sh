#!/bin/bash
# Build script for Soroban Trader WASM hot path

set -e

echo "🦀 Building Soroban Trader WASM hot path..."

# Check if Rust is installed
if ! command -v rustc &> /dev/null; then
    echo "❌ Rust not found. Please install Rust:"
    echo "   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
    exit 1
fi

# Check for wasm32 target
if ! rustup target list --installed | grep -q wasm32-unknown-unknown; then
    echo "📦 Installing wasm32-unknown-unknown target..."
    rustup target add wasm32-unknown-unknown
fi

# Check for wasm-pack
if ! command -v wasm-pack &> /dev/null; then
    echo "📦 Installing wasm-pack..."
    cargo install wasm-pack
fi

# Build the WASM module
echo "🔨 Building WASM module..."
wasm-pack build --target nodejs --release

# Create version info
echo "📝 Creating version info..."
cat > version.json << EOF
{
  "version": "3.0.0",
  "built_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "rust_version": "$(rustc --version)",
  "wasm_pack_version": "$(wasm-pack --version)"
}
EOF

echo "✅ Build complete!"
echo "📦 Output: pkg/soroban_trader_wasm.js"
echo "🚀 To use in skill: require('./pkg')"

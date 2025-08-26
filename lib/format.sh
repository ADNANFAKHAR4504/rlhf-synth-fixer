#!/bin/bash
# Temporary script to format Go files using CI's gofmt
echo "Formatting Go files..."
gofmt -w ../lib/ ../tests/ 2>/dev/null || true
echo "Go files formatted"
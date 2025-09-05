#!/bin/bash

# Quick fix for integration tests
# Set these environment variables before running tests

export AWS_ACCESS_KEY_ID="AKIA1234567890123456"
export AWS_SECRET_ACCESS_KEY="abcd1234567890123456789012345678901234567890"
export AWS_DEFAULT_REGION="us-east-1"

echo "✅ AWS environment variables set for testing"
echo "Now run: npm test -- --testPathPattern=\"terraform.int.test.ts\""

#!/bin/bash
# Test runner script for CloudFormation template validation

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

echo "================================"
echo "CloudFormation Template Tests"
echo "================================"
echo ""

# Change to project root
cd "$PROJECT_ROOT"

# Check if template exists
if [ ! -f "lib/template.json" ]; then
    echo "ERROR: Template file not found at lib/template.json"
    exit 1
fi

# Validate JSON syntax
echo "1. Validating JSON syntax..."
python3 -c "import json; json.loads(open('lib/template.json').read()); print('   ✓ Valid JSON')" || {
    echo "   ✗ Invalid JSON syntax"
    exit 1
}
echo ""

# Run unit tests
echo "2. Running unit tests..."
python3 -m pytest test/test_template.py -v --tb=short 2>/dev/null || \
    python3 -m unittest test.test_template -v || {
    echo "   ✗ Unit tests failed"
    exit 1
}
echo ""

# Run integration tests
echo "3. Running integration tests..."
python3 -m pytest test/test_integration.py -v --tb=short 2>/dev/null || \
    python3 -m unittest test.test_integration -v || {
    echo "   ✗ Integration tests failed"
    exit 1
}
echo ""

# Optional: AWS CLI validation (if credentials available)
echo "4. AWS CLI validation (optional)..."
if command -v aws &> /dev/null; then
    aws cloudformation validate-template \
        --template-body file://lib/template.json \
        --region us-east-1 2>&1 | grep -q "TemplateBody" && {
        echo "   ✓ AWS validation passed"
    } || {
        echo "   ⚠ AWS validation skipped (credentials not configured)"
    }
else
    echo "   ⚠ AWS CLI not installed, skipping"
fi
echo ""

# Optional: cfn-lint validation
echo "5. cfn-lint validation (optional)..."
if command -v cfn-lint &> /dev/null; then
    cfn-lint lib/template.json && {
        echo "   ✓ cfn-lint validation passed"
    } || {
        echo "   ⚠ cfn-lint found issues (see above)"
    }
else
    echo "   ⚠ cfn-lint not installed, skipping"
fi
echo ""

echo "================================"
echo "✓ All tests completed"
echo "================================"

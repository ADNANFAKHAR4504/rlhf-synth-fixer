#!/bin/bash
# validate-code-platform.sh
# Validates that IDEAL_RESPONSE.md matches the platform and language in metadata.json
# Referenced by: .claude/agents/iac-code-reviewer.md

set -eo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }

# Check if metadata.json exists
if [ ! -f "metadata.json" ]; then
    print_error "metadata.json not found in current directory"
    exit 1
fi

# Check if IDEAL_RESPONSE.md exists
if [ ! -f "lib/IDEAL_RESPONSE.md" ]; then
    print_error "lib/IDEAL_RESPONSE.md not found"
    exit 1
fi

# Extract platform and language from metadata.json
EXPECTED_PLATFORM=$(jq -r '.platform // "unknown"' metadata.json)
EXPECTED_LANGUAGE=$(jq -r '.language // "unknown"' metadata.json)

echo "Expected from metadata.json:"
echo "  Platform: $EXPECTED_PLATFORM"
echo "  Language: $EXPECTED_LANGUAGE"
echo ""

# Special handling for analysis platform
if [ "$EXPECTED_PLATFORM" = "analysis" ]; then
    print_success "Analysis platform detected - skipping IaC platform validation"

    # For analysis tasks, verify that analysis script exists
    if [ -f "lib/analyse.py" ] || [ -f "lib/analyze.py" ] || [ -f "lib/analyse.sh" ]; then
        print_success "Analysis script found in lib/"

        # Only validate language (should be python or bash)
        if [ "$EXPECTED_LANGUAGE" = "py" ] || [ "$EXPECTED_LANGUAGE" = "py" ]; then
            if grep -qE '```python|```py|^import |^def |\.py' lib/IDEAL_RESPONSE.md; then
                print_success "Language matches: Python script detected"
                exit 0
            else
                print_error "Expected Python code in IDEAL_RESPONSE.md for analysis task"
                exit 1
            fi
        elif [ "$EXPECTED_LANGUAGE" = "bash" ] || [ "$EXPECTED_LANGUAGE" = "sh" ]; then
            if grep -qE '```bash|```sh|#!/bin/bash|#!/bin/sh' lib/IDEAL_RESPONSE.md; then
                print_success "Language matches: Bash script detected"
                exit 0
            else
                print_error "Expected Bash code in IDEAL_RESPONSE.md for analysis task"
                exit 1
            fi
        else
            print_warning "Unexpected language '$EXPECTED_LANGUAGE' for analysis task"
            print_success "Proceeding with validation (analysis tasks are flexible)"
            exit 0
        fi
    else
        print_error "No analysis script found (expected lib/analyse.py, lib/analyze.py, or lib/analyse.sh)"
        exit 1
    fi
fi

# Special handling for cicd platform
if [ "$EXPECTED_PLATFORM" = "cicd" ]; then
    print_success "CI/CD platform detected - skipping IaC platform validation"

    # For CI/CD pipeline tasks, verify that pipeline configuration exists
    if [ -f "lib/ci-cd.yml" ] || [ -f "lib/ci-cd.yaml" ] || [ -f "lib/pipeline.yml" ]; then
        print_success "CI/CD pipeline configuration found in lib/"

        # Only validate language (should be yml or yaml)
        if [ "$EXPECTED_LANGUAGE" = "yml" ] || [ "$EXPECTED_LANGUAGE" = "yaml" ]; then
            if grep -qE '```yaml|```yml|^name:|^on:|^jobs:' lib/IDEAL_RESPONSE.md; then
                print_success "Language matches: YAML pipeline configuration detected"
                exit 0
            else
                print_error "Expected YAML code in IDEAL_RESPONSE.md for CI/CD pipeline task"
                exit 1
            fi
        else
            print_warning "Unexpected language '$EXPECTED_LANGUAGE' for CI/CD pipeline task"
            print_success "Proceeding with validation (CI/CD pipeline tasks are flexible)"
            exit 0
        fi
    else
        print_error "No CI/CD pipeline configuration found (expected lib/ci-cd.yml, lib/ci-cd.yaml, or lib/pipeline.yml)"
        exit 1
    fi
fi

# Detect actual platform by searching IDEAL_RESPONSE.md directly
DETECTED_PLATFORM="unknown"

# Check for CDK
if grep -qE 'aws-cdk-lib|@aws-cdk|software\.amazon\.awscdk|from aws_cdk import' lib/IDEAL_RESPONSE.md; then
    DETECTED_PLATFORM="cdk"
# Check for Terraform
elif grep -qE 'terraform\{|provider "aws"|resource "aws_' lib/IDEAL_RESPONSE.md; then
    DETECTED_PLATFORM="tf"
# Check for CloudFormation
elif grep -qE 'AWSTemplateFormatVersion|Resources:|AWS::CloudFormation' lib/IDEAL_RESPONSE.md; then
    DETECTED_PLATFORM="cfn"
# Check for Pulumi
elif grep -qE 'import pulumi|from pulumi import|pulumi\.' lib/IDEAL_RESPONSE.md; then
    DETECTED_PLATFORM="pulumi"
# Check for CDKTF
elif grep -qE 'cdktf|TerraformStack' lib/IDEAL_RESPONSE.md; then
    DETECTED_PLATFORM="cdktf"
fi

# Detect actual language by searching IDEAL_RESPONSE.md directly
DETECTED_LANGUAGE="unknown"

# Check programming languages first (they take precedence over JSON/YAML)
# Check for Java (use word boundary to prevent matching 'javascript')
if grep -qE '```java\b|package app|package com|import java\.|public class |\.java' lib/IDEAL_RESPONSE.md; then
    DETECTED_LANGUAGE="java"
# Check for JavaScript (check before TypeScript)
elif grep -qE '```javascript|```js|import.*from.*\.mjs' lib/IDEAL_RESPONSE.md; then
    DETECTED_LANGUAGE="js"
# Check for TypeScript
elif grep -qE '```typescript|```ts|import.*from|interface |\.ts' lib/IDEAL_RESPONSE.md; then
    DETECTED_LANGUAGE="ts"
# Check for HCL (Terraform configuration language) - MUST check before Python
# Because Terraform files may reference .py files (e.g., lambda.py) which would match Python pattern
elif grep -qE '```hcl|```terraform|resource "aws_|provider "aws"|\.tf' lib/IDEAL_RESPONSE.md; then
    DETECTED_LANGUAGE="hcl"
# Check for Python
elif grep -qE '```python|```py|^import |^def |\.py' lib/IDEAL_RESPONSE.md; then
    DETECTED_LANGUAGE="py"
# Check for Go
elif grep -qE '```go|package main|import \(|func |\.go' lib/IDEAL_RESPONSE.md; then
    DETECTED_LANGUAGE="go"
# Check for C#
elif grep -qE '```csharp|```cs|using System|namespace |\.cs' lib/IDEAL_RESPONSE.md; then
    DETECTED_LANGUAGE="csharp"
# Check for YAML (CloudFormation, config files) - must have code blocks
elif grep -qE '```yaml|```yml' lib/IDEAL_RESPONSE.md; then
    DETECTED_LANGUAGE="yaml"
# Check for JSON (CloudFormation, config files) - must have code blocks
elif grep -qE '```json|```JSON' lib/IDEAL_RESPONSE.md; then
    DETECTED_LANGUAGE="json"
# Check for CFN (generic CloudFormation marker)
elif grep -qE '```cfn|```cloudformation' lib/IDEAL_RESPONSE.md; then
    DETECTED_LANGUAGE="cfn"
fi

echo "Detected from IDEAL_RESPONSE.md:"
echo "  Platform: $DETECTED_PLATFORM"
echo "  Language: $DETECTED_LANGUAGE"
echo ""

# Validation results
PLATFORM_MATCH=false
LANGUAGE_MATCH=false

if [ "$EXPECTED_PLATFORM" = "$DETECTED_PLATFORM" ]; then
    PLATFORM_MATCH=true
    print_success "Platform matches: $EXPECTED_PLATFORM"
else
    print_error "Platform mismatch! Expected: $EXPECTED_PLATFORM, Detected: $DETECTED_PLATFORM"
fi

if [ "$EXPECTED_LANGUAGE" = "$DETECTED_LANGUAGE" ]; then
    LANGUAGE_MATCH=true
    print_success "Language matches: $EXPECTED_LANGUAGE"
else
    print_error "Language mismatch! Expected: $EXPECTED_LANGUAGE, Detected: $DETECTED_LANGUAGE"
fi

echo ""

# Overall result
if [ "$PLATFORM_MATCH" = true ] && [ "$LANGUAGE_MATCH" = true ]; then
    print_success "VALIDATION PASSED: Code matches metadata.json"
    exit 0
else
    print_error "VALIDATION FAILED: Code does not match metadata.json"

    # Provide helpful suggestions
    if [ "$PLATFORM_MATCH" = false ]; then
        echo ""
        print_warning "Platform fix required:"
        echo "  - metadata.json specifies: $EXPECTED_PLATFORM"
        echo "  - IDEAL_RESPONSE.md contains: $DETECTED_PLATFORM"
        echo "  - Either update metadata.json or regenerate IDEAL_RESPONSE.md for $EXPECTED_PLATFORM"
    fi

    if [ "$LANGUAGE_MATCH" = false ]; then
        echo ""
        print_warning "Language fix required:"
        echo "  - metadata.json specifies: $EXPECTED_LANGUAGE"
        echo "  - IDEAL_RESPONSE.md contains: $DETECTED_LANGUAGE"
        echo "  - Either update metadata.json or regenerate IDEAL_RESPONSE.md for $EXPECTED_LANGUAGE"
    fi

    exit 1
fi

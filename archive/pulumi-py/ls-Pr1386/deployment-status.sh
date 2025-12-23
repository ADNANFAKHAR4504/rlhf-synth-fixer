#!/bin/bash

# Deployment Test Results for Pr1386

echo "==========================================================="
echo "LOCALSTACK DEPLOY TESTER RESULT"
echo "==========================================================="
echo ""
echo "Task: archive/pulumi-py/Pr1386"
echo "Platform: pulumi"
echo "Language: py"
echo "PR ID: Pr1386"
echo ""
echo "Deployment: FAILED"
echo "Tests:      SKIPPED (deployment failed)"
echo ""
echo "==========================================================="
echo "RESULTS SUMMARY"
echo "==========================================================="
echo ""
echo "Resources Created Successfully: 6"
echo "  - IAM Role and Policy"
echo "  - KMS Key"
echo "  - CloudWatch Log Groups (2)"
echo "  - Custom TapStack Resource"
echo ""
echo "Resources Failed: 3+"
echo "  - CloudFront Origin Access Identity (501 - Not in Community)"
echo "  - WAFv2 WebACL (501 - Not in Community)"
echo "  - Dependent resources not created"
echo ""
echo "Root Cause:"
echo "  CloudFront and WAFv2 are NOT available in LocalStack"
echo "  Community edition. The stack has hard dependencies on"
echo "  these services and cannot deploy without them."
echo ""
echo "==========================================================="
echo ""

# Set environment variables for parent process
export DEPLOY_SUCCESS=false
export DEPLOY_ERRORS="CloudFront (501): Not available in LocalStack Community. WAFv2 (501): Not available in LocalStack Community. Stack requires these services for CDN and security features."
export TEST_SUCCESS=false
export TEST_ERRORS="Tests skipped because deployment failed"

echo "Environment Variables Set:"
echo "DEPLOY_SUCCESS=false"
echo "DEPLOY_ERRORS=\"CloudFront (501): Not available in LocalStack Community. WAFv2 (501): Not available in LocalStack Community. Stack requires these services for CDN and security features.\""
echo "TEST_SUCCESS=false"  
echo "TEST_ERRORS=\"Tests skipped because deployment failed\""
echo ""

exit 1

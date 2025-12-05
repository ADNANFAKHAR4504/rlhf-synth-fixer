# Infrastructure Analysis and Validation Tool

A comprehensive CDK TypeScript framework for analyzing and validating infrastructure configurations during the synthesis phase. This tool helps identify security issues, configuration drift, and compliance violations before deployment.

## Features

- CDK Aspects for Validation: Custom aspects that traverse the construct tree to validate resources
- S3 Encryption Validation: Ensures all S3 buckets have encryption enabled
- IAM Policy Analysis: Detects overly permissive policies with wildcard actions or resources
- Lambda Configuration Checks: Validates timeout settings, memory allocation, and environment variables
- RDS Security Validation: Verifies encryption, backup retention, and Multi-AZ configuration
- Stack Comparison: Compare CloudFormation templates to detect configuration drift
- Custom Rule Engine: Load validation rules from YAML configuration files
- Structured JSON Reports: Categorized findings with severity levels and remediation steps
- CLI Tool: Command-line interface for CI/CD integration with proper exit codes

## Installation

```bash
npm install
# GitHub Actions example
- name: Synthesize and Validate
  run: |
    npm install
    cdk synth -c environmentSuffix=${{ github.ref_name }}

- name: Check Validation Report
  run: |
    npx ts-node lib/cli/analyze-cli.ts validate \
      validation-report.json \
      --severity critical

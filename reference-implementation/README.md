# Reference Implementation - Pulumi TypeScript

This folder contains the original Pulumi TypeScript implementation of the compliance scanner.

## Contents

- `tap-stack.ts` - Pulumi infrastructure stack that deploys the compliance scanner as a Lambda function
- `analyse.ts` - TypeScript analysis script that can be run locally
- `lambda/` - Lambda function code for the compliance scanner

## Note

This is kept as a reference implementation. The primary implementation is now a Python script (`lib/compliance_scanner.py`) that uses boto3 for AWS infrastructure analysis, as required by the "Infrastructure Analysis/Monitoring" subject label.

The Python implementation provides the same compliance checks but follows the analysis platform pattern instead of the IaC platform pattern.

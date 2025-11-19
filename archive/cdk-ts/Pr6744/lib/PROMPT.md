# AWS CDK Infrastructure Compliance Analyzer

## Overview

We need a CDK application that can analyze existing AWS infrastructure for compliance and optimization issues. The tool should scan all CDK-deployed stacks in the current AWS account and region, perform security and compliance checks, and generate detailed reports.

## Requirements

### Core Functionality

The application needs to:

1. **Discover CDK Stacks**: Scan all deployed CDK stacks in the current region using CloudFormation APIs. Filter stacks by the `aws:cdk:stack-name` tag to identify CDK-managed infrastructure.

2. **Security Analysis**: 
   - Check security groups for unrestricted inbound access (0.0.0.0/0) on non-standard ports
   - Verify S3 bucket encryption and versioning settings
   - Analyze IAM roles for overly permissive policies (Resource: '*')
   - Check EBS volume encryption status

3. **Operational Checks**:
   - Identify EC2 instances without detailed monitoring enabled
   - Find Lambda functions using outdated runtimes (Node.js < 18, Python < 3.9)
   - Verify RDS instances and clusters have automated backups configured

4. **Cost Analysis**: 
   - Estimate monthly costs per stack using Cost Explorer API
   - Provide fallback estimation based on resource types if Cost Explorer is unavailable

5. **Compliance Scoring**: 
   - Calculate a compliance score (0-100) for each stack based on findings
   - Use CIS AWS Foundations Benchmark severity weights:
     - Critical findings: -25 points each
     - High findings: -15 points each
     - Medium findings: -10 points each
     - Low findings: -5 points each

6. **Report Generation**:
   - Generate JSON reports with detailed findings, ARNs, severity levels, and recommendations
   - Generate HTML reports with executive summaries and visual compliance scores
   - Store reports in a local `/reports/` directory with timestamped filenames

### Technical Constraints

- Must use AWS CDK v2 with TypeScript
- Use AWS SDK v3 clients for all AWS service interactions
- All operations must be read-only (no resource modifications)
- Analysis should complete within 5 minutes for environments with up to 500 resources
- Use parallel processing with Promise.all for performance optimization
- The solution should work in a single region (current region only)

### Deliverables

1. **bin/tap.ts**: CDK app entry point that defines the TapStack
2. **lib/tap-stack.ts**: TapStack class extending `cdk.Stack` with all analysis logic

### AWS Services Required

- CloudFormation (stack discovery)
- EC2 (security groups, instances, volumes)
- S3 (bucket analysis)
- Lambda (function runtime checks)
- IAM (role policy analysis)
- RDS (backup configuration checks)
- Cost Explorer (optional, with fallback)

### Output Requirements

- Compliance summary per stack (score, critical findings count)
- Total estimated cost across all analyzed stacks
- File paths to generated JSON and HTML reports
- All findings categorized by severity with actionable recommendations

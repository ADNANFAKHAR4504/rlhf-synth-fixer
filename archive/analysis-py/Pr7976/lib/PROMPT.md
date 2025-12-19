# Infrastructure Security Audit Tool

Hey team,

We need to build a comprehensive security audit tool for a fintech startup's AWS infrastructure. They have a complex multi-stack Pulumi setup with EC2 instances, RDS databases, S3 buckets, and IAM roles scattered across multiple stacks. The goal is to scan everything and identify security misconfigurations and compliance gaps against the AWS Well-Architected Framework security pillar.

The challenge here is that we cannot modify the existing infrastructure at all. We need to read the Pulumi state files, extract all the resource configurations, run security checks, and generate actionable reports. This is about visibility and risk assessment, not infrastructure deployment.

I've been asked to create this using **TypeScript** with **Pulumi's Automation API**. The business wants a tool that DevSecOps teams can run regularly to maintain security posture and track compliance over time.

## What we need to build

An infrastructure security analysis tool using **TypeScript** with **Pulumi's Automation API** to audit existing AWS resources.

**IMPORTANT**: This task does NOT deploy infrastructure. The code analyzes existing Pulumi-managed resources and generates security reports.

### Analysis Script Requirements

Create a TypeScript program that uses Pulumi's Automation API to:

1. **Stack Discovery and Resource Extraction**:
   - Connect to existing Pulumi stacks in the current AWS account
   - Read stack outputs and state without modifying resources
   - Extract configuration for EC2 instances, RDS databases, S3 buckets, IAM roles, and Security Groups
   - Handle multiple stacks and aggregate findings

2. **Security Checks - S3 Buckets**:
   - Detect public access configurations (bucket policies, ACLs, public block settings)
   - Verify server-side encryption is enabled (SSE-S3, SSE-KMS)
   - Check if versioning is enabled
   - Assess content sensitivity and generate risk scores for public buckets

3. **Security Checks - RDS Instances**:
   - Verify encryption at rest is enabled
   - Check backup retention period (should be greater than or equal to 7 days)
   - Verify multi-AZ deployment for production databases
   - Check if deletion protection is enabled

4. **Security Checks - EC2 Instances**:
   - Scan for unencrypted EBS volumes attached to instances
   - Verify IMDSv2 enforcement (HttpTokens required)
   - Check if instances are in public subnets with public IPs

5. **Security Checks - IAM Roles and Policies**:
   - Detect overly permissive policies with wildcard actions like "*" or "Action: *"
   - Identify roles with full administrative access
   - Flag policies allowing unrestricted resource access ("Resource: *")

6. **Security Checks - Security Groups**:
   - Identify unrestricted inbound rules allowing 0.0.0.0/0
   - Flag security groups with open high-risk ports (22, 3389, 3306, 5432)
   - Check for overly permissive outbound rules

7. **Security Checks - VPC Configuration**:
   - Verify network segmentation between public and private subnets
   - Check if sensitive resources (databases, internal apps) are in private subnets

8. **Compliance Scoring and Severity Categorization**:
   - Calculate compliance score (0-100) based on number and severity of findings
   - Categorize each finding by severity: Critical, High, Medium, Low
   - Weight findings by impact (e.g., public S3 with sensitive data = Critical)

9. **Remediation Guidance**:
   - Generate Pulumi TypeScript code snippets showing how to fix each issue
   - Provide clear, actionable recommendations
   - Include links to AWS Well-Architected Framework documentation

10. **Report Generation**:
    - Output machine-readable JSON report with all findings
    - Generate human-readable HTML dashboard with visualizations
    - Group findings by AWS service and severity level
    - Include summary statistics: total resources scanned, issues found, compliance percentage

### Technical Requirements

- All code in **TypeScript** using **Pulumi's Automation API**
- Use AWS SDK v3 (boto3 equivalent for Node.js) for additional AWS API calls if needed
- Read-only access to Pulumi stacks (no stack modifications)
- Analysis must complete within 5 minutes for infrastructures with up to 500 resources
- Resource names should include **environmentSuffix** for environment identification
- Handle errors gracefully (missing stacks, inaccessible resources)
- Support dry-run mode for testing

### Environment Variables

- `ENVIRONMENT_SUFFIX`: Environment to analyze (default: dev)
- `AWS_REGION`: Target AWS region (default: us-east-1)
- `PULUMI_ACCESS_TOKEN`: Pulumi access token for state access

### Deployment Requirements (CRITICAL)

This is an analysis tool that reads existing infrastructure. Important considerations:

- Tool should be runnable as a CLI command
- Output reports to configurable directory (default: ./reports)
- Support filtering by specific Pulumi stacks or resource types
- Include timestamp in report filenames
- No infrastructure resources are created or destroyed
- All resources must include **environmentSuffix** for discovery
- All resources must be fully destroyable (no Retain policies)

## Success Criteria

- Script successfully discovers and connects to all Pulumi stacks in AWS account
- Accurate resource discovery and configuration extraction
- All 10 security check categories implemented correctly
- Compliance score calculation reflects finding severity accurately
- JSON and HTML reports generated with complete findings
- Remediation code snippets are syntactically correct Pulumi TypeScript
- Analysis completes within performance requirements (5 min for 500 resources)
- Error handling for missing resources or inaccessible stacks
- Clear, actionable recommendations in reports

## What to deliver

- Complete TypeScript implementation using Pulumi Automation API
- Security check modules for EC2, RDS, S3, IAM, Security Groups, VPC
- Compliance scoring engine with severity weighting
- Report generation modules (JSON and HTML)
- Remediation code snippet generator
- CLI interface for running the analysis
- Unit tests for security check logic
- Documentation and usage instructions in README

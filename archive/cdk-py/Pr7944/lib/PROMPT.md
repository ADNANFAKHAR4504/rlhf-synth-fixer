# Infrastructure Compliance Analysis Tool

Hey team,

We need to build an automated compliance analysis tool for our financial services company. They've been deploying infrastructure using CDK across multiple AWS accounts, and now they need to audit everything to ensure it meets their internal security policies.

The problem is that they have infrastructure scattered across dev, staging, and production accounts, and manually checking compliance is becoming impossible. We need to automate the analysis of deployed CloudFormation stacks to identify security violations, configuration drift, and missing tags.

I've been asked to create this using **AWS CDK with Python**. The tool needs to read existing CloudFormation stacks, analyze the deployed resources, check for security issues like unencrypted storage or overly permissive security groups, and generate compliance reports in JSON format.

## What we need to build

Create an infrastructure compliance analysis tool using **AWS CDK with Python** that audits existing CDK-deployed infrastructure across multiple AWS accounts.

### Core Requirements

1. **Stack Analysis Engine**
   - Read CloudFormation stack information from deployed environments
   - Implement custom construct for security analysis on stack resources
   - Support filtering by stack name pattern or AWS account ID
   - Work across multiple AWS accounts using assume role permissions

2. **S3 Bucket Compliance Checks**
   - Verify encryption settings are enabled
   - Check public access blocks are configured
   - Detect unencrypted S3 buckets

3. **RDS Security Validation**
   - Validate encrypted storage is enabled
   - Verify automated backups are configured
   - Detect unencrypted RDS instances

4. **Security Group Analysis**
   - Identify rules allowing unrestricted inbound access (0.0.0.0/0)
   - Validate against security baseline

5. **Resource Tagging Validation**
   - Verify all resources have required tags: Environment, Owner, CostCenter
   - Report missing or incomplete tags

6. **IAM Policy Validation (MANDATORY)**
   - Validate IAM policies against a predefined security baseline
   - Identify overly permissive policies

7. **Compliance Reporting**
   - Generate JSON report with pass/fail status for each check
   - Calculate risk score (1-10) based on violations found
   - Include stack name, account ID, region, timestamp
   - Provide summary of all violations found
   - Output must be in JSON format for integration with existing compliance dashboards

8. **Performance Optimization**
   - Implement caching to avoid redundant API calls
   - Analysis should complete within 5 minutes for up to 50 CloudFormation stacks

9. **Operational Modes**
   - Support dry-run mode that doesn't make modifications
   - Modular design to allow easy addition of new compliance checks

### Technical Requirements

- All infrastructure and analysis logic defined using **AWS CDK with Python**
- Use AWS CDK 2.x (aws-cdk-lib) Python bindings
- Requires Python 3.9+ runtime
- Use boto3 for AWS API interactions
- Deploy to **us-east-1** region
- Cross-account IAM roles for multi-account analysis
- Resource names must include **environmentSuffix** for uniqueness where applicable

### Constraints

- Must validate IAM policies against a predefined security baseline (MANDATORY)
- Must identify security groups with overly permissive ingress rules 0.0.0.0/0 (MANDATORY)
- Output must be in JSON format for compliance dashboard integration (MANDATORY)
- Resource tag validation must check for mandatory tags: Environment, Owner, CostCenter
- Analysis must work across multiple AWS accounts using assume role permissions
- Should generate a risk score (1-10) for each analyzed stack
- Must detect unencrypted S3 buckets and RDS instances
- Must support dry-run mode that doesn't make modifications
- All resources must be destroyable (no Retain policies)
- Include proper error handling and logging

### Environment Context

- Multi-account AWS environment: development, staging, production
- Existing infrastructure: EC2 instances, RDS databases, S3 buckets, Lambda functions, VPC configurations
- VPC spans 3 availability zones with public and private subnets
- NAT gateways for outbound connectivity
- AWS CLI configured with appropriate credentials
- Cross-account IAM roles already configured

## Success Criteria

- Functionality: Tool successfully analyzes deployed CloudFormation stacks across multiple accounts
- Security: Correctly identifies unencrypted resources, permissive security groups, and IAM policy violations
- Compliance: Validates all required resource tags (Environment, Owner, CostCenter)
- Performance: Completes analysis within 5 minutes for up to 50 stacks
- Reporting: Generates JSON report with all required fields (stack name, account ID, region, timestamp, checks, risk score, violations summary)
- Reliability: Handles errors gracefully, implements caching for efficiency
- Modularity: Easy to add new compliance checks
- Code Quality: Python 3.9+, AWS CDK 2.x, well-tested, documented

## What to deliver

- Complete AWS CDK Python implementation
- Custom construct for compliance analysis
- S3 bucket security checks
- RDS instance security checks
- Security group analysis
- IAM policy validation
- Resource tagging validation
- Risk scoring algorithm
- JSON report generation
- Caching implementation
- Multi-account support with assume role
- Dry-run mode support
- Unit tests for all components
- Documentation and deployment instructions

## Deployment Requirements (CRITICAL)

- Resource names must include **environmentSuffix** parameter for uniqueness
- Follow naming convention: `{resource-type}-{environmentSuffix}`
- All resources must have RemovalPolicy.DESTROY (no RETAIN policies)
- This ensures resources can be fully cleaned up during testing

## Implementation Notes

The CDK app should define the analysis infrastructure (Lambda functions, IAM roles, etc.) while the actual compliance checking logic should use boto3 to inspect existing CloudFormation stacks and their resources. The tool reads deployed infrastructure and generates compliance reports without modifying the analyzed resources (unless explicitly in non-dry-run mode for remediation).

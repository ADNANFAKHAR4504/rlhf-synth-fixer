# Infrastructure Analysis Tool for CDK Stacks

Hey team,

We need to build an infrastructure analysis tool that helps validate CDK stacks before deployment. A financial services company discovered configuration drift between their dev and production environments after a security audit, and they need automated validation to prevent this in the future.

The goal is to create a comprehensive analysis framework that runs during the CDK synthesis phase, checking for security compliance, configuration issues, and best practices violations without actually deploying anything.

## What we need to build

Create an infrastructure analysis tool using **AWS CDK with TypeScript** that validates CDK constructs and CloudFormation templates.

**IMPORTANT**: This task does NOT deploy infrastructure. The tool analyzes CDK construct trees and synthesized templates.

### Core Analysis Requirements

1. **CDK Aspect for S3 Validation**:
   - Implement a custom CDK aspect that traverses the construct tree
   - Validate all S3 buckets have encryption enabled
   - Check bucket policies for public access
   - Verify versioning and lifecycle policies

2. **Stack Comparison Utility**:
   - Compare two CDK stack outputs or CloudFormation templates
   - Identify differences in resource configurations
   - Handle nested constructs and custom resources
   - Detect configuration drift between environments

3. **IAM Policy Analyzer**:
   - Detect overly permissive IAM policies
   - Flag wildcard actions or resources
   - Validate least privilege principles
   - Check for dangerous permission combinations

4. **Lambda Function Analysis**:
   - Validate Lambda functions have required environment variables
   - Check timeout settings are appropriate
   - Verify memory configurations
   - Detect missing error handling patterns

5. **RDS Instance Validation**:
   - Ensure RDS instances have backup retention enabled
   - Verify encryption at rest is configured
   - Check Multi-AZ settings for production
   - Validate security group configurations

### Reporting Requirements

1. **Structured JSON Report**:
   - Generate detailed findings report
   - Categorize findings as 'critical', 'warning', or 'info'
   - Include resource identifiers and locations
   - Provide execution time metrics for each validation check

2. **Actionable Remediation**:
   - Include specific remediation steps for each finding
   - Reference AWS best practices documentation
   - Provide code snippets for fixes where applicable

3. **Custom Validation Rules**:
   - Support loading validation rules from YAML configuration file
   - Allow teams to define custom compliance checks
   - Enable/disable specific validators via configuration

### CLI Integration Requirements

1. **CI/CD Pipeline Compatible**:
   - Create CLI tool that can run in automated pipelines
   - Support exit codes for pass/fail scenarios
   - Generate machine-readable output
   - Complete analysis within 60 seconds for stacks with up to 100 resources

2. **Synthesis Phase Integration**:
   - Run as part of CDK synth process
   - No deployment required
   - Analyze construct tree before template generation
   - Work with CDK 2.x and TypeScript

### Technical Requirements

- All code must be in **AWS CDK with TypeScript**
- Use CDK aspects API for construct tree traversal
- Support Node.js 18+ runtime
- Resource names must include **environmentSuffix** parameter for uniqueness
- Follow naming convention: `{resource-type}-{environmentSuffix}`
- No actual AWS resources deployed during analysis
- Read-only permissions sufficient for deployed resource analysis

### Environment Variables

- `ENVIRONMENT_SUFFIX`: Environment to analyze (default: dev)
- `AWS_REGION`: Target AWS region (default: us-east-1)
- `VALIDATION_CONFIG`: Path to custom YAML validation rules (optional)

### Performance Requirements

- Analysis must complete within 60 seconds for stacks with up to 100 resources
- Efficient construct tree traversal
- Parallel validation checks where possible
- Minimal memory footprint

### Constraints

- Cannot modify existing stack resources, only analyze and report
- Must handle nested constructs correctly
- Support custom resources in analysis
- Work offline with synthesized templates (no AWS API calls required for template analysis)
- For deployed resource analysis (optional), use read-only AWS SDK calls

## Success Criteria

- Custom CDK aspect successfully validates S3 bucket configurations
- Stack comparison utility accurately identifies configuration differences
- IAM policy analyzer detects wildcard permissions
- Lambda and RDS validators find configuration issues
- JSON report generated with proper categorization and metrics
- Custom YAML validation rules load and execute correctly
- CLI tool integrates with CI/CD pipelines
- Analysis completes within performance requirements
- Remediation guidance is actionable and specific
- All code uses **AWS CDK with TypeScript**

## What to deliver

- CDK aspect implementation for S3 validation
- Stack comparison utility for template diffing
- IAM policy analyzer with wildcard detection
- Lambda and RDS configuration validators
- JSON report generator with categorization
- YAML configuration loader for custom rules
- CLI tool with CI/CD integration
- Unit tests for all validators
- Integration tests with sample CDK stacks
- Documentation for usage and custom rule creation

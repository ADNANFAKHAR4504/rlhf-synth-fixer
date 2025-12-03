# IAM Policy Compliance Analyzer

Hey team,

We need to build a comprehensive IAM policy compliance analyzer for our AWS accounts. The security team has been asking for better visibility into our IAM configurations, especially around overly permissive policies and unused roles. They want automated scanning and reporting so we can catch compliance issues before they become security incidents.

I've been asked to create this using **Pulumi with TypeScript**. The goal is to deploy infrastructure that continuously monitors IAM policies, identifies security risks, and generates compliance reports that can be reviewed by both our security and DevOps teams.

The challenge here is that we have hundreds of IAM roles across multiple accounts, and manually auditing them is time-consuming and error-prone. We need an automated solution that can scan all roles, check for common security anti-patterns, and flag issues that need attention.

## What we need to build

Create an IAM policy compliance analyzer using **Pulumi with TypeScript** that scans existing AWS IAM configurations and identifies security compliance issues.

### Core Requirements

1. **IAM Role and Policy Scanning**
   - Scan all IAM roles in the current AWS account
   - Extract and analyze all attached policies (both managed and inline)
   - Support scanning both AWS managed and customer managed policies

2. **Wildcard Permission Detection**
   - Check for policies that grant wildcard (*) permissions on sensitive services
   - Focus on critical services: S3, DynamoDB, RDS
   - Flag policies with overly broad permissions like "s3:*" or "dynamodb:*"

3. **Unused Role Identification**
   - Identify roles that haven't been used in the last 90 days
   - Check LastUsedDate from IAM role metadata
   - Report roles that might be safe to remove

4. **Inline Policy Analysis**
   - Detect inline policies attached to roles
   - Flag inline policies that should be converted to managed policies
   - Explain why managed policies are preferred for governance

5. **Cross-Account Access Validation**
   - Detect roles with cross-account access permissions
   - Validate trusted entities in assume role policies
   - Flag suspicious or unexpected external account access

6. **Compliance Report Generation**
   - Generate a detailed compliance report in JSON format
   - Store the report in an S3 bucket for audit trails
   - Include findings, severity levels, and remediation recommendations

7. **CloudWatch Metrics**
   - Create custom CloudWatch metrics for non-compliant policies found
   - Track metrics like: total roles scanned, wildcard permissions found, unused roles
   - Enable alerting based on compliance thresholds

8. **Resource Tagging**
   - Tag all analyzed IAM resources with compliance status
   - Use tags: compliant, non-compliant, needs-review
   - Support filtering and reporting based on tags

9. **Dashboard Output**
   - Export a CloudWatch dashboard URL showing compliance metrics
   - Provide summary statistics as stack outputs
   - Make it easy for teams to monitor compliance trends

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **IAM** for role and policy scanning
- Use **S3** for storing compliance reports
- Use **CloudWatch** for metrics and dashboards
- Use **Lambda** (optional) for running scheduled scans
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: resource-type-environmentSuffix
- Deploy to **us-east-1** region

### Constraints

- Do not modify or delete existing IAM roles during analysis
- All resources must be destroyable (no Retain policies)
- Use read-only IAM permissions for scanning (no writes to IAM)
- Handle large numbers of roles efficiently (pagination)
- Include proper error handling for API rate limits
- Reports must be stored securely in S3 with encryption
- Lambda functions (if used) should have minimal execution time

### Deployment Requirements (CRITICAL)

- All resource names MUST include the environmentSuffix parameter for uniqueness
- Use string suffix parameter that can be passed at deployment time
- Example naming: iam-compliance-bucket-${environmentSuffix}, iam-scanner-lambda-${environmentSuffix}
- All resources MUST be fully destroyable (RemovalPolicy: DESTROY or equivalent)
- FORBIDDEN: Using Retain, Snapshot, or any policy preventing clean deletion
- Lambda functions should use Node.js 18.x or later (note: AWS SDK v3 required for Node.js 18+)

## Success Criteria

- Functionality: Successfully scans all IAM roles and policies in the account
- Performance: Completes full account scan within reasonable time (under 5 minutes for typical accounts)
- Reliability: Handles API throttling and pagination correctly
- Security: Uses minimal required permissions, encrypts reports at rest
- Resource Naming: All resources include environmentSuffix in their names
- Code Quality: TypeScript code with proper types, well-tested, documented
- Compliance: Accurately identifies security issues with low false positive rate

## What to deliver

- Complete Pulumi TypeScript implementation
- IAM roles and policies for the scanner service
- S3 bucket for storing compliance reports
- CloudWatch metrics and dashboard configuration
- Lambda functions (if using scheduled scanning approach)
- Unit tests for all compliance check logic
- Integration tests that verify scanning works correctly
- Documentation on how to deploy and use the analyzer
- README with instructions for interpreting compliance reports

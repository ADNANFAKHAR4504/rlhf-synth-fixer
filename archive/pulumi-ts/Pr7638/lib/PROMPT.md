# Infrastructure Compliance Analysis System

Hey team,

We need to build an automated compliance analysis system that continuously monitors our AWS infrastructure for security violations and configuration issues. The business wants a solution that can scan our entire AWS environment, identify compliance problems, and alert us when critical issues are found.

This needs to be built as a serverless system that can run on-demand or on a schedule, generate detailed compliance reports, and store them for audit purposes. The compliance team has been manually checking these things, and it's time-consuming and error-prone.

## What we need to build

Create an infrastructure compliance analysis system using **Pulumi with TypeScript** that automatically scans AWS resources and generates compliance reports.

### Core Requirements

1. **IAM Security Analysis**
   - Scan all IAM users and identify those without MFA enabled
   - Identify IAM roles with wildcard (*) permissions in their policies
   - Flag overly permissive access patterns

2. **S3 Bucket Compliance**
   - Check all S3 buckets for public access configurations
   - Verify that all buckets have encryption enabled
   - Identify buckets missing proper security controls

3. **EC2 Resource Tagging**
   - Verify all EC2 instances have required tags: Environment, Owner, CostCenter
   - Flag instances with missing or incomplete tagging
   - Generate tagging compliance reports

4. **Security Group Analysis**
   - Analyze security groups for overly permissive rules
   - Identify rules allowing unrestricted access from 0.0.0.0/0
   - Flag security groups with risky configurations

5. **CloudWatch Log Retention**
   - Check all CloudWatch log groups for retention periods
   - Identify log groups with retention less than 90 days
   - Ensure compliance with log retention policies

6. **Compliance Reporting**
   - Generate JSON reports categorizing findings by severity (critical, high, medium)
   - Export reports to S3 bucket with timestamp in filename
   - Include detailed finding descriptions and remediation guidance

7. **Alerting and Notifications**
   - Send SNS notifications when critical findings are detected
   - Include summary of critical issues in notifications
   - Track notification delivery status

8. **Execution Metrics**
   - Track analysis execution metrics in CloudWatch
   - Monitor scan duration, resources analyzed, findings count
   - Create dashboards for compliance tracking

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **Lambda** functions for executing compliance scans
- Use **S3** for storing compliance reports
- Use **SNS** for sending notifications
- Use **CloudWatch** for metrics and logging
- Use **IAM** roles with least privilege for Lambda execution
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-{environmentSuffix}`
- Deploy to **us-east-1** region
- Lambda functions should use Node.js 18.x or later runtime
- For Node.js 18+, use AWS SDK v3 (no need to bundle aws-sdk)

### Deployment Requirements (CRITICAL)

**Resource Naming**:
- ALL resources MUST include environmentSuffix parameter
- Format: `{resource-name}-{environmentSuffix}`
- Example: `compliance-scanner-lambda-dev123`

**Destroyability**:
- NO RemovalPolicy.RETAIN on any resources
- NO deletionProtection enabled
- All resources must be fully destroyable for testing
- S3 buckets must allow deletion (autoDeleteObjects or similar)

**Lambda Runtime Considerations**:
- Node.js 18+ does not include AWS SDK by default
- Use AWS SDK v3 in Lambda code
- Import only required SDK clients to minimize bundle size
- Example: `import { IAMClient, ListUsersCommand } from "@aws-sdk/client-iam"`

### Constraints

- Minimize costs by using serverless architecture
- Lambda functions should be efficient and complete within 15 minutes
- Reports should be human-readable JSON format
- All sensitive data must be handled securely
- Follow AWS security best practices
- Include proper error handling for API rate limits
- All resources must be destroyable (no Retain policies)
- Include comprehensive logging for troubleshooting

## Success Criteria

- **Functionality**: Lambda functions successfully scan all resource types
- **Reporting**: Compliance reports are generated with accurate findings
- **Alerting**: SNS notifications sent for critical findings
- **Performance**: Analysis completes within reasonable time (under 10 minutes)
- **Reliability**: System handles API errors and rate limits gracefully
- **Security**: Lambda execution roles follow least privilege principle
- **Resource Naming**: All resources include environmentSuffix
- **Code Quality**: TypeScript, well-tested, documented

## What to deliver

- Complete Pulumi TypeScript implementation
- Lambda function code for compliance analysis
- IAM roles and policies for Lambda execution
- S3 bucket for storing reports
- SNS topic for notifications
- CloudWatch log groups and metrics
- Unit tests for all components
- Documentation and deployment instructions

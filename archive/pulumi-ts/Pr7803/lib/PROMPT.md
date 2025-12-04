# AWS Infrastructure Compliance Analyzer

Hey team,

We need to build an infrastructure compliance scanning system for our AWS accounts. The business is concerned about security and compliance issues like untagged resources, public S3 buckets, overly permissive IAM roles, and unencrypted volumes. They want an automated solution that can scan our existing infrastructure, identify problems, and notify us when critical issues are found.

I've been asked to create this in TypeScript using Pulumi. The system should scan all our AWS resources, check them against compliance rules, generate detailed reports, and alert us to critical violations. This will help us maintain security best practices and catch configuration drift before it becomes a problem.

## What we need to build

Create an infrastructure compliance analysis system using **Pulumi with TypeScript** that scans existing AWS resources and generates compliance reports.

### Core Requirements

1. **EC2 Instance Tag Compliance**
   - Scan all EC2 instances in the account
   - Identify instances missing required tags: Environment, Owner, CostCenter
   - Report non-compliant instances with details

2. **S3 Bucket Public Access Check**
   - Check all S3 buckets for public access settings
   - Identify buckets with public read or write permissions
   - Flag these as critical violations

3. **IAM Role Permissions Analysis**
   - Analyze all IAM roles in the account
   - Identify roles with overly permissive policies
   - Flag policies containing '*' in actions or resources

4. **EC2 CloudWatch Monitoring Verification**
   - Check all EC2 instances for CloudWatch monitoring status
   - Identify instances without detailed monitoring enabled
   - Report monitoring gaps

5. **EBS Volume Encryption Check**
   - Scan all EBS volumes attached to EC2 instances
   - Identify unencrypted volumes
   - Flag as critical violations

6. **Compliance Report Generation**
   - Generate comprehensive JSON report
   - List all non-compliant resources
   - Include violation type, resource ID, and severity
   - Add timestamp and scan metadata

7. **CloudWatch Custom Metrics**
   - Create custom CloudWatch metrics for each violation type
   - Track: untagged instances, public buckets, permissive roles, unencrypted volumes, unmonitored instances
   - Enable trending and alerting on compliance metrics

8. **S3 Report Export**
   - Create S3 bucket to store compliance reports
   - Export JSON reports with timestamp in filename
   - Enable versioning and encryption

9. **Critical Violation Notifications**
   - Create SNS topic for critical alerts
   - Send notifications when critical violations found
   - Include: public S3 buckets and unencrypted EBS volumes
   - Provide actionable details in notification

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **Lambda** with Node.js runtime for scanning logic
- Use **S3** for report storage with encryption enabled
- Use **SNS** for critical violation notifications
- Use **CloudWatch** for custom metrics and logs
- Use **IAM** for least-privilege scanning role
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `compliance-{resource-type}-${environmentSuffix}`
- Deploy to **us-east-1** region
- Use AWS SDK v3 for all AWS service interactions

### Deployment Requirements (CRITICAL)

- All resources must be destroyable (no Retain policies)
- Use **RemovalPolicy.DESTROY** or equivalent for all resources
- Resources MUST include environmentSuffix in naming
- Lambda function must handle missing or incomplete data gracefully
- Include proper error handling and logging throughout
- SNS topic must use KMS encryption for security
- S3 bucket must use server-side encryption

### Constraints

- Use IAM least privilege for Lambda execution role
- Enable CloudWatch Logs for Lambda function audit trail
- Tag all created resources with Environment, Purpose, Team
- Lambda timeout: 5 minutes (enough for scanning)
- Lambda memory: 512 MB minimum
- S3 bucket must block public access
- Follow AWS Well-Architected Framework security pillar
- Handle AWS API rate limits gracefully

## Success Criteria

- **Functionality**: Successfully scans EC2, S3, IAM, EBS resources
- **Accuracy**: Correctly identifies all violation types
- **Performance**: Completes scan within 5 minutes for typical account
- **Reliability**: Handles errors without crashing, logs all issues
- **Security**: Uses least-privilege IAM, encrypts data at rest and in transit
- **Resource Naming**: All resources include environmentSuffix
- **Notifications**: Sends SNS alerts for critical violations only
- **Reporting**: Generates well-structured JSON reports in S3
- **Metrics**: Publishes CloudWatch metrics for all violation types
- **Code Quality**: TypeScript, well-tested, documented

## What to deliver

- Complete Pulumi TypeScript implementation in lib/tap-stack.ts
- Lambda function code for compliance scanning (lib/lambda/compliance-scanner/)
- IAM roles with least-privilege policies for Lambda
- S3 bucket for report storage with encryption
- SNS topic for critical violation alerts
- CloudWatch custom metrics configuration
- Proper error handling and logging
- README with deployment and usage instructions
- Package.json with all required dependencies

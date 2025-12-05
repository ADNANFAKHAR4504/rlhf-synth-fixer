# AWS Config Compliance Monitoring Infrastructure

Hey team,

We need to build a comprehensive compliance monitoring solution using AWS Config. The business is looking to establish continuous monitoring of our cloud resources to ensure they meet security and compliance standards. I've been asked to create this infrastructure in TypeScript using Pulumi. The system needs to track configuration changes across our EC2, RDS, and S3 resources, enforce compliance rules, and send notifications when resources drift from our compliance policies.

Right now, we don't have visibility into whether our resources are following encryption standards or if they have proper tagging. The compliance team needs automated checks that run continuously rather than manual audits. We also need historical tracking of configuration changes for audit purposes, with snapshots stored securely in S3.

The solution should include both AWS managed rules for common compliance checks like encryption enforcement and a custom rule that validates our internal tagging standards. Every resource needs to be tagged with Environment, Owner, and CostCenter for proper cost allocation and accountability.

## What we need to build

Create a compliance monitoring system using **Pulumi with TypeScript** for AWS Config-based resource tracking and compliance validation.

### Core Requirements

1. **Configuration Recording**
   - Set up AWS Config recorder to track configuration changes
   - Monitor EC2 instances, RDS databases, and S3 buckets
   - Store configuration history in S3 bucket with encryption
   - Configure delivery channel for 24-hour snapshot intervals

2. **Managed Compliance Rules**
   - Deploy encrypted-volumes rule to verify EC2 encryption
   - Deploy rds-encryption-enabled rule to verify RDS encryption
   - Deploy s3-bucket-ssl-requests-only rule to enforce SSL on S3 buckets

3. **Custom Compliance Rule**
   - Create Lambda function to validate EC2 instance tags
   - Check for required tags: Environment, Owner, CostCenter
   - Implement tag validation logic with CloudWatch Logs
   - Use Node.js 18.x runtime with AWS SDK v3

4. **Compliance Notifications**
   - Set up SNS topic for compliance change notifications
   - Configure topic encryption for secure notifications
   - Send alerts when resources become non-compliant

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use AWS Config for configuration recording and compliance rules
- Use S3 for configuration history storage with encryption
- Use Lambda for custom rule evaluation
- Use SNS for compliance notifications
- Use IAM with least privilege permissions
- Use CloudWatch Logs for Lambda function logging
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: resource-name-environmentSuffix
- Deploy to **us-east-1** region

### Critical AWS Config-Specific Requirements

**IAM Role Policy**: Must use the correct managed policy for AWS Config service role:
- CORRECT: arn:aws:iam::aws:policy/service-role/AWS_ConfigRole
- WRONG: arn:aws:iam::aws:policy/service-role/ConfigRole (missing AWS_ prefix)
- WRONG: arn:aws:iam::aws:policy/AWS_ConfigRole (missing service-role/ prefix)

**Lambda Runtime**: Use Node.js 18.x or later with AWS SDK v3 client packages (@aws-sdk/client-config-service, @aws-sdk/client-ec2)

### Deployment Requirements (CRITICAL)

- ALL resources must include **environmentSuffix** variable in their names
- ALL resources must have tags: Department='Compliance', Purpose='Audit'
- NO RemovalPolicy.RETAIN or DeletionPolicy: Retain allowed
- NO deletionProtection flags on any resources
- S3 bucket must be destroyable (configure for auto-delete objects if needed)
- All resources must be cleanable after testing

### Constraints

- Encryption at rest required for S3 bucket (SSE-S3 or SSE-KMS)
- IAM roles must follow least privilege principle
- CloudWatch Logs must be enabled for Lambda function
- SNS topic encryption recommended for secure notifications
- All resources must be destroyable without manual intervention
- Include proper error handling in Lambda function

## Success Criteria

- **Functionality**: AWS Config recorder tracks EC2, RDS, and S3 resources
- **Compliance**: Three managed rules and one custom rule deployed successfully
- **Notifications**: SNS topic receives compliance change events
- **Storage**: Configuration snapshots stored in S3 every 24 hours
- **Custom Validation**: Lambda function correctly validates required tags
- **Security**: All storage encrypted, IAM follows least privilege
- **Resource Naming**: All resources include environmentSuffix for uniqueness
- **Destroyability**: All resources can be destroyed cleanly without errors
- **Code Quality**: TypeScript, well-tested, properly typed, documented

## What to deliver

- Complete Pulumi TypeScript implementation in lib/tap-stack.ts
- Lambda function code in lib/lambda/config-tag-checker.ts
- AWS Config recorder with proper IAM role using AWS_ConfigRole policy
- Delivery channel configured for S3 storage
- Three managed Config rules: encrypted-volumes, rds-encryption-enabled, s3-bucket-ssl-requests-only
- Custom Config rule with Lambda function for tag validation
- S3 bucket for configuration history with encryption enabled
- SNS topic for compliance notifications
- CloudWatch Logs for Lambda function
- Proper IAM roles with least privilege permissions
- All resources tagged with Department='Compliance' and Purpose='Audit'
- Exported outputs: Config recorder name, S3 bucket ARN, SNS topic ARN
- Unit tests for all components
- Documentation and deployment instructions
# S3 Compliance Analysis Tool

Hey team,

We have a financial services client who needs to audit their S3 bucket configurations across multiple departments to ensure compliance with data retention policies and security standards. They currently have 20+ buckets spread across different teams and need an automated solution to analyze existing buckets and generate comprehensive compliance reports.

The challenge is that these buckets are already live and in use, so we cannot just deploy new infrastructure. We need to analyze what exists, check against company compliance policies, and report on any violations. The compliance team needs to know which buckets meet requirements and which ones need remediation.

We need to build a Pulumi TypeScript program that can import existing S3 buckets, validate their configurations, and produce detailed compliance reports. This will help them maintain their security posture and meet regulatory requirements without manual checking.

## What we need to build

Create an infrastructure analysis and compliance checking system using **Pulumi with TypeScript** for existing S3 buckets in an AWS account.

### Core Requirements

1. **S3 Bucket Discovery and Import**
   - Import all existing S3 buckets in the us-east-1 region into Pulumi state
   - Use Pulumi's import functionality to bring buckets under management without modifying them
   - Handle pagination for accounts with 100+ buckets
   - Tag non-compliant buckets with 'compliance-status: failed'

2. **Compliance Policy Validation**
   - Check if each bucket has versioning enabled
   - Verify server-side encryption is configured (AES256 or AWS KMS)
   - Ensure lifecycle policies exist for objects older than 90 days
   - Validate bucket policies don't allow public access
   - Check for CloudWatch metrics configuration on each bucket

3. **Monitoring and Alerting**
   - Create CloudWatch alarms for buckets missing required configurations
   - Integrate Step Functions for workflow orchestration and scalability
   - Use Lambda functions for compliance checking logic
   - Implement SQS for message queuing of compliance check results
   - Configure SNS for compliance violation notifications

4. **Reporting and Output**
   - Generate compliance report as stack outputs showing non-compliant buckets
   - Export findings to a JSON file in the local directory
   - Display summary: total buckets analyzed, compliant buckets count
   - Provide detailed list of non-compliant buckets with specific violations

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **S3** for bucket analysis and compliance checking
- Use **CloudWatch** for metrics and alarms
- Use **Step Functions** for enhanced functionality and scalability
- Use **Lambda** for enhanced functionality and scalability
- Use **SQS** for enhanced functionality and scalability
- Use **SNS** for enhanced functionality and scalability
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-${environmentSuffix}`
- Deploy to **us-east-1** region
- Implement type-safe interfaces for compliance rules and violation reports
- Use async/await patterns for all AWS SDK calls
- Generate stack outputs dynamically based on analysis results

### Constraints

- Use Pulumi's import functionality to bring existing buckets into state without modifying them
- Implement retry logic for transient AWS API errors
- Create CloudWatch alarms only for high-severity violations
- Use Pulumi configuration to define compliance thresholds
- Ensure the program is idempotent and can be run multiple times safely
- Handle pagination when listing buckets to support accounts with 100+ buckets
- Use Pulumi's FileAsset to write the JSON report without external dependencies
- All resources must be destroyable (no Retain policies)
- Include proper error handling and logging
- No VPC required - this is an analysis task focusing on S3 service configurations

### Deployment Requirements (CRITICAL)

**environmentSuffix Requirement**:
- ALL resource names must include environmentSuffix parameter
- Pattern: `{resource-name}-${environmentSuffix}`
- Example: `compliance-checker-lambda-${environmentSuffix}`
- This enables parallel deployments without resource conflicts

**Destroyability Requirement**:
- All resources must use RemovalPolicy.DESTROY or equivalent
- FORBIDDEN: RemovalPolicy.RETAIN, DeletionPolicy: Retain
- All resources must be cleanable after testing

**Service-Specific Warnings**:
- Lambda Node.js 18+: AWS SDK v2 not available, use SDK v3 (@aws-sdk/client-*) or extract from event
- Step Functions: Ensure proper IAM permissions for state machine execution
- CloudWatch Alarms: Use appropriate threshold values for compliance violations

## Success Criteria

- **Functionality**: Successfully import and analyze all S3 buckets in the region
- **Performance**: Handle 100+ buckets with proper pagination and retry logic
- **Reliability**: Idempotent execution - can run multiple times safely
- **Security**: Least privilege IAM permissions for all resources
- **Resource Naming**: All resources include environmentSuffix
- **Code Quality**: TypeScript with proper type definitions, well-tested, documented
- **Compliance Detection**: Accurately identify all 5 compliance requirements (versioning, encryption, lifecycle, public access, CloudWatch)
- **Reporting**: Clear JSON output with bucket names, ARNs, and specific violations

## What to deliver

- Complete Pulumi TypeScript implementation
- S3 bucket discovery and import logic
- Lambda functions for compliance checking
- Step Functions workflow for orchestration
- SQS queue for result processing
- SNS topic for notifications
- CloudWatch alarms for violations
- Unit tests for all components
- Documentation and deployment instructions
- JSON compliance report generation

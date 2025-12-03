# AWS Resource Tagging Compliance Audit

Hey team,

We need to build a comprehensive tagging compliance audit system that can scan our AWS infrastructure and validate whether resources meet our organizational tagging standards. The business is concerned about cost allocation visibility and compliance tracking across our cloud resources. I've been asked to create this using **Pulumi with TypeScript** to leverage our existing infrastructure-as-code patterns.

Our organization has established mandatory tagging requirements, but enforcement has been inconsistent. Resources are being created without proper tags, making it difficult to track costs by department, identify resource owners, and maintain compliance with our governance policies. We need automated visibility into which resources are compliant and which need remediation.

The audit system needs to scan existing AWS resources across multiple service types, validate tag presence, and generate actionable reports. The business wants to see compliance trends over time through CloudWatch metrics, and they want this audit to run automatically on a weekly schedule.

## What we need to build

Create an infrastructure analysis and monitoring system using **Pulumi with TypeScript** for AWS resource tagging compliance.

### Core Requirements

1. **Resource Discovery and Validation**
   - Query all EC2 instances in the current region
   - Query all RDS databases in the current region
   - Query all S3 buckets (global service, filtered by region where applicable)
   - Check each resource for required tags: 'Environment', 'CostCenter', 'Owner', and 'Project'
   - Identify which specific tags are missing from each non-compliant resource

2. **Compliance Reporting**
   - Generate a compliance report showing which resources are missing required tags
   - Calculate the percentage of compliant vs non-compliant resources by service type
   - Export a JSON report with resource IDs, missing tags, and compliance status
   - Provide human-readable summary output

3. **Automated Audit Execution**
   - Create a Lambda function that runs the tagging audit logic
   - Set up EventBridge (CloudWatch Events) rule to trigger the audit weekly
   - Store generated compliance reports in S3 with timestamped keys
   - Ensure Lambda has appropriate IAM permissions to read resource tags

4. **Compliance Tracking and Metrics**
   - Create CloudWatch metrics for tracking compliance trends over time
   - Publish custom metrics showing compliance percentage per service type
   - Track total compliant vs non-compliant resource counts
   - Enable metric visualization through CloudWatch dashboards

5. **Intelligent Remediation Suggestions**
   - Implement tag remediation suggestions based on resource naming patterns
   - Parse resource names to infer potential tag values (e.g., "prod-web-server" suggests Environment: prod)
   - Include suggested tag values in the compliance report
   - Provide confidence scores for automated suggestions

6. **Priority Classification**
   - Flag resources older than 90 days without proper tags as high priority
   - Query resource creation timestamps from CloudFormation, CloudTrail, or service-specific APIs
   - Include age-based priority in compliance reports
   - Separate high-priority findings in report summary

7. **Cost Impact Analysis**
   - Generate cost estimates for untagged resources using AWS Pricing API
   - Calculate monthly cost exposure from non-compliant resources
   - Include cost data in compliance reports to highlight financial impact
   - Provide cost breakdown by service type

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **Lambda** for audit execution logic
- Use **EventBridge** for weekly scheduling
- Use **S3** for report storage
- Use **CloudWatch** for metrics and monitoring
- Use **IAM** for least-privilege Lambda execution role
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-${environmentSuffix}`
- Deploy to **us-east-1** region
- Use AWS SDK v3 for Lambda function (Node.js 18+)

### Deployment Requirements (CRITICAL)

- **Resource Naming**: ALL resources MUST include environmentSuffix parameter to support parallel deployments
  - S3 buckets: `tagging-audit-reports-${environmentSuffix}`
  - Lambda functions: `tagging-audit-${environmentSuffix}`
  - IAM roles: `tagging-audit-role-${environmentSuffix}`
  - CloudWatch log groups: `/aws/lambda/tagging-audit-${environmentSuffix}`

- **Destroyability**: All resources must be fully destroyable without manual intervention
  - S3 buckets: `forceDestroy: true` (Pulumi property)
  - CloudWatch log groups: `removalPolicy: RemovalPolicy.DESTROY`
  - Lambda functions: No retention policies
  - IAM roles: No dependencies blocking deletion

- **Lambda Runtime Compatibility**:
  - Use Node.js 18.x or 20.x runtime
  - Lambda code must use AWS SDK v3 (`@aws-sdk/client-*` packages)
  - Do NOT use AWS SDK v2 (`aws-sdk` package) - not available in Node.js 18+
  - Bundle SDK dependencies in Lambda deployment package if needed

### Constraints

- Must scan resources across EC2, RDS, and S3 services
- Required tags are fixed: Environment, CostCenter, Owner, Project
- Audit must run automatically on weekly schedule
- Reports must be stored persistently in S3
- CloudWatch metrics must track compliance trends
- Cost estimates should be reasonable approximations
- Lambda function must complete within 15-minute timeout
- All resources must be destroyable (no Retain policies)
- Include proper error handling and logging

## Success Criteria

- **Functionality**: Lambda function successfully scans EC2, RDS, and S3 resources for tag compliance
- **Reporting**: JSON reports generated with resource IDs, missing tags, compliance percentages, and cost estimates
- **Automation**: Weekly EventBridge rule triggers audit without manual intervention
- **Metrics**: CloudWatch metrics published showing compliance trends by service type
- **Remediation**: Intelligent tag suggestions provided based on resource naming patterns
- **Priority**: Resources older than 90 days flagged appropriately in reports
- **Cost Analysis**: AWS Pricing API integration provides monthly cost estimates for non-compliant resources
- **Resource Naming**: All resources include environmentSuffix for deployment uniqueness
- **Code Quality**: TypeScript with type safety, well-tested, documented
- **Destroyability**: Clean deployment and teardown without manual cleanup

## What to deliver

- Complete Pulumi TypeScript implementation with proper project structure
- Lambda function code implementing tagging audit logic
- IAM roles and policies with least-privilege permissions
- EventBridge rule for weekly scheduling
- S3 bucket for report storage
- CloudWatch metric creation and publishing
- Integration with AWS Pricing API for cost estimates
- Resource age checking logic for priority classification
- Tag suggestion algorithm based on naming patterns
- Unit tests for all components
- Integration tests verifying audit execution
- Documentation and deployment instructions

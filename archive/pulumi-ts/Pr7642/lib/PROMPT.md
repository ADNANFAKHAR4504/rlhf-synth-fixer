# EC2 Compliance Monitoring System

Hey team,

We need to build a compliance monitoring system for our EC2 infrastructure. The business is concerned about instances running without proper tagging, and they want automated detection and remediation. I've been asked to create this using TypeScript with Pulumi. The system needs to monitor EC2 instances and VPC configurations, detect compliance violations, and automatically fix tagging issues.

The compliance team has been manually checking tags every week, which is time-consuming and error-prone. We're missing instances that don't have Environment, Owner, or CostCenter tags, which makes cost allocation and resource tracking really difficult. We need an automated solution that continuously monitors our infrastructure and alerts us (or better yet, fixes issues automatically) when compliance problems are detected.

This monitoring system will help us maintain better governance over our cloud resources and ensure we can properly track costs and ownership across teams.

## What we need to build

Create an infrastructure compliance monitoring system using **Pulumi with TypeScript** for automated EC2 and VPC compliance validation.

### Core Requirements

1. **Network Infrastructure**
   - VPC with public and private subnets across 2 availability zones
   - Internet gateway for public subnet connectivity
   - NAT gateways or NAT instances for private subnet outbound traffic
   - Proper routing tables for subnet configuration

2. **EC2 Instance Deployment**
   - Launch EC2 instances in private subnets
   - Instances must have three required tags: Environment, Owner, CostCenter
   - Use appropriate instance types (t3.micro or t3.small for cost efficiency)
   - Proper security groups restricting access

3. **Compliance Monitoring**
   - CloudWatch custom metrics tracking instance compliance status
   - Metrics should show number of compliant vs non-compliant instances
   - Systems Manager integration to collect inventory data from EC2 instances
   - CloudWatch alarms triggering when instances are missing required tags

4. **Automated Remediation**
   - Lambda function automatically adding missing tags to non-compliant instances
   - Function triggered by CloudWatch Events or EventBridge
   - Default tag values applied when tags are missing
   - Logging of all remediation actions

5. **Reporting and Visualization**
   - Systems Manager Parameter Store for storing compliance reports
   - CloudWatch Dashboard displaying compliance percentage across all resources
   - Dashboard showing trends over time and breakdown by tag category
   - Real-time updates when compliance status changes

6. **Stack Outputs**
   - Export compliance metrics for integration with external monitoring systems
   - Output VPC ID, subnet IDs, and instance IDs
   - Export Lambda function ARN and CloudWatch dashboard URL

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **VPC** for network isolation with multi-AZ deployment
- Use **EC2** for compute instances in private subnets
- Use **CloudWatch Metrics** for custom compliance tracking metrics
- Use **Systems Manager** to collect instance inventory and metadata
- Use **CloudWatch Alarms** to detect and alert on compliance violations
- Use **Systems Manager Parameter Store** to persist compliance reports
- Use **Lambda** for automated tag remediation
- Use **CloudWatch Dashboard** for visualization of compliance status
- Resource names must include **environmentSuffix** for uniqueness across deployments
- Follow naming convention: resource-type-environmentSuffix
- Deploy to **us-east-1** region
- Lambda runtime should be Python 3.11 or later for boto3 compatibility
- All Lambda functions must have CloudWatch Logs integration

### Constraints

- All resources must be encrypted at rest using AWS KMS where applicable
- All data in transit must use TLS/SSL encryption
- IAM roles must follow principle of least privilege with specific permissions
- CloudWatch logging must be enabled for all Lambda functions and flow logs for VPC
- All resources must include proper tags for cost allocation
- All resources must be destroyable without retention policies
- No RemovalPolicy.RETAIN or DeletionPolicy: Retain allowed
- No deletionProtection: true on any resources
- Prefer serverless services to minimize costs (Lambda over EC2 for automation)
- Use AWS managed policies where appropriate, custom policies where needed

## Success Criteria

- **Functionality**: System successfully detects EC2 instances with missing tags and sends CloudWatch alarms
- **Automation**: Lambda function automatically remediates tagging violations within 5 minutes of detection
- **Visibility**: CloudWatch Dashboard displays real-time compliance percentage for all monitored resources
- **Reliability**: Systems Manager successfully collects inventory from all EC2 instances
- **Security**: All IAM roles use least privilege, encryption enabled, logging configured
- **Resource Naming**: All resources include environmentSuffix parameter in their names
- **Code Quality**: Clean TypeScript code, well-structured, includes unit tests, comprehensive documentation

## Deployment Requirements (CRITICAL)

- **environmentSuffix Requirement**: Every named AWS resource (Lambda functions, S3 buckets, DynamoDB tables, IAM roles, CloudWatch log groups, etc.) MUST include the environmentSuffix string in its name to ensure uniqueness across multiple deployments
- **Destroyability Requirement**: All resources must be fully destroyable. Absolutely NO RemovalPolicy.RETAIN, NO DeletionPolicy: Retain, NO deletionProtection: true, NO skip_final_snapshot: false. This is critical for cleanup and testing
- **Service-Specific Notes**:
  - Lambda functions on Node.js 18+: AWS SDK v3 is included by default, do not bundle aws-sdk in deployment packages
  - VPC: Consider cost of NAT Gateways; evaluate NAT instances for dev environments if cost is a concern
  - CloudWatch: Enable detailed monitoring but be mindful of metric costs

## What to deliver

- Complete Pulumi TypeScript implementation in lib/ directory
- VPC with multi-AZ public and private subnets
- EC2 instances with proper tagging requirements and security groups
- CloudWatch custom metrics and alarms for compliance monitoring
- Systems Manager integration for inventory collection
- Lambda function for automated tag remediation with proper IAM roles
- CloudWatch Dashboard for compliance visualization
- Systems Manager Parameter Store integration for compliance reporting
- Unit tests for all Pulumi components
- Integration tests validating the complete workflow
- Documentation including deployment instructions and architecture overview
- Stack outputs for external system integration

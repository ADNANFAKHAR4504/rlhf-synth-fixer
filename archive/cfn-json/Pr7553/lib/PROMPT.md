# Compliance Analysis System for Production Environment

Hey team,

We've been asked to build an automated compliance monitoring system for our production AWS environment in us-east-1. The business needs continuous visibility into infrastructure compliance across our EC2 and RDS fleet. This is critical for our financial applications where compliance violations could mean regulatory issues or security breaches.

The environment is substantial - over 50 EC2 instances across multiple VPCs, RDS Multi-AZ deployments, and Lambda-based microservices. We need automated scanning that works across private subnets behind NAT gateways, with proper audit trails and notifications.

I've been asked to create this using **CloudFormation with JSON** to match our infrastructure-as-code standards. The system needs to run autonomously, scanning every 6 hours, storing results in RDS, and alerting us when problems are found.

## What we need to build

Create an automated compliance analysis system using **CloudFormation with JSON** that continuously monitors infrastructure for security violations and compliance issues.

### Core Requirements

1. **Compliance Scanning Lambda Functions**
   - Scan existing EC2 instances for unencrypted EBS volumes
   - Scan security group rules for non-compliant configurations
   - Python 3.11 runtime
   - 3GB memory allocation
   - 15-minute timeout for thorough scanning

2. **RDS MySQL Database for Results**
   - Store compliance scan results with full audit history
   - db.t3.medium instance type
   - 100GB encrypted storage
   - Automated backups enabled
   - DeletionPolicy: Retain to preserve compliance history

3. **Automated Scheduling**
   - CloudWatch Events to trigger scans every 6 hours
   - Ensure consistent monitoring coverage

4. **SNS Notification System**
   - Generate notifications when non-compliant resources detected
   - Email subscription endpoint pre-configured
   - Include resource details and violation type

5. **IAM Security**
   - Read-only permissions to analyze resources across the account
   - Follow least privilege principle
   - NO wildcard actions allowed
   - Separate roles for each Lambda function

6. **CloudWatch Monitoring Dashboard**
   - Custom metrics for compliance status
   - Output dashboard URL for team access
   - Track scan success rates and violation counts

7. **Resource Tagging**
   - Tag all resources with CostCenter, Environment, ComplianceLevel
   - Enable cost tracking and compliance categorization

8. **Custom Resource Validation**
   - Custom resource to validate at least 10 compliance rules
   - Verify rule configuration during stack deployment

9. **Stack Protection**
   - Implement stack policies to prevent accidental deletion of analysis resources
   - Protect critical compliance infrastructure

### Technical Requirements

- All infrastructure defined using **CloudFormation with JSON**
- Use **Lambda** for compliance scanning functions
- Use **RDS MySQL** for storing scan results
- Use **CloudWatch Events** for scheduled triggers
- Use **CloudWatch Logs** with 30-day retention for audit trails
- Use **SNS** for notification delivery
- Use **IAM** for service roles and policies
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-${EnvironmentSuffix}`
- Deploy to **us-east-1** region

### Deployment Requirements (CRITICAL)

- All resources must include environmentSuffix in names for CI/CD compatibility
- All resources must be destroyable EXCEPT RDS instance (which has Retain policy as required)
- No RemovalPolicy: Retain on any resource except the RDS instance
- Lambda functions must handle Node.js 18+ compatibility (if using AWS SDK, use SDK v3 or extract from event)
- All IAM policies must be specific - no wildcard actions allowed
- CloudWatch Logs must have explicit retention period (30 days)

### Constraints

- Lambda functions must have exactly 3GB memory and 15-minute timeout
- RDS instance must be db.t3.medium with 100GB encrypted storage
- IAM policies must follow least privilege - no wildcard actions allowed
- CloudWatch Logs retention must be 30 days for audit compliance
- SNS topic must have email subscription endpoint configured
- Stack must include DeletionPolicy: Retain ONLY for RDS instance
- Custom resource must validate minimum 10 compliance rules
- All resources except RDS must be destroyable (no Retain policies)
- Include proper error handling and logging in Lambda functions
- Private subnet resources must be accessible (consider VPC endpoints or NAT)

## Success Criteria

- Functionality: System autonomously scans EC2 and security groups every 6 hours, stores results in RDS, sends SNS notifications for violations
- Performance: Lambda functions complete scans within 15-minute timeout, RDS handles concurrent writes from multiple scan functions
- Reliability: Automated backups enabled, proper error handling, CloudWatch monitoring for scan failures
- Security: Read-only IAM permissions, encrypted RDS storage, least privilege policies, audit trail in CloudWatch Logs
- Resource Naming: All resources include environmentSuffix parameter for unique naming
- Code Quality: Production-ready JSON CloudFormation template, well-documented, follows AWS best practices
- Stack Protection: Stack policies prevent accidental deletion of compliance infrastructure
- Compliance Validation: Custom resource validates 10+ compliance rules during deployment

## What to deliver

- Complete CloudFormation JSON template implementing the compliance analysis system
- Lambda functions for EC2 EBS volume scanning
- Lambda functions for security group rule scanning
- RDS MySQL database with proper configuration and backup policies
- CloudWatch Events scheduled rules triggering scans every 6 hours
- SNS topic with email subscription for compliance notifications
- IAM roles and policies with least privilege permissions
- CloudWatch Logs groups with 30-day retention
- Custom resource for compliance rule validation
- Stack policies to protect critical resources
- CloudWatch dashboard with custom metrics
- Resource tagging for cost tracking and compliance categorization
- Unit tests for all components
- Documentation and deployment instructions

Hey team,

We need to set up AWS Config for infrastructure compliance monitoring across our AWS environment. The business has been asking for better visibility into our infrastructure configuration and wants to ensure we're meeting compliance standards. This is part of our broader security and governance initiative to maintain proper oversight of our cloud resources

The compliance team needs a way to continuously monitor our infrastructure against established policies and get alerts when resources drift from our standards. Right now we don't have good visibility into configuration changes or compliance posture, and that's creating risk for the organization. We need to implement AWS Config to track resource configurations, evaluate compliance rules, and notify the team when issues are detected.

## What we need to build

Create an infrastructure compliance monitoring system using **CloudFormation with YAML** that implements AWS Config for continuous monitoring of our AWS resources.

### Core Requirements

1. **Configuration Recording**
   - Enable AWS Config to record all supported resource types
   - Store configuration snapshots and history in S3
   - Set up the configuration recorder with proper IAM permissions
   - Record both configuration changes and relationships between resources

2. **Compliance Rules**
   - Implement managed Config rules for common compliance checks
   - Include rules for encrypted storage (EBS, S3, RDS)
   - Add rules for proper IAM configurations
   - Monitor for public access and security group compliance
   - Check for required tags on resources

3. **Alerting and Notifications**
   - Send notifications when compliance rules are violated
   - Use SNS to deliver alerts to the operations team
   - Include relevant resource details in notifications
   - Enable notifications for configuration changes

4. **Storage and Retention**
   - Create S3 bucket for Config snapshots with proper encryption
   - Implement lifecycle policies for cost optimization
   - Ensure bucket policies prevent unauthorized access
   - Store configuration history for audit purposes

### Technical Requirements

- All infrastructure defined using **CloudFormation with YAML**
- Use **AWS Config** for configuration recording and compliance evaluation
- Use **S3** for storing configuration snapshots and history
- Use **SNS** for compliance violation notifications
- Use **IAM** roles and policies for Config service permissions
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Deploy to **us-east-1** region

### Constraints

- All Config rules must be managed rules (not custom Lambda-based)
- S3 bucket must use server-side encryption
- IAM role must follow least privilege principle
- Config recorder must support all resource types
- All resources must be destroyable (no Retain policies)
- Include proper error handling and logging
- Cost-optimize by using appropriate delivery frequency

## Success Criteria

- Functionality: AWS Config successfully records all resource configurations
- Compliance: Config rules properly evaluate resource compliance
- Notifications: SNS alerts are sent when violations are detected
- Security: All data is encrypted at rest and in transit
- Auditability: Configuration history is retained for compliance reviews
- Resource Naming: All resources include environmentSuffix parameter
- Code Quality: Clean YAML syntax, well-documented, production-ready

## What to deliver

- Complete CloudFormation YAML template implementation
- AWS Config configuration recorder and delivery channel
- S3 bucket for configuration storage with encryption
- Multiple AWS Config managed rules for compliance
- SNS topic and subscriptions for notifications
- IAM service role with required permissions
- Unit tests for template validation
- Integration tests for deployed resources
- Documentation and deployment instructions

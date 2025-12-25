Hey team,

We're seeing a growing need to ensure our AWS infrastructure consistently meets compliance standards across all our environments. Right now, we're doing manual checks, which is time-consuming and error-prone. I've been asked to build an automated infrastructure compliance validation system that can continuously monitor our resources and alert us when something doesn't meet our standards.

The compliance team has been especially concerned about ensuring we follow AWS best practices, security policies, and internal governance requirements. They want a system that can automatically check our infrastructure configurations, generate reports, and notify the right people when issues are found. This needs to be built using CloudFormation with YAML since that's our standard for infrastructure deployment.

The business needs this to reduce manual audit time, catch compliance violations early, and provide clear audit trails for our security team. We're dealing with regulatory requirements that mandate continuous compliance monitoring, so this system needs to be reliable and comprehensive.

## What we need to build

Create an infrastructure compliance validation system using CloudFormation with YAML that automatically monitors AWS resources for compliance violations.

### Core Requirements

1. Automated Compliance Checking
   - Deploy AWS Config to continuously evaluate resource configurations
   - Implement compliance rules that check against security standards
   - Support both managed AWS Config rules and custom compliance checks
   - Enable automatic remediation where appropriate

2. Monitoring and Alerting
   - Send notifications when compliance violations are detected
   - Integrate with SNS for real-time alerting
   - Provide detailed information about what failed and why
   - Support different notification channels for different severity levels

3. Reporting and Audit Trail
   - Store compliance check results for historical analysis
   - Generate compliance status reports
   - Maintain audit logs of all compliance events
   - Provide visibility into compliance trends over time

4. Security and Access Control
   - Implement least-privilege IAM roles for all components
   - Encrypt sensitive data at rest and in transit
   - Secure all API communications
   - Follow AWS security best practices

### Technical Requirements

- All infrastructure defined using CloudFormation with YAML
- Use AWS Config for continuous compliance evaluation
- Use AWS Config Rules for compliance checks including managed rules and custom rules
- Use Lambda for custom compliance validation logic where needed
- Use SNS for notifications and alerting
- Use S3 for storing compliance reports and Config data
- Use CloudWatch Logs for centralized logging
- Use IAM roles with least-privilege permissions
- Resource names must include environmentSuffix parameter for uniqueness
- Follow naming convention: resource-type with EnvironmentSuffix appended
- Deploy to us-east-1 region

### Constraints

- All data must be encrypted at rest using AWS KMS
- All resources must be destroyable without Retain deletion policies
- IAM roles must follow least-privilege principle
- No hardcoded credentials or sensitive data
- All Config rules must have appropriate evaluation frequency
- System must be cost-effective and prefer serverless components
- Include proper error handling and logging for all Lambda functions
- CloudWatch alarms for system health monitoring

## Success Criteria

- Functionality: System automatically detects and reports compliance violations
- Performance: Compliance checks execute within acceptable timeframes
- Reliability: System operates continuously without manual intervention
- Security: All components follow AWS security best practices with encryption and least privilege
- Resource Naming: All resources include environmentSuffix parameter
- Observability: Comprehensive logging and monitoring with CloudWatch
- Cost: Optimized for serverless and pay-per-use services
- Code Quality: Well-structured YAML, comprehensive tests, clear documentation

## What to deliver

- Complete CloudFormation YAML template implementing the compliance validation system
- AWS Config with appropriate configuration recorder and delivery channel
- Multiple Config rules for common compliance checks like encryption, public access, and tagging
- Lambda functions for custom compliance validation logic
- SNS topics and subscriptions for notifications
- S3 bucket for Config data storage with proper lifecycle policies
- IAM roles with least-privilege permissions for all services
- CloudWatch Logs groups for centralized logging
- CloudWatch alarms for system monitoring
- Unit tests validating template structure and resource properties
- Integration tests ensuring Config rules and Lambda functions work correctly
- Documentation explaining the architecture and how to extend with new rules

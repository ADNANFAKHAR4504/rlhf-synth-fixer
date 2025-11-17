# Infrastructure Compliance Analysis System

Hey team,

We need to build a comprehensive compliance monitoring system for our financial services company. The security team is drowning in manual audits across our 50+ CloudFormation stacks spanning multiple regions, and we need an automated solution that can catch policy violations before they become problems. I've been asked to create this using **CloudFormation with YAML**.

The business wants a system that continuously monitors our infrastructure, generates detailed compliance reports, and alerts the security team when critical violations occur. Right now, teams are deploying resources without proper tagging, encryption, or security group configurations, and we have no automated way to track this drift.

This needs to be production-ready and handle the scale of our multi-region deployments across us-east-1, us-west-2, and eu-west-1. The security team needs daily reports showing which stacks are non-compliant, what resources are violating policies, and specific remediation steps to fix the issues.

## What we need to build

Create an infrastructure compliance analysis system using **CloudFormation with YAML** that automatically evaluates CloudFormation stacks for policy violations, generates detailed reports, and alerts on critical compliance issues.

### Core Requirements

1. **Compliance Monitoring**
   - Deploy AWS Config with custom rules to evaluate CloudFormation stack compliance against company policies
   - Implement Config Rules that check for required tags (Environment, Owner, CostCenter, ComplianceLevel)
   - Validate encryption settings on all applicable resources
   - Verify security group configurations meet security standards
   - Config Rules must evaluate stacks every 6 hours using scheduled frequency

2. **Automated Reporting**
   - Create Lambda function to parse Config evaluations and generate detailed compliance reports
   - Generate JSON-formatted compliance reports with stack name, resource violations, and remediation steps
   - Lambda functions must have memory allocation of exactly 256MB
   - Deploy EventBridge rule to trigger compliance checks every 6 hours

3. **Storage and Lifecycle**
   - Set up S3 bucket with versioning and encryption to store compliance reports
   - Compliance reports must be stored in S3 with 90-day retention policy using lifecycle rules
   - All S3 buckets must have versioning enabled and lifecycle policies defined

4. **Alerting System**
   - Configure SNS topic with KMS encryption for alerting on critical compliance violations
   - SNS topics must use KMS encryption with customer-managed keys
   - Alert security team on critical policy violations

5. **Multi-Region Support**
   - Support multi-region deployment with cross-region report aggregation
   - Handle compliance analysis for us-east-1, us-west-2, and eu-west-1
   - Centralize reports from all regions

6. **Monitoring and Visualization**
   - Include CloudWatch dashboard for compliance metrics visualization
   - Track compliance trends over time
   - Display critical violations and remediation status

### Technical Requirements

- All infrastructure defined using **CloudFormation with YAML**
- Use **AWS Config** for continuous compliance monitoring
- Use **Lambda** for custom evaluation logic and report generation
- Use **S3** for centralized report storage with versioning
- Use **SNS** for critical violation alerting
- Use **EventBridge** for scheduled compliance checks
- Use **IAM** for role-based access control
- Use **CloudWatch** for metrics and dashboards
- Use **KMS** for encryption key management
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `resource-type-${environmentSuffix}`
- Deploy to **us-east-1** region (primary)

### Constraints

- Lambda execution roles must follow least-privilege principle with no wildcard permissions
- All resources must have mandatory tags: Environment, Owner, CostCenter, ComplianceLevel
- All resources must be destroyable (no Retain policies unless absolutely necessary)
- Secrets should be fetched from existing AWS Secrets Manager entries, not created by the stack
- Include proper error handling and logging
- VPC endpoints should be used for private access to AWS services where applicable

## Success Criteria

- **Functionality**: System continuously monitors CloudFormation stacks and detects policy violations
- **Reporting**: Generates detailed JSON compliance reports with actionable remediation steps
- **Alerting**: Security team receives timely notifications for critical violations
- **Multi-Region**: Successfully aggregates compliance data from us-east-1, us-west-2, and eu-west-1
- **Performance**: Compliance checks complete within 6-hour window without timeout
- **Security**: All data encrypted at rest and in transit, roles follow least privilege
- **Resource Naming**: All resources include environmentSuffix for multi-environment support
- **Lifecycle**: Reports automatically cleaned up after 90 days
- **Visualization**: CloudWatch dashboard provides clear compliance metrics

## What to deliver

- Complete CloudFormation YAML template implementing the compliance analysis system
- AWS Config configuration with custom rules for tag, encryption, and security group validation
- Lambda function code for parsing Config evaluations and generating reports
- S3 bucket with versioning, encryption, and 90-day lifecycle policy
- SNS topic with KMS encryption for critical alerts
- IAM roles with minimal permissions for Config service and Lambda execution
- EventBridge rule for 6-hour scheduled compliance checks
- CloudWatch dashboard for compliance metrics visualization
- Multi-region support with cross-region report aggregation capability
- Documentation and deployment instructions

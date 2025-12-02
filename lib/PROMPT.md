Hey team,

We need to build an infrastructure compliance monitoring system that automatically checks our EC2 instances for security and policy violations. The business wants continuous oversight of our cloud infrastructure to ensure we're meeting our security standards and compliance requirements. Right now, we're doing manual compliance checks which is time-consuming and error-prone, so we need an automated solution.

The system should run periodic scans of all our EC2 instances, checking for common compliance issues like unencrypted volumes, public IP assignments, and missing required tags. When violations are detected, we need immediate alerts sent to our security team so they can take action quickly.

I've been asked to create this using TypeScript with Pulumi. The infrastructure needs to be fully automated, cost-effective, and easy to maintain.

## What we need to build

Create an infrastructure compliance monitoring system using **Pulumi with TypeScript** that automatically scans EC2 instances and reports compliance violations.

### Core Requirements

1. **Lambda Compliance Scanner**
   - Deploy a Lambda function that analyzes EC2 instances for compliance violations
   - Check for unencrypted EBS volumes
   - Detect instances with public IP addresses assigned
   - Identify instances missing required tags
   - Include complete compliance analysis logic in the Lambda handler

2. **Scheduled Monitoring**
   - Set up CloudWatch Events (EventBridge) to trigger the Lambda function every 6 hours
   - Use schedule expression for automated execution
   - Configure proper IAM permissions for Lambda invocation

3. **Compliance Metrics**
   - Create CloudWatch custom metrics to track compliance scores
   - Organize metrics by instance type dimension
   - Track compliance score as a percentage (0-100)
   - Publish metrics from the Lambda function

4. **Alert Notifications**
   - Configure SNS topic for compliance violation alerts
   - Set up email subscription for the security team
   - Lambda should publish detailed violation messages to SNS topic

5. **Compliance Dashboard**
   - Implement CloudWatch dashboard showing real-time compliance status
   - Display compliance scores grouped by instance type
   - Show violation trends over time
   - Include widgets for key metrics

6. **Threshold Alarms**
   - Create CloudWatch alarms that trigger when compliance scores drop below 80%
   - Monitor the custom compliance metrics
   - Send notifications via SNS when threshold is breached

7. **Configurable Thresholds**
   - Set up Lambda environment variables for easy configuration
   - COMPLIANCE_THRESHOLD: Minimum acceptable compliance score (default: 80)
   - MIN_REQUIRED_TAGS: Number of required tags per instance
   - Other relevant compliance parameters

8. **Stack Outputs**
   - Export CloudWatch dashboard URL
   - Export SNS topic ARN for integration
   - Export Lambda function ARN
   - Export any other relevant identifiers

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **AWS Lambda** for compliance checking logic (Node.js 18.x runtime)
- Use **Amazon EC2** API for instance and volume inspection
- Use **Amazon CloudWatch** for Events, Metrics, Dashboard, and Alarms
- Use **Amazon SNS** for alert notifications
- Use **AWS IAM** for roles and policies following least privilege principle
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: {resource-type}-{purpose}-{environmentSuffix}
- Deploy to **us-east-1** region
- Lambda function needs SDK v3 for Node.js 18+ compatibility

### Security and IAM Requirements

- Lambda execution role needs EC2 read permissions (DescribeInstances, DescribeVolumes)
- Lambda needs CloudWatch PutMetricData permission
- Lambda needs SNS Publish permission
- EventBridge needs Lambda InvokeFunction permission
- Follow least privilege principle for all IAM policies
- No hardcoded credentials or secrets

### Deployment Requirements (CRITICAL)

- All resources must be destroyable (use RETAIN policy FORBIDDEN)
- Use DELETE/DESTROY removal policies for all resources
- No resources should prevent stack destruction
- Ensure Lambda inline code or proper file bundling
- Test email subscription may require manual confirmation

### Constraints

- Lambda function must handle pagination for large EC2 fleets
- Compliance logic should be extensible for future checks
- Metrics should be cost-effective (avoid excessive data points)
- Dashboard should be informative but not cluttered
- All resources must include proper error handling and logging
- Use serverless services to minimize operational costs

## Success Criteria

- Functionality: Lambda successfully scans EC2 instances and identifies all violation types
- Performance: Compliance scan completes within Lambda timeout for typical workloads
- Reliability: Scheduled triggers work consistently every 6 hours
- Security: All IAM roles follow least privilege principle
- Monitoring: Dashboard provides clear visibility into compliance status
- Alerting: SNS notifications sent immediately when violations detected or scores drop
- Resource Naming: All resources include environmentSuffix for environment isolation
- Code Quality: TypeScript, well-structured, documented, and testable

## What to deliver

- Complete Pulumi TypeScript implementation
- Lambda function with comprehensive compliance checking logic
- CloudWatch EventBridge rule with 6-hour schedule
- CloudWatch custom metrics for compliance tracking
- SNS topic with email subscription configuration
- CloudWatch dashboard with relevant widgets
- CloudWatch alarms for compliance threshold monitoring
- Proper IAM roles and policies for all resources
- Unit tests for all components
- Integration tests for the complete system
- Documentation including deployment instructions
- Stack outputs for all key resource identifiers

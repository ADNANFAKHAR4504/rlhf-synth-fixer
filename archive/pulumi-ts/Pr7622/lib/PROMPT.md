Hey team,

We have a financial services company that needs to continuously monitor their AWS infrastructure for security compliance. They want an automated system that checks for configuration violations, sends alerts when issues are found, and maintains audit trails for regulatory requirements. This is a critical security need - they can't afford to have unencrypted S3 buckets or public RDS instances sitting around without immediate detection.

The business wants real-time visibility into their compliance posture across all AWS resources. When something goes out of compliance, the security team needs to know right away through multiple channels. They also need historical tracking to prove to auditors that they've been maintaining proper security controls over time.

I've been asked to build this using **Pulumi with TypeScript**. The system needs to be production-ready with proper monitoring, alerting, and automated remediation capabilities.

## What we need to build

Create a comprehensive infrastructure compliance monitoring system using **Pulumi with TypeScript** that continuously evaluates AWS resources against security policies and provides automated alerting and remediation.

### Core Requirements

1. **AWS Config Rules for Compliance Checking**
   - Deploy AWS Config rule to detect unencrypted S3 buckets
   - Deploy AWS Config rule to identify public RDS instances
   - Configure Config rules to evaluate resources at least every 6 hours
   - Enable Config across all regions with centralized reporting in us-east-1

2. **Lambda Functions for Compliance Analysis**
   - Create Lambda function that analyzes Config rule compliance results daily
   - Lambda must complete execution within 3 minutes
   - Use Node.js 18.x runtime for all Lambda functions
   - Lambda should parse compliance data and calculate metrics

3. **CloudWatch Metrics for Compliance Tracking**
   - Set up custom CloudWatch metrics to track compliance percentage over time
   - Metrics should track compliance by resource type
   - Enable historical data retention for trend analysis

4. **SNS Topics for Multi-Level Alerting**
   - Configure SNS topic for critical compliance violations (immediate action required)
   - Configure SNS topic for warning-level compliance issues
   - SNS topics must support both email and SMS subscription protocols
   - Set up SNS subscriptions to send alerts to security team email addresses

5. **IAM Roles with Least-Privilege Access**
   - Create IAM role for AWS Config with minimum required permissions
   - Use managed policy: arn:aws:iam::aws:policy/service-role/AWS_ConfigRole
   - Create IAM roles for Lambda functions with specific permissions only
   - All roles should follow principle of least privilege

6. **CloudWatch Dashboards for Visibility**
   - Deploy CloudWatch dashboard showing compliance status by resource type
   - Dashboard must auto-refresh every 5 minutes during business hours
   - Include widgets for compliance percentage, violation counts, and trends
   - Visual representation of compliance state across different services

7. **Lambda Functions for Automated Remediation**
   - Create Lambda function to automatically tag non-compliant resources
   - Tag resources with compliance status, detection timestamp, and violation type
   - Enable automated response to Config rule violations

8. **CloudWatch Events for Real-Time Monitoring**
   - Set up EventBridge rules to trigger compliance checks on resource changes
   - React to resource creation, modification, and deletion events
   - Integrate with Lambda for immediate compliance validation

9. **Step Functions for Orchestration**
   - Use Step Functions to coordinate multi-step compliance workflows
   - Handle complex compliance check sequences
   - Provide retry logic and error handling for resilience

10. **SQS for Message Queuing**
    - Implement SQS queues to buffer compliance check requests
    - Decouple event processing from compliance validation
    - Enable reliable message delivery and processing

11. **CloudWatch Logs for Audit Trails**
    - Implement comprehensive CloudWatch Logs for all compliance checks
    - Log all Config rule evaluations with timestamps and results
    - Maintain detailed audit trails for regulatory requirements
    - Set appropriate log retention periods

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Deploy to **us-east-1** region
- Use **AWS Config** for continuous resource evaluation
- Use **Lambda** for compliance analysis and automated remediation (Node.js 18.x runtime)
- Use **CloudWatch** for metrics, dashboards, logs, and alarms
- Use **SNS** for multi-channel alerting (email and SMS)
- Use **Step Functions** for workflow orchestration
- Use **SQS** for message queuing and buffering
- Use **EventBridge** for event-driven compliance checks
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: resource-type-environmentSuffix
- Lambda timeout must not exceed 3 minutes (180 seconds)

### Deployment Requirements (CRITICAL)

- All resources must include **environmentSuffix** in their names for parallel deployment support
- All resources must be destroyable - no RemovalPolicy.RETAIN or deletion_protection settings
- AWS Config: Use the correct IAM managed policy arn:aws:iam::aws:policy/service-role/AWS_ConfigRole
- Lambda Node.js 18.x: Do NOT use require('aws-sdk') - use @aws-sdk/client-* packages or extract data from Lambda event objects
- CloudWatch dashboard refresh: Configure to auto-refresh every 5 minutes
- Config evaluation: Ensure rules evaluate at least every 6 hours

### Constraints

- Lambda functions must complete execution within 3 minutes to avoid timeouts
- All Lambda functions must use Node.js 18.x runtime for consistency
- SNS topics must support both email and SMS subscription protocols
- CloudWatch dashboard must auto-refresh every 5 minutes during business hours
- Config rules must evaluate resources at least every 6 hours
- Monitors resources across all regions with centralized reporting in us-east-1
- All resources must be destroyable (no Retain policies or deletion protection)
- Include proper error handling and logging throughout
- Follow AWS security best practices for IAM permissions

## Success Criteria

- **Functionality**: All Config rules actively monitoring S3 and RDS resources
- **Real-time Detection**: Compliance violations detected within Config evaluation period
- **Automated Response**: Non-compliant resources automatically tagged by Lambda
- **Alerting**: Security team receives SNS notifications for violations via email
- **Visibility**: CloudWatch dashboard displays current compliance status
- **Audit Trail**: All compliance checks logged to CloudWatch Logs with timestamps
- **Orchestration**: Step Functions coordinate complex compliance workflows
- **Reliability**: SQS buffers ensure no compliance events are lost
- **Resource Naming**: All resources include environmentSuffix for parallel deployments
- **Destroyability**: All resources can be cleanly destroyed without manual intervention
- **Code Quality**: TypeScript code is well-structured, tested, and documented

## What to deliver

- Complete Pulumi TypeScript implementation
- AWS Config rules for S3 encryption and RDS public access detection
- Lambda functions for compliance analysis and automated tagging (Node.js 18.x)
- CloudWatch custom metrics for compliance tracking
- SNS topics with email subscriptions for alerting
- CloudWatch dashboard with compliance visualization
- EventBridge rules for event-driven compliance checks
- Step Functions state machine for workflow orchestration
- SQS queues for reliable message processing
- IAM roles with least-privilege permissions
- CloudWatch Logs configuration for audit trails
- Unit tests for all components
- Integration tests validating end-to-end compliance workflow
- Documentation covering deployment and operations

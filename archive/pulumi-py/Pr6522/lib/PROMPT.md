Hey team,

We've been tasked with building out a cross-account observability infrastructure for a fintech startup that needs to monitor their distributed payment processing systems across multiple AWS accounts. They're aiming for 99.9% uptime and need real-time alerting with automated incident response. The business wants everything centralized in their us-east-1 monitoring hub account.

The challenge here is that they have at least 3 member accounts in their AWS Organization, and we need to aggregate metrics from all of them into a single CloudWatch dashboard. When things go wrong, we can't just send an email - we need to automatically create JIRA tickets through a Lambda function so their ops team can respond immediately. This is a hard complexity task because we're dealing with cross-account IAM permissions, multiple AWS services, and strict security requirements.

I've been asked to implement this using **Pulumi with Python**. The infrastructure needs to be production-ready with proper error handling, logging, and most importantly, everything must be destroyable without any Retain policies so we can tear down test environments cleanly.

## What we need to build

Create a comprehensive cross-account observability platform using **Pulumi with Python** that centralizes monitoring for distributed applications across multiple AWS accounts.

### Core Requirements

1. **Cross-Account CloudWatch Dashboard**
   - Aggregate metrics from at least 3 AWS accounts
   - Display centralized view of application health
   - Include custom metrics and application performance data

2. **Automated Incident Response**
   - Deploy Lambda function to handle critical alarms
   - Automatically create JIRA tickets when alarms trigger
   - Lambda must use 128MB memory allocation
   - Include proper error handling and logging

3. **Alert Notification System**
   - Configure SNS topic for alert notifications
   - Enable email subscriptions for team notifications
   - Use AWS managed keys for SNS encryption
   - No custom KMS keys allowed

4. **Application Error Tracking**
   - Set up CloudWatch Logs metric filters
   - Track application errors across all accounts
   - Use exact pattern matching (no wildcards allowed)
   - Configure 30-day retention period for all log groups

5. **Composite Alarms**
   - Create alarms that trigger on multiple conditions
   - Set treat_missing_data to 'breaching' for all alarms
   - Coordinate alerts across different services

6. **Cross-Account IAM Roles**
   - Implement least privilege access for metric collection
   - Follow naming pattern: MonitoringRole-{AccountId}
   - Enable secure cross-account metric aggregation

7. **API Throttling Analysis**
   - Configure CloudWatch Contributor Insights rules
   - Identify and track API throttling patterns
   - Provide visibility into rate limit issues

8. **Audit Trail**
   - Set up EventBridge rule to capture alarm state changes
   - Maintain complete audit history of all alerts
   - Enable compliance and troubleshooting

### Technical Requirements

- All infrastructure defined using **Pulumi with Python**
- Use **CloudWatch** for cross-account observability and dashboards
- Use **Lambda** for automated incident response (128MB memory)
- Use **SNS** for alert notifications with AWS managed key encryption
- Use **CloudWatch Logs** with metric filters and 30-day retention
- Use **IAM** for cross-account roles following MonitoringRole-{AccountId} pattern
- Use **EventBridge** for alarm state change capture
- Use **CloudWatch Contributor Insights** for API throttling analysis
- Use **CloudFormation StackSets** for multi-account deployment
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Deploy to **us-east-1** region

### Optional Enhancements

- AWS X-Ray integration for distributed tracing and service maps
- CloudWatch Synthetics canaries for proactive monitoring
- Systems Manager OpsCenter for centralizing operational issues

### Constraints

- All metric filters MUST use exact pattern matching (no wildcards)
- SNS topics MUST have encryption enabled with AWS managed keys
- Lambda functions MUST have 128MB memory allocation
- CloudWatch dashboard MUST display metrics from at least 3 AWS accounts
- All alarms MUST have treat_missing_data set to 'breaching'
- All log groups MUST have 30-day retention period
- Cross-account role names MUST follow pattern: MonitoringRole-{AccountId}
- All resources must be destroyable (no Retain policies)
- Use CloudFormation StackSets for multi-account deployment
- Requires AWS Organizations with at least 3 member accounts
- CloudFormation StackSets must be enabled in management account
- VPC endpoints for CloudWatch and SNS required in each account
- CloudWatch agent must be installed on EC2 instances in member accounts

## Success Criteria

- Functionality: CloudWatch dashboard aggregates metrics from all member accounts, Lambda creates JIRA tickets on alarm triggers, SNS delivers notifications, metric filters track errors
- Performance: Lambda responds within 3 seconds, dashboard loads in under 2 seconds, alarms trigger within evaluation period
- Reliability: Cross-account roles work consistently, no missed alarms, audit trail captures all state changes
- Security: Least privilege IAM roles, encrypted SNS topics, secure cross-account access
- Resource Naming: All resources include environmentSuffix following pattern resource-type-environment-suffix
- Code Quality: Clean Python code, well-tested, comprehensive documentation

## What to deliver

- Complete Pulumi Python implementation in tap_stack.py
- CloudWatch dashboard configuration with cross-account metrics
- Lambda function code for JIRA ticket creation with error handling
- SNS topic with encryption and email subscriptions
- CloudWatch Logs metric filters with exact pattern matching
- Composite alarms with proper configuration
- Cross-account IAM roles following MonitoringRole-{AccountId} pattern
- CloudWatch Contributor Insights rules for API throttling
- EventBridge rule for alarm state change capture
- CloudFormation StackSets configuration for multi-account deployment
- Unit tests for all components
- Documentation covering deployment and configuration
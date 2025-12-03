# Infrastructure QA and Management - Compliance Monitoring System

## Task: Infrastructure Analysis/Monitoring

Create a Pulumi TypeScript program to deploy an automated infrastructure compliance monitoring system.

## Requirements

The configuration must implement the following:

1. **Lambda Function for Compliance Analysis**
   - Deploy a Lambda function that analyzes AWS resource configurations against predefined compliance rules
   - Function should be capable of scanning various AWS resources

2. **CloudWatch Events Configuration**
   - Set up CloudWatch Events to trigger the Lambda function every 15 minutes
   - Ensure reliable scheduled execution

3. **SNS Topic for Notifications**
   - Create an SNS topic for compliance violation notifications
   - Topic should be accessible for subscription management

4. **CloudWatch Logs Configuration**
   - Configure CloudWatch Logs for Lambda function execution logs
   - Set log retention period to 7 days

5. **CloudWatch Metrics**
   - Implement CloudWatch metrics to track compliance check results
   - Track both passed and failed compliance checks counts

6. **CloudWatch Alarms**
   - Create CloudWatch alarms that trigger when compliance failure rate exceeds 20%
   - Alarms should integrate with SNS for notifications

7. **SNS Email Subscription**
   - Set up an SNS subscription to send email notifications to compliance@company.com
   - Configure for compliance violation alerts

8. **DynamoDB Table**
   - Deploy a DynamoDB table to store compliance check history
   - Configure Time-to-Live (TTL) set to 30 days for automatic data cleanup

9. **IAM Roles and Permissions**
   - Configure IAM roles with least-privilege permissions
   - Lambda must have permissions to read resource configurations
   - Follow AWS security best practices

10. **Resource Tagging**
    - Tag all resources with:
      - Environment=compliance-monitoring
      - CostCenter=security

## Platform Details

- **Platform**: Pulumi
- **Language**: TypeScript  
- **Complexity**: Hard
- **AWS Region**: Use default or configurable region

## Deliverables

Your Pulumi program should:
- Be well-structured and follow TypeScript best practices
- Include proper error handling
- Use Pulumi's infrastructure-as-code patterns
- Export relevant resource ARNs and identifiers
- Include comments explaining key configuration decisions

## Success Criteria

- All AWS resources are created successfully
- Lambda function can be triggered on schedule
- Compliance violations generate SNS notifications
- CloudWatch alarms trigger appropriately
- IAM permissions follow least-privilege principle
- All resources are properly tagged

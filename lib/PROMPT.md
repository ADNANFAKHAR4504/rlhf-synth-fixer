# EC2 Cost Optimization Task

IMPORTANT: Use Pulumi with TypeScript. Platform is pulumi, language is ts, region is ap-southeast-1. Don't change these.

## What I need

I need help optimizing our AWS costs. Our dev team has been running EC2 instances 24/7 and it's killing our budget. We want to automatically shut down dev and staging instances during off-hours.

Here's what needs to happen:

1. Import our existing EC2 instances (the ones tagged Environment=development or Environment=staging)
2. Set up CloudWatch Events to stop them at 7 PM EST on weekdays
3. Set up CloudWatch Events to start them at 8 AM EST on weekdays
4. Create Lambda functions to actually do the stopping and starting
5. Make sure the Lambda has the right IAM permissions
6. Add some CloudWatch alarms if instances fail to start
7. Don't mess with any of the existing instance configs or tags
8. Show me how much money we'll save each month (assume 13 hours shutdown per day)

The output should show me the instance IDs that got imported, the Lambda function ARNs, the CloudWatch rule ARNs, and the estimated monthly savings.

## Background

We're a startup and our dev team leaves their test environments running constantly. Management is upset about the AWS bills. We need to shut down non-production instances when nobody is using them but still be able to restart them quickly when needed.

## Technical requirements

- Use Pulumi's import feature so we don't have to recreate existing instances
- Lambda should handle multiple instances in one run to save on invocations
- CloudWatch Events needs to handle EST timezone properly including daylight saving
- Log all instance state changes to CloudWatch Logs for auditing
- Use actual current EC2 on-demand pricing for the cost calculation
- Don't touch any instances tagged Environment=production

## Environment details

We're in ap-southeast-1. Using Pulumi TypeScript SDK 3.x, Node.js 18+, and AWS SDK v3. We have several t3.medium and t3.large instances spread across dev and staging. CloudWatch Events and Lambda will handle the scheduling. The instances stay in their current subnets, no VPC changes needed.

## Project conventions

For resource names: use environmentSuffix variable to support multiple PR environments. Like myresource-${environmentSuffix} or tag with EnvironmentSuffix.

For tests: integration tests load outputs from cfn-outputs/flat-outputs.json and validate against real deployed resources.

For resource management: everything should be destroyable for CI/CD. Exception: don't create secrets, fetch them from existing Secrets Manager entries. Avoid DeletionPolicy Retain unless you really need it.

For security: encryption at rest and in transit, least privilege IAM, use Secrets Manager for creds, enable logging and monitoring.

Deploy everything to ap-southeast-1.

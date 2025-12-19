Hey team,

We need to build a secure API infrastructure for our financial services platform that can handle around 500,000 transactions per day. The system needs to work across multiple AWS regions with custom authentication, and we have to stay GDPR compliant. Performance is really important here - our users expect fast responses regardless of where they're located.

## What we're looking for:

Multi-region setup with us-east-1 as primary and us-west-2 as secondary. We want API Gateway REST APIs in both regions with a custom Lambda authorizer that validates JWT tokens. The authorizer needs to be Python 3.10.

For data storage, use DynamoDB Global Tables so transactions automatically replicate between regions. All the transaction processing should happen in Lambda functions, also Python 3.10.

Put CloudFront in front of everything for better global performance. If we have a custom domain, we can use Route 53 with latency-based routing, but make that optional since we might just test with the CloudFront URL initially.

## Security requirements:

Set up WAF to block the usual suspects - SQL injection, XSS attacks, and rate limiting (we're thinking 10,000 requests per 5 minutes). 

All API keys and JWT secrets need to go in Secrets Manager, not hardcoded anywhere. Make sure DynamoDB tables are encrypted at rest.

API Gateway should have throttling configured - 10,000 burst limit and 5,000 steady state requests per second.

## Monitoring and compliance:

Enable X-Ray tracing on all Lambda functions so we can see the full request flow. CloudWatch logs should keep data for at least 90 days for compliance.

We need CloudWatch dashboards showing the key metrics - API errors, Lambda performance, DynamoDB throughput, WAF activity. Set up alarms for anything critical like high error rates or Lambda failures.

## Technical details:

Use Terraform HCL, keep it straightforward without pulling in external modules. We want everything defined directly so it's easy to understand and modify.

Make sure all resource names include an environment suffix so we can run multiple deployments without conflicts (like pr123, dev, etc).

The whole stack should be destroyable via terraform destroy - no retention policies that would leave orphaned resources.

## Files to create:

- provider.tf for AWS providers (primary region, secondary region, and global for CloudFront)
- variables.tf with all the configurable stuff
- main.tf with the core infrastructure (API Gateway, Lambda, DynamoDB, CloudFront, Secrets Manager)
- security.tf for WAF rules and any security groups
- monitoring.tf with CloudWatch dashboards, alarms, and X-Ray configuration
- outputs.tf so we can get the API endpoints and other info after deployment
- lambda_authorizer.py with the JWT validation logic
- lambda_transaction.py that processes transactions and stores them in DynamoDB

Keep the code clean and well-commented so other engineers can understand it easily.

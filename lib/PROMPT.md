## Prompt

I need a CDK TypeScript application that provisions infrastructure across multiple AWS regions with consistent tagging and security policies.

Create infrastructure in three regions: us-east-2, us-west-2, and eu-west-1. Each region should have the same resources with consistent configuration. Use context or environment variables to parameterize resource naming instead of hardcoding values.

Apply Environment and CostCenter tags to each resource for compliance tracking. The tagging system connects to all resources through CDK tags, ensuring consistent metadata across regions.

Set up VPCs in each region and configure VPC peering between them. The VPC peering connections allow resources in different regions to communicate securely. Use dynamic CIDR management to avoid conflicts when creating multiple VPCs.

Create IAM managed policies that define security and backup policies. These policies connect to IAM roles and users, providing uniform access control across all environments. Use AWS Backup to create backup policies that connect to resources like EC2 instances and S3 buckets.

Set up CloudWatch alarms that monitor critical resources. The alarms connect to CloudWatch metrics to track resource health and performance. Configure SNS topics that receive alarm notifications when thresholds are exceeded.

Create S3 buckets with encryption and versioning enabled by default. The buckets use KMS keys for server-side encryption. The KMS service provides encryption keys that connect to S3 buckets and other services requiring data encryption.

Implement multi-region deployment using CDK Pipelines or StackSets. The deployment system connects to CloudFormation stacks in each region, ensuring consistent infrastructure across environments.

## Output

Create these files:
- bin/tap.ts - CDK app entry point
- lib/tap-stack.ts - main stack called TapStack
- cdk.json - project config

Just give me the code, no explanations needed.

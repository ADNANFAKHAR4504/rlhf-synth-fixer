Hey team,

We're building database infrastructure for our gaming platform that's expecting about 1 million daily active players. The tricky part? Workloads are completely unpredictable - could spike during events, tournaments, or new releases.

Here's what we need to set up:

The database should be Aurora Serverless MySQL - it needs to handle those crazy load patterns without us manually scaling up and down. Performance is critical here since we're talking about real-time gaming data with lots of concurrent connections.

For the infrastructure setup:
- Everything needs to live in a proper VPC with private subnets (multi-AZ for HA)
- Security groups locked down to only allow MySQL traffic on port 3306
- Auto-scaling triggers based on CPU utilization - when things get hot, scale up automatically
- KMS encryption for data at rest (GDPR requirement, can't skip this)
- CloudWatch metrics to track database performance - we need visibility into what's happening
- EventBridge rules to catch scaling events so we can monitor and alert on them
- S3 bucket for automated backups with proper retention policies
- IAM roles and policies following least privilege

A few important notes:
- We already have provider.tf configured, so don't worry about provider setup
- Make sure everything is properly tagged for cost tracking
- Use variables for anything that might change between environments
- Output the important stuff like cluster endpoint, reader endpoint, security group IDs

What I need from you:

1. main.tf - the Aurora Serverless cluster config with DB subnet group
2. variables.tf - all the input variables we'll need
3. outputs.tf - endpoints and resource IDs we'll reference later
4. vpc.tf - VPC, subnets, route tables if we're creating from scratch (or data sources if using existing)
5. security-groups.tf - security group rules for database access
6. kms.tf - KMS key for encryption
7. cloudwatch.tf - alarms and dashboard for monitoring
8. eventbridge.tf - event rules for scaling notifications
9. s3.tf - backup bucket with lifecycle policies
10. autoscaling.tf - auto-scaling policies and targets
11. iam.tf - necessary IAM roles and policies

Please write clean, production-ready Terraform code with proper comments explaining the why behind important decisions. Use local variables where it makes sense to keep things DRY.

Thanks!
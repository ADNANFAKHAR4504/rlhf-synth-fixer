# RDS Cross-Region Disaster Recovery with Automated Snapshots

Hey, we need to build a robust disaster recovery solution for our financial services payment processing database. We're handling critical transaction data that requires cross-region protection with a 1-hour recovery point objective. **Use Terraform with HCL** for this implementation.

Here's what we need to set up: Deploy a primary RDS PostgreSQL 14 database in us-east-1 with automated backups running hourly. The database needs to be in a private subnet for security, and we'll use AWS KMS encryption with a region-specific key. Configure the backup retention for 30 days to meet our regulatory requirements.

For the disaster recovery piece, we're implementing automated snapshot copying to us-west-2. This gives us geographic redundancy without the deployment time and cost of maintaining a live read replica. Create the VPC infrastructure in us-west-2 so it's ready for a restore operation if we need it. Set up a separate KMS key in us-west-2 for encrypting the copied snapshots.

We need Lambda functions to automate the snapshot lifecycle management. The primary Lambda in us-east-1 should monitor new RDS snapshots and trigger cross-region copies to us-west-2. A secondary Lambda in us-west-2 should validate that snapshots arrived correctly and alert us if there's any issue. Both Lambda functions should use Python 3.11 runtime and include comprehensive error handling for RDS API failures.

Set up Route53 health checks to continuously monitor the primary database endpoint. If the health check detects issues, we need immediate notifications through SNS topics in both regions. Configure CloudWatch alarms for critical metrics like CPU utilization, storage space, database connections, and most importantly, the freshness of our latest snapshot in the DR region. We can't afford to have stale backups.

For backup metadata and additional protection, create S3 buckets in both regions. These buckets should store information about our snapshot copies and have cross-region replication enabled. Implement lifecycle policies that transition objects to Glacier storage after 7 days and retain them for 30 days total. All S3 buckets must block public access and use encryption.

Create comprehensive IAM roles for the Lambda functions with least-privilege permissions. The Lambda functions need permissions to describe RDS snapshots, copy snapshots across regions, send SNS notifications, and write to S3 buckets. Make sure these roles can't do anything beyond what's necessary for the DR automation.

For networking, set up VPCs in both regions with private subnets for the RDS instances. Even though we're not running a database in us-west-2 initially, the infrastructure should be ready. Use separate security groups that allow PostgreSQL traffic on port 5432 only from application subnets. Don't make the databases publicly accessible.

All resources must be properly tagged with Environment, Owner, and CostCenter tags for cost allocation and compliance tracking. Make sure the RDS instance has deletion protection disabled and skip final snapshot enabled so we can clean up easily during testing.

Create Terraform outputs for integration testing: the primary RDS instance ID and endpoint, both KMS key ARNs, both S3 bucket names, Lambda function ARNs, SNS topic ARNs, Route53 health check ID, and the VPC IDs from both regions.

For the file organization, structure it like this:
- lib/provider.tf for AWS provider configuration with both us-east-1 and us-west-2 providers
- lib/main.tf for all infrastructure resources (create everything new - no existing resource lookups)
- lib/lambda_function.py for the snapshot management Lambda handler code

Remember to use the environmentSuffix variable and add random suffixes to ALL resource names following the pattern: resourcename-${var.environmentSuffix}. This ensures global uniqueness for resources like S3 buckets and RDS instances. Only use data.aws_caller_identity.current for getting the AWS account ID - create all other resources fresh.

The goal is a production-ready disaster recovery solution that can automatically recover from a complete regional failure within 45 minutes using the latest snapshot. Make sure monitoring is comprehensive so we'll know immediately if something's wrong with our backup strategy.
# Production AWS Infrastructure with Security Controls

I need a CloudFormation template in JSON format that sets up a secure production environment with proper security, compliance, and monitoring. This needs to be production-ready with all the security best practices baked in.

## What I Need

Build a VPC with 10.0.0.0/16 CIDR that has public subnet 10.0.1.0/24 and private subnet 10.0.2.0/24. The VPC needs an Internet Gateway attached to it so public resources can reach the internet.

Set up security groups that only allow what's necessary - HTTPS/HTTP from 0.0.0.0/0 but restrict SSH to specific IPs only. The web security group should allow inbound 443, 80, and SSH from a specific CIDR. Database security group should only accept MySQL traffic from the web security group.

Deploy an RDS MySQL database in the private subnet that's only accessible from the web security group. The database needs encryption at rest and should NOT be publicly accessible. Set up automated backups with 7-day retention.

Create IAM roles for EC2 instances that can write logs to CloudWatch. The roles need CloudWatch agent permissions plus basic log streaming. Make an instance profile that EC2 can use.

Enable AWS Config with a configuration recorder that tracks all resource changes. Config needs an S3 bucket to store snapshots and a delivery channel to ship data there. Add a Config rule that checks if MFA is enabled for IAM console access.

Set up CloudTrail that logs all API calls to an S3 bucket. CloudTrail needs log file validation enabled and should be multi-region. The S3 bucket needs proper policies so CloudTrail can write to it.

Create CloudWatch log groups where EC2 instances send their logs. Set retention to 30 days.

Add AWS WAF with managed rule sets - use the Common Rule Set and Known Bad Inputs Rule Set to protect against web exploits.

## Technical Requirements

All S3 buckets need encryption enabled and must block all public access. Use bucket policies that only allow the specific AWS services to write.

The RDS database needs a subnet group with at least 2 subnets. Use db.t3.micro instance class with encrypted storage.

IAM roles should follow least privilege - only grant what's absolutely needed. The Config role needs permissions to put objects in S3 and describe configurations.

Tag everything with Environment parameter so we can track resources easily.

CloudTrail must have IsLogging property set to true and enable log file validation.

Don't hardcode the region - use AWS pseudo parameters. For database passwords, just use a parameter since this is for testing but mark it as NoEcho.

The template needs to pass cfn-lint validation without errors. Don't use Fn::Sub unless you actually need variable substitution.

For WAF, only create it in real AWS regions - add a condition that checks if region is not-localstack since LocalStack doesn't support WAFv2.

## Final Output

Give me a complete CloudFormation JSON template that provisions all these resources with proper dependencies. Include outputs for VPC ID, subnet IDs, security group IDs, database endpoint, and WAF ARN. Make sure all the integrations work - Config writing to its bucket, CloudTrail writing to its bucket, EC2 roles able to send logs to CloudWatch, database only accessible through security groups.

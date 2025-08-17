# CloudFormation Template Request

Hey, I need help creating a CloudFormation YAML template for a secure AWS setup. We're deploying in us-west-2 and need to build out some infrastructure.

## What we're building

Basically, we need a secure AWS environment with IAM roles, an S3 bucket, VPC networking, and some monitoring. Here's what I'm looking for:

### IAM Roles
We need different IAM roles for our applications. Each role should only have the permissions it actually needs - no wildcards unless absolutely necessary. Think least privilege principle.

### S3 Bucket
Need an S3 bucket with a unique name. Has to have server-side encryption enabled (using AWS managed keys is fine).

### VPC Setup
Create a VPC with both public and private subnets. Public subnet needs internet access via an Internet Gateway. Private subnet should be able to reach the internet through a NAT Gateway in the public subnet.

### Monitoring
Set up CloudWatch alarms to catch unauthorized access attempts on our IAM roles or S3 buckets. Use CloudTrail logs to detect these events.

### Tagging
All resources need consistent tags for cost tracking - Environment, Owner, Project tags.

## Important notes

- Keep IAM permissions tight - no unnecessary access
- CloudWatch alarm should trigger on CloudTrail events for unauthorized access
- Template needs to pass cfn-lint validation
- Follow AWS security best practices

## Deliverable

Just need one CloudFormation YAML file called `TapStack.yml` that does all this. Should be ready to deploy with `aws cloudformation deploy`.

Thanks!
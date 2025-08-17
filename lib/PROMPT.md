# AWS Multi-Region Infrastructure

Need to build out a secure multi-region AWS setup for our IaC testing project. This should be a pretty comprehensive infrastructure that spans both us-east-1 and us-west-2.

## What we need

Just need two terraform files really:

**provider.tf** - Should lock down the terraform and AWS provider versions, set up the main provider plus an alias for us-west-2, and configure the S3/DynamoDB backend for state management. Keep it simple with no variables.

**lib/tap_stack.tf** - This is where everything else goes. All the variables, data sources, resources, outputs - everything in one file. Don't want to deal with modules for this one.

## Infrastructure Requirements

The infrastructure should span both regions with proper VPCs, subnets (public/private), NAT gateways, and VPC flow logs enabled.

We'll need bastion hosts for SSH access (locked down properly) and auto-scaling groups for the application instances. Everything should be behind application load balancers.

For data storage, set up RDS instances in the private subnets with encryption enabled, automated backups, and proper security groups following least privilege.

S3 buckets need encryption and versioning turned on. Also want CloudFront distributions serving content over HTTPS only.

The two regions should be connected via VPC peering, and we'll use Route53 for DNS failover between the ALBs.

Make sure CloudTrail is logging everything with encryption, and set up CloudWatch monitoring with some basic alarms.

All the IAM roles should follow least privilege principles, and everything should be tagged consistently.

For outputs, just include the safe stuff - VPC IDs, load balancer DNS names, RDS endpoints, that sort of thing. Nothing sensitive.

That should cover everything we need for a solid multi-region setup.
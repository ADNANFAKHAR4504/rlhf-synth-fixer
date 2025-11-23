Hey team,

We've got a multi-region AWS infrastructure project that needs to be done in Terraform. The security team has been on us about getting everything locked down properly, and we need this deployed across us-west-1 and us-east-1 for high availability.

Here's what we're looking to build:

## What We Need

So basically, we need to take our current CloudFormation setup and translate it to Terraform. The whole thing needs to be production-ready with all the security bells and whistles. I'm talking encryption everywhere, proper IAM controls, the works.

## Multi-Region Setup

We need resources in both us-west-1 and us-east-1. Use provider aliases to handle the multi-region stuff. The idea is if one region goes down, we're still operational in the other one.

## Networking

Each region needs its own VPC with at least two subnets spread across different availability zones. Make sure you set up the routing tables, internet gateways, and NAT gateways properly. We don't want any network bottlenecks or single points of failure.

## Security Groups

Keep these tight. Default deny everything, then only open up what's absolutely necessary. SSH on port 22 and HTTPS on 443 are the main ones we'll need, but make sure they're restricted properly - no wide-open 0.0.0.0/0 nonsense unless it's for the load balancer.

## IAM Setup

Create the IAM roles and policies we need, but stick to least privilege. Nobody should have more access than they actually need to do their job. And yeah, MFA needs to be enforced for anyone logging into the console. No exceptions.

## Encryption Requirements

Everything needs to be encrypted. Use KMS for data at rest - that means EC2 volumes, S3 buckets, all of it. For data in transit, we need SSL/TLS everywhere. The compliance folks are really strict about this.

## Monitoring

Turn on CloudTrail across all regions. We need to log every API call for audit purposes. Make sure it's configured to capture everything - the security team will want to review the logs regularly.

## Compute Resources

Set up an EC2 Auto Scaling group that spans multiple availability zones in each region. Hook it up to a load balancer to distribute traffic properly. We want automatic scaling based on demand.

## S3 Security

The S3 bucket policies need to enforce encryption in transit using that aws:SecureTransport condition. Also restrict access to only our VPCs - we don't want any public access. And make sure versioning is enabled for compliance.

## Important Notes

A few things to keep in mind:

- This needs to be pure Terraform (HCL). We're moving away from CloudFormation completely.
- The output should be in tap_stack.tf (we already have provider.tf set up separately).
- Make it production-grade but keep it maintainable. Use locals and variables where it makes sense.
- Both regions should have identical configurations - mirror everything for true HA.
- All resources need proper tags for cost tracking. Finance has been asking for this.
- KMS keys should have automatic rotation enabled.
- CloudTrail needs to be multi-region and log to a centralized S3 bucket.

## What Success Looks Like

When you're done, we should have a complete Terraform config that deploys a secure, highly available AWS environment across both regions with all the security best practices baked in. IAM roles, VPCs, subnets, security groups, auto scaling, load balancers, S3 policies, CloudTrail - the whole nine yards.

Make sure the code is well-commented so the rest of the team can understand what's happening. We'll be maintaining this for a while, so readability matters.

Let me know if you have any questions!
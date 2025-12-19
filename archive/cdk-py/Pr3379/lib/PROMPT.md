# Need AWS CDK setup for EC2 monitoring

Hey, so we're a small SaaS startup and we've got about 15 EC2 instances running right now (t3.medium). Things are getting messy with monitoring and we need to get this sorted out properly using CDK in Python.

## What we need

We need the basics set up:

- VPC with 10.0.0.0/16 CIDR
- Security groups that allow HTTP on port 80
- The 15 instances spread across multiple AZs

For monitoring, we really need CloudWatch alarms when memory hits 80%. That's been our biggest pain point - instances running out of memory and us not knowing until customers complain. Would be good to also monitor CPU, disk, and general health checks.

Logging is important too. We need logs going to both S3 (for compliance, auditors want this) and CloudWatch Logs so we can actually search through them when debugging.

IAM stuff should follow least privilege obviously. Don't want to leave security holes.

## Constraints

We're still pretty bootstrapped so need to keep AWS costs reasonable. Can't be spinning up unnecessary resources.

Deployment needs to be straightforward - our DevOps person is pretty good but doesn't want to spend days figuring out complex CDK setups.

Should work without errors and be something we can extend later as we grow.

That's about it. Just want something production-ready that we can deploy and not worry about.

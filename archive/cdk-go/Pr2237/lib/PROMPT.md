# Help me build secure infrastructure with CDK + Go

## Background

So I'm tasked with building this multi-tier web app infrastructure and honestly, the security requirements are pretty intense. Our security team handed me this massive checklist and I'm trying to figure out the best way to tackle it using CDK with Go.

Why Go? Well, our team is way more comfortable with Go than wrestling with YAML files all day. Plus the type safety is nice and the IDE actually helps instead of just highlighting random YAML indentation errors. And let's be real - being able to use actual programming constructs instead of copy-pasting YAML blocks everywhere is a huge win.

## What I need to build

Okay so here's what I'm dealing with:

**Network stuff:**

- VPC with public/private subnets across 2 AZs in us-east-1 (pretty standard)
- VPC flow logs going to some centralized S3 bucket
- Everything needs the "prod-" prefix (company policy, don't ask)

**Compute bits:**

- Lambda functions for background jobs (need proper IAM roles, not just admin access)
- EC2 instances but ONLY in private subnets (security team was very clear on this)
- Bastion host for SSH access (because how else are we gonna debug things?)
- Least privilege everywhere (easier said than done...)

**Storage & CDN:**

- S3 buckets with customer-managed KMS keys (can't use default AWS keys)
- CloudFront in front of S3 with OAI setup
- Separate logging bucket for all the security events

**Security & monitoring:**

- AWS Config for compliance checking (auditors love this stuff)
- WAF on the CloudFront distribution
- Security groups that actually make sense
- SNS alerts for when things go wrong

**Config management:**

- Systems Manager for config values (no more hardcoded stuff in code)
- Secrets Manager for sensitive data
- Auto-rotation where possible (though that's always tricky)

## Where I'm stuck

I've done smaller CDK projects before but this is way more complex. I'm particularly struggling with:

1. **Project organization** - How do I structure all this Go code without it becoming a mess?
2. **Security patterns** - What's the right way to handle IAM roles and KMS keys in Go?
3. **Multi-AZ setup** - Making sure everything is actually fault tolerant
4. **Monitoring integration** - Getting Config and CloudWatch to play nice
5. **Reusable components** - I don't want to copy-paste security configs everywhere

## Technical details

Some specifics I need to hit:

- us-east-1 region, 2 AZs
- Customer KMS keys for everything
- Proper least privilege IAM (no wildcards!)
- VPC flow logs centralized
- CloudFront + WAF working together
- Bastion host that's actually secure

The Go code needs to be production-ready with proper error handling. I also need it organized well because other people will need to maintain this.

## What would be super helpful

If you could help me with:

- A complete CDK Go project structure that makes sense
- All the security components (VPC, IAM, KMS, etc.)
- Lambda setup with proper roles
- CloudFront + S3 + WAF integration that actually works
- EC2 and bastion host with security groups
- AWS Config and monitoring setup
- Systems Manager and Secrets Manager implementation
- Some example commands to deploy this thing

Basically I need something I can actually deploy and that won't get me in trouble with the security team. Thanks!

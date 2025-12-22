Hey team,

We're in a bit of a mess with our infrastructure right now. We've been manually spinning up resources for dev, staging, and prod environments, and surprise surprise - they're all slightly different now. Last week staging had a different subnet configuration than prod, and dev was missing a security group that the other two had. This is getting ridiculous.

I need to build something that deploys the exact same infrastructure to all three environments. Same VPC layout, same EC2 setup with auto-scaling, same RDS database, same load balancer - everything identical. The only differences should be the sizing (dev can use tiny instances, prod needs beefier ones) and maybe some scaling parameters.

The goal is to define this infrastructure once in Terraform and be able to deploy it to any environment just by swapping out a tfvars file. No more drift, no more "but it works in staging" problems.

Here's what I'm thinking we need:

**Network layer**: VPC with public and private subnets spread across multiple AZs. Nothing fancy, just standard AWS networking with an internet gateway for the public subnets and NAT gateways for the private ones.

**Compute**: EC2 instances behind an Application Load Balancer. We'll need an Auto Scaling group so we can handle traffic spikes. Dev can use t3.micro, staging maybe t3.small, and prod should be t3.medium or larger depending on what we see in testing.

**Database**: RDS MySQL instance. Dev can be single-AZ to save costs, but staging and especially prod need multi-AZ for reliability. I'm thinking MySQL 8.0, and we should make sure backups are configured properly for prod.

**Storage**: S3 bucket for application data. Should have versioning enabled and maybe some lifecycle rules to transition old stuff to cheaper storage.

**Security**: Proper security groups - ALB should accept traffic from the internet on 80/443, EC2 instances should only accept traffic from the ALB, and RDS should only talk to the EC2 instances. Standard stuff but let's get it right this time.

**IAM**: The EC2 instances need permissions to write to CloudWatch logs and read/write to the S3 bucket. Nothing more, nothing less.

Some critical points:
- Everything needs to include an environment suffix in the name (like "alb-dev-pr8643" or "rds-prod-pr8643") so we don't have naming collisions
- Tag everything with Environment, Project, and ManagedBy tags so we know what's what
- Deploy to us-east-1 for everything
- Make sure we can actually destroy these resources when we're done testing - no deletion protection anywhere
- Use Terraform with HCL (not CDK, not Pulumi, just straight Terraform)

For the environment configs, I'm thinking:
- **dev.tfvars**: t3.micro instances, db.t3.micro RDS, minimal scaling (1-2 instances), single AZ where possible
- **staging.tfvars**: t3.small instances, db.t3.small RDS, moderate scaling (2-4 instances), multi-AZ
- **prod.tfvars**: t3.medium+ instances, db.t3.medium RDS, production scaling (3-10 instances), multi-AZ everywhere

The infrastructure code should live in tap_stack.tf (or main.tf, whatever), variables in variables.tf, provider config in provider.tf, and then the three environment-specific tfvars files.

When this is done, I should be able to run:
```
terraform init
terraform plan -var-file=dev.tfvars
terraform apply -var-file=dev.tfvars
```

And get a complete, working dev environment. Same commands with staging.tfvars or prod.tfvars should give me identical infrastructure, just with different sizes.

One more thing - since we're testing with LocalStack, keep things simple. Use gp2 storage for RDS (not gp3), don't enable any exotic features that LocalStack might not support, and keep the configuration as straightforward as possible.

Can you put this together? Let me know if you need any clarification on the architecture or the requirements.

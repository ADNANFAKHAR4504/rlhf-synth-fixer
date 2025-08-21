Hey, so I'm working on setting up this AWS environment for our production CI/CD pipeline and honestly, it's getting pretty complex. I need some help building out the Terraform code for the whole thing.

We're targeting us-west-2 for everything, and our company has this naming convention where we prefix everything with "corp-" (I know, I know... but that's what they want).

Here's what I'm dealing with:

**Security stuff** (this is where I'm really nervous about messing up):

- IAM roles need to be locked down tight - least privilege and all that. The security team will have my head if I attach policies directly to users instead of roles/groups
- Everything needs KMS encryption - RDS, EKS, ALB, S3, you name it. If it can be encrypted, it should be
- Network security groups should only allow 80/443 for public stuff, and keep the database completely private
- All secrets go in SSM Parameter Store - learned that the hard way when someone accidentally committed API keys last month
- PostgreSQL database absolutely cannot be public - private subnets only

**Infrastructure basics:**

- Need HA across at least 2 AZs (management loves their uptime SLAs)
- Full CloudWatch monitoring and logging everywhere, plus CloudTrail for auditing
- VPC with 10.0.0.0/16, split between public and private subnets per AZ
- ALB in front of EKS with some kind of demo NGINX service to prove it works
- Some reasonable resource limits so we don't accidentally spin up a $10k bill overnight

**CI/CD pipeline:**

- CodePipeline that can deploy from our GitHub repo straight to EKS
- Need it to work with different environments (dev/staging/prod) - thinking Terraform workspaces?

**Other requirements** (the usual corporate stuff):

- Everything in us-west-2 only
- Corp- prefix on all resource names
- Follow AWS Well-Architected principles (whatever that means in practice)
- No IAM policies on individual users
- Consistent tagging (Environment, Project, etc.)
- Make the Terraform code readable and modular - future me will thank present me
- Proper error handling and dependency management

The goal is to get something that passes our security audits, actually works reliably across AZs, and gives us useful outputs for integrating with other systems.

Can you help me build out the Terraform modules for this? I'm decent with Terraform but this scope is bigger than what I usually work with.

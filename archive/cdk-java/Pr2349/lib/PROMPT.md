I need to build an AWS cloud infrastructure using Terraform. Here's what I'm trying to accomplish:

I want to set up a complete VPC environment with proper networking. This means creating both public and private subnets - the public ones for resources that need internet access, and private ones for sensitive stuff like databases.

For the compute side, I'll be deploying some EC2 instances. The database will be a PostgreSQL RDS instance, and I want this running in the private subnet for security reasons.

Networking-wise, I need to get the connectivity right. That means setting up an Internet Gateway for the public subnets and a NAT Gateway so instances in private subnets can still reach the internet when needed.

Security is important here - I want encryption enabled on all storage, and the security groups need to be locked down properly. SSH access should be restricted, not wide open. For the RDS database, I want automated backups configured with a reasonable retention period.

The end goal is a Java CDK script that builds all this infrastructure in the us-west-2 region. It should deploy cleanly without any errors.

This whole setup needs to follow AWS best practices - proper resource tagging, sensible security configurations, and reliable backup policies. It's basically a standard three-tier architecture with proper security boundaries.
# Payment Processing Application Migration to AWS

Hey team,

We've got a new project that needs our attention. One of our clients - a financial services company - is looking to migrate their payment processing system from their on-prem setup to AWS. This is pretty critical since we're dealing with actual payment transactions, so we need to make sure we don't break anything during the migration and keep everything compliant.

They've been running this thing on physical servers with PostgreSQL for a while now, and they're finally ready to move to the cloud. The goal is to build out a solid AWS environment that keeps their PCI DSS compliance intact while giving them the benefits of cloud infrastructure. We'll need to do this migration carefully - they want a blue-green deployment approach so they can cut over without any downtime.

I'm going to build this out using Terraform. They want to use AWS managed services where it makes sense to keep ops overhead down, but they also need tight control over security and networking for compliance reasons.

## What we're building

Basically, we need to create a production-ready infrastructure in AWS that can handle migrating their payment processing app with zero downtime. The whole thing needs to be defined in Terraform.

Here's what needs to be in place:

**Networking**
We'll need a VPC with 2 public subnets and 4 private subnets spread across 2 availability zones. NAT Gateways for outbound internet from the private subnets, and an Internet Gateway for the public ones. Make sure the route tables and subnet associations are set up correctly.

**Database**
They're using PostgreSQL, so we'll set up an RDS PostgreSQL instance - db.r6g.large with Multi-AZ. We need automated backups with 7 days of retention, and everything encrypted at rest using KMS. Since they're migrating from on-prem, we'll need AWS DMS set up with a replication instance and both source and target endpoints configured for PostgreSQL.

**Compute**
Auto Scaling Group with a launch template using Amazon Linux 2023 AMI. EC2 instances go in the private subnets. We need blue-green deployment tags on the ASG so they can shift traffic when ready. Don't forget the IAM instance profile with the right permissions.

**Load Balancing**
Application Load Balancer in the public subnets, target group with health checks, and listener rules to route traffic to the app.

**Security**
WAF rules attached to the ALB with rate limiting - 2000 requests per 5 minutes per IP. We need separate security groups for the web tier, app tier, and database tier. Everything needs to be encrypted in transit and at rest.

**Secrets and Config**
Use Secrets Manager for database credentials with automatic rotation every 30 days. Systems Manager Parameter Store for app config values. Make sure the IAM permissions are set up so the applications can actually retrieve the secrets.

**Monitoring**
CloudWatch Log Groups for app logs with 30-day retention. Set up CloudWatch alarms for the important metrics. We need to make sure logs from the EC2 instances are getting aggregated properly.

## Technical stuff

- Everything in Terraform HCL
- VPC for network isolation and multi-tier setup
- RDS PostgreSQL Multi-AZ for the database
- AWS DMS for the migration
- Auto Scaling Groups with blue-green capability
- Application Load Balancer for traffic distribution
- AWS WAF for protection
- Secrets Manager for credentials
- Systems Manager for config
- CloudWatch for logging and monitoring
- All resource names need to include environment_suffix for uniqueness
- Naming convention: payment-{resource-type}-${var.environment_suffix}
- Deploy to ap-southeast-1

## Constraints and requirements

We have to maintain PCI DSS compliance through the whole migration. All database connections need encryption in transit. No hardcoded credentials or plain text storage - everything goes through Secrets Manager. Use separate security groups with least privilege. All resources should be destroyable (no Retain policies) since we'll be testing this. Blue-green deployment is a must for zero-downtime cutover. Automated backups need to be on for DR. Multi-AZ deployment for HA. Make sure there's proper error handling and logging throughout.

## Success criteria

The infrastructure needs to be fully functional and able to host the payment processing application. DMS should be configured and ready to replicate from on-prem. We need high availability with Multi-AZ across 2 availability zones. Security-wise, everything encrypted, secrets managed properly, WAF rules active. The architecture needs to support PCI DSS requirements. Blue-green deployment tags should allow traffic shifting without downtime. All resources need the environment_suffix variable. CloudWatch logs and alarms should be set up for observability. The code should be clean, well-organized, and documented.

## Deliverables

- Complete Terraform HCL implementation with proper file structure
- VPC with public and private subnets, NAT Gateways, routing
- RDS PostgreSQL Multi-AZ instance with encryption
- AWS DMS replication instance and endpoints
- Auto Scaling Group with launch template
- Application Load Balancer with target groups
- AWS WAF with rate limiting rules
- Secrets Manager with rotation configured
- Systems Manager Parameter Store resources
- CloudWatch Log Groups with retention policies
- Security groups for each tier (web, app, database)
- IAM roles and policies with least privilege
- Unit tests for infrastructure validation
- Documentation and deployment instructions

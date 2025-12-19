# Prompt: Multi-region Terraform infrastructure (us-east-1 + us-west-2)

Hey, I need you to act as a senior Terraform engineer and build me a **single Terraform file** that deploys our production infrastructure to both **us-east-1** and **us-west-2** for redundancy. Everything should be in one file called `tap_stack.tf`.

## What I'm trying to accomplish

We're setting up a multi-region deployment for disaster recovery. The stack needs VPC, load balancers, compute instances, PostgreSQL databases, and some Lambda functions. Deploy everything to both regions using provider aliases.

I already have a `provider.tf` file that sets up the AWS provider, but you'll need to include the terraform block and provider aliases in your code for the multi-region setup.

## Hard requirements (don't skip these)

- **Everything in one file**: Put all your terraform code in `tap_stack.tf` - variables, locals, data sources, resources, outputs, everything. Include the terraform required_version block too.
- **Two regions**: Deploy identical infrastructure to us-east-1 and us-west-2. Use provider aliases (aws.us_east_1 and aws.us_west_2).
- **No modules**: Just write the resources directly, no external or local modules.
- **Must be destroyable**: This is for testing, so set deletion_protection = false on everything, skip_final_snapshot = true for RDS. We need to be able to tear it all down cleanly.
- **Security best practices**: Encrypt everything at rest with KMS, use least-privilege security groups, private subnets for databases and compute, public subnets only for load balancers.

## Infrastructure to deploy (in both regions)

### Networking

- VPC with public and private subnets in 2 AZs
  - us-east-1 should use 10.1.0.0/16
  - us-west-2 should use 10.2.0.0/16
- Public subnets: 10.X.1.0/24 and 10.X.2.0/24
- Private subnets: 10.X.11.0/24 and 10.X.12.0/24
- Internet gateway for public subnets
- NAT gateway for private subnets (use one NAT per region to save money, make it configurable though)
- Set up VPC Flow Logs going to CloudWatch Logs

### Security & Encryption

- Create a KMS key in each region for encrypting RDS, EBS volumes, and CloudWatch logs
- Enable automatic key rotation
- Create a KMS alias so it's easier to reference

### Compute

- Deploy 2 EC2 instances per region in private subnets
- Use t3.micro (or make it configurable)
- Get the latest Amazon Linux 2 AMI using a data source
- Attach them to an ALB target group
- User data should install Apache and set it to listen on port 8080 (or whatever app_port variable is)
- Use base64encode for the user_data
- Encrypt the root volume with the regional KMS key

### Load Balancing

- Internet-facing ALB in public subnets
- Target group pointing to the EC2 instances
- HTTP listener on port 80 (always)
- HTTPS listener on port 443 (only if enable_https is true and there's a certificate ARN)
- Use the modern TLS policy (ELBSecurityPolicy-TLS13-1-2-2021-06)

### Database

- PostgreSQL RDS in private subnets (single-AZ is fine, we're optimizing for cost)
- db.t3.micro instance class or make it configurable
- 20GB storage, gp3
- Encrypt with regional KMS key
- Backup retention 7 days (configurable)
- Enable CloudWatch logs for postgres
- DB subnet group with the private subnets
- Database name should be derived from app_name (strip out the hyphens)

### Serverless

- One Lambda function per region (nodejs20.x runtime)
- Simple inline code using data.archive_file - just needs to return 200 OK
- Give it CloudWatch Logs permissions and KMS decrypt permissions
- Encrypt environment variables with the regional KMS key

### Security Groups

Make 3 security groups per region:

- ALB SG: allow 80 and 443 from a configurable list of CIDRs, egress to app port on private subnets
- App/EC2 SG: allow app port from ALB SG only, allow 80/443 outbound for package updates
- Database SG: allow 5432 from app SG only, no egress needed

### IAM Roles

You'll need a few roles:

- VPC Flow Logs role (so flow logs can write to CloudWatch)
- EC2 instance role with instance profile (doesn't need any policies yet)
- Lambda execution role with CloudWatch Logs and KMS permissions

## Variables I want

Declare these variables with sensible defaults:

- aws_region (default us-east-1) - for compatibility with my existing provider.tf
- us_east_1_region and us_west_2_region - for the aliased providers
- app_name (default "tap-app") - used in all resource names
- common_tags - map with Environment and ManagedBy
- VPC CIDRs and subnet CIDRs per region (hardcode the defaults I mentioned above)
- allowed_ingress_cidrs - list of CIDRs that can hit the ALB (default to 0.0.0.0/0)
- app_port (default 8080)
- one_nat_gateway_per_region (bool, default true)
- log_retention_days (default 30)
- enable_https (bool, default false)
- certificate_arn (string, default empty)
- db_engine, db_engine_version (postgres 15.4), db_instance_class (db.t3.micro)
- db_username (default dbadmin), db_password (sensitive, no default)
- backup_retention_days (default 7)

There are also some unused variables in the current implementation like lambda_zip_path, lambda_handler, enable_bastion - just declare them with defaults so the code doesn't break.

## Naming

Name everything with the app_name variable and add the region suffix:

- ${var.app_name}-vpc-us-east-1
- ${var.app_name}-alb-us-east-1
- ${var.app_name}-instance-1-us-east-1
- etc.

## Tagging

Create a local called common_tags that merges var.common_tags with Environment = "Production" and Application = var.app_name. Apply it to everything with merge(local.common_tags, { Name = "..." }).

## Outputs

Output the important stuff per region:

- VPC IDs (vpc_id_us_east_1, vpc_id_us_west_2)
- ALB DNS names
- KMS key ARNs
- RDS endpoints
- Lambda ARNs
- VPC flow log IDs

## What I need from you

Give me one complete code block with the entire tap_stack.tf file. It should be ready to run with just terraform init && terraform apply (after providing db_password).

Don't give me separate tfvars files or any extra explanation - just the code. Make sure it includes:

1. The terraform block with required providers
2. All the variables
3. Locals
4. Data sources for AZs, AMIs, and the inline Lambda code
5. All the resources for both regions
6. All the outputs

The resources should be created in a logical order - networking first, then security (KMS, security groups), then compute and database, then Lambda and monitoring stuff.

Thanks!

Hey team,

We've got a financial services client who needs to set up identical payment processing infrastructure across three environments. They want everything to be secure and consistent between dev, staging, and prod.

The main requirement is to build this using Terraform in a well-organized, modular structure that can be deployed to any environment just by changing one variable. We'll use separate files for better maintainability and team collaboration.

Here's how the environments map to regions:

dev -> eu-west-1 (EnvironmentCode = 1)
staging -> us-west-2 (EnvironmentCode = 2)  
prod -> us-east-1 (EnvironmentCode = 3)

Here's what the client wants:

The Terraform solution needs to include:

Basic terraform config

Start with the usual Terraform version and AWS provider blocks. Include an environment variable that only accepts dev, staging, or prod. Also drop region_map and env_code_map directly in the file.

The provider region will automatically pick from the region_map depending on whatever environment the user passes in when they run terraform apply -var="environment=prod".

File organization

Use a modular file structure for better maintainability:
- provider.tf: Terraform version requirements, AWS provider configuration, region mapping, and backend configuration
- variables.tf: All variable definitions with proper validation and default values
- tap_stack.tf: Main infrastructure resources including VPC, ECS, RDS, Lambda, S3, monitoring, etc.
- Environment-specific .tfvars files: dev.tfvars, staging.tfvars, prod.tfvars with environment-specific values

This approach improves team collaboration, makes the code easier to navigate, and follows infrastructure-as-code best practices.

Environment mappings

Set up some maps to handle the differences between environments:
- RDS instance sizes: dev gets db.t3.micro, staging gets db.t3.small, prod gets db.t3.medium
- ECS task counts: dev runs 1 task, staging runs 2, prod runs 4  
- VPC CIDR patterns using 10.{EnvCode}.0.0/16 with subnets as 10.{EnvCode}.{SubnetNumber}.0/24
- CloudWatch alarm thresholds that make sense for each environment's capacity

Networking bits

Each deployment gets its own VPC using the CIDR pattern 10.{EnvironmentCode}.0.0/16. Pretty standard stuff.

Need 3 public and 3 private subnets spread across 3 availability zones. Use the aws_availability_zones data source but limit it to just 3 AZs to keep things consistent.

For high availability, put a NAT Gateway in each AZ rather than just one. Set up the usual route tables for public and private subnets.

Also add VPC endpoints for S3 and DynamoDB to keep traffic internal.

Security configuration  

Security groups have identical patterns between environments. The only difference is CIDR blocks that change depending on the environment mappings.

For IAM roles, stick to this naming pattern: {Environment}-{Service}-{Function}-Role. Keeps everything organized.

Important: Don't enable deletion protection on anything. The client wants to be able to tear down environments cleanly.

Database config

PostgreSQL 14.7 is what they want. Use the instance class mapping we set up earlier.

Production needs Multi-AZ for high availability, but dev and staging can be single-AZ to save costs.

Turn on automated backups with a reasonable retention period and make sure encryption is enabled. Store the database credentials in Secrets Manager for security.

Remember to set deletion_protection = false so environments can be cleaned up.

Application infrastructure

Build an Application Load Balancer with target groups. Health check settings are identical across all environments.

Build an ECS cluster and Fargate service. The container definitions are the same everywhere, but use the task count mapping to scale appropriately per environment.

For the task definition, use a placeholder variable for the container image and make sure the environment variables structure is consistent across environments.

Connect the ALB to the target groups with identical health check settings.

Serverless functions

Need Lambda functions for payment validation. Keep the runtime and environment variables identical across environments, but set reserved concurrency using the environment-specific mapping.

For the code, just use a placeholder or simple inline zip. Add comments about where they'll need to drop in their actual code artifact.

Reserved concurrency gets configured differently per environment depending on expected load.

Monitoring bits

Build a CloudWatch dashboard that tracks the same metrics everywhere - ECS CPU and memory, RDS CPU, error rates, that kind of thing.

Set up CloudWatch alarms that watch the same metrics but use different thresholds depending on the environment capacity mapping we defined earlier.

Secrets management

Set up Secrets Manager for database credentials and API keys.

Set up automatic rotation every 30 days. Use the aws_secretsmanager_secret_rotation resource or build a Lambda rotation function - whatever works best.

Make sure RDS and Lambda functions reference these secrets properly.

Storage for payment logs

Each environment gets its own S3 bucket with AES-256 encryption and Block Public Access turned on.

Set up a lifecycle policy that moves objects to Glacier after 90 days to keep costs down.

Set up proper logging and prefixes for the payment logs.

Log management

Add CloudWatch log groups for ECS, Lambda, and RDS where it makes sense. Set retention to 30 days across the board.

Outputs section

Export all the important ARNs and endpoints - VPC ID, Subnet IDs, ALB DNS name, ECS cluster ARN, RDS endpoint and ARN, Secrets ARNs, S3 bucket ARNs.

Name them clearly so they can be used for cross-stack references if needed later.

Tagging stuff

Tag everything with Environment, CostCenter, and DataClassification. Include example values for the CostCenter and DataClassification variables.

Deletion protection

Make sure deletion protection is turned off for everything. The client wants to be able to clean up environments completely.

Things that can't be changed

These are the things that absolutely have to be done this way:

- All S3 buckets use AES-256 encryption and block public access
- RDS uses PostgreSQL 14.7 with the environment-specific instance sizes we mapped out
- Lambda runtime and environment variable structure needs to be identical across environments  
- Security groups follow consistent rule patterns (CIDR blocks can vary depending on environment maps)
- IAM roles named like: {Environment}-{Service}-{Function}-Role
- All resources tagged with the required tags
- VPC CIDR blocks follow exactly 10.{EnvironmentCode}.0.0/16
- CloudWatch log groups retention set to 30 days
- Secrets Manager rotation every 30 days
- Organized across multiple files for maintainability: provider.tf (Terraform config), variables.tf (variable definitions), and tap_stack.tf (main infrastructure) - no external modules or references

Details on how to build it

Add comments in the Terraform code showing where to replace placeholders like container image, Lambda zip path, and cost center value.

Include example commands showing how to pass -var="environment=..." when running terraform.

Use good Terraform stuff - locals, maps, dynamic blocks, for_each where it makes sense. Keep the comments clear and helpful.

What we're looking for

A complete Terraform solution organized across multiple files that covers everything we talked about. It has to:

- Be ready to run after filling in just two placeholders: container image variable and Lambda code artifact path variable
- Include variable blocks for environment, costcenter, dataclassification, container_image, lambda_source_path, and whatever else is needed
- Include locals that define all the mappings: env to region, env to code, instance maps, task count map, CloudWatch thresholds, reserved concurrency map, and subnet numbering logic
- Use data "aws_availability_zones" to pick 3 AZs
- Use lookup() on maps to select values  
- No external modules - everything organized across provider.tf, variables.tf, and tap_stack.tf files
- Include outputs section with all the requested ARNs and endpoints
- Add inline comments explaining production differences like Multi-AZ setup
- At the end, include a commented terraform.tfvars example showing how to set values for environment, costcenter, etc.

Just give us the complete Terraform solution

Build the complete Terraform solution with proper file organization that covers everything we talked about. Valid Terraform HCL code with good comments explaining the security stuff. Organize into provider.tf (Terraform configuration), variables.tf (variable definitions), and tap_stack.tf (main infrastructure resources) for better maintainability.
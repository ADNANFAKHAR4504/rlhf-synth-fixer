I need to build a Terraform infrastructure stack that supports dev, staging, and production environments across multiple AWS regions. The infrastructure should connect services properly - EC2 instances need to access RDS databases through security groups, Application Load Balancers should route traffic to EC2 instances in private subnets, CloudWatch Logs should collect logs from all services, and S3 buckets should store application data and logs with proper encryption.

Create provider.tf and lib/tap_stack.tf files.

provider.tf should contain:
- Terraform version requirement, at least 1.6.0
- AWS provider from hashicorp/aws, version 5.0 or higher
- Default provider using var.aws_region variable
- Three aliased providers for us-east-1, us-west-2, and eu-central-1
- S3 backend configuration with bucket, key path, region, DynamoDB table for locking, and encryption enabled

lib/tap_stack.tf should contain everything else:
- All variables including aws_region
- Locals for environment-specific configs
- Data sources for AMI lookup, availability zones, etc
- All resources with proper connections:
  * VPC with public and private subnets
  * NAT Gateways in public subnets for private subnet internet access
  * Security groups that allow EC2 to connect to RDS on port 3306
  * Application Load Balancer routing to EC2 instances
  * EC2 instances in private subnets accessing RDS in database subnets
  * RDS database accessible only from EC2 security group
  * S3 buckets for application data and logs
  * CloudWatch Log Groups receiving logs from EC2 and RDS
  * KMS keys for encrypting S3, RDS, and CloudWatch Logs
  * IAM roles allowing EC2 to write to CloudWatch and read from S3
  * AWS Config rules monitoring compliance
- Outputs for VPC IDs, subnet IDs, load balancer DNS, RDS endpoint, S3 bucket names, KMS key ARNs

Requirements:
- Single file lib/tap_stack.tf with all logic
- No external modules
- Multi-environment support for dev, staging, production with different instance sizes, backup retention, etc
- Multi-region capability using provider aliases aws.use1, aws.usw2, aws.euc1
- IAM roles with least privilege - EC2 role can only read specific S3 buckets and write CloudWatch logs
- Security groups restrict access - RDS only accepts connections from EC2 security group, not from internet
- Encryption enabled for S3 buckets using KMS, RDS storage encryption, EBS volumes encrypted
- Consistent tagging with Environment, Owner, CostCenter on all resources
- No secrets in outputs
- SSH access restricted to specific CIDR blocks, not 0.0.0.0/0

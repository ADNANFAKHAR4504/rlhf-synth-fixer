# RDS MySQL Setup for Healthcare Application

We need a production-ready Terraform setup for an RDS MySQL database that'll handle about 20k patient records daily. This needs to be rock-solid with proper backups and HIPAA compliance.

## Database Configuration

**Instance specs:**
- MySQL 8.0 (or latest stable)
- db.m5.large instance
- GP3 storage with auto-scaling
- Enable deletion protection
- 7-day backup retention
- Set backup and maintenance windows
- Export error, general, and slow query logs to CloudWatch

## Security & Encryption

We're using customer-managed KMS keys for everything - the DB itself, automated backups, and snapshots. Make sure to create both the key and an alias.

Store the master password in Secrets Manager (no hardcoded creds in state files). The DB should reference this secret at apply time.

SSL/TLS is mandatory - create a parameter group with `require_secure_transport=ON`.

## Networking

Create a simple VPC setup:
- CIDR: 10.0.10.0/24
- Two private subnets across different AZs:
  - 10.0.10.0/25
  - 10.0.10.128/25
- DB subnet group using both subnets
- No public access (publicly_accessible = false)
- Security group allowing port 3306 only from the app's security group (pass this as a variable)

The module should be flexible enough to use an existing VPC if needed (vpc_id, private_subnet_ids, app_sg_id variables).

## IAM & Authentication

Set up a least-privilege IAM role for the snapshot Lambda (details below). Also add an optional variable for IAM database authentication (enable_iam_auth, default to false).

## Monitoring

Set up CloudWatch alarms for:
- CPU usage over 80% for 5+ minutes
- Low memory
- Low storage (configurable threshold)
- High database connections

Route all alarms to an SNS topic (expose sns_topic_arn as a variable).

## Automated Snapshots

We need a Lambda function (Python 3.x) that runs daily via EventBridge to create manual snapshots and clean up old ones:

**Lambda requirements:**
- Create daily manual snapshots with proper tags
- Delete snapshots older than N days (configurable)
- IAM permissions: rds:CreateDBSnapshot, rds:DescribeDBInstances, rds:AddTagsToResource, rds:DescribeDBSnapshots, rds:DeleteDBSnapshot, logs:*, kms:Decrypt, kms:CreateGrant
- Environment variables: DB_INSTANCE_IDENTIFIER, RETENTION_DAYS

Use the Terraform archive provider to package the Lambda code.

## Tagging

Apply these tags everywhere:
- Environment
- Application
- Owner
- ManagedBy=Terraform
- Compliance=HIPAA

## File Structure

Organize the code into these files:

1. **versions.tf** - Terraform and provider version constraints (>= 1.5, AWS >= 5.0)
2. **providers.tf** - AWS provider config with region variable
3. **variables.tf** - All input variables with sensible defaults
4. **main.tf** - Core infrastructure (VPC, subnets, routing, DB subnet group, security groups, KMS, Secrets Manager, RDS instance, CloudWatch, SNS, EventBridge, Lambda resources)
5. **parameter-group.tf** - RDS parameter group with SSL enforcement
6. **outputs.tf** - Export DB endpoint, port, name, security group ID, subnet group name, KMS key ARN, CloudWatch log groups
7. **lambda/snapshot.py** - Lambda function for snapshot management
8. **README.md** - Usage instructions, variable descriptions, apply steps, compliance notes with example tfvars

## Additional Notes

- Default multi_az to true for high availability
- Mark sensitive variables appropriately
- Make engine_version, allocated_storage, and max_allocated_storage configurable
- Include production example tfvars in the README

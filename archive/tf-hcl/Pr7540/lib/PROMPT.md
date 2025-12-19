# PCI-Compliant Payment Processing Infrastructure

## Business Context

Hey, we need to deploy a payment processing web application for our fintech startup that handles sensitive financial data with strict PCI-DSS compliance requirements. The infrastructure must provide high availability across us-east-1a and us-east-1b availability zones while handling variable traffic loads with auto-scaling that responds within 60 seconds. **We'll use Terraform with HCL** to build this production-ready infrastructure in us-east-1.

## Technical Requirements

### VPC Network Architecture

Create a VPC with CIDR 10.0.0.0/16 containing six subnets across two availability zones organized into three tiers. Deploy public subnets (10.0.1.0/24, 10.0.2.0/24) for the Application Load Balancer, private subnets (10.0.11.0/24, 10.0.12.0/24) for ECS Fargate compute, and isolated database subnets (10.0.21.0/24, 10.0.22.0/24) for Aurora PostgreSQL with no internet route for PCI-compliant network segmentation. Enable DNS hostnames and DNS support, create an Internet Gateway, and deploy two NAT Gateways (one per AZ with Elastic IPs) for high availability. Configure route tables where public subnets route to the Internet Gateway, private subnets route to respective NAT Gateways, and database subnets have no internet access. Enable VPC Flow Logs capturing all traffic to a dedicated S3 bucket with KMS encryption and lifecycle policy transitioning logs to Glacier after seven days for cost optimization.

### KMS Encryption Infrastructure

Create three customer-managed KMS keys for application data, S3 storage, and CloudWatch Logs encryption. Each key must enable automatic rotation and include a key policy allowing the root account full access first, then the current deployment user (data.aws_caller_identity.current.arn) full access second, then grant service principals (s3.amazonaws.com, logs.amazonaws.com, rds.amazonaws.com) the necessary GenerateDataKey and Decrypt permissions. The application data KMS key must also include permissions for rds.amazonaws.com service principal with Encrypt, Decrypt, ReEncrypt, GenerateDataKey, and DescribeKey actions. Set deletion_window_in_days to seven for testing cleanup and create aliases like "alias/payment-app-prd" for easier reference.

### Application Load Balancer with WAF

Deploy an internet-facing Application Load Balancer in public subnets with an HTTP listener on port 80 forwarding to the ECS target group. Configure health checks on root path "/" accepting status codes 200-399, with 15-second interval, 5-second timeout, 2 healthy threshold, and 3 unhealthy threshold for detection within 45 seconds to meet the 60-second scaling requirement. Set enable_deletion_protection to false. Create a WAFv2 Web ACL with AWSManagedRulesCommonRuleSet, AWSManagedRulesKnownBadInputsRuleSet, and a rate-based rule limiting requests to 2000 per five minutes per IP for DDoS protection. Associate the Web ACL with the ALB using explicit depends_on.

### ECS Fargate Service with Graviton2

Create an ECS cluster with Container Insights enabled. Define a task definition using ARM64 architecture (Graviton2) with 1 vCPU and 2048 MB memory on Fargate LATEST platform. Configure the container with port 80 exposed, environment variables for Aurora endpoint and S3 bucket name, and CloudWatch Logs integration using awslogs driver with 90-day retention and KMS encryption. Deploy the ECS service in private subnets with desired_count of 2, deployment_minimum_healthy_percent of 50, and awsvpc network mode. Add explicit depends_on to IAM task execution role and policy attachments, ALB listener, and Aurora cluster to ensure proper creation order.

### Auto-Scaling Configuration

Configure Application Auto Scaling with minimum 2 and maximum 10 tasks using target tracking policy based on ALBRequestCountPerTarget with target_value of 1000 requests. Set both scale_in_cooldown and scale_out_cooldown to 60 seconds to meet the rapid response requirement. The 15-second health check interval combined with 60-second cooldown ensures total response time within the required 60 seconds.

### Aurora PostgreSQL Cluster

Use data source aws_rds_engine_version to dynamically discover the latest available Aurora PostgreSQL version with preferred_versions ["16.1", "15.5", "15.4", "14.10", "14.9", "13.14", "13.13"] and latest true for automatic version selection. Create cluster and DB parameter groups using the dynamic parameter_group_family from the data source. Configure cluster parameter group with log_statement "all" and log_min_duration_statement "1000" for audit logging. Configure DB parameter group with shared_preload_libraries "pg_stat_statements" for performance monitoring. Deploy the cluster using db.r6g.large instances (Graviton2) in database subnets across both availability zones. Create one writer instance and one reader instance with reader depending on writer for high availability with storage encrypted using the database KMS key. Configure backup_retention_period to 30 days with preferred_backup_window "03:00-04:00", apply_immediately true, and enable enhanced monitoring at 60-second intervals with dedicated IAM role. Generate master password using random_password with 16 characters excluding problematic special characters, store in Secrets Manager with unique name using random_id 4-byte suffix and recovery_window_in_days set to zero for immediate deletion during cleanup. Set skip_final_snapshot to true, deletion_protection to false, and publicly_accessible to false. Configure the security group allowing inbound 5432 only from ECS security group.

### S3 and CloudFront for Static Assets

Create an S3 bucket using naming pattern "s3-payment-static-prd-ACCOUNT_ID" for global uniqueness. Enable versioning and server-side encryption using the S3 KMS key with bucket-key-enabled. Implement all four public access block settings and configure the bucket policy with root account access first, current user access second, then CloudFront OAI GetObject permission third, followed by statement denying insecure transport. Set force_destroy to true and configure lifecycle rules with required filter block transitioning to Intelligent-Tiering after 30 days. Create a CloudFront Origin Access Identity and deploy a distribution with the S3 origin, PriceClass_100, viewer protocol policy "redirect-to-https", and minimum TLS 1.2.

### Security Groups

Create three security groups using naming pattern without "sg-" prefix (AWS adds this automatically). ALB security group with name "alb-payment-prd" allows inbound 80/443 from 0.0.0.0/0 and outbound to ECS security group on port 80. ECS tasks security group with name "ecs-tasks-payment-prd" allows inbound 80 from ALB security group, outbound 443 to 0.0.0.0/0 for ECR image pulls, and outbound 5432 to Aurora security group. Aurora security group with name "aurora-payment-prd" allows inbound 5432 from ECS security group only with no explicit outbound rules. Use separate aws_security_group_rule resources instead of inline rules to prevent circular dependencies and add descriptions for compliance auditing.

### IAM Roles and Policies

Create IAM roles following least privilege with no wildcard permissions. The ECS execution role needs ECR pull permissions (ecr:GetAuthorizationToken, ecr:BatchCheckLayerAvailability, ecr:GetDownloadUrlForLayer, ecr:BatchGetImage on all resources), CloudWatch Logs (logs:CreateLogStream, logs:PutLogEvents on specific log group ARN with :* suffix), Secrets Manager (secretsmanager:GetSecretValue on Aurora password secret ARN), and KMS (kms:Decrypt, kms:GenerateDataKey on CloudWatch KMS key ARN) for log encryption. The ECS task role needs S3 permissions (s3:GetObject, s3:PutObject on static assets bucket with /* suffix) and KMS (kms:Decrypt, kms:GenerateDataKey on both app_data and s3 KMS key ARNs). Define all policies using aws_iam_policy_document data sources with specific resource ARNs and add explicit depends_on before creating ECS service.

### CloudWatch Monitoring

Create CloudWatch log groups for ECS containers and VPC Flow Logs with retention_in_days set to 90 for PCI compliance and KMS encryption using the CloudWatch KMS key. Implement alarms for ECS CPU/memory utilization (threshold 75%, 2 evaluation periods of 5 minutes), ALB target response time (threshold 0.5 seconds, 2 evaluation periods of 1 minute), ALB unhealthy hosts (threshold 1, 2 evaluation periods of 1 minute), Aurora CPU (threshold 80%, 2 evaluation periods of 5 minutes), and database connections (threshold 80 connections, 2 evaluation periods of 5 minutes). Configure all alarms to publish to an SNS topic encrypted with app_data KMS key for alerting.

## Provider Configuration

Configure Terraform 1.5 or higher with AWS provider version ~> 5.0. Include random provider ~> 3.6 for password and ID generation. Deploy to us-east-1 with default_tags applying Environment "prd", Application "payment-processing", ManagedBy "terraform", Owner "platform-team", CostCenter "engineering", and Compliance "pci-dss". Define variables for environment (default "prd"), availability_zones (default ["us-east-1a", "us-east-1b"]), ecs_task_cpu (default "1024"), ecs_task_memory (default "2048"), ecs_min_tasks (default 2), ecs_max_tasks (default 10), aurora_instance_class (default "db.r6g.large"), and backup_retention_days (default 30).

## Resource Naming

Follow the pattern {resource-type}-{purpose}-{environment} like "vpc-payment-prd", "aurora-payment-prd", "ecs-payment-cluster-prd". S3 buckets append account ID for global uniqueness. Security group names must not include "sg-" prefix as AWS adds this automatically. Secrets Manager secrets must include random_id suffix for uniqueness during rapid redeploy cycles.

## Data Source Restrictions

Use data.aws_caller_identity.current for account ID, data.aws_region.current for region name, data.aws_availability_zones.available with state filter for AZ discovery, data.aws_rds_engine_version.postgresql for dynamic Aurora version selection, and data.aws_iam_policy_document for IAM policy construction. Don't reference existing infrastructure.

## Code Documentation Requirements

All Terraform code must include detailed comment blocks explaining each section's purpose, configuration choices, dependencies, and PCI-DSS compliance rationale. Use multi-line comments before resource blocks and inline comments for complex IAM policies and security group rules. Document why specific fixes were made (e.g., security group naming, Aurora version discovery, health check paths).

## File Organization

Structure with lib/provider.tf containing version constraints, provider configuration with default_tags, and variable definitions. The lib/main.tf contains all data sources (caller identity, region, availability zones, RDS engine version), KMS keys with service principals, VPC networking (VPC, subnets, IGW, NAT gateways, route tables, flow logs, S3 bucket), security groups with rules, Aurora cluster (password, secrets, subnet group, parameter groups, cluster, instances, monitoring role), ECS cluster and service (log group, execution role, task role, task definition, service, capacity providers), ALB with WAF (ALB, target group, listener, WAF Web ACL, association), S3 with CloudFront (bucket with policies and lifecycle, OAI, distribution), auto-scaling, CloudWatch resources (alarms, log groups), SNS topic, and comprehensive outputs.

## Cleanup Configuration

Set force_destroy to true on S3 buckets, deletion_window_in_days to seven on KMS keys, recovery_window_in_days to zero on Secrets Manager secrets, skip_final_snapshot to true and deletion_protection to false and apply_immediately to true on Aurora cluster and instances, enable_deletion_protection to false on ALB. Ensure ECS service has lifecycle ignore_changes for desired_count to prevent auto-scaling conflicts.

## Integration Testing Outputs

Provide 21 comprehensive outputs including vpc_id, public_subnet_ids, private_subnet_ids, database_subnet_ids, nat_gateway_ids, kms_key_app_data_arn, kms_key_s3_arn, kms_key_cloudwatch_arn, s3_bucket_static_assets_name, s3_bucket_flow_logs_name, cloudfront_distribution_domain_name, alb_dns_name, alb_arn, waf_web_acl_arn, ecs_cluster_arn, ecs_service_name, aurora_cluster_endpoint, aurora_reader_endpoint, aurora_engine_version (showing actual deployed version), secrets_manager_secret_arn (sensitive), security_group_alb_id, security_group_ecs_tasks_id, security_group_aurora_id, sns_topic_arn, region, and account_id for complete infrastructure validation and integration.
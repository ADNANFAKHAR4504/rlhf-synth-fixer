# Production Video Streaming Platform Infrastructure

## Business Context

Hey, we need to build production-ready infrastructure for our video streaming platform that'll serve millions of users globally with both static content and dynamic API endpoints. The architecture must handle automatic scaling during traffic spikes like live events while maintaining high availability for our database tier and fast content delivery through a CDN. **We'll use Terraform with HCL** to create this multi-tier infrastructure in us-west-2 with proper network segmentation, auto-scaling capabilities, and comprehensive monitoring.

## VPC Network Architecture

Create a VPC with CIDR 10.0.0.0/16 containing three public subnets (10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24) and three private subnets (10.0.11.0/24, 10.0.12.0/24, 10.0.13.0/24) across three different availability zones for high availability. Enable DNS hostnames and DNS support, create an Internet Gateway for public subnet internet access, and deploy a single NAT Gateway in the first public subnet with an Elastic IP for cost-effective outbound internet access from private subnets. Set up route tables where public subnets route to the Internet Gateway and private subnets route to the NAT Gateway for secure outbound connectivity.

## Aurora MySQL Database Cluster

Create an Aurora MySQL-compatible cluster with Multi-AZ deployment providing automatic failover between primary and standby instances in different availability zones. Use db.t3.small instance class for cost-effective testing, configure a DB subnet group spanning all three private subnets, and enable automated backups with seven-day retention. Encrypt storage using a customer-managed KMS key, set skip_final_snapshot to true and deletion_protection to false for clean testing teardown, and configure the cluster with master username and password stored in variables. Create a separate parameter group if custom MySQL settings are needed, though default parameters work fine for testing.

## Application Load Balancer and Auto Scaling

Set up an internet-facing Application Load Balancer in the three public subnets with an HTTP listener on port 80 since HTTPS would require ACM certificate validation which involves manual DNS confirmation. Create a target group for EC2 instances with health checks on port 80 using path "/health" with thresholds allowing two consecutive successes for healthy status and two failures for unhealthy. Define a launch template using Amazon Linux 2023 AMI with t3.micro instance type, specifying user data that installs a simple web server for testing, and attach the EC2 security group plus an IAM instance profile. Configure an Auto Scaling Group spanning the three private subnets with minimum three instances, maximum twenty instances, and desired capacity of three, using target tracking scaling policy maintaining average CPU utilization around seventy percent. Set enable_deletion_protection to false on the ALB and force_delete to true on the ASG for clean testing teardown.

## CloudFront Content Delivery Network

Create a CloudFront distribution with two origins—an S3 bucket origin for static assets like thumbnails and CSS files, and a custom origin pointing to the ALB DNS name for dynamic API requests. Configure the default cache behavior to forward requests to the ALB origin with allowed methods including GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE, and set up a second cache behavior with path pattern "/static/*" routing to the S3 origin with caching enabled. Use the default CloudFront certificate for HTTPS rather than a custom ACM certificate to avoid manual validation, enable the distribution immediately, and configure basic error responses for 404 and 500 status codes. Set the price class to "PriceClass_100" for cost optimization during testing, covering North America and Europe edge locations.

## S3 Storage Buckets

Create three S3 buckets using the naming pattern "s3-{purpose}-dev-ACCOUNT_ID" for global uniqueness—one for static assets that CloudFront will serve, one for application logs from EC2 instances, and one for CloudFront access logs. Enable versioning on all buckets, configure server-side encryption using KMS with customer-managed keys, and implement all four public access block settings preventing any public access. Set force_destroy to true on all buckets for clean testing teardown, and configure lifecycle rules with the required filter block on the CloudFront logs bucket transitioning objects to Glacier after seven days and expiring them after thirty days. Add bucket policies denying unencrypted uploads while ensuring root account access first to prevent lockouts.

## Security Groups and Network Security

Create three security groups following least privilege principles—an ALB security group allowing inbound HTTP on port 80 from anywhere (0.0.0.0/0) for public web access, an EC2 security group allowing inbound traffic on port 80 only from the ALB security group, and an Aurora security group allowing inbound MySQL traffic on port 3306 only from the EC2 security group. Use separate aws_security_group_rule resources instead of inline rules to prevent circular dependency issues when security groups reference each other. All security groups should allow all outbound traffic for application functionality and software updates.

## IAM Roles and Policies

Create an IAM role for EC2 instances with an assume role policy allowing the EC2 service to assume it, then attach policies granting permissions to write logs to the application logs S3 bucket (s3:PutObject on specific bucket ARN), publish CloudWatch metrics and logs (cloudwatch:PutMetricData, logs:CreateLogGroup, logs:CreateLogStream, logs:PutLogEvents), and decrypt using the KMS key for S3 encryption (kms:Decrypt, kms:GenerateDataKey). Define all policies using aws_iam_policy_document data sources with specific resource ARNs rather than wildcards to follow least privilege principles. Set maximum session duration to 3600 seconds and add explicit depends_on for both the role and policy attachments before creating the launch template to handle IAM eventual consistency.

## KMS Encryption Keys

Create two customer-managed KMS keys—one for Aurora database encryption and one for S3 bucket encryption. Each key must enable automatic rotation and include a key policy allowing the root account full access to prevent lockouts, plus granting service principals the necessary permissions (rds.amazonaws.com for RDS key, s3.amazonaws.com for S3 key) to use GenerateDataKey and Decrypt operations. Set deletion_window_in_days to seven for quick testing cleanup and create aliases like "alias/aurora-encryption-dev" and "alias/s3-encryption-dev" for easier reference in resource configurations.

## CloudWatch Monitoring and Alarms

Create separate CloudWatch log groups for application logs with retention_in_days set to one for testing, and implement metric-based CloudWatch alarms for critical infrastructure health. Set up alarms monitoring Auto Scaling Group average CPU utilization triggering when it exceeds eighty percent for two consecutive five-minute periods, ALB unhealthy target count triggering when any targets are unhealthy for two consecutive periods, and Aurora CPU utilization triggering when it exceeds seventy-five percent. Configure all alarms to publish notifications to an SNS topic, and create CloudWatch dashboard displaying key metrics for ALB request count, target response time, EC2 CPU utilization, and Aurora connections.

## SNS Notification Topic

Create an SNS topic for CloudWatch alarm notifications using KMS encryption for messages in transit, but don't add email subscriptions since those require manual confirmation clicking a verification link. The topic will be referenced by CloudWatch alarms for publishing alert notifications, and in production environments email subscriptions would be added after deployment through the AWS console. Configure the topic policy allowing CloudWatch service principal to publish messages.

## Route 53 DNS Management

Create a Route53 hosted zone for "streaming-platform-dev.example.com" which can be created without owning the actual domain for testing infrastructure deployment, then add two alias records pointing to the infrastructure endpoints. Create an A record for "cdn.streaming-platform-dev.example.com" as an alias to the CloudFront distribution, and another A record for "api.streaming-platform-dev.example.com" as an alias to the Application Load Balancer. Set evaluate_target_health to true on the ALB alias record for automatic failover if the load balancer becomes unhealthy.

## Provider Configuration

Configure Terraform 1.5 or higher with AWS provider version constrained to 5.x using pessimistic operator (~> 5.0) since the labeling tool requires provider version 5.x compatibility. Deploy all resources to us-west-2 with default_tags applying Environment set to "dev", Project set to "video-streaming", and ManagedBy set to "terraform" automatically to every resource. Define an environment variable with type string and default "dev" for resource naming consistency across all infrastructure components.

## Resource Naming Convention

Follow the deterministic naming pattern {resource-type}-{purpose}-{environment} for all resources like "alb-web-dev", "asg-app-dev", "aurora-cluster-dev", or "kms-aurora-encryption-dev" ensuring consistent identification. S3 buckets require AWS account ID appended for global uniqueness like "s3-static-assets-dev-ACCOUNT_ID" using the data.aws_caller_identity.current.account_id value. Don't use random_string resources in naming since that causes integration test failures when resource names change between applies.

## Data Source Restrictions

Only use data.aws_caller_identity.current for retrieving the AWS account ID, data.aws_region.current for the region name, data.aws_availability_zones.available for selecting availability zones dynamically, and data.aws_ami for finding the latest Amazon Linux 2023 AMI. Don't use data sources referencing existing VPCs, subnets, security groups, or any other existing infrastructure—create all networking and security resources fresh as part of this configuration.

## File Organization

Structure the code with lib/provider.tf containing Terraform version constraint requiring 1.5 or higher, AWS provider configuration with region and default_tags, and variable definitions for environment and any other configurable values. The lib/main.tf file should contain data sources for caller identity, region, availability zones, and AMI lookup, followed by all infrastructure resources organized logically—KMS keys, VPC networking components, security groups, IAM roles, S3 buckets, Aurora cluster, ALB and target group, launch template and Auto Scaling Group, CloudFront distribution, Route53 hosted zone, CloudWatch alarms, SNS topic, and finally comprehensive outputs at the end.

## Cleanup Configuration

Set force_destroy to true on all S3 buckets allowing Terraform destroy to delete buckets even with objects inside, deletion_window_in_days to seven on KMS keys for quick testing cleanup, retention_in_days to one on CloudWatch log groups, and enable_deletion_protection to false on the Application Load Balancer. Configure the Aurora cluster with skip_final_snapshot set to true and deletion_protection set to false so it can be destroyed without requiring a final snapshot. Set force_delete to true on the Auto Scaling Group allowing it to terminate all instances during destruction, and ensure CloudFront distribution includes enabled set to true so Terraform can disable and delete it cleanly.

## Outputs

Provide comprehensive outputs for all major resources including VPC ID and CIDR block (2 outputs), public and private subnet IDs as lists (2 outputs), Internet Gateway and NAT Gateway IDs (2 outputs), security group IDs for ALB, EC2, and Aurora (3 outputs), S3 bucket names and ARNs for all three buckets (6 outputs), KMS key IDs and ARNs for both keys (4 outputs), Aurora cluster ID, endpoint, and reader endpoint (3 outputs), ALB ARN, DNS name, and target group ARN (3 outputs), Auto Scaling Group name and ARN (2 outputs), CloudFront distribution ID and domain name (2 outputs), Route53 hosted zone ID and name servers (2 outputs), IAM role ARN for EC2 instances (1 output), CloudWatch alarm names (4 outputs), and SNS topic ARN (1 output). All outputs should include descriptions explaining their purpose, with sensitive outputs like database credentials marked with sensitive equals true, providing minimum 35-40 total outputs for comprehensive integration testing validation.
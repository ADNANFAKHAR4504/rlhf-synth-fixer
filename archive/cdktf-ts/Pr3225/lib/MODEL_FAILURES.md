### Model Failures

### 1. Incomplete & Superficial Implementation
** Model Response: **
Only sets up a basic VPC, subnets, and providers. Missing critical production-ready components like NAT gateways, route tables, security groups, RDS, EC2 ASG with Launch Templates, ALB, IAM, CloudWatch monitoring, S3, and EBS snapshots.

** Actual Implementation:**
Includes a full production-ready architecture:
Multi-AZ VPC with public/private subnets
NAT Gateways and Internet Gateways
Route Tables with proper associations
Security Groups with least-privilege rules
RDS with Multi-AZ and encrypted storage
EC2 Auto Scaling Groups with Launch Templates behind ALB
IAM roles and policies scoped per service
CloudWatch monitoring and alarms
S3 buckets with encryption and lifecycle policies
EBS snapshots for backups

### 2. Missing Modularity & Resource Separation
** Model Response: **
Lacks modular constructs; all resources are defined inline. No reusable modules, making it difficult to extend or maintain.

** Actual Implementation: **
Organizes resources into reusable modules:
VpcModule for VPC and networking
SubnetModule for public/private subnets
RdsModule for databases
ALBModule for load balancers
EC2Module for compute resources
S3Module for storage
Modules allow parameterization, reuse, and clean separation

### 3. No Security & Compliance Considerations
** Model Response: **
Omits all security measures: unencrypted storage, overly permissive security groups, public S3 access, and unrestricted IAM roles.

** Actual Implementation: **
Enforces security best practices:
Encryption at rest for RDS, S3, and EBS
Security groups with minimal required ingress/egress
S3 public access blocked
Scoped IAM roles and policies
Secrets stored securely (SSM Parameter Store or Secrets Manager)

### 4. No High Availability & Scalability
** Model Response: **
Provides single-instance resources with no load balancer or scaling configuration. Not resilient or production-ready.

** Actual Implementation: **
Ensures HA and scalability:
Auto Scaling Groups with Launch Templates for EC2
Multi-AZ RDS clusters
ALB for distributing traffic across instances
Health checks and scaling policies configured

### 5. No Monitoring or Backup Strategy
** Model Response: **
Ignores monitoring and observability entirely. No CloudWatch alarms, logging, or backup strategy.

** Actual Implementation: **
CloudWatch alarms for CPU, memory, and error metrics
Logging enabled for EC2, RDS, and API Gateway
EBS snapshot lifecycle policies for backups
CloudWatch dashboards for operational visibility

### 6. Tagging & Governance

** Model Response: **
Either hardcodes tags or skips them entirely. No governance or resource tracking.

** Actual Implementation:** 
Consistent tagging strategy across all resources using createTags function
Tags include environment, project, owner, and cost center
Facilitates governance, cost allocation, and compliance reporting
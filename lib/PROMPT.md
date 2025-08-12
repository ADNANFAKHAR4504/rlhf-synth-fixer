# Secure Production Environment Infrastructure

I need help creating a secure production environment on AWS with a multi-tier architecture. The infrastructure should be robust, scalable, and follow AWS security best practices.

## Core Requirements

Please create a complete AWS infrastructure with the following components:

**Networking & Security:**
- VPC with public and private subnets across two availability zones for high availability
- Internet Gateway and NAT Gateways for secure internet access
- Security groups with least privilege access
- All resources must be tagged with 'Environment:Production'

**Compute & Application Layer:**
- EC2 instances in private subnets behind an Application Load Balancer
- Auto Scaling Group that scales based on CPU utilization above 70%
- Application Load Balancer in public subnets to distribute traffic
- All EBS volumes must be encrypted using AWS managed KMS keys

**Database & Storage:**
- RDS MySQL database in private subnets with Multi-AZ deployment for high availability
- S3 bucket with server-side encryption enabled
- Database should be accessible only from the application instances

**Monitoring & Observability:**
- CloudWatch Logs for application and system monitoring
- CloudWatch alarms for key metrics like CPU utilization
- Include AWS Application Signals for automatic application monitoring
- CloudWatch Synthetics canary for endpoint monitoring

**Security & Compliance:**
- IAM roles and policies following least privilege principle
- KMS keys for encryption at rest
- Restrict database access to application tier only
- Secure parameter store for configuration management

The infrastructure should be deployed in us-east-1 region and support a production workload with proper security controls and monitoring.

Please provide the complete infrastructure code with proper AWS CDK TypeScript implementation. Each component should be in a separate code block for different files as needed.
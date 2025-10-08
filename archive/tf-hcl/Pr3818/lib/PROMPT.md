I need to set up infrastructure for a job board platform that handles about 4,300 daily active users. The platform needs to support secure messaging between job seekers and employers, along with profile management features.

Here's what I need deployed in us-east-1:

Network Setup:
- VPC with 172.16.0.0/16 CIDR block
- Two public subnets and two private subnets across different availability zones
- Internet Gateway and NAT Gateway for proper routing
- Route tables configured appropriately

Load Balancing and Compute:
- Application Load Balancer in the public subnets
- EC2 Auto Scaling group with t3.medium instances
- Minimum 3 instances, maximum 8 instances
- ALB health checks running every 30 seconds
- Target group for the ALB

Database:
- RDS MySQL database deployed in the private subnets
- Multi-AZ deployment enabled for high availability
- Appropriate instance size for the workload

Storage:
- S3 bucket for storing resume uploads with proper versioning
- Use S3 Express One Zone for frequently accessed resumes to improve performance

Security:
- Security groups for web tier allowing HTTP/HTTPS traffic
- Security groups for database tier allowing only traffic from web tier
- All databases must be in private subnets, not accessible from internet

Monitoring:
- CloudWatch alarms for monitoring CPU utilization on the auto scaling group
- CloudWatch log groups for application logs
- Use CloudWatch Application Signals to monitor application health and performance

Make sure the web tier and database tier are completely separated into different subnets. The RDS instance should be configured for fast provisioning if possible.

Please provide the complete Terraform infrastructure code with one code block per file.
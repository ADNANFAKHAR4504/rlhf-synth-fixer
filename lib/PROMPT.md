Generate a complete, production-grade AWS CloudFormation YAML template that provisions a high-availability infrastructure in the us-west-2 region. The template must include the following:

VPC with CIDR block and tagging (environment:production), including:

At least two public subnets in different availability zones

At least two private subnets in different availability zones

Internet Gateway and NAT Gateway for internet access

Route tables configured for public/private routing

Amazon RDS (PostgreSQL or MySQL) instance:

Multi-AZ deployment with automatic failover

KMS-encrypted backups

CloudWatch alarms on RDS instance status

Application Load Balancer (ALB):

Deployed across multiple AZs using public subnets

With a Target Group and EC2 Auto Scaling Group

EC2 health checks configured

Failover DNS record using Route 53

Auto Scaling Policy based on CPU or request metrics

EC2 Instances:

Deployed in private subnets using the Launch Template or Configuration

Tagged appropriately and registered with ALB target group

S3 Bucket:

Bucket policy that only allows HTTPS traffic

Optional: block public access, restrict IAM principals

Monitoring:

CloudWatch Alarms to monitor RDS status and optionally EC2 CPU usage

Outputs:

Export the ALB DNS Name using Outputs section

All resources must be tagged with environment:production, and the template should be error-free and deployable in AWS CloudFormation.
I need to build infrastructure for a marketplace platform that handles 8,400 daily users connecting buyers and sellers. The platform needs to support secure transactions and inventory management.

Please create AWS CDK Python infrastructure code for us-east-2 region with the following components:

Network Setup:
- VPC with CIDR 172.31.0.0/16
- Public and private subnets across 3 availability zones
- Internet Gateway and NAT Gateways
- Proper route tables

Application Layer:
- Application Load Balancer in public subnets with connection draining enabled
- EC2 Auto Scaling group with t3.large instances, scaling between 4 and 10 instances based on CPU
- Target group configuration with health checks

Database Layer:
- Aurora MySQL Serverless v2 cluster deployed across 3 availability zones for high availability
- Multi-AZ configuration with automatic failover
- Database subnet group

Caching Layer:
- ElastiCache Redis cluster with cluster mode enabled using 6 shards
- Redis subnet group

Storage and CDN:
- S3 bucket for storing product images
- CloudFront distribution pointing to the S3 bucket

Security:
- Security groups implementing three-tier architecture:
  * ALB security group allowing HTTP/HTTPS traffic
  * EC2 security group allowing traffic only from ALB
  * Database security group allowing traffic only from EC2 instances
  * Redis security group allowing traffic only from EC2 instances

Monitoring:
- CloudWatch dashboard for business metrics
- CloudWatch alarms for CPU utilization and request counts

Requirements:
- Use Aurora Serverless v2 with appropriate ACU configuration
- Configure ElastiCache with cluster mode enabled using 6 shards
- Enable connection draining on the load balancer
- All resources should use meaningful names and be properly tagged
- Include exports for important resource IDs

Please provide the complete infrastructure code in separate files for each logical component.
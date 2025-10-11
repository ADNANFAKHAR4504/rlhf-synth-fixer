# Wiki Platform Infrastructure

I need infrastructure code in CDK TypeScript to deploy a wiki platform in us-east-2 region. The platform will handle 6,400 collaborative edits daily.

## Network Configuration
Create a VPC with CIDR 10.200.0.0/16 with public and private subnets across multiple availability zones.

## Core Components
- Application Load Balancer in public subnets
- EC2 Auto Scaling Group with t3.small instances (minimum 2, maximum 5) in private subnets
- RDS PostgreSQL database (use the latest engine version) with automated backups enabled for 14 days retention
- ElastiCache Redis cluster for page caching
- Amazon OpenSearch domain with 2 data nodes for full-text search capabilities
- S3 bucket for media file uploads

## Security
Configure Security Groups to segment network traffic between components. Only the ALB should be accessible from the internet.

## Monitoring
Set up CloudWatch metrics to track edit activity.

## Additional Requirements
- Use VPC Lattice for service discovery between components
- Configure RDS Performance Insights for database monitoring
- All resources should be properly tagged

Please provide the complete infrastructure code with one code block per file.
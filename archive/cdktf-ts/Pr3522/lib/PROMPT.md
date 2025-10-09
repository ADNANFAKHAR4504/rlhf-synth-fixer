Create infrastructure code in CDKTF TypeScript for a portfolio tracking platform in us-west-1.

Requirements:
- VPC with CIDR 172.32.0.0/16 with public and private subnets across multiple availability zones
- Application Load Balancer in public subnets with target group for EC2 instances
- Auto Scaling Group with EC2 instances (t3.medium) in private subnets with min 2, max 6 instances
- RDS PostgreSQL database for holdings data with Blue/Green deployment support enabled
- ElastiCache for Valkey Serverless for market data caching with 1-minute TTL
- S3 bucket for historical data storage with versioning enabled
- API Gateway WebSocket API for real-time price updates
- Security Groups for network isolation between components
- CloudWatch Dashboard for trading metrics monitoring
- RDS read replica in a different availability zone for reporting queries
- ALB configured to support WebSocket connections to API Gateway

Generate the complete infrastructure code with proper resource configurations and dependencies. Include all necessary imports and configurations in TypeScript format. Provide each file as a separate code block.
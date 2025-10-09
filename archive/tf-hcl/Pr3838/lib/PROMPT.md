I need to set up a blogging platform infrastructure in AWS us-east-2 region that can handle 5,200 daily content creators. The platform needs to support media uploads and comment moderation with high availability.

The infrastructure should include:

1. A VPC with CIDR block 192.168.0.0/16 with public and private subnets across multiple availability zones

2. An Application Load Balancer with SSL termination to distribute traffic across web servers

3. EC2 Auto Scaling group using t3.small instances, scaling between 2 to 5 instances based on demand

4. RDS Aurora PostgreSQL cluster with 2 read replicas for the database layer

5. ElastiCache Redis cluster to implement cache-aside pattern for session management and reducing database load

6. S3 bucket for storing media files (images, videos) uploaded by content creators

7. CloudFront distribution for fast content delivery of static media to users globally

8. Security Groups configured for multi-tier architecture (ALB, web tier, cache tier, database tier)

9. CloudWatch dashboards and alarms for monitoring the infrastructure health

Important requirements:
- The Aurora cluster must be deployed with exactly 2 read replicas
- Redis should be configured for cache-aside pattern
- ALB deregistration delay must be set to 30 seconds
- Use Aurora Serverless v2 for faster scaling and cost optimization
- Configure CloudFront with continuous deployment support for safe configuration updates

Please provide the complete Terraform infrastructure code with all necessary configuration files. Each file should be in a separate code block with proper resource definitions, security configurations, and outputs.

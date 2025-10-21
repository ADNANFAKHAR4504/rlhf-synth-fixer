I need to create infrastructure for a streaming media platform that serves South American customers. The platform needs to process real-time streaming metrics, cache content efficiently, and store metadata reliably.

The infrastructure should be deployed in the sa-east-1 region using CDKTF with Python.

Core requirements:
- Set up Kinesis Data Streams for ingesting streaming analytics data in real-time
- Configure ElastiCache Redis cluster with Multi-AZ for content caching with the new 99.99% availability SLA
- Deploy Aurora RDS PostgreSQL with multi-AZ and read replicas for metadata storage
- Create API Gateway REST APIs for content delivery endpoints
- Deploy ECS Fargate services to process streaming content
- Use Secrets Manager to store DRM keys and database credentials
- Implement CloudWatch monitoring with alarms for key metrics
- Configure VPC with public and private subnets across multiple availability zones
- Set up security groups and IAM roles with least privilege access
- Enable auto-scaling for ECS tasks based on CPU and memory
- Add encryption at rest and in transit for all data stores

Security considerations:
- All data at rest should be encrypted
- Use VPC endpoints where applicable
- Implement proper IAM roles and policies
- Enable CloudWatch logging for API Gateway and ECS

High availability requirements:
- Multi-AZ deployment for all stateful services
- Auto-scaling configuration for compute resources
- Health checks and automatic failover
- CloudWatch alarms for monitoring service health

Please provide the complete infrastructure code with one code block per file. Include all necessary imports and configurations. Make sure the code follows CDKTF Python best practices.
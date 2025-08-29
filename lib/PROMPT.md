Design and implement a robust CI/CD pipeline for deploying infrastructure across AWS accounts using Pulumi's Python SDK. The pipeline must integrate with GitHub Actions and be capable of handling multiple AWS regions configurable via pipeline variables.

Requirements: 

1. Create a complete Pulumi Python project with proper project structure and dependencies
2. Implement comprehensive AWS infrastructure including VPC with public/private subnets across 2 AZs, ECS Fargate cluster for microservices, RDS PostgreSQL with Multi-AZ, ElastiCache Redis cluster, Application Load Balancer with health checks, ECR private registry, S3 buckets for artifacts, CloudFront distribution, and CloudWatch monitoring
3. Design GitHub Actions workflow with stages for build, test, security scanning, infrastructure deployment, application deployment, and integration testing
4. Include automated testing with unit tests achieving >50% code coverage and integration tests validating real AWS resources
5. Implement multi-region deployment capabilities with region-specific configurations
6. Configure secrets management using AWS Secrets Manager and GitHub Secrets
7. Add blue-green deployment strategy for zero-downtime deployments
8. Include rollback mechanisms and automated disaster recovery procedures
9. Implement comprehensive monitoring and alerting using CloudWatch and SNS
10. Configure auto-scaling policies for ECS services based on CPU/memory metrics
11. Add security best practices including IAM roles with least privilege, VPC security groups, encryption at rest and in transit, and CloudTrail audit logging
12. Create detailed documentation including deployment runbooks and troubleshooting guides

The solution must be production-ready with enterprise-level security, scalability, and automation. All resources must be tagged with Environment: Production, Project: MicroservicesCI, Owner: DevOps. Include comprehensive error handling and validation throughout the pipeline.

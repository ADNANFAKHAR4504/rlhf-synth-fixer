I need to create a multi-environment AWS infrastructure solution using CDK with TypeScript that ensures consistency across multiple environments and regions. 

The solution should include:

1. Parameterized CDK stacks that allow environment-specific configurations
2. VPC settings that remain consistent across all environments
3. IAM roles and policies following the principle of least privilege
4. S3 buckets with cross-region replication for data durability and availability
5. CloudWatch monitoring and logging for enhanced observability across environments
6. Automated procedures for stack updates and version control

Please create infrastructure code that allows seamless multi-environment consistency and replication for AWS deployments across multiple regions. The solution should focus on strong configuration management and operational reliability.

I want to use the latest AWS features like CloudWatch Container Insights with enhanced observability and ECS Service Connect for improved monitoring and service communication.

Please provide the complete infrastructure code with proper comments explaining each resource's purpose. The main stack file should be named 'multi-env-stack.ts' and should be fully operational to meet all requirements.
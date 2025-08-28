I need help creating a comprehensive cloud environment setup using AWS CDK for a multi-tier web application with modern AI capabilities. The infrastructure should support a production-ready environment with the following requirements:

1. **Container Infrastructure**: 
   - Amazon EKS cluster with managed node groups for hosting containerized applications
   - Blue/green deployment capability for zero-downtime updates
   - Auto-scaling configuration to handle variable workloads

2. **AI/ML Integration**:
   - Amazon Bedrock integration with Nova foundation models for AI-powered features
   - Amazon SageMaker endpoint for custom ML model inference
   - Proper IAM roles and policies for AI service access

3. **Storage and Data**:
   - Amazon RDS Aurora Serverless v2 for the application database with automatic scaling
   - Amazon S3 buckets for static assets and data storage with intelligent tiering
   - Amazon ElastiCache Redis cluster for session management and caching

4. **Security and Monitoring**:
   - AWS WAF with pre-configured protection packs for web application security
   - Amazon GuardDuty for extended threat detection including EKS cluster monitoring
   - VPC with private subnets, NAT gateways, and proper security groups
   - AWS Systems Manager Parameter Store for secrets management

5. **Networking and Load Balancing**:
   - Application Load Balancer with SSL termination
   - CloudFront distribution for content delivery
   - Route 53 hosted zone for DNS management

6. **Operational Excellence**:
   - CloudWatch dashboards and alarms for monitoring
   - AWS Lambda functions for automated operational tasks
   - SNS topics for notifications

The solution should follow AWS best practices for security, cost optimization, and scalability. Use the latest AWS CDK Go constructs and ensure all resources are properly tagged for cost tracking. Include environment-specific naming conventions and implement proper resource cleanup policies.

Please provide the complete infrastructure code with one code block per file, ensuring the solution is ready for deployment in the us-east-1 region.
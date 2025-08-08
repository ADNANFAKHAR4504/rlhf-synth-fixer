I need help creating a multi-region AWS infrastructure using TypeScript CDK for a production application. The setup should span us-east-1 and us-west-2 regions with the following requirements:

**Network Infrastructure:**
- Deploy VPCs in both regions (us-east-1 and us-west-2) 
- Set up VPC peering connection between the regions for secure communication
- Configure appropriate subnets and routing tables

**Storage Requirements:**
- S3 buckets with encryption using unique KMS keys per bucket
- Implement server-side encryption with AWS KMS keys (SSE-KMS)

**Database Setup:**
- RDS instances in each region with Multi-AZ enabled for high availability
- DynamoDB global tables with multi-region strong consistency (the new 2025 feature)
- Ensure data synchronization between regions

**Compute and Load Balancing:**
- Lambda functions with proper IAM permissions for cross-region operations
- Application Load Balancer with path-based and domain-based routing
- Configure ALB to work with Lambda function targets

**Security and Monitoring:**
- IAM roles and policies for secure cross-region resource management
- CloudWatch centralized logging and alerting dashboards with Database Insights for RDS
- Use CloudWatch Database Insights for enhanced RDS monitoring

**Naming Convention:**
- Use 'prod-' prefix for production resources
- Ensure consistent naming across all resources

**Best Practices:**
- Follow AWS security best practices
- Implement proper resource dependencies
- Ensure cost optimization where possible
- Use AWS Free Tier compliant configurations where applicable

Please provide the complete infrastructure code with one code block per file. The solution should be production-ready and follow CDK best practices for multi-region deployments.
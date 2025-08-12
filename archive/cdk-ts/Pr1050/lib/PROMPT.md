I need to build a disaster recovery infrastructure using AWS CDK TypeScript for our company systems. The solution should provide high availability across multiple availability zones with automated failover capabilities.

Here's what I need:

1. Set up Route 53 with health check-based failover between two EC2 instances deployed in different AZs
2. Create an S3 bucket for backups with versioning enabled to protect against data loss
3. Configure CloudWatch alarms that monitor system health and trigger SNS notifications when thresholds are exceeded
4. Use AWS Elastic Disaster Recovery features where appropriate for enhanced recovery capabilities
5. Include proper IAM roles with least privilege access for all components
6. Apply corporate tagging with 'corp-' prefix for resource names

The infrastructure should be deployed in us-east-1 region and follow standard organizational naming conventions. Make sure the solution can handle automatic failover scenarios and provides comprehensive monitoring.

Please provide the CDK TypeScript infrastructure code with one code block per file.
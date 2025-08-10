I need help creating AWS CDK TypeScript infrastructure for a high-availability architecture with automatic failure recovery. The solution should meet these requirements:

1. Deploy across multiple Availability Zones in us-west-2 region using Elastic Load Balancers to distribute traffic
2. Create an Auto Scaling Group that dynamically adjusts EC2 instances based on demand
3. Set up Route 53 health checks for DNS failover capabilities
4. Use EBS and S3 for durable data storage with redundancy
5. Implement SSL/TLS encryption using AWS Certificate Manager with the load balancer
6. Configure CloudWatch monitoring with SNS notifications for operational alerts
7. Follow IAM security best practices with least privilege access
8. Design a comprehensive backup and disaster recovery strategy
9. Include multi-account deployment capabilities similar to CloudFormation StackSets
10. Leverage CDK's built-in update and rollback features

The infrastructure should be production-ready, cost-effective, and follow current AWS best practices. Consider using Amazon EKS Auto Mode for simplified container orchestration and take advantage of the latest AWS Graviton4 processors for improved performance where applicable.

Please provide complete infrastructure code with one code block per file that can be directly deployed.
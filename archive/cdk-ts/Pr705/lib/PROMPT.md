I need to build a multi-environment infrastructure that supports both production and development environments across three AWS regions: us-east-1, eu-central-1, and ap-southeast-1. 

The infrastructure should include:

1. Two isolated VPCs per region (one for production, one for development)
2. Each VPC needs public and private subnets across at least two Availability Zones
3. NAT gateways for secure internet access from private subnets
4. EC2 instances in private subnets behind an Application Load Balancer with health checks
5. Route 53 failover DNS routing for high availability across regions
6. S3 bucket with Cross-Region Replication for static content
7. IAM roles following least privilege principle
8. CloudWatch alarms for CPU and memory monitoring
9. Resource tagging with environment and application name
10. AWS Systems Manager Parameter Store for configuration management

Additionally, I want to leverage some of the latest AWS capabilities like Amazon EKS Ultra Scale for potential future container workloads and Amazon Bedrock AgentCore for AI agent deployment capabilities.

I also need to integrate two recent AWS services:

11. Amazon EventBridge Scheduler for automated infrastructure maintenance tasks like scheduled backups, scaling events, and routine maintenance operations. This should include flexible scheduling with time windows and retry policies.

12. Amazon VPC Lattice for service-to-service communication patterns between applications. Since AWS is discontinuing App Mesh, I want to use VPC Lattice as the modern service mesh solution for secure service networking across VPCs and accounts.

Please provide the complete infrastructure code. Each file should be in its own code block so I can copy and paste them directly.
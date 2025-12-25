I need to deploy a highly available web application across two AWS regions - us-east-1 and us-west-2 - with automatic failover capabilities. The architecture should handle traffic spikes and distribute traffic efficiently.

Key requirements:
- Deploy EC2 instances that serve HTTP traffic through Application Load Balancers in both regions
- The load balancers should distribute incoming requests across EC2 instances within each region
- Route 53 should route user requests to the appropriate region and provide automatic failover between regions
- VPC setup with public subnets that allow EC2 instances to receive traffic from load balancers
- EC2 instances connect to CloudWatch for monitoring and logging
- IAM roles attached to EC2 instances to allow access to Systems Manager and CloudWatch

The solution needs to be cost-effective while maintaining high availability. For LocalStack compatibility, use standalone EC2 instances instead of Auto Scaling Groups, and public subnets only - no NAT Gateways.

Please provide infrastructure code that creates one code block per file, with all necessary configuration for this multi-region web application deployment.
I need help creating infrastructure for a real estate property listing website that serves 5,600 property listings daily.

The infrastructure should be deployed in us-west-1 region and include the following components:

1. VPC with CIDR block 10.90.0.0/16 with public and private subnets across multiple availability zones

2. Application Load Balancer that supports path-based routing with sticky sessions enabled for consistent user experience

3. EC2 Auto Scaling group with the following specifications:
   - Instance type: t3.small
   - Minimum capacity: 2 instances
   - Maximum capacity: 6 instances
   - Auto Scaling policy based on CPU utilization with threshold of 70%
   - Use CloudWatch metrics for scaling decisions

4. Security Groups that allow:
   - HTTPS traffic (port 443) from anywhere
   - SSH access (port 22) only from within the VPC CIDR (10.90.0.0/16)
   - Appropriate security group rules for ALB to EC2 communication
   - Redis cache access from EC2 instances only

5. ElastiCache Redis cluster with cluster mode enabled for high availability and caching of property listing data

6. S3 bucket for storing property images with appropriate access policies

7. CloudWatch alarms and monitoring for the Auto Scaling group

Please provide the complete infrastructure code in CloudFormation YAML format. Each resource should be in a separate code block with the filename clearly indicated at the top. Make sure all resources are properly configured with necessary dependencies and follow AWS best practices.
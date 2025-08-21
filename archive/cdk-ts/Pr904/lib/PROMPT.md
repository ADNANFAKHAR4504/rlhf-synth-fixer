# AWS Infrastructure Setup Requirements

I need to set up a cloud environment using AWS CDK with TypeScript. The requirements are:

1. Create a VPC with CIDR block 10.0.0.0/16 that includes two public and two private subnets distributed across two availability zones in us-west-2 region.

2. Deploy EC2 instances in each public subnet. These instances should be part of an Auto Scaling Group that ensures there are always two instances running.

3. Set up a NAT gateway for the private subnets to enable outbound internet access without exposing the instances directly to the internet.

4. Configure security groups to allow SSH access to the EC2 instances from IP range 203.0.113.0/24 only.

5. Use AWS Compute Optimizer recommendations for the Auto Scaling Group to optimize costs and performance.

6. Implement Instance Scheduler on AWS for better control over EC2 Auto Scaling Group scheduling.

Please provide complete infrastructure code using AWS CDK with TypeScript. The solution should include proper resource naming with prefixes and cost tracking tags. Generate one code block per file that needs to be created or modified.
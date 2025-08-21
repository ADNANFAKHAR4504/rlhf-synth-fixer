I need to create a scalable AWS infrastructure using CDK TypeScript for a web application. The requirements are:

Create a VPC with proper network segmentation including public and private subnets across multiple availability zones for high availability. Set up an Auto Scaling group that can dynamically manage EC2 instances based on demand, ensuring we maintain at least two instances running at all times for redundancy.

The infrastructure should include an Internet Gateway for public internet access and proper route tables so that resources in public subnets can reach the internet while private subnets remain isolated. All EC2 instances need to be able to interact securely with AWS services using appropriate IAM roles.

Add an Application Load Balancer in the public subnets to distribute traffic to the EC2 instances in the Auto Scaling group. Configure target groups with health check grace periods and proper routing.

Include comprehensive monitoring using Amazon CloudWatch Container Insights with enhanced monitoring capabilities to track application performance, resource utilization, and system health metrics across the infrastructure.

Please also incorporate Amazon ElastiCache Serverless for caching to improve application performance.

Generate infrastructure code using AWS CDK TypeScript with one code block per file. Make sure the deployment time is optimized and avoid resources that take too long to deploy.
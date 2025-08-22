I need help setting up a highly available and auto-scaling environment using AWS CDK TypeScript. Here are the requirements:

1. Deploy all resources in the us-west-2 region with high availability across at least 2 availability zones
2. Create an auto-scaling group that maintains minimum 2 instances and scales to maximum 6 instances of t2.micro type
3. Set up an Application Load Balancer that listens on port 80 and forwards traffic to port 8080 on the instances
4. Deploy a multi-AZ RDS MySQL 5.7 database for data redundancy
5. Configure security groups to allow only HTTP (port 80) and MySQL (port 3306) traffic
6. Tag all resources with Environment: Production

The solution should use AWS Application Load Balancer v2 constructs and include AWS EKS v2 L2 constructs for container orchestration if needed. Please provide infrastructure code with one code block per file that I can copy and paste directly.

Make sure the CDK code follows best practices and can successfully build and synthesize.
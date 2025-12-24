I need help setting up a highly available and auto-scaling environment using AWS CDK TypeScript. Here are the requirements:

1. Deploy all resources in the us-west-2 region with high availability across at least 2 availability zones
2. Create an Auto Scaling Group that maintains minimum 2 EC2 instances and scales to maximum 6 instances of t2.micro type
3. Set up an Application Load Balancer that listens on HTTP port 80 and routes traffic to the Auto Scaling Group instances on port 8080
4. Deploy a multi-AZ RDS MySQL 5.7 database that the application instances connect to for persistent data storage
5. Configure VPC security groups to control traffic flow - allow only HTTP traffic to the ALB on port 80, allow the ALB to communicate with EC2 instances on port 8080, and allow instances to access the RDS database on MySQL port 3306
6. Tag all resources with Environment: Production

The solution should use AWS Application Load Balancer v2 constructs. Please provide infrastructure code with one code block per file that I can copy and paste directly.

Make sure the CDK code follows best practices and can successfully build and synthesize.
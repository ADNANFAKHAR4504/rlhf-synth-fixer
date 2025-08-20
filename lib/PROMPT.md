I need to deploy a highly available web application using AWS CDK in JavaScript. The infrastructure must meet these specific requirements:

1. Create a VPC with at least 3 subnets distributed across different Availability Zones for high availability
2. Set up an Auto Scaling group to ensure there are always at least two EC2 instances running
3. Deploy an Application Load Balancer to distribute incoming traffic across the EC2 instances
4. Configure an RDS MySQL database with Multi-AZ deployment enabled for failover
5. Create IAM roles for EC2 instances to allow S3 access for static content delivery
6. Apply consistent tagging to all AWS resources with 'Environment: Production' for cost allocation
7. Enable CloudWatch logging and monitoring for all critical systems

Additional requirements:
- Deploy in the us-east-1 region
- Use custom CIDR blocks for the VPC
- Follow the 'teamname-projectname' naming convention
- Use EKS Auto Mode for simplified Kubernetes cluster management
- Incorporate AWS Clean Rooms for secure data collaboration if applicable

Please provide the complete CDK infrastructure code in JavaScript format using .mjs file extensions. Organize the code into separate files for better maintainability. Ensure all resources follow AWS best practices and include proper error handling.
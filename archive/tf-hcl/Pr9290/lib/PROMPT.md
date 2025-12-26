I need to create a high-availability web application infrastructure on AWS using Terraform. The infrastructure should include:

1. A VPC with public and private subnets across multiple Availability Zones that hosts the application infrastructure
2. An Elastic Beanstalk application connected to an Application Load Balancer that distributes incoming traffic across EC2 instances, with auto-scaling based on CPU metrics
3. An RDS MySQL database instance deployed in private subnets that connects to the Elastic Beanstalk application through security group rules for data persistence
4. An Application Load Balancer deployed in public subnets that routes traffic to Elastic Beanstalk instances in private subnets
5. Security groups that control network access between ALB, Elastic Beanstalk instances, and RDS database with least privilege principles
6. IAM roles and policies that grant Elastic Beanstalk service permissions to manage EC2 instances and access CloudWatch for health monitoring

The infrastructure should leverage recent AWS improvements including Application Load Balancer's weighted target groups for deployment flexibility and Elastic Beanstalk's support for Amazon Linux 2023 platforms. The Elastic Beanstalk environment should be configured with environment variables containing RDS connection details to enable database connectivity. Please ensure the RDS instance uses a smaller instance type to reduce deployment time.

Please provide the complete Terraform HCL infrastructure code. Create one code block per file, with each file containing the appropriate resources and configurations.
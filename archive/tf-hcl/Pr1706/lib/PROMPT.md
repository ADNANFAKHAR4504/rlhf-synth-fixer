I need to create a high-availability web application infrastructure on AWS using Terraform. The infrastructure should include:

1. A VPC with public and private subnets across multiple Availability Zones for high availability
2. An Elastic Beanstalk application for deploying a scalable web application with auto-scaling based on CPU metrics
3. An RDS MySQL database instance in private subnets for data persistence
4. An Application Load Balancer to distribute traffic across instances
5. Security groups to control network access with least privilege principles
6. IAM roles and policies following security best practices

The infrastructure should leverage recent AWS improvements including Application Load Balancer's weighted target groups for deployment flexibility and Elastic Beanstalk's support for Amazon Linux 2023 platforms. Please ensure the RDS instance uses a smaller instance type to reduce deployment time.

Please provide the complete Terraform HCL infrastructure code. Create one code block per file, with each file containing the appropriate resources and configurations.
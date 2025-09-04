# Web Application Deployment - Task trainr866

Deploy a scalable web application using Terraform with HCL. Follow these requirements:

1. Use Terraform to deploy the application on AWS
2. Configure the application to run behind an ELB (Elastic Load Balancer)
3. Ensure web application instances run in an Auto Scaling group
4. Use Amazon RDS for the database layer
5. Configure network subnets to ensure secure application access via HTTPS
6. Resources must reside in a VPC with proper security group settings
7. Implement environment configuration for deployment stages such as development and production

## Technical Requirements:
- Platform: Terraform
- Language: HCL
- Complexity: Hard
- Target Region: us-east-1
- Task ID: trainr866

## Expected Architecture:
- VPC with public and private subnets
- Application Load Balancer (ALB) in public subnets
- Auto Scaling Group with EC2 instances in private subnets
- RDS database in private subnets with Multi-AZ for high availability
- Security groups with proper ingress/egress rules
- HTTPS termination at the load balancer
- Environment-specific configuration (dev/prod)
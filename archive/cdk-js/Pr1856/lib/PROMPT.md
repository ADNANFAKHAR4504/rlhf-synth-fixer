# Deploy Highly Available Web Application Infrastructure

I need help creating AWS infrastructure code for deploying a highly available web application with the following requirements:

## Core Requirements

1. Deploy all resources in the **us-west-2** region
2. Create an Auto Scaling group with EC2 instances spanning at least 2 availability zones for high availability
3. Configure minimum 2 instances and maximum 5 instances in the Auto Scaling group
4. Deploy an Application Load Balancer to distribute traffic across instances
5. Configure health checks on the load balancer to route traffic only to healthy instances
6. Allow HTTP (port 80) and HTTPS (port 443) traffic from the internet to the load balancer
7. Use AWS Systems Manager Parameter Store for secure configuration parameters
8. Output the load balancer URL for easy access to the deployed web application
9. Configure appropriate security groups with proper ingress and egress rules
10. Use the latest Amazon Linux 2023 AMI for EC2 instances

## Additional Features

Please incorporate these newer AWS capabilities:
- Use Amazon ECS built-in blue/green deployment features if applicable for safer deployments
- Consider AWS Global Accelerator for improved global performance and failover capabilities

## Technical Specifications

- VPC with public and private subnets across multiple availability zones
- Internet Gateway for public subnet access
- NAT Gateway for private subnet outbound connectivity
- Launch Template for EC2 instances with proper user data configuration
- Application Load Balancer with listeners for HTTP and HTTPS
- Security Groups for load balancer and EC2 instances with least privilege access
- Auto Scaling policies for dynamic scaling based on CPU utilization
- CloudWatch alarms for monitoring and alerting

## Infrastructure Code Requirements

Please provide infrastructure code with one code block per file. Each file should be complete and ready to deploy. Minimize the number of files while meeting all requirements.

The infrastructure should be production-ready with proper error handling, resource naming conventions, and comprehensive outputs for accessing the deployed application.
Hey team,

We need to implement a blue-green deployment architecture for our e-commerce platform's containerized web application using **Terraform with HCL**. The business is losing revenue due to 5-10 minutes of downtime during each deployment, and we need to enable zero-downtime deployments.

## Background

Our e-commerce platform is experiencing significant customer complaints and revenue loss during deployments. We need a robust blue-green deployment solution that allows us to switch traffic between environments without any downtime.

## Requirements

Create a Terraform configuration that implements the following:

1. **Auto Scaling Groups**: Define separate Auto Scaling Groups for blue and green environments with launch templates specifying Docker-enabled AMIs
2. **Application Load Balancer**: Configure an ALB with two target groups (blue and green) and listener rules for traffic switching
3. **Database Layer**: Set up RDS Aurora MySQL cluster with reader endpoints and RDS Proxy for connection management
4. **Traffic Management**: Implement Route 53 weighted routing records allowing gradual traffic shifts between environments
5. **Monitoring**: Create CloudWatch alarms monitoring target group health, CPU utilization, and request count
6. **Artifact Storage**: Define S3 bucket with versioning for storing application artifacts and deployment history
7. **Security**: Configure security groups allowing ALB → EC2 → RDS Proxy → RDS communication only
8. **IAM**: Implement IAM roles and instance profiles with permissions for S3 artifact access and CloudWatch logs
9. **Networking**: Use data sources to reference existing VPC and subnet configurations
10. **Tagging**: Apply consistent tagging strategy with Environment, Version, and DeploymentType tags

## Environment Details

- **Region**: us-east-1
- **Availability Zones**: 3 AZs for high availability
- **Platform**: Terraform 1.5+ with AWS provider 5.x
- **Network**: VPC with public subnets for ALB and private subnets for EC2/RDS
- **Internet Access**: NAT Gateways provide outbound internet access
- **Operating System**: Amazon Linux 2 with Docker on EC2 instances
- **Database**: RDS Aurora MySQL in Multi-AZ configuration

## Constraints

- Must use AWS Application Load Balancer with target group switching
- Auto Scaling Groups must maintain minimum 2 instances during deployments
- Health checks must pass before traffic switches to new environment
- Database connections must use RDS Proxy to prevent connection exhaustion
- CloudWatch alarms must monitor both blue and green environments
- Route 53 weighted routing policies must control traffic distribution
- Security groups must restrict inter-environment communication
- S3 must store deployment artifacts with versioning enabled
- IAM roles must follow least privilege principle for EC2 instances
- Tags must clearly identify blue/green resources and deployment version

## Expected Output

A modular Terraform configuration with separate files for different concerns. The solution should enable switching traffic between blue and green environments by updating ALB target group weights and Route 53 record weights without modifying the underlying infrastructure.

The configuration should be production-ready with proper resource organization, clear variable definitions, and comprehensive output values for integration with deployment pipelines.

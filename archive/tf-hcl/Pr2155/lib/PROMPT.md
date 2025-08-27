# Terraform AWS Infrastructure Deployment Task

## Project Overview
You are tasked with designing and deploying a comprehensive AWS environment using Terraform as the Infrastructure as Code tool. This project focuses on creating a highly available, secure, and scalable infrastructure that follows AWS best practices.

## Project Name
IaC - AWS Nova Model Breaking

## Infrastructure Requirements

### Network Architecture
- Create a Virtual Private Cloud (VPC) that spans at least two availability zones for high availability
- Within each availability zone, establish one public subnet and one private subnet
- Configure proper routing tables to ensure public subnets can access the internet while private subnets remain isolated

### Load Balancing and Compute
- Deploy an Application Load Balancer (ALB) in the public subnets to distribute incoming traffic
- Set up an Auto Scaling Group that deploys EC2 instances into the private subnets
- Configure the Auto Scaling Group to maintain a minimum of two EC2 instances at all times for redundancy

### Security and Access Management
- Implement IAM roles and attach them to EC2 instances for secure access to S3 buckets
- Ensure all data storage (both EC2 and RDS) is encrypted using AWS KMS customer-managed keys
- Validate security configurations and ensure only necessary ports are open to the internet
- Apply the principle of least privilege for all security group configurations

### Database Layer
- Deploy a managed RDS instance inside one of the private subnets, completely isolated from external traffic
- Configure the RDS instance with proper security groups and encryption

## Technical Constraints
- Use AWS as the cloud service provider
- The VPC must span at least two availability zones
- Implement a public and a private subnet in each availability zone
- Deploy an Application Load Balancer (ALB) in the public subnets
- Ensure EC2 instances in an Auto Scaling group are in the private subnets
- Configure the Auto Scaling group to maintain a minimum of two instances
- Implement IAM roles and attach them to EC2 instances for secure access to S3 buckets
- Use a managed relational database service (RDS) within a private subnet
- Encrypt all data at rest using customer-managed keys (CMK) in AWS KMS

## Project Structure
This Terraform project follows a specific structure where all infrastructure code lives in one file: tap stack.tf. The provider.tf file already exists and contains your AWS provider configuration and S3 backend setup. You should not modify the provider.tf file unless there are real changes needed to providers or backends.

## Expected Deliverables
- Use HCL (HashiCorp Configuration Language) to define your Terraform configuration files
- Your setup should allow the environment to be created with a single terraform apply command
- The deployment must meet all specified constraints and follow AWS best practices
- Ensure the infrastructure is regionally redundant and maintains high availability
- Implement proper security measures using AWS services like EC2, ALB, VPC, Auto Scaling Groups, IAM, RDS, and KMS

## Success Criteria
- All infrastructure components deploy successfully with a single terraform apply command
- The environment demonstrates high availability across multiple availability zones
- Security best practices are implemented throughout the infrastructure
- Data encryption is properly configured using customer-managed KMS keys
- The Auto Scaling Group maintains the required minimum instance count
- All components are properly integrated and functional

## Additional Considerations
- Consider cost optimization while meeting the requirements
- Implement proper tagging for resource management
- Ensure the solution is maintainable and follows Terraform best practices
- Consider disaster recovery aspects of the infrastructure design
- Validate that the solution can scale appropriately for future growth


Note-create complete and all infrastructure with in tap_stack.tf
# Cloud Environment Setup using Terraform

## Task Overview
You are tasked with setting up a new cloud environment using **Terraform with HCL** (transformed from original CloudFormation requirements per platform enforcement). This setup includes deploying a web application infrastructure that adheres to specific requirements.

## Requirements

1. **VPC with Multi-AZ Configuration**
   - Create a VPC with subnets in multiple availability zones
   - Ensure high availability for EC2 instances
   
2. **EC2 Instances Configuration**
   - Configure EC2 instances to be launched within the VPC
   - Use IAM roles for secure access (no embedded credentials)
   
3. **Security Groups**
   - Implement security groups that deny all incoming traffic by default
   - Allow only HTTP (port 80) and HTTPS (port 443) traffic from the internet
   
4. **S3 Bucket for Logging**
   - Set up an S3 bucket with versioning enabled for storing application logs
   
5. **DynamoDB Table**
   - Deploy a DynamoDB table with on-demand scaling (PAY_PER_REQUEST billing mode)
   
6. **CloudWatch Monitoring**
   - Ensure CloudWatch monitoring is active for all EC2 instances

## Constraints

1. **Region**: The infrastructure must be deployed in the 'us-east-1' region
2. **Naming Convention**: Resource names should follow the pattern 'AppResource-<Stage>-<random_id>'
3. **Security Groups**: All security groups must block incoming traffic by default
4. **Public Access**: Only ports 80 (HTTP) and 443 (HTTPS) should be open to the public internet
5. **S3 Configuration**: Create an S3 bucket for application logs with versioning enabled
6. **High Availability**: Ensure all instances are launched within a VPC with subnets in different availability zones
7. **IAM Roles**: Use IAM roles for EC2 instances to access AWS resources securely without embedding credentials
8. **Monitoring**: Enable CloudWatch monitoring for all EC2 instances
9. **DynamoDB Scaling**: DynamoDB tables must have on-demand scaling enabled

## Expected Output

A complete Terraform configuration (HCL) that:
- Creates the specified infrastructure when deployed
- Follows all constraints and requirements
- Passes validation tests
- Deploys without errors
- Implements AWS best practices

## Platform Notes

- **Original Platform**: CloudFormation with YAML
- **Target Platform**: Terraform with HCL (per platform enforcement)
- **Backend**: S3 backend for state management
- **Provider**: AWS provider for us-east-1 region
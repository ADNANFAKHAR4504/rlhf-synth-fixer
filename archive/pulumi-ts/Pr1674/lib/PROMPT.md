# Web Application Deployment with Pulumi TypeScript

## Task Overview
Your task is to use Pulumi with TypeScript to automate the deployment of a web application in AWS. This task has been converted from the original Python requirement to TypeScript per platform enforcement requirements.

## Requirements
The deployment should meet the following requirements:

1. **AWS Region**: Deploy the application in the 'us-west-2' AWS region.

2. **Auto Scaling Group**: Set up an auto-scaling group with a minimum of 1 and a maximum of 3 EC2 instances.

3. **Load Balancer**: Implement a load balancer to distribute incoming network traffic across the instances.

4. **S3 Logging**: Configure S3 to store application logs.

5. **IAM Roles**: Ensure that launched instances assume an IAM role with permissions to write logs to the designated S3 bucket.

6. **Validation**: Validate the deployment by simulating traffic and checking the application response.

## Expected Output
A Pulumi script in TypeScript that, when executed, performs all the above tasks. The script should configure services correctly and ensure all specified requirements are met. Tests must pass to confirm the setup works as intended.

## Environment Context
- **Platform**: Pulumi
- **Language**: TypeScript (converted from Python per platform enforcement)
- **Region**: us-west-2 
- **Infrastructure**: Scalable and reliable infrastructure with IAM roles and logging configurations
- **Focus**: Deploying a scalable web application infrastructure on AWS using Pulumi's TypeScript SDK

## Architecture Requirements
The solution should implement:
- EC2 instances for the web application
- Application Load Balancer for traffic distribution
- Auto Scaling Group for dynamic scaling (1-3 instances)
- S3 bucket for application logs storage
- IAM role and policies for S3 access
- Security groups for proper network access
- VPC setup if needed for isolation

## Constraints
1. Must deploy in us-west-2 region
2. Auto-scaling group: minimum 1, maximum 3 instances
3. Load balancer must distribute traffic evenly across instances
4. Application logs must be stored in S3 bucket
5. Instances must have IAM role with S3 access permissions
6. Solution must be implemented in Pulumi TypeScript
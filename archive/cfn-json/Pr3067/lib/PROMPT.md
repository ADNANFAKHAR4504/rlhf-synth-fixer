# CloudFormation Deployment Prompt

## Task

You are tasked with deploying a web application using **AWS CloudFormation**. The infrastructure must be defined entirely in a **single JSON CloudFormation template**. Your solution should meet the following requirements:

## Requirements

1. **Containerized Deployment**
   - Use **Amazon ECS** to deploy the application.
   - Store container images in **Amazon ECR**.

2. **Networking**
   - Create a **VPC** with:
     - At least **two public subnets**.
     - At least **two private subnets**.
     - Subnets must be distributed across **multiple Availability Zones**.

3. **Load Balancing**
   - Set up an **Application Load Balancer (ALB)**.
   - Distribute incoming traffic among ECS tasks.

4. **Compute**
   - Use the **AWS Fargate** launch type for ECS tasks to ensure scalability and simplicity.

5. **Auto Scaling**
   - Implement **auto-scaling** for the ECS service.
   - Scale based on **CPU utilization thresholds**.

6. **Permissions**
   - Create an **IAM role** for ECS tasks.
   - Allow the role to write **logs to CloudWatch**.

7. **DNS Management**
   - Use **Amazon Route 53** to manage DNS.
   - Set up a **custom domain** for the application.

8. **Tagging**
   - Tag all AWS resources with:  
     `Environment: Production`  
     for cost tracking and management.

9. **Monitoring**
   - Use **Amazon CloudWatch Alarms** to monitor ECS service health.
   - Trigger scaling activities when thresholds are breached.

10. **Outputs**
    - Output the **public DNS name of the ALB** after successful stack creation.

11. **Template Constraints**
    - All resources must be defined in **one JSON CloudFormation template**.

12. **Validation**
    - Use the **AWS CLI** to validate your CloudFormation template before deployment.

## Expected Output

A fully functional **CloudFormation JSON template** that:

- Creates all required infrastructure.
- Passes all validation checks using the AWS CLI.
- Outputs the ALB’s public DNS name upon stack creation.

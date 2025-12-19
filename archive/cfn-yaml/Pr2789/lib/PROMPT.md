# Create a Serverless Application with AWS CloudFormation

## Objectives
- Design and implement a **serverless architecture** using AWS CloudFormation.  
- Ensure the setup is **modular, reusable, and production-ready** while adhering to AWS best practices.  
- Deliver a validated CloudFormation **YAML template** that provisions all required resources in one file.  

## Problem Statement
You are tasked with building a **serverless application** on AWS using CloudFormation. The solution should leverage **AWS Lambda** and **Amazon API Gateway** to create a lightweight, event-driven system. All resources must be defined in a single YAML template, ensuring easy deployment and maintainability. The application should follow a consistent resource naming convention for better traceability and management.  

## Functional Requirements
1. Define all infrastructure resources in a **single CloudFormation YAML template**.  
2. Deploy in the **us-west-2 (Oregon) region**.  
3. Use **AWS Lambda** with the **Python 3.8 runtime**.  
4. Configure **IAM roles and execution permissions** for the Lambda function.  
5. Set up an **API Gateway** to invoke the Lambda function on HTTP requests.  
6. Enable **CORS** on API Gateway for **all routes**.  
7. Plan deployments using **CloudFormation Change Sets**.  
8. Apply **resource-level tags** for identification and management.  
9. Store the **Lambda function code in an S3 bucket** and reference it in the template.  
10. Provide **outputs** for both:  
   - API Gateway endpoint URL  
   - Lambda function ARN  

## Constraints
- **Single CloudFormation template** only (no nested stacks).  
- Must deploy in **us-west-2**.  
- Lambda runtime restricted to **Python 3.8**.  
- IAM roles must follow **least-privilege principles**.  
- API Gateway must have **CORS enabled globally**.  
- Resource naming convention:  
  ```
  projectName-resourceName-environment  
  e.g., myProject-lambda-prod
  ```  
- Deployment should always go through **Change Sets** before execution.  

## Deliverables
- A CloudFormation YAML template named **`serverless-template.yaml`**.  
- The template should:  
  - Pass AWS CloudFormation validation (`aws cloudformation validate-template`).  
  - Successfully deploy all specified resources.  
  - Output the **API Gateway URL** and the **Lambda Function ARN**.  

---
# IaC - AWS Nova Model Breaking

## Objective
Design and deploy a secure, highly available, and serverless AWS infrastructure using CloudFormation. The solution must handle HTTP requests efficiently, ensure seamless deployment updates, and adhere to AWS best practices for security and maintainability.

## Problem Statement
You are tasked with setting up a serverless application environment on AWS that responds to HTTP requests. The infrastructure should be defined entirely within a single CloudFormation YAML template and should meet strict requirements for logging, encryption, and deployment strategies. This setup should serve as a robust foundation for real-world traffic scenarios while maintaining security and operational efficiency.

## Functional Requirements
1. **AWS Lambda**  
   - Implement AWS Lambda functions using **Python 3.9**.  
   - Lambda should handle incoming HTTP requests.
   
2. **API Gateway Integration**  
   - Integrate Lambda with Amazon API Gateway using **proxy integration** to route HTTP requests.

3. **Infrastructure Definition**  
   - All AWS infrastructure resources must be defined in a **single CloudFormation YAML file** named `serverless_infrastructure.yaml`.

4. **Logging**  
   - Create an S3 bucket for Lambda logs.  
   - Apply lifecycle policies to **delete logs older than 7 days** automatically.

5. **Deployment Strategy**  
   - Implement **blue/green deployments** for Lambda to ensure zero downtime updates.

6. **Security**  
   - Encrypt all data at rest using **AWS-managed KMS keys**.

## Constraints
- Use AWS Lambda functions written in **Python 3.9**.  
- API Gateway must use **proxy integration** with Lambda.  
- All infrastructure must be contained within a **single CloudFormation YAML file**.  
- S3 bucket logging must include a lifecycle policy to delete logs older than 7 days.  
- Must support **blue/green Lambda deployments**.  
- Data at rest must be encrypted using **AWS-managed KMS keys**.  
- Deploy in the **us-east-1** AWS region.  
- Use a **single AWS account** dedicated for development and testing.  
- Resource names must follow the naming convention:  

## Deliverable
- A fully functional **`serverless_infrastructure.yaml`** CloudFormation template.  
- The template should:  
- Pass **CloudFormation syntax validation**.  
- Deploy successfully in AWS.  
- Handle HTTP requests effectively via API Gateway and Lambda.  
- Implement secure, efficient logging and encryption.  
- Support zero-downtime **blue/green deployments**.
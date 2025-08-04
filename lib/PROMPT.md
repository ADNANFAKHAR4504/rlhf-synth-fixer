# IaC - AWS Nova Model Breaking

## Environment  
Design and implement a serverless infrastructure using **Pulumi** and **Python** for an e-commerce application to be deployed on AWS.  

The solution must fulfill the following requirements:  

1. Deploy Lambda functions with **environment-specific configurations**.  
2. Provision **API Gateway** as the entry point.  
3. Incorporate **DynamoDB tables** accessible by all functions.  
4. Implement **IAM roles** for Lambda permissions.  
5. Secure secrets using **environment variables** and ensure all components log to **CloudWatch**.  
6. Use **dynamic resource naming** based on environment (e.g., `dev`, `staging`, `prod`).  
7. Enable **CORS** on API Gateway for defined domains.  
8. Ensure capacity configurations of DynamoDB tables are **adequate for usage patterns**.  
9. **VPC details** must be provided with valid CIDR blocks.  
10. Conduct and pass **PyLint** static code analysis on all scripts.  
11. Ensure deployment in a **specified region** and test extensively with **Pulumi's testing utilities**.  
12. Finalize the infrastructure and ensure deployment scripts are executed from a function named `setup_infrastructure`.  

---

## Expected Output  
Implement the solution such that upon execution of `setup_infrastructure`, the **entire serverless infrastructure** is deployed, tested, and verified in the targeted AWS account, meeting all the above requirements.

---

## Constraints  

- All functions must be implemented in **Python**.  
- The infrastructure must be deployable on **AWS**.  
- Lambda functions should have **environment-specific configuration settings**.  
- Use **AWS IAM roles** for Lambda execution permissions.  
- Include **API Gateway** as the entry point for the serverless application.  
- Ensure that all Lambda functions can access **AWS DynamoDB tables**.  
- Use **environment variables** to manage secret keys without hardcoding them in the source code.  
- All functions should be able to log to **AWS CloudWatch**.  
- Serverless application should be deployed in a **specified AWS region**, configurable through a single variable.  
- Generate resource names dynamically based on the environment (`dev`, `staging`, `prod`).  
- Include **unit tests** for infrastructure definition leveraging Pulumi's testing capabilities.  
- Implement **VPC configuration** for Lambda functions with provided CIDR blocks.  
- DynamoDB tables should have **read and write capacity** configured correctly based on usage patterns.  
- Ensure API Gateway has **CORS** enabled for specified domains.  
- The infrastructure code must pass static code analysis using **pylint**.

---

## Problem Difficulty  
**Expert**

---

## Proposed Statement  
The serverless infrastructure is to be deployed on AWS using Pulumi with Python for a high-traffic application requiring specialized setup for different environments. Deployment will take place in the `us-west-2` region, but this should be configurable.  

All resources must adhere to naming conventions which incorporate the environment name in the format:  

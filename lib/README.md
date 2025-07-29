# AWS CDK Fargate Stack

This project provisions a production-grade AWS ECS Fargate deployment using AWS CDK (TypeScript). It supports multiple isolated environments (e.g., `dev`, `staging`, `prod`) with key components like:

- **VPC, ECS Cluster, and Fargate Service**
- **Application Load Balancer (HTTPS)**
- **Route 53 DNS Record**
- **SSM Parameter Store with optional SecureString support**
- **CloudWatch Alarms for CPU and Memory**
- **Auto Scaling based on metrics**
- **Tagged Resources for Cost and Environment Management**

---

## 🏗️ Prerequisites

- Node.js v18+
- AWS CLI configured with `aws configure`
- CDK CLI v2 installed:  
  ```bash
  npm install -g aws-cdk

🚀 Deployment
1. Install dependencies
    ```bash
     npm install

2. Bootstrap environment (only once per account/region) 
    ```bash
    cdk bootstrap aws://<ACCOUNT_ID>/<REGION>

3. Deploy an environment
    ```bash
    cdk deploy MyStack-dev \
    --context envName=dev \
    --context domainName=myapp.example.com \
    --context hostedZoneId=Z3P5QSUBK4POTI \
    --context hostedZoneName=example.com \
    --context certificateArn=arn:aws:acm:us-east-1:123456789012:certificate/abc123

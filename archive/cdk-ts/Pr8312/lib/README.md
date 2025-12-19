# Multi-Environment ECS Infrastructure

This project provisions a production-grade AWS ECS Fargate deployment using AWS CDK (TypeScript). It supports multiple isolated environments (e.g., `dev`, `prod`) with key components like:

- **VPC, ECS Cluster, and Fargate Service**
- **Application Load Balancer (HTTPS)**
- **Route 53 DNS Record**
- **SSM Parameter Store with optional SecureString support**
- **CloudWatch Alarms for CPU and Memory**
- **Auto Scaling based on metrics**
- **Tagged Resources for Cost and Environment Management**

## Prerequisites

- AWS CLI configured with appropriate permissions
- AWS CDK installed
- Node.js v22.17.0
- AWS CLI configured with `aws configure`
- CDK CLI v2 installed:  
  ```bash
  npm install -g aws-cdk

## Deployment

1. Install dependencies:

```bash
npm install
```

2. Bootstrap the CDK environment (if not already done):

```bash
cdk bootstrap
```

3. Deploy the development environment:

```bash
cdk deploy DevStack
```

4. Deploy the production environment:

```bash
cdk deploy ProdStack
```

5. Deploy an environment
    ```bash
    cdk deploy MyStack-dev \
    --context envName=dev \
    --context domainName=myapp.example.com \
    --context hostedZoneId=Z3P5QSUBK4POTI \
    --context hostedZoneName=example.com \
    --context certificateArn=arn:aws:acm:us-east-1:123456789012:certificate/abc123

## Infrastructure

- **VPC**: Separate VPCs for development and production.
- **ECS Cluster**: ECS clusters running on Fargate.
- **SSM Parameter Store**: Environment-specific configurations encrypted with AWS KMS.
- **Application Load Balancer**: Distributes incoming traffic.
- **Route 53**: Manages DNS records.
- **CloudWatch**: Monitoring and alarms for CPU utilization.
- **Auto Scaling**: Scales based on CPU utilization.

## Usage

Access the application using the domain names configured in Route 53:

- Development: `http://dev.example.com`
- Production: `http://prod.example.com`

## Cleanup

To destroy the deployed stacks:

```bash
cdk destroy DevStack
cdk destroy ProdStack
```
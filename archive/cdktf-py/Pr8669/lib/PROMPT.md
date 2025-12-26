CDKTF Python Prompt: AWS Serverless Infrastructure Setup

Create a secure, highly available serverless infrastructure in AWS using Python CDKTF. The infrastructure should include REST API Gateway integrated with Lambda functions that connect to DynamoDB for data persistence, all deployed within a VPC. Lambda functions should send logs to CloudWatch and be traced via X-Ray.

Organize the code in the following folder structure:



root/
├── tap.py # CDKTF entrypoint
└── lib/
        └── tapstack.py # Main stack definition



---

## Requirements & Constraints

###  Region & Network
- Deploy to us-west-2
- All resources must reside within a VPC distributed across at least 2 Availability Zones

###  Service Integration Architecture

- REST API Gateway connected to Lambda functions to expose HTTP endpoints
- Lambda functions deployed in private subnets within the VPC that read/write data to DynamoDB
- DynamoDB table accessible by Lambda through IAM roles with least privilege permissions
- Lambda functions send logs to CloudWatch Logs and traces to X-Ray for observability
- VPC endpoints allow Lambda to communicate with DynamoDB without internet egress

###  Database Layer
- DynamoDB table for serverless persistence
- Must support on-demand PAY_PER_REQUEST mode
- Enable encryption at rest and point-in-time recovery
- Connected to Lambda via IAM role permissions

### Observability & Monitoring
- CloudWatch Logs receive logs from Lambda functions and API Gateway requests
- CloudWatch Alarms monitor Lambda errors and API 4xx errors, triggering alerts when thresholds are exceeded
- X-Ray traces requests from API Gateway through Lambda to DynamoDB for end-to-end visibility

###  Deployment & State Management
- Infrastructure must be written in Python CDKTF
- Use no more than 5 files in total to define the stack
- S3 backend stores Terraform state for infrastructure versioning
- Use Terraform 1.0+ compatible features only

---

##  Output Expectations

- CDKTF Python code that resides in the specified folder structure and deploys the entire infrastructure as per above specs
- Includes VPC, Subnets, Internet Gateway, NAT Gateways, DynamoDB table, Lambda function, REST API Gateway, Logging, Tracing, IAM, and Monitoring
- Uses inline comments explaining key logic

---

## Security Best Practices

- All data must be encrypted at rest
- VPC-connected Lambdas only
- No public IPs on sensitive resources
- IAM follows least privilege model

---

##  Tip

Use TerraformAsset or external packaging to handle zip files for Lambda code.

---

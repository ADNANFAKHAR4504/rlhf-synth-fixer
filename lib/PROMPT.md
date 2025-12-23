CDKTF Python Prompt: AWS Serverless Infrastructure Setup

Create a secure, highly available serverless infrastructure in AWS using Python CDKTF, organized in the following folder structure:



root/
├── tap.py # CDKTF entrypoint
└── lib/
        └── tapstack.py # Main stack definition



---

## Requirements & Constraints

###  Region & Network
- Deploy to us-west-2
- All resources must reside within a VPC distributed across at least 2 Availability Zones

###  Serverless Compute
- Use AWS Lambda for compute
- Attach Lambdas to private subnets in the VPC

###  API Gateway
- Use REST API Gateway to expose Lambda endpoints
- Enable X-Ray tracing

###  IAM & Permissions
- Use IAM roles with least privilege access for Lambda functions
- Allow access to DynamoDB and VPC as needed

###  Database
- Use DynamoDB for serverless persistence
- Must support on-demand PAY_PER_REQUEST mode
- Enable encryption at rest and point-in-time recovery

### Observability
- Enable CloudWatch logs for Lambda and API Gateway
- Set up CloudWatch alarms for Lambda errors and API 4xx errors
- Enable X-Ray tracing on Lambda and API Gateway

###  Deployment
- Infrastructure must be written in Python CDKTF
- Use no more than 5 files in total to define the stack
- All state must be stored in an S3 backend using Terraform
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

Here's a prompt for developing a TypeScript-based CDK stack for a secure serverless infrastructure.

---

## TypeScript CDK: Secure Serverless Deployment

Hey team,

We need your help to develop a **TypeScript-based CDK stack** for deploying a new, secure serverless infrastructure. This setup is for a critical application and needs to meet some pretty strict requirements.

The entire deployment will take place in the **`us-west-2` region**. We'll use a VPC with the **`10.0.0.0/16` CIDR block**, specifically configured with a **private subnet (`10.0.0.0/24`)** and a **public subnet (`10.0.1.0/24`)**.

Here's what needs to be included in the CDK stack:

- **Serverless Application Layer**: Use **AWS Lambda** functions, triggered by an **API Gateway**.
- **Data Storage**: Implement **DynamoDB** for data persistence. It needs to be configured with specific **read/write capacity units** (plan for around 500 RCU/WCU, but make it easily configurable). All sensitive data in DynamoDB must be secured with **KMS encryption**. Also, **automate DynamoDB backups**.
- **Static Content**: Provision an **S3 bucket for static file storage**, ensuring it has **versioning enabled** and uses **KMS encryption**.
- **Monitoring & Tracing**: Enable robust **monitoring with CloudWatch** for API Gateway, Lambda, and DynamoDB. Integrate **AWS X-Ray** for tracing requests through the API Gateway and Lambda functions.
- **CI/CD Pipeline**: Implement a secure and automated **CI/CD pipeline using AWS CodePipeline** for deploying this CloudFormation application.
- **API Security & Delivery**: Secure the **API Gateway with AWS WAF**. Integrate **CloudFront for enhanced delivery** and security in front of the API Gateway. Ensure **custom domain names are defined for the API with Route 53**.
- **Scalability**: The infrastructure needs to be highly scalable, capable of handling **up to 1000 API requests per second** effectively. Deploy resources across **multiple availability zones** to achieve high availability.
- **Secrets Management**: Integrate **AWS Secrets Manager** for securely storing and retrieving credentials, with **automatic rotation** where applicable.
- **IAM Policies**: Configure **IAM roles and policies** strictly adhering to the **principle of least privilege**.
- **Logging**: Enable comprehensive **CloudWatch Logs** for all services involved.
- **Lambda Resilience**: Ensure the Lambda function has **proper retry logic** for failed invocations.
- **Tagging**: Apply a consistent **tagging strategy** across all resources for better cost management and organization. Resource names should follow the pattern `'projectname-environment-resourcename'` (e.g., 'myproject-dev-lambda').

The expected output is a **cohesive CDK stack in TypeScript**.

My directory structure looks like this
├── MODEL_RESPONSE.md
├── PROMPT.md
└── tap-stack.ts

please generate the code accordingly

Thanks!

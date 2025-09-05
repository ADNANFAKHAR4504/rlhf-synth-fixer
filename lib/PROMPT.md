I need a complete **AWS CDK project in TypeScript** that defines a secure, multi-region-capable serverless web application. The infrastructure should be packaged in a single stack unless separation is clearly required. Follow these requirements exactly:

### Core requirements

1. Use **API Gateway** to trigger at least one **AWS Lambda function**.
2. Store Lambda output in an **S3 bucket** (block public access, encryption enabled).
3. Implement **CloudWatch logging** for both API Gateway and Lambda.
4. Lambda must assume an **IAM Role** that follows the **least privilege principle**.
5. Use **AWS Systems Manager Parameter Store** for Lambda environment variables / sensitive config.
6. The stack should be deployable to **multiple AWS regions**.
7. Define **CloudFormation Outputs** so resources (e.g., API Gateway URL, S3 bucket name) are accessible after deployment.
8. Configure a **dead-letter queue (DLQ)** for Lambda errors using **Amazon SQS**.
9. Add a **DynamoDB table** for application data (partition key `id` as a String).
10. Apply the tag **Environment=Production** to all resources.
11. Ensure encryption at rest (S3, DynamoDB, SQS, SNS).
12. Allow the Lambda function to publish notifications to an **Amazon SNS topic**.

### Constraints

- Use **AWS CDK (TypeScript)**
- Do not use inline IAM policies. Define roles and attach managed/inline policy resources correctly.
- Follow AWS best practices for least privilege and security.
- Code must be production-ready and synthesize without errors.

### Deliverables

1. Full CDK TypeScript project files:
   - `bin/tap.ts`
   - `lib/tap-stack.ts` (or equivalent)
   - `package.json` with required dependencies (`aws-cdk-lib`, `constructs`, etc.)
   - `cdk.json`

2. The code should include constructs for:
   - Lambda (Node.js runtime)
   - API Gateway (POST endpoint)
   - S3 bucket (encrypted, versioning optional)
   - DynamoDB table (`id` partition key)
   - SQS queue (DLQ)
   - SNS topic with Lambda publish permissions
   - Parameter Store integration for Lambda environment variables
   - Outputs for key resources (API URL, bucket name, table name)

3. Deployment instructions: `npm install`, `cdk bootstrap`, `cdk synth`, `cdk deploy`.

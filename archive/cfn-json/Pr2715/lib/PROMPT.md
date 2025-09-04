Create an AWS CloudFormation template in json format that provisions a secure serverless infrastructure following best practices. The template must meet the following requirements:

1. Infrastructure as Code: Use AWS CloudFormation as the IaC provider.

2. Lambda Function: Deploy an AWS Lambda function triggered by an S3 bucket event.

3. IAM Role & Policy: Define a Lambda execution role with the least privileges necessary, including an IAM policy that grants read-only access to the S3 bucket.

4. S3 Bucket: Create an S3 bucket to store application data, ensuring data is encrypted at rest using AWS-managed encryption (SSE-S3 or SSE-KMS).

5. API Gateway: Deploy an Amazon API Gateway that invokes the Lambda function.

6. API Gateway Usage Plan: Configure a usage plan with throttling and quotas to control API consumption.

7. Parameters: Provide at least one CloudFormation parameter that allows flexible resource naming.

8. Portability: The stack must be deployable in any AWS region.

Ensure the solution aligns with security and operational best practices, emphasizing cross-service permissions, encryption, and high availability.

You are an expert AWS Cloud Architect specializing in serverless design, infrastructure-as-code, and CloudFormation. 

**Task:** Generate a complete AWS CloudFormation template in **JSON** that provisions a secure, scalable, and fully serverless application in the **us-west-2** region.

**Problem Requirements:**
1. Define AWS Lambda functions (stateless, with AWS SDK for DynamoDB interactions).
2. Integrate Lambda with API Gateway to expose RESTful endpoints.
3. Package all resources in a single CloudFormation template (JSON).
4. Enable AWS X-Ray and CloudWatch for tracing, logging, and monitoring.
5. Support multiple environments (dev, test, prod) using Parameters and intrinsic functions. Environment-specific secrets should be stored in AWS Secrets Manager or passed as Parameters.
6. Use Amazon SNS for notifications related to serverless activities.
7. Apply IAM roles and policies for least-privilege access between services.
8. Define DynamoDB tables in on-demand capacity mode with encryption at rest enabled.
9. Store Lambda code in an S3 bucket with versioning enabled.
10. Ensure use of pseudo parameters (AWS::Region, AWS::AccountId) and intrinsic functions (Ref, Sub, Fn::If, Fn::Join) where appropriate.

**Constraints:**
- All resources must reside in the `us-west-2` region.
- Must be fully valid JSON CloudFormation (no YAML).
- Follow AWS serverless best practices for security, cost efficiency, and scalability.
- Must declare Outputs for key resources (API Gateway endpoint, DynamoDB table name, SNS topic ARN, Lambda function ARNs).

**Expected Output:**
- A complete AWS CloudFormation **JSON** template that can be deployed without modification.
- The template should include: Parameters, Resources, and Outputs sections.
- JSON must be properly formatted and validated for CloudFormation.

**Background Context:**
Serverless architecture reduces operational overhead by removing infrastructure management. CloudFormation enables repeatable, consistent deployments of AWS resources. This design must align with enterprise-grade security, monitoring, and scaling practices.

Now, generate the **CloudFormation JSON template** that satisfies all requirements and constraints.
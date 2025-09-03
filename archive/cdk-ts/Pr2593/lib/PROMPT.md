Create a single TypeScript file using the AWS CDK that defines and deploys a secure, serverless infrastructure for an e-commerce platform. The solution must use CloudFormation under the hood (via CDK) and should meet the following requirements:

    1.	Lambda Functions: Define multiple AWS Lambda functions to handle backend processes.
    •	Integrate them with API Gateway.
    •	Use least-privilege IAM roles and policies.
    •	Manage environment variables securely.
    2.	API Gateway:
    •	Configure an API Gateway with a regional custom domain.
    •	Ensure HTTPS is enforced.
    •	Route HTTP requests to the appropriate Lambda functions.
    3.	S3 Bucket:
    •	Create an S3 bucket to store deployable artifacts.
    •	Enforce server-side encryption (AES-256).
    4.	Monitoring:
    •	Enable AWS CloudWatch logging for all Lambda functions and API Gateway.
    •	Set up alarms for critical function metrics (e.g., errors, throttling).
    5.	Best Practices:
    •	Add resource tagging for governance.
    •	Apply concurrency controls for Lambda.
    •	Configure failure management (e.g., DLQ or retries).

Expected Output
• A single TypeScript CDK stack file that provisions all required resources.
• Inline comments explaining the purpose and security of each resource.
• Deployable with cdk deploy and validated through CloudFormation.
• Adheres to AWS security and scalability best practices.

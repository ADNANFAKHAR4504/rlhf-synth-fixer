Design and implement a serverless application using the AWS CDK in TypeScript. Your solution must generate CloudFormation templates that define and deploy the entire infrastructure. The application should be production-ready, secure, and cost-effective. Specifically, your setup must:

    1.	Deploy AWS Lambda functions in the us-east-1 region, each with a maximum execution time of 60 seconds and a function name prefixed with ServerlessApp-.
    2.	Create an API Gateway that manages HTTP requests and routes them to the Lambda functions. Access must be restricted to a defined set of trusted IP ranges.
    3.	Define IAM roles and policies following the principle of least privilege, and tag all roles with Environment: Production.
    4.	Provision a DynamoDB table to store application state, configured with appropriate read/write capacity units, and ensure Lambda functions can interact with it securely.
    5.	Use a single S3 bucket to store function logs, attach proper bucket policies, and enable versioning on all Lambda functions.
    6.	Encrypt all Lambda environment variables at rest.
    7.	Implement error handling and retries for failed function calls to ensure reliability.
    8.	Ensure every resource is created with cost-effectiveness in mind and all resources are automatically deleted when the stack is deleted.

Expected Output:
A single TypeScript file that defines an AWS CDK stack implementing the requirements above. The code should compile and deploy without errors, creating a functional serverless infrastructure that adheres to AWS best practices for security, compliance, and cost efficiency.

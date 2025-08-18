I need to create a serverless API infrastructure using AWS CDK with TypeScript. The system should process user requests and store data in DynamoDB, deployed in the us-east-1 region.

Requirements:
- Use AWS Lambda for business logic processing
- Set up Amazon API Gateway for endpoint management with HTTP APIs for better serverless optimization
- Store data in a DynamoDB table with on-demand capacity mode
- Implement user authentication with Amazon Cognito to protect endpoints
- Follow AWS best practices for security and scalability

Please include these latest AWS features:
- Use API Gateway HTTP APIs for up to 71% cost savings and 60% latency reduction compared to REST APIs
- Implement Lambda Response streaming support for larger payloads up to 200 MB

The infrastructure should be easily extendable and follow serverless best practices. Please provide the complete infrastructure code with one code block per file.
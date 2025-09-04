I need to create a multi-region DynamoDB deployment using AWS CDK TypeScript. The infrastructure should create DynamoDB tables in two AWS regions: us-west-1 and us-west-2.

Requirements:
- Deploy DynamoDB tables in both us-west-1 and us-west-2 regions
- For us-west-1: set read capacity to 5 and write capacity to 5
- For us-west-2: make the read and write capacities configurable through CDK context parameters
- Use proper CDK constructs for multi-region deployment
- Ensure resource dependencies are maintained correctly
- Consider using DynamoDB Global Tables with multi-region strong consistency for enhanced resilience
- Optionally implement warm throughput features for predictable performance

The solution should generate clean, production-ready infrastructure code with proper error handling and resource management. Please provide the complete CDK TypeScript code in separate files as needed.
I need help enhancing an existing serverless REST API architecture on AWS using CDK TypeScript. The solution should include a complete CRUD API with additional observability and event-driven capabilities.

The current architecture has VPC with public and private subnets, API Gateway, Lambda functions for CRUD operations, and DynamoDB table. I want to add two more AWS services to increase complexity and testing coverage.

Add AWS EventBridge for event-driven architecture to publish events when items are created, updated, or deleted. Also integrate AWS X-Ray for distributed tracing and performance monitoring across all Lambda functions and API Gateway.

The EventBridge should include custom event bus and rules to route events based on operation type. X-Ray should provide end-to-end tracing from API Gateway through Lambda functions to DynamoDB operations.

All resources need to follow naming conventions with 'srvrless-' prefix and include proper cost monitoring tags. The infrastructure should support rollback capabilities and use IAM roles with least privilege access.

Please provide the complete enhanced CDK TypeScript infrastructure code with EventBridge and X-Ray integration following security best practices.
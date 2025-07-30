Please create a Pulumi program in TypeScript that defines a reusable AWS serverless application stack.

The entire stack should be encapsulated within a single Pulumi ComponentResource class named TapStack.

Requirements for the TapStack class:

Constructor: It should accept a name and an args object. The args object must have a tags property, which is a dictionary of string key-value pairs.

Region: Hardcode the AWS region to us-east-1.

Tagging: Apply the tags provided in the constructor to all created AWS resources.

Testing: Expose all major created resources (like the DynamoDB table, Lambda function, IAM role, API Gateway, etc.) as public readonly properties on the class so they can be accessed for unit testing.

Output: The class should have a public output property named apiUrl that exports the final endpoint URL of the API Gateway.
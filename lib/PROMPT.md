This template must be an AWS SAM template, designed to be deployed using the sam deploy command, and it must meet all of the following specifications:

1. Core Resources:

Three AWS Lambda Functions:
• One function for handling items operations.
• One function for handling users operations.
• One function for handling orders operations.
• All functions must use the nodejs20.x runtime.

Three DynamoDB Tables:
• A table for items with a primary key.
• A table for users with a primary key.
• A table for orders with a primary key.
• All tables must be configured with on-demand capacity (PAY_PER_REQUEST).

One API Gateway:
• A single REST API with three distinct endpoints (/items, /users, /orders),
one for each Lambda function.
• Each endpoint must be configured to trigger its corresponding Lambda function.
• The API should support ANY method for each endpoint.

2. Configuration & Security:

IAM Roles:
• Create a single, reusable IAM role for all three Lambda functions.
• The role’s policy must grant permissions for logging to CloudWatch Logs
(logs:CreateLogGroup, logs:CreateLogStream, logs:PutLogEvents).
• The role’s policy must also grant granular DynamoDB permissions
(dynamodb:GetItem, dynamodb:PutItem, dynamodb:UpdateItem)
for each specific table, following the principle of least privilege.

Environment Variables:
• Each Lambda function must have an Environment section that passes its
corresponding DynamoDB table name to the function code.
Use !Ref to dynamically reference the table names.

Region and Naming:
• Ensure the template is deployable to us-east-1
(this is the default, so no explicit mention is needed unless a resource requires it).
• All resources should follow a clear and logical naming convention
(e.g., ItemsTable, ItemsFunction, etc.).

3. Documentation & Outputs:

Comments & Descriptions:
• The template should include a high-level Description for the entire stack.
• Add inline comments to explain the purpose of key resources and their configurations.
• Include a Description property for each individual resource.

Outputs:
• Define an Outputs section that exports the URL of the deployed API Gateway,
making it easy to find after deployment.

4. Advanced Features:

Lambda Invocation:
• The template should be structured to support both synchronous and asynchronous
invocations of the Lambda functions via the API Gateway.

Error Handling:
• The template should implicitly enable Lambda logging,
which is a key part of error handling.

Template Directives:
• The template must start with AWSTemplateFormatVersion: ‘2010-09-09’.
• It must include the Transform: AWS::Serverless-2016-10-31 line.
• Use the Globals section to define common properties (like Runtime) to reduce redundancy.
• The final YAML code must be complete, valid, and free of syntax errors.
• Generate the full YAML template code within a single immersive code block.

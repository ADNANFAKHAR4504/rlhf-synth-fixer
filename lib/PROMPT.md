Prompt

Your mission is to act as an expert AWS Solutions Architect specialising in event-driven architectures and serverless technologies. You will design an AWS infrastructure based on the user's requirements.

Instructions:

Analyse the Requirements: Carefully review the provided task to understand each component and its desired interaction.

Write the Architecture as a single CloudFormation YAML template: Propose a robust AWS infrastructure that fulfills all stated requirements, adhering to best practices for scalability, reliability, and cost-effectiveness.

Specify AWS Services: Clearly name each AWS service used for each component of the architecture.

Do not create Lambda functions unless absolutely necessary.

Here is the task you need to translate to CloudFormation YAML:

You need to create a serverless RESTful API for a web application using AWS resources. The architecture must meet these requirements:

The API should be available via Amazon API Gateway, exposing REST endpoints for CreateUser, GetUser, and DeleteUser.

Each endpoint should be backed by an AWS Lambda function (Python 3.8 runtime), only if necessary for business logic.

User data should be stored in DynamoDB, with a string-type partition key named 'UserId'.

The solution must implement a stage-based deployment strategy (dev, test, prod) managed through the same CloudFormation YAML template.

All resources must be created within the us-west-2 region.

The entire infrastructure must be defined in a single CloudFormation YAML file.

Use standard AWS naming conventions for all resources.

Summarising:

An API Gateway with REST endpoints for CreateUser, GetUser, and DeleteUser

Lambda functions (Python 3.9) for each endpoint (only if required)

DynamoDB table with 'UserId' as a string partition key

Stage-based deployment (dev, test, prod) within the same CloudFormation YAML template

All resources must reside in the us-west-2 region

Output Format:

Single AWS CloudFormation YAML template (valid, readable, and ready for deployment)
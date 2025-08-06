Please create a comprehensive AWS CloudFormation YAML template that establishes a serverless RESTful API for managing a simple data entity. The solution should be fully self-contained within the template and adhere to the following specifications:

VPC and Subnet Configuration:

Define a new Virtual Private Cloud (VPC).

Within this VPC, create at least one public subnet and one private subnet.

Ensure proper routing for internet access from the public subnet (e.g., Internet Gateway).

DynamoDB Table:

Define a DynamoDB table named MyCrudTable within the template.

The table should have a primary key (e.g., id of type String).

Include appropriate provisioned throughput settings (e.g., ReadCapacityUnits and WriteCapacityUnits).

AWS Lambda Functions (CRUD Operations):

Create four separate Lambda functions to handle the CRUD operations:

CreateItemFunction: To add new items to MyCrudTable.

GetItemFunction: To retrieve a single item from MyCrudTable by its ID.

UpdateItemFunction: To modify an existing item in MyCrudTable.

DeleteItemFunction: To remove an item from MyCrudTable by its ID.

Each Lambda function should be configured to run within the private subnet of the defined VPC.

Provide minimal Python 3.9 runtime code for each Lambda function. This code should demonstrate the basic interaction with DynamoDB (e.g., using boto3) for its respective CRUD operation. Include placeholder logic for request parsing and response formatting.

Ensure each Lambda function has an IAM Role with the absolute least privilege necessary to perform its specific DynamoDB operation on MyCrudTable only.

API Gateway REST API:

Define a RESTful API Gateway with at least the following endpoints:

POST /items: To trigger CreateItemFunction.

GET /items/{id}: To trigger GetItemFunction.

PUT /items/{id}: To trigger UpdateItemFunction.

DELETE /items/{id}: To trigger DeleteItemFunction.

Configure API Gateway to integrate directly with the respective Lambda functions using Lambda Proxy Integration.

Enable CORS for all API Gateway methods to allow cross-origin requests.

IAM Roles and Policies:

Explicitly define all necessary IAM Roles and Policies for Lambda functions and API Gateway.

Strictly adhere to the principle of least privilege. For example, Lambda functions should only have permissions for their specific DynamoDB actions on the designated table, and API Gateway should only have permission to invoke the specific Lambda functions it integrates with.

Outputs:

Include CloudFormation Outputs for the following:

The API Gateway Invoke URL for the deployed REST API.

The DynamoDB Table Name.

Rollback Capabilities:

The template should inherently support CloudFormation's rollback capabilities in case of deployment failures. Ensure all resources are defined in a way that allows for clean rollback.

The final output must be a complete and valid CloudFormation YAML file that can be deployed directly via the AWS CloudFormation console or CLI without errors, and it should create all the specified resources. Ensure the code for Lambda functions is embedded directly within the template using ZipFile or S3Key (prefer ZipFile for simplicity in this case).

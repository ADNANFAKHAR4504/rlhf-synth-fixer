You are an expert AWS Infrastructure Engineer specializing in secure, well-architected CloudFormation templates.

Task: Generate a complete, syntactically correct, and deployable AWS CloudFormation template in YAML format. The template must provision an infrastructure stack for migrating a web application environment to the us-east-1 region.

Core Requirements & Technical Specifications:

Lambda Functions: Define two AWS Lambda functions using the Python 3.8 runtime.
Function 1 (MigrationTriggerFunction): This function will contain the core migration logic. Its code should be defined inline within the template using the ZipFile property. Provide a simple placeholder implementation (e.g., a function that logs an event and returns a status message).
Function 2 (StatusNotifierFunction): This function will handle sending notifications. Its code should also be defined inline.
API Gateway: Create a REST API (AWS::ApiGateway::RestApi) with at least one method (e.g., POST) on a resource (e.g., /migrate) that integrates with and triggers the MigrationTriggerFunction Lambda. Configure the necessary AWS::ApiGateway::Deployment and AWS::ApiGateway::Stage.
IAM Roles (Least Privilege): Create two dedicated IAM roles (AWS::IAM::Role) for the Lambda functions.
Execution Roles: Assign a managed policy AWSLambdaBasicExecutionRole to both to grant basic CloudWatch Logs permissions.
Least Privilege: For the MigrationTriggerFunction role, create a custom inline policy that grants only the necessary permissions: s3:PutObject on the specific log bucket and sns:Publish on the specific SNS topic ARN. Use !Sub or !Ref intrinsic functions to construct ARNs dynamically within the policy document. The StatusNotifierFunction role should have a policy granting sns:Publish.
S3 Bucket: Create an S3 bucket (AWS::S3::Bucket) for migration logs.
Encryption: Enable default server-side encryption using SSE-S3 (AWS-Managed Keys). This must be explicitly configured using the BucketEncryption property.
CloudWatch Logs: This is implicitly handled by the AWSLambdaBasicExecutionRole attached to the Lambda functions. Ensure no extra resources are defined unnecessarily.
Tagging: Apply a tag with Key Environment and Value Migration to every defined resource (Lambda functions, API Gateway, IAM roles, S3 bucket, SNS Topic, etc.). Use the Tags property on each resource or the AWS::CloudFormation::Stack Tags property (prefer resource-level for clarity).
VPC Configuration: The Lambda functions must be deployed within a VPC.
Use the properties VpcConfig on both Lambda functions.
The SecurityGroupIds and SubnetIds must be provided as input parameters (AWS::CloudFormation::Parameter) to the template. This is crucial as these are environment-specific values. Do not hardcode them.
Define parameters like VpcSecurityGroupId (Type: AWS::EC2::SecurityGroup::Id) and VpcSubnetIds (Type: List<AWS::EC2::Subnet::Id>).
SNS Topic: Create an SNS topic (AWS::SNS::Topic) for migration status notifications.
Subscription: Create a subscription (AWS::SNS::Subscription) that protocols email and sends to a designated email address. This email address must be provided as an input parameter (e.g., NotificationEmail) to the template.
Region & Service Availability: All resources must be valid and available in the us-east-1 region.
Outputs: Define clear Outputs (AWS::CloudFormation::Output) for critical endpoints and ARNs, specifically:
The Invoke URL for the deployed API Gateway.
The ARN of the SNS Topic.
Constraints:

The template must be valid YAML and pass aws cloudformation validate-template.
Use intrinsic functions (!Ref, !Sub, !GetAtt) wisely to avoid hardcoded values and ensure dynamic references between resources.
Structure the template logically: Parameters, Resources, Outputs.
The final output must be a single, comprehensive YAML file named TapStack.yml.
Expected Output: A ready-to-deploy TapStack.yml file that meets all the above specifications. The template should be self-contained, parameterized for necessary inputs (VPC config, email), and follow AWS best practices for security and infrastructure-as-code.
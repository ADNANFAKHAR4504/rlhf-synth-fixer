## Build a Self-Contained Serverless Application

You are an AWS Solutions Architect specializing in serverless architectures and Infrastructure as Code. Build a complete serverless application for the US East (N. Virginia) region.

Create a single, self-contained, production-ready infrastructure that deploys a complete serverless application. The template must create all required resources from scratch, including networking and certificates, making it fully portable and reusable for different environments.

You are building the entire backend for an application that processes files. The system must be event-driven, responding automatically to new files, but also allow for direct interaction via a public API. The entire stack, from the DNS zone to the final monitoring alarm, must be defined, driven by an environment suffix to ensure uniqueness.

The infrastructure must provision the following interconnected resources.

Template Parameters

- EnvironmentSuffix: A string parameter to distinguish environments (e.g., dev, stg, prod). This will be appended to resource names.
- RootDomainName: The root domain for the application (e.g., example.com).

DNS and Certificate Management

- Route 53 Hosted Zone: Create a new public hosted zone for the RootDomainName.
- ACM Certificate: Create a new AWS Certificate Manager certificate for a dynamic subdomain (e.g., api-${EnvironmentSuffix}.${RootDomainName}).
- DNS Validation: The certificate must use DNS validation. The template must also automatically create the necessary Route 53 CNAME record in the new hosted zone to prove ownership and complete the validation process. Add a comment explaining that the stack deployment might pause until this validation is complete.

S3 Bucket

- Create an S3 bucket with versioning enabled. The bucket name must be dynamic, incorporating the EnvironmentSuffix.

Lambda Function

- Provision a Lambda function with the Python runtime.
- Cost Control: Set the ReservedConcurrentExecutions property to 10.
- IAM Role: Create a dedicated IAM role for the Lambda with a least-privilege policy granting permissions for s3:GetObject on the S3 bucket and writing logs to CloudWatch.

API Gateway with Custom Domain only if Domain Prameter is suppied default skip it

- Set up a REST API Gateway that integrates with the Lambda function.
- Custom Domain: Configure the API Gateway to use the dynamic custom domain and the ACM Certificate created within this stack. This will involve creating AWS::ApiGateway::DomainName and AWS::ApiGateway::BasePathMapping resources.
- DNS: Create a Route 53 A record that aliases the dynamic custom domain (e.g., api-prod.example.com) to the API Gateway domain name.
- CORS: Enable Cross-Origin Resource Sharing on the API Gateway method.

Event Triggers & Permissions

- Configure an S3 Bucket Notification to trigger the Lambda function on object creation.
- Create AWS::Lambda::Permission resources to grant invoke permissions to both the S3 service and the API Gateway service.

Monitoring & Alerting

- Provision an SNS Topic for sending alerts.
- Create a CloudWatch Alarm that monitors the Lambda's error rate and triggers if the average rate exceeds 5% over a 5-minute period. The alarm's action must be to publish to the SNS Topic.

Resource Tagging

- All resources must be tagged with a dynamic Name tag (e.g., ServerlessApp-${EnvironmentSuffix}) and a static Environment tag based on the suffix.

Expected Output

- A single, complete, and well-commented infrastructure template. The code should be clean, valid, and handle the creation of all resources, including the Route 53 zone and the automated validation of the ACM certificate.

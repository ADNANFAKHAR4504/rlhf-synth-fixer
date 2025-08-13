You are a senior cloud engineer. Generate a single, production-grade CloudFormation template (YAML) that provisions a serverless architecture in us-east-1 following the AWS Well-Architected Framework and least-privilege IAM.

Language & Platform Language: YAML

Platform: AWS CloudFormation (no SAM, no CDK)

Architecture (must-have) Amazon API Gateway (HTTP API, API Gateway v2) exposes an endpoint.

AWS Lambda (Python 3.12) is invoked by API Gateway.

Amazon S3 bucket stores the Lambda’s processed output.

Functional Flow Client calls API Gateway endpoint.

API Gateway invokes the Lambda function (proxy-style integration).

Lambda reads request payload, processes it, and writes an object to the S3 bucket.

The response from Lambda is returned to the client via API Gateway.

Region & Naming Region: US East (N. Virginia) — us-east-1.

Naming Convention: prod-- for resource Name tags and logical names where appropriate. Example: prod-lambda-processor, prod-s3-app-output, prod-apigw-http.

Security & Compliance (Well-Architected/Least Privilege) IAM: Define a dedicated Lambda execution role with least-privilege inline policy:

logs:CreateLogGroup, logs:CreateLogStream, logs:PutLogEvents scoped to the specific log group.

xray:PutTraceSegments, xray:PutTelemetryRecords.

s3:PutObject (and s3:PutObjectAcl only if required) restricted to the specific S3 bucket/prefix used by this app.

S3:

Block all public access.

Server-side encryption enabled (SSE-S3 is acceptable; expose a parameter to opt into SSE-KMS with CMK if desired).

Versioning enabled.

Bucket policy that denies unencrypted uploads (if using SSE-KMS, enforce aws:kms condition) and denies insecure transport.

Logging & Observability:

CloudWatch LogGroup for Lambda with a sane RetentionInDays (e.g., 14 or 30).

API Gateway HTTP API access logs enabled with a Log Group.

X-Ray Tracing enabled for Lambda.

Networking:

Lambda may run without a VPC unless explicitly required.

Data Protection:

No public S3 access.

TLS enforced (deny aws:SecureTransport=false in S3 policy).

Operational Excellence Use Parameters for customizable inputs:

Environment (default prod),

ArtifactBucketNameSuffix or OutputBucketName (ensure global uniqueness; derive a short suffix from StackId),

optional UseKms and KmsKeyArn.

Use Mappings/Conditions where helpful (e.g., only attach KMS policy if UseKms).

Apply Tags (Environment=prod, Application=prod-serverless-app, etc.) across all resources.

Include Outputs:

ApiEndpoint

LambdaFunctionArn

OutputBucketName

Lambda Implementation Notes Runtime: python3.12

Handler: app.handler

Code Packaging: Use Code.ZipFile with an inline minimal Python handler that:

Parses JSON body from the API request,

Writes a processed artifact to S3 under a predictable prefix (e.g., processed/),

Returns a JSON response with status and S3 object key.

Include basic input validation and error handling within the example handler.

API Gateway v2 (HTTP API) Requirements Create AWS::ApiGatewayV2::Api, AWS::ApiGatewayV2::Integration, AWS::ApiGatewayV2::Route, and AWS::ApiGatewayV2::Stage.

Use Lambda proxy integration.

Enable access logging on the Stage (create a dedicated Log Group).

Add AWS::Lambda::Permission to allow API Gateway to invoke the function.

Constraints (must satisfy) Deploys Lambda + API Gateway + S3 in a serverless design.

Aligns with AWS Well-Architected best practices described above.

Implements least-privilege IAM for all roles/policies.

Entire infrastructure defined in CloudFormation YAML.

Expected Output Only a valid CloudFormation YAML template inside a single fenced code block (yaml … ).

No prose, no commentary outside the code block.

The template must be directly deployable via aws cloudformation deploy without modification (aside from parameter values).

Acceptance Checklist (bake into the template) Parameters for environment and bucket naming, optional KMS usage.

S3 bucket:

Block Public Access, versioning, encryption, deny unencrypted/insecure requests.

Lambda:

Python 3.12 runtime, minimal inline code, environment variables for bucket name/prefix.

Execution role with least-privilege policies limited to the created resources.

Dedicated LogGroup with retention; X-Ray tracing enabled.

API Gateway v2:

HTTP API with Lambda proxy integration, route (e.g., POST /process), Stage with access logging.

Lambda permission for API Gateway.

Outputs: API endpoint URL, Lambda ARN, S3 bucket name.

Tags applied consistently.

Logical names and Name tags respect prod--.
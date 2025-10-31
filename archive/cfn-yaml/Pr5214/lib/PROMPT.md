Create a single CloudFormation template named **TapStack.yml** (YAML) that provisions a complete, serverless environment to process JSON files uploaded to S3, trigger AWS Lambda for transformation, persist results in DynamoDB, and expose a secured API via API Gateway. The template must declare **all parameters, mappings, conditions, resources, and outputs** required for a fresh deployment—no references to pre-existing resources.

## Region & availability:

* Hard-target **us-east-1**.
* Design for high availability across **multiple AZs**. Create a new VPC spanning at least **two AZs** with public and private subnets; place Lambda functions in **private subnets** behind VPC endpoints (no EC2).

## Naming & tagging requirements:

* Every resource name (where supported) must include a suffix parameter **ENVIRONMENT_SUFFIX** (e.g., `prod`, `staging`, `dev`), applied consistently to avoid cross-deployment conflicts.
* Add **cost allocation tags** to all taggable resources:

  * `Project = TapStack`
  * `Environment = !Ref ENVIRONMENT_SUFFIX`
  * `Owner = PlatformTeam`
  * `CostCenter = DP-001`

## Security, IAM, and encryption:

* **IAM least privilege**: create narrowly scoped execution roles/policies only for resources they manage (Lambda → S3 read/write on its buckets, DynamoDB table CRUD, CloudWatch logs; API Gateway execution; SNS publish from alarms; Cognito limited admin where required).
* **Encryption**:

  * **S3** default encryption: **SSE-S3 (AES-256)** for all objects; bucket policy must **deny** any `s3:PutObject` without `s3:x-amz-server-side-encryption = AES256`.
  * **DynamoDB**: enable **SSE-KMS** using a **customer-managed KMS key** created in this stack.
  * **Application data**: use the same CMK for Lambda environment variable encryption and any future app secrets (demonstrate with an example encrypted env var).
* **S3 access restriction**: create an **S3 Gateway VPC Endpoint** and restrict bucket access via bucket policy conditions using **`aws:SourceVpce`** (allow only the created endpoint) and explicit `Deny` for any other source. (Do not use EC2; Lambdas access S3 via the VPC + endpoint.)
* **No EC2 instances** anywhere.

## Data flow:

1. Client uploads JSON to **IngestBucket**.
2. S3 `ObjectCreated:*` event invokes **TransformFunction** (Lambda in private subnets).
3. Lambda validates/transforms JSON and writes results to **DynamoDB ResultsTable**.
4. Optional synchronous path: **API Gateway** `POST /process` routes to **ApiHandlerFunction** to accept payloads and push to the same ResultsTable.

## Services & configurations to include:

* **VPC**:

  * CIDR parameterized (default `10.0.0.0/16`), two private + two public subnets across different AZs, NAT Gateways for egress from private subnets if needed.
  * **Gateway VPC Endpoint for S3** and **Interface VPC Endpoints** for CloudWatch Logs and SNS (to keep traffic private where practical).
* **S3 buckets**:

  * `IngestBucket-<ENVIRONMENT_SUFFIX>` and `ArtifactsBucket-<ENVIRONMENT_SUFFIX>` with:

    * Block Public Access, versioning enabled.
    * Default encryption **SSE-S3**.
    * Lifecycle rule: transition **all objects to Glacier** (e.g., Glacier Instant Retrieval or Flexible Retrieval) after **30 days**.
    * Bucket policies:

      * Deny unencrypted puts unless `AES256`.
      * Allow access **only** via the created **VPC Endpoint (aws:SourceVpce)**.
      * Deny non-TLS (aws:SecureTransport = false).
* **DynamoDB**:

  * `ResultsTable-<ENVIRONMENT_SUFFIX>` with on-demand or provisioned + **Auto Scaling** policies for **RCU/WCU**:

    * Target utilization ~70%, min/max capacity parameters.
  * **CloudWatch Alarm(s)** for throttling and write concurrency pressure:

    * Alarm on `ThrottledRequests` (Write) and `WriteThrottleEvents` with TableName dimension.
    * SNS Topic notifications to **DevelopersTopic-<ENVIRONMENT_SUFFIX>`.
* **KMS**:

  * CMK `app-cmk-<ENVIRONMENT_SUFFIX>` with key policy granting least-privilege access to Lambda, DynamoDB, and CloudWatch Logs as required.
* **Lambda**:

  * `TransformFunction-<ENVIRONMENT_SUFFIX>` and `ApiHandlerFunction-<ENVIRONMENT_SUFFIX>`:

    * Runtimes parameterized (default Python 3.12).
    * Memory/timeout/env vars parameterized.
    * VPC config → **private subnets**, security group least-privilege egress.
    * Execution roles with only needed permissions (S3 read from ingest, write to results, logs, KMS decrypt, DynamoDB put/update/query).
  * **CloudWatch Logs**: explicit `AWS::Logs::LogGroup` with retention parameter (e.g., 30 days).
* **API Gateway** (REST API):

  * `TapApi-<ENVIRONMENT_SUFFIX>` with **Deployment** and **Stage** `v1-<ENVIRONMENT_SUFFIX>`.
  * Access logging to CloudWatch Logs, execution logging enabled, throttling default limits parameterized.
  * `POST /process` integrated with `ApiHandlerFunction` (Lambda proxy integration), proper IAM permissions (`InvokeFunction`).
* **Cognito**:

  * **User Pool** `TapUsers-<ENVIRONMENT_SUFFIX>`, **User Pool Client** (no secret) for web use.
  * **Identity Pool** if needed for signed access patterns (minimal example acceptable); lock scopes and demonstrate least-privilege roles for authenticated identities.
* **SNS**:

  * Topic `DevelopersTopic-<ENVIRONMENT_SUFFIX>` with an **Email** subscription parameter (developer email); outputs the **Subscription ARN** and **Topic ARN**.
* **Monitoring & metrics**:

  * CloudWatch Alarms on:

    * Lambda errors (`Errors`, `Throttles`) for both functions.
    * API Gateway 5XX errors in the stage.
    * DynamoDB write throttling as noted.
  * All alarms notify `DevelopersTopic-<ENVIRONMENT_SUFFIX>`.

## API, auth, and staging:

* Expose the API Gateway invoke URL in Outputs.
* Provide Outputs for **Cognito User Pool Id**, **User Pool Client Id**, and (if created) **Identity Pool Id**.
* Include a parameter **ApiStageName** defaulting to `v1-<ENVIRONMENT_SUFFIX>`.

## Parameters (define with sensible defaults and allowed patterns):

* `ENVIRONMENT_SUFFIX` (Required; e.g., `dev|staging|prod`).
* `VpcCidr`, `PrivateSubnetACidr`, `PrivateSubnetBCidr`, `PublicSubnetACidr`, `PublicSubnetBCidr`.
* `LambdaRuntime`, `LambdaTimeoutSeconds`, `LambdaMemoryMb`, `LogRetentionDays`.
* `DDBReadCapacityMin`, `DDBReadCapacityMax`, `DDBWriteCapacityMin`, `DDBWriteCapacityMax`, `DDBTargetUtilization`.
* `DeveloperAlertEmail`.
* `ApiStageName`.
* `EnableNatGateways` (bool; default true).
* Any other parameters necessary to make the stack portable and repeatable.

## Conditions & mappings:

* Conditions for optional NAT gateway creation and optional Interface Endpoints.
* AZ mapping not required if using `Fn::GetAZs`, but ensure subnets are spread across **at least two AZs**.

## Events & permissions:

* S3 → Lambda event notification on `ObjectCreated:*` for **IngestBucket-<ENVIRONMENT_SUFFIX>`.
* `AWS::Lambda::Permission` to allow S3 to invoke `TransformFunction`.
* API Gateway → Lambda permission for `ApiHandlerFunction`.

## Outputs (comprehensive and human-useful):

* VPC Id, Private/Public Subnet Ids, VPC Endpoint Id(s).
* S3 bucket names and ARNs.
* DynamoDB table name and ARN.
* KMS Key Id and ARN.
* Lambda ARNs and Log Group names.
* API invoke URL and Stage name.
* SNS Topic ARN and Subscription(s).
* Cognito User Pool Id, User Pool Client Id (and Identity Pool Id if created).

## Compliance & best practices checklist (enforce in the template):

* **No EC2** resources.
* Multi-AZ subnets; Lambdas placed in private subnets.
* S3 bucket policies: enforce **SSE-S3**, **TLS required**, **VPC endpoint restriction (aws:SourceVpce)**.
* DynamoDB **SSE-KMS** with CMK from this stack.
* KMS grants/policies minimal and explicit.
* IAM policies are **resource-scoped** and action-scoped; no wildcards beyond what’s strictly necessary.
* API Gateway logging, metrics, throttling set.
* CloudWatch Alarms wired to SNS.
* Lifecycle rule → Glacier transition at **30 days**.
* Cost allocation tags applied to every resource supporting Tags.

## Deliverable:

* A single, production-ready **TapStack.yml** CloudFormation template that:

  * Declares all **Parameters, Mappings, Conditions, Resources, and Outputs**.
  * Implements the **full environment** described above with **ENVIRONMENT_SUFFIX** in all names.
  * Passes `cfn-lint` validation.
  * Can be deployed via AWS CLI in **us-east-1** for a brand-new environment without referencing external resources.

## Acceptance criteria:

* Uploading a JSON file to `IngestBucket-<ENVIRONMENT_SUFFIX>` triggers the transform Lambda and persists records to `ResultsTable-<ENVIRONMENT_SUFFIX>`.
* API Gateway `POST /process` successfully invokes the API Lambda and writes to the same table.
* S3 refuses unencrypted uploads or traffic not using TLS, and denies access outside the specified **VPC Endpoint**.
* DynamoDB autoscaling adjusts capacity within configured min/max; CloudWatch alarms fire on throttling and route to SNS.
* Cognito resources are created and returned in Outputs for application integration.
* All resources show required **cost tags** upon creation.
I need a complete AWS **CDK (Python)** project that deploys a secure, highly available serverless data-processing stack in **us-east-1**. Use a single stack unless there's a clear reason to split. Follow these requirements exactly:

**Services & behavior**

- Lambda using **nodejs14.x** to process requests.
- API Gateway (HTTP) exposing **POST /process** to invoke the Lambda.
- DynamoDB table with partition key **id** (String). Throughput must be configurable via parameters with a **minimum of 5 RCU and 5 WCU**.
- S3 bucket for processed data with **no public access**, **server-side encryption at rest**, **versioning enabled**, and **Object Lock enabled at creation**.
- CloudFront distribution in front of the S3 bucket serving content over **HTTPS**.
- SNS topic with an **email subscription** to receive notifications on Lambda errors.
- CloudWatch LogGroup for the Lambda with **1 month (30 days)** retention.
- API Gateway access logging enabled and a **usage plan** that limits requests to **1000 per day** (attach an API key).

**Security & IAM**

- All resources created in **us-east-1**.
- Encryption at rest enabled (AWS-managed keys are acceptable).
- Use IAM **roles** and attach **separate IAM Policy** resources (no inline policies). Follow **least privilege** for all roles — Lambda should only be able to read the DynamoDB table and write to the S3 bucket (plus basic logging).
- Block all public access on the S3 bucket.

**Parameterization & tags**

- Parameterize resource names using a `ResourcePrefix` (or similar) to avoid collisions.
- Add parameters: `ResourcePrefix`, `DynamoDbReadCapacity`, `DynamoDbWriteCapacity`, `AlertEmail`.
- All resources should be tagged with `Environment=Production`.

**Deliverables**

1. A complete CDK Python project: `app.py`, stack file(s) (e.g., `iac_stack.py`), `requirements.txt`, and `cdk.json`.
2. The stack must create all resources above and satisfy every requirement.
3. A short explanation describing how each requirement was met.
4. Exact commands to install dependencies and deploy (e.g., `pip install -r requirements.txt`, `cdk bootstrap`, `cdk synth`, `cdk deploy`).

**Implementation notes**

- Enable S3 Object Lock at bucket creation (must be created with Object Lock enabled).
- Use API Gateway stage logging and a dedicated LogGroup.
- Implement Usage Plan with a 24-hour quota of 1000 requests and an API key.
- Use CloudFront secure origin access (OAC) or equivalent to restrict direct S3 access.
- Ensure template is practical to synth/deploy and follows AWS best practices.

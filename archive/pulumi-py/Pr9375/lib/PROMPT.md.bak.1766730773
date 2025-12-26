# Revised Prompt — aligned to current implementation (TapStack)

**Goal**  
Provide a Pulumi Python component that provisions a small serverless stack used for testing and lightweight CRUD operations.

**Constraints / Environment**
- AWS region: `us-east-1` (N. Virginia).
- Project uses a Pulumi ComponentResource implemented in `lib/tap_stack.py`.
- The main component class must be `TapStack` and accept `TapStackArgs` (environment suffix, tags).
- Tests and CI rely on importing `lib.tap_stack`.

**Required Resources & Configuration (exactly what the implementation does)**

1. **DynamoDB Table**
   - Resource type: `aws.dynamodb.Table`
   - Name pattern: `<environment_suffix>-items-table`
   - Composite primary key:
     - Partition key: `ItemId` (string)
     - Sort key: `CreatedAt` (string)
   - Billing mode: `PAY_PER_REQUEST`
   - Point-in-time recovery and server-side encryption enabled.
   - Table ARN used to generate a least-privilege IAM policy for the Lambda.

2. **IAM**
   - Create a Lambda IAM Role with:
     - `AWSLambdaBasicExecutionRole` attached for CloudWatch Logs.
     - A custom inline/managed policy granting **least-privilege** access to the specific DynamoDB table and its indexes (only `GetItem`, `PutItem`, `UpdateItem`, `DeleteItem`, `Query`, `Scan`).
   - All created IAM objects must be tagged using `args.tags`.

3. **Lambda Function (inline)**
   - Runtime: `python3.9`
   - Name pattern: `<environment_suffix>-items-lambda`
   - Inline code embedded via `pulumi.AssetArchive` / `StringAsset`. (The current implementation uses a lightweight handler that returns a JSON message.)
   - `timeout` set to `5` seconds and `memory_size` to `128`.
   - `environment` variables must include `DYNAMODB_TABLE_NAME` pointing to the table name.
   - `publish=True` so provider publishes a version automatically (no separate Version resource required).
   - Tags applied.

   > Note: The current handler is intentionally a lightweight "HTTP hello" handler (for quick deploy & smoke tests). It does not perform full DynamoDB CRUD in its current form, but the infrastructure provides the table and role to do so.

4. **API Gateway (REST v1)**
   - Create a `RestApi` named `<environment_suffix>-items-api`.
   - Resources:
     - `/items`
     - `/items/{ItemId}`
     - `/items/{ItemId}/{CreatedAt}`
   - Methods:
     - `GET`, `POST` on `/items`
     - `GET`, `PUT`, `DELETE` on `/items/{ItemId}/{CreatedAt}`
     - `OPTIONS` methods for CORS
   - Each method uses `AWS_PROXY` integration to the Lambda `invoke_arn`.
   - Create a `Deployment` and `Stage` named `prod`.
   - **Throttle** Stage/Method settings:
     - `rate_limit` ≈ `17` (approx. 1000 RPM)
     - `burst_limit` ≈ `50`

5. **Logging & Monitoring**
   - CloudWatch Log Group created with the name `/aws/lambda/<lambda_function_name>`, retention 14 days.
   - CloudWatch Metric Alarms for Lambda:
     - Duration (Average), threshold ~ 4000 ms
     - Errors (Sum), threshold ≥ 1
     - Throttles (Sum), threshold ≥ 1
   - An SNS topic is created and used as the alarm action target.
   - Tagging applied to alarms and SNS topic.

6. **Tagging**
   - Apply tags from `TapStackArgs.tags` to all created resources. Recommended default tags include `{"Project": "IaC-Nova-Test", "Owner": "LLM-Eval"}`.

7. **Outputs**
   - Register and export (via `register_outputs`) at least:
     - `dynamodb_table_name`
     - `lambda_function_name`
     - `api_rest_id`
     - `api_stage`
     - `alarm_topic_arn`

8. **Scaling behavior (as implemented)**
   - API Gateway throttling configured to support ~1000 RPM.
   - The current implementation **does not** create AppAutoScaling scalable targets or provisioned concurrency resources. The Lambda is published (versioned) but relies on on-demand concurrency for normal operation. (This is deliberate to avoid provider-version quirks in some environments.)
   - Tests and CI should expect throttling to be configured on the API stage, not an autoscaling resource.

**Deliverable**
- A Pulumi ComponentResource implemented at `lib/tap_stack.py` named `TapStack`.
- `TapStack` should be importable by tests as `from lib.tap_stack import TapStack, TapStackArgs`.
- Unit tests and integration tests will validate resources creation via mocked Pulumi runtime (unit) and live AWS (integration).


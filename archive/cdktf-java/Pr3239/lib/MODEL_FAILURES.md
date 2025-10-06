# MODEL FAILURES

#### 1. API Gateway CloudWatch Logging Configuration

**Model Response:**
Failed to properly configure CloudWatch logging for API Gateway. Missing critical IAM role and account configuration required for API Gateway to write logs to CloudWatch.

**Actual Implementation:**
Includes comprehensive CloudWatch logging setup:
- Creates dedicated IAM role `APIGatewayCloudWatchLogsRole` with proper assume role policy for `apigateway.amazonaws.com`
- Attaches AWS managed policy `AmazonAPIGatewayPushToCloudWatchLogs`
- Configures `ApiGatewayAccount` with the CloudWatch role ARN
- Adds `dependsOn` relationship in `ApiGatewayMethodSettings` to ensure proper resource ordering
- Enables `dataTraceEnabled`, `metricsEnabled`, and `loggingLevel: "INFO"`

---

#### 2. Lambda Deployment Package Management

**Model Response:**
Used a simplistic approach with hardcoded S3 key (`"lambda-deployment.zip"`) without proper asset management or versioning.

**Actual Implementation:**
Implements sophisticated deployment package management:
- Uses `TerraformAsset` with `AssetType.ARCHIVE` for proper code packaging
- Automatically resolves Lambda source code path: `lib/src/main/java/app/lambda`
- Generates versioned S3 keys: `"lambda-deployments/" + functionName + System.currentTimeMillis() + ".zip"`
- Includes `sourceHash` for proper change detection and redeployment
- Uses `s3ObjectVersion` parameter for version-aware deployments
- Adds proper `dependsOn` relationships between S3Object and Lambda function

---

#### 3. CloudWatch Metric Filter Critical Fix

**Model Response:**
Used incorrect log pattern `"[ERROR]"` which would not match standard Lambda error logging formats.

**Actual Implementation:**
**Line 41 fix**: Uses correct pattern `"ERROR"` (without brackets) which properly matches Lambda error log entries. Additionally adds `defaultValue("0")` parameter in `CloudwatchLogMetricFilterMetricTransformation` to ensure proper metric behavior when no errors occur.

---

#### 4. S3 Bucket Resource Updates and API Changes

**Model Response:**
Used outdated CDKTF S3 resource classes and missed critical configuration parameters.

**Actual Implementation:**
- Uses updated `S3BucketVersioningA` class instead of deprecated `S3BucketVersioning`
- Implements dynamic bucket naming with timestamp: `resourceName("lambda-deployments-" + System.currentTimeMillis()).toLowerCase()`
- Properly handles bucket name uniqueness and AWS naming conventions

---

#### 5. API Gateway Deployment Dependencies

**Model Response:**
Created deployment with incomplete dependency graph, missing integration dependencies.

**Actual Implementation:**
Fixes deployment dependencies by including both methods AND integrations:
```java
.dependsOn(Arrays.asList(getMethod, postMethod, getIntegration, postIntegration))
```
This ensures proper resource creation order and prevents deployment failures.

---

#### 6. IAM Policy Resource ARN Construction

**Model Response:**
Used hardcoded region and wildcards in IAM policy ARN construction.

**Actual Implementation:**
Uses dynamic region resolution in IAM policies:
```java
"arn:aws:logs:" + getRegion() + ":*:log-group:/aws/lambda/" + getPrefix() + "*"
```
This ensures policies work correctly across different AWS regions and account configurations.

---

#### 7. Collection Framework Modernization

**Model Response:**
Used older Java collection patterns like `Arrays.asList()` throughout the codebase.

**Actual Implementation:**
Uses modern Java collection methods:
- `List.of()` instead of `Arrays.asList()` for immutable list creation
- Proper generic type safety in collection declarations
- Modern Java syntax patterns for better performance and readability
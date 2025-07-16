# Unit tests

```text
PASS  test/tap-stack.unit.test.ts
  TapStack
    Stack Creation
      ✓ should create a TapStack instance (498 ms)
      ✓ should create MetadataProcessingStack as nested stack (88 ms)
      ✓ should handle different environment suffix configurations (123 ms)
  MetadataProcessingStack
    Stack Creation
      ✓ should create a MetadataProcessingStack instance (93 ms)
    S3 Bucket
      ✓ should create S3 bucket with correct properties (87 ms)
      ✓ should have deletion policy set to Delete (95 ms)
    DynamoDB Table
      ✓ should create DynamoDB table with correct schema (80 ms)
      ✓ should have deletion policy set to Delete (70 ms)
    OpenSearch Serverless
      ✓ should create OpenSearch collection (68 ms)
      ✓ should create security policy for encryption (77 ms)
      ✓ should create network policy (77 ms)
      ✓ should create data access policy (75 ms)
    Lambda Function
      ✓ should create Lambda function for OpenSearch indexing (73 ms)
      ✓ should create Lambda layer for OpenSearch dependencies (81 ms)
      ✓ should have environment variables for OpenSearch configuration (86 ms)
    Step Functions
      ✓ should create Step Function state machine (71 ms)
      ✓ should have role configuration (69 ms)
    EventBridge
      ✓ should create EventBridge rule for metadata.json files (78 ms)
      ✓ should target Step Function from EventBridge rule (71 ms)
    CloudWatch Alarms
      ✓ should create CloudWatch alarm for Step Function failures (73 ms)
    IAM Permissions
      ✓ should create correct number of IAM roles (76 ms)
      ✓ should create correct number of IAM policies (71 ms)
      ✓ should grant Lambda permissions to access OpenSearch (85 ms)
      ✓ should create roles with proper assume role policies (82 ms)
    Stack Outputs
      ✓ should output bucket name (74 ms)
      ✓ should output state machine ARN (74 ms)
      ✓ should output OpenSearch collection details (73 ms)
      ✓ should output DynamoDB table name (70 ms)
      ✓ should output Lambda function ARN (71 ms)
      ✓ should output CloudWatch alarm name (72 ms)
    Resource Count Validation
      ✓ should create expected number of resources (80 ms)
      ✓ should have correct number of OpenSearch security policies (76 ms)
      ✓ should have correct number of IAM roles and policies (66 ms)
      ✓ should have proper resource dependencies (68 ms)
      ✓ should create stack with proper naming conventions (67 ms)

-------------------|---------|----------|---------|---------|-------------------
File               | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
-------------------|---------|----------|---------|---------|-------------------
All files          |     100 |      100 |     100 |     100 |                   
 metadata-stack.ts |     100 |      100 |     100 |     100 |                   
 tap-stack.ts      |     100 |      100 |     100 |     100 |                   
-------------------|---------|----------|---------|---------|-------------------
Test Suites: 1 passed, 1 total
Tests:       35 passed, 35 total
Snapshots:   0 total
Time:        3.843 s, estimated 4 s
 PASS  test/tap-stack.unit.test.ts
  TapStack
    Stack Creation
      ✓ should create a TapStack instance (498 ms)
      ✓ should create MetadataProcessingStack as nested stack (88 ms)
      ✓ should handle different environment suffix configurations (123 ms)
  MetadataProcessingStack
    Stack Creation
      ✓ should create a MetadataProcessingStack instance (93 ms)
    S3 Bucket
      ✓ should create S3 bucket with correct properties (87 ms)
      ✓ should have deletion policy set to Delete (95 ms)
    DynamoDB Table
      ✓ should create DynamoDB table with correct schema (80 ms)
      ✓ should have deletion policy set to Delete (70 ms)
    OpenSearch Serverless
      ✓ should create OpenSearch collection (68 ms)
      ✓ should create security policy for encryption (77 ms)
      ✓ should create network policy (77 ms)
      ✓ should create data access policy (75 ms)
    Lambda Function
      ✓ should create Lambda function for OpenSearch indexing (73 ms)
      ✓ should create Lambda layer for OpenSearch dependencies (81 ms)
      ✓ should have environment variables for OpenSearch configuration (86 ms)
    Step Functions
      ✓ should create Step Function state machine (71 ms)
      ✓ should have role configuration (69 ms)
    EventBridge
      ✓ should create EventBridge rule for metadata.json files (78 ms)
      ✓ should target Step Function from EventBridge rule (71 ms)
    CloudWatch Alarms
      ✓ should create CloudWatch alarm for Step Function failures (73 ms)
    IAM Permissions
      ✓ should create correct number of IAM roles (76 ms)
      ✓ should create correct number of IAM policies (71 ms)
      ✓ should grant Lambda permissions to access OpenSearch (85 ms)
      ✓ should create roles with proper assume role policies (82 ms)
    Stack Outputs
      ✓ should output bucket name (74 ms)
      ✓ should output state machine ARN (74 ms)
      ✓ should output OpenSearch collection details (73 ms)
      ✓ should output DynamoDB table name (70 ms)
      ✓ should output Lambda function ARN (71 ms)
      ✓ should output CloudWatch alarm name (72 ms)
    Resource Count Validation
      ✓ should create expected number of resources (80 ms)
      ✓ should have correct number of OpenSearch security policies (76 ms)
      ✓ should have correct number of IAM roles and policies (66 ms)
      ✓ should have proper resource dependencies (68 ms)
      ✓ should create stack with proper naming conventions (67 ms)

-------------------|---------|----------|---------|---------|-------------------
File               | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
-------------------|---------|----------|---------|---------|-------------------
All files          |     100 |      100 |     100 |     100 |                   
 metadata-stack.ts |     100 |      100 |     100 |     100 |                   
 tap-stack.ts      |     100 |      100 |     100 |     100 |                   
-------------------|---------|----------|---------|---------|-------------------
Test Suites: 1 passed, 1 total
Tests:       35 passed, 35 total
Snapshots:   0 total
Time:        3.843 s, estimated 4 s
```

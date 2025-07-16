# Integration tests

```text
 PASS  test/tap-stack.int.test.ts (57.244 s)
  Metadata Processing Stack Integration Tests
    Infrastructure Validation
      ✓ should have all required outputs from CDK deployment (3 ms)
      ✓ should have OpenSearch collection accessible
      ✓ should have CloudWatch alarm configured (478 ms)
    S3 Bucket Operations
      ✓ should be able to list objects in the bucket (293 ms)
      ✓ should be able to upload a metadata.json file (287 ms)
    Step Function Processing
      ✓ should trigger step function execution when metadata.json is uploaded (10597 ms)
      ✓ should complete step function execution successfully for valid metadata (10574 ms)
    Error Handling
      ✓ should handle step function failures and store in DynamoDB (296 ms)
      ✓ should have failure table with correct schema (92 ms)
    Lambda Function Integration
      ✓ should have OpenSearch indexer lambda configured correctly (1 ms)
    OpenSearch Document Indexing
      ✓ should index document in OpenSearch when metadata.json is uploaded (20874 ms)
      ✓ should have correct index mapping and document structure (287 ms)
    End-to-End Workflow
      ✓ should process metadata file from upload to indexing (10682 ms)
    Resource Cleanup Verification
      ✓ should be able to delete test objects from S3 (1305 ms)

Test Suites: 1 passed, 1 total
Tests:       14 passed, 14 total
Snapshots:   0 total
Time:        57.533 s
```

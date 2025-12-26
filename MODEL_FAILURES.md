# Model Failures Documentation

## LocalStack Compatibility Issues

### 1. Lambda Concurrency Information Not Returned
- **Test**: `TransactionProcessor should have reserved concurrency of 100`
- **Issue**: LocalStack does not return `Concurrency.ReservedConcurrentExecutions` in GetFunction response
- **Status**: Test skipped with `test.skip()`
- **AWS Behavior**: Returns concurrency settings properly
- **Resolution**: Skipped for LocalStack compatibility; validates via template unit tests

### 2. Lambda KMSKeyArn Not Returned
- **Tests**:
  - `TransactionProcessor should use customer-managed KMS key`
  - `environment variables should be encrypted at rest`
- **Issue**: LocalStack does not return `Configuration.KMSKeyArn` in GetFunction response
- **Status**: Tests skipped with `test.skip()`
- **AWS Behavior**: Returns KMS key ARN when configured
- **Resolution**: Skipped for LocalStack compatibility; validates via template unit tests

## Implementation Deviations

### Runtime Version
- **PROMPT.md**: Does not explicitly specify Node.js runtime version
- **Implementation**: Uses `nodejs20.x` runtime
- **Rationale**: Node.js 20 is current LTS and provides best compatibility with arm64 architecture
- **Impact**: None - meets requirement for Node.js Lambda runtime

# Model Failures

This file will track any failures or issues encountered during the implementation.

## Common Pitfalls to Avoid

1. Missing environmentSuffix in resource names
2. Using RemovalPolicy.RETAIN instead of DESTROY
3. Not configuring X-Ray tracing properly
4. Missing DLQ configuration for Lambda functions
5. Not implementing all 12 mandatory requirements
6. Hardcoding environment names or regions
7. Not using proper IAM least-privilege principles
8. Missing CloudWatch Log retention settings

Fix these CDK errors in the stack:

1. Getting a deprecation warning about pointInTimeRecovery - need to update it to use pointInTimeRecoverySpecification instead
2. Lambda deployment failing because AWS_REGION environment variable is reserved by the runtime and can't be set manually

Fix both issues so the stack deploys cleanly without warnings or errors. Keep all the functionality working the same way.

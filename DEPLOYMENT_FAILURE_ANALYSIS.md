# Deployment Failure Analysis - PR #7459

## Issue Summary

The deployment for stack `TapStackpr7459` failed with the following critical issues:

### 1. Stack in ROLLBACK_FAILED State
**Error**: `Stack:arn:aws:cloudformation:us-east-1:***:stack/TapStackpr7459/e19b0500-cc23-11f0-9862-0afffc61419b is in ROLLBACK_FAILED state and can not be updated.`

**Root Cause**: The stack entered a ROLLBACK_FAILED state due to previous deployment failures, making it impossible to update without first deleting the stack.

### 2. Lambda Reserved Concurrent Executions Error
**Error**:
```
Specified ReservedConcurrentExecutions for function decreases account's UnreservedConcurrentExecution below its minimum value of [100].
```

**Affected Functions**:
- TradeValidatorFunction
- MetadataEnricherFunction
- ComplianceRecorderFunction

**Root Cause**: Previous versions of the template may have included `ReservedConcurrentExecutions` settings that, when combined with other Lambda functions in the AWS account, pushed the unreserved concurrency pool below the minimum required value of 100.

### 3. VPC Endpoint Stabilization Timeout
**Error**:
```
AWS::EC2::VPCEndpoint StepFunctionsVPCEndpoint: Resource handler returned message: "Exceeded attempts to wait" (RequestToken: 36086107-14b9-bbbe-fed4-9d8496c2579f, HandlerErrorCode: NotStabilized)
```

**Root Cause**: The StepFunctionsVPCEndpoint took too long to stabilize, likely due to network configuration or AWS service delays.

## Solution

### Step 1: Clean Up Failed Stack

The stack must be deleted before it can be redeployed. Run the cleanup script:

```bash
./scripts/cleanup-failed-stack.sh TapStackpr7459
```

Or manually:

```bash
aws cloudformation delete-stack --stack-name TapStackpr7459 --region us-east-1
aws cloudformation wait stack-delete-complete --stack-name TapStackpr7459 --region us-east-1
```

### Step 2: Verify Template Configuration

The current template (`lib/TapStack.json`) has been verified to NOT include `ReservedConcurrentExecutions` on any Lambda functions, which is the correct configuration for environments where account-level concurrency limits are a concern.

**Verification**:
```bash
grep -r "ReservedConcurrentExecutions" lib/TapStack.json
# Should return no results
```

### Step 3: Redeploy

Once the failed stack is deleted, redeploy using the standard deployment script:

```bash
ENVIRONMENT_SUFFIX=pr7459 ./scripts/deploy.sh
```

## Prevention

### For Future Deployments:

1. **Monitor AWS Account Limits**: Ensure sufficient unreserved Lambda concurrency is available before deploying multiple stacks
2. **Use ReservedConcurrentExecutions Carefully**: Only set reserved concurrency when absolutely necessary, and calculate the impact on the unreserved pool
3. **VPC Endpoint Timeouts**: Consider adding longer timeout configurations or using Gateway endpoints where possible
4. **Stack Cleanup**: Implement automated cleanup of failed stacks in CI/CD pipelines

## Technical Details

### Lambda Concurrency Calculation

AWS accounts have a default regional concurrency limit (typically 1000). The unreserved pool must maintain at least 100 concurrent executions. When setting `ReservedConcurrentExecutions`:

```
Unreserved Pool = Total Limit - Sum(All Reserved Concurrency)
Minimum Unreserved Pool = 100
```

If multiple Lambda functions reserve concurrency, ensure:
```
Sum(Reserved Concurrency) ≤ (Total Limit - 100)
```

### Current Configuration

The template creates 3 main Lambda functions without reserved concurrency:
- TradeValidatorFunction (no reservation)
- MetadataEnricherFunction (no reservation)
- ComplianceRecorderFunction (no reservation)

All functions use the unreserved pool, allowing dynamic scaling based on demand.

## References

- [AWS Lambda Concurrency Documentation](https://docs.aws.amazon.com/lambda/latest/dg/configuration-concurrency.html)
- [CloudFormation Stack States](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/using-cfn-describing-stacks.html)
- Model Failures: `lib/MODEL_FAILURES.md`

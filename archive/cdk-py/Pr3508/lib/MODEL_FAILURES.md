# Infrastructure Code Issues and Fixes

## Summary
The generated infrastructure code had multiple critical issues preventing successful deployment to AWS. While the code syntax was correct, several AWS service-specific configurations and constraints were not properly implemented.

## Issues Found and Fixed

### 1. X-Ray CfnSamplingRule Incorrect Structure
**Issue**: The X-Ray sampling rule was using direct properties instead of the required `SamplingRuleProperty` wrapper.
```python
# INCORRECT
xray.CfnSamplingRule(
    self,
    "GiftCardSamplingRule",
    rule_name=f"gift-card-sampling-{environment_suffix}",
    priority=1000,  # Direct properties not allowed
    version=1,
    ...
)
```

**Fix**: Wrap properties in `SamplingRuleProperty`:
```python
# CORRECT
xray.CfnSamplingRule(
    self,
    "GiftCardSamplingRule",
    rule_name=f"gift-card-sampling-{environment_suffix}",
    sampling_rule=xray.CfnSamplingRule.SamplingRuleProperty(
        priority=1000,
        version=1,
        ...
    )
)
```

### 2. Reserved Lambda Environment Variable
**Issue**: The code attempted to set `_X_AMZN_TRACE_ID` which is a reserved environment variable for Lambda runtime.
```python
# INCORRECT
environment={
    ...
    "_X_AMZN_TRACE_ID": "Root=1-5e2e340f-1234567890123456",
}
```

**Fix**: Remove the reserved environment variable from Lambda configuration.

### 3. Lambda Auto-Scaling Incorrect Parameter
**Issue**: Used wrong parameter name for Lambda auto-scaling utilization target.
```python
# INCORRECT
.scale_on_utilization(
    target_utilization_percent=70,
)
```

**Fix**: Use correct parameter name:
```python
# CORRECT
.scale_on_utilization(
    utilization_target=0.7,
)
```

### 4. FraudDetector EventType Minimum Labels Requirement
**Issue**: AWS FraudDetector EventType requires at least 2 labels, but only 1 was provided.
```python
# INCORRECT - Only 1 label
labels=[
    frauddetector.CfnEventType.LabelProperty(
        arn=fraud_detector_label.attr_arn,
        inline=False,
        name=fraud_detector_label.name,
    )
],
```

**Fix**: Add second label for legitimate transactions:
```python
# CORRECT - 2 labels
fraud_detector_label_legit = frauddetector.CfnLabel(
    self,
    f"FraudDetectorLabelLegit-{environment_suffix}",
    name=f"legit_label_{environment_suffix}",
    description="Label for legitimate transactions",
)

# In EventType
labels=[
    frauddetector.CfnEventType.LabelProperty(
        arn=fraud_detector_label.attr_arn,
        inline=False,
        name=fraud_detector_label.name,
    ),
    frauddetector.CfnEventType.LabelProperty(
        arn=fraud_detector_label_legit.attr_arn,
        inline=False,
        name=fraud_detector_label_legit.name,
    )
],
```

### 5. API Gateway CloudWatch Logging Configuration
**Issue**: API Gateway requires an IAM role ARN configured at the account level for CloudWatch logging. When this isn't set, deployment fails with: "CloudWatch Logs role ARN must be set in account settings to enable logging"

**Fix**: Disable CloudWatch logging for API Gateway when account-level role is not configured:
```python
# CORRECT - Disable logging when not configured
deploy_options=apigateway.StageOptions(
    stage_name=environment_suffix,
    metrics_enabled=True,
    logging_level=apigateway.MethodLoggingLevel.OFF,
    data_trace_enabled=False,
    tracing_enabled=True,
    throttling_rate_limit=1000,
    throttling_burst_limit=2000,
),
```

### 6. Unit Test Lambda Function Count
**Issue**: Unit test expected 1 Lambda function but stack creates 2 (main function + version for alias).
```python
# INCORRECT
template.resource_count_is("AWS::Lambda::Function", 1)
```

**Fix**: Update test to expect 2 functions:
```python
# CORRECT
template.resource_count_is("AWS::Lambda::Function", 2)  # main + version
```

### 7. Deprecated CDK APIs
**Warning Issues**: Multiple deprecated CDK APIs were used:
- `pointInTimeRecovery` should use `pointInTimeRecoverySpecification`
- `logRetention` should use `logGroup`
- `ruleName` in X-Ray CfnSamplingRuleProps is deprecated

While these still work, they generate warnings and will be removed in future CDK versions.

### 8. Lambda Handler X-Ray SDK Import Error
**Issue**: The Lambda handler imports `aws-xray-sdk` which isn't available in the Lambda runtime by default.

**Fix**: Add conditional import with fallback:
```python
try:
    from aws_xray_sdk.core import xray_recorder
    from aws_xray_sdk.core import patch_all
    patch_all()
    XRAY_AVAILABLE = True
except ImportError:
    XRAY_AVAILABLE = False
    class DummyXRayRecorder:
        def capture(self, name):
            def decorator(func):
                return func
            return decorator
    xray_recorder = DummyXRayRecorder()
```

## Deployment Status
- **Deployment Attempts**: 3
- **Final Status**: BLOCKED - AWS account-level CloudWatch IAM role not configured
- **Resources Successfully Created**: DynamoDB tables, Lambda functions, IAM roles, SNS topic, Secrets Manager, AppConfig, FraudDetector components
- **Resources Failed**: API Gateway Stage (due to CloudWatch logging requirement)

## Recommendations
1. Configure AWS account-level CloudWatch IAM role for API Gateway logging
2. Use Lambda Layers for X-Ray SDK and other dependencies
3. Add environment-specific configuration for logging levels
4. Consider using CDK L2 constructs instead of L1 (Cfn) constructs where available
5. Add deployment validation scripts to catch these issues before AWS deployment

## Quality Rating
**Training Quality**: 5/10
- Good coverage of AWS services
- Correct overall architecture
- Multiple service-specific configuration errors
- Missing knowledge of AWS service constraints and requirements
# Model Failures

## Summary
The model generated a comprehensive CloudWatch monitoring infrastructure but made two critical errors related to Pulumi-specific syntax that prevented successful deployment.

## Failures

### 1. IAM Policy Pulumi Output Handling (CRITICAL)
**Category**: Configuration Error
**Severity**: High
**Impact**: Deployment failure

The model failed to use `pulumi.interpolate` when embedding Pulumi Output values into JSON policy strings. This caused runtime errors because Pulumi Outputs are not directly serializable to JSON.

**Locations**:
- Canary IAM policy: bucket ARN reference
- Composite alarm rule: alarm ARN references
- Metric stream policy: firehose ARN reference
- Firehose policy: S3 bucket ARN reference

**Fix Applied**:
Changed from direct string interpolation to `pulumi.interpolate` for all policy definitions containing Output values.

Example:
```typescript
// BEFORE (incorrect)
policy: JSON.stringify({
  Statement: [{
    Resource: [canaryBucket.arn + "/*"]
  }]
})

// AFTER (correct)
policy: pulumi.interpolate`{
  "Statement": [{
    "Resource": ["${canaryBucket.arn}/*"]
  }]
}`
```

### 2. CloudWatch Dashboard Metric Syntax (MODERATE)
**Category**: Configuration Error
**Severity**: Medium
**Impact**: Dashboard rendering issues

The model generated dashboard widgets with incorrect metric dimension syntax and missing positioning coordinates.

**Issues**:
- Missing widget positioning (x, y, width, height)
- Incorrect metric array format for dimensions
- Missing dimension name-value pairs

**Fix Applied**:
Added proper widget coordinates and corrected metric dimension syntax to match CloudWatch API requirements.

Example:
```typescript
// BEFORE (incorrect)
{
  type: 'metric',
  properties: {
    metrics: [
      ['AWS/ECS', 'CPUUtilization', { stat: 'Average' }]
    ]
  }
}

// AFTER (correct)
{
  type: 'metric',
  x: 0,
  y: 0,
  width: 12,
  height: 6,
  properties: {
    metrics: [
      ['AWS/ECS', 'CPUUtilization', 'ClusterName',
       `payment-cluster-${environmentSuffix}`,
       { stat: 'Average' }]
    ]
  }
}
```

## Root Causes

1. **Pulumi Output Handling**: The model did not properly understand that Pulumi Output types require special handling when embedded in string contexts, particularly JSON policy definitions.

2. **CloudWatch API Knowledge**: The model had incomplete knowledge of CloudWatch dashboard widget positioning requirements and metric dimension array formatting.

## Training Value

These failures represent important learning opportunities:
- Pulumi-specific patterns for handling Output types in policy definitions
- CloudWatch dashboard API requirements for widget layout
- The distinction between infrastructure definition and runtime value resolution in IaC

Both errors are typical of production Pulumi code and provide valuable training data for improving model understanding of IaC-specific patterns.

# Model Failures and Fixes

## Infrastructure Issues Fixed

### 1. CDK UpdatePolicy Method Error - Rolling Update Configuration
**Issue**: The model used `rollingUpdateWithSignals` which doesn't exist in the CDK AutoScaling UpdatePolicy class.

**Original Code**:
```typescript
updatePolicy: autoscaling.UpdatePolicy.rollingUpdateWithSignals({
  minInstancesInService: 1,
  maxBatchSize: 1,
  pauseTime: cdk.Duration.minutes(10),
}),
```

**Fixed Code**:
```typescript
updatePolicy: autoscaling.UpdatePolicy.rollingUpdate({
  minInstancesInService: 1,
  maxBatchSize: 1,
  pauseTime: cdk.Duration.minutes(10),
}),
```

**Root Cause**: The model referenced a non-existent method. The correct method is `rollingUpdate()` without the "WithSignals" suffix.

---

### 2. CDK Scaling Policy Property Error - Invalid Cooldown Properties
**Issue**: The model used `scaleInCooldown` and `scaleOutCooldown` properties which don't exist in `CpuUtilizationScalingProps`.

**Original Code**:
```typescript
const scaleUpPolicy = asg.scaleOnCpuUtilization(`ScaleUpPolicy-${envSuffix}`, {
  targetUtilizationPercent: 70,
  scaleInCooldown: cdk.Duration.minutes(5),    // Invalid property
  scaleOutCooldown: cdk.Duration.minutes(5),   // Invalid property
});
```

**Fixed Code**:
```typescript
const scaleUpPolicy = asg.scaleOnCpuUtilization(`ScaleUpPolicy-${envSuffix}`, {
  targetUtilizationPercent: 70,
  cooldown: cdk.Duration.minutes(5),
});
```

**Root Cause**: The model used incorrect property names. The `CpuUtilizationScalingProps` interface only supports a single `cooldown` property, not separate scale-in and scale-out cooldowns.

---

### 3. CDK AutoScaling Group Method Error - Non-existent Metric Method
**Issue**: The model used `metricCpuUtilization()` method which doesn't exist on the AutoScalingGroup class.

**Original Code**:
```typescript
metric: asg.metricCpuUtilization({
  period: cdk.Duration.minutes(5),
}),
```

**Fixed Code**:
```typescript
metric: new cloudwatch.Metric({
  namespace: 'AWS/EC2',
  metricName: 'CPUUtilization',
  dimensionsMap: {
    AutoScalingGroupName: asg.autoScalingGroupName,
  },
  period: cdk.Duration.minutes(5),
  statistic: 'Average',
}),
```

**Root Cause**: The model assumed a convenience method that doesn't exist. CloudWatch metrics for Auto Scaling Groups need to be created manually using the `cloudwatch.Metric` class with the correct namespace and dimensions.

---

### 4. CDK Dashboard Widget Error - Invalid Metric Reference
**Issue**: The model used the same non-existent `metricCpuUtilization()` method in the CloudWatch dashboard configuration.

**Original Code**:
```typescript
new cloudwatch.GraphWidget({
  title: 'CPU Utilization',
  left: [asg.metricCpuUtilization()],
}),
```

**Fixed Code**:
```typescript
new cloudwatch.GraphWidget({
  title: 'CPU Utilization',
  left: [
    new cloudwatch.Metric({
      namespace: 'AWS/EC2',
      metricName: 'CPUUtilization',
      dimensionsMap: {
        AutoScalingGroupName: asg.autoScalingGroupName,
      },
      statistic: 'Average',
    }),
  ],
}),
```

**Root Cause**: Same as issue #3 - the model referenced a non-existent convenience method instead of creating the metric manually.

---

### 5. CDK Deprecated API Usage - Health Check Configuration
**Issue**: The model used deprecated `healthCheck` property and `HealthCheck.ec2()` method with deprecated `grace` property.

**Original Code**:
```typescript
healthCheck: autoscaling.HealthCheck.ec2({
  grace: cdk.Duration.minutes(5),
}),
```

**Fixed Code**:
```typescript
healthChecks: autoscaling.HealthChecks.ec2({
  gracePeriod: cdk.Duration.minutes(5),
}),
```

**Root Cause**: The model used deprecated APIs. The CDK has moved from singular `healthCheck` to plural `healthChecks`, and the property name changed from `grace` to `gracePeriod`.

---
## Code Quality and Linting Issues Fixed

### 6. Unused Variable Error - Instance Profile Creation
**Issue**: The model created an `iam.CfnInstanceProfile` but never used the variable, causing ESLint unused variable error.

**Original Code**:
```typescript
// Create instance profile
const instanceProfile = new iam.CfnInstanceProfile(this, `InstanceProfile-${envSuffix}`, {
  roles: [role.roleName],
  instanceProfileName: `EC2-WebApp-InstanceProfile-${envSuffix}`,
});
```

**Fixed Code**:
```typescript
// Create instance profile (automatically created by CDK when role is specified)
// Note: CDK automatically creates an instance profile when a role is assigned to a launch template
```

**Root Cause**: The model unnecessarily created an instance profile manually when CDK automatically handles this when a role is assigned to a launch template. The variable was never referenced elsewhere in the code.

---

### 7. Unused Variable Error - Scaling Policy Assignment
**Issue**: The model assigned the scaling policy to a variable but never used it, causing ESLint unused variable error.

**Original Code**:
```typescript
// Add scaling policies
const scaleUpPolicy = asg.scaleOnCpuUtilization(`ScaleUpPolicy-${envSuffix}`, {
  targetUtilizationPercent: 70,
  cooldown: cdk.Duration.minutes(5),
});
```

**Fixed Code**:
```typescript
// Add scaling policies
asg.scaleOnCpuUtilization(`ScaleUpPolicy-${envSuffix}`, {
  targetUtilizationPercent: 70,
  cooldown: cdk.Duration.minutes(5),
});
```

**Root Cause**: The model assigned the return value to a variable that was never used. Since the scaling policy is automatically attached to the Auto Scaling Group, the return value isn't needed.

---
# Model Failures Analysis

## 1. Security Issue - Hardcoded Database Password

**Issue**: Model hardcoded database password in plain text
**Model Code**:

```go
Password: pulumi.String("changeme123!"), // Use AWS Secrets Manager in production
```

**Correct Code**:

```go
ManageMasterUserPassword: pulumi.Bool(true),
```

**Impact**: Major security vulnerability exposing database credentials in code

## 2. Least Privilege Issue - Overly Permissive IAM Policy

**Issue**: Model granted wildcard permissions to EC2 role
**Model Code**:

```go
"Resource": "*"
```

**Correct Code**:

```go
{
    "Effect": "Allow",
    "Action": ["cloudwatch:PutMetricData"],
    "Resource": "*"
},
{
    "Effect": "Allow",
    "Action": ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"],
    "Resource": "arn:aws:logs:*:*:log-group:/aws/ec2/*"
}
```

**Impact**: Violates least privilege principle by granting excessive permissions

## 3. Security Issue - Overly Permissive Security Group

**Issue**: Model allowed database access from entire VPC and unrestricted egress
**Model Code**:

```go
CidrBlocks: pulumi.StringArray{pulumi.String("10.0.0.0/16")},
// Egress
Protocol: pulumi.String("-1"),
CidrBlocks: pulumi.StringArray{pulumi.String("0.0.0.0/0")},
```

**Correct Code**:

```go
CidrBlocks: pulumi.StringArray{pulumi.String("10.0.11.0/24"), pulumi.String("10.0.12.0/24")},
// Egress
Protocol: pulumi.String("tcp"),
FromPort: pulumi.Int(443),
ToPort: pulumi.Int(443),
CidrBlocks: pulumi.StringArray{pulumi.String("10.0.0.0/16")},
```

**Impact**: Allows unnecessary network access, violating network segmentation

## 4. Build Issue - Missing Regional KMS Keys

**Issue**: Model used global KMS key across regions causing cross-region access errors
**Model Code**:

```go
func (m *MultiRegionInfrastructure) deployRegionalResources(region string, kmsKey *kms.Key, roles map[string]*iam.Role) error {
    // Uses global kmsKey parameter
    KmsKeyId: kmsKey.Arn,
}
```

**Correct Code**:

```go
// Create regional KMS key
regionalKmsKey, err := kms.NewKey(m.ctx, fmt.Sprintf("%s-kms-%s", m.config.Environment, region), &kms.KeyArgs{
    Description: pulumi.String(fmt.Sprintf("Regional encryption key for %s", region)),
    Tags: m.tags,
}, pulumi.Provider(provider))
// Use regional key
KmsKeyId: regionalKmsKey.Arn,
```

**Impact**: Runtime deployment failures due to KMS key region restrictions

## 5. Build Issue - Performance Insights Configuration Error

**Issue**: Model enabled Performance Insights on unsupported RDS configuration. The db.t3.micro instance type suggested by the model does not support Performance Insights, and AWS is deprecating Performance Insights in favor of CloudWatch monitoring.
**Model Code**:

```go
InstanceClass: pulumi.String("db.t3.micro"),
PerformanceInsightsEnabled: pulumi.Bool(m.config.EnableInsights),
PerformanceInsightsKmsKeyId: kmsKey.Arn,
PerformanceInsightsRetentionPeriod: pulumi.Int(7),
```

**Correct Code**:

```go
// Removed Performance Insights, added CloudWatch alarms instead
_, err = cloudwatch.NewMetricAlarm(m.ctx, fmt.Sprintf("%s-rds-cpu-alarm-%s", m.config.Environment, region), &cloudwatch.MetricAlarmArgs{
    Name: pulumi.String(fmt.Sprintf("%s-rds-cpu-high-%s", m.config.Environment, region)),
    MetricName: pulumi.String("CPUUtilization"),
    Namespace: pulumi.String("AWS/RDS"),
    Threshold: pulumi.Float64(80),
})
```

**Impact**: Deployment failure with "Performance Insights not supported for this configuration". AWS recommends using CloudWatch for RDS monitoring as Performance Insights will be deprecated.

## 6. Code Issue - Missing Resource Exports

**Issue**: Model failed to export regional resources for testing/integration
**Model Code**:

```go
func (m *MultiRegionInfrastructure) exportOutputs(bucket *s3.Bucket, distribution *cloudfront.Distribution) {
    // Only exports global resources
    m.ctx.Export("s3BucketName", bucket.Bucket)
}
```

**Correct Code**:

```go
// Regional resources
for region, resources := range regionalResources {
    for resourceName, resourceOutput := range resources {
        m.ctx.Export(fmt.Sprintf("%s_%s", region, resourceName), resourceOutput)
    }
}
```

**Impact**: Missing outputs prevent integration testing and resource referencing

## 7. Code Issue - Missing Return Values from Regional Deployment

**Issue**: Model's deployRegionalResources function didn't return resource references
**Model Code**:

```go
func (m *MultiRegionInfrastructure) deployRegionalResources(region string, kmsKey *kms.Key, roles map[string]*iam.Role) error {
    // Creates resources but doesn't return them
    return nil
}
```

**Correct Code**:

```go
func (m *MultiRegionInfrastructure) deployRegionalResources(region string, roles map[string]*iam.Role) (map[string]pulumi.Output, error) {
    // Returns resource map for exports
    resources := map[string]pulumi.Output{
        "vpcId": vpc.ID().ToStringOutput(),
        "rdsInstanceId": rdsInstance.ID().ToStringOutput(),
    }
    return resources, nil
}
```

**Impact**: Prevents proper resource tracking and output generation

## 8. Build Issue - CloudWatch Log Group KMS Permission Error

**Issue**: Model used KMS encryption for CloudWatch logs without proper permissions
**Model Code**:

```go
_, err = cloudwatch.NewLogGroup(m.ctx, fmt.Sprintf("%s-app-logs-%s", m.config.Environment, region), &cloudwatch.LogGroupArgs{
    KmsKeyId: kmsKey.Arn,
})
```

**Correct Code**:

```go
_, err = cloudwatch.NewLogGroup(m.ctx, fmt.Sprintf("%s-app-logs-%s", m.config.Environment, region), &cloudwatch.LogGroupArgs{
    RetentionInDays: pulumi.Int(30),
    Tags: m.tags,
    // Removed KmsKeyId to avoid permission issues
})
```

**Impact**: Deployment failure with "AccessDeniedException: The specified KMS key does not exist or is not allowed"

## 9. Code Issue - Missing S3 Access Logging

**Issue**: Model didn't implement S3 access logging as required for compliance
**Model Code**: No access logging implementation
**Correct Code**:

```go
// Create access logging bucket
logBucket, err := s3.NewBucket(m.ctx, fmt.Sprintf("%s-access-logs", m.config.Environment), &s3.BucketArgs{
    Tags: m.tags,
})
// Configure access logging
_, err = s3.NewBucketLoggingV2(m.ctx, fmt.Sprintf("%s-bucket-logging", m.config.Environment), &s3.BucketLoggingV2Args{
    Bucket: bucket.ID(),
    TargetBucket: logBucket.ID(),
    TargetPrefix: pulumi.String("access-logs/"),
})
```

**Impact**: Missing audit trail for S3 access, compliance violation

## 10. Code Issue - Inconsistent Tagging Strategy

**Issue**: Model used inconsistent tag structures across resources
**Model Code**:

```go
// Some resources used inline tags
Tags: pulumi.StringMap{
    "Name": pulumi.String(fmt.Sprintf("%s-vpc-%s", m.config.Environment, region)),
    "environment": pulumi.String(m.config.Environment),
}
// Others used struct tags
Tags: m.tags,
```

**Correct Code**:

```go
// Consistent use of struct-level tags with custom tag merging
tags := pulumi.StringMap{
    "purpose": pulumi.String("multi-region-infrastructure"),
    "managed-by": pulumi.String("pulumi"),
}
// Add custom tags from config
for k, v := range config.tags {
    tags[k] = pulumi.String(v)
}
```

**Impact**: Inconsistent resource tagging makes management and cost tracking difficult

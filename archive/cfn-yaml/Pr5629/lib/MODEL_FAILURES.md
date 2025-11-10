# Common Model Failures and Anti-Patterns

This document catalogs typical failures and anti-patterns observed in CloudFormation templates for multi-account replication frameworks.

## Critical Failures (Deployment Blockers)

### 1. Hardcoded Account-Specific Values

**Problem**: Templates contain hardcoded AWS account IDs, regions, or ARNs that prevent cross-account deployment.

**Examples**:

```yaml
# BAD: Hardcoded account ID
Principal:
  AWS: "arn:aws:iam::123456789012:root"

# BAD: Hardcoded ARN
Bucket: "arn:aws:s3:::config-bucket-123456789012-us-east-1"

# GOOD: Parameterized
Principal:
  AWS: !Sub "arn:aws:iam::${AccountIdDev}:root"

# GOOD: Dynamic ARN construction
Bucket: !Sub "arn:aws:s3:::${ReplicationBucketName}-${Environment}-${AWS::Region}"
```

**Impact**: Template fails to deploy in different accounts or requires manual modification.

### 2. Missing or Incorrect S3 Replication Configuration

**Problem**: S3 buckets configured for replication but missing critical requirements.

**Examples**:

```yaml
# BAD: Versioning not enabled (required for replication)
VersioningConfiguration:
  Status: Suspended

# BAD: Missing replication role
ReplicationConfiguration:
  Rules:
    - Destination:
        Bucket: "arn:aws:s3:::dest-bucket"
  # Missing Role property

# GOOD: Complete replication configuration
VersioningConfiguration:
  Status: Enabled
ReplicationConfiguration:
  Role: !GetAtt S3ReplicationRole.Arn
  Rules:
    - Id: ReplicateToStaging
      Status: Enabled
      Destination:
        Bucket: !Sub "arn:aws:s3:::${DestBucketName}"
```

**Impact**: Replication never starts or fails silently.

### 3. Overly Permissive IAM Policies

**Problem**: IAM policies use wildcard permissions or grant unnecessary access.

**Examples**:

```yaml
# BAD: Wildcard resource with sensitive actions
Statement:
  - Effect: Allow
    Action: "s3:*"
    Resource: "*"

# BAD: Administrative permissions
Action: "dynamodb:*"

# GOOD: Scoped permissions
Statement:
  - Effect: Allow
    Action:
      - "s3:GetObject"
      - "s3:ListBucket"
    Resource:
      - !GetAtt ConfigurationBucket.Arn
      - !Sub "${ConfigurationBucket.Arn}/*"
```

**Impact**: Security vulnerabilities, compliance failures, privilege escalation risks.

### 4. Missing Encryption Configuration

**Problem**: Data stores lack encryption at rest or in transit.

**Examples**:

```yaml
# BAD: No encryption on S3 bucket
Properties:
  BucketName: my-bucket
  # Missing BucketEncryption

# BAD: No encryption on DynamoDB
Type: AWS::DynamoDB::Table
Properties:
  TableName: MyTable
  # Missing SSESpecification

# GOOD: Proper encryption
BucketEncryption:
  ServerSideEncryptionConfiguration:
    - ServerSideEncryptionByDefault:
        SSEAlgorithm: AES256

SSESpecification:
  SSEEnabled: true
```

**Impact**: Compliance violations, security audit failures, data exposure risks.

### 5. Invalid CloudFormation Syntax

**Problem**: Template contains syntax errors, invalid intrinsic functions, or incorrect references.

**Examples**:

```yaml
# BAD: Invalid function syntax
Value: !Sub ${AWS::AccountId}-${BucketName

# BAD: Referencing non-existent resource
Value: !Ref NonExistentResource

# BAD: Incorrect Fn::GetAtt attribute
Value: !GetAtt MyBucket.InvalidAttribute

# GOOD: Correct syntax
Value: !Sub "${AWS::AccountId}-${BucketName}"
Value: !Ref ConfigurationBucket
Value: !GetAtt ConfigurationBucket.Arn
```

**Impact**: Template validation fails, deployment blocked.

## Major Failures (Functional Issues)

### 6. Trivial Lambda Functions

**Problem**: Lambda functions implement "Hello World" examples instead of real-world use cases.

**Examples**:

```python
# BAD: Trivial lambda
def handler(event, context):
    return {
        'statusCode': 200,
        'body': 'Hello World'
    }

# GOOD: Real-world replication monitor
def handler(event, context):
    """Monitor S3 replication events and emit metrics"""
    try:
        for record in event['Records']:
            object_key = record['s3']['object']['key']

            # Track in DynamoDB
            table.put_item(Item={
                'ConfigId': f"s3-{object_key}",
                'Status': 'PENDING_REPLICATION',
                'Timestamp': datetime.utcnow().isoformat()
            })

            # Emit CloudWatch metric
            cloudwatch.put_metric_data(
                Namespace='MultiAccountReplication',
                MetricData=[{
                    'MetricName': 'ReplicationEvents',
                    'Value': 1
                }]
            )
    except Exception as e:
        logger.error(f"Error: {e}")
        raise
```

**Impact**: Template doesn't demonstrate production-grade infrastructure patterns.

### 7. Missing Error Handling in Lambda

**Problem**: Lambda functions don't handle exceptions or edge cases.

**Examples**:

```python
# BAD: No error handling
def handler(event, context):
    bucket_name = os.environ['BUCKET_NAME']
    s3.get_bucket_replication(Bucket=bucket_name)
    # If this fails, Lambda crashes with no visibility

# GOOD: Comprehensive error handling
def handler(event, context):
    try:
        bucket_name = os.environ.get('BUCKET_NAME')
        if not bucket_name:
            raise ValueError("BUCKET_NAME environment variable not set")

        response = s3.get_bucket_replication(Bucket=bucket_name)

        # Emit success metric
        cloudwatch.put_metric_data(...)

        return {'statusCode': 200, 'body': json.dumps(response)}

    except ClientError as e:
        logger.error(f"AWS API Error: {e}")
        # Emit error metric
        cloudwatch.put_metric_data(
            MetricData=[{
                'MetricName': 'ReplicationErrors',
                'Value': 1
            }]
        )
        return {'statusCode': 500, 'body': json.dumps({'error': str(e)})}

    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise
```

**Impact**: Lambda failures are silent, difficult to debug, no operational visibility.

### 8. Missing Monitoring and Alarms

**Problem**: Infrastructure lacks CloudWatch alarms and monitoring.

**Examples**:

```yaml
# BAD: Lambda with no alarms
ReplicationMonitorLambda:
  Type: AWS::Lambda::Function
  Properties:
    FunctionName: replication-monitor
    # No associated CloudWatch alarms

# GOOD: Lambda with error alarm
LambdaErrorAlarm:
  Type: AWS::CloudWatch::Alarm
  Properties:
    AlarmName: !Sub 'lambda-errors-${Environment}'
    MetricName: Errors
    Namespace: AWS/Lambda
    Statistic: Sum
    Period: 300
    EvaluationPeriods: 1
    Threshold: 5
    ComparisonOperator: GreaterThanThreshold
    Dimensions:
      - Name: FunctionName
        Value: !Ref ReplicationMonitorLambda
```

**Impact**: Failures go unnoticed, no operational visibility, difficult troubleshooting.

### 9. Incorrect Event Bridge Configuration

**Problem**: EventBridge rules don't properly match events or have incorrect targets.

**Examples**:

```yaml
# BAD: Overly broad event pattern
EventPattern:
  source: ["aws.cloudformation"]
  # Matches ALL CloudFormation events, not just stack updates

# BAD: Missing Lambda permission
Targets:
  - Arn: !GetAtt MyLambda.Arn
    Id: "1"
# Lambda will reject invocations without permission

# GOOD: Specific event pattern with permission
EventPattern:
  source: ["aws.cloudformation"]
  detail-type: ["CloudFormation Stack Status Change"]
  detail:
    status-details:
      status: ["UPDATE_COMPLETE", "CREATE_COMPLETE"]

LambdaPermission:
  Type: AWS::Lambda::Permission
  Properties:
    FunctionName: !Ref MyLambda
    Action: lambda:InvokeFunction
    Principal: events.amazonaws.com
    SourceArn: !GetAtt EventRule.Arn
```

**Impact**: Events don't trigger, or Lambda invocations fail.

### 10. Incorrect DynamoDB Global Table Configuration

**Problem**: Global table missing required properties or incorrect stream configuration.

**Examples**:

```yaml
# BAD: Missing StreamSpecification for Lambda trigger
Type: AWS::DynamoDB::GlobalTable
Properties:
  TableName: MetadataTable
  # Missing StreamSpecification

# BAD: Wrong stream view type
StreamSpecification:
  StreamViewType: KEYS_ONLY
  # Need NEW_AND_OLD_IMAGES for schema change detection

# GOOD: Complete configuration
StreamSpecification:
  StreamViewType: NEW_AND_OLD_IMAGES
SSESpecification:
  SSEEnabled: true
BillingMode: PAY_PER_REQUEST
Replicas:
  - Region: !Ref AWS::Region
```

**Impact**: Stream processing fails, replication doesn't work, schema changes not detected.

## Minor Failures (Quality Issues)

### 11. Inconsistent Naming Conventions

**Problem**: Resources use different naming patterns.

**Examples**:

```yaml
# BAD: Inconsistent naming
S3Bucket: "config-artifacts-dev"
DDBTable: "MetadataTable_Dev"
LambdaFunc: "ReplicationMonitor-development"

# GOOD: Consistent naming
S3Bucket: !Sub "${ApplicationName}-config-${Environment}"
DDBTable: !Sub "${ApplicationName}-metadata-${Environment}"
Lambda: !Sub "${ApplicationName}-monitor-${Environment}"
```

**Impact**: Difficult to manage resources, unclear relationships, poor operational experience.

### 12. Missing or Poor Documentation

**Problem**: Template lacks descriptions, comments, or clear documentation.

**Examples**:

```yaml
# BAD: No description
Parameters:
  Param1:
    Type: String

# GOOD: Clear description
Parameters:
  Environment:
    Type: String
    Description: "Environment name (dev, staging, prod) for resource deployment"
    AllowedValues: [dev, staging, prod]
    ConstraintDescription: "Must be dev, staging, or prod"
```

**Impact**: Difficult to understand template purpose, harder to maintain, error-prone modifications.

### 13. Missing Resource Tags

**Problem**: Resources lack proper tags for cost tracking and organization.

**Examples**:

```yaml
# BAD: No tags
S3Bucket:
  Type: AWS::S3::Bucket
  Properties:
    BucketName: my-bucket

# GOOD: Comprehensive tags
S3Bucket:
  Type: AWS::S3::Bucket
  Properties:
    BucketName: !Sub "${ApplicationName}-config-${Environment}"
    Tags:
      - Key: Name
        Value: !Sub "${ApplicationName}-config-${Environment}"
      - Key: Environment
        Value: !Ref Environment
      - Key: Application
        Value: !Ref ApplicationName
      - Key: ManagedBy
        Value: CloudFormation
      - Key: iac-rlhf-amazon
        Value: "true"
```

**Impact**: Difficult cost allocation, poor resource organization, compliance issues.

### 14. Suboptimal Resource Configuration

**Problem**: Resources configured inefficiently without considering cost or performance.

**Examples**:

```yaml
# BAD: Provisioned capacity when on-demand is better
BillingMode: PROVISIONED
ProvisionedThroughput:
  ReadCapacityUnits: 100
  WriteCapacityUnits: 100

# GOOD: On-demand for unpredictable workloads
BillingMode: PAY_PER_REQUEST

# BAD: Over-provisioned Lambda
MemorySize: 3008
Timeout: 900

# GOOD: Right-sized Lambda
MemorySize: 256
Timeout: 60
```

**Impact**: Unnecessary costs, inefficient resource utilization.

### 15. Missing Outputs

**Problem**: Template doesn't export useful values for cross-stack references or operational use.

**Examples**:

```yaml
# BAD: No outputs
Outputs: {}

# GOOD: Useful outputs
Outputs:
  S3BucketName:
    Description: "Configuration artifacts S3 bucket"
    Value: !Ref ConfigurationBucket
    Export:
      Name: !Sub "${AWS::StackName}-bucket-name"

  DynamoDBTableArn:
    Description: "DynamoDB global table ARN"
    Value: !GetAtt MetadataTable.Arn
    Export:
      Name: !Sub "${AWS::StackName}-table-arn"

  CloudWatchDashboardUrl:
    Description: "CloudWatch Dashboard URL"
    Value: !Sub "https://console.aws.amazon.com/cloudwatch/home?region=${AWS::Region}#dashboards:name=${ReplicationDashboard}"
```

**Impact**: Difficult to integrate with other stacks, poor operational visibility.

## Testing Failures

### 16. Incomplete Unit Tests

**Problem**: Unit tests only verify basic structure, not actual resource configurations.

**Examples**:

```typescript
// BAD: Superficial test
test('template should have resources', () => {
  expect(template.Resources).toBeDefined();
});

// GOOD: Comprehensive test
test('S3 bucket should have correct replication configuration', () => {
  const bucket = template.Resources.ConfigurationBucket;
  const replication = bucket.Properties.ReplicationConfiguration;

  expect(replication.Role).toBeDefined();
  expect(replication.Rules).toHaveLength(1);
  expect(replication.Rules[0].Status).toBe('Enabled');
  expect(replication.Rules[0].Destination.Bucket).toEqual({
    'Fn::Sub': expect.stringContaining('staging'),
  });
});
```

**Impact**: Tests pass but template has configuration errors.

### 17. Missing Integration Tests

**Problem**: No tests verify actual AWS resource creation and functionality.

**Examples**:

```typescript
// BAD: Placeholder test
test('integration tests', () => {
  expect(true).toBe(true);
});

// GOOD: Real integration test
test('S3 replication should work across accounts', async () => {
  const sourceBucket = outputs.SourceBucketName;
  const destBucket = outputs.DestBucketName;

  // Upload object to source
  await s3.putObject({
    Bucket: sourceBucket,
    Key: 'test.txt',
    Body: 'test content',
  });

  // Wait for replication
  await new Promise(resolve => setTimeout(resolve, 10000));

  // Verify object in destination
  const destObject = await s3.getObject({
    Bucket: destBucket,
    Key: 'test.txt',
  });

  expect(destObject.Body.toString()).toBe('test content');
});
```

**Impact**: Template may deploy but not function correctly.

## Summary of Failure Categories

### Critical (Must Fix)

1. Hardcoded account-specific values
2. Missing/incorrect S3 replication configuration
3. Overly permissive IAM policies
4. Missing encryption
5. Invalid CloudFormation syntax

### Major (Should Fix)

6. Trivial Lambda functions
7. Missing error handling
8. Missing monitoring/alarms
9. Incorrect EventBridge configuration
10. Incorrect DynamoDB configuration

### Minor (Good to Fix)

11. Inconsistent naming
12. Poor documentation
13. Missing tags
14. Suboptimal configurations
15. Missing outputs
16. Incomplete unit tests
17. Missing integration tests

## Review Checklist

Before submitting a template, verify:

- No hardcoded account IDs, regions, or ARNs
- All IAM policies use least-privilege, scoped permissions
- All data stores encrypted at rest and in transit
- Lambda functions implement real-world use cases with error handling
- CloudWatch alarms configured for critical metrics
- Resources properly tagged (including iac-rlhf-amazon tag)
- Comprehensive unit and integration tests
- Template deploys successfully across multiple accounts
- Replication actually works end-to-end
- Clear documentation and useful outputs

# MODEL_FAILURES.md

## CloudFormation S3-Triggered Lambda Stack Failure Analysis

### **Critical Template Issues**

#### **1. Missing IAM Role Definition**
**Issue**: The template references `CorpLambdaExecutionRole` but doesn't define it.
```yaml
# ❌ MISSING - This resource is not defined
CorpLambdaExecutionRole:
  Type: AWS::IAM::Role
  Properties:
    AssumeRolePolicyDocument:
      Version: '2012-10-17'
      Statement:
        - Effect: Allow
          Principal:
            Service: lambda.amazonaws.com
          Action: 'sts:AssumeRole'
    ManagedPolicyArns:
      - 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
```

**Impact**: Template will fail during deployment with "Resource not found" error.

#### **2. Invalid S3 Bucket Policy Resource Reference**
**Issue**: Incorrect ARN reference in bucket policy.
```yaml
# ❌ INCORRECT
Resource: !Sub '${CorpBucket.Arn}/*'

# ✅ CORRECT
Resource: !Sub '${CorpBucket}/*'
```

**Impact**: Template validation will fail with ARN format error.

#### **3. Missing Policy Version**
**Issue**: S3 bucket policy missing required Version field.
```yaml
# ❌ MISSING VERSION
PolicyDocument:
  Statement:
    - Sid: PublicReadGetObject
      Effect: Allow
      Principal: "*"
      Action: s3:GetObject
      Resource: !Sub '${CorpBucket.Arn}/*'

# ✅ CORRECT
PolicyDocument:
  Version: '2012-10-17'
  Statement:
    - Sid: PublicReadGetObject
      Effect: Allow
      Principal: "*"
      Action: s3:GetObject
      Resource: !Sub '${CorpBucket}/*'
```

**Impact**: Template will fail validation.

### **Deployment Failures**

#### **1. IAM Capability Issues**
**Error**: `InsufficientCapabilitiesException`
```bash
An error occurred (InsufficientCapabilitiesException) when calling the CreateChangeSet operation: Requires capabilities : [CAPABILITY_IAM]
```

**Solution**: Add `--capabilities CAPABILITY_IAM` to deployment command.

#### **2. S3 Bucket Name Conflicts**
**Error**: `BucketAlreadyExists`
```bash
An error occurred (BucketAlreadyExists) when calling the CreateBucket operation: The requested bucket name is not available. The bucket namespace is shared by all users of the system. Please select a different name and try again.
```

**Solution**: Use unique bucket names with account ID or random suffixes.

#### **3. Lambda Function Name Conflicts**
**Error**: `ResourceConflictException`
```bash
An error occurred (ResourceConflictException) when calling the CreateFunction operation: Function already exist
```

**Solution**: Use unique function names or implement proper cleanup.

### **Runtime Failures**

#### **1. Lambda Execution Errors**
**Error**: `AccessDeniedException`
```json
{
  "errorMessage": "AccessDeniedException: User: arn:aws:sts::123456789012:assumed-role/CorpLambdaExecutionRole/lambda is not authorized to perform: s3:GetObject on resource: arn:aws:s3:::corp-bucket-name/*"
}
```

**Root Cause**: Missing S3 permissions in IAM role.

#### **2. S3 Event Processing Failures**
**Error**: `InvalidParameterValueException`
```json
{
  "errorMessage": "InvalidParameterValueException: The notification configuration is invalid"
}
```

**Root Cause**: Incorrect S3 notification configuration.

#### **3. CloudWatch Logs Access Denied**
**Error**: `AccessDeniedException`
```json
{
  "errorMessage": "AccessDeniedException: User: arn:aws:sts::123456789012:assumed-role/CorpLambdaExecutionRole/lambda is not authorized to perform: logs:CreateLogGroup"
}
```

**Root Cause**: Missing CloudWatch Logs permissions.

### **Security Vulnerabilities**

#### **1. Overly Permissive S3 Bucket Policy**
**Issue**: Public read access to all objects.
```yaml
# ❌ SECURITY RISK
Principal: "*"
Action: s3:GetObject
Resource: !Sub '${CorpBucket}/*'
```

**Risk**: Anyone can read any object in the bucket.

#### **2. Missing Encryption Configuration**
**Issue**: S3 bucket not encrypted by default.
```yaml
# ❌ MISSING ENCRYPTION
CorpBucket:
  Type: AWS::S3::Bucket
  Properties:
    BucketName: !Sub 'corp-${AWS::StackName}-assets'
    # Missing encryption configuration
```



#### **2. S3 Event Throttling**
**Issue**: High volume of S3 events overwhelming Lambda.
```yaml
# ❌ MISSING THROTTLING
CorpLambdaFunction:
  Type: AWS::Lambda::Function
  Properties:
    # Missing reserved concurrency configuration
```

**Impact**: Lambda function throttling and failed events.


### **Configuration Errors**

#### **1. Incorrect Lambda Handler**
**Issue**: Mismatch between runtime and handler.
```yaml
# ❌ MISMATCH
Runtime: nodejs18.x
Handler: index.handler  # Should be index.handler for Node.js
```

**Impact**: Lambda function fails to execute.

#### **2. Invalid S3 Notification Configuration**
**Issue**: Incorrect notification setup.
```yaml
# ❌ INCORRECT NOTIFICATION TYPE
"LambdaFunctionConfigurations": [{
  "LambdaFunctionArn": "${CorpLambdaFunction.Arn}",
  "Events": ["s3:ObjectCreated:*"]
}]

# ✅ CORRECT
"LambdaConfigurations": [{
  "LambdaFunctionArn": "${CorpLambdaFunction.Arn}",
  "Events": ["s3:ObjectCreated:*"]
}]
```

**Impact**: S3 events not triggering Lambda function.

#### **3. Missing Dependencies**
**Issue**: Resources created in wrong order.
```yaml
# ❌ MISSING DEPENDENCY
CorpLambdaFunction:
  Type: AWS::Lambda::Function
  Properties:
    Role: !GetAtt CorpLambdaExecutionRole.Arn
    # Missing DependsOn

# ✅ CORRECT
CorpLambdaFunction:
  Type: AWS::Lambda::Function
  DependsOn: CorpLambdaExecutionRole
  Properties:
    Role: !GetAtt CorpLambdaExecutionRole.Arn
```

**Impact**: Deployment failures due to resource dependencies.

### **Monitoring and Debugging Failures**

#### **1. Insufficient Logging**
**Issue**: Lambda function not logging enough information.
```javascript
// ❌ INSUFFICIENT LOGGING
exports.handler = async (event) => {
  console.log('Event received');
  return { statusCode: 200 };
};
```

**Impact**: Difficult to debug issues in production.

#### **2. Missing Error Handling**
**Issue**: Lambda function doesn't handle errors gracefully.
```javascript
// ❌ NO ERROR HANDLING
exports.handler = async (event) => {
  const record = event.Records[0];
  const bucket = record.s3.bucket.name;
  const key = record.s3.object.key;
  // Process without error handling
  return { statusCode: 200 };
};

// ✅ WITH ERROR HANDLING
exports.handler = async (event) => {
  try {
    const record = event.Records[0];
    const bucket = record.s3.bucket.name;
    const key = record.s3.object.key;
    // Process with error handling
    return { statusCode: 200, body: 'Success' };
  } catch (err) {
    console.error('Error processing event:', err);
    throw err;
  }
};
```

**Impact**: Lambda function crashes on errors.

### **Cost Optimization Failures**

#### **1. Inefficient Lambda Configuration**
**Issue**: Over-provisioned Lambda resources.
```yaml
# ❌ INEFFICIENT
CorpLambdaFunction:
  Type: AWS::Lambda::Function
  Properties:
    MemorySize: 1024  # Too much memory
    Timeout: 300      # Too long timeout
```

**Impact**: Higher costs than necessary.

```yaml
# ❌ NO FILTERING
"Events": ["s3:ObjectCreated:*"]
# Should filter by file type, size, or prefix
```

**Impact**: Processing unnecessary events, higher costs.

### **Recovery and Rollback Failures**

#### **1. Missing Deletion Policies**
**Issue**: Resources not properly cleaned up on deletion.
```yaml
# ❌ MISSING DELETION POLICY
CorpBucket:
  Type: AWS::S3::Bucket
  Properties:
    BucketName: !Sub 'corp-${AWS::StackName}-assets'
    # Missing DeletionPolicy

### **Testing and Validation Failures**

#### **1. Missing Template Validation**
**Issue**: Deploying without validating template.
```bash
# ❌ NO VALIDATION
aws cloudformation deploy --template-file template.yaml --stack-name test

# ✅ WITH VALIDATION
aws cloudformation validate-template --template-body file://template.yaml
aws cloudformation deploy --template-file template.yaml --stack-name test
```

**Impact**: Deployment failures in production.

#### **2. Insufficient Testing**
**Issue**: Not testing Lambda function with real S3 events.
```bash
# ❌ NO TESTING
# Deploy and assume it works

# ✅ WITH TESTING
aws lambda invoke --function-name corp-s3-event-handler-test --payload file://test-event.json response.json
```

**Impact**: Undiscovered issues in production.

### **Documentation and Maintenance Failures**

#### **1. Missing Documentation**
**Issue**: No documentation for deployment and maintenance.
```yaml
# ❌ NO DOCUMENTATION
# Template without comments or documentation

# ✅ WITH DOCUMENTATION
# Template with comprehensive comments and README
```

**Impact**: Difficult maintenance and troubleshooting.

#### **2. Outdated Dependencies**
**Issue**: Using outdated AWS service versions.
```yaml
# ❌ OUTDATED
Runtime: nodejs14.x  # Outdated runtime

# ✅ CURRENT
Runtime: nodejs18.x  # Current LTS runtime
```

**Impact**: Security vulnerabilities and missing features.
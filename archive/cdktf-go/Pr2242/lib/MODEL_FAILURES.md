# 1. Missing Base64 Encoding for User Data
**Issue**: User data for EC2 launch templates was passed as a plain string instead of base64-encoded, causing AWS validation errors.

**Original Code**:
```go
UserData: jsii.String(`#!/bin/bash
yum update -y
yum install -y httpd awslogs
systemctl start httpd
systemctl enable httpd
...`)
```

**Fixed Code**:
```go
UserData: jsii.String(base64.StdEncoding.EncodeToString([]byte(`#!/bin/bash
yum update -y
yum install -y httpd awslogs
systemctl start httpd
systemctl enable httpd
...`))),
```

---

# 2. Incorrect S3 Encryption Configuration
**Issue**: The S3 bucket server-side encryption was declared as a slice of structs, which is not supported by the v19 provider.

**Original Code**:
```go
ServerSideEncryptionConfiguration: []s3bucket.S3BucketServerSideEncryptionConfiguration{
    {
        Rule: s3bucket.S3BucketServerSideEncryptionConfigurationRule{
            ApplyServerSideEncryptionByDefault: s3bucket.S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefault{
                SseAlgorithm:   jsii.String("aws:kms"),
                KmsMasterKeyId: kmsKeyEast.Arn(),
            },
        },
    },
},
```

**Fixed Code**:
```go
ServerSideEncryptionConfiguration: &s3bucket.S3BucketServerSideEncryptionConfiguration{
    Rule: &s3bucket.S3BucketServerSideEncryptionConfigurationRule{
        ApplyServerSideEncryptionByDefault: &s3bucket.S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefault{
            SseAlgorithm:   jsii.String("aws:kms"),
            KmsMasterKeyId: kmsKeyEast.Arn(),
        },
    },
},
```

---

# 3. Missing API Gateway Deployment
**Issue**: The initial code lacked the API Gateway resources required by the specification.

**Original Code**:
```go
// No API Gateway defined
```

**Fixed Code**:
```go
restApi := apigatewayrestapi.NewApiGatewayRestApi(...)
apigatewayresource.NewApiGatewayResource(...)
apigatewaymethod.NewApiGatewayMethod(...)
apigatewayintegration.NewApiGatewayIntegration(...)
apigatewaydeployment.NewApiGatewayDeployment(...)
apigatewaystage.NewApiGatewayStage(...)
```

---

# 4. Weak MFA Policy for IAM User
**Issue**: The MFA policy lacked necessary conditions and `ListUsers` permissions.

**Original Code**:
```go
"NotAction": [
  "iam:CreateVirtualMFADevice",
  "iam:EnableMFADevice",
  "iam:GetUser",
  "iam:ListMFADevices",
  "iam:ListVirtualMFADevices",
  "iam:ResyncMFADevice",
  "sts:GetSessionToken"
],
```

**Fixed Code**:
```go
"NotAction": [
  "iam:CreateVirtualMFADevice",
  "iam:EnableMFADevice",
  "iam:ListMFADevices",
  "iam:ListVirtualMFADevices",
  "iam:ResyncMFADevice",
  "iam:GetUser",
  "iam:ListUsers",
  "sts:GetSessionToken"
],
"Sid": "DenyAllIfNoMFA",
```

---

# 5. Hardcoded Database Password
**Issue**: The RDS instance was created with a hardcoded password instead of secure password management.

**Original Code**:
```go
Password: jsii.String("changeme123!"),
```

**Fixed Code**:
```go
ManageMasterUserPassword: jsii.Bool(true),
MasterUserSecretKmsKeyId: kmsKey.Arn(),
```

---

# 6. Missing CloudWatch Log Exports for RDS
**Issue**: The database instance did not export logs to CloudWatch.

**Original Code**:
```go
// No CloudWatch logs exports
```

**Fixed Code**:
```go
EnabledCloudwatchLogsExports: &[]*string{
    jsii.String("error"),
    jsii.String("general"),
    jsii.String("slowquery"),
},
```

---

# 7. Missing Config Delivery Channel Dependency
**Issue**: The AWS Config delivery channel did not depend on the configuration recorder, causing race condition errors.

**Original Code**:
```go
configdeliverychannel.NewConfigDeliveryChannel(stack, jsii.String("config-delivery-channel"), &configdeliverychannel.ConfigDeliveryChannelConfig{
    Provider: providerEast,
    Name:     jsii.String("config-delivery-channel"),
    S3BucketName: configBucket.Bucket(),
})
```

**Fixed Code**:
```go
configdeliverychannel.NewConfigDeliveryChannel(stack, jsii.String("config-delivery-channel"), &configdeliverychannel.ConfigDeliveryChannelConfig{
    Provider:     providerEast,
    Name:         jsii.String("config-delivery-channel"),
    S3BucketName: configBucket.Bucket(),
    DependsOn:    &[]cdktf.ITerraformDependable{configRecorder},
})
```
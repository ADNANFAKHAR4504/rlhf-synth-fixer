
### 1. SSM Parameter with Hardcoded Password Instead of Secrets Manager

**Model Response:**
```json
"DatabasePasswordParameter": {
  "Type": "AWS::SSM::Parameter",
  "Properties": {
    "Name": "/SecurityBaseline/Database/Password",
    "Description": "Securely stored database password",
    "Type": "SecureString",
    "Value": "ChangeMe123!@#$%",
    "Tags": {
      "Environment": "Production",
      "Purpose": "SecurityBaseline"
    }
  }
}
```

**Actual Fix (IDEAL_RESPONSE):**
```json
"DatabaseSecret": {
  "Type": "AWS::SecretsManager::Secret",
  "Properties": {
    "Name": { "Fn::Sub": "SecurityBaseline-${EnvironmentSuffix}-Database-Credentials" },
    "Description": "Database credentials for Security Baseline",
    "GenerateSecretString": {
      "SecretStringTemplate": "{\"username\": \"admin\"}",
      "GenerateStringKey": "password",
      "PasswordLength": 32,
      "ExcludeCharacters": "\"@/\\'",
      "RequireEachIncludedType": true
    },
    "KmsKeyId": { "Ref": "KMSKey" },
    "Tags": [
      {
        "Key": "Environment",
        "Value": { "Ref": "EnvironmentSuffix" }
      },
      {
        "Key": "Purpose",
        "Value": "SecurityBaseline"
      }
    ]
  }
}
```

**Failure Impact:** DatabasePasswordParameter uses AWS::SSM::Parameter with hardcoded password value "ChangeMe123!@#$%" stored as SecureString, creating severe security risk and requiring manual password rotation. Tags format is incorrect (object instead of array), causing deployment error. Password is visible in CloudFormation template and version history.

**Root Cause:** Model used SSM Parameter Store with static hardcoded password instead of AWS Secrets Manager with auto-generated credentials. The ideal implementation uses Secrets Manager's GenerateSecretString to create a secure 32-character password automatically with KMS encryption, eliminating hardcoded credentials and enabling automatic rotation.

---

### 2. Missing Session Manager Support in IAM Role

**Model Response:**
```json
"S3ReadOnlyRole": {
  "Type": "AWS::IAM::Role",
  "Properties": {
    "RoleName": "SecurityBaselineS3ReadOnlyRole",
    "Description": "IAM role with read-only access to S3, following principle of least privilege",
    "AssumeRolePolicyDocument": {
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Allow",
          "Principal": {
            "Service": "ec2.amazonaws.com"
          },
          "Action": "sts:AssumeRole"
        }
      ]
    },
    "Policies": [
      {
        "PolicyName": "S3ReadOnlyPolicy",
        "PolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Sid": "S3ReadOnlyAccess",
              "Effect": "Allow",
              "Action": [
                "s3:GetObject",
                "s3:GetObjectVersion",
                "s3:ListBucket",
                "s3:GetBucketLocation",
                "s3:ListAllMyBuckets"
              ],
              "Resource": "*"
            }
          ]
        }
      }
    ],
    "Tags": [
      {
        "Key": "Purpose",
        "Value": "SecurityBaseline"
      }
    ]
  }
}
```

**Actual Fix (IDEAL_RESPONSE):**
```json
"S3ReadOnlyRole": {
  "Type": "AWS::IAM::Role",
  "Properties": {
    "RoleName": { "Fn::Sub": "SecurityBaselineS3ReadOnlyRole-${EnvironmentSuffix}" },
    "Description": "IAM role with read-only access to S3 and Session Manager access, following principle of least privilege",
    "AssumeRolePolicyDocument": {
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Allow",
          "Principal": {
            "Service": "ec2.amazonaws.com"
          },
          "Action": "sts:AssumeRole"
        }
      ]
    },
    "ManagedPolicyArns": [
      "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
    ],
    "Policies": [
      {
        "PolicyName": "S3ReadOnlyPolicy",
        "PolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Sid": "S3ReadOnlyAccess",
              "Effect": "Allow",
              "Action": [
                "s3:GetObject",
                "s3:GetObjectVersion",
                "s3:ListBucket",
                "s3:GetBucketLocation",
                "s3:ListAllMyBuckets"
              ],
              "Resource": "*"
            }
          ]
        }
      }
    ],
    "Tags": [
      {
        "Key": "Purpose",
        "Value": "SecurityBaseline"
      },
      {
        "Key": "Environment",
        "Value": { "Ref": "EnvironmentSuffix" }
      }
    ]
  }
}
```

**Failure Impact:** S3ReadOnlyRole has no ManagedPolicyArns array defined, preventing EC2 instances from being managed via AWS Systems Manager Session Manager. Without AmazonSSMManagedInstanceCore, SSH key pairs would be required for instance access, reducing security and manageability. Session Manager, Run Command, and Patch Manager features are completely unavailable.

**Root Cause:** Model didn't include ManagedPolicyArns array with AmazonSSMManagedInstanceCore managed policy for Systems Manager access. The ideal implementation adds this policy to enable SSH-less instance management through Session Manager, Run Command, and Patch Manager.

---

### 3. Missing EnvironmentSuffix Parameter and Resource Naming

**Model Response:**
```json
"Parameters": {
  "AllowedIPRange": {
    "Type": "String",
    "Default": "10.0.0.0/16",
    "Description": "CIDR block allowed for SSH and HTTP access"
  },
  "AdminEmail": {
    "Type": "String",
    "Default": "admin@example.com",
    "Description": "Email address for CloudWatch alarm notifications"
  }
}
```

**Actual Fix (IDEAL_RESPONSE):**
```json
"Parameters": {
  "EnvironmentSuffix": {
    "Type": "String",
    "Default": "dev",
    "Description": "Environment suffix for resource naming (must be lowercase)",
    "AllowedPattern": "^[a-z0-9-]+$",
    "ConstraintDescription": "Must contain only lowercase letters, numbers, and hyphens"
  },
  "AllowedIPRange": {
    "Type": "String",
    "Default": "10.0.0.0/16",
    "Description": "CIDR block allowed for SSH and HTTP access"
  },
  "AdminEmail": {
    "Type": "String",
    "Default": "admin@example.com",
    "Description": "Email address for CloudWatch alarm notifications"
  }
}
```

**Failure Impact:** No EnvironmentSuffix parameter means resources use hardcoded static names like "SecurityBaselineVPC", "SecurityBaselineS3ReadOnlyRole", "SecurityBaselineTrail", "SecurityBaselineAlarms", "SecurityBaselineRecorder", "alias/security-baseline-key" causing deployment conflicts when creating multiple environments and making resource identification difficult across dev/staging/prod. Bucket names lack environment differentiation.

**Root Cause:** Model didn't include EnvironmentSuffix parameter for environment-specific resource naming. The ideal implementation adds this parameter and uses it throughout (e.g., "SecurityBaselineVPC-${EnvironmentSuffix}", "SecurityBaselineS3ReadOnlyRole-${EnvironmentSuffix}", "SecurityBaselineTrail-${EnvironmentSuffix}", "alias/security-baseline-${EnvironmentSuffix}-key") for predictable, conflict-free multi-environment deployments.

---

### 4. Missing CloudTrail Log Group for Metric Filters

**Model Response:**
```json
"ConsoleSignInFailuresMetricFilter": {
  "Type": "AWS::Logs::MetricFilter",
  "Properties": {
    "LogGroupName": "/aws/cloudtrail",
    "FilterName": "ConsoleSignInFailures",
    "FilterPattern": "{ ($.eventName = ConsoleLogin) && ($.errorMessage = \"Failed authentication\") }",
    "MetricTransformations": [
      {
        "MetricName": "ConsoleSignInFailureCount",
        "MetricNamespace": "CloudTrailMetrics",
        "MetricValue": "1",
        "DefaultValue": 0
      }
    ]
  }
}
```

**Actual Fix (IDEAL_RESPONSE):**
```json
"CloudTrailLogGroup": {
  "Type": "AWS::Logs::LogGroup",
  "Properties": {
    "LogGroupName": "/aws/cloudtrail",
    "RetentionInDays": 365
  }
},

"ConsoleSignInFailuresMetricFilter": {
  "DependsOn": "CloudTrailLogGroup",
  "Type": "AWS::Logs::MetricFilter",
  "Properties": {
    "LogGroupName": "/aws/cloudtrail",
    "FilterName": "ConsoleSignInFailures",
    "FilterPattern": "{ ($.eventName = ConsoleLogin) && ($.errorMessage = \"Failed authentication\") }",
    "MetricTransformations": [
      {
        "MetricName": "ConsoleSignInFailureCount",
        "MetricNamespace": "CloudTrailMetrics",
        "MetricValue": "1",
        "DefaultValue": 0
      }
    ]
  }
}
```

**Failure Impact:** ConsoleSignInFailuresMetricFilter references non-existent log group "/aws/cloudtrail" without creating CloudTrailLogGroup resource. Metric filter cannot be created without valid CloudWatch log group, breaking console sign-in monitoring. No retention policy configured means logs are kept indefinitely, increasing storage costs. Missing DependsOn causes potential race condition during stack creation.

**Root Cause:** Model didn't create CloudTrailLogGroup resource and has no dependency chain for ConsoleSignInFailuresMetricFilter. The ideal implementation creates explicit CloudTrailLogGroup resource with 365-day retention policy and adds DependsOn: CloudTrailLogGroup to metric filter for proper dependency chain and CloudWatch Logs integration.

---

### 5. Incorrect S3 Bucket Policy Condition Keys

**Model Response:**
```json
"VPCFlowLogsBucketPolicy": {
  "Type": "AWS::S3::BucketPolicy",
  "Properties": {
    "Bucket": { "Ref": "VPCFlowLogsBucket" },
    "PolicyDocument": {
      "Version": "2012-10-17",
      "Statement": [
        {
          "Sid": "AWSLogDeliveryWrite",
          "Effect": "Allow",
          "Principal": {
            "Service": "delivery.logs.amazonaws.com"
          },
          "Action": "s3:PutObject",
          "Resource": { "Fn::Sub": "${VPCFlowLogsBucket.Arn}/*" },
          "Condition": {
            "StringEquals": {
              "s3:x-acl": "bucket-owner-full-control"
            }
          }
        }
      ]
    }
  }
},

"CloudTrailBucketPolicy": {
  "Type": "AWS::S3::BucketPolicy",
  "Properties": {
    "Bucket": { "Ref": "CloudTrailBucket" },
    "PolicyDocument": {
      "Version": "2012-10-17",
      "Statement": [
        {
          "Sid": "AWSCloudTrailWrite",
          "Effect": "Allow",
          "Principal": {
            "Service": "cloudtrail.amazonaws.com"
          },
          "Action": "s3:PutObject",
          "Resource": { "Fn::Sub": "${CloudTrailBucket.Arn}/*" },
          "Condition": {
            "StringEquals": {
              "s3:x-acl": "bucket-owner-full-control"
            }
          }
        }
      ]
    }
  }
},

"ConfigBucketPolicy": {
  "Type": "AWS::S3::BucketPolicy",
  "Properties": {
    "Bucket": { "Ref": "ConfigBucket" },
    "PolicyDocument": {
      "Version": "2012-10-17",
      "Statement": [
        {
          "Sid": "AWSConfigBucketWrite",
          "Effect": "Allow",
          "Principal": {
            "Service": "config.amazonaws.com"
          },
          "Action": "s3:PutObject",
          "Resource": { "Fn::Sub": "${ConfigBucket.Arn}/*" },
          "Condition": {
            "StringEquals": {
              "s3:x-acl": "bucket-owner-full-control"
            }
          }
        }
      ]
    }
  }
}
```

**Actual Fix (IDEAL_RESPONSE):**
```json
"VPCFlowLogsBucketPolicy": {
  "Type": "AWS::S3::BucketPolicy",
  "Properties": {
    "Bucket": { "Ref": "VPCFlowLogsBucket" },
    "PolicyDocument": {
      "Version": "2012-10-17",
      "Statement": [
        {
          "Sid": "AWSLogDeliveryWrite",
          "Effect": "Allow",
          "Principal": {
            "Service": "delivery.logs.amazonaws.com"
          },
          "Action": "s3:PutObject",
          "Resource": { "Fn::Sub": "${VPCFlowLogsBucket.Arn}/*" },
          "Condition": {
            "StringEquals": {
              "s3:x-amz-acl": "bucket-owner-full-control"
            }
          }
        }
      ]
    }
  }
},

"CloudTrailBucketPolicy": {
  "Type": "AWS::S3::BucketPolicy",
  "Properties": {
    "Bucket": { "Ref": "CloudTrailBucket" },
    "PolicyDocument": {
      "Version": "2012-10-17",
      "Statement": [
        {
          "Sid": "AWSCloudTrailWrite",
          "Effect": "Allow",
          "Principal": {
            "Service": "cloudtrail.amazonaws.com"
          },
          "Action": "s3:PutObject",
          "Resource": { "Fn::Sub": "${CloudTrailBucket.Arn}/*" },
          "Condition": {
            "StringEquals": {
              "s3:x-amz-acl": "bucket-owner-full-control"
            }
          }
        }
      ]
    }
  }
},

"ConfigBucketPolicy": {
  "Type": "AWS::S3::BucketPolicy",
  "Properties": {
    "Bucket": { "Ref": "ConfigBucket" },
    "PolicyDocument": {
      "Version": "2012-10-17",
      "Statement": [
        {
          "Sid": "AWSConfigBucketWrite",
          "Effect": "Allow",
          "Principal": {
            "Service": "config.amazonaws.com"
          },
          "Action": "s3:PutObject",
          "Resource": { "Fn::Sub": "${ConfigBucket.Arn}/*" },
          "Condition": {
            "StringEquals": {
              "s3:x-amz-acl": "bucket-owner-full-control"
            }
          }
        }
      ]
    }
  }
}
```

**Failure Impact:** All three bucket policies (VPCFlowLogsBucketPolicy, CloudTrailBucketPolicy, ConfigBucketPolicy) use incorrect condition key "s3:x-acl" instead of correct "s3:x-amz-acl", causing policy validation failures and preventing AWS services (VPC Flow Logs, CloudTrail, Config) from writing logs to S3 buckets. This breaks all logging functionality.

**Root Cause:** Model used incorrect S3 condition key "s3:x-acl" instead of AWS-standard "s3:x-amz-acl" for ACL-based access control conditions. The ideal implementation uses correct condition key "s3:x-amz-acl" for proper S3 bucket policy enforcement across all three bucket policies.

---

### 6. Invalid IAM Managed Policy ARN and Property Name for Config Role

**Model Response:**
```json
"ConfigRole": {
  "Type": "AWS::IAM::Role",
  "Properties": {
    "AssumeRolePolicyDocument": {
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Allow",
          "Principal": {
            "Service": "config.amazonaws.com"
          },
          "Action": "sts:AssumeRole"
        }
      ]
    },
    "ManagedPolicyArns": [
      "arn:aws:iam::aws:policy/service-role/ConfigRole"
    ],
    "Policies": [
      {
        "PolicyName": "S3BucketPolicy",
        "PolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Action": [
                "s3:GetBucketAcl",
                "s3:ListBucket",
                "s3:PutObject",
                "s3:GetObject"
              ],
              "Resource": [
                { "Fn::GetAtt": ["ConfigBucket", "Arn"] },
                { "Fn::Sub": "${ConfigBucket.Arn}/*" }
              ]
            }
          ]
        }
      }
    ]
  }
},

"ConfigRecorder": {
  "Type": "AWS::Config::ConfigurationRecorder",
  "Properties": {
    "Name": "SecurityBaselineRecorder",
    "RecordingGroup": {
      "AllSupported": true,
      "IncludeGlobalResourceTypes": true
    },
    "RoleArn": { "Fn::GetAtt": ["ConfigRole", "Arn"] }
  }
}
```

**Actual Fix (IDEAL_RESPONSE):**
```json
"ConfigRole": {
  "Type": "AWS::IAM::Role",
  "Properties": {
    "AssumeRolePolicyDocument": {
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Allow",
          "Principal": {
            "Service": "config.amazonaws.com"
          },
          "Action": "sts:AssumeRole"
        }
      ]
    },
    "ManagedPolicyArns": [
      "arn:aws:iam::aws:policy/service-role/AWS_ConfigRole"
    ],
    "Policies": [
      {
        "PolicyName": "S3BucketPolicy",
        "PolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Action": [
                "s3:GetBucketAcl",
                "s3:ListBucket",
                "s3:PutObject",
                "s3:GetObject"
              ],
              "Resource": [
                { "Fn::GetAtt": ["ConfigBucket", "Arn"] },
                { "Fn::Sub": "${ConfigBucket.Arn}/*" }
              ]
            }
          ]
        }
      }
    ]
  }
},

"ConfigRecorder": {
  "Type": "AWS::Config::ConfigurationRecorder",
  "Properties": {
    "Name": { "Fn::Sub": "SecurityBaselineRecorder-${EnvironmentSuffix}" },
    "RecordingGroup": {
      "AllSupported": true,
      "IncludeGlobalResourceTypes": true
    },
    "RoleARN": { "Fn::GetAtt": ["ConfigRole", "Arn"] }
  }
}
```

**Deployment Error:**
```
ManagedPolicyArns contains invalid arn: arn:aws:iam::aws:policy/service-role/ConfigRole
InvalidParameterValue

Invalid property: RoleArn (expected RoleARN)
ValidationException
```

**Failure Impact:** ConfigRole uses non-existent managed policy ARN "arn:aws:iam::aws:policy/service-role/ConfigRole" causing deployment failure. AWS Config recorder cannot start without proper permissions. ConfigRecorder uses incorrect property name "RoleArn" (lowercase 'rn') instead of required "RoleARN" (uppercase 'ARN'), causing CloudFormation validation error.

**Root Cause:** Model used incorrect policy name "ConfigRole" instead of the actual AWS managed policy name "AWS_ConfigRole" (with underscore), and used case-insensitive property name "RoleArn" but CloudFormation properties are case-sensitive. The ideal implementation uses correct ARN "arn:aws:iam::aws:policy/service-role/AWS_ConfigRole" and correct property name "RoleARN" (all uppercase) as defined in AWS::Config::ConfigurationRecorder specification.

---

### 7. Invalid CloudTrail DataResources Configuration

**Model Response:**
```json
"CloudTrail": {
  "Type": "AWS::CloudTrail::Trail",
  "DependsOn": "CloudTrailBucketPolicy",
  "Properties": {
    "TrailName": "SecurityBaselineTrail",
    "S3BucketName": { "Ref": "CloudTrailBucket" },
    "IncludeGlobalServiceEvents": true,
    "IsLogging": true,
    "IsMultiRegionTrail": true,
    "EnableLogFileValidation": true,
    "EventSelectors": [
      {
        "IncludeManagementEvents": true,
        "ReadWriteType": "All",
        "DataResources": [
          {
            "Type": "AWS::S3::Object",
            "Values": ["arn:aws:s3:::*/*"]
          }
        ]
      }
    ],
    "KMSKeyId": { "Ref": "KMSKey" }
  }
}
```

**Actual Fix (IDEAL_RESPONSE):**
```json
"CloudTrail": {
  "Type": "AWS::CloudTrail::Trail",
  "DependsOn": "CloudTrailBucketPolicy",
  "Properties": {
    "TrailName": { "Fn::Sub": "SecurityBaselineTrail-${EnvironmentSuffix}" },
    "S3BucketName": { "Ref": "CloudTrailBucket" },
    "IncludeGlobalServiceEvents": true,
    "IsLogging": true,
    "IsMultiRegionTrail": true,
    "EnableLogFileValidation": true,
    "EventSelectors": [
      {
        "IncludeManagementEvents": true,
        "ReadWriteType": "All"
      }
    ],
    "KMSKeyId": { "Ref": "KMSKey" }
  }
}
```

**Deployment Error:**
```
Invalid value for DataResources: Invalid ARN format arn:aws:s3:::*/*
ValidationException
```

**Failure Impact:** DataResources section contains invalid S3 ARN format "arn:aws:s3:::*/*" with wildcard path causing CloudTrail creation to fail. This format is not supported for data event logging. Trail name lacks environment suffix causing multi-environment deployment conflicts.

**Root Cause:** Model included DataResources with incorrectly formatted S3 ARN using wildcard notation that CloudTrail doesn't support. The ideal implementation removes the DataResources section entirely since management events (IncludeManagementEvents: true) are sufficient for security baseline monitoring without data events, and adds EnvironmentSuffix to TrailName for multi-environment support.

---

### 8. Invalid IP Address Condition Operator in S3 Bucket Policy

**Model Response:**
```json
"PrivateS3BucketPolicy": {
  "Type": "AWS::S3::BucketPolicy",
  "Properties": {
    "Bucket": { "Ref": "PrivateS3Bucket" },
    "PolicyDocument": {
      "Version": "2012-10-17",
      "Statement": [
        {
          "Sid": "RestrictToCIDR",
          "Effect": "Deny",
          "Principal": "*",
          "Action": "s3:*",
          "Resource": [
            { "Fn::GetAtt": ["PrivateS3Bucket", "Arn"] },
            { "Fn::Sub": "${PrivateS3Bucket.Arn}/*" }
          ],
          "Condition": {
            "IpAddressNotEquals": {
              "aws:SourceIp": { "Ref": "S3RestrictedCIDR" }
            }
          }
        }
      ]
    }
  }
}
```

**Actual Fix (IDEAL_RESPONSE):**
```json
"SecureDataBucketPolicy": {
  "Type": "AWS::S3::BucketPolicy",
  "Properties": {
    "Bucket": { "Ref": "SecureDataBucket" },
    "PolicyDocument": {
      "Version": "2012-10-17",
      "Statement": [
        {
          "Sid": "DenyInsecureTransport",
          "Effect": "Deny",
          "Principal": "*",
          "Action": "s3:*",
          "Resource": [
            { "Fn::GetAtt": ["SecureDataBucket", "Arn"] },
            { "Fn::Sub": "${SecureDataBucket.Arn}/*" }
          ],
          "Condition": {
            "Bool": {
              "aws:SecureTransport": "false"
            }
          }
        },
        {
          "Sid": "RestrictAccessToCIDR",
          "Effect": "Deny",
          "Principal": "*",
          "Action": "s3:*",
          "Resource": [
            { "Fn::GetAtt": ["SecureDataBucket", "Arn"] },
            { "Fn::Sub": "${SecureDataBucket.Arn}/*" }
          ],
          "Condition": {
            "NotIpAddress": {
              "aws:SourceIp": { "Ref": "AllowedIPRange" }
            }
          }
        }
      ]
    }
  }
}
```

**Deployment Error:**
```
Invalid condition operator: IpAddressNotEquals
ValidationException: Value 'IpAddressNotEquals' at 'policyDocument.statement.1.member.condition.key' failed to satisfy constraint: Member must satisfy enum value set: [StringEquals, StringNotEquals, StringLike, StringNotLike, DateEquals, DateNotEquals, DateLessThan, DateLessThanEquals, DateGreaterThan, DateGreaterThanEquals, NumericEquals, NumericNotEquals, NumericLessThan, NumericLessThanEquals, NumericGreaterThan, NumericGreaterThanEquals, Bool, BinaryEquals, IpAddress, NotIpAddress, ArnEquals, ArnLike, ArnNotEquals, ArnNotLike, Null]
```

**Failure Impact:** PrivateS3BucketPolicy uses non-existent IAM condition operator "IpAddressNotEquals" causing CloudFormation validation failure during stack deployment. S3 bucket policy cannot be created, leaving the secure data bucket without IP-based access restrictions. The valid condition operators for IP address checks are "IpAddress" and "NotIpAddress" only.

**Root Cause:** Model used invalid condition operator "IpAddressNotEquals" which doesn't exist in AWS IAM policy condition operators. The ideal implementation uses correct condition operator "NotIpAddress" for denying access from IP addresses outside the allowed range, and adds additional "DenyInsecureTransport" statement to enforce HTTPS-only access for comprehensive security.

---
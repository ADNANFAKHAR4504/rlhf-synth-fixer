
### 1. Insecure S3 Bucket Policy Design Pattern

**Model Response:**
```json
"PrivateS3BucketPolicy": {
  "Type": "AWS::S3::BucketPolicy",
  "Properties": {
    "Bucket": {
      "Ref": "PrivateS3Bucket"
    },
    "PolicyDocument": {
      "Version": "2012-10-17",
      "Statement": [
        {
          "Sid": "DenyInsecureConnections",
          "Effect": "Deny",
          "Principal": "*",
          "Action": "s3:*",
          "Resource": [
            {
              "Fn::GetAtt": ["PrivateS3Bucket", "Arn"]
            },
            {
              "Fn::Sub": "${PrivateS3Bucket.Arn}/*"
            }
          ],
          "Condition": {
            "Bool": {
              "aws:SecureTransport": "false"
            }
          }
        },
        {
          "Sid": "AllowAccessFromSpecificCIDR",
          "Effect": "Allow",
          "Principal": {
            "AWS": {
              "Fn::Sub": "arn:aws:iam::${AWS::AccountId}:root"
            }
          },
          "Action": [
            "s3:GetObject",
            "s3:PutObject",
            "s3:ListBucket"
          ],
          "Resource": [
            {
              "Fn::GetAtt": ["PrivateS3Bucket", "Arn"]
            },
            {
              "Fn::Sub": "${PrivateS3Bucket.Arn}/*"
            }
          ],
          "Condition": {
            "IpAddress": {
              "aws:SourceIp": {
                "Ref": "S3BucketAccessCIDR"
              }
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
"SecureS3BucketPolicy": {
  "Type": "AWS::S3::BucketPolicy",
  "Properties": {
    "Bucket": {
      "Ref": "SecureS3Bucket"
    },
    "PolicyDocument": {
      "Version": "2012-10-17",
      "Statement": [
        {
          "Sid": "DenyInsecureConnections",
          "Effect": "Deny",
          "Principal": "*",
          "Action": "s3:*",
          "Resource": [
            {
              "Fn::GetAtt": ["SecureS3Bucket", "Arn"]
            },
            {
              "Fn::Sub": "${SecureS3Bucket.Arn}/*"
            }
          ],
          "Condition": {
            "Bool": {
              "aws:SecureTransport": "false"
            }
          }
        },
        {
          "Sid": "RestrictAccessToSpecificCIDR",
          "Effect": "Deny",
          "Principal": "*",
          "Action": "s3:*",
          "Resource": [
            {
              "Fn::GetAtt": ["SecureS3Bucket", "Arn"]
            },
            {
              "Fn::Sub": "${SecureS3Bucket.Arn}/*"
            }
          ],
          "Condition": {
            "NotIpAddress": {
              "aws:SourceIp": {
                "Ref": "S3AccessCIDR"
              }
            }
          }
        }
      ]
    }
  }
}
```

**Failure Impact:** Uses "Allow" effect with IpAddress condition for CIDR restriction, creating allow-by-default security posture. This requires explicit IAM permissions to be combined with bucket policy, making access control complex and error-prone. If IAM permissions are too broad, users outside the CIDR can still access the bucket.

**Root Cause:** Model used "Effect: Allow" with positive IpAddress condition instead of "Effect: Deny" with NotIpAddress condition. The ideal implementation uses deny-by-default approach where access is denied unless source IP matches the allowed CIDR, providing stronger security guarantees regardless of IAM permissions.

---

### 2. Missing Session Manager Support in IAM Role

**Model Response:**
```json
"S3ReadOnlyRole": {
  "Type": "AWS::IAM::Role",
  "Properties": {
    "RoleName": "S3ReadOnlyAccessRole",
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
    "ManagedPolicyArns": [],
    "Policies": [
      {
        "PolicyName": "S3ReadOnlyPolicy",
        "PolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Action": [
                "s3:GetObject",
                "s3:ListBucket",
                "s3:GetBucketLocation",
                "s3:GetObjectVersion",
                "s3:GetBucketVersioning"
              ],
              "Resource": [
                "arn:aws:s3:::*",
                "arn:aws:s3:::*/*"
              ]
            }
          ]
        }
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
    "RoleName": {
      "Fn::Sub": "S3ReadOnlyAccessRole-${EnvironmentSuffix}"
    },
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
              "Effect": "Allow",
              "Action": [
                "s3:GetObject",
                "s3:ListBucket",
                "s3:GetBucketLocation",
                "s3:GetObjectVersion",
                "s3:GetBucketVersioning"
              ],
              "Resource": [
                "arn:aws:s3:::*",
                "arn:aws:s3:::*/*"
              ]
            }
          ]
        }
      }
    ]
  }
}
```

**Failure Impact:** S3ReadOnlyRole has empty ManagedPolicyArns array, preventing EC2 instances from being managed via AWS Systems Manager Session Manager. Without AmazonSSMManagedInstanceCore, SSH key pairs would be required for instance access, reducing security and manageability.

**Root Cause:** Model didn't include AmazonSSMManagedInstanceCore managed policy for Systems Manager access. The ideal implementation adds this policy to enable SSH-less instance management through Session Manager, Run Command, and Patch Manager.

---

### 3. Missing EnvironmentSuffix Parameter and Resource Naming

**Model Response:**
```json
"Parameters": {
  "AllowedIPRange": {
    "Type": "String",
    "Default": "10.0.0.0/16",
    "Description": "CIDR IP range allowed for SSH and HTTP access to Security Group"
  },
  "S3AccessCIDR": {
    "Type": "String",
    "Default": "10.0.0.0/16",
    "Description": "CIDR IP range allowed to access the secure S3 bucket"
  }
}
```

**Actual Fix (IDEAL_RESPONSE):**
```json
"Parameters": {
  "EnvironmentSuffix": {
    "Type": "String",
    "Default": "dev",
    "Description": "Environment suffix for unique resource naming (lowercase only)",
    "AllowedPattern": "^[a-z0-9-]+$",
    "ConstraintDescription": "Must contain only lowercase letters, numbers, and hyphens"
  },
  "AllowedIPRange": {
    "Type": "String",
    "Default": "10.0.0.0/16",
    "Description": "CIDR IP range allowed for SSH and HTTP access to Security Group"
  },
  "S3AccessCIDR": {
    "Type": "String",
    "Default": "10.0.0.0/16",
    "Description": "CIDR IP range allowed to access the secure S3 bucket"
  }
}
```

**Failure Impact:** No EnvironmentSuffix parameter means resources use hardcoded static names like "SecurityBaselineVPC", "S3ReadOnlyAccessRole", "/aws/vpc/flowlogs" causing deployment conflicts when creating multiple environments and making resource identification difficult across dev/staging/prod.

**Root Cause:** Model didn't include EnvironmentSuffix parameter for environment-specific resource naming. The ideal implementation adds this parameter and uses it throughout (e.g., "SecurityBaselineVPC-${EnvironmentSuffix}", "S3ReadOnlyAccessRole-${EnvironmentSuffix}") for predictable, conflict-free multi-environment deployments.

---

### 4. Invalid IAM Managed Policy ARN for Config Role

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
    ]
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
    ]
  }
}
```

**Deployment Error:**
```
ManagedPolicyArns contains invalid arn: arn:aws:iam::aws:policy/service-role/ConfigRole
InvalidParameterValue
```

**Failure Impact:** Uses non-existent managed policy ARN "arn:aws:iam::aws:policy/service-role/ConfigRole" causing deployment failure. AWS Config recorder cannot start without proper permissions.

**Root Cause:** Model used incorrect policy name "ConfigRole" instead of the actual AWS managed policy name "AWS_ConfigRole" (with underscore). The ideal implementation uses the correct ARN "arn:aws:iam::aws:policy/service-role/AWS_ConfigRole".

---

### 5. Invalid CloudTrail DataResources Configuration

**Model Response:**
```json
"CloudTrail": {
  "Type": "AWS::CloudTrail::Trail",
  "DependsOn": "CloudTrailS3BucketPolicy",
  "Properties": {
    "TrailName": "SecurityBaselineTrail",
    "S3BucketName": {
      "Ref": "CloudTrailS3Bucket"
    },
    "IncludeGlobalServiceEvents": true,
    "IsLogging": true,
    "IsMultiRegionTrail": true,
    "EnableLogFileValidation": true,
    "EventSelectors": [
      {
        "ReadWriteType": "All",
        "IncludeManagementEvents": true,
        "DataResources": [
          {
            "Type": "AWS::S3::Object",
            "Values": ["arn:aws:s3:::*/"]
          }
        ]
      }
    ]
  }
}
```

**Actual Fix (IDEAL_RESPONSE):**
```json
"CloudTrail": {
  "Type": "AWS::CloudTrail::Trail",
  "DependsOn": "CloudTrailS3BucketPolicy",
  "Properties": {
    "TrailName": {
      "Fn::Sub": "SecurityBaselineTrail-${EnvironmentSuffix}"
    },
    "S3BucketName": {
      "Ref": "CloudTrailS3Bucket"
    },
    "IncludeGlobalServiceEvents": true,
    "IsLogging": true,
    "IsMultiRegionTrail": true,
    "EnableLogFileValidation": true,
    "EventSelectors": [
      {
        "ReadWriteType": "All",
        "IncludeManagementEvents": true
      }
    ]
  }
}
```

**Deployment Error:**
```
Invalid value for DataResources: Invalid ARN format arn:aws:s3:::*/
ValidationException
```

**Failure Impact:** DataResources section contains invalid S3 ARN format "arn:aws:s3:::*/" with wildcard path causing CloudTrail creation to fail. This format is not supported for data event logging.

**Root Cause:** Model included DataResources with incorrectly formatted S3 ARN. The ideal implementation removes the DataResources section entirely since management events (IncludeManagementEvents: true) are sufficient for security baseline monitoring without data events.

---

### 6. ConfigRecorder Property Name Case Error

**Model Response:**
```json
"ConfigRecorder": {
  "Type": "AWS::Config::ConfigurationRecorder",
  "Properties": {
    "Name": "SecurityBaselineRecorder",
    "RoleArn": {
      "Fn::GetAtt": ["ConfigRole", "Arn"]
    },
    "RecordingGroup": {
      "AllSupported": true,
      "IncludeGlobalResourceTypes": true
    }
  }
}
```

**Actual Fix (IDEAL_RESPONSE):**
```json
"ConfigRecorder": {
  "Type": "AWS::Config::ConfigurationRecorder",
  "DependsOn": "ConfigRole",
  "Properties": {
    "Name": {
      "Fn::Sub": "SecurityBaselineRecorder-${EnvironmentSuffix}"
    },
    "RoleARN": {
      "Fn::GetAtt": ["ConfigRole", "Arn"]
    },
    "RecordingGroup": {
      "AllSupported": true,
      "IncludeGlobalResourceTypes": true
    }
  }
}
```

**Deployment Error:**
```
Invalid property: RoleArn (expected RoleARN)
ValidationException
```

**Failure Impact:** Uses incorrect property name "RoleArn" (lowercase 'n') instead of required "RoleARN" (uppercase 'ARN'), causing CloudFormation validation error. AWS Config recorder cannot be created without correct property name.

**Root Cause:** Model used case-insensitive property name "RoleArn" but CloudFormation properties are case-sensitive. The ideal implementation uses correct property name "RoleARN" (all uppercase) as defined in AWS::Config::ConfigurationRecorder specification.

---

### 7. Missing CloudTrail Log Group for Metric Filters

**Model Response:**
```json
"ConsoleSignInMetricFilter": {
  "Type": "AWS::Logs::MetricFilter",
  "Properties": {
    "FilterName": "ConsoleSignInFailures",
    "FilterPattern": "{ ($.eventName = ConsoleLogin) && ($.errorMessage = \"Failed authentication\") }",
    "LogGroupName": {
      "Fn::Sub": "/aws/cloudtrail/${CloudTrail}"
    },
    "MetricTransformations": [
      {
        "MetricName": "ConsoleSignInFailureCount",
        "MetricNamespace": "CloudTrailMetrics",
        "MetricValue": "1"
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
    "LogGroupName": {
      "Fn::Sub": "/aws/cloudtrail/${EnvironmentSuffix}"
    },
    "RetentionInDays": 30
  }
},

"ConsoleSignInMetricFilter": {
  "Type": "AWS::Logs::MetricFilter",
  "Properties": {
    "FilterName": {
      "Fn::Sub": "ConsoleSignInFailures-${EnvironmentSuffix}"
    },
    "FilterPattern": "{ ($.eventName = ConsoleLogin) && ($.errorMessage = \"Failed authentication\") }",
    "LogGroupName": {
      "Ref": "CloudTrailLogGroup"
    },
    "MetricTransformations": [
      {
        "MetricName": "ConsoleSignInFailureCount",
        "MetricNamespace": "CloudTrailMetrics",
        "MetricValue": "1"
      }
    ]
  }
}
```

**Failure Impact:** ConsoleSignInMetricFilter references non-existent log group "/aws/cloudtrail/${CloudTrail}" (invalid Fn::Sub usage with CloudTrail resource name instead of log group). Metric filter cannot be created without valid CloudWatch log group, breaking console sign-in monitoring.

**Root Cause:** Model didn't create CloudTrailLogGroup resource and used incorrect LogGroupName reference with Fn::Sub interpolating CloudTrail resource name. The ideal implementation creates explicit CloudTrailLogGroup resource and references it properly using Ref function for metric filter attachment.
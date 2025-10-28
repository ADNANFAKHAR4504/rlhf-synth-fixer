
### 1. Deprecated LaunchConfiguration Instead of LaunchTemplate

**Model Response:**
```json
"LaunchConfiguration": {
  "Type": "AWS::AutoScaling::LaunchConfiguration",
  "Properties": {
    "ImageId": {"Fn::FindInMap": ["AWSRegionToAMI", {"Ref": "AWS::Region"}, "AMI"]},
    "InstanceType": "t3.micro",
    "SecurityGroups": [{"Ref": "WebServerSecurityGroup"}],
    "IamInstanceProfile": {"Ref": "EC2InstanceProfile"},
    "KeyName": {"Ref": "KeyName"}
  }
}
```

**Actual Fix (IDEAL_RESPONSE):**
```json
"LaunchTemplate": {
  "Type": "AWS::EC2::LaunchTemplate",
  "Properties": {
    "LaunchTemplateName": {"Fn::Sub": "${AWS::StackName}-LaunchTemplate"},
    "LaunchTemplateData": {
      "ImageId": {"Fn::FindInMap": ["AWSRegionToAMI", {"Ref": "AWS::Region"}, "AMI"]},
      "InstanceType": "t3.micro",
      "SecurityGroupIds": [{"Ref": "WebServerSecurityGroup"}],
      "IamInstanceProfile": {
        "Arn": {"Fn::GetAtt": ["EC2InstanceProfile", "Arn"]}
      }
    }
  }
}
```

**Failure Impact:** Uses deprecated `AWS::AutoScaling::LaunchConfiguration` resource type instead of the modern `AWS::EC2::LaunchTemplate`. Launch configurations are legacy and don't support newer EC2 features.

**Root Cause:** Model used the older LaunchConfiguration resource type. AWS recommends using LaunchTemplate for all new deployments as it supports versioning and more advanced features like multiple instance types and Spot instances.

---

### 2. EC2 KeyPair Dependency Requirement

**Model Response:**
```json
"Parameters": {
  "KeyName": {
    "Type": "AWS::EC2::KeyPair::KeyName",
    "Description": "EC2 Key Pair for SSH access",
    "ConstraintDescription": "Must be an existing EC2 KeyPair"
  }
}
```

**Actual Fix (IDEAL_RESPONSE):**
```json
"Parameters": {
  "EnvironmentSuffix": {
    "Type": "String",
    "Description": "Environment suffix for resource naming (e.g., dev, staging, prod)",
    "Default": "dev",
    "AllowedPattern": "[a-z0-9-]+",
    "ConstraintDescription": "Must contain only lowercase letters, numbers, and hyphens"
  }
}
```

**Failure Impact:** Requires mandatory KeyName parameter (Type: AWS::EC2::KeyPair::KeyName) forcing users to create and manage SSH key pairs before deployment, creating deployment friction and security concerns.

**Root Cause:** Model included KeyPair parameter requirement, but the ideal implementation removes it entirely and relies on AWS Systems Manager Session Manager for secure instance access without SSH keys.

---

### 3. Systems Manager Access Missing

**Model Response:**
```json
"EC2Role": {
  "Type": "AWS::IAM::Role",
  "Properties": {
    "ManagedPolicyArns": [
      "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
    ]
  }
}
```

**Actual Fix (IDEAL_RESPONSE):**
```json
"EC2Role": {
  "Type": "AWS::IAM::Role",
  "Properties": {
    "ManagedPolicyArns": [
      "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy",
      "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
    ]
  }
}
```

**Failure Impact:** EC2Role only includes CloudWatchAgentServerPolicy, limiting instance management to CloudWatch monitoring. Without AmazonSSMManagedInstanceCore, Systems Manager Session Manager, Run Command, and Patch Manager are unavailable.

**Root Cause:** Model failed to add the AmazonSSMManagedInstanceCore managed policy to EC2Role, preventing Systems Manager functionality for secure, SSH-less instance access.

---

### 4. Database Credentials Exposed as Stack Parameters

**Model Response:**
```json
"Parameters": {
  "DBUsername": {
    "Type": "String",
    "Description": "Database admin account username",
    "MinLength": "1",
    "MaxLength": "16",
    "AllowedPattern": "[a-zA-Z][a-zA-Z0-9]*",
    "ConstraintDescription": "Must begin with a letter and contain only alphanumeric characters",
    "Default": "dbadmin"
  },
  "DBPassword": {
    "Type": "String",
    "Description": "Database admin account password",
    "MinLength": "8",
    "MaxLength": "41",
    "AllowedPattern": "[a-zA-Z0-9]*",
    "ConstraintDescription": "Must contain only alphanumeric characters",
    "NoEcho": true
  }
},
"Resources": {
  "RDSDatabase": {
    "Properties": {
      "MasterUsername": {"Ref": "DBUsername"},
      "MasterUserPassword": {"Ref": "DBPassword"}
    }
  }
}
```

**Actual Fix (IDEAL_RESPONSE):**
```json
"Resources": {
  "DBSecret": {
    "Type": "AWS::SecretsManager::Secret",
    "Properties": {
      "Name": {"Fn::Sub": "${AWS::StackName}-db-credentials-${EnvironmentSuffix}"},
      "Description": "RDS database master credentials",
      "GenerateSecretString": {
        "SecretStringTemplate": "{\"username\": \"dbadmin\"}",
        "GenerateStringKey": "password",
        "PasswordLength": 32,
        "ExcludeCharacters": "\"@/\\"
      }
    }
  },
  "RDSDatabase": {
    "Properties": {
      "MasterUsername": {"Fn::Sub": "{{resolve:secretsmanager:${DBSecret}:SecretString:username}}"},
      "MasterUserPassword": {"Fn::Sub": "{{resolve:secretsmanager:${DBSecret}:SecretString:password}}"}
    }
  }
}
```

**Failure Impact:** Database credentials are exposed as stack parameters (DBUsername, DBPassword) requiring manual password entry during deployment and storing credentials in CloudFormation parameter history.

**Root Cause:** Model used stack parameters for database credentials instead of AWS Secrets Manager. The ideal implementation uses Secrets Manager to auto-generate secure passwords and retrieves them dynamically via CloudFormation dynamic references.

---

### 5. Unnecessary Parameter Store and KMS Complexity

**Model Response:**
```json
"KMSKey": {
  "Type": "AWS::KMS::Key",
  "Properties": {
    "Description": "KMS key for encrypting application secrets",
    "KeyPolicy": {...}
  }
},
"KMSKeyAlias": {
  "Type": "AWS::KMS::Alias",
  "Properties": {
    "AliasName": {"Fn::Sub": "alias/${AWS::StackName}-key"},
    "TargetKeyId": {"Ref": "KMSKey"}
  }
},
"DBPasswordParameter": {
  "Type": "AWS::SSM::Parameter",
  "Properties": {
    "Name": {"Fn::Sub": "/${AWS::StackName}/database/password"},
    "Type": "String",
    "Value": {"Ref": "DBPassword"},
    "Description": "Database password stored securely"
  }
},
"EC2Role": {
  "Policies": [
    {
      "PolicyName": "ParameterStoreAccess",
      "PolicyDocument": {
        "Statement": [{
          "Action": ["ssm:GetParameter", "ssm:GetParameters", "ssm:GetParametersByPath"],
          "Resource": {"Fn::Sub": "arn:aws:ssm:${AWS::Region}:${AWS::AccountId}:parameter/${AWS::StackName}/*"}
        },
        {
          "Action": ["kms:Decrypt"],
          "Resource": {"Fn::GetAtt": ["KMSKey", "Arn"]}
        }]
      }
    }
  ]
}
```

**Actual Fix (IDEAL_RESPONSE):**
```json
"DBSecret": {
  "Type": "AWS::SecretsManager::Secret",
  "Properties": {
    "GenerateSecretString": {
      "SecretStringTemplate": "{\"username\": \"dbadmin\"}",
      "GenerateStringKey": "password",
      "PasswordLength": 32
    }
  }
},
"EC2Role": {
  "Policies": [
    {
      "PolicyName": "SecretsManagerAccess",
      "PolicyDocument": {
        "Statement": [{
          "Action": ["secretsmanager:GetSecretValue"],
          "Resource": {"Ref": "DBSecret"}
        }]
      }
    }
  ]
}
```

**Failure Impact:** Model adds unnecessary complexity with custom KMS key, KMS alias, and Parameter Store for database password storage, requiring additional IAM policies for KMS decrypt and SSM parameter access.

**Root Cause:** Model used Parameter Store + KMS for secret management when the requirement specified "AWS Parameter Store" but implemented it incorrectly. The ideal solution uses Secrets Manager which auto-generates passwords and handles encryption automatically without custom KMS keys.

---

### 6. S3 Bucket Policy Invalid Condition Key

**Model Response:**
```json
"S3BucketPolicy": {
  "Type": "AWS::S3::BucketPolicy",
  "Properties": {
    "PolicyDocument": {
      "Statement": [
        {
          "Sid": "IPAddressRestriction",
          "Effect": "Deny",
          "Condition": {
            "IpAddressNotEquals": {
              "aws:SourceIp": [{"Ref": "AllowedIPRange"}]
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
"S3BucketPolicy": {
  "Type": "AWS::S3::BucketPolicy",
  "Properties": {
    "PolicyDocument": {
      "Statement": [
        {
          "Sid": "IPAddressRestriction",
          "Effect": "Deny",
          "Condition": {
            "NotIpAddress": {
              "aws:SourceIp": [{"Ref": "AllowedIPRange"}]
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
Policy has invalid condition key: IpAddressNotEquals
Valid condition keys: NotIpAddress, IpAddress
```

**Failure Impact:** Uses invalid IAM condition key `IpAddressNotEquals` which doesn't exist in AWS IAM condition operators, causing policy validation failures.

**Root Cause:** Model used non-existent `IpAddressNotEquals` condition operator. The correct IAM condition operator for negating IP address matches is `NotIpAddress`, not `IpAddressNotEquals`.

---

### 7. AutoScaling Group LaunchConfiguration Reference

**Model Response:**
```json
"AutoScalingGroup": {
  "Type": "AWS::AutoScaling::AutoScalingGroup",
  "Properties": {
    "LaunchConfigurationName": {"Ref": "LaunchConfiguration"}
  }
}
```

**Actual Fix (IDEAL_RESPONSE):**
```json
"AutoScalingGroup": {
  "Type": "AWS::AutoScaling::AutoScalingGroup",
  "Properties": {
    "LaunchTemplate": {
      "LaunchTemplateId": {"Ref": "LaunchTemplate"},
      "Version": {"Fn::GetAtt": ["LaunchTemplate", "LatestVersionNumber"]}
    }
  }
}
```

**Failure Impact:** AutoScalingGroup references deprecated LaunchConfigurationName property instead of modern LaunchTemplate property, preventing use of advanced features like multiple instance types and versioning.

**Root Cause:** Model used deprecated `LaunchConfigurationName` property with `AWS::AutoScaling::LaunchConfiguration` resource. The ideal implementation uses `LaunchTemplate` with `LatestVersionNumber` for modern, flexible auto-scaling configurations.

---

### 8. UserData References Non-Existent Parameter

**Model Response:**
```json
"LaunchConfigurationData": {
  "UserData": {
    "Fn::Base64": {
      "Fn::Sub": "#!/bin/bash\nyum update -y\nyum install -y httpd\nservice httpd start\nchkconfig httpd on\necho '<h1>Hello from ${AWS::StackName}</h1>' > /var/www/html/index.html"
    }
  }
}
```

**Actual Fix (IDEAL_RESPONSE):**
```json
"LaunchTemplateData": {
  "UserData": {
    "Fn::Base64": {
      "Fn::Sub": "#!/bin/bash\nyum update -y\nyum install -y httpd\nservice httpd start\nchkconfig httpd on\necho '<h1>Hello from ${AWS::StackName}</h1>' > /var/www/html/index.html"
    }
  }
}
```

**Failure Impact:** Model's UserData uses Fn::Sub correctly, but it's embedded in the deprecated LaunchConfiguration instead of LaunchTemplate.

**Root Cause:** While the UserData content is identical, the structural issue is that Model places it in LaunchConfiguration (deprecated) rather than LaunchTemplate (modern). This is a resource type issue rather than a UserData-specific failure.

---

### 9. SecurityGroupIds vs SecurityGroups Property

**Model Response:**
```json
"LaunchConfiguration": {
  "Properties": {
    "SecurityGroups": [{"Ref": "WebServerSecurityGroup"}]
  }
}
```

**Actual Fix (IDEAL_RESPONSE):**
```json
"LaunchTemplate": {
  "Properties": {
    "LaunchTemplateData": {
      "SecurityGroupIds": [{"Ref": "WebServerSecurityGroup"}]
    }
  }
}
```

**Failure Impact:** LaunchConfiguration uses `SecurityGroups` property (accepts both IDs and names), while LaunchTemplate requires `SecurityGroupIds` (accepts only IDs). This is correct for each resource type but represents the deprecated vs modern approach.

**Root Cause:** Model used the correct property name for LaunchConfiguration, but the entire resource type is deprecated. The ideal implementation uses LaunchTemplate with SecurityGroupIds for the modern approach.

---

### 10. Missing RDS Engine Version

**Model Response:**
```json
"RDSDatabase": {
  "Properties": {
    "Engine": "mysql",
    "EngineVersion": "8.0.33"
  }
}
```

**Actual Fix (IDEAL_RESPONSE):**
```json
"RDSDatabase": {
  "Properties": {
    "Engine": "mysql",
    "EngineVersion": "8.0.39"
  }
}
```

**Failure Impact:** Model uses MySQL engine version 8.0.33 instead of the more recent 8.0.39. While 8.0.33 may still be available, using older versions misses security patches and performance improvements.

**Root Cause:** Model specified an older MySQL version (8.0.33). The ideal implementation uses a more recent version (8.0.39) with the latest security updates and bug fixes.
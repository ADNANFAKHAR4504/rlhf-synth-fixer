# MODEL FAILURES: Common CloudFormation Security & Compliance Patterns

## Overview

This document catalogs common failure patterns when LLMs generate CloudFormation templates for PCI-DSS compliant infrastructure. These patterns represent significant learning opportunities for improving model performance on secure, compliant infrastructure-as-code.

## Category 1: Security Group Misconfigurations

### Failure 1.1: Wildcard Egress Rules (CRITICAL)

**Incorrect Pattern**:

```json
"LambdaSecurityGroup": {
  "Properties": {
    "SecurityGroupEgress": [{
      "IpProtocol": "-1",
      "CidrIp": "0.0.0.0/0"
    }]
  }
}
```

**Why This Fails**:

- Violates PCI-DSS requirement: "All security groups must have explicit egress rules with no 0.0.0.0/0 destinations"
- Lambda can egress to any internet destination, defeating network isolation
- Attack vector: Compromised Lambda function could exfiltrate data to attacker-controlled endpoints

**Correct Pattern**:

```json
"LambdaSecurityGroup": {
  "Properties": {
    "SecurityGroupEgress": [{
      "IpProtocol": "tcp",
      "FromPort": 443,
      "ToPort": 443,
      "DestinationSecurityGroupId": { "Ref": "KMSEndpointSecurityGroup" },
      "Description": "Allow HTTPS to KMS endpoint"
    }]
  }
}
```

**Learning Point**: Use security group IDs as destinations instead of CIDR blocks for intra-VPC traffic.

### Failure 1.2: Missing Egress Rules

**Incorrect Pattern**:

```json
"LambdaSecurityGroup": {
  "Properties": {
    "GroupDescription": "Lambda security group"
  }
}
```

**Why This Fails**:

- CloudFormation creates default egress rule: all traffic to 0.0.0.0/0
- Violates requirement for explicit egress rules
- Difficult to audit (implicit rule not visible in template)

**Correct Pattern**:
Always explicitly define `SecurityGroupEgress`, even if empty:

```json
"KMSEndpointSecurityGroup": {
  "Properties": {
    "SecurityGroupEgress": []
  }
}
```

**Learning Point**: Explicitly specify egress rules to override CloudFormation defaults.

## Category 2: KMS Key Policy Issues

### Failure 2.1: Missing Service Principal Access

**Incorrect Pattern**:

```json
"KMSKey": {
  "Properties": {
    "KeyPolicy": {
      "Statement": [{
        "Principal": { "AWS": "arn:aws:iam::${AWS::AccountId}:root" },
        "Action": "kms:*"
      }]
    }
  }
}
```

**Why This Fails**:

- S3 service cannot use key for encryption (no service principal)
- CloudWatch Logs cannot encrypt flow logs
- Lambda can access via IAM but S3 bucket encryption fails

**Correct Pattern**:

```json
"KeyPolicy": {
  "Statement": [
    {
      "Sid": "Allow S3 to use the key",
      "Principal": { "Service": "s3.amazonaws.com" },
      "Action": ["kms:Decrypt", "kms:GenerateDataKey"]
    },
    {
      "Sid": "Allow CloudWatch Logs",
      "Principal": { "Service": "logs.${AWS::Region}.amazonaws.com" },
      "Action": ["kms:Encrypt", "kms:Decrypt", "kms:GenerateDataKey*"],
      "Condition": {
        "ArnLike": {
          "kms:EncryptionContext:aws:logs:arn": "arn:aws:logs:${AWS::Region}:${AWS::AccountId}:*"
        }
      }
    }
  ]
}
```

**Learning Point**: KMS keys require explicit service principal access for AWS services.

### Failure 2.2: Overly Permissive Key Policy

**Incorrect Pattern**:

```json
"KeyPolicy": {
  "Statement": [{
    "Principal": "*",
    "Action": "kms:*",
    "Resource": "*"
  }]
}
```

**Why This Fails**:

- Violates least privilege principle
- Any AWS principal can use the key
- PCI-DSS compliance violation

**Correct Pattern**: See Failure 2.1 - use specific principals with specific actions.

## Category 3: S3 Bucket Policy Violations

### Failure 3.1: Missing Encryption Enforcement

**Incorrect Pattern**:

```json
"DataBucket": {
  "Properties": {
    "BucketEncryption": {
      "ServerSideEncryptionConfiguration": [{
        "ServerSideEncryptionByDefault": {
          "SSEAlgorithm": "aws:kms"
        }
      }]
    }
  }
}
```

**Why This Fails**:

- Bucket encryption is default, not enforced
- Clients can upload unencrypted objects if they explicitly disable encryption
- PCI-DSS violation: encryption must be mandatory

**Correct Pattern**:

```json
"DataBucketPolicy": {
  "Properties": {
    "PolicyDocument": {
      "Statement": [{
        "Sid": "DenyUnencryptedObjectUploads",
        "Effect": "Deny",
        "Principal": "*",
        "Action": "s3:PutObject",
        "Resource": "${DataBucket.Arn}/*",
        "Condition": {
          "StringNotEquals": {
            "s3:x-amz-server-side-encryption": "aws:kms"
          }
        }
      }]
    }
  }
}
```

**Learning Point**: S3 bucket policies with Deny effect enforce mandatory encryption.

### Failure 3.2: Missing HTTPS Enforcement

**Incorrect Pattern**:
No bucket policy, or policy without transport security condition.

**Why This Fails**:

- HTTP requests allowed (data transmitted in clear text)
- Man-in-the-middle attacks possible
- PCI-DSS violation: data must be encrypted in transit

**Correct Pattern**:

```json
{
  "Sid": "DenyInsecureTransport",
  "Effect": "Deny",
  "Principal": "*",
  "Action": "s3:*",
  "Resource": ["${DataBucket.Arn}", "${DataBucket.Arn}/*"],
  "Condition": {
    "Bool": { "aws:SecureTransport": "false" }
  }
}
```

**Learning Point**: Use aws:SecureTransport condition to enforce HTTPS.

## Category 4: IAM Least Privilege Violations

### Failure 4.1: Wildcard Actions

**Incorrect Pattern**:

```json
"LambdaExecutionRole": {
  "Policies": [{
    "Statement": [{
      "Action": "s3:*",
      "Resource": "*"
    }]
  }]
}
```

**Why This Fails**:

- Lambda can delete buckets (s3:DeleteBucket)
- Lambda can modify bucket policies (s3:PutBucketPolicy)
- Violates least privilege principle

**Correct Pattern**:

```json
"Statement": [
  {
    "Action": ["s3:GetObject", "s3:PutObject"],
    "Resource": "${DataBucket.Arn}/*"
  },
  {
    "Action": ["s3:ListBucket"],
    "Resource": "${DataBucket.Arn}"
  }
]
```

**Learning Point**: Specify exact actions needed. Object operations (GetObject, PutObject) require `/*` suffix.

### Failure 4.2: Wildcard Resources

**Incorrect Pattern**:

```json
"Statement": [{
  "Action": ["kms:Decrypt", "kms:Encrypt"],
  "Resource": "*"
}]
```

**Why This Fails**:

- Lambda can use any KMS key in account
- Could decrypt data from other applications
- PCI-DSS scope creep

**Correct Pattern**:

```json
"Statement": [{
  "Action": ["kms:Decrypt", "kms:Encrypt", "kms:GenerateDataKey"],
  "Resource": "${KMSKey.Arn}"
}]
```

**Learning Point**: Always use Ref or GetAtt to reference specific resources.

## Category 5: VPC Endpoint Misconfigurations

### Failure 5.1: Missing VPC Endpoints

**Incorrect Pattern**:
Template creates VPC and Lambda but no VPC endpoints.

**Why This Fails**:

- Lambda in private subnet cannot reach S3 or KMS
- NAT Gateway required (expensive, attack surface)
- Violates requirement: "VPC endpoints for S3 and KMS to keep traffic within AWS network"

**Correct Pattern**:

```json
"S3VPCEndpoint": {
  "Type": "AWS::EC2::VPCEndpoint",
  "Properties": {
    "VpcEndpointType": "Gateway",
    "ServiceName": "com.amazonaws.${AWS::Region}.s3",
    "RouteTableIds": [{ "Ref": "PrivateRouteTable" }]
  }
},
"KMSVPCEndpoint": {
  "Type": "AWS::EC2::VPCEndpoint",
  "Properties": {
    "VpcEndpointType": "Interface",
    "ServiceName": "com.amazonaws.${AWS::Region}.kms",
    "PrivateDnsEnabled": true,
    "SubnetIds": [...]
  }
}
```

**Learning Point**: S3 uses Gateway endpoints (free), KMS uses Interface endpoints (cost).

### Failure 5.2: Wrong Endpoint Type

**Incorrect Pattern**:

```json
"S3VPCEndpoint": {
  "Properties": {
    "VpcEndpointType": "Interface"
  }
}
```

**Why This Fails**:

- S3 Interface endpoints cost ~$7/month per AZ
- Unnecessary expense (Gateway endpoint is free)
- No benefit over Gateway for S3

**Correct Pattern**: Use Gateway for S3, Interface for KMS (see Failure 5.1).

## Category 6: VPC Flow Logs Issues

### Failure 6.1: Missing IAM Role

**Incorrect Pattern**:

```json
"VPCFlowLog": {
  "Properties": {
    "LogDestinationType": "cloud-watch-logs",
    "LogGroupName": { "Ref": "VPCFlowLogsLogGroup" }
  }
}
```

**Why This Fails**:

- CloudFormation stack creation fails
- Error: "LogDestination requires DeliverLogsPermissionArn"
- VPC Flow Logs service needs permission to write to CloudWatch

**Correct Pattern**:

```json
"VPCFlowLogsRole": {
  "Type": "AWS::IAM::Role",
  "Properties": {
    "AssumeRolePolicyDocument": {
      "Statement": [{
        "Principal": { "Service": "vpc-flow-logs.amazonaws.com" },
        "Action": "sts:AssumeRole"
      }]
    },
    "Policies": [{
      "Statement": [{
        "Action": [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ],
        "Resource": "${VPCFlowLogsLogGroup.Arn}"
      }]
    }]
  }
},
"VPCFlowLog": {
  "Properties": {
    "DeliverLogsPermissionArn": { "Fn::GetAtt": ["VPCFlowLogsRole", "Arn"] }
  }
}
```

**Learning Point**: VPC Flow Logs require explicit IAM role with logs:PutLogEvents permission.

### Failure 6.2: Incorrect Retention Configuration

**Incorrect Pattern**:

```json
"VPCFlowLogsLogGroup": {
  "Properties": {
    "RetentionInDays": 7
  }
}
```

**Why This Fails**:

- PCI-DSS requires 90 days minimum
- Compliance violation
- Insufficient data for forensic analysis

**Correct Pattern**:

```json
"VPCFlowLogsLogGroup": {
  "Properties": {
    "RetentionInDays": 90,
    "KmsKeyId": { "Fn::GetAtt": ["KMSKey", "Arn"] }
  }
}
```

**Learning Point**: PCI-DSS audit logs must be retained for 90+ days and encrypted.

## Category 7: Resource Naming Issues

### Failure 7.1: Hardcoded Resource Names

**Incorrect Pattern**:

```json
"DataBucket": {
  "Properties": {
    "BucketName": "pci-data-bucket"
  }
}
```

**Why This Fails**:

- S3 bucket names must be globally unique
- Parallel deployments fail (bucket name collision)
- CI/CD cannot test multiple branches simultaneously

**Correct Pattern**:

```json
"DataBucket": {
  "Properties": {
    "BucketName": { "Fn::Sub": "pci-data-bucket-${EnvironmentSuffix}-${AWS::AccountId}" }
  }
}
```

**Learning Point**: Include EnvironmentSuffix and AccountId in globally-scoped resource names.

### Failure 7.2: Missing EnvironmentSuffix Parameter

**Incorrect Pattern**:
Template has no parameters section, or EnvironmentSuffix parameter missing.

**Why This Fails**:

- Cannot deploy multiple environments
- Test deployments overwrite production
- Stack updates cause resource replacements

**Correct Pattern**:

```json
"Parameters": {
  "EnvironmentSuffix": {
    "Type": "String",
    "Description": "Unique suffix for resource names",
    "Default": "dev"
  }
}
```

**Learning Point**: EnvironmentSuffix is mandatory for all synthetic tasks.

## Category 8: Tagging Compliance Issues

### Failure 8.1: Missing Required Tags

**Incorrect Pattern**:

```json
"VPC": {
  "Properties": {
    "CidrBlock": "10.0.0.0/16"
  }
}
```

**Why This Fails**:

- PCI-DSS requires DataClassification and ComplianceScope tags
- Cannot identify PCI resources programmatically
- Compliance audit failure

**Correct Pattern**:

```json
"VPC": {
  "Properties": {
    "Tags": [
      { "Key": "DataClassification", "Value": "PCI" },
      { "Key": "ComplianceScope", "Value": "Payment" }
    ]
  }
}
```

**Learning Point**: All resources must have both PCI compliance tags.

### Failure 8.2: Inconsistent Tag Values

**Incorrect Pattern**:
Some resources tagged "DataClassification=PCI", others "DataClassification=pci" (case mismatch).

**Why This Fails**:

- Tag-based filtering breaks (case-sensitive)
- Cost allocation reports split across tag values
- Inconsistent compliance reporting

**Correct Pattern**: Use exact values "PCI" and "Payment" (uppercase) consistently.

## Category 9: DeletionPolicy Issues

### Failure 9.1: Missing DeletionPolicy on KMS Key

**Incorrect Pattern**:

```json
"KMSKey": {
  "Type": "AWS::KMS::Key"
}
```

**Why This Fails**:

- Stack deletion schedules KMS key for deletion (7-30 days)
- Encrypted data becomes inaccessible during pending-deletion period
- Data loss risk

**Correct Pattern**:

```json
"KMSKey": {
  "Type": "AWS::KMS::Key",
  "DeletionPolicy": "Retain"
}
```

**Learning Point**: Always Retain KMS keys to protect encrypted data.

### Failure 9.2: Incorrect DeletionPolicy on S3 Bucket

**Incorrect Pattern**:

```json
"DataBucket": {
  "DeletionPolicy": "Delete"
}
```

**Why This Fails**:

- Payment card data deleted with stack
- Regulatory compliance violation (data retention requirements)
- Irrecoverable data loss

**Correct Pattern**:

```json
"DataBucket": {
  "Type": "AWS::S3::Bucket",
  "DeletionPolicy": "Retain"
}
```

**Learning Point**: Retain data buckets to comply with PCI-DSS retention policies.

## Category 10: Lambda VPC Configuration Issues

### Failure 10.1: Lambda Not in Private Subnets

**Incorrect Pattern**:

```json
"DataValidationFunction": {
  "Properties": {
    "Runtime": "nodejs16.x",
    "Handler": "index.handler"
  }
}
```

**Why This Fails**:

- Lambda runs outside VPC (has internet access)
- Cannot use VPC endpoints
- Violates requirement: "Lambda functions must run in private subnets"

**Correct Pattern**:

```json
"DataValidationFunction": {
  "Properties": {
    "VpcConfig": {
      "SecurityGroupIds": [{ "Ref": "LambdaSecurityGroup" }],
      "SubnetIds": [
        { "Ref": "PrivateSubnet1" },
        { "Ref": "PrivateSubnet2" },
        { "Ref": "PrivateSubnet3" }
      ]
    }
  }
}
```

**Learning Point**: VpcConfig is required for Lambda in private subnets.

### Failure 10.2: Wrong Lambda Memory Size

**Incorrect Pattern**:

```json
"DataValidationFunction": {
  "Properties": {
    "MemorySize": 128
  }
}
```

**Why This Fails**:

- Requirement explicitly states "1GB memory"
- Insufficient memory for payment card data processing
- May cause Lambda timeout failures

**Correct Pattern**:

```json
"DataValidationFunction": {
  "Properties": {
    "MemorySize": 1024
  }
}
```

**Learning Point**: Always match exact requirements (1GB = 1024 MB).

## Category 11: AWS Config Misconfigurations

### Failure 11.1: Incorrect IAM Managed Policy

**Incorrect Pattern**:

```json
"ConfigRole": {
  "Properties": {
    "ManagedPolicyArns": [
      "arn:aws:iam::aws:policy/ConfigRole"
    ]
  }
}
```

**Why This Fails**:

- Policy does not exist (actual: service-role/AWS_ConfigRole)
- Stack creation fails with InvalidParameterValueException
- Common hallucination pattern

**Correct Pattern**:

```json
"ConfigRole": {
  "Properties": {
    "ManagedPolicyArns": [
      "arn:aws:iam::aws:policy/service-role/AWS_ConfigRole"
    ]
  }
}
```

**Learning Point**: AWS Config managed policy is "service-role/AWS_ConfigRole" (note underscore).

### Failure 11.2: Missing Config Bucket Permissions

**Incorrect Pattern**:
ConfigRole has AWS_ConfigRole policy but no bucket access policy.

**Why This Fails**:

- Config cannot write to S3 bucket
- No compliance data collected

**Correct Pattern**:

```json
"ConfigRole": {
  "Properties": {
    "Policies": [{
      "PolicyName": "ConfigBucketAccess",
      "PolicyDocument": {
        "Statement": [{
          "Action": ["s3:PutObject", "s3:GetBucketVersioning"],
          "Resource": [
            { "Fn::GetAtt": ["ConfigBucket", "Arn"] },
            { "Fn::Sub": "${ConfigBucket.Arn}/*" }
          ]
        }]
      }
    }]
  }
}
```

**Learning Point**: Config needs both AWS_ConfigRole managed policy and bucket-specific permissions.

## Category 12: Stack Termination Protection

### Failure 12.1: Attempting to Set in Template

**Incorrect Pattern**:

```json
"Metadata": {
  "AWS::CloudFormation::Interface": {
    "TerminationProtection": true
  }
}
```

**Why This Fails**:

- CloudFormation templates cannot enable termination protection
- Property is ignored (no error, but not applied)
- False sense of security

**Correct Pattern**:
Termination protection must be enabled via CLI or Console after stack creation:

```bash
aws cloudformation update-termination-protection \
  --stack-name <stack-name> \
  --enable-termination-protection
```

**Learning Point**: Document termination protection requirement in README, enable via deployment script.

## High-Value Training Patterns

### Pattern 1: Security Group Self-References

For resources that need to communicate bidirectionally:

```json
"DatabaseSecurityGroup": {
  "Properties": {
    "SecurityGroupIngress": [{
      "SourceSecurityGroupId": { "Ref": "DatabaseSecurityGroup" },
      "IpProtocol": "-1"
    }]
  }
}
```

### Pattern 2: Conditional Resource Creation

Create resources only when optional features enabled:

```json
"Conditions": {
  "CreateConfigResources": { "Fn::Equals": [{ "Ref": "EnableConfig" }, "true"] }
}
```

### Pattern 3: Cross-Stack References

Export values for use in other stacks:

```json
"Outputs": {
  "VPCId": {
    "Export": { "Name": { "Fn::Sub": "${AWS::StackName}-VPCId" } }
  }
}
```

## Category 13: Circular Dependency Issues (CRITICAL)

### Failure 13.1: KMS Key Policy References IAM Role ARN

**Incorrect Pattern**:

```json
"KMSKey": {
  "Type": "AWS::KMS::Key",
  "Properties": {
    "KeyPolicy": {
      "Statement": [
        {
          "Sid": "Allow Lambda to use the key",
          "Effect": "Allow",
          "Principal": {
            "AWS": { "Fn::GetAtt": ["LambdaExecutionRole", "Arn"] }
          },
          "Action": ["kms:Decrypt", "kms:Encrypt", "kms:GenerateDataKey"],
          "Resource": "*"
        }
      ]
    }
  }
},
"LambdaExecutionRole": {
  "Type": "AWS::IAM::Role",
  "Properties": {
    "Policies": [{
      "PolicyDocument": {
        "Statement": [{
          "Effect": "Allow",
          "Action": ["kms:Decrypt", "kms:Encrypt"],
          "Resource": { "Fn::GetAtt": ["KMSKey", "Arn"] }
        }]
      }
    }]
  }
}
```

**Why This Fails**:

- CloudFormation error: `Circular dependency between resources: [KMSKey, LambdaExecutionRole]`
- KMSKey KeyPolicy references LambdaExecutionRole ARN (Fn::GetAtt)
- LambdaExecutionRole IAM policy references KMSKey ARN (Fn::GetAtt)
- CloudFormation cannot determine creation order
- **Template deployment is completely blocked**

**Correct Pattern**:
Remove the Lambda principal from KMS key policy. IAM policies on the role are sufficient:

```json
"KMSKey": {
  "Type": "AWS::KMS::Key",
  "Properties": {
    "KeyPolicy": {
      "Statement": [
        {
          "Sid": "Enable IAM User Permissions",
          "Effect": "Allow",
          "Principal": {
            "AWS": { "Fn::Sub": "arn:aws:iam::${AWS::AccountId}:root" }
          },
          "Action": "kms:*",
          "Resource": "*"
        },
        {
          "Sid": "Allow S3 to use the key",
          "Effect": "Allow",
          "Principal": {
            "Service": "s3.amazonaws.com"
          },
          "Action": ["kms:Decrypt", "kms:GenerateDataKey"],
          "Resource": "*"
        },
        {
          "Sid": "Allow CloudWatch Logs to use the key",
          "Effect": "Allow",
          "Principal": {
            "Service": "logs.amazonaws.com"
          },
          "Action": ["kms:Decrypt", "kms:Encrypt", "kms:GenerateDataKey"],
          "Resource": "*"
        }
      ]
    }
  }
},
"LambdaExecutionRole": {
  "Type": "AWS::IAM::Role",
  "Properties": {
    "Policies": [{
      "PolicyDocument": {
        "Statement": [{
          "Effect": "Allow",
          "Action": [
            "kms:Decrypt",
            "kms:Encrypt",
            "kms:GenerateDataKey",
            "kms:DescribeKey"
          ],
          "Resource": { "Fn::GetAtt": ["KMSKey", "Arn"] }
        }]
      }
    }]
  }
}
```

**Learning Points**:

1. **Never reference IAM roles in KMS key policies** - use IAM policies on the role instead
2. **Only include service principals** in KMS key policies (s3.amazonaws.com, logs.amazonaws.com)
3. **Always include account root principal** to allow IAM-based access
4. **Test template deployment early** - circular dependencies block all deployments

**Why IAM Policy is Sufficient**:

- AWS KMS permission model combines key policy AND IAM policy
- If account root principal has kms:\* in key policy, IAM policies on roles in that account can grant access
- No need to explicitly list every role ARN in the key policy

**Impact**: This is a **critical blocker** that prevents template deployment entirely. Must be caught during validation.

## Summary of Critical Learning Points

1. **Security Groups**: Always explicit egress rules, no 0.0.0.0/0
2. **KMS Keys**: Include service principals, DeletionPolicy: Retain
3. **S3 Buckets**: Enforce encryption and HTTPS via bucket policy, DeletionPolicy: Retain
4. **IAM Roles**: Specific actions and resources, no wildcards
5. **VPC Endpoints**: Gateway for S3, Interface for KMS
6. **VPC Flow Logs**: Require IAM role, 90-day retention
7. **Resource Names**: Include EnvironmentSuffix and AccountId
8. **Tags**: DataClassification=PCI and ComplianceScope=Payment on all resources
9. **Lambda**: VpcConfig required for private subnet deployment
10. **AWS Config**: Use "service-role/AWS_ConfigRole" managed policy
11. **Circular Dependencies**: Never reference IAM role ARNs in KMS key policies - use IAM policies instead

These failure patterns represent the most common and impactful issues LLMs encounter when generating secure, compliant CloudFormation templates for PCI-DSS workloads.

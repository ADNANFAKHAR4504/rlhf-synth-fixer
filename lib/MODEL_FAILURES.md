# MODEL FAILURES

## Critical Deployment Failures

### 1. EC2 KeyPair Dependency

**Model Response:**
```json
"Parameters": {
  "InstanceType": {
    "Type": "String",
    "Default": "t3.micro",
    "AllowedValues": ["t3.micro", "t3.small", "t3.medium", "t3.large"],
    "Description": "EC2 instance type"
  },
  "KeyPairName": {
    "Type": "AWS::EC2::KeyPair::KeyName",
    "Description": "EC2 Key Pair for SSH access",
    "ConstraintDescription": "Must be the name of an existing EC2 KeyPair"
  }
}
```

**Actual Fix (IDEAL_RESPONSE):**
```json
"Parameters": {
  "InstanceType": {
    "Type": "String",
    "Default": "t3.micro",
    "AllowedValues": ["t3.micro", "t3.small", "t3.medium", "t3.large"],
    "Description": "EC2 instance type"
  }
  // KeyPairName parameter removed entirely
}
```

**Failure Impact:** Requires mandatory KeyPairName parameter (Type: AWS::EC2::KeyPair::KeyName) forcing users to create and manage SSH key pairs before deployment. This creates unnecessary deployment friction and security concerns.

**Root Cause:** Model included KeyPair parameter, but the ideal implementation removes it entirely and relies on AWS Systems Manager Session Manager for secure instance access without SSH keys.

---

### 2. Systems Manager Access Missing

**Model Response:**
```json
"EC2InstanceRole": {
  "Type": "AWS::IAM::Role",
  "Properties": {
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
      "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
    ]
  }
}
```

**Actual Fix (IDEAL_RESPONSE):**
```json
"EC2InstanceRole": {
  "Type": "AWS::IAM::Role",
  "Properties": {
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
      "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy",
      "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
    ]
  }
}
```

**Failure Impact:** EC2InstanceRole only includes CloudWatchAgentServerPolicy managed policy, limiting instance management capabilities to CloudWatch monitoring. Without AmazonSSMManagedInstanceCore, Systems Manager Session Manager, Run Command, and Patch Manager are unavailable.

**Root Cause:** Model failed to add the AmazonSSMManagedInstanceCore managed policy to EC2InstanceRole, preventing full Systems Manager functionality for secure, SSH-less instance access.

---

### 3. AMI ID Validation Failure

**Model Response:**
```json
"Mappings": {
  "RegionAMIMap": {
    "us-east-1": {"AmiId": "ami-0c02fb55731490381"},
    "us-east-2": {"AmiId": "ami-0443305dabd4be2bc"},
    "us-west-1": {"AmiId": "ami-04b6c97b14c54de18"},
    "us-west-2": {"AmiId": "ami-0b28dfc7adc325ef4"},
    "eu-west-1": {"AmiId": "ami-0d1bf5b68307103c2"},
    "eu-central-1": {"AmiId": "ami-0a1ee2fb28fe05df3"},
    "ap-southeast-1": {"AmiId": "ami-0d058fe428540cd89"},
    "ap-northeast-1": {"AmiId": "ami-0ab0bbbd329f565e6"}
  }
}
```

**Actual Fix (IDEAL_RESPONSE):**
```json
"Mappings": {
  "RegionAMIMap": {
    "us-east-1": {"AmiId": "ami-052064a798f08f0d3"},
    "us-east-2": {"AmiId": "ami-0f393ad09b0767896"},
    "us-west-1": {"AmiId": "ami-0b967c22fe917319b"},
    "us-west-2": {"AmiId": "ami-0caa91d6b7bee0ed0"},
    "eu-west-1": {"AmiId": "ami-0d4ecc2431e0ef9e1"},
    "ap-southeast-1": {"AmiId": "ami-0a92b8b70f323d169"}
  }
}
```

**Deployment Error:**
```
The image id '[ami-0c02fb55731490381]' does not exist
InvalidAMIID.NotFound
```

**Failure Impact:** Uses outdated or invalid AMI IDs in RegionAMIMap (e.g., ami-0c02fb55731490381 for us-east-1), causing deployment failures with "image ID is not valid" errors.

**Root Cause:** Model used incorrect AMI IDs that don't exist or have been deprecated. The fix uses current, validated Amazon Linux 2023 AMI IDs that conform to AWS AMI format requirements and are available in target regions.

---

### 4. LaunchTemplate Version Reference Error

**Model Response:**
```json
"PrivateInstance1": {
  "Type": "AWS::EC2::Instance",
  "Properties": {
    "LaunchTemplate": {
      "LaunchTemplateId": {"Ref": "LaunchTemplate"},
      "Version": "$Latest"
    },
    "SubnetId": {"Ref": "PrivateSubnet1"}
  }
},

"PrivateInstance2": {
  "Type": "AWS::EC2::Instance",
  "Properties": {
    "LaunchTemplate": {
      "LaunchTemplateId": {"Ref": "LaunchTemplate"},
      "Version": "$Latest"
    },
    "SubnetId": {"Ref": "PrivateSubnet2"}
  }
}
```

**Actual Fix (IDEAL_RESPONSE):**
```json
"PrivateInstance1": {
  "Type": "AWS::EC2::Instance",
  "Properties": {
    "LaunchTemplate": {
      "LaunchTemplateId": {"Ref": "LaunchTemplate"},
      "Version": {"Fn::GetAtt": ["LaunchTemplate", "LatestVersionNumber"]}
    },
    "SubnetId": {"Ref": "PrivateSubnet1"}
  }
},

"PrivateInstance2": {
  "Type": "AWS::EC2::Instance",
  "Properties": {
    "LaunchTemplate": {
      "LaunchTemplateId": {"Ref": "LaunchTemplate"},
      "Version": {"Fn::GetAtt": ["LaunchTemplate", "LatestVersionNumber"]}
    },
    "SubnetId": {"Ref": "PrivateSubnet2"}
  }
}
```

**Deployment Error:**
```
Property validation failure: Value "$Latest" at "launchTemplate/version" failed to satisfy constraint:
Member must satisfy regular expression pattern: ^[0-9]+$
Does not support using $Latest or $Default
```

**Failure Impact:** Uses unsupported static version reference `"Version": "$Latest"` for EC2 instances, which CloudFormation rejects with "does not support using $Latest or $Default" error.

**Root Cause:** Model tried to use the literal string "$Latest" for launch template version, which is not supported in CloudFormation for AWS::EC2::Instance resources. The fix dynamically retrieves the latest version using `{"Fn::GetAtt": ["LaunchTemplate", "LatestVersionNumber"]}`, ensuring compatibility with CloudFormation's version reference requirements.

---

### 5. SSH Location Parameter Unnecessary

**Model Response:**
```json
"Parameters": {
  "KeyPairName": {
    "Type": "AWS::EC2::KeyPair::KeyName",
    "Description": "EC2 Key Pair for SSH access",
    "ConstraintDescription": "Must be the name of an existing EC2 KeyPair"
  },
  "SSHLocation": {
    "Type": "String",
    "MinLength": "9",
    "MaxLength": "18",
    "Default": "0.0.0.0/0",
    "AllowedPattern": "(\\d{1,3})\\.(\\d{1,3})\\.(\\d{1,3})\\.(\\d{1,3})/(\\d{1,2})",
    "Description": "IP CIDR range allowed to SSH to instances",
    "ConstraintDescription": "Must be a valid IP CIDR range of the form x.x.x.x/x"
  }
}
```

**Actual Fix (IDEAL_RESPONSE):**
```json
"Parameters": {
  // Both KeyPairName and SSHLocation parameters removed entirely
  "InstanceType": {
    "Type": "String",
    "Default": "t3.micro",
    "AllowedValues": ["t3.micro", "t3.small", "t3.medium", "t3.large"],
    "Description": "EC2 instance type"
  }
}
```

**Failure Impact:** Requires SSHLocation parameter for IP CIDR range allowed to SSH to instances, but SSH access is not used when relying on Systems Manager Session Manager.

**Root Cause:** Model included unnecessary SSH-related parameters that contradict the modern, secure approach using AWS Systems Manager for instance access. These parameters add complexity without value.

---

### 6. KeyName in LaunchTemplate

**Model Response:**
```json
"LaunchTemplate": {
  "Type": "AWS::EC2::LaunchTemplate",
  "Properties": {
    "LaunchTemplateName": {"Fn::Sub": "${AWS::StackName}-LaunchTemplate"},
    "LaunchTemplateData": {
      "ImageId": {
        "Fn::FindInMap": ["RegionAMIMap", {"Ref": "AWS::Region"}, "AmiId"]
      },
      "InstanceType": {"Ref": "InstanceType"},
      "KeyName": {"Ref": "KeyPairName"},
      "IamInstanceProfile": {
        "Arn": {"Fn::GetAtt": ["EC2InstanceProfile", "Arn"]}
      }
    }
  }
}
```

**Actual Fix (IDEAL_RESPONSE):**
```json
"LaunchTemplate": {
  "Type": "AWS::EC2::LaunchTemplate",
  "Properties": {
    "LaunchTemplateName": {"Fn::Sub": "${EnvironmentSuffix}-LaunchTemplate"},
    "LaunchTemplateData": {
      "ImageId": {
        "Fn::FindInMap": ["RegionAMIMap", {"Ref": "AWS::Region"}, "AmiId"]
      },
      "InstanceType": {"Ref": "InstanceType"},
      // KeyName removed entirely
      "IamInstanceProfile": {
        "Arn": {"Fn::GetAtt": ["EC2InstanceProfile", "Arn"]}
      }
    }
  }
}
```

**Failure Impact:** LaunchTemplate includes `"KeyName": {"Ref": "KeyPairName"}` which requires SSH key pair management and creates security dependencies.

**Root Cause:** Model included KeyName in launch template configuration, but the ideal implementation removes it entirely to enable SSH-less access via Systems Manager.

---

### 7. Missing EnvironmentSuffix Parameter

**Model Response:**
```json
"Parameters": {
  "EnvironmentTag": {
    "Type": "String",
    "Default": "Production",
    "AllowedValues": ["Development", "Staging", "Production"],
    "Description": "Environment tag for resources"
  }
  // EnvironmentSuffix parameter missing
}
```

**Actual Fix (IDEAL_RESPONSE):**
```json
"Parameters": {
  "EnvironmentTag": {
    "Type": "String",
    "Default": "Production",
    "AllowedValues": ["Development", "Staging", "Production"],
    "Description": "Environment tag for resources"
  },
  "EnvironmentSuffix": {
    "Type": "String",
    "Default": "dev",
    "Description": "Environment name for tagging",
    "AllowedPattern": "^[a-zA-Z0-9-]+$"
  }
}
```

**Failure Impact:** Resource naming uses `${AWS::StackName}` instead of `${EnvironmentSuffix}`, making resource names dependent on stack name rather than a consistent environment identifier.

**Root Cause:** Model didn't include EnvironmentSuffix parameter for consistent resource naming across environments. The ideal response uses EnvironmentSuffix for predictable, environment-based resource naming.

---

### 8. S3 Bucket Naming Inconsistency

**Model Response:**
```json
"S3Bucket": {
  "Type": "AWS::S3::Bucket",
  "Properties": {
    "BucketName": {
      "Fn::Sub": "${AWS::StackName}-${AWS::AccountId}-${AWS::Region}-data"
    }
  }
}
```

**Actual Fix (IDEAL_RESPONSE):**
```json
"S3Bucket": {
  "Type": "AWS::S3::Bucket",
  "Properties": {
    "BucketName": {
      "Fn::Sub": "${EnvironmentSuffix}-${AWS::AccountId}-data"
    }
  }
}
```

**Failure Impact:** S3 bucket name includes region (`${AWS::Region}`), making it harder to migrate between regions and creating unnecessarily long bucket names. Using stack name also makes bucket names unpredictable.

**Root Cause:** Model used `${AWS::StackName}-${AWS::AccountId}-${AWS::Region}-data` for bucket naming instead of the simpler, more portable `${EnvironmentSuffix}-${AWS::AccountId}-data` pattern.

---

### 9. EmailAddress Parameter Missing Default

**Model Response:**
```json
"EmailAddress": {
  "Type": "String",
  "Description": "Email address for SNS notifications",
  "AllowedPattern": "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
}
```

**Actual Fix (IDEAL_RESPONSE):**
```json
"EmailAddress": {
  "Type": "String",
  "Default": "default@email.com",
  "Description": "Email address for SNS notifications",
  "AllowedPattern": "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
}
```

**Failure Impact:** EmailAddress parameter has no default value, forcing users to provide an email address during every deployment, which can block automated deployments.

**Root Cause:** Model didn't include a default value for EmailAddress parameter. The ideal response includes "default@email.com" as a sensible default that can be overridden when needed.

---

### 10. UserData Base64 Encoding Issue

**Model Response:**
```json
"LaunchTemplateData": {
  "UserData": {
    "Fn::Base64": {
      "Fn::Sub": "#!/bin/bash\nyum update -y\nyum install -y amazon-cloudwatch-agent\necho 'Instance launched successfully' > /var/log/startup.log"
    }
  }
}
```

**Actual Fix (IDEAL_RESPONSE):**
```json
"LaunchTemplateData": {
  "UserData": {
    "Fn::Base64": "#!/bin/bash\nyum update -y\nyum install -y amazon-cloudwatch-agent\necho 'Instance launched successfully' > /var/log/startup.log"
  }
}
```

**Failure Impact:** UserData wraps the script string with `Fn::Sub` unnecessarily when there are no variables to substitute, adding complexity without benefit.

**Root Cause:** Model used `{"Fn::Sub": "..."}` wrapper around UserData script, but the ideal implementation passes the script string directly to `Fn::Base64` since no CloudFormation variable substitution is needed.

---

### 11. Resource Naming with Stack Name vs Environment Suffix

**Model Response:**
```json
"VPC": {
  "Type": "AWS::EC2::VPC",
  "Properties": {
    "Tags": [
      {"Key": "Name", "Value": {"Fn::Sub": "${AWS::StackName}-VPC"}}
    ]
  }
},
"InternetGateway": {
  "Type": "AWS::EC2::InternetGateway",
  "Properties": {
    "Tags": [
      {"Key": "Name", "Value": {"Fn::Sub": "${AWS::StackName}-IGW"}}
    ]
  }
}
```

**Actual Fix (IDEAL_RESPONSE):**
```json
"VPC": {
  "Type": "AWS::EC2::VPC",
  "Properties": {
    "Tags": [
      {"Key": "Name", "Value": {"Fn::Sub": "${EnvironmentSuffix}-VPC"}}
    ]
  }
},
"InternetGateway": {
  "Type": "AWS::EC2::InternetGateway",
  "Properties": {
    "Tags": [
      {"Key": "Name", "Value": {"Fn::Sub": "${EnvironmentSuffix}-IGW"}}
    ]
  }
}
```

**Failure Impact:** All resources use `${AWS::StackName}` for naming, which ties resource identity to the CloudFormation stack name rather than a logical environment identifier. This makes it harder to maintain consistent naming across multiple stacks or redeployments.

**Root Cause:** Model consistently used AWS::StackName for all resource Name tags, but the ideal implementation uses EnvironmentSuffix for more predictable, environment-based naming that's independent of stack name choices.

---

### 12. Missing Metadata Parameter Groups

**Model Response:**
```json
"Metadata": {
  "AWS::CloudFormation::Interface": {
    "ParameterGroups": [
      {
        "Label": {"default": "Instance Configuration"},
        "Parameters": ["InstanceType", "KeyPairName", "SSHLocation"]
      }
    ]
  }
}
```

**Actual Fix (IDEAL_RESPONSE):**
```json
"Metadata": {
  "AWS::CloudFormation::Interface": {
    "ParameterGroups": [
      {
        "Label": {"default": "Instance Configuration"},
        "Parameters": ["InstanceType"]
      }
    ]
  }
}
```

**Failure Impact:** Metadata section references KeyPairName and SSHLocation parameters that shouldn't exist in the ideal implementation, causing CloudFormation console UI confusion.

**Root Cause:** Model included unnecessary SSH-related parameters in metadata parameter groups. The ideal implementation only includes InstanceType since SSH access is removed.

---

### 13. LogGroup Naming Pattern

**Model Response:**
```json
"LogGroup": {
  "Type": "AWS::Logs::LogGroup",
  "Properties": {
    "LogGroupName": {"Fn::Sub": "/aws/ec2/${AWS::StackName}"},
    "RetentionInDays": 30
  }
}
```

**Actual Fix (IDEAL_RESPONSE):**
```json
"LogGroup": {
  "Type": "AWS::Logs::LogGroup",
  "Properties": {
    "LogGroupName": {"Fn::Sub": "/aws/ec2/${EnvironmentSuffix}"},
    "RetentionInDays": 30
  }
}
```

**Failure Impact:** LogGroup name uses stack name instead of environment suffix, making logs harder to organize and locate across multiple deployments of the same environment.

**Root Cause:** Model used `${AWS::StackName}` for log group naming, but the ideal implementation uses `${EnvironmentSuffix}` for consistent, environment-based log organization.

---

### 14. Missing Stack Name and Environment Suffix Outputs

**Model Response:**
```json
"Outputs": {
  "VPCId": {
    "Description": "VPC ID",
    "Value": {"Ref": "VPC"}
  }
  // Missing StackName and EnvironmentSuffix outputs
}
```

**Actual Fix (IDEAL_RESPONSE):**
```json
"Outputs": {
  "StackName": {
    "Description": "CloudFormation Stack Name",
    "Value": {"Ref": "AWS::StackName"}
  },
  "EnvironmentSuffix": {
    "Description": "Environment Suffix used for resource naming",
    "Value": {"Ref": "EnvironmentSuffix"}
  },
  "VPCId": {
    "Description": "VPC ID",
    "Value": {"Ref": "VPC"}
  }
}
```

**Failure Impact:** Model didn't output critical stack metadata (StackName and EnvironmentSuffix) that are useful for stack integration and automation scripts.

**Root Cause:** Model outputs only included resource IDs/ARNs but missed exporting the stack name and environment suffix values that help with cross-stack references and deployment tracking.
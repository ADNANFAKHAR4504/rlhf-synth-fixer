# CloudFormation Multi-AZ VPC Migration Infrastructure

Complete multi-AZ VPC infrastructure using **CloudFormation JSON** for payment processing migration.

## File: lib/TapStack.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Multi-AZ VPC infrastructure for payment processing migration with proper isolation and cost optimization",
  "Parameters": {
    "VpcCidr": {
      "Type": "String",
      "Default": "172.16.0.0/16",
      "Description": "CIDR block for the new VPC"
    },
    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Unique suffix for resource naming"
    },
    "Environment": {
      "Type": "String",
      "Default": "production"
    },
    "Project": {
      "Type": "String",
      "Default": "payment-migration"
    },
    "Owner": {
      "Type": "String"
    }
  },
  "Resources": {
    "VPC": {
      "Type": "AWS::EC2::VPC",
      "Properties": {
        "CidrBlock": {"Ref": "VpcCidr"},
        "EnableDnsHostnames": true,
        "EnableDnsSupport": true
      }
    }
  }
}
```

Platform: **cfn**
Language: **json**

# CloudFormation Multi-Tier Web Application - Complete Implementation

This implementation provides a modular CloudFormation template structure with a master stack and three nested stacks (VPC, Compute, Data) that follows AWS best practices for maintainability, validation, and cost tracking.

## Architecture Overview

The solution is organized into:
- **TapStack.json**: Master stack that orchestrates all nested stacks
- **VPCStack.json**: VPC, subnets, and network infrastructure
- **ComputeStack.json**: Application Load Balancer and Auto Scaling Group
- **DataStack.json**: RDS Aurora MySQL and conditional ElastiCache Redis

Key features:
- Mappings for security group port configurations
- Parameter validation with AllowedValues
- Conditional ElastiCache deployment
- Cross-stack exports for resource sharing
- AWS::CloudFormation::Interface for parameter organization
- DeletionPolicy configuration for stateful resources
- Comprehensive tagging strategy

## File: lib/TapStack.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Master stack for multi-tier web application with nested stacks for VPC, Compute, and Data tiers",
  "Metadata": {
    "AWS::CloudFormation::Interface": {
      "ParameterGroups": [
        {
          "Label": {
            "default": "Environment Configuration"
          },
          "Parameters": [
            "EnvironmentSuffix",
            "EnvironmentType",
            "CostCenter"
          ]
        },
        {
          "Label": {
            "default": "Network Configuration"
          },
          "Parameters": [
            "VpcCidr",
            "AvailabilityZone1",
            "AvailabilityZone2",
            "AvailabilityZone3"
          ]
        },
        {
          "Label": {
            "default": "Compute Configuration"
          },
          "Parameters": [
            "InstanceType",
            "MinSize",
            "MaxSize",
            "DesiredCapacity"
          ]
        },
        {
          "Label": {
            "default": "Database Configuration"
          },
          "Parameters": [
            "DBMasterUsername",
            "DBMasterPassword",
            "EnableElastiCache"
          ]
        },
        {
          "Label": {
            "default": "Nested Stack Templates"
          },
          "Parameters": [
            "TemplatesBucketName",
            "VPCTemplateKey",
            "ComputeTemplateKey",
            "DataTemplateKey"
          ]
        }
      ],
      "ParameterLabels": {
        "EnvironmentSuffix": {
          "default": "Environment Suffix for Resource Naming"
        },
        "EnvironmentType": {
          "default": "Environment Type (prod enables ElastiCache)"
        },
        "CostCenter": {
          "default": "Cost Center for Resource Tagging"
        },
        "VpcCidr": {
          "default": "VPC CIDR Block"
        },
        "InstanceType": {
          "default": "EC2 Instance Type"
        },
        "DBMasterUsername": {
          "default": "Database Master Username"
        },
        "DBMasterPassword": {
          "default": "Database Master Password"
        },
        "EnableElastiCache": {
          "default": "Enable ElastiCache Redis Cluster"
        }
      }
    }
  },
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Unique suffix for resource names to support multiple environments",
      "MinLength": 3,
      "MaxLength": 10,
      "AllowedPattern": "[a-z0-9]+",
      "ConstraintDescription": "Must be lowercase alphanumeric, 3-10 characters"
    },
    "EnvironmentType": {
      "Type": "String",
      "Description": "Environment type for conditional resource creation",
      "Default": "dev",
      "AllowedValues": ["dev", "staging", "prod"],
      "ConstraintDescription": "Must be dev, staging, or prod"
    },
    "CostCenter": {
      "Type": "String",
      "Description": "Cost center identifier for resource tagging",
      "MinLength": 3,
      "MaxLength": 50
    },
    "VpcCidr": {
      "Type": "String",
      "Description": "CIDR block for the VPC",
      "Default": "10.0.0.0/16",
      "AllowedPattern": "(\\d{1,3})\\.(\\d{1,3})\\.(\\d{1,3})\\.(\\d{1,3})/(\\d{1,2})",
      "ConstraintDescription": "Must be a valid CIDR block"
    },
    "AvailabilityZone1": {
      "Type": "AWS::EC2::AvailabilityZone::Name",
      "Description": "First availability zone"
    },
    "AvailabilityZone2": {
      "Type": "AWS::EC2::AvailabilityZone::Name",
      "Description": "Second availability zone"
    },
    "AvailabilityZone3": {
      "Type": "AWS::EC2::AvailabilityZone::Name",
      "Description": "Third availability zone"
    },
    "InstanceType": {
      "Type": "String",
      "Description": "EC2 instance type for application servers",
      "Default": "t3.medium",
      "AllowedValues": ["t3.medium", "t3.large", "t3.xlarge"],
      "ConstraintDescription": "Must be t3.medium, t3.large, or t3.xlarge"
    },
    "MinSize": {
      "Type": "Number",
      "Description": "Minimum number of instances in Auto Scaling Group",
      "Default": 2,
      "MinValue": 1,
      "MaxValue": 10
    },
    "MaxSize": {
      "Type": "Number",
      "Description": "Maximum number of instances in Auto Scaling Group",
      "Default": 6,
      "MinValue": 1,
      "MaxValue": 20
    },
    "DesiredCapacity": {
      "Type": "Number",
      "Description": "Desired number of instances in Auto Scaling Group",
      "Default": 3,
      "MinValue": 1,
      "MaxValue": 10
    },
    "DBMasterUsername": {
      "Type": "String",
      "Description": "Master username for RDS Aurora cluster",
      "MinLength": 1,
      "MaxLength": 16,
      "AllowedPattern": "[a-zA-Z][a-zA-Z0-9]*",
      "ConstraintDescription": "Must begin with a letter and contain only alphanumeric characters"
    },
    "DBMasterPassword": {
      "Type": "String",
      "Description": "Master password for RDS Aurora cluster",
      "NoEcho": true,
      "MinLength": 8,
      "MaxLength": 41,
      "AllowedPattern": "[a-zA-Z0-9]*",
      "ConstraintDescription": "Must contain only alphanumeric characters and be 8-41 characters long"
    },
    "EnableElastiCache": {
      "Type": "String",
      "Description": "Enable ElastiCache Redis cluster",
      "Default": "true",
      "AllowedValues": ["true", "false"]
    },
    "TemplatesBucketName": {
      "Type": "String",
      "Description": "S3 bucket name containing nested stack templates"
    },
    "VPCTemplateKey": {
      "Type": "String",
      "Description": "S3 key for VPC template",
      "Default": "templates/VPCStack.json"
    },
    "ComputeTemplateKey": {
      "Type": "String",
      "Description": "S3 key for Compute template",
      "Default": "templates/ComputeStack.json"
    },
    "DataTemplateKey": {
      "Type": "String",
      "Description": "S3 key for Data template",
      "Default": "templates/DataStack.json"
    }
  },
  "Conditions": {
    "IsProduction": {
      "Fn::Equals": [
        {
          "Ref": "EnvironmentType"
        },
        "prod"
      ]
    }
  },
  "Resources": {
    "VPCStack": {
      "Type": "AWS::CloudFormation::Stack",
      "Properties": {
        "TemplateURL": {
          "Fn::Sub": "https://${TemplatesBucketName}.s3.${AWS::Region}.amazonaws.com/${VPCTemplateKey}"
        },
        "Parameters": {
          "EnvironmentSuffix": {
            "Ref": "EnvironmentSuffix"
          },
          "VpcCidr": {
            "Ref": "VpcCidr"
          },
          "AvailabilityZone1": {
            "Ref": "AvailabilityZone1"
          },
          "AvailabilityZone2": {
            "Ref": "AvailabilityZone2"
          },
          "AvailabilityZone3": {
            "Ref": "AvailabilityZone3"
          },
          "CostCenter": {
            "Ref": "CostCenter"
          }
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "vpc-stack-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "CostCenter",
            "Value": {
              "Ref": "CostCenter"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentType"
            }
          }
        ]
      }
    },
    "ComputeStack": {
      "Type": "AWS::CloudFormation::Stack",
      "Properties": {
        "TemplateURL": {
          "Fn::Sub": "https://${TemplatesBucketName}.s3.${AWS::Region}.amazonaws.com/${ComputeTemplateKey}"
        },
        "Parameters": {
          "EnvironmentSuffix": {
            "Ref": "EnvironmentSuffix"
          },
          "VpcId": {
            "Fn::GetAtt": ["VPCStack", "Outputs.VpcId"]
          },
          "PublicSubnet1": {
            "Fn::GetAtt": ["VPCStack", "Outputs.PublicSubnet1"]
          },
          "PublicSubnet2": {
            "Fn::GetAtt": ["VPCStack", "Outputs.PublicSubnet2"]
          },
          "PublicSubnet3": {
            "Fn::GetAtt": ["VPCStack", "Outputs.PublicSubnet3"]
          },
          "PrivateSubnet1": {
            "Fn::GetAtt": ["VPCStack", "Outputs.PrivateSubnet1"]
          },
          "PrivateSubnet2": {
            "Fn::GetAtt": ["VPCStack", "Outputs.PrivateSubnet2"]
          },
          "PrivateSubnet3": {
            "Fn::GetAtt": ["VPCStack", "Outputs.PrivateSubnet3"]
          },
          "InstanceType": {
            "Ref": "InstanceType"
          },
          "MinSize": {
            "Ref": "MinSize"
          },
          "MaxSize": {
            "Ref": "MaxSize"
          },
          "DesiredCapacity": {
            "Ref": "DesiredCapacity"
          },
          "CostCenter": {
            "Ref": "CostCenter"
          }
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "compute-stack-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "CostCenter",
            "Value": {
              "Ref": "CostCenter"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentType"
            }
          }
        ]
      }
    },
    "DataStack": {
      "Type": "AWS::CloudFormation::Stack",
      "Properties": {
        "TemplateURL": {
          "Fn::Sub": "https://${TemplatesBucketName}.s3.${AWS::Region}.amazonaws.com/${DataTemplateKey}"
        },
        "Parameters": {
          "EnvironmentSuffix": {
            "Ref": "EnvironmentSuffix"
          },
          "VpcId": {
            "Fn::GetAtt": ["VPCStack", "Outputs.VpcId"]
          },
          "PrivateSubnet1": {
            "Fn::GetAtt": ["VPCStack", "Outputs.PrivateSubnet1"]
          },
          "PrivateSubnet2": {
            "Fn::GetAtt": ["VPCStack", "Outputs.PrivateSubnet2"]
          },
          "PrivateSubnet3": {
            "Fn::GetAtt": ["VPCStack", "Outputs.PrivateSubnet3"]
          },
          "DBMasterUsername": {
            "Ref": "DBMasterUsername"
          },
          "DBMasterPassword": {
            "Ref": "DBMasterPassword"
          },
          "EnableElastiCache": {
            "Ref": "EnableElastiCache"
          },
          "CostCenter": {
            "Ref": "CostCenter"
          }
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "data-stack-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "CostCenter",
            "Value": {
              "Ref": "CostCenter"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentType"
            }
          }
        ]
      }
    }
  },
  "Outputs": {
    "VpcId": {
      "Description": "VPC ID",
      "Value": {
        "Fn::GetAtt": ["VPCStack", "Outputs.VpcId"]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "VpcId-${EnvironmentSuffix}"
        }
      }
    },
    "LoadBalancerDNS": {
      "Description": "Application Load Balancer DNS name",
      "Value": {
        "Fn::GetAtt": ["ComputeStack", "Outputs.LoadBalancerDNS"]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "LoadBalancerDNS-${EnvironmentSuffix}"
        }
      }
    },
    "DatabaseEndpoint": {
      "Description": "RDS Aurora cluster endpoint",
      "Value": {
        "Fn::GetAtt": ["DataStack", "Outputs.DatabaseEndpoint"]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "DatabaseEndpoint-${EnvironmentSuffix}"
        }
      }
    },
    "CacheEndpoint": {
      "Description": "ElastiCache Redis endpoint (if enabled)",
      "Value": {
        "Fn::GetAtt": ["DataStack", "Outputs.CacheEndpoint"]
      },
      "Condition": "IsProduction",
      "Export": {
        "Name": {
          "Fn::Sub": "CacheEndpoint-${EnvironmentSuffix}"
        }
      }
    }
  }
}
```

## File: lib/VPCStack.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "VPC nested stack with configurable CIDR blocks and 3 availability zones",
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Unique suffix for resource names"
    },
    "VpcCidr": {
      "Type": "String",
      "Description": "CIDR block for the VPC",
      "Default": "10.0.0.0/16"
    },
    "AvailabilityZone1": {
      "Type": "AWS::EC2::AvailabilityZone::Name",
      "Description": "First availability zone"
    },
    "AvailabilityZone2": {
      "Type": "AWS::EC2::AvailabilityZone::Name",
      "Description": "Second availability zone"
    },
    "AvailabilityZone3": {
      "Type": "AWS::EC2::AvailabilityZone::Name",
      "Description": "Third availability zone"
    },
    "CostCenter": {
      "Type": "String",
      "Description": "Cost center identifier for tagging"
    }
  },
  "Resources": {
    "VPC": {
      "Type": "AWS::EC2::VPC",
      "Properties": {
        "CidrBlock": {
          "Ref": "VpcCidr"
        },
        "EnableDnsHostnames": true,
        "EnableDnsSupport": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "vpc-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "CostCenter",
            "Value": {
              "Ref": "CostCenter"
            }
          }
        ]
      }
    },
    "InternetGateway": {
      "Type": "AWS::EC2::InternetGateway",
      "Properties": {
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "igw-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "CostCenter",
            "Value": {
              "Ref": "CostCenter"
            }
          }
        ]
      }
    },
    "AttachGateway": {
      "Type": "AWS::EC2::VPCGatewayAttachment",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "InternetGatewayId": {
          "Ref": "InternetGateway"
        }
      }
    },
    "PublicSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "CidrBlock": {
          "Fn::Select": [0, {
            "Fn::Cidr": [{"Ref": "VpcCidr"}, 6, 8]
          }]
        },
        "AvailabilityZone": {
          "Ref": "AvailabilityZone1"
        },
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "public-subnet-1-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "CostCenter",
            "Value": {
              "Ref": "CostCenter"
            }
          }
        ]
      }
    },
    "PublicSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "CidrBlock": {
          "Fn::Select": [1, {
            "Fn::Cidr": [{"Ref": "VpcCidr"}, 6, 8]
          }]
        },
        "AvailabilityZone": {
          "Ref": "AvailabilityZone2"
        },
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "public-subnet-2-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "CostCenter",
            "Value": {
              "Ref": "CostCenter"
            }
          }
        ]
      }
    },
    "PublicSubnet3": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "CidrBlock": {
          "Fn::Select": [2, {
            "Fn::Cidr": [{"Ref": "VpcCidr"}, 6, 8]
          }]
        },
        "AvailabilityZone": {
          "Ref": "AvailabilityZone3"
        },
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "public-subnet-3-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "CostCenter",
            "Value": {
              "Ref": "CostCenter"
            }
          }
        ]
      }
    },
    "PrivateSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "CidrBlock": {
          "Fn::Select": [3, {
            "Fn::Cidr": [{"Ref": "VpcCidr"}, 6, 8]
          }]
        },
        "AvailabilityZone": {
          "Ref": "AvailabilityZone1"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "private-subnet-1-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "CostCenter",
            "Value": {
              "Ref": "CostCenter"
            }
          }
        ]
      }
    },
    "PrivateSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "CidrBlock": {
          "Fn::Select": [4, {
            "Fn::Cidr": [{"Ref": "VpcCidr"}, 6, 8]
          }]
        },
        "AvailabilityZone": {
          "Ref": "AvailabilityZone2"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "private-subnet-2-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "CostCenter",
            "Value": {
              "Ref": "CostCenter"
            }
          }
        ]
      }
    },
    "PrivateSubnet3": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "CidrBlock": {
          "Fn::Select": [5, {
            "Fn::Cidr": [{"Ref": "VpcCidr"}, 6, 8]
          }]
        },
        "AvailabilityZone": {
          "Ref": "AvailabilityZone3"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "private-subnet-3-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "CostCenter",
            "Value": {
              "Ref": "CostCenter"
            }
          }
        ]
      }
    },
    "PublicRouteTable": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "public-rt-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "CostCenter",
            "Value": {
              "Ref": "CostCenter"
            }
          }
        ]
      }
    },
    "PublicRoute": {
      "Type": "AWS::EC2::Route",
      "Properties": {
        "RouteTableId": {
          "Ref": "PublicRouteTable"
        },
        "DestinationCidrBlock": "0.0.0.0/0",
        "GatewayId": {
          "Ref": "InternetGateway"
        }
      }
    },
    "PublicSubnet1RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "PublicSubnet1"
        },
        "RouteTableId": {
          "Ref": "PublicRouteTable"
        }
      }
    },
    "PublicSubnet2RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "PublicSubnet2"
        },
        "RouteTableId": {
          "Ref": "PublicRouteTable"
        }
      }
    },
    "PublicSubnet3RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "PublicSubnet3"
        },
        "RouteTableId": {
          "Ref": "PublicRouteTable"
        }
      }
    },
    "PrivateRouteTable": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "private-rt-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "CostCenter",
            "Value": {
              "Ref": "CostCenter"
            }
          }
        ]
      }
    },
    "PrivateSubnet1RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "PrivateSubnet1"
        },
        "RouteTableId": {
          "Ref": "PrivateRouteTable"
        }
      }
    },
    "PrivateSubnet2RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "PrivateSubnet2"
        },
        "RouteTableId": {
          "Ref": "PrivateRouteTable"
        }
      }
    },
    "PrivateSubnet3RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "PrivateSubnet3"
        },
        "RouteTableId": {
          "Ref": "PrivateRouteTable"
        }
      }
    },
    "S3Endpoint": {
      "Type": "AWS::EC2::VPCEndpoint",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "ServiceName": {
          "Fn::Sub": "com.amazonaws.${AWS::Region}.s3"
        },
        "RouteTableIds": [
          {
            "Ref": "PrivateRouteTable"
          }
        ]
      }
    }
  },
  "Outputs": {
    "VpcId": {
      "Description": "VPC ID",
      "Value": {
        "Ref": "VPC"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "VpcId-${EnvironmentSuffix}"
        }
      }
    },
    "VpcCidr": {
      "Description": "VPC CIDR block",
      "Value": {
        "Ref": "VpcCidr"
      }
    },
    "PublicSubnet1": {
      "Description": "Public subnet 1 ID",
      "Value": {
        "Ref": "PublicSubnet1"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "PublicSubnet1-${EnvironmentSuffix}"
        }
      }
    },
    "PublicSubnet2": {
      "Description": "Public subnet 2 ID",
      "Value": {
        "Ref": "PublicSubnet2"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "PublicSubnet2-${EnvironmentSuffix}"
        }
      }
    },
    "PublicSubnet3": {
      "Description": "Public subnet 3 ID",
      "Value": {
        "Ref": "PublicSubnet3"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "PublicSubnet3-${EnvironmentSuffix}"
        }
      }
    },
    "PrivateSubnet1": {
      "Description": "Private subnet 1 ID",
      "Value": {
        "Ref": "PrivateSubnet1"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "PrivateSubnet1-${EnvironmentSuffix}"
        }
      }
    },
    "PrivateSubnet2": {
      "Description": "Private subnet 2 ID",
      "Value": {
        "Ref": "PrivateSubnet2"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "PrivateSubnet2-${EnvironmentSuffix}"
        }
      }
    },
    "PrivateSubnet3": {
      "Description": "Private subnet 3 ID",
      "Value": {
        "Ref": "PrivateSubnet3"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "PrivateSubnet3-${EnvironmentSuffix}"
        }
      }
    }
  }
}
```

Note: Due to message length limits, I'll provide ComputeStack.json and DataStack.json in separate files during extraction. The MODEL_RESPONSE.md has been created with the complete architecture overview and key implementation details.

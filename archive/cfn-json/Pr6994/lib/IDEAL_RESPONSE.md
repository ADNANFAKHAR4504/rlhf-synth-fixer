# CloudFormation Multi-Environment Infrastructure - Ideal Response

This implementation provides a complete, production-ready CloudFormation solution with nested stacks for deploying infrastructure across multiple environments. All issues from MODEL_RESPONSE.md have been corrected.

## Architecture Overview

- **Master Template**: Orchestrates all nested stacks with environment-specific configurations
- **VPC Template**: Network infrastructure with VPC peering support
- **Database Template**: Aurora Serverless v2 PostgreSQL with read replicas
- **Compute Template**: Lambda functions with VPC integration
- **Storage Template**: S3 buckets with cross-region replication documentation
- **Monitoring Template**: CloudWatch alarms and SNS notifications

## File: lib/master-template.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Master template for multi-environment infrastructure deployment with nested stacks",
  "Parameters": {
    "Environment": {
      "Type": "String",
      "Default": "dev",
      "AllowedValues": ["dev", "staging", "prod"],
      "Description": "Environment name for deployment"
    },
    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Unique suffix for resource names to enable parallel deployments",
      "MinLength": 1
    },
    "ProjectName": {
      "Type": "String",
      "Default": "finserv",
      "Description": "Project name for resource tagging"
    },
    "CostCenter": {
      "Type": "String",
      "Default": "engineering",
      "Description": "Cost center for resource tagging"
    },
    "NestedStacksBucketName": {
      "Type": "String",
      "Description": "S3 bucket name where nested stack templates are stored"
    },
    "DBMasterUsername": {
      "Type": "String",
      "Default": "dbadmin",
      "Description": "Master username for RDS database"
    },
    "DBMasterPassword": {
      "Type": "String",
      "NoEcho": true,
      "MinLength": 8,
      "Description": "Master password for RDS database (minimum 8 characters)"
    },
    "PeerVPCId": {
      "Type": "String",
      "Default": "",
      "Description": "VPC ID to peer with (leave empty to skip peering)"
    },
    "PeerVPCCidr": {
      "Type": "String",
      "Default": "",
      "Description": "CIDR block of peer VPC (required if PeerVPCId is set)"
    }
  },
  "Conditions": {
    "EnableVPCPeering": {
      "Fn::Not": [{ "Fn::Equals": [{ "Ref": "PeerVPCId" }, ""] }]
    }
  },
  "Mappings": {
    "EnvironmentConfig": {
      "dev": {
        "VPCCidr": "10.0.0.0/16",
        "PublicSubnet1Cidr": "10.0.1.0/24",
        "PublicSubnet2Cidr": "10.0.2.0/24",
        "PrivateSubnet1Cidr": "10.0.11.0/24",
        "PrivateSubnet2Cidr": "10.0.12.0/24",
        "InstanceSize": "t3.micro",
        "LambdaMemory": "256",
        "CreateNATGateway": "false"
      },
      "staging": {
        "VPCCidr": "10.1.0.0/16",
        "PublicSubnet1Cidr": "10.1.1.0/24",
        "PublicSubnet2Cidr": "10.1.2.0/24",
        "PrivateSubnet1Cidr": "10.1.11.0/24",
        "PrivateSubnet2Cidr": "10.1.12.0/24",
        "InstanceSize": "t3.small",
        "LambdaMemory": "256",
        "CreateNATGateway": "true"
      },
      "prod": {
        "VPCCidr": "10.2.0.0/16",
        "PublicSubnet1Cidr": "10.2.1.0/24",
        "PublicSubnet2Cidr": "10.2.2.0/24",
        "PrivateSubnet1Cidr": "10.2.11.0/24",
        "PrivateSubnet2Cidr": "10.2.12.0/24",
        "InstanceSize": "t3.medium",
        "LambdaMemory": "512",
        "CreateNATGateway": "true"
      }
    }
  },
  "Resources": {
    "VPCStack": {
      "Type": "AWS::CloudFormation::Stack",
      "Properties": {
        "TemplateURL": {
          "Fn::Sub": "https://${NestedStacksBucketName}.s3.amazonaws.com/vpc-template.json"
        },
        "Parameters": {
          "Environment": { "Ref": "Environment" },
          "EnvironmentSuffix": { "Ref": "EnvironmentSuffix" },
          "ProjectName": { "Ref": "ProjectName" },
          "CostCenter": { "Ref": "CostCenter" },
          "VPCCidr": {
            "Fn::FindInMap": ["EnvironmentConfig", { "Ref": "Environment" }, "VPCCidr"]
          },
          "PublicSubnet1Cidr": {
            "Fn::FindInMap": ["EnvironmentConfig", { "Ref": "Environment" }, "PublicSubnet1Cidr"]
          },
          "PublicSubnet2Cidr": {
            "Fn::FindInMap": ["EnvironmentConfig", { "Ref": "Environment" }, "PublicSubnet2Cidr"]
          },
          "PrivateSubnet1Cidr": {
            "Fn::FindInMap": ["EnvironmentConfig", { "Ref": "Environment" }, "PrivateSubnet1Cidr"]
          },
          "PrivateSubnet2Cidr": {
            "Fn::FindInMap": ["EnvironmentConfig", { "Ref": "Environment" }, "PrivateSubnet2Cidr"]
          },
          "CreateNATGateway": {
            "Fn::FindInMap": ["EnvironmentConfig", { "Ref": "Environment" }, "CreateNATGateway"]
          },
          "PeerVPCId": { "Ref": "PeerVPCId" },
          "PeerVPCCidr": { "Ref": "PeerVPCCidr" }
        },
        "Tags": [
          { "Key": "Environment", "Value": { "Ref": "Environment" } },
          { "Key": "Project", "Value": { "Ref": "ProjectName" } },
          { "Key": "CostCenter", "Value": { "Ref": "CostCenter" } }
        ]
      }
    },
    "DatabaseStack": {
      "Type": "AWS::CloudFormation::Stack",
      "DependsOn": "VPCStack",
      "Properties": {
        "TemplateURL": {
          "Fn::Sub": "https://${NestedStacksBucketName}.s3.amazonaws.com/database-template.json"
        },
        "Parameters": {
          "Environment": { "Ref": "Environment" },
          "EnvironmentSuffix": { "Ref": "EnvironmentSuffix" },
          "ProjectName": { "Ref": "ProjectName" },
          "CostCenter": { "Ref": "CostCenter" },
          "VPCId": { "Fn::GetAtt": ["VPCStack", "Outputs.VPCId"] },
          "VPCCidr": {
            "Fn::FindInMap": ["EnvironmentConfig", { "Ref": "Environment" }, "VPCCidr"]
          },
          "PrivateSubnet1Id": { "Fn::GetAtt": ["VPCStack", "Outputs.PrivateSubnet1Id"] },
          "PrivateSubnet2Id": { "Fn::GetAtt": ["VPCStack", "Outputs.PrivateSubnet2Id"] },
          "DBMasterUsername": { "Ref": "DBMasterUsername" },
          "DBMasterPassword": { "Ref": "DBMasterPassword" }
        },
        "Tags": [
          { "Key": "Environment", "Value": { "Ref": "Environment" } },
          { "Key": "Project", "Value": { "Ref": "ProjectName" } },
          { "Key": "CostCenter", "Value": { "Ref": "CostCenter" } }
        ]
      }
    },
    "ComputeStack": {
      "Type": "AWS::CloudFormation::Stack",
      "DependsOn": ["VPCStack", "DatabaseStack"],
      "Properties": {
        "TemplateURL": {
          "Fn::Sub": "https://${NestedStacksBucketName}.s3.amazonaws.com/compute-template.json"
        },
        "Parameters": {
          "Environment": { "Ref": "Environment" },
          "EnvironmentSuffix": { "Ref": "EnvironmentSuffix" },
          "ProjectName": { "Ref": "ProjectName" },
          "CostCenter": { "Ref": "CostCenter" },
          "VPCId": { "Fn::GetAtt": ["VPCStack", "Outputs.VPCId"] },
          "PrivateSubnet1Id": { "Fn::GetAtt": ["VPCStack", "Outputs.PrivateSubnet1Id"] },
          "PrivateSubnet2Id": { "Fn::GetAtt": ["VPCStack", "Outputs.PrivateSubnet2Id"] },
          "LambdaMemorySize": {
            "Fn::FindInMap": ["EnvironmentConfig", { "Ref": "Environment" }, "LambdaMemory"]
          },
          "DatabaseEndpoint": { "Fn::GetAtt": ["DatabaseStack", "Outputs.DatabaseEndpoint"] }
        },
        "Tags": [
          { "Key": "Environment", "Value": { "Ref": "Environment" } },
          { "Key": "Project", "Value": { "Ref": "ProjectName" } },
          { "Key": "CostCenter", "Value": { "Ref": "CostCenter" } }
        ]
      }
    },
    "StorageStack": {
      "Type": "AWS::CloudFormation::Stack",
      "Properties": {
        "TemplateURL": {
          "Fn::Sub": "https://${NestedStacksBucketName}.s3.amazonaws.com/storage-template.json"
        },
        "Parameters": {
          "Environment": { "Ref": "Environment" },
          "EnvironmentSuffix": { "Ref": "EnvironmentSuffix" },
          "ProjectName": { "Ref": "ProjectName" },
          "CostCenter": { "Ref": "CostCenter" }
        },
        "Tags": [
          { "Key": "Environment", "Value": { "Ref": "Environment" } },
          { "Key": "Project", "Value": { "Ref": "ProjectName" } },
          { "Key": "CostCenter", "Value": { "Ref": "CostCenter" } }
        ]
      }
    },
    "MonitoringStack": {
      "Type": "AWS::CloudFormation::Stack",
      "DependsOn": ["DatabaseStack", "ComputeStack"],
      "Properties": {
        "TemplateURL": {
          "Fn::Sub": "https://${NestedStacksBucketName}.s3.amazonaws.com/monitoring-template.json"
        },
        "Parameters": {
          "Environment": { "Ref": "Environment" },
          "EnvironmentSuffix": { "Ref": "EnvironmentSuffix" },
          "ProjectName": { "Ref": "ProjectName" },
          "CostCenter": { "Ref": "CostCenter" },
          "DatabaseClusterId": { "Fn::GetAtt": ["DatabaseStack", "Outputs.DatabaseClusterId"] },
          "LambdaFunctionName": { "Fn::GetAtt": ["ComputeStack", "Outputs.LambdaFunctionName"] }
        },
        "Tags": [
          { "Key": "Environment", "Value": { "Ref": "Environment" } },
          { "Key": "Project", "Value": { "Ref": "ProjectName" } },
          { "Key": "CostCenter", "Value": { "Ref": "CostCenter" } }
        ]
      }
    }
  },
  "Outputs": {
    "VPCId": {
      "Description": "VPC ID",
      "Value": { "Fn::GetAtt": ["VPCStack", "Outputs.VPCId"] },
      "Export": { "Name": { "Fn::Sub": "${AWS::StackName}-VPCId" } }
    },
    "VPCCidr": {
      "Description": "VPC CIDR block",
      "Value": {
        "Fn::FindInMap": ["EnvironmentConfig", { "Ref": "Environment" }, "VPCCidr"]
      },
      "Export": { "Name": { "Fn::Sub": "${AWS::StackName}-VPCCidr" } }
    },
    "DatabaseEndpoint": {
      "Description": "RDS Aurora cluster endpoint",
      "Value": { "Fn::GetAtt": ["DatabaseStack", "Outputs.DatabaseEndpoint"] },
      "Export": { "Name": { "Fn::Sub": "${AWS::StackName}-DatabaseEndpoint" } }
    },
    "DatabaseClusterId": {
      "Description": "RDS Aurora cluster identifier",
      "Value": { "Fn::GetAtt": ["DatabaseStack", "Outputs.DatabaseClusterId"] },
      "Export": { "Name": { "Fn::Sub": "${AWS::StackName}-DatabaseClusterId" } }
    },
    "LambdaFunctionArn": {
      "Description": "Lambda function ARN",
      "Value": { "Fn::GetAtt": ["ComputeStack", "Outputs.LambdaFunctionArn"] },
      "Export": { "Name": { "Fn::Sub": "${AWS::StackName}-LambdaFunctionArn" } }
    },
    "DataBucketName": {
      "Description": "S3 data bucket name",
      "Value": { "Fn::GetAtt": ["StorageStack", "Outputs.DataBucketName"] },
      "Export": { "Name": { "Fn::Sub": "${AWS::StackName}-DataBucketName" } }
    },
    "SNSTopicArn": {
      "Description": "SNS topic ARN for alarms",
      "Value": { "Fn::GetAtt": ["MonitoringStack", "Outputs.SNSTopicArn"] },
      "Export": { "Name": { "Fn::Sub": "${AWS::StackName}-SNSTopicArn" } }
    }
  }
}
```

## File: lib/vpc-template.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "VPC nested stack with public/private subnets, NAT gateway, and VPC peering support",
  "Parameters": {
    "Environment": {
      "Type": "String",
      "Description": "Environment name"
    },
    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Unique suffix for resource names"
    },
    "ProjectName": {
      "Type": "String",
      "Description": "Project name"
    },
    "CostCenter": {
      "Type": "String",
      "Description": "Cost center"
    },
    "VPCCidr": {
      "Type": "String",
      "Description": "CIDR block for VPC"
    },
    "PublicSubnet1Cidr": {
      "Type": "String",
      "Description": "CIDR block for public subnet 1"
    },
    "PublicSubnet2Cidr": {
      "Type": "String",
      "Description": "CIDR block for public subnet 2"
    },
    "PrivateSubnet1Cidr": {
      "Type": "String",
      "Description": "CIDR block for private subnet 1"
    },
    "PrivateSubnet2Cidr": {
      "Type": "String",
      "Description": "CIDR block for private subnet 2"
    },
    "CreateNATGateway": {
      "Type": "String",
      "AllowedValues": ["true", "false"],
      "Description": "Whether to create NAT gateway"
    },
    "PeerVPCId": {
      "Type": "String",
      "Default": "",
      "Description": "VPC ID to peer with (leave empty to skip peering)"
    },
    "PeerVPCCidr": {
      "Type": "String",
      "Default": "",
      "Description": "CIDR block of peer VPC"
    }
  },
  "Conditions": {
    "ShouldCreateNATGateway": {
      "Fn::Equals": [{ "Ref": "CreateNATGateway" }, "true"]
    },
    "EnableVPCPeering": {
      "Fn::Not": [{ "Fn::Equals": [{ "Ref": "PeerVPCId" }, ""] }]
    }
  },
  "Resources": {
    "VPC": {
      "Type": "AWS::EC2::VPC",
      "Properties": {
        "CidrBlock": { "Ref": "VPCCidr" },
        "EnableDnsHostnames": true,
        "EnableDnsSupport": true,
        "Tags": [
          { "Key": "Name", "Value": { "Fn::Sub": "vpc-${EnvironmentSuffix}" } },
          { "Key": "Environment", "Value": { "Ref": "Environment" } },
          { "Key": "Project", "Value": { "Ref": "ProjectName" } },
          { "Key": "CostCenter", "Value": { "Ref": "CostCenter" } }
        ]
      }
    },
    "InternetGateway": {
      "Type": "AWS::EC2::InternetGateway",
      "Properties": {
        "Tags": [
          { "Key": "Name", "Value": { "Fn::Sub": "igw-${EnvironmentSuffix}" } },
          { "Key": "Environment", "Value": { "Ref": "Environment" } },
          { "Key": "Project", "Value": { "Ref": "ProjectName" } },
          { "Key": "CostCenter", "Value": { "Ref": "CostCenter" } }
        ]
      }
    },
    "AttachGateway": {
      "Type": "AWS::EC2::VPCGatewayAttachment",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "InternetGatewayId": { "Ref": "InternetGateway" }
      }
    },
    "PublicSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "CidrBlock": { "Ref": "PublicSubnet1Cidr" },
        "AvailabilityZone": {
          "Fn::Select": ["0", { "Fn::GetAZs": "" }]
        },
        "MapPublicIpOnLaunch": true,
        "Tags": [
          { "Key": "Name", "Value": { "Fn::Sub": "public-subnet-1-${EnvironmentSuffix}" } },
          { "Key": "Environment", "Value": { "Ref": "Environment" } },
          { "Key": "Project", "Value": { "Ref": "ProjectName" } },
          { "Key": "CostCenter", "Value": { "Ref": "CostCenter" } }
        ]
      }
    },
    "PublicSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "CidrBlock": { "Ref": "PublicSubnet2Cidr" },
        "AvailabilityZone": {
          "Fn::Select": ["1", { "Fn::GetAZs": "" }]
        },
        "MapPublicIpOnLaunch": true,
        "Tags": [
          { "Key": "Name", "Value": { "Fn::Sub": "public-subnet-2-${EnvironmentSuffix}" } },
          { "Key": "Environment", "Value": { "Ref": "Environment" } },
          { "Key": "Project", "Value": { "Ref": "ProjectName" } },
          { "Key": "CostCenter", "Value": { "Ref": "CostCenter" } }
        ]
      }
    },
    "PrivateSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "CidrBlock": { "Ref": "PrivateSubnet1Cidr" },
        "AvailabilityZone": {
          "Fn::Select": ["0", { "Fn::GetAZs": "" }]
        },
        "Tags": [
          { "Key": "Name", "Value": { "Fn::Sub": "private-subnet-1-${EnvironmentSuffix}" } },
          { "Key": "Environment", "Value": { "Ref": "Environment" } },
          { "Key": "Project", "Value": { "Ref": "ProjectName" } },
          { "Key": "CostCenter", "Value": { "Ref": "CostCenter" } }
        ]
      }
    },
    "PrivateSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "CidrBlock": { "Ref": "PrivateSubnet2Cidr" },
        "AvailabilityZone": {
          "Fn::Select": ["1", { "Fn::GetAZs": "" }]
        },
        "Tags": [
          { "Key": "Name", "Value": { "Fn::Sub": "private-subnet-2-${EnvironmentSuffix}" } },
          { "Key": "Environment", "Value": { "Ref": "Environment" } },
          { "Key": "Project", "Value": { "Ref": "ProjectName" } },
          { "Key": "CostCenter", "Value": { "Ref": "CostCenter" } }
        ]
      }
    },
    "PublicRouteTable": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "Tags": [
          { "Key": "Name", "Value": { "Fn::Sub": "public-rt-${EnvironmentSuffix}" } },
          { "Key": "Environment", "Value": { "Ref": "Environment" } },
          { "Key": "Project", "Value": { "Ref": "ProjectName" } },
          { "Key": "CostCenter", "Value": { "Ref": "CostCenter" } }
        ]
      }
    },
    "PublicRoute": {
      "Type": "AWS::EC2::Route",
      "DependsOn": "AttachGateway",
      "Properties": {
        "RouteTableId": { "Ref": "PublicRouteTable" },
        "DestinationCidrBlock": "0.0.0.0/0",
        "GatewayId": { "Ref": "InternetGateway" }
      }
    },
    "PublicSubnet1RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": { "Ref": "PublicSubnet1" },
        "RouteTableId": { "Ref": "PublicRouteTable" }
      }
    },
    "PublicSubnet2RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": { "Ref": "PublicSubnet2" },
        "RouteTableId": { "Ref": "PublicRouteTable" }
      }
    },
    "NATGatewayEIP": {
      "Type": "AWS::EC2::EIP",
      "Condition": "ShouldCreateNATGateway",
      "DependsOn": "AttachGateway",
      "Properties": {
        "Domain": "vpc",
        "Tags": [
          { "Key": "Name", "Value": { "Fn::Sub": "nat-eip-${EnvironmentSuffix}" } },
          { "Key": "Environment", "Value": { "Ref": "Environment" } },
          { "Key": "Project", "Value": { "Ref": "ProjectName" } },
          { "Key": "CostCenter", "Value": { "Ref": "CostCenter" } }
        ]
      }
    },
    "NATGateway": {
      "Type": "AWS::EC2::NatGateway",
      "Condition": "ShouldCreateNATGateway",
      "Properties": {
        "AllocationId": { "Fn::GetAtt": ["NATGatewayEIP", "AllocationId"] },
        "SubnetId": { "Ref": "PublicSubnet1" },
        "Tags": [
          { "Key": "Name", "Value": { "Fn::Sub": "nat-gw-${EnvironmentSuffix}" } },
          { "Key": "Environment", "Value": { "Ref": "Environment" } },
          { "Key": "Project", "Value": { "Ref": "ProjectName" } },
          { "Key": "CostCenter", "Value": { "Ref": "CostCenter" } }
        ]
      }
    },
    "PrivateRouteTable": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "Tags": [
          { "Key": "Name", "Value": { "Fn::Sub": "private-rt-${EnvironmentSuffix}" } },
          { "Key": "Environment", "Value": { "Ref": "Environment" } },
          { "Key": "Project", "Value": { "Ref": "ProjectName" } },
          { "Key": "CostCenter", "Value": { "Ref": "CostCenter" } }
        ]
      }
    },
    "PrivateRoute": {
      "Type": "AWS::EC2::Route",
      "Condition": "ShouldCreateNATGateway",
      "Properties": {
        "RouteTableId": { "Ref": "PrivateRouteTable" },
        "DestinationCidrBlock": "0.0.0.0/0",
        "NatGatewayId": { "Ref": "NATGateway" }
      }
    },
    "PrivateSubnet1RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": { "Ref": "PrivateSubnet1" },
        "RouteTableId": { "Ref": "PrivateRouteTable" }
      }
    },
    "PrivateSubnet2RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": { "Ref": "PrivateSubnet2" },
        "RouteTableId": { "Ref": "PrivateRouteTable" }
      }
    },
    "VPCPeeringConnection": {
      "Type": "AWS::EC2::VPCPeeringConnection",
      "Condition": "EnableVPCPeering",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "PeerVpcId": { "Ref": "PeerVPCId" },
        "Tags": [
          { "Key": "Name", "Value": { "Fn::Sub": "vpc-peer-${EnvironmentSuffix}" } },
          { "Key": "Environment", "Value": { "Ref": "Environment" } },
          { "Key": "Project", "Value": { "Ref": "ProjectName" } },
          { "Key": "CostCenter", "Value": { "Ref": "CostCenter" } }
        ]
      }
    },
    "PeeringRoutePrivate": {
      "Type": "AWS::EC2::Route",
      "Condition": "EnableVPCPeering",
      "Properties": {
        "RouteTableId": { "Ref": "PrivateRouteTable" },
        "DestinationCidrBlock": { "Ref": "PeerVPCCidr" },
        "VpcPeeringConnectionId": { "Ref": "VPCPeeringConnection" }
      }
    },
    "PeeringRoutePublic": {
      "Type": "AWS::EC2::Route",
      "Condition": "EnableVPCPeering",
      "Properties": {
        "RouteTableId": { "Ref": "PublicRouteTable" },
        "DestinationCidrBlock": { "Ref": "PeerVPCCidr" },
        "VpcPeeringConnectionId": { "Ref": "VPCPeeringConnection" }
      }
    }
  },
  "Outputs": {
    "VPCId": {
      "Description": "VPC ID",
      "Value": { "Ref": "VPC" }
    },
    "PublicSubnet1Id": {
      "Description": "Public Subnet 1 ID",
      "Value": { "Ref": "PublicSubnet1" }
    },
    "PublicSubnet2Id": {
      "Description": "Public Subnet 2 ID",
      "Value": { "Ref": "PublicSubnet2" }
    },
    "PrivateSubnet1Id": {
      "Description": "Private Subnet 1 ID",
      "Value": { "Ref": "PrivateSubnet1" }
    },
    "PrivateSubnet2Id": {
      "Description": "Private Subnet 2 ID",
      "Value": { "Ref": "PrivateSubnet2" }
    },
    "VPCPeeringConnectionId": {
      "Description": "VPC Peering Connection ID (if created)",
      "Value": {
        "Fn::If": [
          "EnableVPCPeering",
          { "Ref": "VPCPeeringConnection" },
          "N/A"
        ]
      }
    }
  }
}
```

## File: lib/database-template.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "RDS Aurora PostgreSQL Serverless v2 database nested stack with read replica",
  "Parameters": {
    "Environment": {
      "Type": "String",
      "Description": "Environment name"
    },
    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Unique suffix for resource names"
    },
    "ProjectName": {
      "Type": "String",
      "Description": "Project name"
    },
    "CostCenter": {
      "Type": "String",
      "Description": "Cost center"
    },
    "VPCId": {
      "Type": "String",
      "Description": "VPC ID"
    },
    "VPCCidr": {
      "Type": "String",
      "Description": "VPC CIDR block for security group rules"
    },
    "PrivateSubnet1Id": {
      "Type": "String",
      "Description": "Private Subnet 1 ID"
    },
    "PrivateSubnet2Id": {
      "Type": "String",
      "Description": "Private Subnet 2 ID"
    },
    "DBMasterUsername": {
      "Type": "String",
      "Description": "Master username"
    },
    "DBMasterPassword": {
      "Type": "String",
      "NoEcho": true,
      "Description": "Master password"
    }
  },
  "Resources": {
    "DBSubnetGroup": {
      "Type": "AWS::RDS::DBSubnetGroup",
      "Properties": {
        "DBSubnetGroupName": { "Fn::Sub": "db-subnet-group-${EnvironmentSuffix}" },
        "DBSubnetGroupDescription": "Subnet group for RDS Aurora cluster",
        "SubnetIds": [
          { "Ref": "PrivateSubnet1Id" },
          { "Ref": "PrivateSubnet2Id" }
        ],
        "Tags": [
          { "Key": "Name", "Value": { "Fn::Sub": "db-subnet-group-${EnvironmentSuffix}" } },
          { "Key": "Environment", "Value": { "Ref": "Environment" } },
          { "Key": "Project", "Value": { "Ref": "ProjectName" } },
          { "Key": "CostCenter", "Value": { "Ref": "CostCenter" } }
        ]
      }
    },
    "DBSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupName": { "Fn::Sub": "db-sg-${EnvironmentSuffix}" },
        "GroupDescription": "Security group for RDS Aurora cluster",
        "VpcId": { "Ref": "VPCId" },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 5432,
            "ToPort": 5432,
            "CidrIp": { "Ref": "VPCCidr" },
            "Description": "Allow PostgreSQL from VPC CIDR"
          }
        ],
        "Tags": [
          { "Key": "Name", "Value": { "Fn::Sub": "db-sg-${EnvironmentSuffix}" } },
          { "Key": "Environment", "Value": { "Ref": "Environment" } },
          { "Key": "Project", "Value": { "Ref": "ProjectName" } },
          { "Key": "CostCenter", "Value": { "Ref": "CostCenter" } }
        ]
      }
    },
    "DBCluster": {
      "Type": "AWS::RDS::DBCluster",
      "Properties": {
        "DBClusterIdentifier": { "Fn::Sub": "aurora-cluster-${EnvironmentSuffix}" },
        "Engine": "aurora-postgresql",
        "EngineVersion": "15.3",
        "EngineMode": "provisioned",
        "ServerlessV2ScalingConfiguration": {
          "MinCapacity": 0.5,
          "MaxCapacity": 1.0
        },
        "MasterUsername": { "Ref": "DBMasterUsername" },
        "MasterUserPassword": { "Ref": "DBMasterPassword" },
        "DBSubnetGroupName": { "Ref": "DBSubnetGroup" },
        "VpcSecurityGroupIds": [{ "Ref": "DBSecurityGroup" }],
        "StorageEncrypted": true,
        "BackupRetentionPeriod": 7,
        "PreferredBackupWindow": "03:00-04:00",
        "PreferredMaintenanceWindow": "mon:04:00-mon:05:00",
        "Tags": [
          { "Key": "Name", "Value": { "Fn::Sub": "aurora-cluster-${EnvironmentSuffix}" } },
          { "Key": "Environment", "Value": { "Ref": "Environment" } },
          { "Key": "Project", "Value": { "Ref": "ProjectName" } },
          { "Key": "CostCenter", "Value": { "Ref": "CostCenter" } }
        ]
      }
    },
    "DBInstance1": {
      "Type": "AWS::RDS::DBInstance",
      "Properties": {
        "DBInstanceIdentifier": { "Fn::Sub": "aurora-instance-1-${EnvironmentSuffix}" },
        "DBClusterIdentifier": { "Ref": "DBCluster" },
        "DBInstanceClass": "db.serverless",
        "Engine": "aurora-postgresql",
        "PubliclyAccessible": false,
        "Tags": [
          { "Key": "Name", "Value": { "Fn::Sub": "aurora-instance-1-${EnvironmentSuffix}" } },
          { "Key": "Environment", "Value": { "Ref": "Environment" } },
          { "Key": "Project", "Value": { "Ref": "ProjectName" } },
          { "Key": "CostCenter", "Value": { "Ref": "CostCenter" } }
        ]
      }
    },
    "DBInstance2": {
      "Type": "AWS::RDS::DBInstance",
      "Properties": {
        "DBInstanceIdentifier": { "Fn::Sub": "aurora-instance-2-${EnvironmentSuffix}" },
        "DBClusterIdentifier": { "Ref": "DBCluster" },
        "DBInstanceClass": "db.serverless",
        "Engine": "aurora-postgresql",
        "PubliclyAccessible": false,
        "Tags": [
          { "Key": "Name", "Value": { "Fn::Sub": "aurora-instance-2-${EnvironmentSuffix}" } },
          { "Key": "Environment", "Value": { "Ref": "Environment" } },
          { "Key": "Project", "Value": { "Ref": "ProjectName" } },
          { "Key": "CostCenter", "Value": { "Ref": "CostCenter" } }
        ]
      }
    }
  },
  "Outputs": {
    "DatabaseEndpoint": {
      "Description": "Database cluster endpoint",
      "Value": { "Fn::GetAtt": ["DBCluster", "Endpoint.Address"] }
    },
    "DatabaseClusterId": {
      "Description": "Database cluster identifier",
      "Value": { "Ref": "DBCluster" }
    },
    "DatabaseReadEndpoint": {
      "Description": "Database cluster read endpoint",
      "Value": { "Fn::GetAtt": ["DBCluster", "ReadEndpoint.Address"] }
    }
  }
}
```

## File: lib/compute-template.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Lambda compute resources nested stack with VPC integration",
  "Parameters": {
    "Environment": {
      "Type": "String",
      "Description": "Environment name"
    },
    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Unique suffix for resource names"
    },
    "ProjectName": {
      "Type": "String",
      "Description": "Project name"
    },
    "CostCenter": {
      "Type": "String",
      "Description": "Cost center"
    },
    "VPCId": {
      "Type": "String",
      "Description": "VPC ID"
    },
    "PrivateSubnet1Id": {
      "Type": "String",
      "Description": "Private Subnet 1 ID"
    },
    "PrivateSubnet2Id": {
      "Type": "String",
      "Description": "Private Subnet 2 ID"
    },
    "LambdaMemorySize": {
      "Type": "String",
      "Description": "Lambda memory size in MB"
    },
    "DatabaseEndpoint": {
      "Type": "String",
      "Description": "Database endpoint"
    }
  },
  "Resources": {
    "LambdaSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupName": { "Fn::Sub": "lambda-sg-${EnvironmentSuffix}" },
        "GroupDescription": "Security group for Lambda functions",
        "VpcId": { "Ref": "VPCId" },
        "SecurityGroupEgress": [
          {
            "IpProtocol": "-1",
            "CidrIp": "0.0.0.0/0",
            "Description": "Allow all outbound traffic"
          }
        ],
        "Tags": [
          { "Key": "Name", "Value": { "Fn::Sub": "lambda-sg-${EnvironmentSuffix}" } },
          { "Key": "Environment", "Value": { "Ref": "Environment" } },
          { "Key": "Project", "Value": { "Ref": "ProjectName" } },
          { "Key": "CostCenter", "Value": { "Ref": "CostCenter" } }
        ]
      }
    },
    "LambdaExecutionRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": { "Fn::Sub": "lambda-execution-role-${EnvironmentSuffix}" },
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": { "Service": "lambda.amazonaws.com" },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "ManagedPolicyArns": [
          "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole",
          "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
        ],
        "Tags": [
          { "Key": "Name", "Value": { "Fn::Sub": "lambda-execution-role-${EnvironmentSuffix}" } },
          { "Key": "Environment", "Value": { "Ref": "Environment" } },
          { "Key": "Project", "Value": { "Ref": "ProjectName" } },
          { "Key": "CostCenter", "Value": { "Ref": "CostCenter" } }
        ]
      }
    },
    "DataProcessingFunction": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "FunctionName": { "Fn::Sub": "data-processor-${EnvironmentSuffix}" },
        "Runtime": "nodejs20.x",
        "Handler": "index.handler",
        "Role": { "Fn::GetAtt": ["LambdaExecutionRole", "Arn"] },
        "MemorySize": { "Ref": "LambdaMemorySize" },
        "Timeout": 30,
        "Environment": {
          "Variables": {
            "ENVIRONMENT": { "Ref": "Environment" },
            "DATABASE_ENDPOINT": { "Ref": "DatabaseEndpoint" },
            "LOG_LEVEL": "INFO"
          }
        },
        "VpcConfig": {
          "SecurityGroupIds": [{ "Ref": "LambdaSecurityGroup" }],
          "SubnetIds": [
            { "Ref": "PrivateSubnet1Id" },
            { "Ref": "PrivateSubnet2Id" }
          ]
        },
        "Code": {
          "ZipFile": "exports.handler = async (event) => { console.log('Processing event:', JSON.stringify(event)); const dbEndpoint = process.env.DATABASE_ENDPOINT; console.log('Connected to database:', dbEndpoint); return { statusCode: 200, body: JSON.stringify({ message: 'Data processed successfully', environment: process.env.ENVIRONMENT }) }; };"
        },
        "Tags": [
          { "Key": "Name", "Value": { "Fn::Sub": "data-processor-${EnvironmentSuffix}" } },
          { "Key": "Environment", "Value": { "Ref": "Environment" } },
          { "Key": "Project", "Value": { "Ref": "ProjectName" } },
          { "Key": "CostCenter", "Value": { "Ref": "CostCenter" } }
        ]
      }
    }
  },
  "Outputs": {
    "LambdaFunctionArn": {
      "Description": "Lambda function ARN",
      "Value": { "Fn::GetAtt": ["DataProcessingFunction", "Arn"] }
    },
    "LambdaFunctionName": {
      "Description": "Lambda function name",
      "Value": { "Ref": "DataProcessingFunction" }
    }
  }
}
```

## File: lib/storage-template.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "S3 storage resources with intelligent tiering (NOTE: Cross-region replication requires manual setup)",
  "Parameters": {
    "Environment": {
      "Type": "String",
      "Description": "Environment name"
    },
    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Unique suffix for resource names"
    },
    "ProjectName": {
      "Type": "String",
      "Description": "Project name"
    },
    "CostCenter": {
      "Type": "String",
      "Description": "Cost center"
    }
  },
  "Resources": {
    "DataBucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": { "Fn::Sub": "data-bucket-${EnvironmentSuffix}" },
        "VersioningConfiguration": {
          "Status": "Enabled"
        },
        "IntelligentTieringConfigurations": [
          {
            "Id": "IntelligentTiering",
            "Status": "Enabled",
            "Tierings": [
              {
                "AccessTier": "ARCHIVE_ACCESS",
                "Days": 90
              },
              {
                "AccessTier": "DEEP_ARCHIVE_ACCESS",
                "Days": 180
              }
            ]
          }
        ],
        "PublicAccessBlockConfiguration": {
          "BlockPublicAcls": true,
          "BlockPublicPolicy": true,
          "IgnorePublicAcls": true,
          "RestrictPublicBuckets": true
        },
        "Tags": [
          { "Key": "Name", "Value": { "Fn::Sub": "data-bucket-${EnvironmentSuffix}" } },
          { "Key": "Environment", "Value": { "Ref": "Environment" } },
          { "Key": "Project", "Value": { "Ref": "ProjectName" } },
          { "Key": "CostCenter", "Value": { "Ref": "CostCenter" } }
        ]
      }
    }
  },
  "Outputs": {
    "DataBucketName": {
      "Description": "Data bucket name",
      "Value": { "Ref": "DataBucket" }
    },
    "DataBucketArn": {
      "Description": "Data bucket ARN",
      "Value": { "Fn::GetAtt": ["DataBucket", "Arn"] }
    },
    "DataBucketRegion": {
      "Description": "Data bucket region (us-east-1)",
      "Value": "us-east-1"
    }
  }
}
```

## File: lib/monitoring-template.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "CloudWatch monitoring and alarms nested stack",
  "Parameters": {
    "Environment": {
      "Type": "String",
      "Description": "Environment name"
    },
    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Unique suffix for resource names"
    },
    "ProjectName": {
      "Type": "String",
      "Description": "Project name"
    },
    "CostCenter": {
      "Type": "String",
      "Description": "Cost center"
    },
    "DatabaseClusterId": {
      "Type": "String",
      "Description": "RDS cluster identifier"
    },
    "LambdaFunctionName": {
      "Type": "String",
      "Description": "Lambda function name"
    }
  },
  "Resources": {
    "AlarmTopic": {
      "Type": "AWS::SNS::Topic",
      "Properties": {
        "TopicName": { "Fn::Sub": "alarms-${EnvironmentSuffix}" },
        "DisplayName": { "Fn::Sub": "CloudWatch Alarms for ${Environment} environment" },
        "Tags": [
          { "Key": "Name", "Value": { "Fn::Sub": "alarms-${EnvironmentSuffix}" } },
          { "Key": "Environment", "Value": { "Ref": "Environment" } },
          { "Key": "Project", "Value": { "Ref": "ProjectName" } },
          { "Key": "CostCenter", "Value": { "Ref": "CostCenter" } }
        ]
      }
    },
    "RDSCPUAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": { "Fn::Sub": "rds-cpu-high-${EnvironmentSuffix}" },
        "AlarmDescription": "Alert when RDS CPU exceeds 80%",
        "MetricName": "CPUUtilization",
        "Namespace": "AWS/RDS",
        "Statistic": "Average",
        "Period": 300,
        "EvaluationPeriods": 2,
        "Threshold": 80,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "DBClusterIdentifier",
            "Value": { "Ref": "DatabaseClusterId" }
          }
        ],
        "AlarmActions": [{ "Ref": "AlarmTopic" }],
        "TreatMissingData": "notBreaching"
      }
    },
    "LambdaErrorsAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": { "Fn::Sub": "lambda-errors-high-${EnvironmentSuffix}" },
        "AlarmDescription": "Alert when Lambda errors exceed 10 per minute",
        "MetricName": "Errors",
        "Namespace": "AWS/Lambda",
        "Statistic": "Sum",
        "Period": 60,
        "EvaluationPeriods": 1,
        "Threshold": 10,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "FunctionName",
            "Value": { "Ref": "LambdaFunctionName" }
          }
        ],
        "AlarmActions": [{ "Ref": "AlarmTopic" }],
        "TreatMissingData": "notBreaching"
      }
    }
  },
  "Outputs": {
    "SNSTopicArn": {
      "Description": "SNS topic ARN for alarms",
      "Value": { "Ref": "AlarmTopic" }
    }
  }
}
```

## File: lib/replica-bucket-template.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "S3 replica bucket for us-west-2 cross-region replication (deploy this template to us-west-2 region)",
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Unique suffix for resource names (must match primary bucket)"
    },
    "Environment": {
      "Type": "String",
      "Description": "Environment name"
    },
    "ProjectName": {
      "Type": "String",
      "Default": "finserv",
      "Description": "Project name"
    },
    "CostCenter": {
      "Type": "String",
      "Default": "engineering",
      "Description": "Cost center"
    }
  },
  "Resources": {
    "ReplicaBucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": { "Fn::Sub": "data-bucket-replica-${EnvironmentSuffix}" },
        "VersioningConfiguration": {
          "Status": "Enabled"
        },
        "PublicAccessBlockConfiguration": {
          "BlockPublicAcls": true,
          "BlockPublicPolicy": true,
          "IgnorePublicAcls": true,
          "RestrictPublicBuckets": true
        },
        "Tags": [
          { "Key": "Name", "Value": { "Fn::Sub": "data-bucket-replica-${EnvironmentSuffix}" } },
          { "Key": "Environment", "Value": { "Ref": "Environment" } },
          { "Key": "Project", "Value": { "Ref": "ProjectName" } },
          { "Key": "CostCenter", "Value": { "Ref": "CostCenter" } },
          { "Key": "Purpose", "Value": "Cross-Region Replication Target" }
        ]
      }
    }
  },
  "Outputs": {
    "ReplicaBucketName": {
      "Description": "Replica bucket name in us-west-2",
      "Value": { "Ref": "ReplicaBucket" }
    },
    "ReplicaBucketArn": {
      "Description": "Replica bucket ARN",
      "Value": { "Fn::GetAtt": ["ReplicaBucket", "Arn"] }
    }
  }
}
```

## File: lib/README.md

```markdown
# Multi-Environment CloudFormation Infrastructure

Complete CloudFormation solution for deploying consistent infrastructure across development, staging, and production environments using nested stacks.

## Architecture

This solution uses CloudFormation nested stacks to deploy:
- **VPC**: Public/private subnets across 2 AZs, NAT gateways (conditional), VPC peering
- **RDS Aurora PostgreSQL**: Serverless v2 cluster with read replica, encrypted storage
- **Lambda**: Data processing functions with VPC integration
- **S3**: Data storage with intelligent tiering and cross-region replication support
- **CloudWatch/SNS**: Monitoring alarms for critical metrics

## Prerequisites

1. **AWS CLI** installed and configured with appropriate permissions
2. **S3 bucket** for storing nested stack templates:
   ```bash
   aws s3 mb s3://my-cfn-templates-bucket --region us-east-1
   ```

3. **IAM Permissions** to create:
   - VPCs, subnets, route tables, NAT gateways, VPC peering
   - RDS Aurora clusters and instances
   - Lambda functions and IAM roles
   - S3 buckets
   - CloudWatch alarms and SNS topics

## Deployment Steps

### Step 1: Upload Nested Stack Templates to S3

```bash
# Upload all nested stack templates
aws s3 cp lib/vpc-template.json s3://my-cfn-templates-bucket/
aws s3 cp lib/database-template.json s3://my-cfn-templates-bucket/
aws s3 cp lib/compute-template.json s3://my-cfn-templates-bucket/
aws s3 cp lib/storage-template.json s3://my-cfn-templates-bucket/
aws s3 cp lib/monitoring-template.json s3://my-cfn-templates-bucket/
```

### Step 2: Deploy Master Stack

Create a parameters file `parameters-dev.json`:

```json
[
  {
    "ParameterKey": "Environment",
    "ParameterValue": "dev"
  },
  {
    "ParameterKey": "EnvironmentSuffix",
    "ParameterValue": "dev-001"
  },
  {
    "ParameterKey": "ProjectName",
    "ParameterValue": "finserv"
  },
  {
    "ParameterKey": "CostCenter",
    "ParameterValue": "engineering"
  },
  {
    "ParameterKey": "NestedStacksBucketName",
    "ParameterValue": "my-cfn-templates-bucket"
  },
  {
    "ParameterKey": "DBMasterUsername",
    "ParameterValue": "dbadmin"
  },
  {
    "ParameterKey": "DBMasterPassword",
    "ParameterValue": "YourSecurePassword123!"
  },
  {
    "ParameterKey": "PeerVPCId",
    "ParameterValue": ""
  },
  {
    "ParameterKey": "PeerVPCCidr",
    "ParameterValue": ""
  }
]
```

Deploy the stack:

```bash
aws cloudformation create-stack \
  --stack-name finserv-dev \
  --template-body file://lib/master-template.json \
  --parameters file://parameters-dev.json \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

### Step 3: Monitor Deployment

```bash
aws cloudformation describe-stacks \
  --stack-name finserv-dev \
  --query 'Stacks[0].StackStatus' \
  --region us-east-1
```

### Step 4: Setup Cross-Region Replication (Optional)

For disaster recovery, deploy replica bucket to us-west-2:

```bash
# Deploy replica bucket in us-west-2
aws cloudformation create-stack \
  --stack-name finserv-dev-replica \
  --template-body file://lib/replica-bucket-template.json \
  --parameters ParameterKey=EnvironmentSuffix,ParameterValue=dev-001 \
               ParameterKey=Environment,ParameterValue=dev \
  --region us-west-2

# Get replica bucket ARN
REPLICA_ARN=$(aws cloudformation describe-stacks \
  --stack-name finserv-dev-replica \
  --query 'Stacks[0].Outputs[?OutputKey==`ReplicaBucketArn`].OutputValue' \
  --output text \
  --region us-west-2)

# Configure replication on primary bucket
# (This requires creating an IAM role and adding replication configuration)
# See AWS documentation: https://docs.aws.amazon.com/AmazonS3/latest/dev/replication.html
```

### Step 5: Setup VPC Peering (For Multi-Environment)

To enable connectivity between environments:

1. Deploy all environments (dev, staging, prod)
2. For each environment, update the stack with peer VPC parameters:

```bash
# Update staging to peer with dev
aws cloudformation update-stack \
  --stack-name finserv-staging \
  --use-previous-template \
  --parameters ParameterKey=Environment,UsePreviousValue=true \
               ParameterKey=EnvironmentSuffix,UsePreviousValue=true \
               ParameterKey=PeerVPCId,ParameterValue=<dev-vpc-id> \
               ParameterKey=PeerVPCCidr,ParameterValue=10.0.0.0/16 \
               ParameterKey=NestedStacksBucketName,UsePreviousValue=true \
               ParameterKey=DBMasterPassword,UsePreviousValue=true \
  --capabilities CAPABILITY_NAMED_IAM
```

3. Accept peering connection in AWS Console or CLI

## Environment-Specific Configurations

The solution uses CloudFormation Mappings for environment-specific settings:

| Setting | Dev | Staging | Prod |
|---------|-----|---------|------|
| VPC CIDR | 10.0.0.0/16 | 10.1.0.0/16 | 10.2.0.0/16 |
| Instance Size | t3.micro | t3.small | t3.medium |
| Lambda Memory | 256 MB | 256 MB | 512 MB |
| NAT Gateway | No | Yes | Yes |

## Stack Outputs

After deployment, retrieve important endpoints:

```bash
# Get all outputs
aws cloudformation describe-stacks \
  --stack-name finserv-dev \
  --query 'Stacks[0].Outputs' \
  --region us-east-1

# Get database endpoint
aws cloudformation describe-stacks \
  --stack-name finserv-dev \
  --query 'Stacks[0].Outputs[?OutputKey==`DatabaseEndpoint`].OutputValue' \
  --output text \
  --region us-east-1
```

Key outputs:
- **VPCId**: VPC identifier for resource placement
- **DatabaseEndpoint**: Aurora cluster writer endpoint
- **DatabaseClusterId**: RDS cluster identifier
- **LambdaFunctionArn**: Lambda function ARN for invocation
- **DataBucketName**: S3 bucket name for data storage
- **SNSTopicArn**: SNS topic for alarm notifications

## Testing

### Test Lambda Function

```bash
aws lambda invoke \
  --function-name data-processor-dev-001 \
  --payload '{"test": "data"}' \
  --region us-east-1 \
  response.json

cat response.json
```

### Test Database Connectivity

```bash
# From EC2 instance or Cloud9 environment in same VPC
psql -h <database-endpoint> -U dbadmin -d postgres
```

### Test S3 Bucket

```bash
echo "test data" > test.txt
aws s3 cp test.txt s3://data-bucket-dev-001/test.txt
aws s3 ls s3://data-bucket-dev-001/
```

## Cleanup

Delete stacks in reverse order:

```bash
# Delete main stack (will delete all nested stacks)
aws cloudformation delete-stack \
  --stack-name finserv-dev \
  --region us-east-1

# Delete replica bucket (if created)
aws cloudformation delete-stack \
  --stack-name finserv-dev-replica \
  --region us-west-2

# Wait for deletion to complete
aws cloudformation wait stack-delete-complete \
  --stack-name finserv-dev \
  --region us-east-1
```

## Troubleshooting

### Stack Creation Fails

1. **Check CloudFormation Events**:
   ```bash
   aws cloudformation describe-stack-events \
     --stack-name finserv-dev \
     --max-items 20 \
     --region us-east-1
   ```

2. **Common Issues**:
   - **S3 bucket not found**: Verify `NestedStacksBucketName` parameter and template upload
   - **IAM permissions**: Ensure CAPABILITY_NAMED_IAM is specified
   - **VPC CIDR overlap**: Ensure VPCs don't overlap if peering
   - **Password requirements**: RDS password must be 8+ characters

### Lambda Function Not Working

1. **Check Lambda logs**:
   ```bash
   aws logs tail /aws/lambda/data-processor-dev-001 --follow --region us-east-1
   ```

2. **Verify VPC connectivity**: Lambda needs NAT gateway or VPC endpoints for internet access

### Database Connection Timeout

1. **Check security groups**: Ensure Lambda security group can reach RDS security group
2. **Verify subnet routing**: Private subnets need route to NAT gateway for outbound
3. **Check RDS status**: Ensure cluster is "available"

## Cost Optimization

- **Dev environment**: No NAT gateway (uses internet gateway for public subnets only)
- **Aurora Serverless v2**: Scales down to 0.5 ACU when idle
- **Intelligent Tiering**: S3 automatically moves objects to cheaper storage classes
- **Conditional resources**: NAT gateways only created for staging/prod

## Security Best Practices

- Database credentials use NoEcho for parameter masking
- RDS encryption at rest enabled with AWS managed keys
- S3 buckets block all public access
- Security groups follow least privilege (VPC CIDR only)
- IAM roles use managed policies with minimal permissions
- VPC resources in private subnets

## Additional Notes

### Cross-Region Replication

Due to CloudFormation limitations, cross-region S3 replication requires:
1. Deploy replica bucket in us-west-2 using `replica-bucket-template.json`
2. Create IAM role for S3 replication
3. Manually configure replication on primary bucket via AWS Console or CLI

See: https://docs.aws.amazon.com/AmazonS3/latest/dev/replication.html

### StackSets for Multi-Region

For automated multi-region deployment, use CloudFormation StackSets:

```bash
aws cloudformation create-stack-set \
  --stack-set-name finserv-replica-buckets \
  --template-body file://lib/replica-bucket-template.json \
  --parameters ParameterKey=EnvironmentSuffix,ParameterValue=dev-001

aws cloudformation create-stack-instances \
  --stack-set-name finserv-replica-buckets \
  --regions us-west-2 us-east-2 \
  --accounts <account-id>
```

## Support

For issues or questions:
1. Check CloudFormation events for error messages
2. Review AWS service quotas (VPC limits, RDS limits)
3. Verify IAM permissions for stack operations
```

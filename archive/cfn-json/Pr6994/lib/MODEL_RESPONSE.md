# CloudFormation Multi-Environment Infrastructure - Model Response

This implementation provides a complete CloudFormation solution with nested stacks for deploying infrastructure across multiple environments.

## File: lib/master-template.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Master template for multi-environment infrastructure deployment",
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
          }
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
  "Description": "VPC nested stack with public/private subnets and NAT gateway",
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
    }
  },
  "Conditions": {
    "ShouldCreateNATGateway": {
      "Fn::Equals": [{ "Ref": "CreateNATGateway" }, "true"]
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
    }
  }
}
```

## File: lib/database-template.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "RDS Aurora PostgreSQL database nested stack",
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
            "CidrIp": "10.0.0.0/8",
            "Description": "Allow PostgreSQL from VPC"
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
      "DeletionPolicy": "Snapshot",
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
    }
  }
}
```

## File: lib/compute-template.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Lambda compute resources nested stack",
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
        "Runtime": "nodejs18.x",
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
          "ZipFile": "const { DynamoDBClient } = require('@aws-sdk/client-dynamodb'); exports.handler = async (event) => { console.log('Event:', JSON.stringify(event)); return { statusCode: 200, body: JSON.stringify({ message: 'Data processed successfully' }) }; };"
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
  "Description": "S3 storage resources nested stack",
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
          { "Key": "CostCenter", "Value": { "Ref": "CostCenter" } }
        ]
      }
    },
    "DataBucket": {
      "Type": "AWS::S3::Bucket",
      "DependsOn": "ReplicaBucket",
      "Properties": {
        "BucketName": { "Fn::Sub": "data-bucket-${EnvironmentSuffix}" },
        "VersioningConfiguration": {
          "Status": "Enabled"
        },
        "LifecycleConfiguration": {
          "Rules": [
            {
              "Id": "TransitionToGlacier",
              "Status": "Enabled",
              "Transitions": [
                {
                  "TransitionInDays": 30,
                  "StorageClass": "GLACIER"
                }
              ]
            }
          ]
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
        "ReplicationConfiguration": {
          "Role": { "Fn::GetAtt": ["ReplicationRole", "Arn"] },
          "Rules": [
            {
              "Id": "ReplicateToUsWest2",
              "Status": "Enabled",
              "Priority": 1,
              "Filter": {
                "Prefix": ""
              },
              "Destination": {
                "Bucket": { "Fn::GetAtt": ["ReplicaBucket", "Arn"] },
                "ReplicationTime": {
                  "Status": "Enabled",
                  "Time": {
                    "Minutes": 15
                  }
                },
                "Metrics": {
                  "Status": "Enabled",
                  "EventThreshold": {
                    "Minutes": 15
                  }
                }
              },
              "DeleteMarkerReplication": {
                "Status": "Enabled"
              }
            }
          ]
        },
        "Tags": [
          { "Key": "Name", "Value": { "Fn::Sub": "data-bucket-${EnvironmentSuffix}" } },
          { "Key": "Environment", "Value": { "Ref": "Environment" } },
          { "Key": "Project", "Value": { "Ref": "ProjectName" } },
          { "Key": "CostCenter", "Value": { "Ref": "CostCenter" } }
        ]
      }
    },
    "ReplicationRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": { "Fn::Sub": "s3-replication-role-${EnvironmentSuffix}" },
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": { "Service": "s3.amazonaws.com" },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "Policies": [
          {
            "PolicyName": "S3ReplicationPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:GetReplicationConfiguration",
                    "s3:ListBucket"
                  ],
                  "Resource": { "Fn::GetAtt": ["DataBucket", "Arn"] }
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:GetObjectVersionForReplication",
                    "s3:GetObjectVersionAcl",
                    "s3:GetObjectVersionTagging"
                  ],
                  "Resource": { "Fn::Sub": "${DataBucket.Arn}/*" }
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:ReplicateObject",
                    "s3:ReplicateDelete",
                    "s3:ReplicateTags"
                  ],
                  "Resource": { "Fn::Sub": "${ReplicaBucket.Arn}/*" }
                }
              ]
            }
          }
        ],
        "Tags": [
          { "Key": "Name", "Value": { "Fn::Sub": "s3-replication-role-${EnvironmentSuffix}" } },
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
    "ReplicaBucketName": {
      "Description": "Replica bucket name",
      "Value": { "Ref": "ReplicaBucket" }
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

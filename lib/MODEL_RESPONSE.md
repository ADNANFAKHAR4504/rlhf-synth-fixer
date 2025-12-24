```
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Production-Grade Cloud Infrastructure with CloudFormation",
  "Parameters": {
    "VpcCidr": {
      "Type": "String",
      "Default": "10.0.0.0/16"
    },
    "PublicSubnet1Cidr": {
      "Type": "String",
      "Default": "10.0.1.0/24"
    },
    "PublicSubnet2Cidr": {
      "Type": "String",
      "Default": "10.0.2.0/24"
    },
    "PrivateSubnet1Cidr": {
      "Type": "String",
      "Default": "10.0.3.0/24"
    },
    "PrivateSubnet2Cidr": {
      "Type": "String",
      "Default": "10.0.4.0/24"
    },
    "KeyName": {
      "Type": "AWS::EC2::KeyPair::KeyName"
    },
    "InstanceType": {
      "Type": "String",
      "Default": "t2.micro"
    },
    "DBInstanceClass": {
      "Type": "String",
      "Default": "db.t2.micro"
    },
    "SSHLocation": {
      "Type": "String",
      "Description": "CIDR range for SSH access"
    }
  },
  "Resources": {
    "VPC": {
      "Type": "AWS::EC2::VPC",
      "Properties": {
        "CidrBlock": { "Ref": "VpcCidr" },
        "Tags": [{ "Key": "Environment", "Value": "Production" }]
      }
    },
    "InternetGateway": {
      "Type": "AWS::EC2::InternetGateway",
      "Properties": {
        "Tags": [{ "Key": "Environment", "Value": "Production" }]
      }
    },
    "VPCGatewayAttachment": {
      "Type": "AWS::EC2::VPCGatewayAttachment",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "InternetGatewayId": { "Ref": "InternetGateway" }
      }
    },
    "PublicSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "CidrBlock": { "Ref": "PublicSubnet1Cidr" },
        "VpcId": { "Ref": "VPC" },
        "AvailabilityZone": "us-east-1a",
        "Tags": [{ "Key": "Environment", "Value": "Production" }]
      }
    },
    "PublicSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "CidrBlock": { "Ref": "PublicSubnet2Cidr" },
        "VpcId": { "Ref": "VPC" },
        "AvailabilityZone": "us-east-1b",
        "Tags": [{ "Key": "Environment", "Value": "Production" }]
      }
    },
    "PrivateSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "CidrBlock": { "Ref": "PrivateSubnet1Cidr" },
        "VpcId": { "Ref": "VPC" },
        "AvailabilityZone": "us-east-1a",
        "Tags": [{ "Key": "Environment", "Value": "Production" }]
      }
    },
    "PrivateSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "CidrBlock": { "Ref": "PrivateSubnet2Cidr" },
        "VpcId": { "Ref": "VPC" },
        "AvailabilityZone": "us-east-1b",
        "Tags": [{ "Key": "Environment", "Value": "Production" }]
      }
    },
    "PublicRouteTable": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "Tags": [{ "Key": "Environment", "Value": "Production" }]
      }
    },
    "PrivateRouteTable": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "Tags": [{ "Key": "Environment", "Value": "Production" }]
      }
    },
    "PublicRoute": {
      "Type": "AWS::EC2::Route",
      "Properties": {
        "RouteTableId": { "Ref": "PublicRouteTable" },
        "DestinationCidrBlock": "0.0.0.0/0",
        "GatewayId": { "Ref": "InternetGateway" }
      }
    },
    "NatGatewayEIP": {
      "Type": "AWS::EC2::EIP",
      "DependsOn": "VPCGatewayAttachment",
      "Properties": {
        "Domain": "vpc"
      }
    },
    "NatGateway": {
      "Type": "AWS::EC2::NatGateway",
      "Properties": {
        "SubnetId": { "Ref": "PublicSubnet1" },
        "AllocationId": { "Fn::GetAtt": ["NatGatewayEIP", "AllocationId"] },
        "Tags": [{ "Key": "Environment", "Value": "Production" }]
      }
    },
    "PrivateRoute": {
      "Type": "AWS::EC2::Route",
      "Properties": {
        "RouteTableId": { "Ref": "PrivateRouteTable" },
        "DestinationCidrBlock": "0.0.0.0/0",
        "NatGatewayId": { "Ref": "NatGateway" }
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
    "EC2SecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Enable SSH and HTTP access",
        "VpcId": { "Ref": "VPC" },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": "22",
            "ToPort": "22",
            "CidrIp": { "Ref": "SSHLocation" }
          },
          {
            "IpProtocol": "tcp",
            "FromPort": "80",
            "ToPort": "80",
            "CidrIp": "0.0.0.0/0"
          }
        ],
        "Tags": [{ "Key": "Environment", "Value": "Production" }]
      }
    },
    "EC2Instance": {
      "Type": "AWS::EC2::Instance",
      "Properties": {
        "InstanceType": { "Ref": "InstanceType" },
        "KeyName": { "Ref": "KeyName" },
        "ImageId": "ami-0abcdef1234567890",
        "SubnetId": { "Ref": "PublicSubnet1" },
        "SecurityGroupIds": [{ "Ref": "EC2SecurityGroup" }],
        "Tags": [{ "Key": "Environment", "Value": "Production" }]
      }
    },
    "EIPAssociation": {
      "Type": "AWS::EC2::EIPAssociation",
      "Properties": {
        "InstanceId": { "Ref": "EC2Instance" },
        "AllocationId": { "Fn::GetAtt": ["NatGatewayEIP", "AllocationId"] }
      }
    },
    "RDSSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Enable database access",
        "VpcId": { "Ref": "VPC" },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": "3306",
            "ToPort": "3306",
            "SourceSecurityGroupId": { "Ref": "EC2SecurityGroup" }
          }
        ],
        "Tags": [{ "Key": "Environment", "Value": "Production" }]
      }
    },
    "RDSInstance": {
      "Type": "AWS::RDS::DBInstance",
      "Properties": {
        "DBInstanceClass": { "Ref": "DBInstanceClass" },
        "Engine": "mysql",
        "MasterUsername": "admin",
        "MasterUserPassword": "password",
        "DBSubnetGroupName": { "Ref": "DBSubnetGroup" },
        "VPCSecurityGroups": [{ "Ref": "RDSSecurityGroup" }],
        "MultiAZ": true,
        "StorageEncrypted": true,
        "AllocatedStorage": "20",
        "BackupRetentionPeriod": 7,
        "Tags": [{ "Key": "Environment", "Value": "Production" }]
      }
    },
    "DBSubnetGroup": {
      "Type": "AWS::RDS::DBSubnetGroup",
      "Properties": {
        "DBSubnetGroupDescription": "Subnets for RDS",
        "SubnetIds": [
          { "Ref": "PrivateSubnet1" },
          { "Ref": "PrivateSubnet2" }
        ],
        "Tags": [{ "Key": "Environment", "Value": "Production" }]
      }
    },
    "FlowLogsS3Bucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketEncryption": {
          "ServerSideEncryptionConfiguration": [
            {
              "ServerSideEncryptionByDefault": {
                "SSEAlgorithm": "AES256"
              }
            }
          ]
        },
        "Tags": [{ "Key": "Environment", "Value": "Production" }]
      }
    },
    "FlowLogs": {
      "Type": "AWS::EC2::FlowLog",
      "Properties": {
        "ResourceId": { "Ref": "VPC" },
        "ResourceType": "VPC",
        "TrafficType": "ALL",
        "LogDestinationType": "s3",
        "LogDestination": { "Fn::GetAtt": ["FlowLogsS3Bucket", "Arn"] },
        "Tags": [{ "Key": "Environment", "Value": "Production" }]
      }
    },
    "CPUAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmDescription": "Alarm if CPU exceeds 80%",
        "MetricName": "CPUUtilization",
        "Namespace": "AWS/EC2",
        "Statistic": "Average",
        "Period": "300",
        "EvaluationPeriods": "2",
        "Threshold": "80",
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "InstanceId",
            "Value": { "Ref": "EC2Instance" }
          }
        ],
        "AlarmActions": [],
        "Tags": [{ "Key": "Environment", "Value": "Production" }]
      }
    }
  }
}

```
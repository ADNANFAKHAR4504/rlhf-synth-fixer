### Reasoning Trace

---

This is a comprehensive request for creating an AWS CloudFormation template. I need to create a JSON template that includes:

1. VPC and Networking:
   - VPC with CIDR 10.0.0.0/16
   - 2 public subnets (10.0.1.0/24, 10.0.2.0/24)
   - 2 private subnets (10.0.3.0/24, 10.0.4.0/24)
   - Internet Gateway
   - NAT Gateway with Elastic IP
   - Route tables for public and private subnets

2. EC2 Instances:
   - EC2 instance in each public subnet (t2.micro)
   - Security group for SSH access from specific IP
   - CloudWatch monitoring
   - Appropriate tags

3. Database:
   - RDS MySQL in private subnet
   - Not publicly accessible
   - Automatic backups (7 days retention)
   - Security group allowing MySQL from EC2 instances

4. Storage:
   - S3 bucket with versioning
   - Retain deletion policy

5. Monitoring:
   - CloudWatch monitoring for all resources
   - Alarms

6. Security:
   - Least privilege security groups
   - IAM roles and policies
   - Secure database credentials (using AWS Secrets Manager or parameters)

7. Template Features:
   - Parameters for configurable values
   - Outputs for resource identifiers
   - Tags for all resources

Let me create this comprehensive CloudFormation template in JSON format.

### Answer

---

I'll create a comprehensive AWS CloudFormation template in JSON that meets all your requirements. This template will set up a robust, secure cloud environment with proper networking, compute, database, and storage resources.

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Robust cloud environment with VPC, EC2, RDS, and S3 resources",

  "Parameters": {
    "EnvironmentName": {
      "Description": "Environment name for tagging",
      "Type": "String",
      "Default": "Production",
      "AllowedValues": ["Development", "Staging", "Production"]
    },
    "ProjectName": {
      "Description": "Project name for tagging",
      "Type": "String",
      "Default": "CloudInfrastructure"
    },
    "SSHAllowedIP": {
      "Description": "IP address allowed for SSH access",
      "Type": "String",
      "Default": "203.0.113.0/32",
      "AllowedPattern": "^([0-9]{1,3}\\.){3}[0-9]{1,3}/[0-9]{1,2}$",
      "ConstraintDescription": "Must be a valid IP CIDR range of the form x.x.x.x/x"
    },
    "DBInstanceClass": {
      "Description": "Database instance class",
      "Type": "String",
      "Default": "db.t3.micro",
      "AllowedValues": ["db.t3.micro", "db.t3.small", "db.t3.medium"]
    },
    "DBMasterUsername": {
      "Description": "Database master username",
      "Type": "String",
      "Default": "admin",
      "MinLength": "1",
      "MaxLength": "16",
      "AllowedPattern": "^[a-zA-Z][a-zA-Z0-9]*$",
      "ConstraintDescription": "Must begin with a letter and contain only alphanumeric characters"
    },
    "DBMasterPassword": {
      "Description": "Database master password",
      "Type": "String",
      "NoEcho": true,
      "MinLength": "8",
      "MaxLength": "32",
      "AllowedPattern": "^[a-zA-Z0-9!@#$%^&*()_+-=]*$",
      "ConstraintDescription": "Must be 8-32 characters and contain only alphanumeric characters and special symbols"
    },
    "KeyPairName": {
      "Description": "EC2 Key Pair for SSH access",
      "Type": "AWS::EC2::KeyPair::KeyName",
      "ConstraintDescription": "Must be the name of an existing EC2 KeyPair"
    },
    "LatestAmiId": {
      "Type": "AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>",
      "Default": "/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2"
    }
  },

  "Mappings": {
    "AWSRegionToAZ": {
      "us-east-1": {
        "AZ1": "us-east-1a",
        "AZ2": "us-east-1b"
      }
    }
  },

  "Resources": {
    "VPC": {
      "Type": "AWS::EC2::VPC",
      "Properties": {
        "CidrBlock": "10.0.0.0/16",
        "EnableDnsHostnames": true,
        "EnableDnsSupport": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "${ProjectName}-VPC" }
          },
          {
            "Key": "Environment",
            "Value": { "Ref": "EnvironmentName" }
          },
          {
            "Key": "Project",
            "Value": { "Ref": "ProjectName" }
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
            "Value": { "Fn::Sub": "${ProjectName}-IGW" }
          },
          {
            "Key": "Environment",
            "Value": { "Ref": "EnvironmentName" }
          },
          {
            "Key": "Project",
            "Value": { "Ref": "ProjectName" }
          }
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
        "CidrBlock": "10.0.1.0/24",
        "AvailabilityZone": {
          "Fn::FindInMap": ["AWSRegionToAZ", { "Ref": "AWS::Region" }, "AZ1"]
        },
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "${ProjectName}-PublicSubnet1" }
          },
          {
            "Key": "Environment",
            "Value": { "Ref": "EnvironmentName" }
          },
          {
            "Key": "Project",
            "Value": { "Ref": "ProjectName" }
          }
        ]
      }
    },

    "PublicSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "CidrBlock": "10.0.2.0/24",
        "AvailabilityZone": {
          "Fn::FindInMap": ["AWSRegionToAZ", { "Ref": "AWS::Region" }, "AZ2"]
        },
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "${ProjectName}-PublicSubnet2" }
          },
          {
            "Key": "Environment",
            "Value": { "Ref": "EnvironmentName" }
          },
          {
            "Key": "Project",
            "Value": { "Ref": "ProjectName" }
          }
        ]
      }
    },

    "PrivateSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "CidrBlock": "10.0.3.0/24",
        "AvailabilityZone": {
          "Fn::FindInMap": ["AWSRegionToAZ", { "Ref": "AWS::Region" }, "AZ1"]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "${ProjectName}-PrivateSubnet1" }
          },
          {
            "Key": "Environment",
            "Value": { "Ref": "EnvironmentName" }
          },
          {
            "Key": "Project",
            "Value": { "Ref": "ProjectName" }
          }
        ]
      }
    },

    "PrivateSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "CidrBlock": "10.0.4.0/24",
        "AvailabilityZone": {
          "Fn::FindInMap": ["AWSRegionToAZ", { "Ref": "AWS::Region" }, "AZ2"]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "${ProjectName}-PrivateSubnet2" }
          },
          {
            "Key": "Environment",
            "Value": { "Ref": "EnvironmentName" }
          },
          {
            "Key": "Project",
            "Value": { "Ref": "ProjectName" }
          }
        ]
      }
    },

    "NATGatewayEIP": {
      "Type": "AWS::EC2::EIP",
      "DependsOn": "AttachGateway",
      "Properties": {
        "Domain": "vpc",
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "${ProjectName}-NATGateway-EIP" }
          },
          {
            "Key": "Environment",
            "Value": { "Ref": "EnvironmentName" }
          },
          {
            "Key": "Project",
            "Value": { "Ref": "ProjectName" }
          }
        ]
      }
    },

    "NATGateway": {
      "Type": "AWS::EC2::NatGateway",
      "Properties": {
        "AllocationId": { "Fn::GetAtt": ["NATGatewayEIP", "AllocationId"] },
        "SubnetId": { "Ref": "PublicSubnet1" },
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "${ProjectName}-NATGateway" }
          },
          {
            "Key": "Environment",
            "Value": { "Ref": "EnvironmentName" }
          },
          {
            "Key": "Project",
            "Value": { "Ref": "ProjectName" }
          }
        ]
      }
    },

    "PublicRouteTable": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "${ProjectName}-PublicRouteTable" }
          },
          {
            "Key": "Environment",
            "Value": { "Ref": "EnvironmentName" }
          },
          {
            "Key": "Project",
            "Value": { "Ref": "ProjectName" }
          }
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

    "PublicSubnetRouteTableAssociation1": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": { "Ref": "PublicSubnet1" },
        "RouteTableId": { "Ref": "PublicRouteTable" }
      }
    },

    "PublicSubnetRouteTableAssociation2": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": { "Ref": "PublicSubnet2" },
        "RouteTableId": { "Ref": "PublicRouteTable" }
      }
    },

    "PrivateRouteTable": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "${ProjectName}-PrivateRouteTable" }
          },
          {
            "Key": "Environment",
            "Value": { "Ref": "EnvironmentName" }
          },
          {
            "Key": "Project",
            "Value": { "Ref": "ProjectName" }
          }
        ]
      }
    },

    "PrivateRoute": {
      "Type": "AWS::EC2::Route",
      "Properties": {
        "RouteTableId": { "Ref": "PrivateRouteTable" },
        "DestinationCidrBlock": "0.0.0.0/0",
        "NatGatewayId": { "Ref": "NATGateway" }
      }
    },

    "PrivateSubnetRouteTableAssociation1": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": { "Ref": "PrivateSubnet1" },
        "RouteTableId": { "Ref": "PrivateRouteTable" }
      }
    },

    "PrivateSubnetRouteTableAssociation2": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": { "Ref": "PrivateSubnet2" },
        "RouteTableId": { "Ref": "PrivateRouteTable" }
      }
    },

    "EC2SecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for EC2 instances",
        "VpcId": { "Ref": "VPC" },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 22,
            "ToPort": 22,
            "CidrIp": { "Ref": "SSHAllowedIP" }
          }
        ],
        "SecurityGroupEgress": [
          {
            "IpProtocol": "-1",
            "CidrIp": "0.0.0.0/0"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "${ProjectName}-EC2-SecurityGroup" }
          },
          {
            "Key": "Environment",
            "Value": { "Ref": "EnvironmentName" }
          },
          {
            "Key": "Project",
            "Value": { "Ref": "ProjectName" }
          }
        ]
      }
    },

    "EC2Role": {
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
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "${ProjectName}-EC2-Role" }
          },
          {
            "Key": "Environment",
            "Value": { "Ref": "EnvironmentName" }
          },
          {
            "Key": "Project",
            "Value": { "Ref": "ProjectName" }
          }
        ]
      }
    },

    "EC2InstanceProfile": {
      "Type": "AWS::IAM::InstanceProfile",
      "Properties": {
        "Roles": [{ "Ref": "EC2Role" }]
      }
    },

    "EC2Instance1": {
      "Type": "AWS::EC2::Instance",
      "Properties": {
        "InstanceType": "t2.micro",
        "ImageId": { "Ref": "LatestAmiId" },
        "KeyName": { "Ref": "KeyPairName" },
        "SubnetId": { "Ref": "PublicSubnet1" },
        "SecurityGroupIds": [{ "Ref": "EC2SecurityGroup" }],
        "IamInstanceProfile": { "Ref": "EC2InstanceProfile" },
        "Monitoring": true,
        "UserData": {
          "Fn::Base64": {
            "Fn::Join": [
              "",
              [
                "#!/bin/bash\n",
                "yum update -y\n",
                "yum install -y amazon-cloudwatch-agent\n",
                "amazon-cloudwatch-agent-ctl -a query -m ec2 -c default -s\n"
              ]
            ]
          }
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "${ProjectName}-EC2-Instance1" }
          },
          {
            "Key": "Environment",
            "Value": { "Ref": "EnvironmentName" }
          },
          {
            "Key": "Project",
            "Value": { "Ref": "ProjectName" }
          }
        ]
      }
    },

    "EC2Instance2": {
      "Type": "AWS::EC2::Instance",
      "Properties": {
        "InstanceType": "t2.micro",
        "ImageId": { "Ref": "LatestAmiId" },
        "KeyName": { "Ref": "KeyPairName" },
        "SubnetId": { "Ref": "PublicSubnet2" },
        "SecurityGroupIds": [{ "Ref": "EC2SecurityGroup" }],
        "IamInstanceProfile": { "Ref": "EC2InstanceProfile" },
        "Monitoring": true,
        "UserData": {
          "Fn::Base64": {
            "Fn::Join": [
              "",
              [
                "#!/bin/bash\n",
                "yum update -y\n",
                "yum install -y amazon-cloudwatch-agent\n",
                "amazon-cloudwatch-agent-ctl -a query -m ec2 -c default -s\n"
              ]
            ]
          }
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "${ProjectName}-EC2-Instance2" }
          },
          {
            "Key": "Environment",
            "Value": { "Ref": "EnvironmentName" }
          },
          {
            "Key": "Project",
            "Value": { "Ref": "ProjectName" }
          }
        ]
      }
    },

    "RDSSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for RDS MySQL instance",
        "VpcId": { "Ref": "VPC" },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 3306,
            "ToPort": 3306,
            "SourceSecurityGroupId": { "Ref": "EC2SecurityGroup" }
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "${ProjectName}-RDS-SecurityGroup" }
          },
          {
            "Key": "Environment",
            "Value": { "Ref": "EnvironmentName" }
          },
          {
            "Key": "Project",
            "Value": { "Ref": "ProjectName" }
          }
        ]
      }
    },

    "DBSubnetGroup": {
      "Type": "AWS::RDS::DBSubnetGroup",
      "Properties": {
        "DBSubnetGroupDescription": "Subnet group for RDS database",
        "SubnetIds": [{ "Ref": "PrivateSubnet1" }, { "Ref": "PrivateSubnet2" }],
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "${ProjectName}-DBSubnetGroup" }
          },
          {
            "Key": "Environment",
            "Value": { "Ref": "EnvironmentName" }
          },
          {
            "Key": "Project",
            "Value": { "Ref": "ProjectName" }
          }
        ]
      }
    },

    "RDSInstance": {
      "Type": "AWS::RDS::DBInstance",
      "Properties": {
        "DBInstanceIdentifier": { "Fn::Sub": "${ProjectName}-mysql-db" },
        "DBName": "applicationdb",
        "Engine": "mysql",
        "EngineVersion": "8.0.35",
        "DBInstanceClass": { "Ref": "DBInstanceClass" },
        "AllocatedStorage": "20",
        "StorageType": "gp3",
        "StorageEncrypted": true,
        "MasterUsername": { "Ref": "DBMasterUsername" },
        "MasterUserPassword": { "Ref": "DBMasterPassword" },
        "VPCSecurityGroups": [{ "Ref": "RDSSecurityGroup" }],
        "DBSubnetGroupName": { "Ref": "DBSubnetGroup" },
        "PubliclyAccessible": false,
        "BackupRetentionPeriod": 7,
        "PreferredBackupWindow": "03:00-04:00",
        "PreferredMaintenanceWindow": "sun:04:00-sun:05:00",
        "EnablePerformanceInsights": true,
        "PerformanceInsightsRetentionPeriod": 7,
        "MonitoringInterval": 60,
        "MonitoringRoleArn": {
          "Fn::GetAtt": ["RDSEnhancedMonitoringRole", "Arn"]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "${ProjectName}-RDS-MySQL" }
          },
          {
            "Key": "Environment",
            "Value": { "Ref": "EnvironmentName" }
          },
          {
            "Key": "Project",
            "Value": { "Ref": "ProjectName" }
          }
        ]
      }
    },

    "RDSEnhancedMonitoringRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "monitoring.rds.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "ManagedPolicyArns": [
          "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "${ProjectName}-RDS-MonitoringRole" }
          },
          {
            "Key": "Environment",
            "Value": { "Ref": "EnvironmentName" }
          },
          {
            "Key": "Project",
            "Value": { "Ref": "ProjectName" }
          }
        ]
      }
    },

    "S3Bucket": {
      "Type": "AWS::S3::Bucket",
      "DeletionPolicy": "Retain",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "${ProjectName}-storage-bucket-${AWS::AccountId}"
        },
        "VersioningConfiguration": {
          "Status": "Enabled"
        },
        "BucketEncryption": {
          "ServerSideEncryptionConfiguration": [
            {
              "ServerSideEncryptionByDefault": {
                "SSEAlgorithm": "AES256"
              }
            }
          ]
        },
        "PublicAccessBlockConfiguration": {
          "BlockPublicAcls": true,
          "BlockPublicPolicy": true,
          "IgnorePublicAcls": true,
          "RestrictPublicBuckets": true
        },
        "LifecycleConfiguration": {
          "Rules": [
            {
              "Id": "DeleteOldVersions",
              "Status": "Enabled",
              "NoncurrentVersionExpirationInDays": 90
            }
          ]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "${ProjectName}-S3-Bucket" }
          },
          {
            "Key": "Environment",
            "Value": { "Ref": "EnvironmentName" }
          },
          {
            "Key": "Project",
            "Value": { "Ref": "ProjectName" }
          }
        ]
      }
    },

    "CPUAlarmHigh1": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmDescription": "Alarm if EC2 Instance1 CPU too high",
        "AlarmName": { "Fn::Sub": "${ProjectName}-EC2-Instance1-CPUAlarm" },
        "MetricName": "CPUUtilization",
        "Namespace": "AWS/EC2",
        "Statistic": "Average",
        "Period": 300,
        "EvaluationPeriods": 2,
        "Threshold": 80,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "InstanceId",
            "Value": { "Ref": "EC2Instance1" }
          }
        ],
        "TreatMissingData": "notBreaching"
      }
    },

    "CPUAlarmHigh2": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmDescription": "Alarm if EC2 Instance2 CPU too high",
        "AlarmName": { "Fn::Sub": "${ProjectName}-EC2-Instance2-CPUAlarm" },
        "MetricName": "CPUUtilization",
        "Namespace": "AWS/EC2",
        "Statistic": "Average",
        "Period": 300,
        "EvaluationPeriods": 2,
        "Threshold": 80,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "InstanceId",
            "Value": { "Ref": "EC2Instance2" }
          }
        ],
        "TreatMissingData": "notBreaching"
      }
    },

    "DBCPUAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmDescription": "Alarm if RDS CPU too high",
        "AlarmName": { "Fn::Sub": "${ProjectName}-RDS-CPUAlarm" },
        "MetricName": "CPUUtilization",
        "Namespace": "AWS/RDS",
        "Statistic": "Average",
        "Period": 300,
        "EvaluationPeriods": 2,
        "Threshold": 75,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "DBInstanceIdentifier",
            "Value": { "Ref": "RDSInstance" }
          }
        ],
        "TreatMissingData": "notBreaching"
      }
    },

    "DBStorageAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmDescription": "Alarm if RDS free storage is too low",
        "AlarmName": { "Fn::Sub": "${ProjectName}-RDS-StorageAlarm" },
        "MetricName": "FreeStorageSpace",
        "Namespace": "AWS/RDS",
        "Statistic": "Average",
        "Period": 300,
        "EvaluationPeriods": 1,
        "Threshold": 2147483648,
        "ComparisonOperator": "LessThanThreshold",
        "Dimensions": [
          {
            "Name": "DBInstanceIdentifier",
            "Value": { "Ref": "RDSInstance" }
          }
        ],
        "TreatMissingData": "notBreaching"
      }
    }
  },

  "Outputs": {
    "VPCId": {
      "Description": "VPC ID",
      "Value": { "Ref": "VPC" },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-VPC-ID" }
      }
    },
    "PublicSubnet1Id": {
      "Description": "Public Subnet 1 ID",
      "Value": { "Ref": "PublicSubnet1" },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-PublicSubnet1-ID" }
      }
    },
    "PublicSubnet2Id": {
      "Description": "Public Subnet 2 ID",
      "Value": { "Ref": "PublicSubnet2" },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-PublicSubnet2-ID" }
      }
    },
    "PrivateSubnet1Id": {
      "Description": "Private Subnet 1 ID",
      "Value": { "Ref": "PrivateSubnet1" },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-PrivateSubnet1-ID" }
      }
    },
    "PrivateSubnet2Id": {
      "Description": "Private Subnet 2 ID",
      "Value": { "Ref": "PrivateSubnet2" },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-PrivateSubnet2-ID" }
      }
    },
    "EC2Instance1Id": {
      "Description": "EC2 Instance 1 ID",
      "Value": { "Ref": "EC2Instance1" }
    },
    "EC2Instance1PublicIP": {
      "Description": "EC2 Instance 1 Public IP",
      "Value": { "Fn::GetAtt": ["EC2Instance1", "PublicIp"] }
    },
    "EC2Instance2Id": {
      "Description": "EC2 Instance 2 ID",
      "Value": { "Ref": "EC2Instance2" }
    },
    "EC2Instance2PublicIP": {
      "Description": "EC2 Instance 2 Public IP",
      "Value": { "Fn::GetAtt": ["EC2Instance2", "PublicIp"] }
    },
    "RDSEndpoint": {
      "Description": "RDS MySQL Endpoint",
      "Value": { "Fn::GetAtt": ["RDSInstance", "Endpoint.Address"] }
    },
    "RDSPort": {
      "Description": "RDS MySQL Port",
      "Value": { "Fn::GetAtt": ["RDSInstance", "Endpoint.Port"] }
    },
    "S3BucketName": {
      "Description": "S3 Bucket Name",
      "Value": { "Ref": "S3Bucket" }
    },
    "S3BucketArn": {
      "Description": "S3 Bucket ARN",
      "Value": { "Fn::GetAtt": ["S3Bucket", "Arn"] }
    },
    "NATGatewayEIP": {
      "Description": "NAT Gateway Elastic IP",
      "Value": { "Ref": "NATGatewayEIP" }
    }
  }
}
```

## Template Features and Explanation

### **Key Components Implemented:**

1. **VPC and Networking**
   - VPC with 10.0.0.0/16 CIDR block
   - 2 public subnets (10.0.1.0/24, 10.0.2.0/24) with auto-assign public IP
   - 2 private subnets (10.0.3.0/24, 10.0.4.0/24)
   - Internet Gateway for public subnet internet access
   - NAT Gateway with Elastic IP for private subnet outbound traffic
   - Proper route tables and associations

2. **EC2 Instances**
   - Two t2.micro instances in public subnets
   - Security group restricting SSH to specific IP range
   - IAM role for CloudWatch monitoring
   - Enhanced monitoring enabled
   - CloudWatch agent installation via UserData

3. **RDS Database**
   - MySQL 8.0.35 instance in private subnets
   - Not publicly accessible (security best practice)
   - 7-day backup retention
   - Storage encryption enabled
   - Enhanced monitoring with Performance Insights
   - Security group allowing only EC2 instances on port 3306

4. **S3 Storage**
   - Versioning enabled
   - Retention policy to keep bucket on stack deletion
   - Server-side encryption (AES256)
   - Public access blocked
   - Lifecycle policy for old versions

5. **Monitoring**
   - CloudWatch alarms for EC2 CPU utilization
   - RDS CPU and storage space alarms
   - Enhanced monitoring for all resources

6. **Security Features**
   - Least privilege security groups
   - IAM roles for EC2 and RDS monitoring
   - Database credentials as parameters (NoEcho for password)
   - Encrypted storage for RDS and S3
   - Private subnets for database isolation

### **How to Deploy:**

1. Save the template as `infrastructure.json`

2. Deploy using AWS CLI:

```bash
aws cloudformation create-stack \
  --stack-name my-infrastructure \
  --template-body file://infrastructure.json \
  --parameters \
    ParameterKey=KeyPairName,ParameterValue=your-keypair \
    ParameterKey=DBMasterPassword,ParameterValue=YourSecurePassword123! \
    ParameterKey=SSHAllowedIP,ParameterValue=203.0.113.0/32 \
  --capabilities CAPABILITY_IAM \
  --region us-east-1
```

3. Monitor stack creation:

```bash
aws cloudformation describe-stacks \
  --stack-name my-infrastructure \
  --query 'Stacks[0].StackStatus'
```

### **Important Notes:**

- Replace the `SSHAllowedIP` parameter with your actual IP address for SSH access
- Ensure you have an existing EC2 key pair in the region
- The database password should be stored securely (consider using AWS Secrets Manager in production)
- The template uses the latest Amazon Linux 2 AMI
- All resources are properly tagged for cost allocation and identification
- The S3 bucket name includes the account ID to ensure uniqueness

This template provides a production-ready, secure, and scalable infrastructure foundation that follows AWS best practices.

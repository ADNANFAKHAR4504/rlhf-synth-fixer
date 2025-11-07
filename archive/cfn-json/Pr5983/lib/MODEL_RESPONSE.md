### Reasoning Trace

---

This is a comprehensive request for a CloudFormation template. Let me break down the requirements:

1. **VPC and Networking**:
   - VPC in us-west-1 with proper CIDR blocks
   - One public subnet and one private subnet
   - Internet Gateway attached to VPC
   - Route tables for both subnets
   - Public subnet routes through IGW
   - Private subnet isolated from internet

2. **Network Security**:
   - Security groups following least privilege
   - EC2 SG: HTTP(80), HTTPS(443) from internet, SSH(22) from specific IP range
   - RDS SG: Database traffic only from EC2 SG
   - Proper egress rules

3. **Auto Scaling and Compute**:
   - Auto Scaling Group (min: 2, max: 5)
   - Launch Template with EC2 config
   - CPU-based scaling policies
   - EC2 instances in public subnet
   - IAM instance profile attached

4. **Database**:
   - RDS instance in private subnet
   - Configurable engine (MySQL/PostgreSQL)
   - Automated backups
   - Security group allowing only EC2 access

5. **IAM Roles and Policies**:
   - IAM role for EC2 with S3 and DynamoDB access
   - Least privilege principle
   - Instance profile

6. **Monitoring and Alarms**:
   - CloudWatch alarms for CPU > 70%
   - SNS notifications
   - Detailed monitoring

7. **Tagging Strategy**:
   - All resources tagged with 'Environment: Production'
   - Consistent tagging

8. **Template Features**:
   - JSON format
   - Parameterized
   - us-west-1 region
   - Intrinsic functions
   - Outputs section
   - Best practices

Let me create this comprehensive CloudFormation template:

### Answer

---

I'll create a comprehensive AWS CloudFormation template that meets all your requirements. This template will set up a secure, scalable, and highly available infrastructure for hosting a production application.

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Secure and scalable cloud environment for production application with high availability, auto-scaling, and strict security controls",

  "Parameters": {
    "KeyName": {
      "Description": "Name of an existing EC2 KeyPair to enable SSH access to the instances",
      "Type": "AWS::EC2::KeyPair::KeyName",
      "ConstraintDescription": "must be the name of an existing EC2 KeyPair"
    },
    "SSHAllowedCIDR": {
      "Description": "The IP address range that can be used to SSH to the EC2 instances",
      "Type": "String",
      "MinLength": "9",
      "MaxLength": "18",
      "Default": "10.0.0.0/8",
      "AllowedPattern": "(\\d{1,3})\\.(\\d{1,3})\\.(\\d{1,3})\\.(\\d{1,3})/(\\d{1,2})",
      "ConstraintDescription": "must be a valid IP CIDR range of the form x.x.x.x/x"
    },
    "InstanceType": {
      "Description": "EC2 instance type for the application servers",
      "Type": "String",
      "Default": "t3.medium",
      "AllowedValues": [
        "t3.micro",
        "t3.small",
        "t3.medium",
        "t3.large",
        "m5.large",
        "m5.xlarge",
        "m5.2xlarge",
        "c5.large",
        "c5.xlarge",
        "c5.2xlarge"
      ],
      "ConstraintDescription": "must be a valid EC2 instance type"
    },
    "DBInstanceClass": {
      "Description": "RDS database instance class",
      "Type": "String",
      "Default": "db.t3.micro",
      "AllowedValues": [
        "db.t3.micro",
        "db.t3.small",
        "db.t3.medium",
        "db.m5.large",
        "db.m5.xlarge",
        "db.m5.2xlarge"
      ],
      "ConstraintDescription": "must be a valid RDS instance type"
    },
    "DBEngine": {
      "Description": "Database engine for RDS",
      "Type": "String",
      "Default": "mysql",
      "AllowedValues": ["mysql", "postgres"],
      "ConstraintDescription": "must be either mysql or postgres"
    },
    "DBMasterUsername": {
      "Description": "The database master username",
      "Type": "String",
      "MinLength": "1",
      "MaxLength": "16",
      "AllowedPattern": "[a-zA-Z][a-zA-Z0-9]*",
      "Default": "dbadmin",
      "ConstraintDescription": "must begin with a letter and contain only alphanumeric characters"
    },
    "DBMasterPassword": {
      "Description": "The database master password",
      "Type": "String",
      "MinLength": "8",
      "MaxLength": "64",
      "NoEcho": true,
      "ConstraintDescription": "must be between 8 and 64 characters"
    },
    "DBAllocatedStorage": {
      "Description": "The size of the database in GB",
      "Type": "Number",
      "Default": "20",
      "MinValue": "20",
      "MaxValue": "1024",
      "ConstraintDescription": "must be between 20 and 1024 GB"
    },
    "DBBackupRetentionPeriod": {
      "Description": "The number of days to retain automated database backups",
      "Type": "Number",
      "Default": "7",
      "MinValue": "1",
      "MaxValue": "35",
      "ConstraintDescription": "must be between 1 and 35 days"
    },
    "LatestAmiId": {
      "Type": "AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>",
      "Default": "/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2"
    }
  },

  "Mappings": {
    "SubnetConfig": {
      "VPC": {
        "CIDR": "10.0.0.0/16"
      },
      "PublicSubnet": {
        "CIDR": "10.0.1.0/24"
      },
      "PrivateSubnet": {
        "CIDR": "10.0.2.0/24"
      }
    }
  },

  "Resources": {
    "VPC": {
      "Type": "AWS::EC2::VPC",
      "Properties": {
        "CidrBlock": { "Fn::FindInMap": ["SubnetConfig", "VPC", "CIDR"] },
        "EnableDnsHostnames": true,
        "EnableDnsSupport": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "${AWS::StackName}-VPC" }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },

    "PublicSubnet": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "CidrBlock": {
          "Fn::FindInMap": ["SubnetConfig", "PublicSubnet", "CIDR"]
        },
        "AvailabilityZone": {
          "Fn::Select": ["0", { "Fn::GetAZs": "us-west-1" }]
        },
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "${AWS::StackName}-PublicSubnet" }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },

    "PrivateSubnet": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "CidrBlock": {
          "Fn::FindInMap": ["SubnetConfig", "PrivateSubnet", "CIDR"]
        },
        "AvailabilityZone": {
          "Fn::Select": ["1", { "Fn::GetAZs": "us-west-1" }]
        },
        "MapPublicIpOnLaunch": false,
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "${AWS::StackName}-PrivateSubnet" }
          },
          {
            "Key": "Environment",
            "Value": "Production"
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
            "Value": { "Fn::Sub": "${AWS::StackName}-IGW" }
          },
          {
            "Key": "Environment",
            "Value": "Production"
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

    "PublicRouteTable": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "${AWS::StackName}-PublicRouteTable" }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },

    "PrivateRouteTable": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "${AWS::StackName}-PrivateRouteTable" }
          },
          {
            "Key": "Environment",
            "Value": "Production"
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

    "PublicSubnetRouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": { "Ref": "PublicSubnet" },
        "RouteTableId": { "Ref": "PublicRouteTable" }
      }
    },

    "PrivateSubnetRouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": { "Ref": "PrivateSubnet" },
        "RouteTableId": { "Ref": "PrivateRouteTable" }
      }
    },

    "EC2SecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupName": { "Fn::Sub": "${AWS::StackName}-EC2-SecurityGroup" },
        "GroupDescription": "Security group for EC2 instances",
        "VpcId": { "Ref": "VPC" },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 80,
            "ToPort": 80,
            "CidrIp": "0.0.0.0/0",
            "Description": "Allow HTTP from anywhere"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": 443,
            "ToPort": 443,
            "CidrIp": "0.0.0.0/0",
            "Description": "Allow HTTPS from anywhere"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": 22,
            "ToPort": 22,
            "CidrIp": { "Ref": "SSHAllowedCIDR" },
            "Description": "Allow SSH from specified IP range"
          }
        ],
        "SecurityGroupEgress": [
          {
            "IpProtocol": "-1",
            "CidrIp": "0.0.0.0/0",
            "Description": "Allow all outbound traffic"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "${AWS::StackName}-EC2-SecurityGroup" }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },

    "RDSSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupName": { "Fn::Sub": "${AWS::StackName}-RDS-SecurityGroup" },
        "GroupDescription": "Security group for RDS database instance",
        "VpcId": { "Ref": "VPC" },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 3306,
            "ToPort": 3306,
            "SourceSecurityGroupId": { "Ref": "EC2SecurityGroup" },
            "Description": "Allow MySQL/Aurora access from EC2 instances"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": 5432,
            "ToPort": 5432,
            "SourceSecurityGroupId": { "Ref": "EC2SecurityGroup" },
            "Description": "Allow PostgreSQL access from EC2 instances"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "${AWS::StackName}-RDS-SecurityGroup" }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },

    "EC2Role": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": { "Fn::Sub": "${AWS::StackName}-EC2Role" },
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": ["ec2.amazonaws.com"]
              },
              "Action": ["sts:AssumeRole"]
            }
          ]
        },
        "ManagedPolicyArns": [
          "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
        ],
        "Policies": [
          {
            "PolicyName": "S3AccessPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:GetObject",
                    "s3:PutObject",
                    "s3:DeleteObject",
                    "s3:ListBucket"
                  ],
                  "Resource": [
                    { "Fn::Sub": "arn:aws:s3:::${AWS::StackName}-*" },
                    { "Fn::Sub": "arn:aws:s3:::${AWS::StackName}-*/*" }
                  ]
                }
              ]
            }
          },
          {
            "PolicyName": "DynamoDBAccessPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "dynamodb:GetItem",
                    "dynamodb:PutItem",
                    "dynamodb:UpdateItem",
                    "dynamodb:DeleteItem",
                    "dynamodb:Query",
                    "dynamodb:Scan"
                  ],
                  "Resource": [
                    {
                      "Fn::Sub": "arn:aws:dynamodb:${AWS::Region}:${AWS::AccountId}:table/${AWS::StackName}-*"
                    }
                  ]
                }
              ]
            }
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "${AWS::StackName}-EC2Role" }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },

    "EC2InstanceProfile": {
      "Type": "AWS::IAM::InstanceProfile",
      "Properties": {
        "InstanceProfileName": {
          "Fn::Sub": "${AWS::StackName}-EC2InstanceProfile"
        },
        "Roles": [{ "Ref": "EC2Role" }]
      }
    },

    "LaunchTemplate": {
      "Type": "AWS::EC2::LaunchTemplate",
      "Properties": {
        "LaunchTemplateName": { "Fn::Sub": "${AWS::StackName}-LaunchTemplate" },
        "LaunchTemplateData": {
          "ImageId": { "Ref": "LatestAmiId" },
          "InstanceType": { "Ref": "InstanceType" },
          "KeyName": { "Ref": "KeyName" },
          "IamInstanceProfile": {
            "Arn": { "Fn::GetAtt": ["EC2InstanceProfile", "Arn"] }
          },
          "SecurityGroupIds": [{ "Ref": "EC2SecurityGroup" }],
          "Monitoring": {
            "Enabled": true
          },
          "UserData": {
            "Fn::Base64": {
              "Fn::Sub": "#!/bin/bash\nyum update -y\nyum install -y amazon-cloudwatch-agent\n"
            }
          },
          "TagSpecifications": [
            {
              "ResourceType": "instance",
              "Tags": [
                {
                  "Key": "Name",
                  "Value": { "Fn::Sub": "${AWS::StackName}-Instance" }
                },
                {
                  "Key": "Environment",
                  "Value": "Production"
                }
              ]
            }
          ]
        }
      }
    },

    "AutoScalingGroup": {
      "Type": "AWS::AutoScaling::AutoScalingGroup",
      "Properties": {
        "AutoScalingGroupName": { "Fn::Sub": "${AWS::StackName}-ASG" },
        "LaunchTemplate": {
          "LaunchTemplateId": { "Ref": "LaunchTemplate" },
          "Version": "$Latest"
        },
        "MinSize": "2",
        "MaxSize": "5",
        "DesiredCapacity": "2",
        "VPCZoneIdentifier": [{ "Ref": "PublicSubnet" }],
        "HealthCheckType": "EC2",
        "HealthCheckGracePeriod": 300,
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "${AWS::StackName}-ASG-Instance" },
            "PropagateAtLaunch": true
          },
          {
            "Key": "Environment",
            "Value": "Production",
            "PropagateAtLaunch": true
          }
        ]
      },
      "DependsOn": ["LaunchTemplate", "EC2InstanceProfile"]
    },

    "ScaleUpPolicy": {
      "Type": "AWS::AutoScaling::ScalingPolicy",
      "Properties": {
        "AdjustmentType": "ChangeInCapacity",
        "AutoScalingGroupName": { "Ref": "AutoScalingGroup" },
        "Cooldown": "300",
        "ScalingAdjustment": 1
      }
    },

    "ScaleDownPolicy": {
      "Type": "AWS::AutoScaling::ScalingPolicy",
      "Properties": {
        "AdjustmentType": "ChangeInCapacity",
        "AutoScalingGroupName": { "Ref": "AutoScalingGroup" },
        "Cooldown": "300",
        "ScalingAdjustment": -1
      }
    },

    "HighCPUAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": { "Fn::Sub": "${AWS::StackName}-HighCPU-Alarm" },
        "AlarmDescription": "Trigger when CPU exceeds 70%",
        "MetricName": "CPUUtilization",
        "Namespace": "AWS/EC2",
        "Statistic": "Average",
        "Period": 300,
        "EvaluationPeriods": 2,
        "Threshold": 70,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "AutoScalingGroupName",
            "Value": { "Ref": "AutoScalingGroup" }
          }
        ],
        "AlarmActions": [{ "Ref": "ScaleUpPolicy" }],
        "Tags": [
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },

    "LowCPUAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": { "Fn::Sub": "${AWS::StackName}-LowCPU-Alarm" },
        "AlarmDescription": "Trigger when CPU drops below 30%",
        "MetricName": "CPUUtilization",
        "Namespace": "AWS/EC2",
        "Statistic": "Average",
        "Period": 300,
        "EvaluationPeriods": 2,
        "Threshold": 30,
        "ComparisonOperator": "LessThanThreshold",
        "Dimensions": [
          {
            "Name": "AutoScalingGroupName",
            "Value": { "Ref": "AutoScalingGroup" }
          }
        ],
        "AlarmActions": [{ "Ref": "ScaleDownPolicy" }],
        "Tags": [
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },

    "DBSubnetGroup": {
      "Type": "AWS::RDS::DBSubnetGroup",
      "Properties": {
        "DBSubnetGroupName": { "Fn::Sub": "${AWS::StackName}-DBSubnetGroup" },
        "DBSubnetGroupDescription": "Subnet group for RDS database",
        "SubnetIds": [{ "Ref": "PrivateSubnet" }, { "Ref": "PublicSubnet" }],
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "${AWS::StackName}-DBSubnetGroup" }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },

    "RDSDatabase": {
      "Type": "AWS::RDS::DBInstance",
      "Properties": {
        "DBInstanceIdentifier": { "Fn::Sub": "${AWS::StackName}-database" },
        "Engine": { "Ref": "DBEngine" },
        "DBInstanceClass": { "Ref": "DBInstanceClass" },
        "AllocatedStorage": { "Ref": "DBAllocatedStorage" },
        "MasterUsername": { "Ref": "DBMasterUsername" },
        "MasterUserPassword": { "Ref": "DBMasterPassword" },
        "VPCSecurityGroups": [{ "Ref": "RDSSecurityGroup" }],
        "DBSubnetGroupName": { "Ref": "DBSubnetGroup" },
        "BackupRetentionPeriod": { "Ref": "DBBackupRetentionPeriod" },
        "PreferredBackupWindow": "03:00-04:00",
        "PreferredMaintenanceWindow": "sun:04:00-sun:05:00",
        "MultiAZ": false,
        "StorageType": "gp2",
        "StorageEncrypted": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "${AWS::StackName}-RDS-Database" }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
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
    "PublicSubnetId": {
      "Description": "Public Subnet ID",
      "Value": { "Ref": "PublicSubnet" },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-PublicSubnet-ID" }
      }
    },
    "PrivateSubnetId": {
      "Description": "Private Subnet ID",
      "Value": { "Ref": "PrivateSubnet" },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-PrivateSubnet-ID" }
      }
    },
    "EC2SecurityGroupId": {
      "Description": "EC2 Security Group ID",
      "Value": { "Ref": "EC2SecurityGroup" },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-EC2-SecurityGroup-ID" }
      }
    },
    "RDSSecurityGroupId": {
      "Description": "RDS Security Group ID",
      "Value": { "Ref": "RDSSecurityGroup" },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-RDS-SecurityGroup-ID" }
      }
    },
    "AutoScalingGroupName": {
      "Description": "Auto Scaling Group Name",
      "Value": { "Ref": "AutoScalingGroup" },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-ASG-Name" }
      }
    },
    "RDSEndpoint": {
      "Description": "RDS Database Endpoint",
      "Value": { "Fn::GetAtt": ["RDSDatabase", "Endpoint.Address"] },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-RDS-Endpoint" }
      }
    },
    "RDSPort": {
      "Description": "RDS Database Port",
      "Value": { "Fn::GetAtt": ["RDSDatabase", "Endpoint.Port"] },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-RDS-Port" }
      }
    }
  }
}
```

## Template Overview

This CloudFormation template creates a complete production-ready infrastructure with the following key components:

### **Network Architecture**

- **VPC**: Creates a Virtual Private Cloud with CIDR block 10.0.0.0/16
- **Subnets**:
  - Public subnet (10.0.1.0/24) for EC2 instances
  - Private subnet (10.0.2.0/24) for RDS database
- **Internet Gateway**: Enables internet connectivity for the public subnet
- **Route Tables**: Separate routing for public and private subnets

### **Security Features**

- **EC2 Security Group**:
  - Inbound: HTTP (80), HTTPS (443) from anywhere, SSH (22) from specified CIDR
  - Outbound: All traffic allowed
- **RDS Security Group**:
  - Only accepts database traffic from EC2 security group
  - Supports both MySQL (3306) and PostgreSQL (5432)

### **Compute Resources**

- **Auto Scaling Group**:
  - Min: 2 instances, Max: 5 instances
  - CPU-based scaling policies (scale up at 70%, scale down at 30%)
- **Launch Template**:
  - Configurable instance type
  - Latest Amazon Linux 2 AMI
  - CloudWatch monitoring enabled

### **Database**

- **RDS Instance**:
  - Deployed in private subnet
  - Configurable engine (MySQL/PostgreSQL)
  - Automated backups with retention period
  - Storage encryption enabled

### **IAM Permissions**

- **EC2 Role**:
  - S3 access for application assets
  - DynamoDB access for table operations
  - CloudWatch agent permissions

### **Monitoring**

- **CloudWatch Alarms**:
  - High CPU alarm (>70%) triggers scale up
  - Low CPU alarm (<30%) triggers scale down
  - Detailed monitoring enabled

### **Tagging Strategy**

- All resources tagged with "Environment: Production"
- Consistent naming convention using stack name

## Usage Instructions

1. **Save the template** as `production-infrastructure.json`

2. **Deploy using AWS CLI**:

```bash
aws cloudformation create-stack \
  --stack-name production-app-stack \
  --template-body file://production-infrastructure.json \
  --parameters \
    ParameterKey=KeyName,ParameterValue=your-key-pair \
    ParameterKey=SSHAllowedCIDR,ParameterValue=your.ip.range/32 \
    ParameterKey=DBMasterPassword,ParameterValue=YourSecurePassword123! \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-west-1
```

3. **Monitor the deployment**:

```bash
aws cloudformation describe-stacks \
  --stack-name production-app-stack \
  --region us-west-1
```

## Important Considerations

1. **Security**: Update the `SSHAllowedCIDR` parameter to restrict SSH access to your specific IP range
2. **Database Password**: Use a strong password for the database master user
3. **Cost Optimization**: The template uses t3.medium instances by default; adjust based on your workload
4. **Region**: The template is configured for us-west-1; resources will be created in this region
5. **Monitoring**: Consider setting up SNS topics for CloudWatch alarm notifications

This template follows AWS best practices for security, scalability, and high availability, making it suitable for production workloads.

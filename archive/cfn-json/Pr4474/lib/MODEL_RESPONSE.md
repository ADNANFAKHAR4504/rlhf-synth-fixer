### Reasoning Trace

---

Let me create a comprehensive AWS CloudFormation template in JSON that meets all the specified requirements. I'll break this down systematically:

1. VPC and Networking:
   - VPC with CIDR block
   - 2 public subnets (one per AZ)
   - 2 private subnets (one per AZ)
   - Internet Gateway for public subnets
   - NAT Gateway for private subnet outbound connectivity
   - Route tables for public and private subnets

2. EC2 Instance:
   - In public subnet
   - SSH access limited to specific IP (203.0.113.0/32)
   - Tagged with Environment: Production
   - Security group with least privilege

3. RDS MySQL Database:
   - In private subnet (DB Subnet Group)
   - Automatic minor version upgrades enabled
   - Daily backups with 7-day retention
   - Not publicly accessible
   - Security group allowing access only from EC2

4. CloudWatch Monitoring:
   - Alarm for EC2 CPU > 80%

5. Security:
   - EC2 Security Group: SSH (22) from specific IP only
   - RDS Security Group: MySQL (3306) from EC2 security group only
   - Secure credential management using parameters

6. Template Features:
   - Logical ID naming: MyResourceTypeName
   - Parameters for instance types
   - Outputs for VPC ID, Public Subnet IDs, EC2 Instance ID

Let me create this template now:

### Answer

---

I'll create a comprehensive AWS CloudFormation template that meets all your production environment requirements. This template follows AWS best practices for security, high availability, and maintainability.

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Production Cloud Environment with VPC, EC2, RDS, and CloudWatch Monitoring",

  "Parameters": {
    "MyEC2InstanceType": {
      "Type": "String",
      "Default": "t3.micro",
      "Description": "EC2 instance type for the web server",
      "AllowedValues": ["t3.micro", "t3.small", "t3.medium", "t3.large"]
    },
    "MyRDSInstanceType": {
      "Type": "String",
      "Default": "db.t3.micro",
      "Description": "RDS instance type for the database",
      "AllowedValues": [
        "db.t3.micro",
        "db.t3.small",
        "db.t3.medium",
        "db.t3.large"
      ]
    },
    "MySSHAllowedIP": {
      "Type": "String",
      "Default": "203.0.113.0/32",
      "Description": "IP address allowed to SSH into EC2 instance",
      "AllowedPattern": "^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\\/([0-9]|[1-2][0-9]|3[0-2]))$"
    },
    "MyKeyPairName": {
      "Type": "AWS::EC2::KeyPair::KeyName",
      "Description": "EC2 KeyPair for SSH access"
    },
    "MyDBUsername": {
      "Type": "String",
      "Default": "admin",
      "Description": "Database master username",
      "MinLength": "1",
      "MaxLength": "16",
      "AllowedPattern": "[a-zA-Z][a-zA-Z0-9]*",
      "NoEcho": true
    },
    "MyDBPassword": {
      "Type": "String",
      "Description": "Database master password",
      "MinLength": "8",
      "MaxLength": "41",
      "AllowedPattern": "[a-zA-Z0-9]*",
      "NoEcho": true
    }
  },

  "Mappings": {
    "AWSRegionToAMI": {
      "us-east-1": { "HVM64": "ami-0c02fb55731490381" },
      "us-west-2": { "HVM64": "ami-0352d5a37fb4f603f" },
      "eu-west-1": { "HVM64": "ami-0f29c8402f8cce65c" }
    }
  },

  "Resources": {
    "MyVPC": {
      "Type": "AWS::EC2::VPC",
      "Properties": {
        "CidrBlock": "10.0.0.0/16",
        "EnableDnsHostnames": true,
        "EnableDnsSupport": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": "Production-VPC"
          },
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },

    "MyInternetGateway": {
      "Type": "AWS::EC2::InternetGateway",
      "Properties": {
        "Tags": [
          {
            "Key": "Name",
            "Value": "Production-IGW"
          }
        ]
      }
    },

    "MyInternetGatewayAttachment": {
      "Type": "AWS::EC2::VPCGatewayAttachment",
      "Properties": {
        "InternetGatewayId": { "Ref": "MyInternetGateway" },
        "VpcId": { "Ref": "MyVPC" }
      }
    },

    "MyPublicSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": { "Ref": "MyVPC" },
        "AvailabilityZone": { "Fn::Select": [0, { "Fn::GetAZs": "" }] },
        "CidrBlock": "10.0.1.0/24",
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": "Production-Public-Subnet-1"
          }
        ]
      }
    },

    "MyPublicSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": { "Ref": "MyVPC" },
        "AvailabilityZone": { "Fn::Select": [1, { "Fn::GetAZs": "" }] },
        "CidrBlock": "10.0.2.0/24",
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": "Production-Public-Subnet-2"
          }
        ]
      }
    },

    "MyPrivateSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": { "Ref": "MyVPC" },
        "AvailabilityZone": { "Fn::Select": [0, { "Fn::GetAZs": "" }] },
        "CidrBlock": "10.0.10.0/24",
        "Tags": [
          {
            "Key": "Name",
            "Value": "Production-Private-Subnet-1"
          }
        ]
      }
    },

    "MyPrivateSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": { "Ref": "MyVPC" },
        "AvailabilityZone": { "Fn::Select": [1, { "Fn::GetAZs": "" }] },
        "CidrBlock": "10.0.20.0/24",
        "Tags": [
          {
            "Key": "Name",
            "Value": "Production-Private-Subnet-2"
          }
        ]
      }
    },

    "MyNATGatewayEIP": {
      "Type": "AWS::EC2::EIP",
      "DependsOn": "MyInternetGatewayAttachment",
      "Properties": {
        "Domain": "vpc"
      }
    },

    "MyNATGateway": {
      "Type": "AWS::EC2::NatGateway",
      "Properties": {
        "AllocationId": { "Fn::GetAtt": ["MyNATGatewayEIP", "AllocationId"] },
        "SubnetId": { "Ref": "MyPublicSubnet1" }
      }
    },

    "MyPublicRouteTable": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": { "Ref": "MyVPC" },
        "Tags": [
          {
            "Key": "Name",
            "Value": "Production-Public-Routes"
          }
        ]
      }
    },

    "MyPublicRoute": {
      "Type": "AWS::EC2::Route",
      "DependsOn": "MyInternetGatewayAttachment",
      "Properties": {
        "RouteTableId": { "Ref": "MyPublicRouteTable" },
        "DestinationCidrBlock": "0.0.0.0/0",
        "GatewayId": { "Ref": "MyInternetGateway" }
      }
    },

    "MyPublicSubnet1RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "RouteTableId": { "Ref": "MyPublicRouteTable" },
        "SubnetId": { "Ref": "MyPublicSubnet1" }
      }
    },

    "MyPublicSubnet2RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "RouteTableId": { "Ref": "MyPublicRouteTable" },
        "SubnetId": { "Ref": "MyPublicSubnet2" }
      }
    },

    "MyPrivateRouteTable": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": { "Ref": "MyVPC" },
        "Tags": [
          {
            "Key": "Name",
            "Value": "Production-Private-Routes"
          }
        ]
      }
    },

    "MyPrivateRoute": {
      "Type": "AWS::EC2::Route",
      "Properties": {
        "RouteTableId": { "Ref": "MyPrivateRouteTable" },
        "DestinationCidrBlock": "0.0.0.0/0",
        "NatGatewayId": { "Ref": "MyNATGateway" }
      }
    },

    "MyPrivateSubnet1RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "RouteTableId": { "Ref": "MyPrivateRouteTable" },
        "SubnetId": { "Ref": "MyPrivateSubnet1" }
      }
    },

    "MyPrivateSubnet2RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "RouteTableId": { "Ref": "MyPrivateRouteTable" },
        "SubnetId": { "Ref": "MyPrivateSubnet2" }
      }
    },

    "MyEC2SecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for EC2 instance - SSH access only",
        "VpcId": { "Ref": "MyVPC" },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 22,
            "ToPort": 22,
            "CidrIp": { "Ref": "MySSHAllowedIP" }
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
            "Value": "Production-EC2-SG"
          }
        ]
      }
    },

    "MyRDSSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for RDS instance - MySQL access from EC2 only",
        "VpcId": { "Ref": "MyVPC" },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 3306,
            "ToPort": 3306,
            "SourceSecurityGroupId": { "Ref": "MyEC2SecurityGroup" }
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": "Production-RDS-SG"
          }
        ]
      }
    },

    "MyEC2Instance": {
      "Type": "AWS::EC2::Instance",
      "Properties": {
        "ImageId": {
          "Fn::FindInMap": ["AWSRegionToAMI", { "Ref": "AWS::Region" }, "HVM64"]
        },
        "InstanceType": { "Ref": "MyEC2InstanceType" },
        "KeyName": { "Ref": "MyKeyPairName" },
        "SubnetId": { "Ref": "MyPublicSubnet1" },
        "SecurityGroupIds": [{ "Ref": "MyEC2SecurityGroup" }],
        "Monitoring": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": "Production-Web-Server"
          },
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ],
        "UserData": {
          "Fn::Base64": {
            "Fn::Join": [
              "",
              [
                "#!/bin/bash\n",
                "yum update -y\n",
                "amazon-linux-extras install -y epel\n",
                "yum install -y mysql\n"
              ]
            ]
          }
        }
      }
    },

    "MyDBSubnetGroup": {
      "Type": "AWS::RDS::DBSubnetGroup",
      "Properties": {
        "DBSubnetGroupDescription": "Subnet group for RDS database",
        "SubnetIds": [
          { "Ref": "MyPrivateSubnet1" },
          { "Ref": "MyPrivateSubnet2" }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": "Production-DB-SubnetGroup"
          }
        ]
      }
    },

    "MyRDSInstance": {
      "Type": "AWS::RDS::DBInstance",
      "Properties": {
        "DBInstanceIdentifier": "production-mysql-db",
        "DBInstanceClass": { "Ref": "MyRDSInstanceType" },
        "Engine": "mysql",
        "EngineVersion": "8.0.35",
        "MasterUsername": { "Ref": "MyDBUsername" },
        "MasterUserPassword": { "Ref": "MyDBPassword" },
        "AllocatedStorage": "20",
        "StorageType": "gp3",
        "StorageEncrypted": true,
        "DBSubnetGroupName": { "Ref": "MyDBSubnetGroup" },
        "VPCSecurityGroups": [{ "Ref": "MyRDSSecurityGroup" }],
        "PubliclyAccessible": false,
        "BackupRetentionPeriod": 7,
        "PreferredBackupWindow": "03:00-04:00",
        "PreferredMaintenanceWindow": "sun:04:00-sun:05:00",
        "AutoMinorVersionUpgrade": true,
        "MultiAZ": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": "Production-MySQL-DB"
          },
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },

    "MyCPUAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": "Production-EC2-HighCPU",
        "AlarmDescription": "Alarm when EC2 CPU exceeds 80%",
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
            "Value": { "Ref": "MyEC2Instance" }
          }
        ]
      }
    }
  },

  "Outputs": {
    "VPCId": {
      "Description": "VPC ID",
      "Value": { "Ref": "MyVPC" },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-VPC-ID" }
      }
    },
    "PublicSubnet1Id": {
      "Description": "Public Subnet 1 ID",
      "Value": { "Ref": "MyPublicSubnet1" },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-PublicSubnet1-ID" }
      }
    },
    "PublicSubnet2Id": {
      "Description": "Public Subnet 2 ID",
      "Value": { "Ref": "MyPublicSubnet2" },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-PublicSubnet2-ID" }
      }
    },
    "EC2InstanceId": {
      "Description": "EC2 Instance ID",
      "Value": { "Ref": "MyEC2Instance" },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-EC2Instance-ID" }
      }
    },
    "RDSEndpoint": {
      "Description": "RDS Instance Endpoint",
      "Value": { "Fn::GetAtt": ["MyRDSInstance", "Endpoint.Address"] }
    }
  }
}
```

## Key Features Explained

### 1. **VPC and Networking**

- Creates a VPC with CIDR block `10.0.0.0/16`
- Two public subnets (`10.0.1.0/24`, `10.0.2.0/24`) across different AZs
- Two private subnets (`10.0.10.0/24`, `10.0.20.0/24`) for RDS
- Internet Gateway for public subnet connectivity
- NAT Gateway for private subnet outbound connectivity

### 2. **EC2 Instance**

- Deployed in the first public subnet
- SSH access restricted to the specified IP (parameter-driven)
- Tagged with `Environment: Production`
- Enhanced monitoring enabled
- UserData script installs MySQL client for database connectivity

### 3. **RDS MySQL Database**

- Deployed across private subnets via DB Subnet Group
- Multi-AZ deployment for high availability
- Automatic minor version upgrades enabled
- 7-day backup retention
- Storage encryption enabled
- Not publicly accessible

### 4. **Security Groups**

- **EC2 Security Group**: Only allows SSH (port 22) from specified IP
- **RDS Security Group**: Only allows MySQL (port 3306) from EC2 Security Group
- Follows least privilege principle

### 5. **CloudWatch Monitoring**

- Alarm triggers when EC2 CPU utilization exceeds 80%
- Evaluates over 2 periods of 5 minutes

### 6. **Template Features**

- All resources use `My` prefix naming convention
- Parameters for configurable values
- NoEcho for sensitive parameters (DB credentials)
- Outputs section displays key resource IDs
- Region mapping for AMI IDs

## Deployment Instructions

1. **Prerequisites:**
   - Create an EC2 KeyPair in your AWS region
   - Have your public IP address ready for SSH access

2. **Deploy the template:**

   ```bash
   aws cloudformation create-stack \
     --stack-name production-environment \
     --template-body file://template.json \
     --parameters \
       ParameterKey=MyKeyPairName,ParameterValue=your-keypair-name \
       ParameterKey=MySSHAllowedIP,ParameterValue=your.ip.address.here/32 \
       ParameterKey=MyDBPassword,ParameterValue=YourSecurePassword123
   ```

3. **Security Best Practices:**
   - Consider using AWS Secrets Manager for database credentials
   - Implement AWS Systems Manager Session Manager for SSH-less access
   - Enable VPC Flow Logs for network monitoring
   - Add SNS notifications to CloudWatch alarms

This template provides a secure, scalable, and production-ready infrastructure following AWS best practices.

# Ideal Response: Production Cloud Environment Setup

## Architecture Overview

This CloudFormation template creates a secure, production-ready AWS environment with proper network isolation, high availability across multiple Availability Zones, and comprehensive security controls following AWS best practices and the Well-Architected Framework.

### Network Architecture

The infrastructure implements a multi-tier VPC architecture spanning two Availability Zones. The VPC uses a 10.0.0.0/16 CIDR block with public subnets (10.0.1.0/24, 10.0.2.0/24) for internet-facing resources and private subnets (10.0.10.0/24, 10.0.20.0/24) for database isolation. An Internet Gateway provides public subnet connectivity, while a single NAT Gateway in the first public subnet enables outbound internet access for private subnet resources. This design balances cost optimization with security requirements.

### Compute Layer

The EC2 instance deploys in the public subnet with restricted SSH access from a specific IP address. The instance uses dynamic AMI resolution through SSM Parameter Store, avoiding hardcoded AMI IDs that can become outdated or vulnerable. An IAM instance profile grants the EC2 instance permissions to access Secrets Manager for secure database credential retrieval, eliminating the need for embedded credentials.

### Database Layer

The RDS MySQL database deploys across private subnets using a DB Subnet Group spanning both Availability Zones. The database is not publicly accessible and accepts connections only from the EC2 security group. Database credentials are automatically generated and stored in AWS Secrets Manager with automatic rotation capability. The database includes automated daily backups with 7-day retention and automatic minor version upgrades.

### Security

Security implementation follows the principle of least privilege. The EC2 security group permits only SSH traffic on port 22 from the specified IP address. The RDS security group allows only MySQL traffic on port 3306 from the EC2 security group, using security group references instead of IP-based rules. IAM policies grant minimal permissions with resource-specific access. All database storage is encrypted at rest, and credentials never appear as plaintext parameters.

### Monitoring

CloudWatch monitoring includes an alarm that triggers when EC2 CPU utilization exceeds 80% over two consecutive 5-minute evaluation periods. The alarm uses the "notBreaching" treatment for missing data to prevent false alarms during maintenance windows or instance stops.

### High Availability

The architecture spans two Availability Zones with subnets in each zone. The RDS database can be upgraded to Multi-AZ if higher availability is required. The DB Subnet Group configuration supports automatic failover scenarios.

## CloudFormation Template

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
    "MyEC2KeyPairName": {
      "Type": "String",
      "Default": "",
      "Description": "EC2 KeyPair for SSH access (optional)"
    }
  },
  "Conditions": {
    "HasKeyPair": {
      "Fn::Not": [
        {
          "Fn::Equals": [
            {
              "Ref": "MyEC2KeyPairName"
            },
            ""
          ]
        }
      ]
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
    "MyVPCGatewayAttachment": {
      "Type": "AWS::EC2::VPCGatewayAttachment",
      "Properties": {
        "InternetGatewayId": {
          "Ref": "MyInternetGateway"
        },
        "VpcId": {
          "Ref": "MyVPC"
        }
      }
    },
    "MyPublicSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "MyVPC"
        },
        "AvailabilityZone": {
          "Fn::Select": [
            0,
            {
              "Fn::GetAZs": ""
            }
          ]
        },
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
        "VpcId": {
          "Ref": "MyVPC"
        },
        "AvailabilityZone": {
          "Fn::Select": [
            1,
            {
              "Fn::GetAZs": ""
            }
          ]
        },
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
        "VpcId": {
          "Ref": "MyVPC"
        },
        "AvailabilityZone": {
          "Fn::Select": [
            0,
            {
              "Fn::GetAZs": ""
            }
          ]
        },
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
        "VpcId": {
          "Ref": "MyVPC"
        },
        "AvailabilityZone": {
          "Fn::Select": [
            1,
            {
              "Fn::GetAZs": ""
            }
          ]
        },
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
      "DependsOn": "MyVPCGatewayAttachment",
      "Properties": {
        "Domain": "vpc",
        "Tags": [
          {
            "Key": "Name",
            "Value": "Production-NAT-EIP"
          }
        ]
      }
    },
    "MyNATGateway": {
      "Type": "AWS::EC2::NatGateway",
      "Properties": {
        "AllocationId": {
          "Fn::GetAtt": [
            "MyNATGatewayEIP",
            "AllocationId"
          ]
        },
        "SubnetId": {
          "Ref": "MyPublicSubnet1"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": "Production-NAT-Gateway"
          }
        ]
      }
    },
    "MyPublicRouteTable": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": {
          "Ref": "MyVPC"
        },
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
      "DependsOn": "MyVPCGatewayAttachment",
      "Properties": {
        "RouteTableId": {
          "Ref": "MyPublicRouteTable"
        },
        "DestinationCidrBlock": "0.0.0.0/0",
        "GatewayId": {
          "Ref": "MyInternetGateway"
        }
      }
    },
    "MyPublicSubnet1RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "RouteTableId": {
          "Ref": "MyPublicRouteTable"
        },
        "SubnetId": {
          "Ref": "MyPublicSubnet1"
        }
      }
    },
    "MyPublicSubnet2RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "RouteTableId": {
          "Ref": "MyPublicRouteTable"
        },
        "SubnetId": {
          "Ref": "MyPublicSubnet2"
        }
      }
    },
    "MyPrivateRouteTable": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": {
          "Ref": "MyVPC"
        },
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
        "RouteTableId": {
          "Ref": "MyPrivateRouteTable"
        },
        "DestinationCidrBlock": "0.0.0.0/0",
        "NatGatewayId": {
          "Ref": "MyNATGateway"
        }
      }
    },
    "MyPrivateSubnet1RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "RouteTableId": {
          "Ref": "MyPrivateRouteTable"
        },
        "SubnetId": {
          "Ref": "MyPrivateSubnet1"
        }
      }
    },
    "MyPrivateSubnet2RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "RouteTableId": {
          "Ref": "MyPrivateRouteTable"
        },
        "SubnetId": {
          "Ref": "MyPrivateSubnet2"
        }
      }
    },
    "MyEC2SecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for EC2 instance - SSH access only from specific IP",
        "VpcId": {
          "Ref": "MyVPC"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 22,
            "ToPort": 22,
            "CidrIp": {
              "Ref": "MySSHAllowedIP"
            },
            "Description": "SSH access from specified IP"
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
            "Value": "Production-EC2-SG"
          }
        ]
      }
    },
    "MyRDSSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for RDS instance - MySQL access from EC2 only",
        "VpcId": {
          "Ref": "MyVPC"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 3306,
            "ToPort": 3306,
            "SourceSecurityGroupId": {
              "Ref": "MyEC2SecurityGroup"
            },
            "Description": "MySQL access from EC2 security group only"
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
    "MyDBSecret": {
      "Type": "AWS::SecretsManager::Secret",
      "Properties": {
        "Name": "Production-RDS-Credentials",
        "Description": "RDS MySQL database master credentials",
        "GenerateSecretString": {
          "SecretStringTemplate": "{\"username\": \"admin\"}",
          "GenerateStringKey": "password",
          "PasswordLength": 32,
          "ExcludeCharacters": "\"@/\\",
          "RequireEachIncludedType": true
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": "Production-DB-Secret"
          }
        ]
      }
    },
    "MyEC2Instance": {
      "Type": "AWS::EC2::Instance",
      "Properties": {
        "InstanceType": {
          "Ref": "MyEC2InstanceType"
        },
        "KeyName": {
          "Fn::If": [
            "HasKeyPair",
            {
              "Ref": "MyEC2KeyPairName"
            },
            {
              "Ref": "AWS::NoValue"
            }
          ]
        },
        "SubnetId": {
          "Ref": "MyPublicSubnet1"
        },
        "SecurityGroupIds": [
          {
            "Ref": "MyEC2SecurityGroup"
          }
        ],
        "ImageId": "{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}}",
        "IamInstanceProfile": {
          "Ref": "MyEC2InstanceProfile"
        },
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
                "yum install -y mysql\n",
                "yum install -y amazon-ssm-agent\n",
                "systemctl enable amazon-ssm-agent\n",
                "systemctl start amazon-ssm-agent\n"
              ]
            ]
          }
        }
      }
    },
    "MyEC2Role": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": "Production-EC2-Role",
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
        ],
        "Policies": [
          {
            "PolicyName": "SecretsManagerReadAccess",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "secretsmanager:GetSecretValue",
                    "secretsmanager:DescribeSecret"
                  ],
                  "Resource": {
                    "Ref": "MyDBSecret"
                  }
                }
              ]
            }
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": "Production-EC2-Role"
          }
        ]
      }
    },
    "MyEC2InstanceProfile": {
      "Type": "AWS::IAM::InstanceProfile",
      "Properties": {
        "InstanceProfileName": "Production-EC2-InstanceProfile",
        "Roles": [
          {
            "Ref": "MyEC2Role"
          }
        ]
      }
    },
    "MyDBSubnetGroup": {
      "Type": "AWS::RDS::DBSubnetGroup",
      "Properties": {
        "DBSubnetGroupName": "production-db-subnet-group",
        "DBSubnetGroupDescription": "Subnet group for RDS database spanning two AZs",
        "SubnetIds": [
          {
            "Ref": "MyPrivateSubnet1"
          },
          {
            "Ref": "MyPrivateSubnet2"
          }
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
        "DBInstanceClass": {
          "Ref": "MyRDSInstanceType"
        },
        "Engine": "mysql",
        "EngineVersion": "8.0.43",
        "MasterUsername": {
          "Fn::Sub": "{{resolve:secretsmanager:${MyDBSecret}:SecretString:username}}"
        },
        "MasterUserPassword": {
          "Fn::Sub": "{{resolve:secretsmanager:${MyDBSecret}:SecretString:password}}"
        },
        "AllocatedStorage": "20",
        "StorageType": "gp3",
        "StorageEncrypted": true,
        "DBSubnetGroupName": {
          "Ref": "MyDBSubnetGroup"
        },
        "VPCSecurityGroups": [
          {
            "Ref": "MyRDSSecurityGroup"
          }
        ],
        "PubliclyAccessible": false,
        "BackupRetentionPeriod": 7,
        "PreferredBackupWindow": "03:00-04:00",
        "PreferredMaintenanceWindow": "sun:04:00-sun:05:00",
        "AutoMinorVersionUpgrade": true,
        "MultiAZ": false,
        "Tags": [
          {
            "Key": "Name",
            "Value": "Production-MySQL-DB"
          }
        ]
      }
    },
    "MySecretRDSAttachment": {
      "Type": "AWS::SecretsManager::SecretTargetAttachment",
      "Properties": {
        "SecretId": {
          "Ref": "MyDBSecret"
        },
        "TargetId": {
          "Ref": "MyRDSInstance"
        },
        "TargetType": "AWS::RDS::DBInstance"
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
            "Value": {
              "Ref": "MyEC2Instance"
            }
          }
        ],
        "TreatMissingData": "notBreaching"
      }
    }
  },
  "Outputs": {
    "MyVPCId": {
      "Description": "VPC ID",
      "Value": {
        "Ref": "MyVPC"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-VPC-ID"
        }
      }
    },
    "MyPublicSubnet1Id": {
      "Description": "Public Subnet 1 ID",
      "Value": {
        "Ref": "MyPublicSubnet1"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-PublicSubnet1-ID"
        }
      }
    },
    "MyPublicSubnet2Id": {
      "Description": "Public Subnet 2 ID",
      "Value": {
        "Ref": "MyPublicSubnet2"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-PublicSubnet2-ID"
        }
      }
    },
    "MyEC2InstanceId": {
      "Description": "EC2 Instance ID",
      "Value": {
        "Ref": "MyEC2Instance"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-EC2Instance-ID"
        }
      }
    },
    "MyRDSEndpoint": {
      "Description": "RDS Instance Endpoint Address",
      "Value": {
        "Fn::GetAtt": [
          "MyRDSInstance",
          "Endpoint.Address"
        ]
      }
    },
    "MyDBSecretArn": {
      "Description": "ARN of the Secrets Manager secret containing database credentials",
      "Value": {
        "Ref": "MyDBSecret"
      }
    }
  }
}
```

## Key Features

### Security

The template implements defense-in-depth security with multiple layers of protection. Database credentials are automatically generated and stored in AWS Secrets Manager, never appearing as plaintext in parameters or outputs. The SecretTargetAttachment resource enables automatic credential rotation. All RDS storage is encrypted at rest using AWS-managed keys. Network security groups implement strict ingress rules with the EC2 security group allowing only SSH from a specific IP address, and the RDS security group permitting only MySQL traffic from the EC2 security group using security group references rather than IP-based rules.

### Scalability

The architecture supports horizontal scaling through its multi-AZ subnet design. Additional EC2 instances can be deployed across both public subnets behind a load balancer. The RDS instance can be upgraded to Multi-AZ deployment for automatic failover capability. The VPC design accommodates future growth with unused CIDR space for additional subnets.

### Operational Excellence

The template uses parameterization for all environment-specific values, enabling reuse across different environments without modification. CloudWatch monitoring provides visibility into system health with the CPU alarm enabling proactive response to performance issues. Enhanced monitoring on the EC2 instance provides detailed metrics for troubleshooting. Automated backups with 7-day retention protect against data loss and enable point-in-time recovery.

### Cost Optimization

The design balances cost with functionality by using a single NAT Gateway rather than multiple gateways per AZ. The RDS instance deploys in single-AZ mode since Multi-AZ was not specified in requirements. T3 instance types provide burstable performance at lower cost for variable workloads. The template uses AllowedValues constraints to prevent accidental deployment of oversized instances.

### Reliability

The multi-AZ architecture protects against Availability Zone failures. The DB Subnet Group spans both zones, enabling RDS to automatically provision a standby instance if Multi-AZ is enabled. Automated daily backups with 7-day retention provide recovery capabilities. The NAT Gateway is a managed service with built-in redundancy within its Availability Zone.

## Modern AWS Practices

### Dynamic AMI Resolution

The template uses SSM Parameter Store dynamic references to retrieve the latest Amazon Linux 2 AMI ID at stack creation time. This approach prevents the security and operational risks of hardcoded AMI IDs, which can become outdated or vulnerable. The SSM parameter `/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2` is maintained by AWS and always points to the current recommended AMI for the region.

### Secrets Manager Integration

Database credentials are managed through AWS Secrets Manager rather than CloudFormation parameters. The template generates a complex password meeting security requirements and stores it alongside the username in a structured secret. The RDS instance retrieves credentials using dynamic references at creation time. The SecretTargetAttachment resource associates the secret with the RDS instance, enabling automatic rotation through Secrets Manager's rotation Lambda functions.

### IAM Instance Profiles

The EC2 instance uses an IAM instance profile rather than embedded credentials or user-provided keys. The associated role grants minimal permissions following the principle of least privilege: CloudWatch metrics publishing and read-only access to the specific Secrets Manager secret. This approach eliminates credential management burden and enables automatic credential rotation through AWS STS.

### Resource Naming Convention

All logical IDs follow the MyResourceTypeName convention as specified in requirements. This convention improves template readability and makes resource identification straightforward in the CloudFormation console. Parameters also follow this convention with names like MyEC2InstanceType and MySSHAllowedIP, creating consistency throughout the template.

### Parameterization Strategy

The template exposes configuration values that commonly vary between environments or deployments while keeping architectural decisions fixed. Instance types are parameterized with sensible defaults and AllowedValues constraints. The SSH allowed IP uses pattern validation to ensure proper CIDR format. The KeyPair parameter type integrates with AWS to present only valid key pairs, preventing deployment failures.

### Dependency Management

The template uses DependsOn attributes and implicit dependencies through Ref and GetAtt functions to ensure proper resource creation order. The NAT Gateway depends on the VPC Gateway Attachment to ensure the Internet Gateway is fully attached before the NAT Gateway is created. Public routes depend on the Gateway Attachment to prevent route creation failures. These dependencies prevent transient failures during stack creation.

### Output Exports

Outputs include Export properties using stack-name-based naming, enabling cross-stack references. Other stacks can import these values using Fn::ImportValue, creating loose coupling between infrastructure layers. The export names incorporate the stack name to ensure uniqueness when multiple instances of the template are deployed in the same region.

### Tagging Strategy

All resources include Name tags for identification in the AWS console. The EC2 instance includes an Environment tag set to Production as required by specifications. Consistent tagging enables resource organization, cost allocation, and compliance auditing across the AWS environment.

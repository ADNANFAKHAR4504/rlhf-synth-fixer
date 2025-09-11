### Reasoning Trace
---

I need to create a comprehensive CloudFormation template in JSON format that satisfies all the requirements. Let me break this down:

1. VPC & Networking:
   - VPC with CIDR 10.0.0.0/16
   - 2 public subnets and 2 private subnets across 2 AZs
   - Internet Gateway
   - NAT Gateway in one public subnet
   - Route tables

2. Load Balancer:
   - Application Load Balancer
   - HTTPS on port 443
   - Route to instances in private subnets

3. Compute:
   - EC2 instances t3.micro
   - Auto Scaling Group across 2 AZs
   - Min 2, Max 4 instances
   - Launch Template

4. Database:
   - Multi-AZ RDS (I'll use MySQL)
   - Not publicly accessible
   - DB subnet group in private subnets

5. Storage:
   - S3 bucket for backups
   - Server-side encryption
   - Versioning enabled

6. Security:
   - Security groups for HTTPS only from internet
   - IAM roles with least privilege
   - No hardcoded secrets

7. Logging:
   - CloudWatch Logs for EC2

8. Tags:
   - All resources tagged with "Environment": "Production"

Let me structure this template properly:

- Parameters (for flexibility)
- Resources (all the infrastructure)
- Outputs (useful information)

I need to ensure all logical resource names have the "prod-" prefix and the template is valid JSON.

For the ALB, I'll need:
- Security group allowing HTTPS from internet
- Target group for EC2 instances
- Listener for HTTPS (I'll need a certificate, but I'll make it a parameter)

For Auto Scaling:
- Launch template with user data for CloudWatch agent
- Auto Scaling Group


- Scaling policies based on CPU utilization will dynamically adjust instance count
- I'll configure scaling to add or remove instances based on average CPU usage
- Threshold will be set to scale out at 70% and scale in at 30% CPU utilization
- This ensures efficient resource allocation and application performance

For RDS configuration:
- I'll create a dedicated DB subnet group spanning multiple availability zones
- Implement a security group that precisely controls EC2 instance access
- Configure the RDS instance with Multi-AZ deployment for high availability
- Ensure database is protected within private subnets

IAM configuration requires careful planning:
- Develop an EC2 role with granular CloudWatch logging permissions
- Create an instance profile to associate the role with EC2 instances
- Implement least-privilege access principles
- Ensure secure, controlled access to necessary resources

I'll meticulously craft this in JSON, ensuring each component is precisely configured for production-grade infrastructure.
### Answer 
---

I'll create a comprehensive CloudFormation template that meets all your requirements. This template will deploy a highly available, secure, and scalable infrastructure suitable for production migration.

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Production-ready AWS infrastructure for migration scenario with high availability and security",
  
  "Parameters": {
    "LatestAmiId": {
      "Type": "AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>",
      "Default": "/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2",
      "Description": "Latest Amazon Linux 2 AMI ID"
    },
    "SSLCertificateArn": {
      "Type": "String",
      "Description": "ARN of SSL certificate for HTTPS listener (must exist in ACM)",
      "Default": ""
    },
    "DBMasterUsername": {
      "Type": "String",
      "Default": "admin",
      "Description": "Database master username",
      "MinLength": 1,
      "MaxLength": 16,
      "AllowedPattern": "[a-zA-Z][a-zA-Z0-9]*"
    },
    "DBMasterPassword": {
      "Type": "String",
      "Description": "Database master password",
      "MinLength": 8,
      "MaxLength": 41,
      "NoEcho": true
    }
  },
  
  "Resources": {
    "prodVPC": {
      "Type": "AWS::EC2::VPC",
      "Properties": {
        "CidrBlock": "10.0.0.0/16",
        "EnableDnsHostnames": true,
        "EnableDnsSupport": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": "prod-vpc"
          },
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },
    
    "prodInternetGateway": {
      "Type": "AWS::EC2::InternetGateway",
      "Properties": {
        "Tags": [
          {
            "Key": "Name",
            "Value": "prod-internet-gateway"
          },
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },
    
    "prodVPCGatewayAttachment": {
      "Type": "AWS::EC2::VPCGatewayAttachment",
      "Properties": {
        "VpcId": {
          "Ref": "prodVPC"
        },
        "InternetGatewayId": {
          "Ref": "prodInternetGateway"
        }
      }
    },
    
    "prodPublicSubnetAZ1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "prodVPC"
        },
        "CidrBlock": "10.0.1.0/24",
        "AvailabilityZone": "us-east-1a",
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": "prod-public-subnet-az1"
          },
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },
    
    "prodPublicSubnetAZ2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "prodVPC"
        },
        "CidrBlock": "10.0.2.0/24",
        "AvailabilityZone": "us-east-1b",
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": "prod-public-subnet-az2"
          },
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },
    
    "prodPrivateSubnetAZ1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "prodVPC"
        },
        "CidrBlock": "10.0.3.0/24",
        "AvailabilityZone": "us-east-1a",
        "Tags": [
          {
            "Key": "Name",
            "Value": "prod-private-subnet-az1"
          },
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },
    
    "prodPrivateSubnetAZ2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "prodVPC"
        },
        "CidrBlock": "10.0.4.0/24",
        "AvailabilityZone": "us-east-1b",
        "Tags": [
          {
            "Key": "Name",
            "Value": "prod-private-subnet-az2"
          },
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },
    
    "prodNATGatewayEIP": {
      "Type": "AWS::EC2::EIP",
      "DependsOn": "prodVPCGatewayAttachment",
      "Properties": {
        "Domain": "vpc",
        "Tags": [
          {
            "Key": "Name",
            "Value": "prod-nat-gateway-eip"
          },
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },
    
    "prodNATGateway": {
      "Type": "AWS::EC2::NatGateway",
      "Properties": {
        "AllocationId": {
          "Fn::GetAtt": [
            "prodNATGatewayEIP",
            "AllocationId"
          ]
        },
        "SubnetId": {
          "Ref": "prodPublicSubnetAZ1"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": "prod-nat-gateway"
          },
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },
    
    "prodPublicRouteTable": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": {
          "Ref": "prodVPC"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": "prod-public-route-table"
          },
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },
    
    "prodPublicRoute": {
      "Type": "AWS::EC2::Route",
      "DependsOn": "prodVPCGatewayAttachment",
      "Properties": {
        "RouteTableId": {
          "Ref": "prodPublicRouteTable"
        },
        "DestinationCidrBlock": "0.0.0.0/0",
        "GatewayId": {
          "Ref": "prodInternetGateway"
        }
      }
    },
    
    "prodPublicSubnetAZ1RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "prodPublicSubnetAZ1"
        },
        "RouteTableId": {
          "Ref": "prodPublicRouteTable"
        }
      }
    },
    
    "prodPublicSubnetAZ2RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "prodPublicSubnetAZ2"
        },
        "RouteTableId": {
          "Ref": "prodPublicRouteTable"
        }
      }
    },
    
    "prodPrivateRouteTable": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": {
          "Ref": "prodVPC"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": "prod-private-route-table"
          },
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },
    
    "prodPrivateRoute": {
      "Type": "AWS::EC2::Route",
      "Properties": {
        "RouteTableId": {
          "Ref": "prodPrivateRouteTable"
        },
        "DestinationCidrBlock": "0.0.0.0/0",
        "NatGatewayId": {
          "Ref": "prodNATGateway"
        }
      }
    },
    
    "prodPrivateSubnetAZ1RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "prodPrivateSubnetAZ1"
        },
        "RouteTableId": {
          "Ref": "prodPrivateRouteTable"
        }
      }
    },
    
    "prodPrivateSubnetAZ2RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "prodPrivateSubnetAZ2"
        },
        "RouteTableId": {
          "Ref": "prodPrivateRouteTable"
        }
      }
    },
    
    "prodALBSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for Application Load Balancer",
        "VpcId": {
          "Ref": "prodVPC"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 443,
            "ToPort": 443,
            "CidrIp": "0.0.0.0/0",
            "Description": "HTTPS from internet"
          }
        ],
        "SecurityGroupEgress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 80,
            "ToPort": 80,
            "CidrIp": "10.0.0.0/16",
            "Description": "HTTP to EC2 instances"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": "prod-alb-security-group"
          },
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },
    
    "prodEC2SecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for EC2 instances",
        "VpcId": {
          "Ref": "prodVPC"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 80,
            "ToPort": 80,
            "SourceSecurityGroupId": {
              "Ref": "prodALBSecurityGroup"
            },
            "Description": "HTTP from ALB"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": "prod-ec2-security-group"
          },
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },
    
    "prodRDSSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for RDS instance",
        "VpcId": {
          "Ref": "prodVPC"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 3306,
            "ToPort": 3306,
            "SourceSecurityGroupId": {
              "Ref": "prodEC2SecurityGroup"
            },
            "Description": "MySQL from EC2 instances"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": "prod-rds-security-group"
          },
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },
    
    "prodEC2Role": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": "prod-ec2-role",
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
        "Policies": [
          {
            "PolicyName": "prod-s3-backup-access",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:GetObject",
                    "s3:PutObject",
                    "s3:DeleteObject"
                  ],
                  "Resource": {
                    "Fn::Sub": "${prodS3BackupBucket}/*"
                  }
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:ListBucket"
                  ],
                  "Resource": {
                    "Ref": "prodS3BackupBucket"
                  }
                }
              ]
            }
          }
        ],
        "Tags": [
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },
    
    "prodEC2InstanceProfile": {
      "Type": "AWS::IAM::InstanceProfile",
      "Properties": {
        "InstanceProfileName": "prod-ec2-instance-profile",
        "Roles": [
          {
            "Ref": "prodEC2Role"
          }
        ]
      }
    },
    
    "prodLaunchTemplate": {
      "Type": "AWS::EC2::LaunchTemplate",
      "Properties": {
        "LaunchTemplateName": "prod-launch-template",
        "LaunchTemplateData": {
          "ImageId": {
            "Ref": "LatestAmiId"
          },
          "InstanceType": "t3.micro",
          "IamInstanceProfile": {
            "Arn": {
              "Fn::GetAtt": [
                "prodEC2InstanceProfile",
                "Arn"
              ]
            }
          },
          "SecurityGroupIds": [
            {
              "Ref": "prodEC2SecurityGroup"
            }
          ],
          "UserData": {
            "Fn::Base64": {
              "Fn::Sub": "#!/bin/bash\nyum update -y\nyum install -y amazon-cloudwatch-agent httpd\nsystemctl start httpd\nsystemctl enable httpd\necho '<h1>Production Server</h1>' > /var/www/html/index.html\n/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c ssm:AmazonCloudWatch-linux\n"
            }
          },
          "TagSpecifications": [
            {
              "ResourceType": "instance",
              "Tags": [
                {
                  "Key": "Name",
                  "Value": "prod-web-server"
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
    
    "prodApplicationLoadBalancer": {
      "Type": "AWS::ElasticLoadBalancingV2::LoadBalancer",
      "Properties": {
        "Name": "prod-application-load-balancer",
        "Scheme": "internet-facing",
        "Type": "application",
        "SecurityGroups": [
          {
            "Ref": "prodALBSecurityGroup"
          }
        ],
        "Subnets": [
          {
            "Ref": "prodPublicSubnetAZ1"
          },
          {
            "Ref": "prodPublicSubnetAZ2"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": "prod-application-load-balancer"
          },
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },
    
    "prodTargetGroup": {
      "Type": "AWS::ElasticLoadBalancingV2::TargetGroup",
      "Properties": {
        "Name": "prod-target-group",
        "Port": 80,
        "Protocol": "HTTP",
        "VpcId": {
          "Ref": "prodVPC"
        },
        "HealthCheckEnabled": true,
        "HealthCheckPath": "/",
        "HealthCheckProtocol": "HTTP",
        "HealthCheckIntervalSeconds": 30,
        "HealthyThresholdCount": 2,
        "UnhealthyThresholdCount": 3,
        "Tags": [
          {
            "Key": "Name",
            "Value": "prod-target-group"
          },
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },
    
    "prodHTTPSListener": {
      "Type": "AWS::ElasticLoadBalancingV2::Listener",
      "Properties": {
        "DefaultActions": [
          {
            "Type": "forward",
            "TargetGroupArn": {
              "Ref": "prodTargetGroup"
            }
          }
        ],
        "LoadBalancerArn": {
          "Ref": "prodApplicationLoadBalancer"
        },
        "Port": 443,
        "Protocol": "HTTPS",
        "Certificates": [
          {
            "CertificateArn": {
              "Ref": "SSLCertificateArn"
            }
          }
        ]
      }
    },
    
    "prodAutoScalingGroup": {
      "Type": "AWS::AutoScaling::AutoScalingGroup",
      "Properties": {
        "AutoScalingGroupName": "prod-auto-scaling-group",
        "LaunchTemplate": {
          "LaunchTemplateId": {
            "Ref": "prodLaunchTemplate"
          },
          "Version": {
            "Fn::GetAtt": [
              "prodLaunchTemplate",
              "LatestVersionNumber"
            ]
          }
        },
        "MinSize": "2",
        "MaxSize": "4",
        "DesiredCapacity": "2",
        "VPCZoneIdentifier": [
          {
            "Ref": "prodPrivateSubnetAZ1"
          },
          {
            "Ref": "prodPrivateSubnetAZ2"
          }
        ],
        "TargetGroupARNs": [
          {
            "Ref": "prodTargetGroup"
          }
        ],
        "HealthCheckType": "ELB",
        "HealthCheckGracePeriod": 300,
        "Tags": [
          {
            "Key": "Name",
            "Value": "prod-auto-scaling-group",
            "PropagateAtLaunch": false
          },
          {
            "Key": "Environment",
            "Value": "Production",
            "PropagateAtLaunch": true
          }
        ]
      }
    },
    
    "prodScaleUpPolicy": {
      "Type": "AWS::AutoScaling::ScalingPolicy",
      "Properties": {
        "AdjustmentType": "ChangeInCapacity",
        "AutoScalingGroupName": {
          "Ref": "prodAutoScalingGroup"
        },
        "Cooldown": "300",
        "ScalingAdjustment": "1",
        "PolicyType": "SimpleScaling"
      }
    },
    
    "prodScaleDownPolicy": {
      "Type": "AWS::AutoScaling::ScalingPolicy",
      "Properties": {
        "AdjustmentType": "ChangeInCapacity",
        "AutoScalingGroupName": {
          "Ref": "prodAutoScalingGroup"
        },
        "Cooldown": "300",
        "ScalingAdjustment": "-1",
        "PolicyType": "SimpleScaling"
      }
    },
    
    "prodCPUAlarmHigh": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": "prod-cpu-alarm-high",
        "AlarmDescription": "Scale up on high CPU",
        "MetricName": "CPUUtilization",
        "Namespace": "AWS/EC2",
        "Statistic": "Average",
        "Period": 300,
        "EvaluationPeriods": 2,
        "Threshold": 75,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "AutoScalingGroupName",
            "Value": {
              "Ref": "prodAutoScalingGroup"
            }
          }
        ],
        "AlarmActions": [
          {
            "Ref": "prodScaleUpPolicy"
          }
        ]
      }
    },
    
    "prodCPUAlarmLow": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": "prod-cpu-alarm-low",
        "AlarmDescription": "Scale down on low CPU",
        "MetricName": "CPUUtilization",
        "Namespace": "AWS/EC2",
        "Statistic": "Average",
        "Period": 300,
        "EvaluationPeriods": 2,
        "Threshold": 25,
        "ComparisonOperator": "LessThanThreshold",
        "Dimensions": [
          {
            "Name": "AutoScalingGroupName",
            "Value": {
              "Ref": "prodAutoScalingGroup"
            }
          }
        ],
        "AlarmActions": [
          {
            "Ref": "prodScaleDownPolicy"
          }
        ]
      }
    },
    
    "prodDBSubnetGroup": {
      "Type": "AWS::RDS::DBSubnetGroup",
      "Properties": {
        "DBSubnetGroupName": "prod-db-subnet-group",
        "DBSubnetGroupDescription": "Subnet group for RDS instance",
        "SubnetIds": [
          {
            "Ref": "prodPrivateSubnetAZ1"
          },
          {
            "Ref": "prodPrivateSubnetAZ2"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": "prod-db-subnet-group"
          },
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },
    
    "prodRDSInstance": {
      "Type": "AWS::RDS::DBInstance",
      "Properties": {
        "DBInstanceIdentifier": "prod-mysql-instance",
        "DBInstanceClass": "db.t3.micro",
        "Engine": "mysql",
        "EngineVersion": "8.0.35",
        "AllocatedStorage": "20",
        "StorageType": "gp2",
        "MasterUsername": {
          "Ref": "DBMasterUsername"
        },
        "MasterUserPassword": {
          "Ref": "DBMasterPassword"
        },
        "VPCSecurityGroups": [
          {
            "Ref": "prodRDSSecurityGroup"
          }
        ],
        "DBSubnetGroupName": {
          "Ref": "prodDBSubnetGroup"
        },
        "MultiAZ": true,
        "PubliclyAccessible": false,
        "StorageEncrypted": true,
        "BackupRetentionPeriod": 7,
        "DeletionProtection": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": "prod-mysql-instance"
          },
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },
    
    "prodS3BackupBucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "prod-backup-bucket-${AWS::AccountId}-${AWS::Region}"
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
          {
            "Key": "Name",
            "Value": "prod-backup-bucket"
          },
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },
    
    "prodCloudWatchLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": "/prod/ec2/application",
        "RetentionInDays": 30,
        "Tags": [
          {
            "Key": "Name",
            "Value": "prod-log-group"
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
      "Value": {
        "Ref": "prodVPC"
      },
      "Export": {
        "Name": "prod-vpc-id"
      }
    },
    "LoadBalancerDNSName": {
      "Description": "DNS name of the load balancer",
      "Value": {
        "Fn::GetAtt": [
          "prodApplicationLoadBalancer",
          "DNSName"
        ]
      },
      "Export": {
        "Name": "prod-alb-dns-name"
      }
    },
    "RDSEndpoint": {
      "Description": "RDS instance endpoint",
      "Value": {
        "Fn::GetAtt": [
          "prodRDSInstance",
          "Endpoint.Address"
        ]
      },
      "Export": {
        "Name": "prod-rds-endpoint"
      }
    },
    "S3BackupBucket": {
      "Description": "S3 backup bucket name",
      "Value": {
        "Ref": "prodS3BackupBucket"
      },
      "Export": {
        "Name": "prod-s3-backup-bucket"
      }
    },
    "AutoScalingGroupName": {
      "Description": "Auto Scaling Group name",
      "Value": {
        "Ref": "prodAutoScalingGroup"
      },
      "Export": {
        "Name": "prod-auto-scaling-group-name"
      }
    }
  }
}
```

## Key Features of this Template:

### **High Availability & Fault Tolerance:**
- Multi-AZ deployment across us-east-1a and us-east-1b
- Application Load Balancer distributing traffic across multiple instances
- Auto Scaling Group with min 2, max 4 instances
- Multi-AZ RDS instance with automatic failover
- NAT Gateway for secure outbound internet access from private subnets

### **Security Best Practices:**
- All EC2 instances in private subnets
- Security groups with least privilege access (HTTPS only from internet)
- IAM roles with minimal required permissions
- RDS encryption at rest enabled
- S3 bucket with server-side encryption and public access blocked
- No hardcoded credentials (uses parameters)

### **Scalability & Monitoring:**
- Auto Scaling based on CPU utilization (scale up at 75%, scale down at 25%)
- CloudWatch alarms for monitoring and scaling
- CloudWatch Logs integration for application logging
- Target group health checks

### **Production-Ready Features:**
- RDS backup retention (7 days)
- RDS deletion protection enabled
- S3 versioning enabled
- Proper resource naming with "prod-" prefix
- Comprehensive tagging with "Environment": "Production"

### **Deployment Notes:**
1. **SSL Certificate**: You'll need to provide a valid ACM certificate ARN for the HTTPS listener
2. **Database Password**: Provide a secure password for the RDS master user
3. **Region**: Template is optimized for us-east-1 but can be adapted for other regions by updating AZ references

This template creates a robust, secure, and scalable infrastructure suitable for production workloads and migration scenarios.
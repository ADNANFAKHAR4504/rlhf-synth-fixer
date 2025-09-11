### Reasoning Trace
---

I need to create a comprehensive CloudFormation template in JSON format that satisfies all the requirements for a production-ready AWS infrastructure migration scenario.

Key requirements analysis:
1. VPC & Networking: VPC with CIDR 10.0.0.0/16, public/private subnets across 2 AZs, Internet Gateway, NAT Gateway
2. Load Balancer: Application Load Balancer accepting HTTPS on port 443, routing to private subnets
3. Compute: EC2 t3.micro instances with Auto Scaling Group (min 2, max 4) across 2 AZs
4. Database: Multi-AZ RDS instance (MySQL/PostgreSQL) in private subnets, not publicly accessible
5. Storage: S3 bucket with server-side encryption and versioning enabled
6. Security: HTTPS-only security groups, least privilege IAM roles, no hardcoded secrets
7. Logging: CloudWatch Logs integration for EC2 instances
8. Tagging: All resources tagged with "Environment": "Production"
9. Naming: All logical resource names must include "prod-" prefix

The template must be valid JSON, deployable in us-east-1 without errors, following AWS best practices for security, high availability, and scalability.

### Answer 
---

I'll create a production-ready CloudFormation template that meets all requirements for migrating infrastructure to AWS with high availability, security, and fault tolerance.

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
      "AllowedPattern": "arn:aws:acm:.*",
      "ConstraintDescription": "Must be a valid ACM certificate ARN"
    },
    "DBMasterUsername": {
      "Type": "String",
      "Default": "admin",
      "Description": "Database master username",
      "MinLength": 1,
      "MaxLength": 16,
      "AllowedPattern": "[a-zA-Z][a-zA-Z0-9]*",
      "ConstraintDescription": "Must begin with a letter and contain only alphanumeric characters"
    },
    "DBMasterPassword": {
      "Type": "String",
      "Description": "Database master password (8-41 characters)",
      "MinLength": 8,
      "MaxLength": 41,
      "NoEcho": true,
      "AllowedPattern": "[a-zA-Z0-9]*",
      "ConstraintDescription": "Must contain only alphanumeric characters"
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
        "GroupDescription": "Security group for Application Load Balancer - HTTPS only",
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
        "GroupDescription": "Security group for EC2 instances - ALB access only",
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
            "Description": "HTTP from ALB only"
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
        "GroupDescription": "Security group for RDS instance - EC2 access only",
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
            "Description": "MySQL from EC2 instances only"
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
        "RoleName": "prod-ec2-cloudwatch-role",
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
              "Fn::Sub": [
                "#!/bin/bash\nyum update -y\nyum install -y amazon-cloudwatch-agent httpd\nsystemctl start httpd\nsystemctl enable httpd\necho '<h1>Production Web Server - ${Instance}</h1>' > /var/www/html/index.html\n\n# Configure CloudWatch agent\ncat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOF'\n{\n  \"logs\": {\n    \"logs_collected\": {\n      \"files\": {\n        \"collect_list\": [\n          {\n            \"file_path\": \"/var/log/httpd/access_log\",\n            \"log_group_name\": \"${LogGroup}\",\n            \"log_stream_name\": \"httpd-access\"\n          },\n          {\n            \"file_path\": \"/var/log/httpd/error_log\",\n            \"log_group_name\": \"${LogGroup}\",\n            \"log_stream_name\": \"httpd-error\"\n          }\n        ]\n      }\n    }\n  }\n}\nEOF\n\n/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s\n",
                {
                  "Instance": "EC2",
                  "LogGroup": {
                    "Ref": "prodCloudWatchLogGroup"
                  }
                }
              ]
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
        "HealthCheckTimeoutSeconds": 5,
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
        "AlarmDescription": "Scale up when CPU exceeds 70%",
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
        "AlarmDescription": "Scale down when CPU below 30%",
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
        "DBSubnetGroupDescription": "Subnet group for production RDS instance",
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
      "DeletionPolicy": "Delete",
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
        "DeletionProtection": false,
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
      "DeletionPolicy": "Delete",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "prod-backup-bucket-${AWS::AccountId}-${AWS::Region}"
        },
        "BucketEncryption": {
          "ServerSideEncryptionConfiguration": [
            {
              "ServerSideEncryptionByDefault": {
                "SSEAlgorithm": "AES256"
              },
              "BucketKeyEnabled": true
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
        "NotificationConfiguration": {
          "CloudWatchConfigurations": [
            {
              "Event": "s3:ObjectCreated:*",
              "CloudWatchConfiguration": {
                "LogGroupName": {
                  "Ref": "prodCloudWatchLogGroup"
                }
              }
            }
          ]
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
        "LogGroupName": "/aws/ec2/production",
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
      "Description": "Production VPC ID",
      "Value": {
        "Ref": "prodVPC"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-VPC-ID"
        }
      }
    },
    "LoadBalancerDNSName": {
      "Description": "Application Load Balancer DNS name for HTTPS access",
      "Value": {
        "Fn::GetAtt": [
          "prodApplicationLoadBalancer",
          "DNSName"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-ALB-DNS"
        }
      }
    },
    "LoadBalancerHostedZoneID": {
      "Description": "ALB Hosted Zone ID for DNS configuration",
      "Value": {
        "Fn::GetAtt": [
          "prodApplicationLoadBalancer",
          "CanonicalHostedZoneID"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-ALB-HostedZone"
        }
      }
    },
    "RDSEndpoint": {
      "Description": "RDS MySQL instance endpoint",
      "Value": {
        "Fn::GetAtt": [
          "prodRDSInstance",
          "Endpoint.Address"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-RDS-Endpoint"
        }
      }
    },
    "RDSPort": {
      "Description": "RDS instance port number",
      "Value": {
        "Fn::GetAtt": [
          "prodRDSInstance",
          "Endpoint.Port"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-RDS-Port"
        }
      }
    },
    "S3BackupBucketName": {
      "Description": "S3 backup bucket name",
      "Value": {
        "Ref": "prodS3BackupBucket"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-S3-Bucket"
        }
      }
    },
    "S3BackupBucketArn": {
      "Description": "S3 backup bucket ARN",
      "Value": {
        "Fn::GetAtt": [
          "prodS3BackupBucket",
          "Arn"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-S3-Bucket-ARN"
        }
      }
    },
    "AutoScalingGroupName": {
      "Description": "Auto Scaling Group name",
      "Value": {
        "Ref": "prodAutoScalingGroup"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-ASG-Name"
        }
      }
    },
    "CloudWatchLogGroupName": {
      "Description": "CloudWatch Log Group for application logs",
      "Value": {
        "Ref": "prodCloudWatchLogGroup"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-LogGroup"
        }
      }
    }
  }
}
```

## Production-Ready Features Implemented:

### High Availability and Fault Tolerance:
- Multi-AZ deployment across us-east-1a and us-east-1b
- Application Load Balancer with HTTPS-only access (port 443)
- Auto Scaling Group (min 2, max 4 instances) across multiple AZs
- Multi-AZ RDS MySQL instance with automated failover
- NAT Gateway for secure outbound internet access

### Security Best Practices:
- All compute resources in private subnets
- Security groups with strict least-privilege access
- HTTPS-only traffic from internet to ALB
- RDS accessible only from EC2 security group
- IAM roles with minimal CloudWatch and S3 permissions
- S3 bucket encryption (AES256) with public access blocked
- RDS storage encryption enabled
- No hardcoded secrets (parameterized)

### Scalability and Monitoring:
- CPU-based auto scaling (scale up at 70%, down at 30%)
- CloudWatch alarms for automatic scaling triggers
- Application logging to CloudWatch Logs
- Health checks for target group and auto scaling

### Production Deployment Features:
- Comprehensive parameter validation
- Resource deletion policies for testing environments
- All resources tagged with "Environment": "Production"
- Consistent "prod-" naming convention
- Detailed outputs for integration with other stacks
- 7-day RDS backup retention
- S3 versioning enabled
- 30-day log retention

This template provides a robust, secure, and scalable foundation for production workloads with proper monitoring, logging, and high availability across multiple availability zones.
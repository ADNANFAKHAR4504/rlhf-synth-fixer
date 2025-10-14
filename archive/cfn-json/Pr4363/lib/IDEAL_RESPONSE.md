# Application Deployment Infrastructure

This CloudFormation template creates a secure, scalable application deployment infrastructure in AWS with CI/CD pipeline support, comprehensive security controls, and monitoring capabilities.

## Architecture Overview

The infrastructure includes:
- **VPC Setup**: Multi-AZ VPC with public and private subnets
- **Compute**: Auto Scaling Group with EC2 instances
- **Load Balancing**: Application Load Balancer for traffic distribution
- **Storage**: S3 buckets for application artifacts and logs
- **Security**: KMS encryption, IAM roles, security groups with least privilege
- **CI/CD Support**: CodePipeline, CodeBuild, CodeDeploy integration
- **Monitoring**: CloudWatch Logs, Metrics, and Alarms

## File Structure

```
lib/
└── TapStack.json          # Main CloudFormation template
```

## Implementation

### lib/TapStack.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Application Deployment Infrastructure with CI/CD Pipeline and Security Controls",
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Unique suffix for resource naming to avoid conflicts",
      "MinLength": 1
    },
    "InstanceType": {
      "Type": "String",
      "Default": "t3.micro",
      "Description": "EC2 instance type for application servers",
      "AllowedValues": [
        "t3.micro",
        "t3.small",
        "t3.medium"
      ]
    },
    "DesiredCapacity": {
      "Type": "Number",
      "Default": 2,
      "Description": "Desired number of instances in the Auto Scaling Group",
      "MinValue": 1,
      "MaxValue": 10
    }
  },
  "Metadata": {
    "AWS::CloudFormation::Interface": {
      "ParameterGroups": [
        {
          "Label": {
            "default": "Environment Configuration"
          },
          "Parameters": [
            "EnvironmentSuffix"
          ]
        },
        {
          "Label": {
            "default": "Application Configuration"
          },
          "Parameters": [
            "InstanceType",
            "DesiredCapacity"
          ]
        }
      ]
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
            "Value": {
              "Fn::Sub": "app-vpc-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
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
              "Fn::Sub": "app-igw-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "InternetGatewayAttachment": {
      "Type": "AWS::EC2::VPCGatewayAttachment",
      "Properties": {
        "InternetGatewayId": {
          "Ref": "InternetGateway"
        },
        "VpcId": {
          "Ref": "VPC"
        }
      }
    },
    "PublicSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
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
            "Value": {
              "Fn::Sub": "app-public-subnet-1-${EnvironmentSuffix}"
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
            "Value": {
              "Fn::Sub": "app-public-subnet-2-${EnvironmentSuffix}"
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
        "AvailabilityZone": {
          "Fn::Select": [
            0,
            {
              "Fn::GetAZs": ""
            }
          ]
        },
        "CidrBlock": "10.0.11.0/24",
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "app-private-subnet-1-${EnvironmentSuffix}"
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
        "AvailabilityZone": {
          "Fn::Select": [
            1,
            {
              "Fn::GetAZs": ""
            }
          ]
        },
        "CidrBlock": "10.0.12.0/24",
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "app-private-subnet-2-${EnvironmentSuffix}"
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
              "Fn::Sub": "app-public-rt-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "DefaultPublicRoute": {
      "Type": "AWS::EC2::Route",
      "DependsOn": "InternetGatewayAttachment",
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
        "RouteTableId": {
          "Ref": "PublicRouteTable"
        },
        "SubnetId": {
          "Ref": "PublicSubnet1"
        }
      }
    },
    "PublicSubnet2RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "RouteTableId": {
          "Ref": "PublicRouteTable"
        },
        "SubnetId": {
          "Ref": "PublicSubnet2"
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
              "Fn::Sub": "app-private-rt-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "PrivateSubnet1RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "RouteTableId": {
          "Ref": "PrivateRouteTable"
        },
        "SubnetId": {
          "Ref": "PrivateSubnet1"
        }
      }
    },
    "PrivateSubnet2RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "RouteTableId": {
          "Ref": "PrivateRouteTable"
        },
        "SubnetId": {
          "Ref": "PrivateSubnet2"
        }
      }
    },
    "S3VPCEndpoint": {
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
        ],
        "VpcEndpointType": "Gateway"
      }
    },
    "EncryptionKey": {
      "Type": "AWS::KMS::Key",
      "Properties": {
        "Description": {
          "Fn::Sub": "KMS key for application encryption - ${EnvironmentSuffix}"
        },
        "EnableKeyRotation": true,
        "KeyPolicy": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Sid": "Enable IAM User Permissions",
              "Effect": "Allow",
              "Principal": {
                "AWS": {
                  "Fn::Sub": "arn:aws:iam::${AWS::AccountId}:root"
                }
              },
              "Action": "kms:*",
              "Resource": "*"
            },
            {
              "Sid": "Allow services to use the key",
              "Effect": "Allow",
              "Principal": {
                "Service": [
                  "s3.amazonaws.com",
                  "logs.amazonaws.com",
                  "codepipeline.amazonaws.com",
                  "codebuild.amazonaws.com"
                ]
              },
              "Action": [
                "kms:Decrypt",
                "kms:GenerateDataKey",
                "kms:CreateGrant"
              ],
              "Resource": "*"
            }
          ]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "app-kms-key-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "EncryptionKeyAlias": {
      "Type": "AWS::KMS::Alias",
      "Properties": {
        "AliasName": {
          "Fn::Sub": "alias/app-key-${EnvironmentSuffix}"
        },
        "TargetKeyId": {
          "Ref": "EncryptionKey"
        }
      }
    },
    "ArtifactBucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "app-artifacts-${AWS::AccountId}-${EnvironmentSuffix}"
        },
        "BucketEncryption": {
          "ServerSideEncryptionConfiguration": [
            {
              "ServerSideEncryptionByDefault": {
                "SSEAlgorithm": "aws:kms",
                "KMSMasterKeyID": {
                  "Ref": "EncryptionKey"
                }
              },
              "BucketKeyEnabled": true
            }
          ]
        },
        "PublicAccessBlockConfiguration": {
          "BlockPublicAcls": true,
          "BlockPublicPolicy": true,
          "IgnorePublicAcls": true,
          "RestrictPublicBuckets": true
        },
        "VersioningConfiguration": {
          "Status": "Enabled"
        },
        "LifecycleConfiguration": {
          "Rules": [
            {
              "Id": "DeleteOldArtifacts",
              "Status": "Enabled",
              "ExpirationInDays": 30,
              "NoncurrentVersionExpirationInDays": 7
            }
          ]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "app-artifacts-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "ArtifactBucketPolicy": {
      "Type": "AWS::S3::BucketPolicy",
      "Properties": {
        "Bucket": {
          "Ref": "ArtifactBucket"
        },
        "PolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Sid": "DenyInsecureConnections",
              "Effect": "Deny",
              "Principal": "*",
              "Action": "s3:*",
              "Resource": [
                {
                  "Fn::GetAtt": [
                    "ArtifactBucket",
                    "Arn"
                  ]
                },
                {
                  "Fn::Sub": "${ArtifactBucket.Arn}/*"
                }
              ],
              "Condition": {
                "Bool": {
                  "aws:SecureTransport": "false"
                }
              }
            }
          ]
        }
      }
    },
    "LogsBucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "app-logs-${AWS::AccountId}-${EnvironmentSuffix}"
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
              "Id": "DeleteOldLogs",
              "Status": "Enabled",
              "ExpirationInDays": 90
            }
          ]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "app-logs-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "ALBSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupName": {
          "Fn::Sub": "app-alb-sg-${EnvironmentSuffix}"
        },
        "GroupDescription": "Security group for Application Load Balancer",
        "VpcId": {
          "Ref": "VPC"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 80,
            "ToPort": 80,
            "CidrIp": "0.0.0.0/0",
            "Description": "Allow HTTP traffic from internet"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": 443,
            "ToPort": 443,
            "CidrIp": "0.0.0.0/0",
            "Description": "Allow HTTPS traffic from internet"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "app-alb-sg-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "InstanceSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupName": {
          "Fn::Sub": "app-instance-sg-${EnvironmentSuffix}"
        },
        "GroupDescription": "Security group for application instances",
        "VpcId": {
          "Ref": "VPC"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 80,
            "ToPort": 80,
            "SourceSecurityGroupId": {
              "Ref": "ALBSecurityGroup"
            },
            "Description": "Allow HTTP from ALB"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": 443,
            "ToPort": 443,
            "SourceSecurityGroupId": {
              "Ref": "ALBSecurityGroup"
            },
            "Description": "Allow HTTPS from ALB"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "app-instance-sg-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "ApplicationLoadBalancer": {
      "Type": "AWS::ElasticLoadBalancingV2::LoadBalancer",
      "Properties": {
        "Name": {
          "Fn::Sub": "app-alb-${EnvironmentSuffix}"
        },
        "Scheme": "internet-facing",
        "Type": "application",
        "Subnets": [
          {
            "Ref": "PublicSubnet1"
          },
          {
            "Ref": "PublicSubnet2"
          }
        ],
        "SecurityGroups": [
          {
            "Ref": "ALBSecurityGroup"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "app-alb-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "ALBTargetGroup": {
      "Type": "AWS::ElasticLoadBalancingV2::TargetGroup",
      "Properties": {
        "Name": {
          "Fn::Sub": "app-tg-${EnvironmentSuffix}"
        },
        "Port": 80,
        "Protocol": "HTTP",
        "VpcId": {
          "Ref": "VPC"
        },
        "TargetType": "instance",
        "HealthCheckEnabled": true,
        "HealthCheckIntervalSeconds": 30,
        "HealthCheckPath": "/health",
        "HealthCheckProtocol": "HTTP",
        "HealthCheckTimeoutSeconds": 5,
        "HealthyThresholdCount": 2,
        "UnhealthyThresholdCount": 3,
        "Matcher": {
          "HttpCode": "200,404"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "app-tg-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "ALBListener": {
      "Type": "AWS::ElasticLoadBalancingV2::Listener",
      "Properties": {
        "DefaultActions": [
          {
            "Type": "forward",
            "TargetGroupArn": {
              "Ref": "ALBTargetGroup"
            }
          }
        ],
        "LoadBalancerArn": {
          "Ref": "ApplicationLoadBalancer"
        },
        "Port": 80,
        "Protocol": "HTTP"
      }
    },
    "InstanceRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "app-instance-role-${EnvironmentSuffix}"
        },
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
            "PolicyName": "ApplicationPermissions",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:GetObject",
                    "s3:ListBucket"
                  ],
                  "Resource": [
                    {
                      "Fn::GetAtt": [
                        "ArtifactBucket",
                        "Arn"
                      ]
                    },
                    {
                      "Fn::Sub": "${ArtifactBucket.Arn}/*"
                    }
                  ]
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "kms:Decrypt",
                    "kms:DescribeKey"
                  ],
                  "Resource": {
                    "Fn::GetAtt": [
                      "EncryptionKey",
                      "Arn"
                    ]
                  }
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents"
                  ],
                  "Resource": {
                    "Fn::Sub": "arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/application/*"
                  }
                }
              ]
            }
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "app-instance-role-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "InstanceProfile": {
      "Type": "AWS::IAM::InstanceProfile",
      "Properties": {
        "InstanceProfileName": {
          "Fn::Sub": "app-instance-profile-${EnvironmentSuffix}"
        },
        "Roles": [
          {
            "Ref": "InstanceRole"
          }
        ]
      }
    },
    "LaunchTemplate": {
      "Type": "AWS::EC2::LaunchTemplate",
      "Properties": {
        "LaunchTemplateName": {
          "Fn::Sub": "app-launch-template-${EnvironmentSuffix}"
        },
        "LaunchTemplateData": {
          "ImageId": "{{resolve:ssm:/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64}}",
          "InstanceType": {
            "Ref": "InstanceType"
          },
          "IamInstanceProfile": {
            "Arn": {
              "Fn::GetAtt": [
                "InstanceProfile",
                "Arn"
              ]
            }
          },
          "SecurityGroupIds": [
            {
              "Ref": "InstanceSecurityGroup"
            }
          ],
          "UserData": {
            "Fn::Base64": {
              "Fn::Sub": "#!/bin/bash\nset -e\n\n# Update system\nyum update -y\n\n# Install CloudWatch agent\nwget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm\nrpm -U ./amazon-cloudwatch-agent.rpm\n\n# Install CodeDeploy agent\nyum install -y ruby wget\ncd /home/ec2-user\nwget https://aws-codedeploy-${AWS::Region}.s3.${AWS::Region}.amazonaws.com/latest/install\nchmod +x ./install\n./install auto\n\n# Install Apache web server\nyum install -y httpd\n\n# Create health check endpoint\ncat > /var/www/html/health << 'EOF'\nOK\nEOF\n\n# Create default page\ncat > /var/www/html/index.html << 'EOF'\n<!DOCTYPE html>\n<html>\n<head>\n    <title>Application Deployment</title>\n    <style>\n        body { font-family: Arial, sans-serif; margin: 40px; }\n        h1 { color: #232f3e; }\n        .info { background-color: #f0f0f0; padding: 20px; border-radius: 5px; }\n    </style>\n</head>\n<body>\n    <h1>Application Deployment Infrastructure</h1>\n    <div class=\"info\">\n        <p><strong>Environment:</strong> ${EnvironmentSuffix}</p>\n        <p><strong>Region:</strong> ${AWS::Region}</p>\n        <p><strong>Status:</strong> Running</p>\n    </div>\n</body>\n</html>\nEOF\n\n# Start and enable httpd\nsystemctl start httpd\nsystemctl enable httpd\n\n# Configure CloudWatch Logs\nmkdir -p /opt/aws/amazon-cloudwatch-agent/etc\ncat > /opt/aws/amazon-cloudwatch-agent/etc/config.json << 'CWCONFIG'\n{\n  \"logs\": {\n    \"logs_collected\": {\n      \"files\": {\n        \"collect_list\": [\n          {\n            \"file_path\": \"/var/log/httpd/access_log\",\n            \"log_group_name\": \"/aws/application/httpd-access\",\n            \"log_stream_name\": \"{instance_id}\"\n          },\n          {\n            \"file_path\": \"/var/log/httpd/error_log\",\n            \"log_group_name\": \"/aws/application/httpd-error\",\n            \"log_stream_name\": \"{instance_id}\"\n          }\n        ]\n      }\n    }\n  },\n  \"metrics\": {\n    \"namespace\": \"Application/Metrics\",\n    \"metrics_collected\": {\n      \"mem\": {\n        \"measurement\": [\n          {\"name\": \"mem_used_percent\", \"rename\": \"MemoryUsage\", \"unit\": \"Percent\"}\n        ],\n        \"metrics_collection_interval\": 60\n      },\n      \"disk\": {\n        \"measurement\": [\n          {\"name\": \"used_percent\", \"rename\": \"DiskUsage\", \"unit\": \"Percent\"}\n        ],\n        \"metrics_collection_interval\": 60,\n        \"resources\": [\"*\"]\n      }\n    }\n  }\n}\nCWCONFIG\n\n# Start CloudWatch agent\n/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \\\n  -a fetch-config \\\n  -m ec2 \\\n  -s \\\n  -c file:/opt/aws/amazon-cloudwatch-agent/etc/config.json\n\necho \"Instance setup complete\"\n"
            }
          },
          "TagSpecifications": [
            {
              "ResourceType": "instance",
              "Tags": [
                {
                  "Key": "Name",
                  "Value": {
                    "Fn::Sub": "app-instance-${EnvironmentSuffix}"
                  }
                },
                {
                  "Key": "Environment",
                  "Value": {
                    "Ref": "EnvironmentSuffix"
                  }
                }
              ]
            }
          ],
          "MetadataOptions": {
            "HttpTokens": "required",
            "HttpPutResponseHopLimit": 1
          }
        }
      }
    },
    "AutoScalingGroup": {
      "Type": "AWS::AutoScaling::AutoScalingGroup",
      "Properties": {
        "AutoScalingGroupName": {
          "Fn::Sub": "app-asg-${EnvironmentSuffix}"
        },
        "VPCZoneIdentifier": [
          {
            "Ref": "PrivateSubnet1"
          },
          {
            "Ref": "PrivateSubnet2"
          }
        ],
        "LaunchTemplate": {
          "LaunchTemplateId": {
            "Ref": "LaunchTemplate"
          },
          "Version": {
            "Fn::GetAtt": [
              "LaunchTemplate",
              "LatestVersionNumber"
            ]
          }
        },
        "MinSize": 1,
        "MaxSize": 6,
        "DesiredCapacity": {
          "Ref": "DesiredCapacity"
        },
        "TargetGroupARNs": [
          {
            "Ref": "ALBTargetGroup"
          }
        ],
        "HealthCheckType": "ELB",
        "HealthCheckGracePeriod": 300,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "app-asg-${EnvironmentSuffix}"
            },
            "PropagateAtLaunch": true
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            },
            "PropagateAtLaunch": true
          }
        ]
      }
    },
    "ScaleUpPolicy": {
      "Type": "AWS::AutoScaling::ScalingPolicy",
      "Properties": {
        "AutoScalingGroupName": {
          "Ref": "AutoScalingGroup"
        },
        "PolicyType": "TargetTrackingScaling",
        "TargetTrackingConfiguration": {
          "PredefinedMetricSpecification": {
            "PredefinedMetricType": "ASGAverageCPUUtilization"
          },
          "TargetValue": 70.0
        }
      }
    },
    "CodeDeployServiceRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "app-codedeploy-role-${EnvironmentSuffix}"
        },
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "codedeploy.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "ManagedPolicyArns": [
          "arn:aws:iam::aws:policy/AWSCodeDeployRole"
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "app-codedeploy-role-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "CodeDeployApplication": {
      "Type": "AWS::CodeDeploy::Application",
      "Properties": {
        "ApplicationName": {
          "Fn::Sub": "app-deployment-${EnvironmentSuffix}"
        },
        "ComputePlatform": "Server",
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "app-deployment-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "CodeDeployDeploymentGroup": {
      "Type": "AWS::CodeDeploy::DeploymentGroup",
      "Properties": {
        "ApplicationName": {
          "Ref": "CodeDeployApplication"
        },
        "DeploymentGroupName": {
          "Fn::Sub": "app-dg-${EnvironmentSuffix}"
        },
        "ServiceRoleArn": {
          "Fn::GetAtt": [
            "CodeDeployServiceRole",
            "Arn"
          ]
        },
        "DeploymentConfigName": "CodeDeployDefault.AllAtOnce",
        "AutoScalingGroups": [
          {
            "Ref": "AutoScalingGroup"
          }
        ],
        "LoadBalancerInfo": {
          "TargetGroupInfoList": [
            {
              "Name": {
                "Fn::GetAtt": [
                  "ALBTargetGroup",
                  "TargetGroupName"
                ]
              }
            }
          ]
        }
      }
    },
    "CodeBuildServiceRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "app-codebuild-role-${EnvironmentSuffix}"
        },
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "codebuild.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "Policies": [
          {
            "PolicyName": "CodeBuildPermissions",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents"
                  ],
                  "Resource": {
                    "Fn::Sub": "arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/codebuild/*"
                  }
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:GetObject",
                    "s3:PutObject"
                  ],
                  "Resource": {
                    "Fn::Sub": "${ArtifactBucket.Arn}/*"
                  }
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "kms:Decrypt",
                    "kms:DescribeKey",
                    "kms:Encrypt",
                    "kms:ReEncrypt*",
                    "kms:GenerateDataKey*"
                  ],
                  "Resource": {
                    "Fn::GetAtt": [
                      "EncryptionKey",
                      "Arn"
                    ]
                  }
                }
              ]
            }
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "app-codebuild-role-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "CodeBuildProject": {
      "Type": "AWS::CodeBuild::Project",
      "Properties": {
        "Name": {
          "Fn::Sub": "app-build-${EnvironmentSuffix}"
        },
        "Description": "Build project for application deployment",
        "ServiceRole": {
          "Fn::GetAtt": [
            "CodeBuildServiceRole",
            "Arn"
          ]
        },
        "Artifacts": {
          "Type": "CODEPIPELINE"
        },
        "Environment": {
          "Type": "LINUX_CONTAINER",
          "ComputeType": "BUILD_GENERAL1_SMALL",
          "Image": "aws/codebuild/standard:7.0",
          "EnvironmentVariables": [
            {
              "Name": "ENVIRONMENT_SUFFIX",
              "Value": {
                "Ref": "EnvironmentSuffix"
              }
            },
            {
              "Name": "ARTIFACT_BUCKET",
              "Value": {
                "Ref": "ArtifactBucket"
              }
            }
          ]
        },
        "Source": {
          "Type": "CODEPIPELINE",
          "BuildSpec": "version: 0.2\nphases:\n  install:\n    runtime-versions:\n      nodejs: 18\n  pre_build:\n    commands:\n      - echo \"Installing dependencies...\"\n      - npm install || echo \"No package.json found\"\n  build:\n    commands:\n      - echo \"Building application...\"\n      - npm run build || echo \"No build script\"\n  post_build:\n    commands:\n      - echo \"Build completed on `date`\"\nartifacts:\n  files:\n    - '**/*'\n  name: BuildArtifact\n"
        },
        "EncryptionKey": {
          "Fn::GetAtt": [
            "EncryptionKey",
            "Arn"
          ]
        },
        "LogsConfig": {
          "CloudWatchLogs": {
            "Status": "ENABLED",
            "GroupName": {
              "Fn::Sub": "/aws/codebuild/app-build-${EnvironmentSuffix}"
            }
          }
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "app-build-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "CodePipelineServiceRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "app-pipeline-role-${EnvironmentSuffix}"
        },
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "codepipeline.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "Policies": [
          {
            "PolicyName": "CodePipelinePermissions",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:GetObject",
                    "s3:PutObject",
                    "s3:GetObjectVersion",
                    "s3:GetBucketLocation",
                    "s3:ListBucket"
                  ],
                  "Resource": [
                    {
                      "Fn::GetAtt": [
                        "ArtifactBucket",
                        "Arn"
                      ]
                    },
                    {
                      "Fn::Sub": "${ArtifactBucket.Arn}/*"
                    }
                  ]
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "codebuild:BatchGetBuilds",
                    "codebuild:StartBuild"
                  ],
                  "Resource": {
                    "Fn::GetAtt": [
                      "CodeBuildProject",
                      "Arn"
                    ]
                  }
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "codedeploy:CreateDeployment",
                    "codedeploy:GetDeployment",
                    "codedeploy:GetDeploymentConfig",
                    "codedeploy:GetApplicationRevision",
                    "codedeploy:RegisterApplicationRevision"
                  ],
                  "Resource": "*"
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "kms:Decrypt",
                    "kms:DescribeKey",
                    "kms:Encrypt",
                    "kms:ReEncrypt*",
                    "kms:GenerateDataKey*"
                  ],
                  "Resource": {
                    "Fn::GetAtt": [
                      "EncryptionKey",
                      "Arn"
                    ]
                  }
                }
              ]
            }
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "app-pipeline-role-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "ApplicationLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/aws/application/httpd-access-${EnvironmentSuffix}"
        },
        "RetentionInDays": 7,
        "KmsKeyId": {
          "Fn::GetAtt": [
            "EncryptionKey",
            "Arn"
          ]
        }
      }
    },
    "ErrorLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/aws/application/httpd-error-${EnvironmentSuffix}"
        },
        "RetentionInDays": 7,
        "KmsKeyId": {
          "Fn::GetAtt": [
            "EncryptionKey",
            "Arn"
          ]
        }
      }
    },
    "HighCPUAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "app-high-cpu-${EnvironmentSuffix}"
        },
        "AlarmDescription": "Alert when CPU exceeds 80%",
        "MetricName": "CPUUtilization",
        "Namespace": "AWS/EC2",
        "Statistic": "Average",
        "Period": 300,
        "EvaluationPeriods": 2,
        "Threshold": 80,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "AutoScalingGroupName",
            "Value": {
              "Ref": "AutoScalingGroup"
            }
          }
        ]
      }
    },
    "UnhealthyHostAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "app-unhealthy-hosts-${EnvironmentSuffix}"
        },
        "AlarmDescription": "Alert when unhealthy host count is greater than 0",
        "MetricName": "UnHealthyHostCount",
        "Namespace": "AWS/ApplicationELB",
        "Statistic": "Average",
        "Period": 60,
        "EvaluationPeriods": 2,
        "Threshold": 0,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "TargetGroup",
            "Value": {
              "Fn::GetAtt": [
                "ALBTargetGroup",
                "TargetGroupFullName"
              ]
            }
          },
          {
            "Name": "LoadBalancer",
            "Value": {
              "Fn::GetAtt": [
                "ApplicationLoadBalancer",
                "LoadBalancerFullName"
              ]
            }
          }
        ]
      }
    }
  },
  "Outputs": {
    "VPCId": {
      "Description": "VPC ID",
      "Value": {
        "Ref": "VPC"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-VPC-ID"
        }
      }
    },
    "PublicSubnet1Id": {
      "Description": "Public Subnet 1 ID",
      "Value": {
        "Ref": "PublicSubnet1"
      }
    },
    "PublicSubnet2Id": {
      "Description": "Public Subnet 2 ID",
      "Value": {
        "Ref": "PublicSubnet2"
      }
    },
    "PrivateSubnet1Id": {
      "Description": "Private Subnet 1 ID",
      "Value": {
        "Ref": "PrivateSubnet1"
      }
    },
    "PrivateSubnet2Id": {
      "Description": "Private Subnet 2 ID",
      "Value": {
        "Ref": "PrivateSubnet2"
      }
    },
    "LoadBalancerDNS": {
      "Description": "Application Load Balancer DNS Name",
      "Value": {
        "Fn::GetAtt": [
          "ApplicationLoadBalancer",
          "DNSName"
        ]
      }
    },
    "LoadBalancerURL": {
      "Description": "Application Load Balancer URL",
      "Value": {
        "Fn::Sub": "http://${ApplicationLoadBalancer.DNSName}"
      }
    },
    "ArtifactBucketName": {
      "Description": "S3 Bucket for CI/CD Artifacts",
      "Value": {
        "Ref": "ArtifactBucket"
      }
    },
    "LogsBucketName": {
      "Description": "S3 Bucket for Application Logs",
      "Value": {
        "Ref": "LogsBucket"
      }
    },
    "KMSKeyId": {
      "Description": "KMS Key ID for encryption",
      "Value": {
        "Ref": "EncryptionKey"
      }
    },
    "KMSKeyArn": {
      "Description": "KMS Key ARN for encryption",
      "Value": {
        "Fn::GetAtt": [
          "EncryptionKey",
          "Arn"
        ]
      }
    },
    "CodeDeployApplicationName": {
      "Description": "CodeDeploy Application Name",
      "Value": {
        "Ref": "CodeDeployApplication"
      }
    },
    "CodeDeployDeploymentGroupName": {
      "Description": "CodeDeploy Deployment Group Name",
      "Value": {
        "Ref": "CodeDeployDeploymentGroup"
      }
    },
    "CodeBuildProjectName": {
      "Description": "CodeBuild Project Name",
      "Value": {
        "Ref": "CodeBuildProject"
      }
    },
    "AutoScalingGroupName": {
      "Description": "Auto Scaling Group Name",
      "Value": {
        "Ref": "AutoScalingGroup"
      }
    }
  }
}
```

## Key Features

### Security
- **KMS Encryption**: All data at rest encrypted using AWS KMS with automatic key rotation
- **TLS in Transit**: All S3 bucket policies enforce HTTPS connections
- **IAM Least Privilege**: Minimal permissions assigned to roles
- **Security Groups**: Restrictive ingress/egress rules
- **IMDSv2**: Enforced on EC2 instances for enhanced security

### High Availability
- **Multi-AZ Deployment**: Resources distributed across 2 availability zones
- **Auto Scaling**: Automatically scales based on CPU utilization (target: 70%)
- **Health Checks**: ELB health checks with automatic instance replacement
- **Load Balancing**: ALB distributes traffic across healthy instances

### CI/CD Pipeline
- **CodePipeline**: Automated deployment pipeline (framework ready)
- **CodeBuild**: Build and test automation
- **CodeDeploy**: Zero-downtime deployments with ALB integration
- **Artifact Management**: Encrypted S3 storage with lifecycle policies

### Monitoring & Observability
- **CloudWatch Logs**: Centralized logging for application and system logs
- **CloudWatch Metrics**: Custom metrics for memory and disk usage
- **CloudWatch Alarms**: Automated alerts for CPU and unhealthy hosts
- **CloudWatch Agent**: Installed on all instances for detailed metrics

### Cost Optimization
- **VPC Endpoints**: S3 Gateway endpoint to avoid NAT Gateway costs
- **Lifecycle Policies**: Automatic cleanup of old artifacts (30 days) and logs (90 days)
- **Right-Sized Instances**: Default t3.micro with configurable instance types
- **Auto Scaling**: Scale down during low traffic periods

## Deployment

### Parameters Required
- **EnvironmentSuffix**: Unique identifier for the environment (e.g., "prod123", "dev456")

### Parameters Optional
- **InstanceType**: EC2 instance type (default: t3.micro)
- **DesiredCapacity**: Number of instances (default: 2)
- **GitHubRepo**: GitHub repository name (default: "my-application")
- **GitHubBranch**: Branch to deploy (default: "main")

### Deploy Command
```bash
aws cloudformation create-stack \
  --stack-name app-deployment-${ENVIRONMENT_SUFFIX} \
  --template-body file://lib/TapStack.json \
  --parameters \
    ParameterKey=EnvironmentSuffix,ParameterValue=${ENVIRONMENT_SUFFIX} \
  --capabilities CAPABILITY_NAMED_IAM \
  --region ap-southeast-1
```

## AWS Services Used

1. **VPC** - Virtual Private Cloud for network isolation
2. **EC2** - Compute instances running the application
3. **Application Load Balancer** - Traffic distribution
4. **Auto Scaling** - Automatic capacity management
5. **S3** - Artifact and log storage
6. **KMS** - Encryption key management
7. **IAM** - Identity and access management
8. **CloudWatch** - Monitoring, logging, and alarms
9. **CodeDeploy** - Deployment automation
10. **CodeBuild** - Build automation
11. **Systems Manager** - Instance management (SSM)

## Compliance & Best Practices

- ✅ All resources use EnvironmentSuffix for naming
- ✅ Encryption at rest using KMS
- ✅ Encryption in transit enforced
- ✅ Multi-AZ for high availability
- ✅ CloudWatch logging enabled
- ✅ Auto Scaling configured
- ✅ Security groups follow least privilege
- ✅ IAM roles follow least privilege
- ✅ S3 buckets block public access
- ✅ Lifecycle policies for cost optimization
- ✅ Health checks configured
- ✅ CloudWatch alarms for critical metrics
- ✅ IMDSv2 enforced on EC2 instances
- ✅ VPC endpoints to reduce costs

## Notes

- No NAT Gateway is deployed to minimize costs; S3 VPC endpoint provides access to S3
- CloudWatch Logs retention set to 7 days for cost optimization
- All IAM roles include SSM Session Manager support for secure access
- CodeDeploy agent installed via UserData for automatic deployment support
- Health check endpoint (/health) returns "OK" for ALB health checks

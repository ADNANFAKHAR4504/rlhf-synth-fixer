### Reasoning Trace

---

This is a comprehensive CloudFormation template request for a highly available web application infrastructure. I need to create a JSON CloudFormation template that includes:

1. VPC with proper subnets across 2 AZs
2. NAT Gateways for high availability
3. EC2 instances in private subnets with Auto Scaling
4. Application Load Balancer
5. RDS Multi-AZ MySQL database
6. Proper security groups
7. IAM roles and policies
8. All required parameters and outputs

Let me structure this carefully, ensuring all requirements are met:

- VPC with 10.0.0.0/16
- 6 subnets total (2 public, 2 private, 2 database)
- NAT Gateways in each public subnet
- EC2 instances only in private subnets
- Auto Scaling with Launch Template
- ALB in public subnets
- RDS Multi-AZ in database subnets
- Proper security groups for each tier
- IAM role for EC2 instances
- All required parameters and outputs

I'll create a comprehensive CloudFormation template in JSON format.

### Answer

---

# Complete CloudFormation Template for Highly Available Web Application

Below is a production-ready CloudFormation template that implements all the specified requirements for a highly available web application infrastructure on AWS.

## CloudFormation Template (JSON)

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Production-ready highly available web application infrastructure with Auto Scaling, RDS Multi-AZ, and strict security controls",

  "Parameters": {
    "EnvironmentName": {
      "Description": "Environment name (dev/staging/prod)",
      "Type": "String",
      "AllowedValues": ["dev", "staging", "prod"],
      "Default": "prod"
    },
    "KeyPairName": {
      "Description": "EC2 Key Pair name for SSH access",
      "Type": "AWS::EC2::KeyPair::KeyName",
      "ConstraintDescription": "Must be the name of an existing EC2 KeyPair"
    },
    "CertificateArn": {
      "Description": "ACM Certificate ARN for HTTPS listener",
      "Type": "String",
      "MinLength": 1
    },
    "DatabaseUsername": {
      "Description": "RDS master username",
      "Type": "String",
      "MinLength": 1,
      "MaxLength": 16,
      "AllowedPattern": "[a-zA-Z][a-zA-Z0-9]*",
      "ConstraintDescription": "Must begin with a letter and contain only alphanumeric characters"
    },
    "DatabasePassword": {
      "Description": "RDS master password",
      "Type": "String",
      "MinLength": 8,
      "MaxLength": 41,
      "AllowedPattern": "[a-zA-Z0-9]*",
      "NoEcho": true,
      "ConstraintDescription": "Must contain only alphanumeric characters"
    }
  },

  "Mappings": {
    "RegionAMI": {
      "us-west-2": {
        "AMI": "ami-0c2d06d50ce30b442"
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
            "Value": { "Fn::Sub": "${EnvironmentName}-VPC" }
          },
          {
            "Key": "Environment",
            "Value": { "Ref": "EnvironmentName" }
          },
          {
            "Key": "Project",
            "Value": "WebApplication"
          },
          {
            "Key": "Owner",
            "Value": "DevOps"
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
            "Value": { "Fn::Sub": "${EnvironmentName}-IGW" }
          },
          {
            "Key": "Environment",
            "Value": { "Ref": "EnvironmentName" }
          }
        ]
      }
    },

    "InternetGatewayAttachment": {
      "Type": "AWS::EC2::VPCGatewayAttachment",
      "Properties": {
        "InternetGatewayId": { "Ref": "InternetGateway" },
        "VpcId": { "Ref": "VPC" }
      }
    },

    "PublicSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "AvailabilityZone": { "Fn::Select": [0, { "Fn::GetAZs": "" }] },
        "CidrBlock": "10.0.1.0/24",
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "${EnvironmentName}-Public-Subnet-AZ1" }
          },
          {
            "Key": "Environment",
            "Value": { "Ref": "EnvironmentName" }
          }
        ]
      }
    },

    "PublicSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "AvailabilityZone": { "Fn::Select": [1, { "Fn::GetAZs": "" }] },
        "CidrBlock": "10.0.2.0/24",
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "${EnvironmentName}-Public-Subnet-AZ2" }
          },
          {
            "Key": "Environment",
            "Value": { "Ref": "EnvironmentName" }
          }
        ]
      }
    },

    "PrivateSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "AvailabilityZone": { "Fn::Select": [0, { "Fn::GetAZs": "" }] },
        "CidrBlock": "10.0.10.0/24",
        "MapPublicIpOnLaunch": false,
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "${EnvironmentName}-Private-Subnet-AZ1" }
          },
          {
            "Key": "Environment",
            "Value": { "Ref": "EnvironmentName" }
          }
        ]
      }
    },

    "PrivateSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "AvailabilityZone": { "Fn::Select": [1, { "Fn::GetAZs": "" }] },
        "CidrBlock": "10.0.11.0/24",
        "MapPublicIpOnLaunch": false,
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "${EnvironmentName}-Private-Subnet-AZ2" }
          },
          {
            "Key": "Environment",
            "Value": { "Ref": "EnvironmentName" }
          }
        ]
      }
    },

    "DatabaseSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "AvailabilityZone": { "Fn::Select": [0, { "Fn::GetAZs": "" }] },
        "CidrBlock": "10.0.20.0/24",
        "MapPublicIpOnLaunch": false,
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "${EnvironmentName}-Database-Subnet-AZ1" }
          },
          {
            "Key": "Environment",
            "Value": { "Ref": "EnvironmentName" }
          }
        ]
      }
    },

    "DatabaseSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "AvailabilityZone": { "Fn::Select": [1, { "Fn::GetAZs": "" }] },
        "CidrBlock": "10.0.21.0/24",
        "MapPublicIpOnLaunch": false,
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "${EnvironmentName}-Database-Subnet-AZ2" }
          },
          {
            "Key": "Environment",
            "Value": { "Ref": "EnvironmentName" }
          }
        ]
      }
    },

    "NatGateway1EIP": {
      "Type": "AWS::EC2::EIP",
      "DependsOn": "InternetGatewayAttachment",
      "Properties": {
        "Domain": "vpc",
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "${EnvironmentName}-NAT-EIP-AZ1" }
          }
        ]
      }
    },

    "NatGateway2EIP": {
      "Type": "AWS::EC2::EIP",
      "DependsOn": "InternetGatewayAttachment",
      "Properties": {
        "Domain": "vpc",
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "${EnvironmentName}-NAT-EIP-AZ2" }
          }
        ]
      }
    },

    "NatGateway1": {
      "Type": "AWS::EC2::NatGateway",
      "Properties": {
        "AllocationId": { "Fn::GetAtt": ["NatGateway1EIP", "AllocationId"] },
        "SubnetId": { "Ref": "PublicSubnet1" },
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "${EnvironmentName}-NAT-Gateway-AZ1" }
          }
        ]
      }
    },

    "NatGateway2": {
      "Type": "AWS::EC2::NatGateway",
      "Properties": {
        "AllocationId": { "Fn::GetAtt": ["NatGateway2EIP", "AllocationId"] },
        "SubnetId": { "Ref": "PublicSubnet2" },
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "${EnvironmentName}-NAT-Gateway-AZ2" }
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
            "Value": { "Fn::Sub": "${EnvironmentName}-Public-Routes" }
          }
        ]
      }
    },

    "DefaultPublicRoute": {
      "Type": "AWS::EC2::Route",
      "DependsOn": "InternetGatewayAttachment",
      "Properties": {
        "RouteTableId": { "Ref": "PublicRouteTable" },
        "DestinationCidrBlock": "0.0.0.0/0",
        "GatewayId": { "Ref": "InternetGateway" }
      }
    },

    "PublicSubnet1RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "RouteTableId": { "Ref": "PublicRouteTable" },
        "SubnetId": { "Ref": "PublicSubnet1" }
      }
    },

    "PublicSubnet2RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "RouteTableId": { "Ref": "PublicRouteTable" },
        "SubnetId": { "Ref": "PublicSubnet2" }
      }
    },

    "PrivateRouteTable1": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "${EnvironmentName}-Private-Routes-AZ1" }
          }
        ]
      }
    },

    "DefaultPrivateRoute1": {
      "Type": "AWS::EC2::Route",
      "Properties": {
        "RouteTableId": { "Ref": "PrivateRouteTable1" },
        "DestinationCidrBlock": "0.0.0.0/0",
        "NatGatewayId": { "Ref": "NatGateway1" }
      }
    },

    "PrivateSubnet1RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "RouteTableId": { "Ref": "PrivateRouteTable1" },
        "SubnetId": { "Ref": "PrivateSubnet1" }
      }
    },

    "PrivateRouteTable2": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "${EnvironmentName}-Private-Routes-AZ2" }
          }
        ]
      }
    },

    "DefaultPrivateRoute2": {
      "Type": "AWS::EC2::Route",
      "Properties": {
        "RouteTableId": { "Ref": "PrivateRouteTable2" },
        "DestinationCidrBlock": "0.0.0.0/0",
        "NatGatewayId": { "Ref": "NatGateway2" }
      }
    },

    "PrivateSubnet2RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "RouteTableId": { "Ref": "PrivateRouteTable2" },
        "SubnetId": { "Ref": "PrivateSubnet2" }
      }
    },

    "DatabaseSubnet1RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "RouteTableId": { "Ref": "PrivateRouteTable1" },
        "SubnetId": { "Ref": "DatabaseSubnet1" }
      }
    },

    "DatabaseSubnet2RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "RouteTableId": { "Ref": "PrivateRouteTable2" },
        "SubnetId": { "Ref": "DatabaseSubnet2" }
      }
    },

    "ALBSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupName": { "Fn::Sub": "${EnvironmentName}-ALB-SG" },
        "GroupDescription": "Security group for Application Load Balancer",
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
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "${EnvironmentName}-ALB-SG" }
          },
          {
            "Key": "Environment",
            "Value": { "Ref": "EnvironmentName" }
          }
        ]
      }
    },

    "EC2SecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupName": { "Fn::Sub": "${EnvironmentName}-EC2-SG" },
        "GroupDescription": "Security group for EC2 instances",
        "VpcId": { "Ref": "VPC" },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 80,
            "ToPort": 80,
            "SourceSecurityGroupId": { "Ref": "ALBSecurityGroup" },
            "Description": "Allow HTTP from ALB only"
          }
        ],
        "SecurityGroupEgress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 443,
            "ToPort": 443,
            "CidrIp": "0.0.0.0/0",
            "Description": "Allow HTTPS for updates"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "${EnvironmentName}-EC2-SG" }
          },
          {
            "Key": "Environment",
            "Value": { "Ref": "EnvironmentName" }
          }
        ]
      }
    },

    "EC2SecurityGroupEgressToRDS": {
      "Type": "AWS::EC2::SecurityGroupEgress",
      "Properties": {
        "GroupId": { "Ref": "EC2SecurityGroup" },
        "IpProtocol": "tcp",
        "FromPort": 3306,
        "ToPort": 3306,
        "DestinationSecurityGroupId": { "Ref": "RDSSecurityGroup" },
        "Description": "Allow MySQL to RDS"
      }
    },

    "ALBSecurityGroupEgressToEC2": {
      "Type": "AWS::EC2::SecurityGroupEgress",
      "Properties": {
        "GroupId": { "Ref": "ALBSecurityGroup" },
        "IpProtocol": "tcp",
        "FromPort": 80,
        "ToPort": 80,
        "DestinationSecurityGroupId": { "Ref": "EC2SecurityGroup" },
        "Description": "Allow HTTP to EC2 instances"
      }
    },

    "RDSSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupName": { "Fn::Sub": "${EnvironmentName}-RDS-SG" },
        "GroupDescription": "Security group for RDS database",
        "VpcId": { "Ref": "VPC" },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 3306,
            "ToPort": 3306,
            "SourceSecurityGroupId": { "Ref": "EC2SecurityGroup" },
            "Description": "Allow MySQL from EC2 instances only"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "${EnvironmentName}-RDS-SG" }
          },
          {
            "Key": "Environment",
            "Value": { "Ref": "EnvironmentName" }
          }
        ]
      }
    },

    "EC2Role": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": { "Fn::Sub": "${EnvironmentName}-EC2-Role" },
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
          "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
        ],
        "Policies": [
          {
            "PolicyName": "S3ReadPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": ["s3:GetObject", "s3:ListBucket"],
                  "Resource": [
                    "arn:aws:s3:::my-application-bucket/*",
                    "arn:aws:s3:::my-application-bucket"
                  ]
                }
              ]
            }
          },
          {
            "PolicyName": "CloudWatchLogsPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents",
                    "logs:DescribeLogStreams"
                  ],
                  "Resource": "arn:aws:logs:*:*:*"
                }
              ]
            }
          }
        ],
        "Tags": [
          {
            "Key": "Environment",
            "Value": { "Ref": "EnvironmentName" }
          }
        ]
      }
    },

    "EC2InstanceProfile": {
      "Type": "AWS::IAM::InstanceProfile",
      "Properties": {
        "InstanceProfileName": {
          "Fn::Sub": "${EnvironmentName}-EC2-InstanceProfile"
        },
        "Roles": [{ "Ref": "EC2Role" }]
      }
    },

    "LaunchTemplate": {
      "Type": "AWS::EC2::LaunchTemplate",
      "Properties": {
        "LaunchTemplateName": {
          "Fn::Sub": "${EnvironmentName}-LaunchTemplate"
        },
        "LaunchTemplateData": {
          "ImageId": {
            "Fn::FindInMap": ["RegionAMI", { "Ref": "AWS::Region" }, "AMI"]
          },
          "InstanceType": "t3.medium",
          "KeyName": { "Ref": "KeyPairName" },
          "IamInstanceProfile": {
            "Arn": { "Fn::GetAtt": ["EC2InstanceProfile", "Arn"] }
          },
          "SecurityGroupIds": [{ "Ref": "EC2SecurityGroup" }],
          "BlockDeviceMappings": [
            {
              "DeviceName": "/dev/xvda",
              "Ebs": {
                "VolumeSize": 20,
                "VolumeType": "gp3",
                "Encrypted": true,
                "DeleteOnTermination": true
              }
            },
            {
              "DeviceName": "/dev/xvdf",
              "Ebs": {
                "VolumeSize": 100,
                "VolumeType": "gp3",
                "Encrypted": true,
                "DeleteOnTermination": true
              }
            }
          ],
          "Monitoring": {
            "Enabled": true
          },
          "UserData": {
            "Fn::Base64": {
              "Fn::Join": [
                "",
                [
                  "#!/bin/bash\n",
                  "yum update -y\n",
                  "yum install -y httpd\n",
                  "systemctl start httpd\n",
                  "systemctl enable httpd\n",
                  "echo '<html><body><h1>Healthy</h1></body></html>' > /var/www/html/health\n",
                  "echo '<html><body><h1>Welcome to ",
                  { "Ref": "EnvironmentName" },
                  " Environment</h1></body></html>' > /var/www/html/index.html\n",
                  "chmod 644 /var/www/html/health\n",
                  "chmod 644 /var/www/html/index.html\n"
                ]
              ]
            }
          },
          "TagSpecifications": [
            {
              "ResourceType": "instance",
              "Tags": [
                {
                  "Key": "Name",
                  "Value": { "Fn::Sub": "${EnvironmentName}-WebServer" }
                },
                {
                  "Key": "Environment",
                  "Value": { "Ref": "EnvironmentName" }
                },
                {
                  "Key": "Project",
                  "Value": "WebApplication"
                },
                {
                  "Key": "Owner",
                  "Value": "DevOps"
                }
              ]
            },
            {
              "ResourceType": "volume",
              "Tags": [
                {
                  "Key": "Name",
                  "Value": { "Fn::Sub": "${EnvironmentName}-WebServer-Volume" }
                },
                {
                  "Key": "Environment",
                  "Value": { "Ref": "EnvironmentName" }
                }
              ]
            }
          ]
        }
      }
    },

    "ApplicationLoadBalancer": {
      "Type": "AWS::ElasticLoadBalancingV2::LoadBalancer",
      "Properties": {
        "Name": { "Fn::Sub": "${EnvironmentName}-ALB" },
        "Type": "application",
        "Scheme": "internet-facing",
        "SecurityGroups": [{ "Ref": "ALBSecurityGroup" }],
        "Subnets": [{ "Ref": "PublicSubnet1" }, { "Ref": "PublicSubnet2" }],
        "Tags": [
          {
            "Key": "Environment",
            "Value": { "Ref": "EnvironmentName" }
          },
          {
            "Key": "Project",
            "Value": "WebApplication"
          }
        ]
      }
    },

    "ALBTargetGroup": {
      "Type": "AWS::ElasticLoadBalancingV2::TargetGroup",
      "Properties": {
        "Name": { "Fn::Sub": "${EnvironmentName}-TG" },
        "Port": 80,
        "Protocol": "HTTP",
        "VpcId": { "Ref": "VPC" },
        "TargetType": "instance",
        "HealthCheckEnabled": true,
        "HealthCheckPath": "/health",
        "HealthCheckProtocol": "HTTP",
        "HealthCheckIntervalSeconds": 30,
        "HealthCheckTimeoutSeconds": 5,
        "HealthyThresholdCount": 2,
        "UnhealthyThresholdCount": 3,
        "Matcher": {
          "HttpCode": "200"
        },
        "TargetGroupAttributes": [
          {
            "Key": "stickiness.enabled",
            "Value": "true"
          },
          {
            "Key": "stickiness.type",
            "Value": "lb_cookie"
          },
          {
            "Key": "stickiness.lb_cookie.duration_seconds",
            "Value": "86400"
          },
          {
            "Key": "deregistration_delay.timeout_seconds",
            "Value": "30"
          }
        ],
        "Tags": [
          {
            "Key": "Environment",
            "Value": { "Ref": "EnvironmentName" }
          }
        ]
      }
    },

    "ALBListenerHTTP": {
      "Type": "AWS::ElasticLoadBalancingV2::Listener",
      "Properties": {
        "DefaultActions": [
          {
            "Type": "forward",
            "TargetGroupArn": { "Ref": "ALBTargetGroup" }
          }
        ],
        "LoadBalancerArn": { "Ref": "ApplicationLoadBalancer" },
        "Port": 80,
        "Protocol": "HTTP"
      }
    },

    "ALBListenerHTTPS": {
      "Type": "AWS::ElasticLoadBalancingV2::Listener",
      "Properties": {
        "DefaultActions": [
          {
            "Type": "forward",
            "TargetGroupArn": { "Ref": "ALBTargetGroup" }
          }
        ],
        "LoadBalancerArn": { "Ref": "ApplicationLoadBalancer" },
        "Port": 443,
        "Protocol": "HTTPS",
        "Certificates": [
          {
            "CertificateArn": { "Ref": "CertificateArn" }
          }
        ],
        "SslPolicy": "ELBSecurityPolicy-TLS-1-2-2017-01"
      }
    },

    "AutoScalingGroup": {
      "Type": "AWS::AutoScaling::AutoScalingGroup",
      "Properties": {
        "AutoScalingGroupName": { "Fn::Sub": "${EnvironmentName}-ASG" },
        "VPCZoneIdentifier": [
          { "Ref": "PrivateSubnet1" },
          { "Ref": "PrivateSubnet2" }
        ],
        "LaunchTemplate": {
          "LaunchTemplateId": { "Ref": "LaunchTemplate" },
          "Version": "$Latest"
        },
        "MinSize": "2",
        "DesiredCapacity": "4",
        "MaxSize": "10",
        "TargetGroupARNs": [{ "Ref": "ALBTargetGroup" }],
        "HealthCheckType": "ELB",
        "HealthCheckGracePeriod": 300,
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "${EnvironmentName}-ASG-Instance" },
            "PropagateAtLaunch": true
          },
          {
            "Key": "Environment",
            "Value": { "Ref": "EnvironmentName" },
            "PropagateAtLaunch": true
          }
        ]
      },
      "UpdatePolicy": {
        "AutoScalingReplacingUpdate": {
          "WillReplace": true
        }
      }
    },

    "ScalingPolicy": {
      "Type": "AWS::AutoScaling::ScalingPolicy",
      "Properties": {
        "AutoScalingGroupName": { "Ref": "AutoScalingGroup" },
        "PolicyType": "TargetTrackingScaling",
        "TargetTrackingConfiguration": {
          "PredefinedMetricSpecification": {
            "PredefinedMetricType": "ASGAverageCPUUtilization"
          },
          "TargetValue": 70
        }
      }
    },

    "DBSubnetGroup": {
      "Type": "AWS::RDS::DBSubnetGroup",
      "Properties": {
        "DBSubnetGroupName": { "Fn::Sub": "${EnvironmentName}-DBSubnetGroup" },
        "DBSubnetGroupDescription": "Subnet group for RDS database",
        "SubnetIds": [
          { "Ref": "DatabaseSubnet1" },
          { "Ref": "DatabaseSubnet2" }
        ],
        "Tags": [
          {
            "Key": "Environment",
            "Value": { "Ref": "EnvironmentName" }
          }
        ]
      }
    },

    "RDSDatabase": {
      "Type": "AWS::RDS::DBInstance",
      "DeletionPolicy": "Snapshot",
      "UpdateReplacePolicy": "Snapshot",
      "Properties": {
        "DBInstanceIdentifier": { "Fn::Sub": "${EnvironmentName}-mysql-db" },
        "DBInstanceClass": "db.t3.medium",
        "Engine": "mysql",
        "EngineVersion": "8.0",
        "MasterUsername": { "Ref": "DatabaseUsername" },
        "MasterUserPassword": { "Ref": "DatabasePassword" },
        "AllocatedStorage": "100",
        "StorageType": "gp3",
        "StorageEncrypted": true,
        "MaxAllocatedStorage": 500,
        "DBSubnetGroupName": { "Ref": "DBSubnetGroup" },
        "VPCSecurityGroups": [{ "Ref": "RDSSecurityGroup" }],
        "MultiAZ": true,
        "BackupRetentionPeriod": 7,
        "PreferredBackupWindow": "03:00-04:00",
        "PreferredMaintenanceWindow": "sun:04:00-sun:05:00",
        "EnableCloudwatchLogsExports": ["error", "general", "slowquery"],
        "PubliclyAccessible": false,
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "${EnvironmentName}-MySQL-Database" }
          },
          {
            "Key": "Environment",
            "Value": { "Ref": "EnvironmentName" }
          },
          {
            "Key": "Project",
            "Value": "WebApplication"
          },
          {
            "Key": "Owner",
            "Value": "DevOps"
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
    "PublicSubnetIds": {
      "Description": "Comma-delimited list of public subnet IDs",
      "Value": {
        "Fn::Join": [
          ",",
          [{ "Ref": "PublicSubnet1" }, { "Ref": "PublicSubnet2" }]
        ]
      },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-Public-Subnets" }
      }
    },
    "PrivateSubnetIds": {
      "Description": "Comma-delimited list of private subnet IDs",
      "Value": {
        "Fn::Join": [
          ",",
          [{ "Ref": "PrivateSubnet1" }, { "Ref": "PrivateSubnet2" }]
        ]
      },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-Private-Subnets" }
      }
    },
    "ALBDNSName": {
      "Description": "Application Load Balancer DNS Name",
      "Value": { "Fn::GetAtt": ["ApplicationLoadBalancer", "DNSName"] },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-ALB-DNS" }
      }
    },
    "ALBHostedZoneId": {
      "Description": "Application Load Balancer Hosted Zone ID",
      "Value": {
        "Fn::GetAtt": ["ApplicationLoadBalancer", "CanonicalHostedZoneID"]
      },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-ALB-HostedZoneID" }
      }
    },
    "RDSEndpoint": {
      "Description": "RDS Database Endpoint Address",
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
    },
    "AutoScalingGroupName": {
      "Description": "Auto Scaling Group Name",
      "Value": { "Ref": "AutoScalingGroup" },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-ASG-Name" }
      }
    },
    "EC2SecurityGroupId": {
      "Description": "EC2 Security Group ID",
      "Value": { "Ref": "EC2SecurityGroup" },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-EC2-SG-ID" }
      }
    },
    "IAMRoleArn": {
      "Description": "EC2 IAM Role ARN",
      "Value": { "Fn::GetAtt": ["EC2Role", "Arn"] },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-IAM-Role-ARN" }
      }
    }
  }
}
```

## Key Features Implemented

### 1. **Network Architecture**

- VPC with proper CIDR blocks and subnet segmentation
- Multi-AZ deployment across 2 availability zones
- NAT Gateways in each AZ for high availability
- Proper route table configuration for each subnet type

### 2. **Security Implementation**

- **Zero Trust Network**: EC2 instances in private subnets only
- **No public IPs** on EC2 instances
- **Layered Security Groups**: Restrictive ingress/egress rules
- **Encrypted Storage**: All EBS volumes and RDS storage encrypted
- **IAM Roles**: Least privilege access with specific policies

### 3. **High Availability**

- Auto Scaling Group with health checks
- Multi-AZ RDS deployment
- Load balancer across multiple AZs
- NAT Gateway redundancy

### 4. **Monitoring & Management**

- Detailed monitoring enabled on EC2
- CloudWatch Logs integration
- Systems Manager access via IAM role
- Proper tagging for cost tracking

### 5. **Best Practices**

- Deletion protection on critical resources (RDS snapshot policy)
- Instance refresh capability for deployments
- Sticky sessions for stateful applications
- Proper health check configuration

## Deployment Instructions

1. **Prerequisites**:
   - Create an EC2 Key Pair in the target region
   - Obtain an ACM certificate for HTTPS
   - Ensure you have appropriate AWS permissions

2. **Deploy the stack**:

```bash
aws cloudformation create-stack \
  --stack-name production-web-app \
  --template-body file://template.json \
  --parameters \
    ParameterKey=EnvironmentName,ParameterValue=prod \
    ParameterKey=KeyPairName,ParameterValue=your-key-pair \
    ParameterKey=CertificateArn,ParameterValue=arn:aws:acm:... \
    ParameterKey=DatabaseUsername,ParameterValue=admin \
    ParameterKey=DatabasePassword,ParameterValue=YourSecurePassword123 \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-west-2
```

3. **Verify deployment**:
   - Check CloudFormation stack status
   - Verify EC2 instances are in private subnets
   - Test ALB health checks
   - Confirm RDS Multi-AZ status

This template provides a production-ready, secure, and scalable infrastructure that meets all specified requirements while following AWS best practices and the Well-Architected Framework principles.

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Complete CI/CD Pipeline for Microservices Deployment with VPC, EC2, CodePipeline, CodeBuild, and CodeDeploy",
  "Metadata": {
    "AWS::CloudFormation::Interface": {
      "ParameterGroups": [
        {
          "Label": {
            "default": "Project Configuration"
          },
          "Parameters": [
            "ProjectName",
            "GitHubRepoOwner",
            "GitHubRepoName",
            "GitHubBranch"
          ]
        },
        {
          "Label": {
            "default": "Infrastructure Configuration"
          },
          "Parameters": [
            "InstanceType",
            "KeyPairName",
            "MinInstances",
            "MaxInstances"
          ]
        },
        {
          "Label": {
            "default": "GitHub Integration"
          },
          "Parameters": [
            "GitHubToken"
          ]
        }
      ]
    }
  },
  "Parameters": {
    "ProjectName": {
      "Type": "String",
      "Default": "corp-microservices-pipeline",
      "Description": "Name of the project for resource naming"
    },
    "GitHubRepoOwner": {
      "Type": "String",
      "Description": "GitHub repository owner/organization name",
      "Default": "TuringGpt"
    },
    "GitHubRepoName": {
      "Type": "String",
      "Description": "GitHub repository name",
      "Default": "iac-test-automations"
    },
    "GitHubBranch": {
      "Type": "String",
      "Description": "GitHub branch to track",
      "Default": "IAC-284667"
    },
    "GitHubToken": {
      "Type": "String",
      "NoEcho": true,
      "Default": "{{resolve:secretsmanager:arn:aws:secretsmanager:us-east-1:718240086340:secret:turing/github-token-291160-VLtRP9}}",
      "Description": "GitHub personal access token for CodePipeline integration"
    },
    "InstanceType": {
      "Type": "String",
      "Default": "t3.medium",
      "AllowedValues": [
        "t3.small",
        "t3.medium",
        "t3.large"
      ],
      "Description": "EC2 instance type for deployment targets"
    },
    "KeyPairName": {
      "Type": "AWS::EC2::KeyPair::KeyName",
      "Default": "iac-291160-keypair",
      "Description": "EC2 Key Pair for SSH access to instances"
    },
    "MinInstances": {
      "Type": "Number",
      "Default": 2,
      "MinValue": 1,
      "MaxValue": 10,
      "Description": "Minimum number of EC2 instances in Auto Scaling Group"
    },
    "MaxInstances": {
      "Type": "Number",
      "Default": 6,
      "MinValue": 1,
      "MaxValue": 20,
      "Description": "Maximum number of EC2 instances in Auto Scaling Group"
    },
    "EnvironmentSuffix": {
      "Type": "String",
      "Default": "dev",
      "Description": "Environment suffix for resource naming"
    }
  },
  "Mappings": {
    "RegionMap": {
      "us-east-1": {
        "AMI": "ami-0c02fb55956c7d316"
      }
    }
  },
  "Resources": {
    "CorpVPC": {
      "Type": "AWS::EC2::VPC",
      "Properties": {
        "CidrBlock": "10.0.0.0/16",
        "EnableDnsHostnames": true,
        "EnableDnsSupport": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "${ProjectName}-vpc"
            }
          }
        ]
      }
    },
    "CorpInternetGateway": {
      "Type": "AWS::EC2::InternetGateway",
      "Properties": {
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "${ProjectName}-igw"
            }
          }
        ]
      }
    },
    "CorpVPCGatewayAttachment": {
      "Type": "AWS::EC2::VPCGatewayAttachment",
      "Properties": {
        "VpcId": {
          "Ref": "CorpVPC"
        },
        "InternetGatewayId": {
          "Ref": "CorpInternetGateway"
        }
      }
    },
    "CorpPublicSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "CorpVPC"
        },
        "CidrBlock": "10.0.1.0/24",
        "AvailabilityZone": {
          "Fn::Select": [
            "0",
            {
              "Fn::GetAZs": {
                "Ref": "AWS::Region"
              }
            }
          ]
        },
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "${ProjectName}-public-subnet-1"
            }
          }
        ]
      }
    },
    "CorpPublicSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "CorpVPC"
        },
        "CidrBlock": "10.0.2.0/24",
        "AvailabilityZone": {
          "Fn::Select": [
            "1",
            {
              "Fn::GetAZs": {
                "Ref": "AWS::Region"
              }
            }
          ]
        },
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "${ProjectName}-public-subnet-2"
            }
          }
        ]
      }
    },
    "CorpPrivateSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "CorpVPC"
        },
        "CidrBlock": "10.0.3.0/24",
        "AvailabilityZone": {
          "Fn::Select": [
            "0",
            {
              "Fn::GetAZs": {
                "Ref": "AWS::Region"
              }
            }
          ]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "${ProjectName}-private-subnet-1"
            }
          }
        ]
      }
    },
    "CorpPrivateSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "CorpVPC"
        },
        "CidrBlock": "10.0.4.0/24",
        "AvailabilityZone": {
          "Fn::Select": [
            "1",
            {
              "Fn::GetAZs": {
                "Ref": "AWS::Region"
              }
            }
          ]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "${ProjectName}-private-subnet-2"
            }
          }
        ]
      }
    },
    "CorpNATGatewayEIP": {
      "Type": "AWS::EC2::EIP",
      "DependsOn": "CorpVPCGatewayAttachment",
      "Properties": {
        "Domain": "vpc",
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "${ProjectName}-nat-eip"
            }
          }
        ]
      }
    },
    "CorpNATGateway": {
      "Type": "AWS::EC2::NatGateway",
      "Properties": {
        "AllocationId": {
          "Fn::GetAtt": [
            "CorpNATGatewayEIP",
            "AllocationId"
          ]
        },
        "SubnetId": {
          "Ref": "CorpPublicSubnet1"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "${ProjectName}-nat-gateway"
            }
          }
        ]
      }
    },
    "CorpPublicRouteTable": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": {
          "Ref": "CorpVPC"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "${ProjectName}-public-rt"
            }
          }
        ]
      }
    },
    "CorpPrivateRouteTable": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": {
          "Ref": "CorpVPC"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "${ProjectName}-private-rt"
            }
          }
        ]
      }
    },
    "CorpPublicRoute": {
      "Type": "AWS::EC2::Route",
      "DependsOn": "CorpVPCGatewayAttachment",
      "Properties": {
        "RouteTableId": {
          "Ref": "CorpPublicRouteTable"
        },
        "DestinationCidrBlock": "0.0.0.0/0",
        "GatewayId": {
          "Ref": "CorpInternetGateway"
        }
      }
    },
    "CorpPrivateRoute": {
      "Type": "AWS::EC2::Route",
      "Properties": {
        "RouteTableId": {
          "Ref": "CorpPrivateRouteTable"
        },
        "DestinationCidrBlock": "0.0.0.0/0",
        "NatGatewayId": {
          "Ref": "CorpNATGateway"
        }
      }
    },
    "CorpPublicSubnet1RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "CorpPublicSubnet1"
        },
        "RouteTableId": {
          "Ref": "CorpPublicRouteTable"
        }
      }
    },
    "CorpPublicSubnet2RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "CorpPublicSubnet2"
        },
        "RouteTableId": {
          "Ref": "CorpPublicRouteTable"
        }
      }
    },
    "CorpPrivateSubnet1RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "CorpPrivateSubnet1"
        },
        "RouteTableId": {
          "Ref": "CorpPrivateRouteTable"
        }
      }
    },
    "CorpPrivateSubnet2RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "CorpPrivateSubnet2"
        },
        "RouteTableId": {
          "Ref": "CorpPrivateRouteTable"
        }
      }
    },
    "CorpWebServerSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for web servers",
        "VpcId": {
          "Ref": "CorpVPC"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 80,
            "ToPort": 80,
            "SourceSecurityGroupId": {
              "Ref": "CorpLoadBalancerSecurityGroup"
            }
          },
          {
            "IpProtocol": "tcp",
            "FromPort": 443,
            "ToPort": 443,
            "SourceSecurityGroupId": {
              "Ref": "CorpLoadBalancerSecurityGroup"
            }
          },
          {
            "IpProtocol": "tcp",
            "FromPort": 22,
            "ToPort": 22,
            "CidrIp": "10.0.0.0/16"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "${ProjectName}-webserver-sg"
            }
          }
        ]
      }
    },
    "CorpLoadBalancerSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for Application Load Balancer",
        "VpcId": {
          "Ref": "CorpVPC"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 80,
            "ToPort": 80,
            "CidrIp": "0.0.0.0/0"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": 443,
            "ToPort": 443,
            "CidrIp": "0.0.0.0/0"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "${ProjectName}-alb-sg"
            }
          }
        ]
      }
    },
    "CorpCodePipelineServiceRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
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
            "PolicyName": "CodePipelineServicePolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:GetBucketVersioning",
                    "s3:GetObject",
                    "s3:GetObjectVersion",
                    "s3:PutObject"
                  ],
                  "Resource": [
                    {
                      "Fn::Sub": "arn:aws:s3:::${CorpArtifactStore}/*"
                    },
                    {
                      "Fn::GetAtt": [
                        "CorpArtifactStore",
                        "Arn"
                      ]
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
                      "CorpCodeBuildProject",
                      "Arn"
                    ]
                  }
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "codedeploy:CreateDeployment",
                    "codedeploy:GetApplication",
                    "codedeploy:GetApplicationRevision",
                    "codedeploy:GetDeployment",
                    "codedeploy:GetDeploymentConfig",
                    "codedeploy:RegisterApplicationRevision"
                  ],
                  "Resource": "*"
                }
              ]
            }
          }
        ]
      }
    },
    "CorpCodeBuildServiceRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
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
            "PolicyName": "CodeBuildServicePolicy",
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
                    "Fn::Sub": "arn:aws:logs:us-east-1:${AWS::AccountId}:log-group:/aws/codebuild/${ProjectName}*"
                  }
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:GetObject",
                    "s3:GetObjectVersion",
                    "s3:PutObject"
                  ],
                  "Resource": {
                    "Fn::Sub": "arn:aws:s3:::${CorpArtifactStore}/*"
                  }
                }
              ]
            }
          }
        ]
      }
    },
    "CorpCodeDeployServiceRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
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
          "arn:aws:iam::aws:policy/service-role/AWSCodeDeployRole"
        ]
      }
    },
    "CorpEC2InstanceRole": {
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
        "Policies": [
          {
            "PolicyName": "EC2CodeDeployPolicy",
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
                      "Fn::Sub": "arn:aws:s3:::${CorpArtifactStore}/*"
                    },
                    {
                      "Fn::GetAtt": [
                        "CorpArtifactStore",
                        "Arn"
                      ]
                    }
                  ]
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "codedeploy:*"
                  ],
                  "Resource": "*"
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "ec2messages:*",
                    "ssm:*"
                  ],
                  "Resource": "*"
                }
              ]
            }
          }
        ]
      }
    },
    "CorpEC2InstanceProfile": {
      "Type": "AWS::IAM::InstanceProfile",
      "Properties": {
        "Roles": [
          {
            "Ref": "CorpEC2InstanceRole"
          }
        ]
      }
    },
    "CorpArtifactStore": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "${ProjectName}-artifacts-${EnvironmentSuffix}-${AWS::AccountId}"
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
        }
      }
    },
    "CorpLaunchTemplate": {
      "Type": "AWS::EC2::LaunchTemplate",
      "Properties": {
        "LaunchTemplateName": {
          "Fn::Sub": "${ProjectName}-launch-template"
        },
        "LaunchTemplateData": {
          "ImageId": {
            "Fn::FindInMap": [
              "RegionMap",
              {
                "Ref": "AWS::Region"
              },
              "AMI"
            ]
          },
          "InstanceType": {
            "Ref": "InstanceType"
          },
          "KeyName": {
            "Ref": "KeyPairName"
          },
          "SecurityGroupIds": [
            {
              "Ref": "CorpWebServerSecurityGroup"
            }
          ],
          "IamInstanceProfile": {
            "Name": {
              "Ref": "CorpEC2InstanceProfile"
            }
          },
          "UserData": {
            "Fn::Base64": {
              "Fn::Sub": [
                "#!/bin/bash\nyum update -y\nyum install -y ruby wget\ncd /home/ec2-user\nwget https://aws-codedeploy-${AWS::Region}.s3.${AWS::Region}.amazonaws.com/latest/install\nchmod +x ./install\n./install auto\nservice codedeploy-agent start\nchkconfig codedeploy-agent on\n# Install application dependencies\nyum install -y docker\nservice docker start\nusermod -a -G docker ec2-user\nchkconfig docker on\n",
                {}
              ]
            }
          },
          "TagSpecifications": [
            {
              "ResourceType": "instance",
              "Tags": [
                {
                  "Key": "Name",
                  "Value": {
                    "Fn::Sub": "${ProjectName}-instance"
                  }
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
    "CorpAutoScalingGroup": {
      "Type": "AWS::AutoScaling::AutoScalingGroup",
      "Properties": {
        "AutoScalingGroupName": {
          "Fn::Sub": "${ProjectName}-asg"
        },
        "LaunchTemplate": {
          "LaunchTemplateId": {
            "Ref": "CorpLaunchTemplate"
          },
          "Version": {
            "Fn::GetAtt": [
              "CorpLaunchTemplate",
              "LatestVersionNumber"
            ]
          }
        },
        "MinSize": {
          "Ref": "MinInstances"
        },
        "MaxSize": {
          "Ref": "MaxInstances"
        },
        "DesiredCapacity": {
          "Ref": "MinInstances"
        },
        "VPCZoneIdentifier": [
          {
            "Ref": "CorpPrivateSubnet1"
          },
          {
            "Ref": "CorpPrivateSubnet2"
          }
        ],
        "TargetGroupARNs": [
          {
            "Ref": "CorpTargetGroup"
          }
        ],
        "HealthCheckType": "ELB",
        "HealthCheckGracePeriod": 300,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "${ProjectName}-asg"
            },
            "PropagateAtLaunch": false
          }
        ]
      }
    },
    "CorpApplicationLoadBalancer": {
      "Type": "AWS::ElasticLoadBalancingV2::LoadBalancer",
      "Properties": {
        "Name": {
          "Fn::Sub": "${ProjectName}-alb"
        },
        "Scheme": "internet-facing",
        "Type": "application",
        "Subnets": [
          {
            "Ref": "CorpPublicSubnet1"
          },
          {
            "Ref": "CorpPublicSubnet2"
          }
        ],
        "SecurityGroups": [
          {
            "Ref": "CorpLoadBalancerSecurityGroup"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "${ProjectName}-alb"
            }
          }
        ]
      }
    },
    "CorpTargetGroup": {
      "Type": "AWS::ElasticLoadBalancingV2::TargetGroup",
      "Properties": {
        "Name": {
          "Fn::Sub": "${ProjectName}-tg"
        },
        "Port": 80,
        "Protocol": "HTTP",
        "VpcId": {
          "Ref": "CorpVPC"
        },
        "HealthCheckPath": "/health",
        "HealthCheckProtocol": "HTTP",
        "HealthCheckIntervalSeconds": 30,
        "HealthCheckTimeoutSeconds": 5,
        "HealthyThresholdCount": 2,
        "UnhealthyThresholdCount": 3,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "${ProjectName}-tg"
            }
          }
        ]
      }
    },
    "CorpALBListener": {
      "Type": "AWS::ElasticLoadBalancingV2::Listener",
      "Properties": {
        "DefaultActions": [
          {
            "Type": "forward",
            "TargetGroupArn": {
              "Ref": "CorpTargetGroup"
            }
          }
        ],
        "LoadBalancerArn": {
          "Ref": "CorpApplicationLoadBalancer"
        },
        "Port": 80,
        "Protocol": "HTTP"
      }
    },
    "CorpCodeDeployApplication": {
      "Type": "AWS::CodeDeploy::Application",
      "Properties": {
        "ApplicationName": {
          "Fn::Sub": "${ProjectName}-application-${EnvironmentSuffix}"
        },
        "ComputePlatform": "Server"
      }
    },
    "CorpCodeDeployDeploymentGroup": {
      "Type": "AWS::CodeDeploy::DeploymentGroup",
      "Properties": {
        "ApplicationName": {
          "Ref": "CorpCodeDeployApplication"
        },
        "DeploymentGroupName": {
          "Fn::Sub": "${ProjectName}-deployment-group-${EnvironmentSuffix}"
        },
        "ServiceRoleArn": {
          "Fn::GetAtt": [
            "CorpCodeDeployServiceRole",
            "Arn"
          ]
        },
        "DeploymentConfigName": "CodeDeployDefault.OneAtATime",
        "AutoScalingGroups": [
          {
            "Ref": "CorpAutoScalingGroup"
          }
        ],
        "LoadBalancerInfo": {
          "TargetGroupInfoList": [
            {
              "Name": {
                "Fn::GetAtt": [
                  "CorpTargetGroup",
                  "TargetGroupName"
                ]
              }
            }
          ]
        },
        "AutoRollbackConfiguration": {
          "Enabled": true,
          "Events": [
            "DEPLOYMENT_FAILURE",
            "DEPLOYMENT_STOP_ON_ALARM"
          ]
        }
      }
    },
    "CorpCodeBuildProject": {
      "Type": "AWS::CodeBuild::Project",
      "Properties": {
        "Name": {
          "Fn::Sub": "${ProjectName}-build-${EnvironmentSuffix}"
        },
        "ServiceRole": {
          "Fn::GetAtt": [
            "CorpCodeBuildServiceRole",
            "Arn"
          ]
        },
        "Artifacts": {
          "Type": "CODEPIPELINE"
        },
        "Environment": {
          "Type": "LINUX_CONTAINER",
          "ComputeType": "BUILD_GENERAL1_MEDIUM",
          "Image": "aws/codebuild/amazonlinux2-x86_64-standard:3.0",
          "PrivilegedMode": true
        },
        "Source": {
          "Type": "CODEPIPELINE",
          "BuildSpec": {
            "Fn::Sub": "version: 0.2\nphases:\n  pre_build:\n    commands:\n      - echo Logging in to Amazon ECR...\n      - aws ecr get-login-password --region ${AWS::Region} | docker login --username AWS --password-stdin ${AWS::AccountId}.dkr.ecr.${AWS::Region}.amazonaws.com\n  build:\n    commands:\n      - echo Build started on `date`\n      - echo Building the application...\n      - # Add your build commands here\n      - # Example: docker build -t myapp .\n  post_build:\n    commands:\n      - echo Build completed on `date`\nartifacts:\n  files:\n    - '**/*'\n  name: BuildArtifact\n"
          }
        },
        "TimeoutInMinutes": 60
      }
    },
    "CorpCodePipeline": {
      "Type": "AWS::CodePipeline::Pipeline",
      "Properties": {
        "Name": {
          "Fn::Sub": "${ProjectName}-pipeline-${EnvironmentSuffix}"
        },
        "RoleArn": {
          "Fn::GetAtt": [
            "CorpCodePipelineServiceRole",
            "Arn"
          ]
        },
        "ArtifactStore": {
          "Type": "S3",
          "Location": {
            "Ref": "CorpArtifactStore"
          }
        },
        "Stages": [
          {
            "Name": "Source",
            "Actions": [
              {
                "Name": "SourceAction",
                "ActionTypeId": {
                  "Category": "Source",
                  "Owner": "ThirdParty",
                  "Provider": "GitHub",
                  "Version": "1"
                },
                "Configuration": {
                  "Owner": {
                    "Ref": "GitHubRepoOwner"
                  },
                  "Repo": {
                    "Ref": "GitHubRepoName"
                  },
                  "Branch": {
                    "Ref": "GitHubBranch"
                  },
                  "OAuthToken": {
                    "Ref": "GitHubToken"
                  },
                  "PollForSourceChanges": true
                },
                "OutputArtifacts": [
                  {
                    "Name": "SourceOutput"
                  }
                ]
              }
            ]
          },
          {
            "Name": "Build",
            "Actions": [
              {
                "Name": "BuildAction",
                "ActionTypeId": {
                  "Category": "Build",
                  "Owner": "AWS",
                  "Provider": "CodeBuild",
                  "Version": "1"
                },
                "Configuration": {
                  "ProjectName": {
                    "Ref": "CorpCodeBuildProject"
                  }
                },
                "InputArtifacts": [
                  {
                    "Name": "SourceOutput"
                  }
                ],
                "OutputArtifacts": [
                  {
                    "Name": "BuildOutput"
                  }
                ]
              }
            ]
          },
          {
            "Name": "Deploy",
            "Actions": [
              {
                "Name": "DeployAction",
                "ActionTypeId": {
                  "Category": "Deploy",
                  "Owner": "AWS",
                  "Provider": "CodeDeploy",
                  "Version": "1"
                },
                "Configuration": {
                  "ApplicationName": {
                    "Ref": "CorpCodeDeployApplication"
                  },
                  "DeploymentGroupName": {
                    "Fn::Sub": "${ProjectName}-deployment-group-${EnvironmentSuffix}"
                  }
                },
                "InputArtifacts": [
                  {
                    "Name": "BuildOutput"
                  }
                ]
              }
            ]
          }
        ]
      }
    }
  },
  "Outputs": {
    "VPCId": {
      "Description": "VPC ID",
      "Value": {
        "Ref": "CorpVPC"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-vpc-id"
        }
      }
    },
    "LoadBalancerDNS": {
      "Description": "Application Load Balancer DNS Name",
      "Value": {
        "Fn::GetAtt": [
          "CorpApplicationLoadBalancer",
          "DNSName"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-alb-dns"
        }
      }
    },
    "CodePipelineName": {
      "Description": "CodePipeline Name",
      "Value": {
        "Ref": "CorpCodePipeline"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-pipeline-name"
        }
      }
    },
    "ArtifactStoreBucket": {
      "Description": "S3 Bucket for Pipeline Artifacts",
      "Value": {
        "Ref": "CorpArtifactStore"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-artifact-store-bucket"
        }
      }
    }
  }
}
```
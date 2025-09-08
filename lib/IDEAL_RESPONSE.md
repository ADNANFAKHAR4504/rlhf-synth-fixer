### Reasoning Trace
---

Looking at the requirements, I need to create a complete CloudFormation template for a CI/CD pipeline that deploys to ECS with Blue/Green rollback capability. The key requirements include:

1. Parameters for ApplicationName, PipelineArtifactBucketName, SNSOperationsTopicNameOrArn, ECSClusterName, CodeBuildImage, GitRepository, and GitBranch
2. Conditional resource creation for S3 bucket, SNS topic, and ECS cluster
3. IAM roles with least privilege policies
4. CodeBuild projects for build and test stages
5. CodePipeline with Source, Test, Build, and Deploy stages
6. ECS cluster, service, and task definition
7. Rollback mechanism using ECS deployment configuration
8. CloudWatch Events for pipeline state changes
9. Security best practices including S3 public access blocking
10. Proper outputs and metadata for testing instructions

The main challenge is handling the CAPABILITY_NAMED_IAM requirement which occurs when IAM roles have explicit names. To make deployment smoother, I should remove explicit role names and let CloudFormation auto-generate them.

Additionally, I need to ensure the template is self-sufficient by including VPC resources instead of relying on imports, and use ECS deployment instead of CodeDeploy for simpler Blue/Green rollback.

### Answer 
---

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "CI/CD Pipeline for ECS deployment with Blue/Green rollback capability",
  "Parameters": {
    "ApplicationName": {
      "Type": "String",
      "Default": "my-app",
      "Description": "Name of the application"
    },
    "EnvironmentSuffix": {
      "Type": "String",
      "Default": "dev",
      "Description": "Environment suffix for stack name and resources",
      "AllowedPattern": "^[a-zA-Z0-9-]+$",
      "ConstraintDescription": "EnvironmentSuffix must contain only letters, numbers, and hyphens"
    },
    "PipelineArtifactBucketName": {
      "Type": "String",
      "Default": "",
      "Description": "S3 bucket name for pipeline artifacts. If empty, a new bucket will be created."
    },
    "SNSOperationsTopicNameOrArn": {
      "Type": "String",
      "Default": "pipeline-notifications",
      "Description": "SNS Topic name to create or ARN of existing topic for notifications"
    },
    "ECSClusterName": {
      "Type": "String",
      "Default": "",
      "Description": "ECS Cluster name. If empty, a new cluster will be created."
    },
    "CodeBuildImage": {
      "Type": "String",
      "Default": "aws/codebuild/standard:6.0",
      "Description": "CodeBuild container image"
    },
    "GitRepository": {
      "Type": "String",
      "Default": "https://github.com/example/example-repo",
      "Description": "Git repository URL"
    },
    "GitBranch": {
      "Type": "String",
      "Default": "main",
      "Description": "Git branch to build"
    },
    "ServiceDesiredCount": {
      "Type": "Number",
      "Default": 0,
      "Description": "Desired count for ECS service on stack create (set 0 if image not available at create time)"
    },
    "GitHubSecretArn": {
      "Type": "String",
      "Default": "",
      "Description": "ARN of existing GitHub token secret in Secrets Manager. If empty, will create a placeholder secret."
    }
  },
  "Conditions": {
    "CreateArtifactBucket": {
      "Fn::Equals": [
        {
          "Ref": "PipelineArtifactBucketName"
        },
        ""
      ]
    },
    "CreateSNSTopic": {
      "Fn::Not": [
        {
          "Fn::Equals": [
            {
              "Fn::Select": [
                0,
                {
                  "Fn::Split": [
                    ":",
                    {
                      "Fn::Sub": "${SNSOperationsTopicNameOrArn}::"
                    }
                  ]
                }
              ]
            },
            "arn"
          ]
        }
      ]
    },
    "CreateECSCluster": {
      "Fn::Equals": [
        {
          "Ref": "ECSClusterName"
        },
        ""
      ]
    },
    "CreateGitHubSecret": {
      "Fn::Equals": [
        {
          "Ref": "GitHubSecretArn"
        },
        ""
      ]
    }
  },
  "Resources": {
    "PipelineArtifactBucket": {
      "Type": "AWS::S3::Bucket",
      "Condition": "CreateArtifactBucket",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "${ApplicationName}-${EnvironmentSuffix}-artifacts-${AWS::AccountId}-${AWS::Region}"
        },
        "PublicAccessBlockConfiguration": {
          "BlockPublicAcls": true,
          "BlockPublicPolicy": true,
          "IgnorePublicAcls": true,
          "RestrictPublicBuckets": true
        },
        "VersioningConfiguration": {
          "Status": "Enabled"
        }
      }
    },
    "SNSOperationsTopic": {
      "Type": "AWS::SNS::Topic",
      "Condition": "CreateSNSTopic",
      "Properties": {
        "TopicName": {
          "Fn::Sub": "${ApplicationName}-${EnvironmentSuffix}-${SNSOperationsTopicNameOrArn}"
        }
      }
    },
    "ECSCluster": {
      "Type": "AWS::ECS::Cluster",
      "Condition": "CreateECSCluster",
      "Properties": {
        "ClusterName": {
          "Fn::Sub": "${ApplicationName}-${EnvironmentSuffix}-cluster"
        },
        "CapacityProviders": [
          "FARGATE"
        ]
      }
    },
    "GitHubTokenSecret": {
      "Type": "AWS::SecretsManager::Secret",
      "Condition": "CreateGitHubSecret",
      "Properties": {
        "Name": {
          "Fn::Sub": "${ApplicationName}-${EnvironmentSuffix}-github-token"
        },
        "Description": "GitHub personal access token for CodePipeline",
        "SecretString": "REPLACE_WITH_YOUR_GITHUB_TOKEN"
      }
    },
    "CodeBuildLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/aws/codebuild/${ApplicationName}-${EnvironmentSuffix}-build"
        },
        "RetentionInDays": 14
      }
    },
    "CodeBuildTestLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/aws/codebuild/${ApplicationName}-${EnvironmentSuffix}-test"
        },
        "RetentionInDays": 14
      }
    },
    "ECSLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/ecs/${ApplicationName}-${EnvironmentSuffix}"
        },
        "RetentionInDays": 30
      }
    },
    "DefaultVPC": {
      "Type": "AWS::EC2::VPC",
      "Properties": {
        "CidrBlock": "10.0.0.0/16",
        "EnableDnsHostnames": true,
        "EnableDnsSupport": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "${ApplicationName}-${EnvironmentSuffix}-vpc"
            }
          }
        ]
      }
    },
    "DefaultVPCInternetGateway": {
      "Type": "AWS::EC2::InternetGateway",
      "Properties": {
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "${ApplicationName}-${EnvironmentSuffix}-igw"
            }
          }
        ]
      }
    },
    "DefaultVPCGatewayAttachment": {
      "Type": "AWS::EC2::VPCGatewayAttachment",
      "Properties": {
        "VpcId": {
          "Ref": "DefaultVPC"
        },
        "InternetGatewayId": {
          "Ref": "DefaultVPCInternetGateway"
        }
      }
    },
    "PublicSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "DefaultVPC"
        },
        "CidrBlock": "10.0.1.0/24",
        "AvailabilityZone": {
          "Fn::Select": [
            0,
            {
              "Fn::GetAZs": ""
            }
          ]
        },
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "${ApplicationName}-${EnvironmentSuffix}-public-subnet-1"
            }
          }
        ]
      }
    },
    "PublicSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "DefaultVPC"
        },
        "CidrBlock": "10.0.2.0/24",
        "AvailabilityZone": {
          "Fn::Select": [
            1,
            {
              "Fn::GetAZs": ""
            }
          ]
        },
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "${ApplicationName}-${EnvironmentSuffix}-public-subnet-2"
            }
          }
        ]
      }
    },
    "PublicRouteTable": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": {
          "Ref": "DefaultVPC"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "${ApplicationName}-${EnvironmentSuffix}-public-rt"
            }
          }
        ]
      }
    },
    "PublicRoute": {
      "Type": "AWS::Route",
      "DependsOn": "DefaultVPCGatewayAttachment",
      "Properties": {
        "RouteTableId": {
          "Ref": "PublicRouteTable"
        },
        "DestinationCidrBlock": "0.0.0.0/0",
        "GatewayId": {
          "Ref": "DefaultVPCInternetGateway"
        }
      }
    },
    "PublicSubnet1RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "PublicSubnet1"
        },
        "RouteTableId": {
          "Ref": "PublicRouteTable"
        }
      }
    },
    "PublicSubnet2RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "PublicSubnet2"
        },
        "RouteTableId": {
          "Ref": "PublicRouteTable"
        }
      }
    },
    "CodePipelineServiceRole": {
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
            "PolicyName": "PipelineServiceRolePolicy",
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
                      "Fn::Sub": [
                        "${BucketArn}",
                        {
                          "BucketArn": {
                            "Fn::If": [
                              "CreateArtifactBucket",
                              {
                                "Fn::GetAtt": [
                                  "PipelineArtifactBucket",
                                  "Arn"
                                ]
                              },
                              {
                                "Fn::Sub": "arn:aws:s3:::${PipelineArtifactBucketName}"
                              }
                            ]
                          }
                        }
                      ]
                    },
                    {
                      "Fn::Sub": [
                        "${BucketArn}/*",
                        {
                          "BucketArn": {
                            "Fn::If": [
                              "CreateArtifactBucket",
                              {
                                "Fn::GetAtt": [
                                  "PipelineArtifactBucket",
                                  "Arn"
                                ]
                              },
                              {
                                "Fn::Sub": "arn:aws:s3:::${PipelineArtifactBucketName}"
                              }
                            ]
                          }
                        }
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
                  "Resource": [
                    {
                      "Fn::GetAtt": [
                        "CodeBuildProject",
                        "Arn"
                      ]
                    },
                    {
                      "Fn::GetAtt": [
                        "CodeBuildTestProject",
                        "Arn"
                      ]
                    }
                  ]
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "ecs:DescribeServices",
                    "ecs:DescribeTaskDefinition",
                    "ecs:DescribeTasks",
                    "ecs:ListTasks",
                    "ecs:RegisterTaskDefinition",
                    "ecs:UpdateService"
                  ],
                  "Resource": "*"
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "iam:PassRole"
                  ],
                  "Resource": "*",
                  "Condition": {
                    "StringLike": {
                      "iam:PassedToService": [
                        "ecs-tasks.amazonaws.com"
                      ]
                    }
                  }
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "sns:Publish"
                  ],
                  "Resource": {
                    "Fn::If": [
                      "CreateSNSTopic",
                      {
                        "Ref": "SNSOperationsTopic"
                      },
                      {
                        "Ref": "SNSOperationsTopicNameOrArn"
                      }
                    ]
                  }
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "secretsmanager:GetSecretValue"
                  ],
                  "Resource": {
                    "Fn::If": [
                      "CreateGitHubSecret",
                      {
                        "Ref": "GitHubTokenSecret"
                      },
                      {
                        "Ref": "GitHubSecretArn"
                      }
                    ]
                  }
                }
              ]
            }
          }
        ]
      }
    },
    "CodeBuildServiceRole": {
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
            "PolicyName": "CodeBuildServiceRolePolicy",
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
                  "Resource": [
                    {
                      "Fn::Sub": "${CodeBuildLogGroup}:*"
                    },
                    {
                      "Fn::Sub": "${CodeBuildTestLogGroup}:*"
                    }
                  ]
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:GetObject",
                    "s3:GetObjectVersion",
                    "s3:PutObject"
                  ],
                  "Resource": [
                    {
                      "Fn::Sub": [
                        "${BucketArn}/*",
                        {
                          "BucketArn": {
                            "Fn::If": [
                              "CreateArtifactBucket",
                              {
                                "Fn::GetAtt": [
                                  "PipelineArtifactBucket",
                                  "Arn"
                                ]
                              },
                              {
                                "Fn::Sub": "arn:aws:s3:::${PipelineArtifactBucketName}"
                              }
                            ]
                          }
                        }
                      ]
                    }
                  ]
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "ecr:BatchCheckLayerAvailability",
                    "ecr:GetDownloadUrlForLayer",
                    "ecr:BatchGetImage",
                    "ecr:GetAuthorizationToken",
                    "ecr:InitiateLayerUpload",
                    "ecr:UploadLayerPart",
                    "ecr:CompleteLayerUpload",
                    "ecr:PutImage"
                  ],
                  "Resource": "*"
                }
              ]
            }
          }
        ]
      }
    },
    "ECSTaskExecutionRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "ecs-tasks.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "ManagedPolicyArns": [
          "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
        ],
        "Policies": [
          {
            "PolicyName": "CloudWatchLogsPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "logs:CreateLogStream",
                    "logs:PutLogEvents"
                  ],
                  "Resource": {
                    "Fn::Sub": "${ECSLogGroup}:*"
                  }
                }
              ]
            }
          }
        ]
      }
    },
    "ECSTaskRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "ecs-tasks.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        }
      }
    },
    "CodeBuildProject": {
      "Type": "AWS::CodeBuild::Project",
      "Properties": {
        "Name": {
          "Fn::Sub": "${ApplicationName}-${EnvironmentSuffix}-build"
        },
        "ServiceRole": {
          "Fn::GetAtt": [
            "CodeBuildServiceRole",
            "Arn"
          ]
        },
        "Artifacts": {
          "Type": "CODEPIPELINE"
        },
        "Source": {
          "Type": "CODEPIPELINE",
          "BuildSpec": {
            "Fn::Sub": "version: 0.2\nphases:\n  pre_build:\n    commands:\n      - echo Logging in to Amazon ECR...\n      - aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com\n  build:\n    commands:\n      - echo Build started on `date`\n      - echo Building the Docker image...\n      - docker build -t $IMAGE_REPO_NAME:$IMAGE_TAG .\n      - docker tag $IMAGE_REPO_NAME:$IMAGE_TAG $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME:$IMAGE_TAG\n  post_build:\n    commands:\n      - echo Build completed on `date`\n      - echo Pushing the Docker image...\n      - docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME:$IMAGE_TAG\n      - echo Writing image definitions file...\n      - printf '[{\"name\":\"${ApplicationName}-${EnvironmentSuffix}-container\",\"imageUri\":\"%s\"}]' $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME:$IMAGE_TAG > imagedefinitions.json\nartifacts:\n  files:\n    - imagedefinitions.json"
          }
        },
        "Environment": {
          "Type": "LINUX_CONTAINER",
          "ComputeType": "BUILD_GENERAL1_MEDIUM",
          "Image": {
            "Ref": "CodeBuildImage"
          },
          "PrivilegedMode": true,
          "EnvironmentVariables": [
            {
              "Name": "AWS_DEFAULT_REGION",
              "Value": {
                "Ref": "AWS::Region"
              }
            },
            {
              "Name": "AWS_ACCOUNT_ID",
              "Value": {
                "Ref": "AWS::AccountId"
              }
            },
            {
              "Name": "IMAGE_REPO_NAME",
              "Value": {
                "Fn::Sub": "${ApplicationName}-${EnvironmentSuffix}"
              }
            },
            {
              "Name": "IMAGE_TAG",
              "Value": "latest"
            }
          ]
        },
        "LogsConfig": {
          "CloudWatchLogs": {
            "Status": "ENABLED",
            "GroupName": {
              "Ref": "CodeBuildLogGroup"
            }
          }
        }
      }
    },
    "CodeBuildTestProject": {
      "Type": "AWS::CodeBuild::Project",
      "Properties": {
        "Name": {
          "Fn::Sub": "${ApplicationName}-${EnvironmentSuffix}-test"
        },
        "ServiceRole": {
          "Fn::GetAtt": [
            "CodeBuildServiceRole",
            "Arn"
          ]
        },
        "Artifacts": {
          "Type": "CODEPIPELINE"
        },
        "Source": {
          "Type": "CODEPIPELINE",
          "BuildSpec": "version: 0.2\nphases:\n  install:\n    runtime-versions:\n      nodejs: 16\n  pre_build:\n    commands:\n      - echo Running tests...\n      - npm install\n  build:\n    commands:\n      - npm test\n  post_build:\n    commands:\n      - echo Tests completed on `date`"
        },
        "Environment": {
          "Type": "LINUX_CONTAINER",
          "ComputeType": "BUILD_GENERAL1_SMALL",
          "Image": {
            "Ref": "CodeBuildImage"
          }
        },
        "LogsConfig": {
          "CloudWatchLogs": {
            "Status": "ENABLED",
            "GroupName": {
              "Ref": "CodeBuildTestLogGroup"
            }
          }
        }
      }
    },
    "ECRRepository": {
      "Type": "AWS::ECR::Repository",
      "Properties": {
        "RepositoryName": {
          "Fn::Sub": "${ApplicationName}-${EnvironmentSuffix}"
        }
      }
    },
    "ECSTaskDefinition": {
      "Type": "AWS::ECS::TaskDefinition",
      "Properties": {
        "Family": {
          "Fn::Sub": "${ApplicationName}-${EnvironmentSuffix}-task"
        },
        "NetworkMode": "awsvpc",
        "RequiresCompatibilities": [
          "FARGATE"
        ],
        "Cpu": 256,
        "Memory": 512,
        "ExecutionRoleArn": {
          "Fn::GetAtt": [
            "ECSTaskExecutionRole",
            "Arn"
          ]
        },
        "TaskRoleArn": {
          "Fn::GetAtt": [
            "ECSTaskRole",
            "Arn"
          ]
        },
        "ContainerDefinitions": [
          {
            "Name": {
              "Fn::Sub": "${ApplicationName}-${EnvironmentSuffix}-container"
            },
            "Image": {
              "Fn::Sub": "${AWS::AccountId}.dkr.ecr.${AWS::Region}.amazonaws.com/${ApplicationName}-${EnvironmentSuffix}:latest"
            },
            "PortMappings": [
              {
                "ContainerPort": 80,
                "Protocol": "tcp"
              }
            ],
            "LogConfiguration": {
              "LogDriver": "awslogs",
              "Options": {
                "awslogs-group": {
                  "Ref": "ECSLogGroup"
                },
                "awslogs-region": {
                  "Ref": "AWS::Region"
                },
                "awslogs-stream-prefix": "ecs"
              }
            }
          }
        ]
      }
    },
    "ECSService": {
      "Type": "AWS::ECS::Service",
      "Properties": {
        "ServiceName": {
          "Fn::Sub": "${ApplicationName}-${EnvironmentSuffix}-service"
        },
        "Cluster": {
          "Fn::If": [
            "CreateECSCluster",
            {
              "Ref": "ECSCluster"
            },
            {
              "Ref": "ECSClusterName"
            }
          ]
        },
        "TaskDefinition": {
          "Ref": "ECSTaskDefinition"
        },
        "LaunchType": "FARGATE",
        "DesiredCount": {
          "Ref": "ServiceDesiredCount"
        },
        "DeploymentConfiguration": {
          "DeploymentCircuitBreaker": {
            "Enable": true,
            "Rollback": true
          },
          "MaximumPercent": 200,
          "MinimumHealthyPercent": 100
        },
        "NetworkConfiguration": {
          "AwsvpcConfiguration": {
            "AssignPublicIp": "ENABLED",
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
                "Ref": "ECSSecurityGroup"
              }
            ]
          }
        }
      }
    },
    "ECSSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": {
          "Fn::Sub": "Security group for ${ApplicationName}-${EnvironmentSuffix} ECS service"
        },
        "VpcId": {
          "Ref": "DefaultVPC"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 80,
            "ToPort": 80,
            "CidrIp": "0.0.0.0/0"
          }
        ]
      }
    },
    "CodePipeline": {
      "Type": "AWS::CodePipeline::Pipeline",
      "Properties": {
        "Name": {
          "Fn::Sub": "${ApplicationName}-${EnvironmentSuffix}-pipeline"
        },
        "RoleArn": {
          "Fn::GetAtt": [
            "CodePipelineServiceRole",
            "Arn"
          ]
        },
        "ArtifactStore": {
          "Type": "S3",
          "Location": {
            "Fn::If": [
              "CreateArtifactBucket",
              {
                "Ref": "PipelineArtifactBucket"
              },
              {
                "Ref": "PipelineArtifactBucketName"
              }
            ]
          }
        },
        "Stages": [
          {
            "Name": "Source",
            "Actions": [
              {
                "Name": "Source",
                "ActionTypeId": {
                  "Category": "Source",
                  "Owner": "ThirdParty",
                  "Provider": "GitHub",
                  "Version": "1"
                },
                "Configuration": {
                  "Owner": {
                    "Fn::Select": [
                      3,
                      {
                        "Fn::Split": [
                          "/",
                          {
                            "Ref": "GitRepository"
                          }
                        ]
                      }
                    ]
                  },
                  "Repo": {
                    "Fn::Select": [
                      4,
                      {
                        "Fn::Split": [
                          "/",
                          {
                            "Ref": "GitRepository"
                          }
                        ]
                      }
                    ]
                  },
                  "Branch": {
                    "Ref": "GitBranch"
                  },
                  "OAuthToken": {
                    "Fn::Sub": [
                      "{{resolve:secretsmanager:${SecretName}}}",
                      {
                        "SecretName": {
                          "Fn::If": [
                            "CreateGitHubSecret",
                            {
                              "Ref": "GitHubTokenSecret"
                            },
                            {
                              "Fn::Select": [
                                6,
                                {
                                  "Fn::Split": [
                                    ":",
                                    {
                                      "Ref": "GitHubSecretArn"
                                    }
                                  ]
                                }
                              ]
                            }
                          ]
                        }
                      }
                    ]
                  }
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
            "Name": "Test",
            "Actions": [
              {
                "Name": "Test",
                "ActionTypeId": {
                  "Category": "Build",
                  "Owner": "AWS",
                  "Provider": "CodeBuild",
                  "Version": "1"
                },
                "Configuration": {
                  "ProjectName": {
                    "Ref": "CodeBuildTestProject"
                  }
                },
                "InputArtifacts": [
                  {
                    "Name": "SourceOutput"
                  }
                ],
                "OutputArtifacts": [
                  {
                    "Name": "TestOutput"
                  }
                ]
              }
            ]
          },
          {
            "Name": "Build",
            "Actions": [
              {
                "Name": "Build",
                "ActionTypeId": {
                  "Category": "Build",
                  "Owner": "AWS",
                  "Provider": "CodeBuild",
                  "Version": "1"
                },
                "Configuration": {
                  "ProjectName": {
                    "Ref": "CodeBuildProject"
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
                "Name": "Deploy",
                "ActionTypeId": {
                  "Category": "Deploy",
                  "Owner": "AWS",
                  "Provider": "ECS",
                  "Version": "1"
                },
                "Configuration": {
                  "ClusterName": {
                    "Fn::If": [
                      "CreateECSCluster",
                      {
                        "Ref": "ECSCluster"
                      },
                      {
                        "Ref": "ECSClusterName"
                      }
                    ]
                  },
                  "ServiceName": {
                    "Ref": "ECSService"
                  },
                  "FileName": "imagedefinitions.json"
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
    },
    "PipelineStateChangeRule": {
      "Type": "AWS::Events::Rule",
      "Properties": {
        "Name": {
          "Fn::Sub": "${ApplicationName}-${EnvironmentSuffix}-pipeline-state-change"
        },
        "Description": "Rule to capture pipeline state changes",
        "EventPattern": {
          "source": [
            "aws.codepipeline"
          ],
          "detail-type": [
            "CodePipeline Pipeline Execution State Change"
          ],
          "detail": {
            "pipeline": [
              {
                "Ref": "CodePipeline"
              }
            ]
          }
        },
        "State": "ENABLED",
        "Targets": [
          {
            "Id": "SNSTarget",
            "Arn": {
              "Fn::If": [
                "CreateSNSTopic",
                {
                  "Ref": "SNSOperationsTopic"
                },
                {
                  "Ref": "SNSOperationsTopicNameOrArn"
                }
              ]
            }
          }
        ]
      }
    }
  },
  "Outputs": {
    "PipelineName": {
      "Description": "Name of the CodePipeline",
      "Value": {
        "Ref": "CodePipeline"
      }
    },
    "ArtifactBucketName": {
      "Description": "Name of the S3 artifacts bucket",
      "Value": {
        "Fn::If": [
          "CreateArtifactBucket",
          {
            "Ref": "PipelineArtifactBucket"
          },
          {
            "Ref": "PipelineArtifactBucketName"
          }
        ]
      }
    },
    "SNSArn": {
      "Description": "ARN of the SNS topic for operations notifications",
      "Value": {
        "Fn::If": [
          "CreateSNSTopic",
          {
            "Ref": "SNSOperationsTopic"
          },
          {
            "Ref": "SNSOperationsTopicNameOrArn"
          }
        ]
      }
    },
    "ECSClusterName": {
      "Description": "Name of the ECS cluster",
      "Value": {
        "Fn::If": [
          "CreateECSCluster",
          {
            "Ref": "ECSCluster"
          },
          {
            "Ref": "ECSClusterName"
          }
        ]
      }
    },
    "VPCId": {
      "Description": "ID of the created VPC",
      "Value": {
        "Ref": "DefaultVPC"
      }
    },
    "PublicSubnet1Id": {
      "Description": "ID of Public Subnet 1",
      "Value": {
        "Ref": "PublicSubnet1"
      }
    },
    "PublicSubnet2Id": {
      "Description": "ID of Public Subnet 2",
      "Value": {
        "Ref": "PublicSubnet2"
      }
    },
    "ECRRepositoryUri": {
      "Description": "URI of the ECR repository",
      "Value": {
        "Fn::Sub": "${AWS::AccountId}.dkr.ecr.${AWS::Region}.amazonaws.com/${ECRRepository}"
      }
    }
  },
  "Metadata": {
    "TestingInstructions": {
      "Validation": "Run 'aws cloudformation validate-template --template-body file://template.json' to validate syntax",
      "DeploymentTest": "Deploy stack, then push code to trigger pipeline. Monitor pipeline execution in CodePipeline console",
      "RollbackTest": "To test rollback, introduce a failing health check or deployment error in your application code, commit and push. The ECS circuit breaker will automatically rollback on failure",
      "MonitoringTest": "Check SNS topic for pipeline state change notifications and CloudWatch logs for build/deployment logs",
      "Prerequisites": "If using existing GitHub secret, provide the ARN in GitHubSecretArn parameter. Otherwise, update the created secret with your GitHub token."
    }
  }
}
```
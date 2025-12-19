### Reasoning Trace
---

I need to create a complete CloudFormation template in JSON format that meets all the specified requirements. Let me break this down systematically:

1. Parameters needed:
   - ApplicationName (String, Default: my-app)
   - PipelineArtifactBucketName (String, empty default)
   - SNSOperationsTopicNameOrArn (String)
   - ECSClusterName (String, Default: created if not provided)
   - CodeBuildImage (String, default: aws/codebuild/standard:6.0)
   - GitRepository (String) and GitBranch (String)

2. Resources needed:
   - S3 Artifact Bucket (conditional creation)
   - CodeBuild Projects (Build and Test)
   - IAM Roles and Policies (multiple)
   - CodePipeline with stages
   - SNS Topic (conditional)
   - ECS Cluster, Service, Task Definition
   - CodeDeploy Application and Deployment Group
   - CloudWatch Events rule
   - CloudWatch Log Groups

3. Key considerations:
   - Least privilege IAM policies
   - Blue/Green deployment with rollback
   - Conditional resource creation
   - Proper references and GetAtt usage
   - Security best practices
   - Metadata for testing instructions

Let me start building this template:

First, I need to handle conditional logic for:
- S3 bucket creation (if PipelineArtifactBucketName is empty)
- SNS topic creation (if SNSOperationsTopicNameOrArn is not an ARN)
- ECS cluster creation (if ECSClusterName is not provided)

I'll need to use Conditions for this.

Let me structure the template:

1. Parameters
2. Conditions
3. Resources
4. Outputs
5. Metadata

For the IAM policies, I need to be very careful about least privilege. Let me think about what each role needs:


I'll carefully define granular permissions for each service role, ensuring minimal access rights while maintaining full functionality across the deployment pipeline. The key is to create precise, targeted IAM roles that provide just enough permissions for each component to perform its specific tasks efficiently and securely.

The service roles will require carefully scoped access to various AWS services, focusing on the exact actions needed for each stage of the deployment process. This approach minimizes potential security risks while enabling smooth, automated infrastructure management.
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
    "PipelineArtifactBucketName": {
      "Type": "String",
      "Default": "",
      "Description": "S3 bucket name for pipeline artifacts. If empty, a new bucket will be created."
    },
    "SNSOperationsTopicNameOrArn": {
      "Type": "String",
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
      "Description": "Git repository URL"
    },
    "GitBranch": {
      "Type": "String",
      "Default": "main",
      "Description": "Git branch to build"
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
          "Fn::Select": [
            0,
            {
              "Fn::Split": [
                ":",
                {
                  "Ref": "SNSOperationsTopicNameOrArn"
                }
              ]
            }
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
    }
  },
  "Resources": {
    "PipelineArtifactBucket": {
      "Type": "AWS::S3::Bucket",
      "Condition": "CreateArtifactBucket",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "${ApplicationName}-pipeline-artifacts-${AWS::AccountId}-${AWS::Region}"
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
          "Fn::Sub": "${ApplicationName}-operations"
        }
      }
    },
    "ECSCluster": {
      "Type": "AWS::ECS::Cluster",
      "Condition": "CreateECSCluster",
      "Properties": {
        "ClusterName": {
          "Fn::Sub": "${ApplicationName}-cluster"
        },
        "CapacityProviders": [
          "FARGATE"
        ]
      }
    },
    "CodeBuildLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/aws/codebuild/${ApplicationName}-build"
        },
        "RetentionInDays": 14
      }
    },
    "CodeBuildTestLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/aws/codebuild/${ApplicationName}-test"
        },
        "RetentionInDays": 14
      }
    },
    "ECSLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/ecs/${ApplicationName}"
        },
        "RetentionInDays": 30
      }
    },
    "CodePipelineServiceRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "${ApplicationName}-CodePipelineServiceRole"
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
                    "codedeploy:CreateDeployment",
                    "codedeploy:GetApplication",
                    "codedeploy:GetApplicationRevision",
                    "codedeploy:GetDeployment",
                    "codedeploy:GetDeploymentConfig",
                    "codedeploy:RegisterApplicationRevision"
                  ],
                  "Resource": [
                    {
                      "Ref": "CodeDeployApplication"
                    },
                    {
                      "Ref": "CodeDeployDeploymentGroup"
                    },
                    {
                      "Fn::Sub": "arn:aws:codedeploy:${AWS::Region}:${AWS::AccountId}:deploymentconfig/CodeDeployDefault.ECSBlueGreen*"
                    }
                  ]
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
        "RoleName": {
          "Fn::Sub": "${ApplicationName}-CodeBuildServiceRole"
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
                      "Fn::GetAtt": [
                        "CodeBuildLogGroup",
                        "Arn"
                      ]
                    },
                    {
                      "Fn::GetAtt": [
                        "CodeBuildTestLogGroup",
                        "Arn"
                      ]
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
        "RoleName": {
          "Fn::Sub": "${ApplicationName}-ECSTaskExecutionRole"
        },
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
                    "Fn::GetAtt": [
                      "ECSLogGroup",
                      "Arn"
                    ]
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
        "RoleName": {
          "Fn::Sub": "${ApplicationName}-ECSTaskRole"
        },
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
    "CodeDeployServiceRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "${ApplicationName}-CodeDeployServiceRole"
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
          "arn:aws:iam::aws:policy/AWSCodeDeployRoleForECS"
        ],
        "Policies": [
          {
            "PolicyName": "PassRolePolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": "iam:PassRole",
                  "Resource": [
                    {
                      "Fn::GetAtt": [
                        "ECSTaskExecutionRole",
                        "Arn"
                      ]
                    },
                    {
                      "Fn::GetAtt": [
                        "ECSTaskRole",
                        "Arn"
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
    "CodeBuildProject": {
      "Type": "AWS::CodeBuild::Project",
      "Properties": {
        "Name": {
          "Fn::Sub": "${ApplicationName}-build"
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
            "Fn::Sub": "version: 0.2\nphases:\n  pre_build:\n    commands:\n      - echo Logging in to Amazon ECR...\n      - aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com\n  build:\n    commands:\n      - echo Build started on `date`\n      - echo Building the Docker image...\n      - docker build -t $IMAGE_REPO_NAME:$IMAGE_TAG .\n      - docker tag $IMAGE_REPO_NAME:$IMAGE_TAG $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME:$IMAGE_TAG\n  post_build:\n    commands:\n      - echo Build completed on `date`\n      - echo Pushing the Docker image...\n      - docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME:$IMAGE_TAG\n      - echo Writing image definitions file...\n      - printf '[{\"name\":\"${ApplicationName}-container\",\"imageUri\":\"%s\"}]' $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME:$IMAGE_TAG > imagedefinitions.json\nartifacts:\n  files:\n    - imagedefinitions.json\n    - appspec.yaml\n    - taskdef.json"
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
                "Ref": "ApplicationName"
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
          "Fn::Sub": "${ApplicationName}-test"
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
          "Ref": "ApplicationName"
        }
      }
    },
    "ECSTaskDefinition": {
      "Type": "AWS::ECS::TaskDefinition",
      "Properties": {
        "Family": {
          "Fn::Sub": "${ApplicationName}-task"
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
              "Fn::Sub": "${ApplicationName}-container"
            },
            "Image": {
              "Fn::Sub": "${AWS::AccountId}.dkr.ecr.${AWS::Region}.amazonaws.com/${ApplicationName}:latest"
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
          "Fn::Sub": "${ApplicationName}-service"
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
        "DesiredCount": 2,
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
                "Fn::ImportValue": "DefaultVPC-PublicSubnet1"
              },
              {
                "Fn::ImportValue": "DefaultVPC-PublicSubnet2"
              }
            ],
            "SecurityGroups": [
              {
                "Ref": "ECSSecurityGroup"
              }
            ]
          }
        }
      },
      "DependsOn": [
        "ECSTaskDefinition"
      ]
    },
    "ECSSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": {
          "Fn::Sub": "Security group for ${ApplicationName} ECS service"
        },
        "VpcId": {
          "Fn::ImportValue": "DefaultVPC-VPC"
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
    "CodeDeployApplication": {
      "Type": "AWS::CodeDeploy::Application",
      "Properties": {
        "ApplicationName": {
          "Fn::Sub": "${ApplicationName}-codedeploy-app"
        },
        "ComputePlatform": "ECS"
      }
    },
    "CodeDeployDeploymentGroup": {
      "Type": "AWS::CodeDeploy::DeploymentGroup",
      "Properties": {
        "ApplicationName": {
          "Ref": "CodeDeployApplication"
        },
        "DeploymentGroupName": {
          "Fn::Sub": "${ApplicationName}-deployment-group"
        },
        "ServiceRoleArn": {
          "Fn::GetAtt": [
            "CodeDeployServiceRole",
            "Arn"
          ]
        },
        "DeploymentConfigName": "CodeDeployDefault.ECSBlueGreenCanary10Percent5Minutes",
        "BlueGreenDeploymentConfiguration": {
          "TerminateBlueInstancesOnDeploymentSuccess": {
            "Action": "TERMINATE",
            "TerminationWaitTimeInMinutes": 5
          },
          "DeploymentReadyOption": {
            "ActionOnTimeout": "CONTINUE_DEPLOYMENT"
          },
          "GreenFleetProvisioningOption": {
            "Action": "COPY_AUTO_SCALING_GROUP"
          }
        },
        "ECSServices": [
          {
            "ServiceName": {
              "Fn::GetAtt": [
                "ECSService",
                "Name"
              ]
            },
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
            }
          }
        ],
        "AutoRollbackConfiguration": {
          "Enabled": true,
          "Events": [
            "DEPLOYMENT_FAILURE",
            "DEPLOYMENT_STOP_ON_ALARM",
            "DEPLOYMENT_STOP_ON_REQUEST"
          ]
        }
      }
    },
    "CodePipeline": {
      "Type": "AWS::CodePipeline::Pipeline",
      "Properties": {
        "Name": {
          "Fn::Sub": "${ApplicationName}-pipeline"
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
                  "OAuthToken": "{{resolve:secretsmanager:github-token}}"
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
                  "Provider": "CodeDeployToECS",
                  "Version": "1"
                },
                "Configuration": {
                  "ApplicationName": {
                    "Ref": "CodeDeployApplication"
                  },
                  "DeploymentGroupName": {
                    "Ref": "CodeDeployDeploymentGroup"
                  },
                  "TaskDefinitionTemplateArtifact": "BuildOutput",
                  "TaskDefinitionTemplatePath": "taskdef.json",
                  "AppSpecTemplateArtifact": "BuildOutput",
                  "AppSpecTemplatePath": "appspec.yaml",
                  "Image1ArtifactName": "BuildOutput",
                  "Image1ContainerName": "IMAGE1_NAME"
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
          "Fn::Sub": "${ApplicationName}-pipeline-state-change"
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
    }
  },
  "Metadata": {
    "TestingInstructions": {
      "Validation": "Run 'aws cloudformation validate-template --template-body file://template.json' to validate syntax",
      "DeploymentTest": "Deploy stack, then push code to trigger pipeline. Monitor pipeline execution in CodePipeline console",
      "RollbackTest": "To test rollback, introduce a failing health check or deployment error in your application code, commit and push. The blue/green deployment should automatically rollback on failure",
      "MonitoringTest": "Check SNS topic for pipeline state change notifications and CloudWatch logs for build/deployment logs",
      "Prerequisites": "Ensure you have a GitHub OAuth token stored in AWS Secrets Manager with name 'github-token', and your VPC exports DefaultVPC-VPC, DefaultVPC-PublicSubnet1, DefaultVPC-PublicSubnet2"
    }
  }
}
```
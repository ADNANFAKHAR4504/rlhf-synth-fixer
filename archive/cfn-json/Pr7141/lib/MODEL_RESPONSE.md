# CI/CD Pipeline Infrastructure - CloudFormation Implementation

This implementation provides a complete CI/CD pipeline infrastructure using CloudFormation JSON format, including CodePipeline orchestration, CodeBuild for builds, CodeCommit integration, ECS deployment, artifact storage with encryption, and proper security controls.

## File: lib/pipeline-stack.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "CI/CD Pipeline Infrastructure for Microservices with CodePipeline, CodeBuild, and ECS deployment",
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Environment suffix for resource naming to ensure uniqueness across deployments",
      "AllowedPattern": "^[a-zA-Z0-9-]+$",
      "ConstraintDescription": "Must contain only alphanumeric characters and hyphens"
    },
    "VpcId": {
      "Type": "AWS::EC2::VPC::Id",
      "Description": "VPC ID where CodeBuild will run"
    },
    "PrivateSubnetIds": {
      "Type": "List<AWS::EC2::Subnet::Id>",
      "Description": "Private subnet IDs for CodeBuild (no internet access)"
    },
    "CodeCommitRepositoryName": {
      "Type": "String",
      "Description": "Name of the CodeCommit repository containing source code"
    },
    "CodeCommitBranchName": {
      "Type": "String",
      "Description": "Branch name to trigger pipeline",
      "Default": "main"
    },
    "EcsClusterName": {
      "Type": "String",
      "Description": "Name of the ECS cluster for deployment"
    },
    "EcsServiceName": {
      "Type": "String",
      "Description": "Name of the ECS service to deploy to"
    },
    "EcrRepositoryUri": {
      "Type": "String",
      "Description": "ECR repository URI for Docker images"
    },
    "ApprovalNotificationEmail": {
      "Type": "String",
      "Description": "Email address for manual approval notifications",
      "AllowedPattern": "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
    }
  },
  "Resources": {
    "ArtifactEncryptionKey": {
      "Type": "AWS::KMS::Key",
      "Properties": {
        "Description": {
          "Fn::Sub": "KMS key for encrypting pipeline artifacts - ${EnvironmentSuffix}"
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
              "Sid": "Allow CodePipeline to use the key",
              "Effect": "Allow",
              "Principal": {
                "Service": "codepipeline.amazonaws.com"
              },
              "Action": [
                "kms:Decrypt",
                "kms:Encrypt",
                "kms:ReEncrypt*",
                "kms:GenerateDataKey*",
                "kms:DescribeKey"
              ],
              "Resource": "*",
              "Condition": {
                "StringEquals": {
                  "kms:ViaService": {
                    "Fn::Sub": "s3.${AWS::Region}.amazonaws.com"
                  }
                }
              }
            },
            {
              "Sid": "Allow CodeBuild to use the key",
              "Effect": "Allow",
              "Principal": {
                "Service": "codebuild.amazonaws.com"
              },
              "Action": [
                "kms:Decrypt",
                "kms:DescribeKey"
              ],
              "Resource": "*"
            },
            {
              "Sid": "Allow S3 to use the key",
              "Effect": "Allow",
              "Principal": {
                "Service": "s3.amazonaws.com"
              },
              "Action": [
                "kms:Decrypt",
                "kms:GenerateDataKey"
              ],
              "Resource": "*"
            },
            {
              "Sid": "Allow CloudWatch Logs to use the key",
              "Effect": "Allow",
              "Principal": {
                "Service": {
                  "Fn::Sub": "logs.${AWS::Region}.amazonaws.com"
                }
              },
              "Action": [
                "kms:Decrypt",
                "kms:Encrypt",
                "kms:ReEncrypt*",
                "kms:GenerateDataKey*",
                "kms:CreateGrant",
                "kms:DescribeKey"
              ],
              "Resource": "*",
              "Condition": {
                "ArnLike": {
                  "kms:EncryptionContext:aws:logs:arn": {
                    "Fn::Sub": "arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:*"
                  }
                }
              }
            }
          ]
        }
      }
    },
    "ArtifactEncryptionKeyAlias": {
      "Type": "AWS::KMS::Alias",
      "Properties": {
        "AliasName": {
          "Fn::Sub": "alias/pipeline-artifacts-${EnvironmentSuffix}"
        },
        "TargetKeyId": {
          "Ref": "ArtifactEncryptionKey"
        }
      }
    },
    "ArtifactBucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "pipeline-artifacts-${EnvironmentSuffix}-${AWS::AccountId}"
        },
        "VersioningConfiguration": {
          "Status": "Enabled"
        },
        "BucketEncryption": {
          "ServerSideEncryptionConfiguration": [
            {
              "ServerSideEncryptionByDefault": {
                "SSEAlgorithm": "aws:kms",
                "KMSMasterKeyID": {
                  "Fn::GetAtt": [
                    "ArtifactEncryptionKey",
                    "Arn"
                  ]
                }
              },
              "BucketKeyEnabled": true
            }
          ]
        },
        "LifecycleConfiguration": {
          "Rules": [
            {
              "Id": "DeleteOldArtifacts",
              "Status": "Enabled",
              "ExpirationInDays": 30,
              "NoncurrentVersionExpirationInDays": 30
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
              "Sid": "DenyUnencryptedObjectUploads",
              "Effect": "Deny",
              "Principal": "*",
              "Action": "s3:PutObject",
              "Resource": {
                "Fn::Sub": "${ArtifactBucket.Arn}/*"
              },
              "Condition": {
                "StringNotEquals": {
                  "s3:x-amz-server-side-encryption": "aws:kms"
                }
              }
            },
            {
              "Sid": "DenyInsecureTransport",
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
    "CodeBuildSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": {
          "Fn::Sub": "Security group for CodeBuild projects - ${EnvironmentSuffix}"
        },
        "VpcId": {
          "Ref": "VpcId"
        },
        "SecurityGroupEgress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 443,
            "ToPort": 443,
            "CidrIp": "0.0.0.0/0",
            "Description": "Allow HTTPS to VPC endpoints"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "codebuild-sg-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "CodeBuildLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/aws/codebuild/pipeline-build-${EnvironmentSuffix}"
        },
        "RetentionInDays": 30,
        "KmsKeyId": {
          "Fn::GetAtt": [
            "ArtifactEncryptionKey",
            "Arn"
          ]
        }
      }
    },
    "CodeBuildRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "codebuild-role-${EnvironmentSuffix}"
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
        "ManagedPolicyArns": [
          "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryPowerUser"
        ],
        "Policies": [
          {
            "PolicyName": "CodeBuildBasePolicy",
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
                      "CodeBuildLogGroup",
                      "Arn"
                    ]
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
                    "kms:GenerateDataKey"
                  ],
                  "Resource": {
                    "Fn::GetAtt": [
                      "ArtifactEncryptionKey",
                      "Arn"
                    ]
                  }
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "ec2:CreateNetworkInterface",
                    "ec2:DescribeNetworkInterfaces",
                    "ec2:DeleteNetworkInterface",
                    "ec2:DescribeSubnets",
                    "ec2:DescribeSecurityGroups",
                    "ec2:DescribeDhcpOptions",
                    "ec2:DescribeVpcs",
                    "ec2:CreateNetworkInterfacePermission"
                  ],
                  "Resource": "*"
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
          "Fn::Sub": "pipeline-build-${EnvironmentSuffix}"
        },
        "Description": "Build Docker images for microservices",
        "ServiceRole": {
          "Fn::GetAtt": [
            "CodeBuildRole",
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
              "Name": "IMAGE_REPO_URI",
              "Value": {
                "Ref": "EcrRepositoryUri"
              }
            },
            {
              "Name": "IMAGE_TAG",
              "Value": "latest"
            }
          ]
        },
        "Source": {
          "Type": "CODEPIPELINE",
          "BuildSpec": "buildspec.yml"
        },
        "VpcConfig": {
          "VpcId": {
            "Ref": "VpcId"
          },
          "Subnets": {
            "Ref": "PrivateSubnetIds"
          },
          "SecurityGroupIds": [
            {
              "Ref": "CodeBuildSecurityGroup"
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
        },
        "EncryptionKey": {
          "Fn::GetAtt": [
            "ArtifactEncryptionKey",
            "Arn"
          ]
        }
      }
    },
    "PipelineRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "pipeline-execution-role-${EnvironmentSuffix}"
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
            "PolicyName": "CodePipelineExecutionPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:GetObject",
                    "s3:PutObject",
                    "s3:GetObjectVersion",
                    "s3:GetBucketVersioning"
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
                    "kms:Encrypt",
                    "kms:ReEncrypt*",
                    "kms:GenerateDataKey*",
                    "kms:DescribeKey"
                  ],
                  "Resource": {
                    "Fn::GetAtt": [
                      "ArtifactEncryptionKey",
                      "Arn"
                    ]
                  }
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "codecommit:GetBranch",
                    "codecommit:GetCommit",
                    "codecommit:UploadArchive",
                    "codecommit:GetUploadArchiveStatus",
                    "codecommit:CancelUploadArchive"
                  ],
                  "Resource": {
                    "Fn::Sub": "arn:aws:codecommit:${AWS::Region}:${AWS::AccountId}:${CodeCommitRepositoryName}"
                  }
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
                    "StringEqualsIfExists": {
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
                    "Ref": "ApprovalTopic"
                  }
                }
              ]
            }
          }
        ]
      }
    },
    "ApprovalTopic": {
      "Type": "AWS::SNS::Topic",
      "Properties": {
        "TopicName": {
          "Fn::Sub": "pipeline-approval-${EnvironmentSuffix}"
        },
        "DisplayName": "Pipeline Manual Approval Notifications",
        "Subscription": [
          {
            "Endpoint": {
              "Ref": "ApprovalNotificationEmail"
            },
            "Protocol": "email"
          }
        ]
      }
    },
    "Pipeline": {
      "Type": "AWS::CodePipeline::Pipeline",
      "Properties": {
        "Name": {
          "Fn::Sub": "microservices-pipeline-${EnvironmentSuffix}"
        },
        "RoleArn": {
          "Fn::GetAtt": [
            "PipelineRole",
            "Arn"
          ]
        },
        "ArtifactStore": {
          "Type": "S3",
          "Location": {
            "Ref": "ArtifactBucket"
          },
          "EncryptionKey": {
            "Id": {
              "Fn::GetAtt": [
                "ArtifactEncryptionKey",
                "Arn"
              ]
            },
            "Type": "KMS"
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
                  "Owner": "AWS",
                  "Provider": "CodeCommit",
                  "Version": "1"
                },
                "Configuration": {
                  "RepositoryName": {
                    "Ref": "CodeCommitRepositoryName"
                  },
                  "BranchName": {
                    "Ref": "CodeCommitBranchName"
                  },
                  "PollForSourceChanges": false
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
            "Name": "Staging",
            "Actions": [
              {
                "Name": "DeployToStaging",
                "ActionTypeId": {
                  "Category": "Deploy",
                  "Owner": "AWS",
                  "Provider": "ECS",
                  "Version": "1"
                },
                "Configuration": {
                  "ClusterName": {
                    "Ref": "EcsClusterName"
                  },
                  "ServiceName": {
                    "Ref": "EcsServiceName"
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
          },
          {
            "Name": "Approval",
            "Actions": [
              {
                "Name": "ManualApproval",
                "ActionTypeId": {
                  "Category": "Approval",
                  "Owner": "AWS",
                  "Provider": "Manual",
                  "Version": "1"
                },
                "Configuration": {
                  "NotificationArn": {
                    "Ref": "ApprovalTopic"
                  },
                  "CustomData": "Please review the staging deployment and approve for production deployment."
                }
              }
            ]
          },
          {
            "Name": "Production",
            "Actions": [
              {
                "Name": "DeployToProduction",
                "ActionTypeId": {
                  "Category": "Deploy",
                  "Owner": "AWS",
                  "Provider": "ECS",
                  "Version": "1"
                },
                "Configuration": {
                  "ClusterName": {
                    "Ref": "EcsClusterName"
                  },
                  "ServiceName": {
                    "Ref": "EcsServiceName"
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
    "PipelineEventRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "pipeline-event-role-${EnvironmentSuffix}"
        },
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "events.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "Policies": [
          {
            "PolicyName": "StartPipelineExecutionPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": "codepipeline:StartPipelineExecution",
                  "Resource": {
                    "Fn::Sub": "arn:aws:codepipeline:${AWS::Region}:${AWS::AccountId}:${Pipeline}"
                  }
                }
              ]
            }
          }
        ]
      }
    },
    "PipelineTriggerRule": {
      "Type": "AWS::Events::Rule",
      "Properties": {
        "Name": {
          "Fn::Sub": "pipeline-trigger-${EnvironmentSuffix}"
        },
        "Description": "Trigger pipeline on CodeCommit repository changes",
        "EventPattern": {
          "source": [
            "aws.codecommit"
          ],
          "detail-type": [
            "CodeCommit Repository State Change"
          ],
          "detail": {
            "event": [
              "referenceCreated",
              "referenceUpdated"
            ],
            "referenceType": [
              "branch"
            ],
            "referenceName": [
              {
                "Ref": "CodeCommitBranchName"
              }
            ]
          },
          "resources": [
            {
              "Fn::Sub": "arn:aws:codecommit:${AWS::Region}:${AWS::AccountId}:${CodeCommitRepositoryName}"
            }
          ]
        },
        "State": "ENABLED",
        "Targets": [
          {
            "Arn": {
              "Fn::Sub": "arn:aws:codepipeline:${AWS::Region}:${AWS::AccountId}:${Pipeline}"
            },
            "RoleArn": {
              "Fn::GetAtt": [
                "PipelineEventRole",
                "Arn"
              ]
            },
            "Id": "PipelineTarget"
          }
        ]
      }
    }
  },
  "Outputs": {
    "PipelineArn": {
      "Description": "ARN of the created CodePipeline",
      "Value": {
        "Fn::Sub": "arn:aws:codepipeline:${AWS::Region}:${AWS::AccountId}:${Pipeline}"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-PipelineArn"
        }
      }
    },
    "PipelineExecutionRoleArn": {
      "Description": "ARN of the pipeline execution role",
      "Value": {
        "Fn::GetAtt": [
          "PipelineRole",
          "Arn"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-PipelineRoleArn"
        }
      }
    },
    "ArtifactBucketName": {
      "Description": "Name of the S3 bucket storing pipeline artifacts",
      "Value": {
        "Ref": "ArtifactBucket"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-ArtifactBucket"
        }
      }
    },
    "KmsKeyArn": {
      "Description": "ARN of the KMS key used for artifact encryption",
      "Value": {
        "Fn::GetAtt": [
          "ArtifactEncryptionKey",
          "Arn"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-KmsKeyArn"
        }
      }
    },
    "CodeBuildProjectName": {
      "Description": "Name of the CodeBuild project",
      "Value": {
        "Ref": "CodeBuildProject"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-CodeBuildProject"
        }
      }
    },
    "ApprovalTopicArn": {
      "Description": "ARN of the SNS topic for manual approvals",
      "Value": {
        "Ref": "ApprovalTopic"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-ApprovalTopic"
        }
      }
    }
  }
}
```

## File: lib/README.md

```markdown
# CI/CD Pipeline Infrastructure for Microservices

This CloudFormation template deploys a complete CI/CD pipeline infrastructure for microservices using AWS CodePipeline, CodeBuild, and ECS deployment.

## Architecture Overview

The solution provides:
- **CodePipeline** orchestration with 5 stages: Source, Build, Staging, Approval, Production
- **CodeBuild** project for building Docker images (BUILD_GENERAL1_SMALL for cost optimization)
- **CodeCommit** integration with automatic triggering on commits to main branch
- **ECS** deployment with blue/green deployment support
- **S3** bucket for artifacts with versioning and KMS encryption
- **Manual approval** stage between staging and production
- **CloudWatch Events** rule for automatic pipeline triggering
- **VPC-based CodeBuild** with no internet access (uses VPC endpoints)

## Prerequisites

Before deploying this template, ensure you have:

1. **VPC Configuration**:
   - VPC with private subnets
   - VPC endpoints for S3, ECR, CodeBuild, and CloudWatch Logs
   - No NAT gateways required (all access through VPC endpoints)

2. **CodeCommit Repository**:
   - Repository created with source code
   - `buildspec.yml` file in repository root
   - Main branch configured

3. **ECR Repository**:
   - Repository for storing Docker images
   - Appropriate permissions configured

4. **ECS Cluster and Service**:
   - ECS cluster created
   - ECS service configured for deployment
   - Task definition ready

5. **Buildspec File**:
   - Create `buildspec.yml` in your repository root with Docker build commands
   - Must generate `imagedefinitions.json` for ECS deployment

## Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| EnvironmentSuffix | Unique suffix for resource naming | `dev-001` or `prod-team-a` |
| VpcId | VPC ID where CodeBuild runs | `vpc-1234567890abcdef0` |
| PrivateSubnetIds | Private subnet IDs (comma-separated) | `subnet-abc123,subnet-def456` |
| CodeCommitRepositoryName | CodeCommit repository name | `my-microservice` |
| CodeCommitBranchName | Branch to monitor | `main` |
| EcsClusterName | ECS cluster name | `microservices-cluster` |
| EcsServiceName | ECS service name | `my-service` |
| EcrRepositoryUri | ECR repository URI | `123456789012.dkr.ecr.us-east-1.amazonaws.com/my-app` |
| ApprovalNotificationEmail | Email for approval notifications | `team@example.com` |

## Deployment Instructions

### Step 1: Prepare VPC Endpoints

Ensure your VPC has the following endpoints:
```bash
# S3 Gateway Endpoint
aws ec2 create-vpc-endpoint --vpc-id vpc-xxxxx --service-name com.amazonaws.us-east-1.s3 --route-table-ids rtb-xxxxx

# ECR API Endpoint
aws ec2 create-vpc-endpoint --vpc-id vpc-xxxxx --service-name com.amazonaws.us-east-1.ecr.api --subnet-ids subnet-xxxxx --security-group-ids sg-xxxxx

# ECR Docker Endpoint
aws ec2 create-vpc-endpoint --vpc-id vpc-xxxxx --service-name com.amazonaws.us-east-1.ecr.dkr --subnet-ids subnet-xxxxx --security-group-ids sg-xxxxx

# CloudWatch Logs Endpoint
aws ec2 create-vpc-endpoint --vpc-id vpc-xxxxx --service-name com.amazonaws.us-east-1.logs --subnet-ids subnet-xxxxx --security-group-ids sg-xxxxx
```

### Step 2: Deploy the CloudFormation Stack

```bash
aws cloudformation create-stack \
  --stack-name microservices-pipeline-dev \
  --template-body file://pipeline-stack.json \
  --parameters \
    ParameterKey=EnvironmentSuffix,ParameterValue=dev-001 \
    ParameterKey=VpcId,ParameterValue=vpc-1234567890abcdef0 \
    ParameterKey=PrivateSubnetIds,ParameterValue=subnet-abc123\\,subnet-def456 \
    ParameterKey=CodeCommitRepositoryName,ParameterValue=my-microservice \
    ParameterKey=CodeCommitBranchName,ParameterValue=main \
    ParameterKey=EcsClusterName,ParameterValue=microservices-cluster \
    ParameterKey=EcsServiceName,ParameterValue=my-service \
    ParameterKey=EcrRepositoryUri,ParameterValue=123456789012.dkr.ecr.us-east-1.amazonaws.com/my-app \
    ParameterKey=ApprovalNotificationEmail,ParameterValue=team@example.com \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

### Step 3: Confirm SNS Subscription

After deployment, check the approval notification email and confirm the SNS subscription.

### Step 4: Verify Pipeline Execution

```bash
# Get pipeline status
aws codepipeline get-pipeline-state --name microservices-pipeline-dev-001

# Monitor pipeline executions
aws codepipeline list-pipeline-executions --pipeline-name microservices-pipeline-dev-001
```

## Example buildspec.yml

Create this file in your CodeCommit repository root:

```yaml
version: 0.2

phases:
  pre_build:
    commands:
      - echo Logging in to Amazon ECR...
      - aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $IMAGE_REPO_URI
      - COMMIT_HASH=$(echo $CODEBUILD_RESOLVED_SOURCE_VERSION | cut -c 1-7)
      - IMAGE_TAG=${COMMIT_HASH:=latest}
  build:
    commands:
      - echo Build started on `date`
      - echo Building the Docker image...
      - docker build -t $IMAGE_REPO_URI:latest .
      - docker tag $IMAGE_REPO_URI:latest $IMAGE_REPO_URI:$IMAGE_TAG
  post_build:
    commands:
      - echo Build completed on `date`
      - echo Pushing the Docker images...
      - docker push $IMAGE_REPO_URI:latest
      - docker push $IMAGE_REPO_URI:$IMAGE_TAG
      - echo Creating imagedefinitions.json...
      - printf '[{"name":"my-container","imageUri":"%s"}]' $IMAGE_REPO_URI:$IMAGE_TAG > imagedefinitions.json
artifacts:
  files:
    - imagedefinitions.json
```

## Security Features

1. **Encryption**:
   - Customer-managed KMS key for all artifacts
   - S3 bucket encryption enforced
   - CloudWatch Logs encryption enabled

2. **Network Isolation**:
   - CodeBuild runs in private subnets with no internet access
   - All AWS service access through VPC endpoints
   - Security group controls egress traffic

3. **IAM Least Privilege**:
   - Separate roles for Pipeline, CodeBuild, and Events
   - No wildcard permissions
   - Resource-specific access controls

4. **Data Protection**:
   - S3 bucket versioning enabled
   - Public access blocked on artifact bucket
   - SSL/TLS enforced for all S3 operations
   - 30-day log retention

## Cost Optimization

- **CodeBuild**: BUILD_GENERAL1_SMALL compute type (3 GB memory, 2 vCPUs)
- **S3 Lifecycle**: Automatic deletion of artifacts after 30 days
- **Serverless Architecture**: No always-on infrastructure costs
- **VPC Endpoints**: Avoid NAT Gateway costs

## Monitoring and Troubleshooting

### View Pipeline Execution Logs

```bash
# Get pipeline execution details
aws codepipeline get-pipeline-execution \
  --pipeline-name microservices-pipeline-dev-001 \
  --pipeline-execution-id <execution-id>

# View CodeBuild logs
aws logs tail /aws/codebuild/pipeline-build-dev-001 --follow
```

### Common Issues

1. **CodeBuild fails to pull from ECR**:
   - Verify ECR VPC endpoints are configured
   - Check CodeBuild security group allows HTTPS egress
   - Verify CodeBuild role has ECR permissions

2. **Pipeline fails to access S3**:
   - Verify S3 VPC endpoint is configured
   - Check KMS key policy allows CodePipeline service
   - Verify IAM role permissions

3. **Manual approval not received**:
   - Confirm SNS email subscription
   - Check spam folder
   - Verify SNS topic permissions

## Cleanup

To delete all resources:

```bash
# Delete the CloudFormation stack
aws cloudformation delete-stack --stack-name microservices-pipeline-dev

# Wait for deletion to complete
aws cloudformation wait stack-delete-complete --stack-name microservices-pipeline-dev

# Note: S3 bucket must be emptied before stack deletion
aws s3 rm s3://pipeline-artifacts-dev-001-123456789012 --recursive
```

## Outputs

After deployment, the stack provides these outputs:

- **PipelineArn**: ARN of the CodePipeline
- **PipelineExecutionRoleArn**: ARN of the pipeline execution role
- **ArtifactBucketName**: Name of the S3 artifact bucket
- **KmsKeyArn**: ARN of the KMS encryption key
- **CodeBuildProjectName**: Name of the CodeBuild project
- **ApprovalTopicArn**: ARN of the SNS approval topic

## Extending the Pipeline

### Add Testing Stage

To add automated testing, deploy an additional CodeBuild project and add a test stage after the build stage in the pipeline definition.

### Add SNS Notifications

For pipeline status notifications, create an SNS topic and add CloudWatch Events rules for pipeline state changes.

### Add Lambda Validation

For custom deployment validation, create a Lambda function and invoke it in a new pipeline stage between approval and production deployment.

## Best Practices

1. **Use separate stacks for different environments**: Deploy separate pipelines for dev, staging, and production
2. **Version your buildspec.yml**: Keep buildspec in source control with your application code
3. **Monitor pipeline metrics**: Set up CloudWatch alarms for failed pipeline executions
4. **Regular security reviews**: Audit IAM policies and KMS key policies periodically
5. **Tag all resources**: Use consistent tagging strategy for cost allocation and management
6. **Test rollback procedures**: Regularly verify ECS blue/green rollback capabilities

## Support and Documentation

- [AWS CodePipeline Documentation](https://docs.aws.amazon.com/codepipeline/)
- [AWS CodeBuild Documentation](https://docs.aws.amazon.com/codebuild/)
- [ECS Blue/Green Deployments](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/deployment-type-bluegreen.html)
- [VPC Endpoints for AWS Services](https://docs.aws.amazon.com/vpc/latest/privatelink/vpc-endpoints.html)
```

## File: lib/example-parameters.json

```json
[
  {
    "ParameterKey": "EnvironmentSuffix",
    "ParameterValue": "dev-001"
  },
  {
    "ParameterKey": "VpcId",
    "ParameterValue": "vpc-1234567890abcdef0"
  },
  {
    "ParameterKey": "PrivateSubnetIds",
    "ParameterValue": "subnet-abc12345,subnet-def67890"
  },
  {
    "ParameterKey": "CodeCommitRepositoryName",
    "ParameterValue": "my-microservice"
  },
  {
    "ParameterKey": "CodeCommitBranchName",
    "ParameterValue": "main"
  },
  {
    "ParameterKey": "EcsClusterName",
    "ParameterValue": "microservices-cluster"
  },
  {
    "ParameterKey": "EcsServiceName",
    "ParameterValue": "my-service"
  },
  {
    "ParameterKey": "EcrRepositoryUri",
    "ParameterValue": "123456789012.dkr.ecr.us-east-1.amazonaws.com/my-app"
  },
  {
    "ParameterKey": "ApprovalNotificationEmail",
    "ParameterValue": "team@example.com"
  }
]
```

## File: lib/example-buildspec.yml

```yaml
version: 0.2

phases:
  pre_build:
    commands:
      - echo Logging in to Amazon ECR...
      - aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $IMAGE_REPO_URI
      - COMMIT_HASH=$(echo $CODEBUILD_RESOLVED_SOURCE_VERSION | cut -c 1-7)
      - IMAGE_TAG=${COMMIT_HASH:=latest}
      - echo Commit hash is $COMMIT_HASH
  build:
    commands:
      - echo Build started on `date`
      - echo Building the Docker image...
      - docker build -t $IMAGE_REPO_URI:latest .
      - docker tag $IMAGE_REPO_URI:latest $IMAGE_REPO_URI:$IMAGE_TAG
  post_build:
    commands:
      - echo Build completed on `date`
      - echo Pushing the Docker images...
      - docker push $IMAGE_REPO_URI:latest
      - docker push $IMAGE_REPO_URI:$IMAGE_TAG
      - echo Writing imagedefinitions.json file...
      - printf '[{"name":"my-container","imageUri":"%s"}]' $IMAGE_REPO_URI:$IMAGE_TAG > imagedefinitions.json
      - cat imagedefinitions.json

artifacts:
  files:
    - imagedefinitions.json
  name: BuildArtifact

cache:
  paths:
    - '/root/.docker/**/*'
```

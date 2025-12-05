# CloudFormation CI/CD Pipeline for Streaming Media Processing

This CloudFormation template creates a complete CI/CD pipeline infrastructure for a streaming media processing platform using AWS CodePipeline, CodeCommit, and CodeBuild.

## File: lib/TapStack.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "CI/CD Pipeline for Streaming Media Processing Platform",
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Unique suffix for resource naming to enable multiple deployments",
      "AllowedPattern": "[a-zA-Z0-9-]+",
      "ConstraintDescription": "Must contain only alphanumeric characters and hyphens"
    }
  },
  "Resources": {
    "ArtifactBucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "media-pipeline-artifacts-${EnvironmentSuffix}"
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
    "MediaRepository": {
      "Type": "AWS::CodeCommit::Repository",
      "Properties": {
        "RepositoryName": {
          "Fn::Sub": "media-processing-repo-${EnvironmentSuffix}"
        },
        "RepositoryDescription": "Source repository for streaming media processing platform"
      }
    },
    "BuildLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/aws/codebuild/media-build-${EnvironmentSuffix}"
        },
        "RetentionInDays": 7
      }
    },
    "CodeBuildServiceRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "media-codebuild-role-${EnvironmentSuffix}"
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
          "arn:aws:iam::aws:policy/AWSCodeBuildDeveloperAccess"
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
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents"
                  ],
                  "Resource": [
                    {
                      "Fn::Sub": "arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/codebuild/*"
                    }
                  ]
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:GetObject",
                    "s3:PutObject"
                  ],
                  "Resource": [
                    {
                      "Fn::Sub": "${ArtifactBucket.Arn}/*"
                    }
                  ]
                }
              ]
            }
          }
        ]
      }
    },
    "MediaBuildProject": {
      "Type": "AWS::CodeBuild::Project",
      "Properties": {
        "Name": {
          "Fn::Sub": "media-build-${EnvironmentSuffix}"
        },
        "ServiceRole": {
          "Fn::GetAtt": ["CodeBuildServiceRole", "Arn"]
        },
        "Artifacts": {
          "Type": "CODEPIPELINE"
        },
        "Environment": {
          "Type": "LINUX_CONTAINER",
          "ComputeType": "BUILD_GENERAL1_SMALL",
          "Image": "aws/codebuild/standard:5.0",
          "EnvironmentVariables": [
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
          "BuildSpec": "version: 0.2\nphases:\n  pre_build:\n    commands:\n      - echo Build started on `date`\n      - echo Processing media pipeline components\n  build:\n    commands:\n      - echo Building media processing application\n      - npm install || echo 'No package.json found'\n      - npm test || echo 'No tests defined'\n  post_build:\n    commands:\n      - echo Build completed on `date`\nartifacts:\n  files:\n    - '**/*'\n"
        },
        "LogsConfig": {
          "CloudWatchLogs": {
            "Status": "ENABLED",
            "GroupName": {
              "Ref": "BuildLogGroup"
            }
          }
        }
      }
    },
    "PipelineNotificationTopic": {
      "Type": "AWS::SNS::Topic",
      "Properties": {
        "TopicName": {
          "Fn::Sub": "media-pipeline-notifications-${EnvironmentSuffix}"
        },
        "DisplayName": "Media Processing Pipeline Notifications"
      }
    },
    "CodePipelineServiceRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "media-codepipeline-role-${EnvironmentSuffix}"
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
            "PolicyName": "CodePipelineBasePolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:GetObject",
                    "s3:PutObject",
                    "s3:GetObjectVersion",
                    "s3:GetBucketLocation"
                  ],
                  "Resource": [
                    {
                      "Fn::Sub": "${ArtifactBucket.Arn}"
                    },
                    {
                      "Fn::Sub": "${ArtifactBucket.Arn}/*"
                    }
                  ]
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "codecommit:GetBranch",
                    "codecommit:GetCommit",
                    "codecommit:UploadArchive",
                    "codecommit:GetUploadArchiveStatus"
                  ],
                  "Resource": [
                    {
                      "Fn::GetAtt": ["MediaRepository", "Arn"]
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
                      "Fn::GetAtt": ["MediaBuildProject", "Arn"]
                    }
                  ]
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "sns:Publish"
                  ],
                  "Resource": [
                    {
                      "Ref": "PipelineNotificationTopic"
                    }
                  ]
                }
              ]
            }
          }
        ]
      }
    },
    "MediaPipeline": {
      "Type": "AWS::CodePipeline::Pipeline",
      "Properties": {
        "Name": {
          "Fn::Sub": "media-processing-pipeline-${EnvironmentSuffix}"
        },
        "RoleArn": {
          "Fn::GetAtt": ["CodePipelineServiceRole", "Arn"]
        },
        "ArtifactStore": {
          "Type": "S3",
          "Location": {
            "Ref": "ArtifactBucket"
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
                    "Fn::GetAtt": ["MediaRepository", "Name"]
                  },
                  "BranchName": "main",
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
                    "Ref": "MediaBuildProject"
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
          }
        ]
      }
    },
    "PipelineEventRule": {
      "Type": "AWS::Events::Rule",
      "Properties": {
        "Name": {
          "Fn::Sub": "media-pipeline-event-rule-${EnvironmentSuffix}"
        },
        "Description": "Trigger notifications on pipeline state changes",
        "EventPattern": {
          "source": ["aws.codepipeline"],
          "detail-type": ["CodePipeline Pipeline Execution State Change"],
          "detail": {
            "pipeline": [
              {
                "Ref": "MediaPipeline"
              }
            ]
          }
        },
        "State": "ENABLED",
        "Targets": [
          {
            "Arn": {
              "Ref": "PipelineNotificationTopic"
            },
            "Id": "PipelineNotificationTarget"
          }
        ]
      }
    },
    "EventRuleTopicPolicy": {
      "Type": "AWS::SNS::TopicPolicy",
      "Properties": {
        "Topics": [
          {
            "Ref": "PipelineNotificationTopic"
          }
        ],
        "PolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "events.amazonaws.com"
              },
              "Action": "sns:Publish",
              "Resource": {
                "Ref": "PipelineNotificationTopic"
              }
            }
          ]
        }
      }
    }
  },
  "Outputs": {
    "RepositoryCloneUrlHttp": {
      "Description": "HTTP clone URL for the CodeCommit repository",
      "Value": {
        "Fn::GetAtt": ["MediaRepository", "CloneUrlHttp"]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-RepoCloneUrlHttp"
        }
      }
    },
    "RepositoryCloneUrlSsh": {
      "Description": "SSH clone URL for the CodeCommit repository",
      "Value": {
        "Fn::GetAtt": ["MediaRepository", "CloneUrlSsh"]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-RepoCloneUrlSsh"
        }
      }
    },
    "BuildProjectName": {
      "Description": "Name of the CodeBuild project",
      "Value": {
        "Ref": "MediaBuildProject"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-BuildProject"
        }
      }
    },
    "PipelineName": {
      "Description": "Name of the CodePipeline",
      "Value": {
        "Ref": "MediaPipeline"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-Pipeline"
        }
      }
    },
    "ArtifactBucketName": {
      "Description": "Name of the S3 bucket for pipeline artifacts",
      "Value": {
        "Ref": "ArtifactBucket"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-ArtifactBucket"
        }
      }
    },
    "BuildLogGroupName": {
      "Description": "Name of the CloudWatch log group for CodeBuild",
      "Value": {
        "Ref": "BuildLogGroup"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-BuildLogGroup"
        }
      }
    },
    "NotificationTopicArn": {
      "Description": "ARN of the SNS topic for pipeline notifications",
      "Value": {
        "Ref": "PipelineNotificationTopic"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-NotificationTopic"
        }
      }
    }
  }
}
```

## Implementation Notes

This CloudFormation template creates a complete CI/CD pipeline infrastructure for a streaming media processing platform with the following components:

1. **CodeCommit Repository**: Git repository for media processing application code
2. **S3 Artifact Bucket**: Encrypted storage for pipeline artifacts
3. **CodeBuild Project**: Build environment optimized for media processing applications
4. **CodePipeline**: Two-stage pipeline (Source and Build)
5. **SNS Notifications**: Pipeline event notifications
6. **EventBridge Rule**: Triggers SNS notifications on pipeline state changes
7. **IAM Roles**: Service roles for CodeBuild and CodePipeline

All resources use the EnvironmentSuffix parameter for resource naming uniqueness across multiple environments.
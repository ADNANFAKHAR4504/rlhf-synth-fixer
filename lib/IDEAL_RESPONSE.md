```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "CI/CD pipeline with CodeBuild, CodePipeline, StackSets, manual approval, SNS, tags, encryption, logging",
  "Parameters": {
    "GitHubOwner": {
      "Type": "String",
      "Description": "GitHub owner or organization"
    },
    "GitHubRepo": {
      "Type": "String",
      "Description": "GitHub repository name"
    },
    "GitHubBranch": {
      "Type": "String",
      "Default": "main",
      "Description": "Branch to build from"
    },
    "GitHubOAuthToken": {
      "Type": "String",
      "NoEcho": true,
      "Description": "GitHub OAuth token (with repo read permissions)"
    },
    "ArtifactBucketName": {
      "Type": "String",
      "Description": "S3 bucket name for pipeline artifacts"
    },
    "KmsKeyArn": {
      "Type": "String",
      "Description": "KMS key ARN to encrypt S3 artifacts"
    },
    "NotificationEmail": {
      "Type": "String",
      "Description": "Email address to subscribe to SNS notifications"
    },
    "TagEnvironment": {
      "Type": "String",
      "AllowedValues": [
        "dev",
        "staging",
        "prod"
      ],
      "Description": "Tag for environment (used as default tag)"
    }
  },
  "Conditions": {
    "IsProd": {
      "Fn::Equals": [
        {
          "Ref": "TagEnvironment"
        },
        "prod"
      ]
    }
  },
  "Resources": {
    "PipelineArtifactBucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": {
          "Ref": "ArtifactBucketName"
        },
        "VersioningConfiguration": {
          "Status": "Enabled"
        },
        "BucketEncryption": {
          "ServerSideEncryptionConfiguration": [
            {
              "ServerSideEncryptionByDefault": {
                "KMSMasterKeyID": {
                  "Ref": "KmsKeyArn"
                },
                "SSEAlgorithm": "aws:kms"
              }
            }
          ]
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": {
              "Ref": "TagEnvironment"
            }
          },
          {
            "Key": "Project",
            "Value": {
              "Ref": "AWS::StackName"
            }
          }
        ]
      }
    },
    "PipelineArtifactBucketPolicy": {
      "Type": "AWS::S3::BucketPolicy",
      "Properties": {
        "Bucket": {
          "Ref": "PipelineArtifactBucket"
        },
        "PolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Sid": "AllowCodePipelineS3Access",
              "Effect": "Allow",
              "Principal": {
                "Service": "codepipeline.amazonaws.com"
              },
              "Action": [
                "s3:GetObject",
                "s3:GetObjectVersion",
                "s3:PutObject"
              ],
              "Resource": {
                "Fn::Sub": "arn:${AWS::Partition}:s3:::${ArtifactBucketName}/*"
              }
            }
          ]
        }
      }
    },
    "SNSTopicPipelineNotifications": {
      "Type": "AWS::SNS::Topic",
      "Properties": {
        "DisplayName": "PipelineNotifications",
        "Subscription": [
          {
            "Endpoint": {
              "Ref": "NotificationEmail"
            },
            "Protocol": "email"
          }
        ],
        "Tags": [
          {
            "Key": "Environment",
            "Value": {
              "Ref": "TagEnvironment"
            }
          },
          {
            "Key": "Project",
            "Value": {
              "Ref": "AWS::StackName"
            }
          }
        ]
      }
    },
    "CodePipelineRole": {
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
        "Path": "/",
        "Policies": [
          {
            "PolicyName": "CodePipelineArtifactAccess",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Sid": "AllowS3ArtifactAccess",
                  "Effect": "Allow",
                  "Action": [
                    "s3:GetObject",
                    "s3:GetObjectVersion",
                    "s3:PutObject"
                  ],
                  "Resource": {
                    "Fn::Sub": "arn:${AWS::Partition}:s3:::${ArtifactBucketName}/*"
                  }
                }
              ]
            }
          },
          {
            "PolicyName": "CodePipelineStackSetPermissions",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Sid": "AllowCFStackSetActions",
                  "Effect": "Allow",
                  "Action": [
                    "cloudformation:CreateStackSet",
                    "cloudformation:UpdateStackSet",
                    "cloudformation:DeleteStackSet",
                    "cloudformation:CreateStackInstances",
                    "cloudformation:DeleteStackInstances",
                    "cloudformation:UpdateStackInstances",
                    "cloudformation:DescribeStackSet",
                    "cloudformation:ListStackInstances",
                    "cloudformation:ListStackSets",
                    "cloudformation:DescribeStackInstance",
                    "cloudformation:ListStackSetOperationResults",
                    "cloudformation:ListStackSetOperations"
                  ],
                  "Resource": "*"
                },
                {
                  "Sid": "AllowIAMPassRole",
                  "Effect": "Allow",
                  "Action": [
                    "iam:PassRole"
                  ],
                  "Resource": "*"
                },
                {
                  "Sid": "AllowSNSPublish",
                  "Effect": "Allow",
                  "Action": [
                    "sns:Publish"
                  ],
                  "Resource": {
                    "Ref": "SNSTopicPipelineNotifications"
                  }
                }
              ]
            }
          }
        ],
        "Tags": [
          {
            "Key": "Environment",
            "Value": {
              "Ref": "TagEnvironment"
            }
          },
          {
            "Key": "Project",
            "Value": {
              "Ref": "AWS::StackName"
            }
          }
        ]
      }
    },
    "CodeBuildRole": {
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
        "Path": "/",
        "ManagedPolicyArns": [
          "arn:aws:iam::aws:policy/AmazonS3FullAccess",
          "arn:aws:iam::aws:policy/AWSCloudFormationFullAccess"
        ],
        "Policies": [
          {
            "PolicyName": "CodeBuildNotifySNS",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Sid": "PublishToSNS",
                  "Effect": "Allow",
                  "Action": "sns:Publish",
                  "Resource": {
                    "Ref": "SNSTopicPipelineNotifications"
                  }
                }
              ]
            }
          }
        ],
        "Tags": [
          {
            "Key": "Environment",
            "Value": {
              "Ref": "TagEnvironment"
            }
          },
          {
            "Key": "Project",
            "Value": {
              "Ref": "AWS::StackName"
            }
          }
        ]
      }
    },
    "CodeBuildProject": {
      "Type": "AWS::CodeBuild::Project",
      "Properties": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-build"
        },
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
          "ComputeType": "BUILD_GENERAL1_SMALL",
          "Image": "aws/codebuild/standard:6.0",
          "Type": "LINUX_CONTAINER",
          "EnvironmentVariables": [
            {
              "Name": "ENVIRONMENT",
              "Value": {
                "Ref": "TagEnvironment"
              }
            }
          ]
        },
        "Source": {
          "Type": "CODEPIPELINE",
          "BuildSpec": "buildspec.yml"
        },
        "LogsConfig": {
          "CloudWatchLogs": {
            "Status": "ENABLED",
            "GroupName": {
              "Fn::Sub": "/aws/codebuild/${AWS::StackName}"
            },
            "StreamName": {
              "Fn::Sub": "${AWS::StackName}-build"
            }
          }
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": {
              "Ref": "TagEnvironment"
            }
          },
          {
            "Key": "Project",
            "Value": {
              "Ref": "AWS::StackName"
            }
          }
        ]
      }
    },
    "CodePipeline": {
      "Type": "AWS::CodePipeline::Pipeline",
      "Properties": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-pipeline"
        },
        "RoleArn": {
          "Fn::GetAtt": [
            "CodePipelineRole",
            "Arn"
          ]
        },
        "ArtifactStore": {
          "Type": "S3",
          "Location": {
            "Ref": "PipelineArtifactBucket"
          },
          "EncryptionKey": {
            "Id": {
              "Ref": "KmsKeyArn"
            },
            "Type": "KMS"
          }
        },
        "RestartExecutionOnUpdate": false,
        "Stages": [
          {
            "Name": "Source",
            "Actions": [
              {
                "Name": "GitHub_Source",
                "ActionTypeId": {
                  "Category": "Source",
                  "Owner": "ThirdParty",
                  "Provider": "GitHub",
                  "Version": "1"
                },
                "Configuration": {
                  "Owner": {
                    "Ref": "GitHubOwner"
                  },
                  "Repo": {
                    "Ref": "GitHubRepo"
                  },
                  "Branch": {
                    "Ref": "GitHubBranch"
                  },
                  "OAuthToken": {
                    "Ref": "GitHubOAuthToken"
                  }
                },
                "OutputArtifacts": [
                  {
                    "Name": "SourceOutput"
                  }
                ],
                "RunOrder": 1
              }
            ]
          },
          {
            "Name": "Build",
            "Actions": [
              {
                "Name": "CodeBuild_Action",
                "ActionTypeId": {
                  "Category": "Build",
                  "Owner": "AWS",
                  "Provider": "CodeBuild",
                  "Version": "1"
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
                ],
                "Configuration": {
                  "ProjectName": {
                    "Fn::GetAtt": [
                      "CodeBuildProject",
                      "Name"
                    ]
                  }
                },
                "RunOrder": 1
              }
            ]
          },
          {
            "Name": "Deploy_StackSet",
            "Actions": [
              {
                "Name": "CreateOrUpdate_StackSet",
                "ActionTypeId": {
                  "Category": "Deploy",
                  "Owner": "AWS",
                  "Provider": "CloudFormationStackSet",
                  "Version": "1"
                },
                "InputArtifacts": [
                  {
                    "Name": "BuildOutput"
                  }
                ],
                "Configuration": {
                  "StackSetName": {
                    "Fn::Sub": "${AWS::StackName}-StackSet"
                  },
                  "TemplatePath": "BuildOutput::template.yaml",
                  "Capabilities": "CAPABILITY_NAMED_IAM",
                  "PermissionModel": "SELF_MANAGED"
                },
                "RunOrder": 1
              },
              {
                "Name": "Deploy_StackInstances",
                "ActionTypeId": {
                  "Category": "Deploy",
                  "Owner": "AWS",
                  "Provider": "CloudFormationStackInstances",
                  "Version": "1"
                },
                "InputArtifacts": [
                  {
                    "Name": "BuildOutput"
                  }
                ],
                "Configuration": {
                  "StackSetName": {
                    "Fn::Sub": "${AWS::StackName}-StackSet"
                  },
                  "Regions": "us-west-2,us-east-1",
                  "Accounts": "123456789012,111122223333",
                  "ParameterOverrides": "BuildOutput::stackset-params.json",
                  "Capabilities": "CAPABILITY_NAMED_IAM",
                  "OperationPreferences": "{\"FailureToleranceCount\":1, \"MaxConcurrentCount\":2}"
                },
                "RunOrder": 2
              }
            ]
          },
          {
            "Name": "Approval_Prod",
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
                    "Ref": "SNSTopicPipelineNotifications"
                  },
                  "CustomData": "Please approve deployment to production"
                },
                "RunOrder": 1
              }
            ]
          },
          {
            "Name": "Deploy_To_Prod",
            "Actions": [
              {
                "Name": "Deploy_Prod_StackInstances",
                "ActionTypeId": {
                  "Category": "Deploy",
                  "Owner": "AWS",
                  "Provider": "CloudFormationStackInstances",
                  "Version": "1"
                },
                "InputArtifacts": [
                  {
                    "Name": "BuildOutput"
                  }
                ],
                "Configuration": {
                  "StackSetName": {
                    "Fn::Sub": "${AWS::StackName}-StackSet"
                  },
                  "Regions": "us-west-2,us-east-1",
                  "Accounts": "222233334444,333344445555",
                  "ParameterOverrides": "BuildOutput::stackset-params-prod.json",
                  "Capabilities": "CAPABILITY_NAMED_IAM",
                  "OperationPreferences": "{\"FailureToleranceCount\":1, \"MaxConcurrentCount\":1}"
                },
                "RunOrder": 1
              }
            ]
          }
        ],
        "Tags": [
          {
            "Key": "Environment",
            "Value": {
              "Ref": "TagEnvironment"
            }
          },
          {
            "Key": "Project",
            "Value": {
              "Ref": "AWS::StackName"
            }
          }
        ]
      }
    }
  },
  "Outputs": {
    "PipelineName": {
      "Description": "Name of the pipeline",
      "Value": {
        "Fn::GetAtt": [
          "CodePipeline",
          "Name"
        ]
      }
    },
    "SNSTopicArn": {
      "Description": "SNS topic ARN for pipeline notifications",
      "Value": {
        "Ref": "SNSTopicPipelineNotifications"
      }
    }
  }
}
```
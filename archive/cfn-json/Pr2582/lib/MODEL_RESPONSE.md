# Complete CI/CD Pipeline CloudFormation Template

Here's a comprehensive CloudFormation template that creates a complete CI/CD pipeline meeting all your requirements:

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Complete CI/CD pipeline for web application using CodePipeline, CodeBuild, CodeDeploy, and Elastic Beanstalk with security best practices and monitoring",
  "Metadata": {
    "Author": "DevTeam Infrastructure",
    "Version": "1.0",
    "Purpose": "Production-ready CI/CD pipeline with staging and production environments"
  },
  "Parameters": {
    "GitHubRepository": {
      "Type": "String",
      "Description": "GitHub repository name (owner/repo-name)",
      "Default": "myorg/my-web-app"
    },
    "GitHubBranch": {
      "Type": "String",
      "Description": "GitHub branch to track for pipeline triggers",
      "Default": "main"
    },
    "GitHubOAuthToken": {
      "Type": "String",
      "Description": "GitHub OAuth token for repository access",
      "NoEcho": true,
      "MinLength": 40,
      "MaxLength": 40
    },
    "NotificationEmail": {
      "Type": "String",
      "Description": "Email address for pipeline notifications",
      "AllowedPattern": "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
      "ConstraintDescription": "Must be a valid email address"
    },
    "ApplicationName": {
      "Type": "String",
      "Description": "Name of the application",
      "Default": "devteam-webapp",
      "AllowedPattern": "^[a-zA-Z0-9-]+$"
    }
  },
  "Resources": {
    "devteam-KMSKey": {
      "Type": "AWS::KMS::Key",
      "Properties": {
        "Description": "KMS key for encrypting CI/CD pipeline artifacts",
        "KeyPolicy": {
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
              "Sid": "Allow use of the key for pipeline services",
              "Effect": "Allow",
              "Principal": {
                "Service": [
                  "codepipeline.amazonaws.com",
                  "codebuild.amazonaws.com",
                  "s3.amazonaws.com"
                ]
              },
              "Action": [
                "kms:Encrypt",
                "kms:Decrypt",
                "kms:ReEncrypt*",
                "kms:GenerateDataKey*",
                "kms:DescribeKey"
              ],
              "Resource": "*"
            }
          ]
        }
      }
    },
    "devteam-KMSKeyAlias": {
      "Type": "AWS::KMS::Alias",
      "Properties": {
        "AliasName": "alias/devteam-pipeline-key",
        "TargetKeyId": {
          "Ref": "devteam-KMSKey"
        }
      }
    },
    "devteam-ArtifactStore": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "devteam-pipeline-artifacts-${AWS::AccountId}-${AWS::Region}"
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
                  "Ref": "devteam-KMSKey"
                }
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
              "Id": "DeleteOldArtifacts",
              "Status": "Enabled",
              "ExpirationInDays": 30
            }
          ]
        }
      }
    },
    "devteam-SNSTopic": {
      "Type": "AWS::SNS::Topic",
      "Properties": {
        "TopicName": "devteam-pipeline-notifications",
        "DisplayName": "DevTeam Pipeline Notifications",
        "KmsMasterKeyId": {
          "Ref": "devteam-KMSKey"
        }
      }
    },
    "devteam-SNSSubscription": {
      "Type": "AWS::SNS::Subscription",
      "Properties": {
        "TopicArn": {
          "Ref": "devteam-SNSTopic"
        },
        "Protocol": "email",
        "Endpoint": {
          "Ref": "NotificationEmail"
        }
      }
    },
    "devteam-CodePipelineServiceRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": "devteam-codepipeline-service-role",
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
            "PolicyName": "devteam-pipeline-policy",
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
                      "Fn::Sub": "${devteam-ArtifactStore}/*"
                    },
                    {
                      "Fn::GetAtt": ["devteam-ArtifactStore", "Arn"]
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
                    "Fn::GetAtt": ["devteam-CodeBuildProject", "Arn"]
                  }
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "elasticbeanstalk:CreateApplicationVersion",
                    "elasticbeanstalk:DescribeApplicationVersions",
                    "elasticbeanstalk:DescribeEnvironments",
                    "elasticbeanstalk:UpdateEnvironment"
                  ],
                  "Resource": "*"
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "sns:Publish"
                  ],
                  "Resource": {
                    "Ref": "devteam-SNSTopic"
                  }
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "kms:Decrypt",
                    "kms:GenerateDataKey"
                  ],
                  "Resource": {
                    "Fn::GetAtt": ["devteam-KMSKey", "Arn"]
                  }
                }
              ]
            }
          }
        ]
      }
    },
    "devteam-CodeBuildServiceRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": "devteam-codebuild-service-role",
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
            "PolicyName": "devteam-codebuild-policy",
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
                    "Fn::Sub": "arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/codebuild/devteam-*"
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
                    "Fn::Sub": "${devteam-ArtifactStore}/*"
                  }
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "codebuild:CreateReportGroup",
                    "codebuild:CreateReport",
                    "codebuild:UpdateReport",
                    "codebuild:BatchPutTestCases"
                  ],
                  "Resource": {
                    "Fn::Sub": "arn:aws:codebuild:${AWS::Region}:${AWS::AccountId}:report-group/devteam-*"
                  }
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "kms:Decrypt",
                    "kms:GenerateDataKey"
                  ],
                  "Resource": {
                    "Fn::GetAtt": ["devteam-KMSKey", "Arn"]
                  }
                }
              ]
            }
          }
        ]
      }
    },
    "devteam-ElasticBeanstalkServiceRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": "devteam-elasticbeanstalk-service-role",
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "elasticbeanstalk.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "ManagedPolicyArns": [
          "arn:aws:iam::aws:policy/service-role/AWSElasticBeanstalkEnhancedHealth",
          "arn:aws:iam::aws:policy/AWSElasticBeanstalkManagedUpdatesCustomerRolePolicy"
        ]
      }
    },
    "devteam-ElasticBeanstalkInstanceProfile": {
      "Type": "AWS::IAM::InstanceProfile",
      "Properties": {
        "InstanceProfileName": "devteam-elasticbeanstalk-instance-profile",
        "Roles": [
          {
            "Ref": "devteam-ElasticBeanstalkInstanceRole"
          }
        ]
      }
    },
    "devteam-ElasticBeanstalkInstanceRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": "devteam-elasticbeanstalk-instance-role",
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
          "arn:aws:iam::aws:policy/AWSElasticBeanstalkWebTier",
          "arn:aws:iam::aws:policy/AWSElasticBeanstalkMulticontainerDocker",
          "arn:aws:iam::aws:policy/AWSElasticBeanstalkWorkerTier"
        ]
      }
    },
    "devteam-CodeBuildProject": {
      "Type": "AWS::CodeBuild::Project",
      "Properties": {
        "Name": "devteam-build-project",
        "Description": "Build project for web application with testing and static analysis",
        "ServiceRole": {
          "Fn::GetAtt": ["devteam-CodeBuildServiceRole", "Arn"]
        },
        "Artifacts": {
          "Type": "CODEPIPELINE"
        },
        "Environment": {
          "Type": "LINUX_CONTAINER",
          "ComputeType": "BUILD_GENERAL1_SMALL",
          "Image": "aws/codebuild/amazonlinux2-x86_64-standard:3.0"
        },
        "Source": {
          "Type": "CODEPIPELINE",
          "BuildSpec": {
            "Fn::Sub": "version: 0.2\nphases:\n  install:\n    runtime-versions:\n      nodejs: 14\n    commands:\n      - echo Installing dependencies...\n      - npm install\n      - npm install -g eslint jest\n  pre_build:\n    commands:\n      - echo Running static code analysis...\n      - eslint . || true\n      - echo Running unit tests...\n      - npm test\n  build:\n    commands:\n      - echo Building the application...\n      - npm run build\n  post_build:\n    commands:\n      - echo Build completed on `date`\nartifacts:\n  files:\n    - '**/*'\n  name: ${ApplicationName}-$(date +%Y-%m-%d)\nreports:\n  jest_reports:\n    files:\n      - 'test-results.xml'\n    file-format: 'JUNITXML'\n  coverage_reports:\n    files:\n      - 'coverage/clover.xml'\n    file-format: 'CLOVERXML'"
          }
        },
        "TimeoutInMinutes": 15,
        "EncryptionKey": {
          "Fn::GetAtt": ["devteam-KMSKey", "Arn"]
        },
        "LogsConfig": {
          "CloudWatchLogs": {
            "Status": "ENABLED",
            "GroupName": {
              "Ref": "devteam-CodeBuildLogGroup"
            }
          }
        }
      }
    },
    "devteam-CodeBuildLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": "/aws/codebuild/devteam-build-project",
        "RetentionInDays": 14
      }
    },
    "devteam-ElasticBeanstalkApplication": {
      "Type": "AWS::ElasticBeanstalk::Application",
      "Properties": {
        "ApplicationName": {
          "Ref": "ApplicationName"
        },
        "Description": "Web application managed by CI/CD pipeline"
      }
    },
    "devteam-StagingEnvironment": {
      "Type": "AWS::ElasticBeanstalk::Environment",
      "Properties": {
        "ApplicationName": {
          "Ref": "devteam-ElasticBeanstalkApplication"
        },
        "EnvironmentName": {
          "Fn::Sub": "${ApplicationName}-staging"
        },
        "Description": "Staging environment for testing deployments",
        "SolutionStackName": "64bit Amazon Linux 2 v5.4.6 running Node.js 14",
        "OptionSettings": [
          {
            "Namespace": "aws:autoscaling:launchconfiguration",
            "OptionName": "IamInstanceProfile",
            "Value": {
              "Ref": "devteam-ElasticBeanstalkInstanceProfile"
            }
          },
          {
            "Namespace": "aws:autoscaling:launchconfiguration",
            "OptionName": "InstanceType",
            "Value": "t3.micro"
          },
          {
            "Namespace": "aws:autoscaling:asg",
            "OptionName": "MinSize",
            "Value": "1"
          },
          {
            "Namespace": "aws:autoscaling:asg",
            "OptionName": "MaxSize",
            "Value": "2"
          },
          {
            "Namespace": "aws:elasticbeanstalk:healthreporting:system",
            "OptionName": "SystemType",
            "Value": "enhanced"
          },
          {
            "Namespace": "aws:elasticbeanstalk:environment",
            "OptionName": "ServiceRole",
            "Value": {
              "Ref": "devteam-ElasticBeanstalkServiceRole"
            }
          },
          {
            "Namespace": "aws:elasticbeanstalk:application:environment",
            "OptionName": "NODE_ENV",
            "Value": "staging"
          }
        ]
      }
    },
    "devteam-ProductionEnvironment": {
      "Type": "AWS::ElasticBeanstalk::Environment",
      "Properties": {
        "ApplicationName": {
          "Ref": "devteam-ElasticBeanstalkApplication"
        },
        "EnvironmentName": {
          "Fn::Sub": "${ApplicationName}-production"
        },
        "Description": "Production environment for live application",
        "SolutionStackName": "64bit Amazon Linux 2 v5.4.6 running Node.js 14",
        "OptionSettings": [
          {
            "Namespace": "aws:autoscaling:launchconfiguration",
            "OptionName": "IamInstanceProfile",
            "Value": {
              "Ref": "devteam-ElasticBeanstalkInstanceProfile"
            }
          },
          {
            "Namespace": "aws:autoscaling:launchconfiguration",
            "OptionName": "InstanceType",
            "Value": "t3.micro"
          },
          {
            "Namespace": "aws:autoscaling:asg",
            "OptionName": "MinSize",
            "Value": "1"
          },
          {
            "Namespace": "aws:autoscaling:asg",
            "OptionName": "MaxSize",
            "Value": "2"
          },
          {
            "Namespace": "aws:elasticbeanstalk:healthreporting:system",
            "OptionName": "SystemType",
            "Value": "enhanced"
          },
          {
            "Namespace": "aws:elasticbeanstalk:environment",
            "OptionName": "ServiceRole",
            "Value": {
              "Ref": "devteam-ElasticBeanstalkServiceRole"
            }
          },
          {
            "Namespace": "aws:elasticbeanstalk:application:environment",
            "OptionName": "NODE_ENV",
            "Value": "production"
          },
          {
            "Namespace": "aws:elasticbeanstalk:command",
            "OptionName": "DeploymentPolicy",
            "Value": "RollingWithAdditionalBatch"
          }
        ]
      }
    },
    "devteam-Pipeline": {
      "Type": "AWS::CodePipeline::Pipeline",
      "Properties": {
        "Name": "devteam-cicd-pipeline",
        "RoleArn": {
          "Fn::GetAtt": ["devteam-CodePipelineServiceRole", "Arn"]
        },
        "ArtifactStore": {
          "Type": "S3",
          "Location": {
            "Ref": "devteam-ArtifactStore"
          },
          "EncryptionKey": {
            "Id": {
              "Fn::GetAtt": ["devteam-KMSKey", "Arn"]
            },
            "Type": "KMS"
          }
        },
        "RestartExecutionOnUpdate": true,
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
                    "Fn::Select": [0, {"Fn::Split": ["/", {"Ref": "GitHubRepository"}]}]
                  },
                  "Repo": {
                    "Fn::Select": [1, {"Fn::Split": ["/", {"Ref": "GitHubRepository"}]}]
                  },
                  "Branch": {
                    "Ref": "GitHubBranch"
                  },
                  "OAuthToken": {
                    "Ref": "GitHubOAuthToken"
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
                    "Ref": "devteam-CodeBuildProject"
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
                ],
                "OnFailure": {
                  "ActionTypeId": {
                    "Category": "Invoke",
                    "Owner": "SNS",
                    "Provider": "SNS",
                    "Version": "1"
                  },
                  "Configuration": {
                    "TopicArn": {
                      "Ref": "devteam-SNSTopic"
                    },
                    "Message": "Build stage failed in devteam CI/CD pipeline"
                  }
                },
                "RetryConfiguration": {
                  "RetryMode": "FAILED_ACTIONS_ONLY"
                }
              }
            ]
          },
          {
            "Name": "DeployToStaging",
            "Actions": [
              {
                "Name": "DeployStagingAction",
                "ActionTypeId": {
                  "Category": "Deploy",
                  "Owner": "AWS",
                  "Provider": "ElasticBeanstalk",
                  "Version": "1"
                },
                "Configuration": {
                  "ApplicationName": {
                    "Ref": "devteam-ElasticBeanstalkApplication"
                  },
                  "EnvironmentName": {
                    "Ref": "devteam-StagingEnvironment"
                  }
                },
                "InputArtifacts": [
                  {
                    "Name": "BuildOutput"
                  }
                ],
                "RetryConfiguration": {
                  "RetryMode": "FAILED_ACTIONS_ONLY"
                }
              }
            ]
          },
          {
            "Name": "ManualApproval",
            "Actions": [
              {
                "Name": "ApprovalAction",
                "ActionTypeId": {
                  "Category": "Approval",
                  "Owner": "AWS",
                  "Provider": "Manual",
                  "Version": "1"
                },
                "Configuration": {
                  "NotificationArn": {
                    "Ref": "devteam-SNSTopic"
                  },
                  "CustomData": {
                    "Fn::Sub": "Please review the staging deployment at: http://${devteam-StagingEnvironment}.${AWS::Region}.elasticbeanstalk.com and approve for production deployment."
                  }
                }
              }
            ]
          },
          {
            "Name": "DeployToProduction",
            "Actions": [
              {
                "Name": "DeployProductionAction",
                "ActionTypeId": {
                  "Category": "Deploy",
                  "Owner": "AWS",
                  "Provider": "ElasticBeanstalk",
                  "Version": "1"
                },
                "Configuration": {
                  "ApplicationName": {
                    "Ref": "devteam-ElasticBeanstalkApplication"
                  },
                  "EnvironmentName": {
                    "Ref": "devteam-ProductionEnvironment"
                  }
                },
                "InputArtifacts": [
                  {
                    "Name": "BuildOutput"
                  }
                ],
                "OnFailure": {
                  "ActionTypeId": {
                    "Category": "Invoke",
                    "Owner": "SNS",
                    "Provider": "SNS",
                    "Version": "1"
                  },
                  "Configuration": {
                    "TopicArn": {
                      "Ref": "devteam-SNSTopic"
                    },
                    "Message": "Production deployment failed in devteam CI/CD pipeline"
                  }
                },
                "RetryConfiguration": {
                  "RetryMode": "FAILED_ACTIONS_ONLY"
                }
              }
            ]
          }
        ]
      },
      "DependsOn": [
        "devteam-StagingEnvironment",
        "devteam-ProductionEnvironment"
      ]
    },
    "devteam-GitHubWebhook": {
      "Type": "AWS::CodePipeline::Webhook",
      "Properties": {
        "Name": "devteam-github-webhook",
        "Authentication": "GITHUB_HMAC",
        "AuthenticationConfiguration": {
          "SecretToken": {
            "Ref": "GitHubOAuthToken"
          }
        },
        "RegisterWithThirdParty": true,
        "Filters": [
          {
            "JsonPath": "$.ref",
            "MatchEquals": {
              "Fn::Sub": "refs/heads/${GitHubBranch}"
            }
          }
        ],
        "TargetPipeline": {
          "Ref": "devteam-Pipeline"
        },
        "TargetAction": "SourceAction",
        "TargetPipelineVersion": {
          "Fn::GetAtt": ["devteam-Pipeline", "Version"]
        }
      }
    },
    "devteam-PipelineFailureAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": "devteam-pipeline-failure-alarm",
        "AlarmDescription": "Alarm for CI/CD pipeline failures",
        "MetricName": "PipelineExecutionFailure",
        "Namespace": "AWS/CodePipeline",
        "Statistic": "Sum",
        "Period": 300,
        "EvaluationPeriods": 1,
        "Threshold": 1,
        "ComparisonOperator": "GreaterThanOrEqualToThreshold",
        "Dimensions": [
          {
            "Name": "PipelineName",
            "Value": {
              "Ref": "devteam-Pipeline"
            }
          }
        ],
        "AlarmActions": [
          {
            "Ref": "devteam-SNSTopic"
          }
        ]
      }
    },
    "devteam-EventRule": {
      "Type": "AWS::Events::Rule",
      "Properties": {
        "Name": "devteam-pipeline-state-change",
        "Description": "Capture pipeline state changes",
        "EventPattern": {
          "source": ["aws.codepipeline"],
          "detail-type": ["CodePipeline Pipeline Execution State Change"],
          "detail": {
            "pipeline": [
              {
                "Ref": "devteam-Pipeline"
              }
            ]
          }
        },
        "State": "ENABLED",
        "Targets": [
          {
            "Arn": {
              "Ref": "devteam-SNSTopic"
            },
            "Id": "PipelineNotificationTarget",
            "InputTransformer": {
              "InputPathsMap": {
                "pipeline": "$.detail.pipeline",
                "state": "$.detail.state"
              },
              "InputTemplate": "\"Pipeline <pipeline> has changed state to <state>\""
            }
          }
        ]
      }
    },
    "devteam-EventRulePermission": {
      "Type": "AWS::SNS::TopicPolicy",
      "Properties": {
        "Topics": [
          {
            "Ref": "devteam-SNSTopic"
          }
        ],
        "PolicyDocument": {
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "events.amazonaws.com"
              },
              "Action": "sns:Publish",
              "Resource": {
                "Ref": "devteam-SNSTopic"
              }
            }
          ]
        }
      }
    }
  },
  "Outputs": {
    "PipelineArn": {
      "Description": "ARN of the CI/CD pipeline",
      "Value": {
        "Fn::Sub": "arn:aws:codepipeline:${AWS::Region}:${AWS::AccountId}:pipeline/${devteam-Pipeline}"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-PipelineArn"
        }
      }
    },
    "ArtifactStoreBucket": {
      "Description": "S3 bucket for pipeline artifacts",
      "Value": {
        "Ref": "devteam-ArtifactStore"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-ArtifactStore"
        }
      }
    },
    "StagingEnvironmentURL": {
      "Description": "URL of the staging Elastic Beanstalk environment",
      "Value": {
        "Fn::Sub": "http://${devteam-StagingEnvironment}.${AWS::Region}.elasticbeanstalk.com"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-StagingURL"
        }
      }
    },
    "ProductionEnvironmentURL": {
      "Description": "URL of the production Elastic Beanstalk environment",
      "Value": {
        "Fn::Sub": "http://${devteam-ProductionEnvironment}.${AWS::Region}.elasticbeanstalk.com"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-Product
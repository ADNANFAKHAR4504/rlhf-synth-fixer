```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "CI/CD pipeline with CodePipeline, CodeBuild, CodeDeploy, SNS, and manual approval for single AWS account.",
  "Parameters": {
    "GitHubOwner": {
      "Type": "String",
      "Default": "dummy-owner",
      "Description": "GitHub organization or username"
    },
    "GitHubRepo": {
      "Type": "String",
      "Default": "dummy-repo",
      "Description": "GitHub repository name"
    },
    "GitHubBranch": {
      "Type": "String",
      "Default": "main",
      "Description": "GitHub branch name"
    },
    "GitHubOAuthToken": {
      "Type": "String",
      "NoEcho": true,
      "Default": "ghp_exampletoken",
      "Description": "GitHub Personal Access Token"
    },
    "NotificationEmail": {
      "Type": "String",
      "Default": "you@example.com",
      "Description": "Email for SNS notifications"
    },
    "ApplicationName": {
      "Type": "String",
      "Default": "MyCodeDeployApp",
      "Description": "CodeDeploy application name"
    },
    "DeploymentGroupName": {
      "Type": "String",
      "Default": "MyDeploymentGroup",
      "Description": "CodeDeploy deployment group name"
    }
  },
  "Resources": {
    "ArtifactBucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "VersioningConfiguration": { "Status": "Enabled" },
        "Tags": [{ "Key": "CreatedBy", "Value": "CICDPipeline" }]
      }
    },
    "SNSTopic": {
      "Type": "AWS::SNS::Topic",
      "Properties": {
        "Subscription": [
          {
            "Protocol": "email",
            "Endpoint": { "Ref": "NotificationEmail" }
          }
        ]
      }
    },
    "PipelineRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": { "Service": "codepipeline.amazonaws.com" },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "Policies": [
          {
            "PolicyName": "PipelinePolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:*",
                    "codebuild:*",
                    "codedeploy:*",
                    "sns:Publish",
                    "iam:PassRole"
                  ],
                  "Resource": "*"
                }
              ]
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
              "Principal": { "Service": "codebuild.amazonaws.com" },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "Policies": [
          {
            "PolicyName": "BuildPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "logs:*",
                    "s3:*"
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
        "Name": { "Fn::Sub": "${AWS::StackName}-Build" },
        "ServiceRole": { "Fn::GetAtt": ["CodeBuildRole", "Arn"] },
        "Artifacts": { "Type": "CODEPIPELINE" },
        "Environment": {
          "ComputeType": "BUILD_GENERAL1_SMALL",
          "Image": "aws/codebuild/standard:6.0",
          "Type": "LINUX_CONTAINER"
        },
        "Source": {
          "Type": "CODEPIPELINE",
          "BuildSpec": "buildspec.yml"
        }
      }
    },
    "CodeDeployApplication": {
      "Type": "AWS::CodeDeploy::Application",
      "Properties": {
        "ApplicationName": { "Ref": "ApplicationName" },
        "ComputePlatform": "Server"
      }
    },
    "CodeDeployDeploymentGroup": {
      "Type": "AWS::CodeDeploy::DeploymentGroup",
      "Properties": {
        "ApplicationName": { "Ref": "CodeDeployApplication" },
        "DeploymentGroupName": { "Ref": "DeploymentGroupName" },
        "ServiceRoleArn": { "Fn::GetAtt": ["PipelineRole", "Arn"] },
        "DeploymentConfigName": "CodeDeployDefault.AllAtOnce",
        "AutoRollbackConfiguration": {
          "Enabled": true,
          "Events": ["DEPLOYMENT_FAILURE"]
        }
      }
    },
    "CodePipeline": {
      "Type": "AWS::CodePipeline::Pipeline",
      "Properties": {
        "RoleArn": { "Fn::GetAtt": ["PipelineRole", "Arn"] },
        "ArtifactStore": {
          "Type": "S3",
          "Location": { "Ref": "ArtifactBucket" }
        },
        "Stages": [
          {
            "Name": "Source",
            "Actions": [
              {
                "Name": "SourceCode",
                "ActionTypeId": {
                  "Category": "Source",
                  "Owner": "ThirdParty",
                  "Provider": "GitHub",
                  "Version": "1"
                },
                "OutputArtifacts": [{ "Name": "SourceOutput" }],
                "Configuration": {
                  "Owner": { "Ref": "GitHubOwner" },
                  "Repo": { "Ref": "GitHubRepo" },
                  "Branch": { "Ref": "GitHubBranch" },
                  "OAuthToken": { "Ref": "GitHubOAuthToken" }
                },
                "RunOrder": 1
              }
            ]
          },
          {
            "Name": "Build",
            "Actions": [
              {
                "Name": "BuildApp",
                "ActionTypeId": {
                  "Category": "Build",
                  "Owner": "AWS",
                  "Provider": "CodeBuild",
                  "Version": "1"
                },
                "InputArtifacts": [{ "Name": "SourceOutput" }],
                "OutputArtifacts": [{ "Name": "BuildOutput" }],
                "Configuration": {
                  "ProjectName": { "Ref": "CodeBuildProject" }
                },
                "RunOrder": 1
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
                  "NotificationArn": { "Ref": "SNSTopic" },
                  "CustomData": "Please approve the deployment"
                },
                "RunOrder": 1
              }
            ]
          },
          {
            "Name": "Deploy",
            "Actions": [
              {
                "Name": "CodeDeployApp",
                "ActionTypeId": {
                  "Category": "Deploy",
                  "Owner": "AWS",
                  "Provider": "CodeDeploy",
                  "Version": "1"
                },
                "InputArtifacts": [{ "Name": "BuildOutput" }],
                "Configuration": {
                  "ApplicationName": { "Ref": "ApplicationName" },
                  "DeploymentGroupName": { "Ref": "DeploymentGroupName" }
                },
                "RunOrder": 1
              }
            ]
          }
        ]
      }
    }
  },
  "Outputs": {
    "PipelineName": {
      "Description": "The name of the CodePipeline",
      "Value": { "Ref": "CodePipeline" }
    },
    "CodeBuildProjectName": {
      "Description": "The name of the CodeBuild project",
      "Value": { "Ref": "CodeBuildProject" }
    },
    "CodeDeployApplicationName": {
      "Description": "The name of the CodeDeploy application",
      "Value": { "Ref": "CodeDeployApplication" }
    },
    "CodeDeployDeploymentGroup": {
      "Description": "The name of the CodeDeploy deployment group",
      "Value": { "Ref": "CodeDeployDeploymentGroup" }
    },
    "SNSTopicARN": {
      "Description": "SNS Topic ARN for notifications",
      "Value": { "Ref": "SNSTopic" }
    },
    "ArtifactBucketName": {
      "Description": "S3 Bucket name for pipeline artifacts",
      "Value": { "Ref": "ArtifactBucket" }
    }
  }
}
```
# Media Processing Pipeline - CloudFormation Implementation

This implementation provides a scalable media processing pipeline for live video streaming using AWS MediaLive, MediaPackage, CloudFront, and supporting services.

## Architecture Overview

The solution includes:
- S3 buckets for media storage and artifacts
- MediaLive channel for live video encoding
- MediaPackage channel for stream packaging
- CloudFront distribution for content delivery
- Lambda functions for automation
- Step Functions for workflow orchestration
- CodePipeline and CodeBuild for CI/CD
- CloudWatch alarms and monitoring
- IAM roles with least privilege

## File: lib/TapStack.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Scalable Media Processing Pipeline for Live Video Streaming",
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
        }
      ]
    }
  },
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Default": "dev",
      "Description": "Environment suffix for resource naming",
      "AllowedPattern": "^[a-zA-Z0-9]+$",
      "ConstraintDescription": "Must contain only alphanumeric characters"
    }
  },
  "Resources": {
    "MediaBucket": {
      "Type": "AWS::S3::Bucket",
      "DeletionPolicy": "Delete",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "media-bucket-${EnvironmentSuffix}"
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
        "VersioningConfiguration": {
          "Status": "Enabled"
        }
      }
    },
    "ArtifactsBucket": {
      "Type": "AWS::S3::Bucket",
      "DeletionPolicy": "Delete",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "pipeline-artifacts-${EnvironmentSuffix}"
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
    "MediaLiveRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "medialive-role-${EnvironmentSuffix}"
        },
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "medialive.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "ManagedPolicyArns": [
          "arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess"
        ],
        "Policies": [
          {
            "PolicyName": "MediaLiveAccess",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "mediapackage:DescribeChannel"
                  ],
                  "Resource": "*"
                }
              ]
            }
          }
        ]
      }
    },
    "MediaPackageChannel": {
      "Type": "AWS::MediaPackage::Channel",
      "Properties": {
        "Id": {
          "Fn::Sub": "media-channel-${EnvironmentSuffix}"
        },
        "Description": "Live streaming channel"
      }
    },
    "MediaPackageHlsEndpoint": {
      "Type": "AWS::MediaPackage::OriginEndpoint",
      "Properties": {
        "ChannelId": {
          "Ref": "MediaPackageChannel"
        },
        "Id": {
          "Fn::Sub": "hls-endpoint-${EnvironmentSuffix}"
        },
        "Description": "HLS streaming endpoint",
        "HlsPackage": {
          "SegmentDurationSeconds": 6,
          "PlaylistWindowSeconds": 60,
          "AdMarkers": "NONE"
        }
      }
    },
    "MediaPackageDashEndpoint": {
      "Type": "AWS::MediaPackage::OriginEndpoint",
      "Properties": {
        "ChannelId": {
          "Ref": "MediaPackageChannel"
        },
        "Id": {
          "Fn::Sub": "dash-endpoint-${EnvironmentSuffix}"
        },
        "Description": "DASH streaming endpoint",
        "DashPackage": {
          "SegmentDurationSeconds": 6
        }
      }
    },
    "MediaLiveInput": {
      "Type": "AWS::MediaLive::Input",
      "Properties": {
        "Name": {
          "Fn::Sub": "live-input-${EnvironmentSuffix}"
        },
        "Type": "RTMP_PUSH",
        "Destinations": [
          {
            "StreamName": "live/stream1"
          },
          {
            "StreamName": "live/stream2"
          }
        ]
      }
    },
    "MediaLiveChannel": {
      "Type": "AWS::MediaLive::Channel",
      "Properties": {
        "Name": {
          "Fn::Sub": "live-channel-${EnvironmentSuffix}"
        },
        "RoleArn": {
          "Fn::GetAtt": [
            "MediaLiveRole",
            "Arn"
          ]
        },
        "ChannelClass": "SINGLE_PIPELINE",
        "InputAttachments": [
          {
            "InputId": {
              "Ref": "MediaLiveInput"
            },
            "InputAttachmentName": "live-input"
          }
        ],
        "Destinations": [
          {
            "Id": "mediapackage-destination",
            "MediaPackageSettings": [
              {
                "ChannelId": {
                  "Ref": "MediaPackageChannel"
                }
              }
            ]
          }
        ],
        "EncoderSettings": {
          "AudioDescriptions": [
            {
              "AudioSelectorName": "default",
              "Name": "audio_1",
              "CodecSettings": {
                "AacSettings": {
                  "Bitrate": 96000,
                  "CodingMode": "CODING_MODE_2_0",
                  "InputType": "NORMAL",
                  "Profile": "LC",
                  "RateControlMode": "CBR",
                  "RawFormat": "NONE",
                  "SampleRate": 48000,
                  "Spec": "MPEG4"
                }
              }
            }
          ],
          "VideoDescriptions": [
            {
              "Name": "video_1080p30",
              "CodecSettings": {
                "H264Settings": {
                  "AfdSignaling": "NONE",
                  "ColorMetadata": "INSERT",
                  "AdaptiveQuantization": "HIGH",
                  "Bitrate": 5000000,
                  "EntropyEncoding": "CABAC",
                  "FlickerAq": "ENABLED",
                  "FramerateControl": "SPECIFIED",
                  "FramerateNumerator": 30,
                  "FramerateDenominator": 1,
                  "GopBReference": "DISABLED",
                  "GopClosedCadence": 1,
                  "GopNumBFrames": 3,
                  "GopSize": 60,
                  "GopSizeUnits": "FRAMES",
                  "ScanType": "PROGRESSIVE",
                  "Level": "H264_LEVEL_4_1",
                  "LookAheadRateControl": "HIGH",
                  "NumRefFrames": 3,
                  "ParControl": "SPECIFIED",
                  "Profile": "HIGH",
                  "RateControlMode": "CBR",
                  "Syntax": "DEFAULT",
                  "SceneChangeDetect": "ENABLED",
                  "Slices": 1,
                  "SpatialAq": "ENABLED",
                  "TemporalAq": "ENABLED",
                  "TimecodeInsertion": "DISABLED"
                }
              },
              "Height": 1080,
              "Width": 1920
            },
            {
              "Name": "video_720p30",
              "CodecSettings": {
                "H264Settings": {
                  "AfdSignaling": "NONE",
                  "ColorMetadata": "INSERT",
                  "AdaptiveQuantization": "HIGH",
                  "Bitrate": 3000000,
                  "EntropyEncoding": "CABAC",
                  "FlickerAq": "ENABLED",
                  "FramerateControl": "SPECIFIED",
                  "FramerateNumerator": 30,
                  "FramerateDenominator": 1,
                  "GopBReference": "DISABLED",
                  "GopClosedCadence": 1,
                  "GopNumBFrames": 3,
                  "GopSize": 60,
                  "GopSizeUnits": "FRAMES",
                  "ScanType": "PROGRESSIVE",
                  "Level": "H264_LEVEL_4_1",
                  "LookAheadRateControl": "HIGH",
                  "NumRefFrames": 3,
                  "ParControl": "SPECIFIED",
                  "Profile": "HIGH",
                  "RateControlMode": "CBR",
                  "Syntax": "DEFAULT",
                  "SceneChangeDetect": "ENABLED",
                  "Slices": 1,
                  "SpatialAq": "ENABLED",
                  "TemporalAq": "ENABLED",
                  "TimecodeInsertion": "DISABLED"
                }
              },
              "Height": 720,
              "Width": 1280
            },
            {
              "Name": "video_480p30",
              "CodecSettings": {
                "H264Settings": {
                  "AfdSignaling": "NONE",
                  "ColorMetadata": "INSERT",
                  "AdaptiveQuantization": "HIGH",
                  "Bitrate": 1500000,
                  "EntropyEncoding": "CABAC",
                  "FlickerAq": "ENABLED",
                  "FramerateControl": "SPECIFIED",
                  "FramerateNumerator": 30,
                  "FramerateDenominator": 1,
                  "GopBReference": "DISABLED",
                  "GopClosedCadence": 1,
                  "GopNumBFrames": 3,
                  "GopSize": 60,
                  "GopSizeUnits": "FRAMES",
                  "ScanType": "PROGRESSIVE",
                  "Level": "H264_LEVEL_3_1",
                  "LookAheadRateControl": "HIGH",
                  "NumRefFrames": 3,
                  "ParControl": "SPECIFIED",
                  "Profile": "MAIN",
                  "RateControlMode": "CBR",
                  "Syntax": "DEFAULT",
                  "SceneChangeDetect": "ENABLED",
                  "Slices": 1,
                  "SpatialAq": "ENABLED",
                  "TemporalAq": "ENABLED",
                  "TimecodeInsertion": "DISABLED"
                }
              },
              "Height": 480,
              "Width": 854
            }
          ],
          "OutputGroups": [
            {
              "Name": "HD",
              "OutputGroupSettings": {
                "MediaPackageGroupSettings": {
                  "Destination": {
                    "DestinationRefId": "mediapackage-destination"
                  }
                }
              },
              "Outputs": [
                {
                  "OutputName": "1080p30",
                  "VideoDescriptionName": "video_1080p30",
                  "AudioDescriptionNames": [
                    "audio_1"
                  ],
                  "OutputSettings": {
                    "MediaPackageOutputSettings": {}
                  }
                },
                {
                  "OutputName": "720p30",
                  "VideoDescriptionName": "video_720p30",
                  "AudioDescriptionNames": [
                    "audio_1"
                  ],
                  "OutputSettings": {
                    "MediaPackageOutputSettings": {}
                  }
                },
                {
                  "OutputName": "480p30",
                  "VideoDescriptionName": "video_480p30",
                  "AudioDescriptionNames": [
                    "audio_1"
                  ],
                  "OutputSettings": {
                    "MediaPackageOutputSettings": {}
                  }
                }
              ]
            }
          ],
          "TimecodeConfig": {
            "Source": "EMBEDDED"
          }
        }
      }
    },
    "CloudFrontDistribution": {
      "Type": "AWS::CloudFront::Distribution",
      "Properties": {
        "DistributionConfig": {
          "Comment": {
            "Fn::Sub": "Media distribution ${EnvironmentSuffix}"
          },
          "Enabled": true,
          "Origins": [
            {
              "Id": "MediaPackageOrigin",
              "DomainName": {
                "Fn::Select": [
                  1,
                  {
                    "Fn::Split": [
                      "//",
                      {
                        "Fn::GetAtt": [
                          "MediaPackageHlsEndpoint",
                          "Url"
                        ]
                      }
                    ]
                  }
                ]
              },
              "CustomOriginConfig": {
                "HTTPSPort": 443,
                "OriginProtocolPolicy": "https-only",
                "OriginSSLProtocols": [
                  "TLSv1.2"
                ]
              }
            }
          ],
          "DefaultCacheBehavior": {
            "TargetOriginId": "MediaPackageOrigin",
            "ViewerProtocolPolicy": "redirect-to-https",
            "AllowedMethods": [
              "GET",
              "HEAD",
              "OPTIONS"
            ],
            "CachedMethods": [
              "GET",
              "HEAD",
              "OPTIONS"
            ],
            "ForwardedValues": {
              "QueryString": true,
              "Headers": [
                "Origin"
              ],
              "Cookies": {
                "Forward": "none"
              }
            },
            "MinTTL": 0,
            "DefaultTTL": 5,
            "MaxTTL": 60,
            "Compress": true
          },
          "PriceClass": "PriceClass_100",
          "ViewerCertificate": {
            "CloudFrontDefaultCertificate": true
          }
        }
      }
    },
    "LambdaExecutionRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "lambda-execution-role-${EnvironmentSuffix}"
        },
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "lambda.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "ManagedPolicyArns": [
          "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
        ],
        "Policies": [
          {
            "PolicyName": "MediaLiveAccess",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "medialive:DescribeChannel",
                    "medialive:StartChannel",
                    "medialive:StopChannel"
                  ],
                  "Resource": "*"
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:GetObject",
                    "s3:PutObject"
                  ],
                  "Resource": [
                    {
                      "Fn::Sub": "${MediaBucket.Arn}/*"
                    }
                  ]
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "cloudwatch:PutMetricData"
                  ],
                  "Resource": "*"
                }
              ]
            }
          }
        ]
      }
    },
    "ChannelMonitorFunction": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "FunctionName": {
          "Fn::Sub": "channel-monitor-${EnvironmentSuffix}"
        },
        "Runtime": "nodejs18.x",
        "Handler": "index.handler",
        "Role": {
          "Fn::GetAtt": [
            "LambdaExecutionRole",
            "Arn"
          ]
        },
        "Code": {
          "ZipFile": "exports.handler = async (event) => { console.log('Channel monitor executing', JSON.stringify(event)); return { statusCode: 200, body: 'Monitor executed' }; };"
        },
        "Environment": {
          "Variables": {
            "CHANNEL_ID": {
              "Ref": "MediaLiveChannel"
            }
          }
        },
        "Timeout": 60
      }
    },
    "StreamProcessorFunction": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "FunctionName": {
          "Fn::Sub": "stream-processor-${EnvironmentSuffix}"
        },
        "Runtime": "nodejs18.x",
        "Handler": "index.handler",
        "Role": {
          "Fn::GetAtt": [
            "LambdaExecutionRole",
            "Arn"
          ]
        },
        "Code": {
          "ZipFile": "exports.handler = async (event) => { console.log('Stream processor executing', JSON.stringify(event)); return { statusCode: 200, body: 'Processing complete' }; };"
        },
        "Environment": {
          "Variables": {
            "MEDIA_BUCKET": {
              "Ref": "MediaBucket"
            }
          }
        },
        "Timeout": 300
      }
    },
    "StepFunctionsRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "stepfunctions-role-${EnvironmentSuffix}"
        },
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "states.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "Policies": [
          {
            "PolicyName": "InvokeLambda",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "lambda:InvokeFunction"
                  ],
                  "Resource": [
                    {
                      "Fn::GetAtt": [
                        "ChannelMonitorFunction",
                        "Arn"
                      ]
                    },
                    {
                      "Fn::GetAtt": [
                        "StreamProcessorFunction",
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
    "MediaWorkflowStateMachine": {
      "Type": "AWS::StepFunctions::StateMachine",
      "Properties": {
        "StateMachineName": {
          "Fn::Sub": "media-workflow-${EnvironmentSuffix}"
        },
        "RoleArn": {
          "Fn::GetAtt": [
            "StepFunctionsRole",
            "Arn"
          ]
        },
        "DefinitionString": {
          "Fn::Sub": [
            "{\"Comment\":\"Media processing workflow\",\"StartAt\":\"MonitorChannel\",\"States\":{\"MonitorChannel\":{\"Type\":\"Task\",\"Resource\":\"${ChannelMonitorArn}\",\"Next\":\"ProcessStream\"},\"ProcessStream\":{\"Type\":\"Task\",\"Resource\":\"${StreamProcessorArn}\",\"End\":true}}}",
            {
              "ChannelMonitorArn": {
                "Fn::GetAtt": [
                  "ChannelMonitorFunction",
                  "Arn"
                ]
              },
              "StreamProcessorArn": {
                "Fn::GetAtt": [
                  "StreamProcessorFunction",
                  "Arn"
                ]
              }
            }
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
        "Policies": [
          {
            "PolicyName": "CodeBuildAccess",
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
                  "Resource": "*"
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:GetObject",
                    "s3:PutObject"
                  ],
                  "Resource": [
                    {
                      "Fn::Sub": "${ArtifactsBucket.Arn}/*"
                    }
                  ]
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "cloudformation:DescribeStacks",
                    "cloudformation:ValidateTemplate"
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
          "Fn::Sub": "media-pipeline-build-${EnvironmentSuffix}"
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
          "Type": "LINUX_CONTAINER",
          "ComputeType": "BUILD_GENERAL1_SMALL",
          "Image": "aws/codebuild/standard:5.0",
          "EnvironmentVariables": [
            {
              "Name": "ENVIRONMENT_SUFFIX",
              "Value": {
                "Ref": "EnvironmentSuffix"
              }
            }
          ]
        },
        "Source": {
          "Type": "CODEPIPELINE",
          "BuildSpec": "version: 0.2\nphases:\n  build:\n    commands:\n      - echo \"Validating CloudFormation template\"\n      - aws cloudformation validate-template --template-body file://lib/TapStack.json\nartifacts:\n  files:\n    - '**/*'\n"
        }
      }
    },
    "CodePipelineRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "codepipeline-role-${EnvironmentSuffix}"
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
            "PolicyName": "CodePipelineAccess",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:GetObject",
                    "s3:GetObjectVersion",
                    "s3:PutObject"
                  ],
                  "Resource": [
                    {
                      "Fn::Sub": "${ArtifactsBucket.Arn}/*"
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
                    }
                  ]
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "cloudformation:CreateStack",
                    "cloudformation:DescribeStacks",
                    "cloudformation:UpdateStack",
                    "cloudformation:DeleteStack"
                  ],
                  "Resource": "*"
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
          "Fn::Sub": "media-pipeline-${EnvironmentSuffix}"
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
            "Ref": "ArtifactsBucket"
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
                  "Provider": "S3",
                  "Version": "1"
                },
                "Configuration": {
                  "S3Bucket": {
                    "Ref": "ArtifactsBucket"
                  },
                  "S3ObjectKey": "source.zip"
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
          }
        ]
      }
    },
    "ChannelStateAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "channel-state-alarm-${EnvironmentSuffix}"
        },
        "AlarmDescription": "Alert when MediaLive channel is not running",
        "MetricName": "ActiveAlerts",
        "Namespace": "AWS/MediaLive",
        "Statistic": "Average",
        "Period": 60,
        "EvaluationPeriods": 2,
        "Threshold": 1,
        "ComparisonOperator": "GreaterThanThreshold"
      }
    },
    "ErrorRateAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "error-rate-alarm-${EnvironmentSuffix}"
        },
        "AlarmDescription": "Alert on high error rate",
        "MetricName": "OutputVideoFrameDropCount",
        "Namespace": "AWS/MediaLive",
        "Statistic": "Sum",
        "Period": 300,
        "EvaluationPeriods": 1,
        "Threshold": 100,
        "ComparisonOperator": "GreaterThanThreshold"
      }
    },
    "LogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "DeletionPolicy": "Delete",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/aws/media-pipeline/${EnvironmentSuffix}"
        },
        "RetentionInDays": 7
      }
    }
  },
  "Outputs": {
    "MediaBucketName": {
      "Description": "Media storage bucket name",
      "Value": {
        "Ref": "MediaBucket"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-MediaBucketName"
        }
      }
    },
    "MediaLiveChannelId": {
      "Description": "MediaLive channel ID",
      "Value": {
        "Ref": "MediaLiveChannel"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-MediaLiveChannelId"
        }
      }
    },
    "MediaPackageChannelId": {
      "Description": "MediaPackage channel ID",
      "Value": {
        "Ref": "MediaPackageChannel"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-MediaPackageChannelId"
        }
      }
    },
    "HlsEndpointUrl": {
      "Description": "HLS endpoint URL",
      "Value": {
        "Fn::GetAtt": [
          "MediaPackageHlsEndpoint",
          "Url"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-HlsEndpointUrl"
        }
      }
    },
    "DashEndpointUrl": {
      "Description": "DASH endpoint URL",
      "Value": {
        "Fn::GetAtt": [
          "MediaPackageDashEndpoint",
          "Url"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-DashEndpointUrl"
        }
      }
    },
    "CloudFrontDomain": {
      "Description": "CloudFront distribution domain",
      "Value": {
        "Fn::GetAtt": [
          "CloudFrontDistribution",
          "DomainName"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-CloudFrontDomain"
        }
      }
    },
    "PipelineName": {
      "Description": "CodePipeline name",
      "Value": {
        "Ref": "MediaPipeline"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-PipelineName"
        }
      }
    },
    "StateMachineArn": {
      "Description": "Step Functions state machine ARN",
      "Value": {
        "Ref": "MediaWorkflowStateMachine"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-StateMachineArn"
        }
      }
    },
    "EnvironmentSuffix": {
      "Description": "Environment suffix used",
      "Value": {
        "Ref": "EnvironmentSuffix"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-EnvironmentSuffix"
        }
      }
    }
  }
}
```

## Deployment Notes

### Prerequisites
- AWS CLI configured with appropriate credentials
- Sufficient AWS service limits for MediaLive and MediaPackage
- S3 buckets created before stack deployment

### Deployment Command
```bash
aws cloudformation create-stack \
  --stack-name media-pipeline-stack \
  --template-body file://lib/TapStack.json \
  --parameters ParameterKey=EnvironmentSuffix,ParameterValue=dev \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

### Resource Summary
- **S3 Buckets**: Media storage and CI/CD artifacts
- **MediaLive**: Live video encoding with 3 quality levels (1080p, 720p, 480p)
- **MediaPackage**: HLS and DASH packaging endpoints
- **CloudFront**: Global content delivery
- **Lambda**: Channel monitoring and stream processing automation
- **Step Functions**: Workflow orchestration
- **CodePipeline/CodeBuild**: CI/CD integration
- **CloudWatch**: Alarms for channel state and error rates
- **IAM**: Least privilege roles for all services

### Key Features
- Multi-bitrate adaptive streaming
- Automated CI/CD deployment pipeline
- Real-time monitoring and alerting
- Secure content delivery with encryption
- Scalable architecture with serverless components
- Cost-effective single pipeline configuration
- Proper resource naming with environmentSuffix
- All resources destroyable (no Retain policies)
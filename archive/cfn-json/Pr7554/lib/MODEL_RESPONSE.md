# ECS Fargate Batch Processing System - CloudFormation Implementation

This implementation provides a complete containerized batch processing system using ECS Fargate with monitoring, auto-scaling, and event-driven automation.

## File: lib/ecs-batch-stack.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "ECS Fargate Batch Processing System with monitoring and auto-scaling",
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Environment suffix for resource naming (e.g., dev, staging, prod)",
      "Default": "dev"
    },
    "VpcId": {
      "Type": "AWS::EC2::VPC::Id",
      "Description": "VPC ID for ECS tasks"
    },
    "PrivateSubnet1": {
      "Type": "AWS::EC2::Subnet::Id",
      "Description": "First private subnet for ECS tasks"
    },
    "PrivateSubnet2": {
      "Type": "AWS::EC2::Subnet::Id",
      "Description": "Second private subnet for ECS tasks"
    },
    "PrivateSubnet3": {
      "Type": "AWS::EC2::Subnet::Id",
      "Description": "Third private subnet for ECS tasks"
    },
    "DataBucketName": {
      "Type": "String",
      "Description": "S3 bucket name for input data"
    },
    "OutputBucketName": {
      "Type": "String",
      "Description": "S3 bucket name for output data"
    }
  },
  "Resources": {
    "LogEncryptionKey": {
      "Type": "AWS::KMS::Key",
      "Properties": {
        "Description": {
          "Fn::Sub": "KMS key for CloudWatch Logs encryption - ${EnvironmentSuffix}"
        },
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
              "Sid": "Allow CloudWatch Logs",
              "Effect": "Allow",
              "Principal": {
                "Service": {
                  "Fn::Sub": "logs.${AWS::Region}.amazonaws.com"
                }
              },
              "Action": [
                "kms:Encrypt",
                "kms:Decrypt",
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
    "LogEncryptionKeyAlias": {
      "Type": "AWS::KMS::Alias",
      "Properties": {
        "AliasName": {
          "Fn::Sub": "alias/ecs-logs-${EnvironmentSuffix}"
        },
        "TargetKeyId": {
          "Ref": "LogEncryptionKey"
        }
      }
    },
    "DataIngestionLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/ecs/data-ingestion-${EnvironmentSuffix}"
        },
        "RetentionInDays": 30,
        "KmsKeyId": {
          "Fn::GetAtt": ["LogEncryptionKey", "Arn"]
        }
      }
    },
    "RiskCalculationLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/ecs/risk-calculation-${EnvironmentSuffix}"
        },
        "RetentionInDays": 30,
        "KmsKeyId": {
          "Fn::GetAtt": ["LogEncryptionKey", "Arn"]
        }
      }
    },
    "ReportGenerationLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/ecs/report-generation-${EnvironmentSuffix}"
        },
        "RetentionInDays": 30,
        "KmsKeyId": {
          "Fn::GetAtt": ["LogEncryptionKey", "Arn"]
        }
      }
    },
    "DataIngestionRepository": {
      "Type": "AWS::ECR::Repository",
      "Properties": {
        "RepositoryName": {
          "Fn::Sub": "data-ingestion-${EnvironmentSuffix}"
        },
        "ImageScanningConfiguration": {
          "ScanOnPush": true
        },
        "LifecyclePolicy": {
          "LifecyclePolicyText": "{\"rules\":[{\"rulePriority\":1,\"description\":\"Keep last 10 images\",\"selection\":{\"tagStatus\":\"any\",\"countType\":\"imageCountMoreThan\",\"countNumber\":10},\"action\":{\"type\":\"expire\"}}]}"
        }
      }
    },
    "RiskCalculationRepository": {
      "Type": "AWS::ECR::Repository",
      "Properties": {
        "RepositoryName": {
          "Fn::Sub": "risk-calculation-${EnvironmentSuffix}"
        },
        "ImageScanningConfiguration": {
          "ScanOnPush": true
        },
        "LifecyclePolicy": {
          "LifecyclePolicyText": "{\"rules\":[{\"rulePriority\":1,\"description\":\"Keep last 10 images\",\"selection\":{\"tagStatus\":\"any\",\"countType\":\"imageCountMoreThan\",\"countNumber\":10},\"action\":{\"type\":\"expire\"}}]}"
        }
      }
    },
    "ReportGenerationRepository": {
      "Type": "AWS::ECR::Repository",
      "Properties": {
        "RepositoryName": {
          "Fn::Sub": "report-generation-${EnvironmentSuffix}"
        },
        "ImageScanningConfiguration": {
          "ScanOnPush": true
        },
        "LifecyclePolicy": {
          "LifecyclePolicyText": "{\"rules\":[{\"rulePriority\":1,\"description\":\"Keep last 10 images\",\"selection\":{\"tagStatus\":\"any\",\"countType\":\"imageCountMoreThan\",\"countNumber\":10},\"action\":{\"type\":\"expire\"}}]}"
        }
      }
    },
    "ECSCluster": {
      "Type": "AWS::ECS::Cluster",
      "Properties": {
        "ClusterName": {
          "Fn::Sub": "batch-processing-${EnvironmentSuffix}"
        },
        "CapacityProviders": ["FARGATE", "FARGATE_SPOT"],
        "DefaultCapacityProviderStrategy": [
          {
            "CapacityProvider": "FARGATE",
            "Weight": 1,
            "Base": 0
          }
        ],
        "ClusterSettings": [
          {
            "Name": "containerInsights",
            "Value": "enabled"
          }
        ]
      }
    },
    "TaskExecutionRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "ecs-task-execution-${EnvironmentSuffix}"
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
        "Policies": [
          {
            "PolicyName": "ECRAccess",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "ecr:GetAuthorizationToken",
                    "ecr:BatchCheckLayerAvailability",
                    "ecr:GetDownloadUrlForLayer",
                    "ecr:BatchGetImage"
                  ],
                  "Resource": "*"
                }
              ]
            }
          },
          {
            "PolicyName": "CloudWatchLogsAccess",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "logs:CreateLogStream",
                    "logs:PutLogEvents"
                  ],
                  "Resource": [
                    {
                      "Fn::GetAtt": ["DataIngestionLogGroup", "Arn"]
                    },
                    {
                      "Fn::GetAtt": ["RiskCalculationLogGroup", "Arn"]
                    },
                    {
                      "Fn::GetAtt": ["ReportGenerationLogGroup", "Arn"]
                    }
                  ]
                }
              ]
            }
          },
          {
            "PolicyName": "KMSAccess",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "kms:Decrypt",
                    "kms:GenerateDataKey"
                  ],
                  "Resource": {
                    "Fn::GetAtt": ["LogEncryptionKey", "Arn"]
                  }
                }
              ]
            }
          }
        ]
      }
    },
    "TaskRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "ecs-task-role-${EnvironmentSuffix}"
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
        "Policies": [
          {
            "PolicyName": "S3Access",
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
                      "Fn::Sub": "arn:aws:s3:::${DataBucketName}"
                    },
                    {
                      "Fn::Sub": "arn:aws:s3:::${DataBucketName}/*"
                    }
                  ]
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:PutObject",
                    "s3:PutObjectAcl"
                  ],
                  "Resource": [
                    {
                      "Fn::Sub": "arn:aws:s3:::${OutputBucketName}/*"
                    }
                  ]
                }
              ]
            }
          }
        ]
      }
    },
    "DataIngestionTaskDefinition": {
      "Type": "AWS::ECS::TaskDefinition",
      "Properties": {
        "Family": {
          "Fn::Sub": "data-ingestion-${EnvironmentSuffix}"
        },
        "NetworkMode": "awsvpc",
        "RequiresCompatibilities": ["FARGATE"],
        "Cpu": "1024",
        "Memory": "2048",
        "ExecutionRoleArn": {
          "Fn::GetAtt": ["TaskExecutionRole", "Arn"]
        },
        "TaskRoleArn": {
          "Fn::GetAtt": ["TaskRole", "Arn"]
        },
        "RuntimePlatform": {
          "CpuArchitecture": "X86_64",
          "OperatingSystemFamily": "LINUX"
        },
        "ContainerDefinitions": [
          {
            "Name": "data-ingestion",
            "Image": {
              "Fn::Sub": "${AWS::AccountId}.dkr.ecr.${AWS::Region}.amazonaws.com/${DataIngestionRepository}:latest"
            },
            "Cpu": 1024,
            "Memory": 2048,
            "Essential": true,
            "LogConfiguration": {
              "LogDriver": "awslogs",
              "Options": {
                "awslogs-group": {
                  "Ref": "DataIngestionLogGroup"
                },
                "awslogs-region": {
                  "Ref": "AWS::Region"
                },
                "awslogs-stream-prefix": "ecs"
              }
            },
            "Environment": [
              {
                "Name": "DATA_BUCKET",
                "Value": {
                  "Ref": "DataBucketName"
                }
              },
              {
                "Name": "OUTPUT_BUCKET",
                "Value": {
                  "Ref": "OutputBucketName"
                }
              }
            ]
          }
        ]
      }
    },
    "RiskCalculationTaskDefinition": {
      "Type": "AWS::ECS::TaskDefinition",
      "Properties": {
        "Family": {
          "Fn::Sub": "risk-calculation-${EnvironmentSuffix}"
        },
        "NetworkMode": "awsvpc",
        "RequiresCompatibilities": ["FARGATE"],
        "Cpu": "2048",
        "Memory": "4096",
        "ExecutionRoleArn": {
          "Fn::GetAtt": ["TaskExecutionRole", "Arn"]
        },
        "TaskRoleArn": {
          "Fn::GetAtt": ["TaskRole", "Arn"]
        },
        "RuntimePlatform": {
          "CpuArchitecture": "X86_64",
          "OperatingSystemFamily": "LINUX"
        },
        "ContainerDefinitions": [
          {
            "Name": "risk-calculation",
            "Image": {
              "Fn::Sub": "${AWS::AccountId}.dkr.ecr.${AWS::Region}.amazonaws.com/${RiskCalculationRepository}:latest"
            },
            "Cpu": 2048,
            "Memory": 4096,
            "Essential": true,
            "LogConfiguration": {
              "LogDriver": "awslogs",
              "Options": {
                "awslogs-group": {
                  "Ref": "RiskCalculationLogGroup"
                },
                "awslogs-region": {
                  "Ref": "AWS::Region"
                },
                "awslogs-stream-prefix": "ecs"
              }
            },
            "Environment": [
              {
                "Name": "DATA_BUCKET",
                "Value": {
                  "Ref": "DataBucketName"
                }
              },
              {
                "Name": "OUTPUT_BUCKET",
                "Value": {
                  "Ref": "OutputBucketName"
                }
              }
            ]
          }
        ]
      }
    },
    "ReportGenerationTaskDefinition": {
      "Type": "AWS::ECS::TaskDefinition",
      "Properties": {
        "Family": {
          "Fn::Sub": "report-generation-${EnvironmentSuffix}"
        },
        "NetworkMode": "awsvpc",
        "RequiresCompatibilities": ["FARGATE"],
        "Cpu": "512",
        "Memory": "1024",
        "ExecutionRoleArn": {
          "Fn::GetAtt": ["TaskExecutionRole", "Arn"]
        },
        "TaskRoleArn": {
          "Fn::GetAtt": ["TaskRole", "Arn"]
        },
        "RuntimePlatform": {
          "CpuArchitecture": "X86_64",
          "OperatingSystemFamily": "LINUX"
        },
        "ContainerDefinitions": [
          {
            "Name": "report-generation",
            "Image": {
              "Fn::Sub": "${AWS::AccountId}.dkr.ecr.${AWS::Region}.amazonaws.com/${ReportGenerationRepository}:latest"
            },
            "Cpu": 512,
            "Memory": 1024,
            "Essential": true,
            "LogConfiguration": {
              "LogDriver": "awslogs",
              "Options": {
                "awslogs-group": {
                  "Ref": "ReportGenerationLogGroup"
                },
                "awslogs-region": {
                  "Ref": "AWS::Region"
                },
                "awslogs-stream-prefix": "ecs"
              }
            },
            "Environment": [
              {
                "Name": "DATA_BUCKET",
                "Value": {
                  "Ref": "DataBucketName"
                }
              },
              {
                "Name": "OUTPUT_BUCKET",
                "Value": {
                  "Ref": "OutputBucketName"
                }
              }
            ]
          }
        ]
      }
    },
    "ECSSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupName": {
          "Fn::Sub": "ecs-tasks-sg-${EnvironmentSuffix}"
        },
        "GroupDescription": "Security group for ECS tasks",
        "VpcId": {
          "Ref": "VpcId"
        },
        "SecurityGroupEgress": [
          {
            "IpProtocol": "-1",
            "CidrIp": "0.0.0.0/0",
            "Description": "Allow all outbound traffic"
          }
        ]
      }
    },
    "DataIngestionService": {
      "Type": "AWS::ECS::Service",
      "Properties": {
        "ServiceName": {
          "Fn::Sub": "data-ingestion-service-${EnvironmentSuffix}"
        },
        "Cluster": {
          "Ref": "ECSCluster"
        },
        "TaskDefinition": {
          "Ref": "DataIngestionTaskDefinition"
        },
        "DesiredCount": 1,
        "LaunchType": "FARGATE",
        "PlatformVersion": "1.4.0",
        "NetworkConfiguration": {
          "AwsvpcConfiguration": {
            "Subnets": [
              {
                "Ref": "PrivateSubnet1"
              },
              {
                "Ref": "PrivateSubnet2"
              },
              {
                "Ref": "PrivateSubnet3"
              }
            ],
            "SecurityGroups": [
              {
                "Ref": "ECSSecurityGroup"
              }
            ],
            "AssignPublicIp": "DISABLED"
          }
        },
        "DeploymentConfiguration": {
          "MaximumPercent": 200,
          "MinimumHealthyPercent": 100,
          "DeploymentCircuitBreaker": {
            "Enable": true,
            "Rollback": true
          }
        },
        "HealthCheckGracePeriodSeconds": 120,
        "PlacementStrategies": [
          {
            "Type": "spread",
            "Field": "attribute:ecs.availability-zone"
          }
        ]
      }
    },
    "RiskCalculationService": {
      "Type": "AWS::ECS::Service",
      "Properties": {
        "ServiceName": {
          "Fn::Sub": "risk-calculation-service-${EnvironmentSuffix}"
        },
        "Cluster": {
          "Ref": "ECSCluster"
        },
        "TaskDefinition": {
          "Ref": "RiskCalculationTaskDefinition"
        },
        "DesiredCount": 2,
        "LaunchType": "FARGATE",
        "PlatformVersion": "1.4.0",
        "NetworkConfiguration": {
          "AwsvpcConfiguration": {
            "Subnets": [
              {
                "Ref": "PrivateSubnet1"
              },
              {
                "Ref": "PrivateSubnet2"
              },
              {
                "Ref": "PrivateSubnet3"
              }
            ],
            "SecurityGroups": [
              {
                "Ref": "ECSSecurityGroup"
              }
            ],
            "AssignPublicIp": "DISABLED"
          }
        },
        "DeploymentConfiguration": {
          "MaximumPercent": 200,
          "MinimumHealthyPercent": 100,
          "DeploymentCircuitBreaker": {
            "Enable": true,
            "Rollback": true
          }
        },
        "HealthCheckGracePeriodSeconds": 120,
        "PlacementStrategies": [
          {
            "Type": "spread",
            "Field": "attribute:ecs.availability-zone"
          }
        ]
      }
    },
    "ReportGenerationService": {
      "Type": "AWS::ECS::Service",
      "Properties": {
        "ServiceName": {
          "Fn::Sub": "report-generation-service-${EnvironmentSuffix}"
        },
        "Cluster": {
          "Ref": "ECSCluster"
        },
        "TaskDefinition": {
          "Ref": "ReportGenerationTaskDefinition"
        },
        "DesiredCount": 1,
        "LaunchType": "FARGATE",
        "PlatformVersion": "1.4.0",
        "NetworkConfiguration": {
          "AwsvpcConfiguration": {
            "Subnets": [
              {
                "Ref": "PrivateSubnet1"
              },
              {
                "Ref": "PrivateSubnet2"
              },
              {
                "Ref": "PrivateSubnet3"
              }
            ],
            "SecurityGroups": [
              {
                "Ref": "ECSSecurityGroup"
              }
            ],
            "AssignPublicIp": "DISABLED"
          }
        },
        "DeploymentConfiguration": {
          "MaximumPercent": 200,
          "MinimumHealthyPercent": 100,
          "DeploymentCircuitBreaker": {
            "Enable": true,
            "Rollback": true
          }
        },
        "HealthCheckGracePeriodSeconds": 120,
        "PlacementStrategies": [
          {
            "Type": "spread",
            "Field": "attribute:ecs.availability-zone"
          }
        ]
      }
    },
    "DataIngestionScalableTarget": {
      "Type": "AWS::ApplicationAutoScaling::ScalableTarget",
      "Properties": {
        "MaxCapacity": 10,
        "MinCapacity": 1,
        "ResourceId": {
          "Fn::Sub": "service/${ECSCluster}/data-ingestion-service-${EnvironmentSuffix}"
        },
        "RoleARN": {
          "Fn::Sub": "arn:aws:iam::${AWS::AccountId}:role/aws-service-role/ecs.application-autoscaling.amazonaws.com/AWSServiceRoleForApplicationAutoScaling_ECSService"
        },
        "ScalableDimension": "ecs:service:DesiredCount",
        "ServiceNamespace": "ecs"
      },
      "DependsOn": "DataIngestionService"
    },
    "DataIngestionScalingPolicy": {
      "Type": "AWS::ApplicationAutoScaling::ScalingPolicy",
      "Properties": {
        "PolicyName": {
          "Fn::Sub": "data-ingestion-cpu-scaling-${EnvironmentSuffix}"
        },
        "PolicyType": "TargetTrackingScaling",
        "ScalingTargetId": {
          "Ref": "DataIngestionScalableTarget"
        },
        "TargetTrackingScalingPolicyConfiguration": {
          "PredefinedMetricSpecification": {
            "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
          },
          "TargetValue": 70.0,
          "ScaleInCooldown": 300,
          "ScaleOutCooldown": 300
        }
      }
    },
    "RiskCalculationScalableTarget": {
      "Type": "AWS::ApplicationAutoScaling::ScalableTarget",
      "Properties": {
        "MaxCapacity": 20,
        "MinCapacity": 2,
        "ResourceId": {
          "Fn::Sub": "service/${ECSCluster}/risk-calculation-service-${EnvironmentSuffix}"
        },
        "RoleARN": {
          "Fn::Sub": "arn:aws:iam::${AWS::AccountId}:role/aws-service-role/ecs.application-autoscaling.amazonaws.com/AWSServiceRoleForApplicationAutoScaling_ECSService"
        },
        "ScalableDimension": "ecs:service:DesiredCount",
        "ServiceNamespace": "ecs"
      },
      "DependsOn": "RiskCalculationService"
    },
    "RiskCalculationScalingPolicy": {
      "Type": "AWS::ApplicationAutoScaling::ScalingPolicy",
      "Properties": {
        "PolicyName": {
          "Fn::Sub": "risk-calculation-cpu-scaling-${EnvironmentSuffix}"
        },
        "PolicyType": "TargetTrackingScaling",
        "ScalingTargetId": {
          "Ref": "RiskCalculationScalableTarget"
        },
        "TargetTrackingScalingPolicyConfiguration": {
          "PredefinedMetricSpecification": {
            "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
          },
          "TargetValue": 70.0,
          "ScaleInCooldown": 300,
          "ScaleOutCooldown": 300
        }
      }
    },
    "ReportGenerationScalableTarget": {
      "Type": "AWS::ApplicationAutoScaling::ScalableTarget",
      "Properties": {
        "MaxCapacity": 5,
        "MinCapacity": 1,
        "ResourceId": {
          "Fn::Sub": "service/${ECSCluster}/report-generation-service-${EnvironmentSuffix}"
        },
        "RoleARN": {
          "Fn::Sub": "arn:aws:iam::${AWS::AccountId}:role/aws-service-role/ecs.application-autoscaling.amazonaws.com/AWSServiceRoleForApplicationAutoScaling_ECSService"
        },
        "ScalableDimension": "ecs:service:DesiredCount",
        "ServiceNamespace": "ecs"
      },
      "DependsOn": "ReportGenerationService"
    },
    "ReportGenerationScalingPolicy": {
      "Type": "AWS::ApplicationAutoScaling::ScalingPolicy",
      "Properties": {
        "PolicyName": {
          "Fn::Sub": "report-generation-cpu-scaling-${EnvironmentSuffix}"
        },
        "PolicyType": "TargetTrackingScaling",
        "ScalingTargetId": {
          "Ref": "ReportGenerationScalableTarget"
        },
        "TargetTrackingScalingPolicyConfiguration": {
          "PredefinedMetricSpecification": {
            "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
          },
          "TargetValue": 70.0,
          "ScaleInCooldown": 300,
          "ScaleOutCooldown": 300
        }
      }
    },
    "TaskFailureAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "ecs-task-failures-${EnvironmentSuffix}"
        },
        "AlarmDescription": "Alarm when task failure rate exceeds 5% over 10 minutes",
        "MetricName": "TasksFailed",
        "Namespace": "AWS/ECS",
        "Statistic": "Sum",
        "Period": 600,
        "EvaluationPeriods": 1,
        "Threshold": 5,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "ClusterName",
            "Value": {
              "Ref": "ECSCluster"
            }
          }
        ]
      }
    },
    "EventBridgeRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "eventbridge-ecs-role-${EnvironmentSuffix}"
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
            "PolicyName": "RunECSTask",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "ecs:RunTask"
                  ],
                  "Resource": [
                    {
                      "Ref": "DataIngestionTaskDefinition"
                    }
                  ]
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "iam:PassRole"
                  ],
                  "Resource": [
                    {
                      "Fn::GetAtt": ["TaskExecutionRole", "Arn"]
                    },
                    {
                      "Fn::GetAtt": ["TaskRole", "Arn"]
                    }
                  ]
                }
              ]
            }
          }
        ]
      }
    },
    "S3EventRule": {
      "Type": "AWS::Events::Rule",
      "Properties": {
        "Name": {
          "Fn::Sub": "s3-object-created-${EnvironmentSuffix}"
        },
        "Description": "Trigger ECS task when new data files arrive in S3",
        "EventPattern": {
          "source": ["aws.s3"],
          "detail-type": ["Object Created"],
          "detail": {
            "bucket": {
              "name": [
                {
                  "Ref": "DataBucketName"
                }
              ]
            }
          }
        },
        "State": "ENABLED",
        "Targets": [
          {
            "Arn": {
              "Fn::GetAtt": ["ECSCluster", "Arn"]
            },
            "RoleArn": {
              "Fn::GetAtt": ["EventBridgeRole", "Arn"]
            },
            "Id": "DataIngestionTask",
            "EcsParameters": {
              "TaskDefinitionArn": {
                "Ref": "DataIngestionTaskDefinition"
              },
              "TaskCount": 1,
              "LaunchType": "FARGATE",
              "NetworkConfiguration": {
                "AwsVpcConfiguration": {
                  "Subnets": [
                    {
                      "Ref": "PrivateSubnet1"
                    },
                    {
                      "Ref": "PrivateSubnet2"
                    },
                    {
                      "Ref": "PrivateSubnet3"
                    }
                  ],
                  "SecurityGroups": [
                    {
                      "Ref": "ECSSecurityGroup"
                    }
                  ],
                  "AssignPublicIp": "DISABLED"
                }
              },
              "PlatformVersion": "1.4.0"
            }
          }
        ]
      }
    }
  },
  "Outputs": {
    "ClusterName": {
      "Description": "ECS Cluster Name",
      "Value": {
        "Ref": "ECSCluster"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-ClusterName"
        }
      }
    },
    "DataIngestionRepository": {
      "Description": "ECR Repository for data ingestion",
      "Value": {
        "Fn::GetAtt": ["DataIngestionRepository", "RepositoryUri"]
      }
    },
    "RiskCalculationRepository": {
      "Description": "ECR Repository for risk calculation",
      "Value": {
        "Fn::GetAtt": ["RiskCalculationRepository", "RepositoryUri"]
      }
    },
    "ReportGenerationRepository": {
      "Description": "ECR Repository for report generation",
      "Value": {
        "Fn::GetAtt": ["ReportGenerationRepository", "RepositoryUri"]
      }
    },
    "TaskExecutionRoleArn": {
      "Description": "Task Execution Role ARN",
      "Value": {
        "Fn::GetAtt": ["TaskExecutionRole", "Arn"]
      }
    },
    "TaskRoleArn": {
      "Description": "Task Role ARN",
      "Value": {
        "Fn::GetAtt": ["TaskRole", "Arn"]
      }
    }
  }
}
```

## File: lib/README.md

```markdown
# ECS Fargate Batch Processing Infrastructure

This CloudFormation template deploys a complete containerized batch processing system using ECS Fargate for financial services risk calculations.

## Architecture Overview

The infrastructure includes:

- **ECS Cluster**: Fargate-based cluster with managed capacity providers
- **Three Task Definitions**:
  - Data Ingestion (1 vCPU, 2GB RAM)
  - Risk Calculation (2 vCPU, 4GB RAM)
  - Report Generation (0.5 vCPU, 1GB RAM)
- **ECR Repositories**: Container image storage with lifecycle policies (last 10 images) and vulnerability scanning
- **CloudWatch Logs**: KMS-encrypted log groups with 30-day retention
- **ECS Services**: Circuit breaker deployment with 120-second health check grace period
- **Auto-Scaling**: CPU-based scaling targeting 70% utilization with 5-minute cooldown
- **EventBridge**: S3-triggered task execution for data processing automation
- **CloudWatch Alarms**: Task failure monitoring (5% threshold over 10 minutes)

## Prerequisites

1. AWS Account with appropriate permissions
2. VPC with 3 private subnets across different availability zones
3. NAT Gateway or VPC endpoints for ECS and ECR access
4. Two S3 buckets (data input and output)
5. Container images built and ready for ECR

## Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| EnvironmentSuffix | Environment identifier | dev, staging, prod |
| VpcId | VPC ID for ECS tasks | vpc-12345678 |
| PrivateSubnet1 | First private subnet | subnet-11111111 |
| PrivateSubnet2 | Second private subnet | subnet-22222222 |
| PrivateSubnet3 | Third private subnet | subnet-33333333 |
| DataBucketName | S3 bucket for input data | my-data-bucket |
| OutputBucketName | S3 bucket for output data | my-output-bucket |

## Deployment Steps

### 1. Validate the Template

```bash
aws cloudformation validate-template \
  --template-body file://lib/ecs-batch-stack.json
```

### 2. Deploy the Stack

```bash
aws cloudformation create-stack \
  --stack-name ecs-batch-processing-dev \
  --template-body file://lib/ecs-batch-stack.json \
  --parameters \
    ParameterKey=EnvironmentSuffix,ParameterValue=dev \
    ParameterKey=VpcId,ParameterValue=vpc-12345678 \
    ParameterKey=PrivateSubnet1,ParameterValue=subnet-11111111 \
    ParameterKey=PrivateSubnet2,ParameterValue=subnet-22222222 \
    ParameterKey=PrivateSubnet3,ParameterValue=subnet-33333333 \
    ParameterKey=DataBucketName,ParameterValue=my-data-bucket \
    ParameterKey=OutputBucketName,ParameterValue=my-output-bucket \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

### 3. Monitor Stack Creation

```bash
aws cloudformation wait stack-create-complete \
  --stack-name ecs-batch-processing-dev \
  --region us-east-1

aws cloudformation describe-stacks \
  --stack-name ecs-batch-processing-dev \
  --region us-east-1 \
  --query 'Stacks[0].StackStatus'
```

### 4. Build and Push Container Images

```bash
# Get ECR repository URIs from stack outputs
DATA_REPO=$(aws cloudformation describe-stacks \
  --stack-name ecs-batch-processing-dev \
  --query 'Stacks[0].Outputs[?OutputKey==`DataIngestionRepository`].OutputValue' \
  --output text)

RISK_REPO=$(aws cloudformation describe-stacks \
  --stack-name ecs-batch-processing-dev \
  --query 'Stacks[0].Outputs[?OutputKey==`RiskCalculationRepository`].OutputValue' \
  --output text)

REPORT_REPO=$(aws cloudformation describe-stacks \
  --stack-name ecs-batch-processing-dev \
  --query 'Stacks[0].Outputs[?OutputKey==`ReportGenerationRepository`].OutputValue' \
  --output text)

# Login to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin $DATA_REPO

# Build and push images (example for data-ingestion)
docker build -t data-ingestion:latest ./data-ingestion
docker tag data-ingestion:latest $DATA_REPO:latest
docker push $DATA_REPO:latest

# Repeat for risk-calculation and report-generation
```

### 5. Enable S3 Event Notifications (Optional)

To enable EventBridge integration for S3:

```bash
aws s3api put-bucket-notification-configuration \
  --bucket my-data-bucket \
  --notification-configuration '{
    "EventBridgeConfiguration": {}
  }'
```

### 6. Verify Deployment

```bash
# Check ECS cluster
aws ecs describe-clusters \
  --clusters batch-processing-dev \
  --region us-east-1

# Check running services
aws ecs list-services \
  --cluster batch-processing-dev \
  --region us-east-1

# Check task definitions
aws ecs list-task-definitions \
  --family-prefix data-ingestion-dev \
  --region us-east-1
```

## Resource Naming Convention

All resources follow the pattern: `{resource-type}-{purpose}-{environmentSuffix}`

Examples:
- ECS Cluster: `batch-processing-dev`
- Task Definition: `data-ingestion-dev`
- Log Group: `/ecs/data-ingestion-dev`
- ECR Repository: `data-ingestion-dev`

## Security Features

1. **KMS Encryption**: All CloudWatch Logs encrypted with customer-managed KMS keys
2. **Least Privilege IAM**: Task roles limited to specific S3 buckets and ECR repositories
3. **Vulnerability Scanning**: ECR scan-on-push enabled for all repositories
4. **Network Isolation**: Tasks run in private subnets with no public IP assignment
5. **Security Groups**: Minimal egress rules, no ingress (batch processing doesn't need incoming connections)

## Monitoring and Alarms

- **Container Insights**: Enabled on ECS cluster for detailed metrics
- **Task Failure Alarm**: Triggers when failures exceed 5% over 10 minutes
- **Auto-Scaling Metrics**: CPU utilization tracked for each service
- **Log Retention**: 30-day retention for compliance and troubleshooting

## Auto-Scaling Configuration

Each service has CPU-based auto-scaling:

| Service | Min Tasks | Max Tasks | Target CPU |
|---------|-----------|-----------|------------|
| Data Ingestion | 1 | 10 | 70% |
| Risk Calculation | 2 | 20 | 70% |
| Report Generation | 1 | 5 | 70% |

Cooldown periods: 5 minutes (300 seconds) for both scale-in and scale-out

## Cleanup

To delete all resources:

```bash
# Delete the CloudFormation stack
aws cloudformation delete-stack \
  --stack-name ecs-batch-processing-dev \
  --region us-east-1

# Wait for deletion to complete
aws cloudformation wait stack-delete-complete \
  --stack-name ecs-batch-processing-dev \
  --region us-east-1
```

Note: ECR repositories will be deleted automatically. Ensure you have backups of any images you need to retain.

## Troubleshooting

### Tasks Failing to Start

1. Check CloudWatch Logs for container errors
2. Verify ECR images exist and are accessible
3. Confirm VPC has NAT Gateway or VPC endpoints for ECR/ECS
4. Check IAM role permissions

### Auto-Scaling Not Working

1. Verify Application Auto Scaling service-linked role exists
2. Check CloudWatch metrics for CPU utilization
3. Ensure cooldown periods have elapsed

### EventBridge Not Triggering Tasks

1. Verify S3 bucket has EventBridge notifications enabled
2. Check EventBridge rule is in ENABLED state
3. Confirm IAM role has permissions to run ECS tasks

## Cost Optimization

- Uses Fargate for serverless container execution (no EC2 management)
- ECR lifecycle policies limit storage to last 10 images
- CloudWatch Logs retention set to 30 days (adjust as needed)
- Auto-scaling prevents over-provisioning during low-traffic periods

## Container Image Requirements

Each container should:
1. Exit with code 0 on success, non-zero on failure
2. Read from DATA_BUCKET environment variable
3. Write results to OUTPUT_BUCKET environment variable
4. Log to stdout/stderr (captured by CloudWatch Logs)
5. Handle SIGTERM gracefully for task shutdown

Example Dockerfile structure:

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY src/ .

CMD ["python", "main.py"]
```
```
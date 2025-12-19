# Infrastructure Compliance Monitoring System - CloudFormation Implementation

This implementation provides a complete automated infrastructure compliance analysis system using CloudFormation with JSON. The solution monitors CloudFormation stack drift, validates security policies, and alerts on non-compliant resources.

## File: TapStack.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Automated Infrastructure Compliance Monitoring System with AWS Config, Lambda, S3, EventBridge, SNS, CloudWatch, and Systems Manager",
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Unique suffix for resource naming to avoid conflicts",
      "Default": "dev",
      "AllowedPattern": "^[a-z0-9-]{1,20}$",
      "ConstraintDescription": "Must be lowercase alphanumeric with hyphens, max 20 characters"
    },
    "SecurityTeamEmail": {
      "Type": "String",
      "Description": "Email address for security team notifications",
      "AllowedPattern": "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
      "ConstraintDescription": "Must be a valid email address"
    },
    "ApprovedAMIs": {
      "Type": "CommaDelimitedList",
      "Description": "Comma-separated list of approved AMI IDs",
      "Default": "ami-0c55b159cbfafe1f0,ami-0abcdef1234567890"
    }
  },
  "Resources": {
    "ComplianceReportBucket": {
      "Type": "AWS::S3::Bucket",
      "DeletionPolicy": "Delete",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "compliance-reports-${EnvironmentSuffix}"
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
        "LifecycleConfiguration": {
          "Rules": [
            {
              "Id": "TransitionToGlacier",
              "Status": "Enabled",
              "Transitions": [
                {
                  "TransitionInDays": 30,
                  "StorageClass": "GLACIER"
                }
              ],
              "ExpirationInDays": 90
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
    "ConfigBucket": {
      "Type": "AWS::S3::Bucket",
      "DeletionPolicy": "Delete",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "aws-config-bucket-${EnvironmentSuffix}"
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
    "ConfigBucketPolicy": {
      "Type": "AWS::S3::BucketPolicy",
      "Properties": {
        "Bucket": {
          "Ref": "ConfigBucket"
        },
        "PolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Sid": "AWSConfigBucketPermissionsCheck",
              "Effect": "Allow",
              "Principal": {
                "Service": "config.amazonaws.com"
              },
              "Action": "s3:GetBucketAcl",
              "Resource": {
                "Fn::GetAtt": ["ConfigBucket", "Arn"]
              }
            },
            {
              "Sid": "AWSConfigBucketExistenceCheck",
              "Effect": "Allow",
              "Principal": {
                "Service": "config.amazonaws.com"
              },
              "Action": "s3:ListBucket",
              "Resource": {
                "Fn::GetAtt": ["ConfigBucket", "Arn"]
              }
            },
            {
              "Sid": "AWSConfigBucketPutObject",
              "Effect": "Allow",
              "Principal": {
                "Service": "config.amazonaws.com"
              },
              "Action": "s3:PutObject",
              "Resource": {
                "Fn::Sub": "${ConfigBucket.Arn}/*"
              },
              "Condition": {
                "StringEquals": {
                  "s3:x-amz-acl": "bucket-owner-full-control"
                }
              }
            }
          ]
        }
      }
    },
    "ConfigRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "config-role-${EnvironmentSuffix}"
        },
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "config.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "ManagedPolicyArns": [
          "arn:aws:iam::aws:policy/service-role/AWS_ConfigRole"
        ],
        "Policies": [
          {
            "PolicyName": "ConfigS3Policy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:GetBucketVersioning",
                    "s3:PutObject",
                    "s3:GetObject"
                  ],
                  "Resource": [
                    {
                      "Fn::GetAtt": ["ConfigBucket", "Arn"]
                    },
                    {
                      "Fn::Sub": "${ConfigBucket.Arn}/*"
                    }
                  ]
                }
              ]
            }
          }
        ]
      }
    },
    "ConfigRecorder": {
      "Type": "AWS::Config::ConfigurationRecorder",
      "DependsOn": ["ConfigBucketPolicy"],
      "Properties": {
        "Name": {
          "Fn::Sub": "config-recorder-${EnvironmentSuffix}"
        },
        "RoleARN": {
          "Fn::GetAtt": ["ConfigRole", "Arn"]
        },
        "RecordingGroup": {
          "AllSupported": true,
          "IncludeGlobalResourceTypes": true
        }
      }
    },
    "ConfigDeliveryChannel": {
      "Type": "AWS::Config::DeliveryChannel",
      "Properties": {
        "Name": {
          "Fn::Sub": "config-delivery-${EnvironmentSuffix}"
        },
        "S3BucketName": {
          "Ref": "ConfigBucket"
        }
      }
    },
    "ComplianceAlertTopic": {
      "Type": "AWS::SNS::Topic",
      "Properties": {
        "TopicName": {
          "Fn::Sub": "compliance-alerts-${EnvironmentSuffix}"
        },
        "DisplayName": "Infrastructure Compliance Alerts",
        "Subscription": [
          {
            "Protocol": "email",
            "Endpoint": {
              "Ref": "SecurityTeamEmail"
            }
          }
        ]
      }
    },
    "LambdaExecutionRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "compliance-lambda-role-${EnvironmentSuffix}"
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
            "PolicyName": "ComplianceValidationPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "config:GetComplianceDetailsByConfigRule",
                    "config:DescribeConfigRules",
                    "config:GetResourceConfigHistory"
                  ],
                  "Resource": "*"
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:PutObject",
                    "s3:GetObject"
                  ],
                  "Resource": {
                    "Fn::Sub": "${ComplianceReportBucket.Arn}/*"
                  }
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "sns:Publish"
                  ],
                  "Resource": {
                    "Ref": "ComplianceAlertTopic"
                  }
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "ssm:GetParameter",
                    "ssm:GetParameters"
                  ],
                  "Resource": {
                    "Fn::Sub": "arn:aws:ssm:${AWS::Region}:${AWS::AccountId}:parameter/compliance/*"
                  }
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "ec2:DescribeInstances",
                    "ec2:DescribeSecurityGroups",
                    "ec2:DescribeImages"
                  ],
                  "Resource": "*"
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "cloudformation:DescribeStacks",
                    "cloudformation:DescribeStackResources",
                    "cloudformation:DetectStackDrift"
                  ],
                  "Resource": "*"
                }
              ]
            }
          }
        ]
      }
    },
    "TagComplianceFunction": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "FunctionName": {
          "Fn::Sub": "tag-compliance-${EnvironmentSuffix}"
        },
        "Runtime": "python3.9",
        "Handler": "index.lambda_handler",
        "Role": {
          "Fn::GetAtt": ["LambdaExecutionRole", "Arn"]
        },
        "MemorySize": 256,
        "Timeout": 300,
        "Environment": {
          "Variables": {
            "SNS_TOPIC_ARN": {
              "Ref": "ComplianceAlertTopic"
            },
            "S3_BUCKET": {
              "Ref": "ComplianceReportBucket"
            }
          }
        },
        "Code": {
          "ZipFile": "import json\nimport boto3\nimport os\nfrom datetime import datetime\n\nec2 = boto3.client('ec2')\nsns = boto3.client('sns')\ns3 = boto3.client('s3')\n\nREQUIRED_TAGS = ['Environment', 'Owner', 'CostCenter']\n\ndef lambda_handler(event, context):\n    print(f'Received event: {json.dumps(event)}')\n    \n    non_compliant_resources = []\n    \n    try:\n        # Check EC2 instances for required tags\n        instances = ec2.describe_instances()\n        \n        for reservation in instances['Reservations']:\n            for instance in reservation['Instances']:\n                instance_id = instance['InstanceId']\n                tags = {tag['Key']: tag['Value'] for tag in instance.get('Tags', [])}\n                \n                missing_tags = [tag for tag in REQUIRED_TAGS if tag not in tags]\n                \n                if missing_tags:\n                    non_compliant_resources.append({\n                        'ResourceType': 'EC2Instance',\n                        'ResourceId': instance_id,\n                        'MissingTags': missing_tags,\n                        'ExistingTags': list(tags.keys())\n                    })\n        \n        # Generate compliance report\n        report = {\n            'Timestamp': datetime.utcnow().isoformat(),\n            'TotalResourcesChecked': len(instances['Reservations']),\n            'NonCompliantResources': len(non_compliant_resources),\n            'Details': non_compliant_resources\n        }\n        \n        # Store report in S3\n        report_key = f\"tag-compliance/{datetime.utcnow().strftime('%Y/%m/%d/%H%M%S')}.json\"\n        s3.put_object(\n            Bucket=os.environ['S3_BUCKET'],\n            Key=report_key,\n            Body=json.dumps(report, indent=2),\n            ContentType='application/json'\n        )\n        \n        # Send SNS notification if non-compliant resources found\n        if non_compliant_resources:\n            message = f\"Tag Compliance Violation Detected\\n\\n\"\n            message += f\"Total Non-Compliant Resources: {len(non_compliant_resources)}\\n\\n\"\n            message += \"Details:\\n\"\n            for resource in non_compliant_resources[:10]:  # Limit to first 10\n                message += f\"- {resource['ResourceType']}: {resource['ResourceId']}\\n\"\n                message += f\"  Missing Tags: {', '.join(resource['MissingTags'])}\\n\"\n            \n            sns.publish(\n                TopicArn=os.environ['SNS_TOPIC_ARN'],\n                Subject='Infrastructure Tag Compliance Alert',\n                Message=message\n            )\n        \n        return {\n            'statusCode': 200,\n            'body': json.dumps({\n                'message': 'Tag compliance check completed',\n                'nonCompliantResources': len(non_compliant_resources)\n            })\n        }\n        \n    except Exception as e:\n        print(f'Error: {str(e)}')\n        raise\n"
        }
      }
    },
    "AMIComplianceFunction": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "FunctionName": {
          "Fn::Sub": "ami-compliance-${EnvironmentSuffix}"
        },
        "Runtime": "python3.9",
        "Handler": "index.lambda_handler",
        "Role": {
          "Fn::GetAtt": ["LambdaExecutionRole", "Arn"]
        },
        "MemorySize": 256,
        "Timeout": 300,
        "Environment": {
          "Variables": {
            "SNS_TOPIC_ARN": {
              "Ref": "ComplianceAlertTopic"
            },
            "S3_BUCKET": {
              "Ref": "ComplianceReportBucket"
            },
            "APPROVED_AMIS_PARAM": "/compliance/approved-amis"
          }
        },
        "Code": {
          "ZipFile": "import json\nimport boto3\nimport os\nfrom datetime import datetime\n\nec2 = boto3.client('ec2')\nsns = boto3.client('sns')\ns3 = boto3.client('s3')\nssm = boto3.client('ssm')\n\ndef lambda_handler(event, context):\n    print(f'Received event: {json.dumps(event)}')\n    \n    non_compliant_instances = []\n    \n    try:\n        # Get approved AMIs from Parameter Store\n        try:\n            param = ssm.get_parameter(Name=os.environ['APPROVED_AMIS_PARAM'])\n            approved_amis = json.loads(param['Parameter']['Value'])\n        except:\n            approved_amis = []\n            print('No approved AMIs configured in Parameter Store')\n        \n        # Check all running instances\n        instances = ec2.describe_instances(\n            Filters=[{'Name': 'instance-state-name', 'Values': ['running', 'stopped']}]\n        )\n        \n        for reservation in instances['Reservations']:\n            for instance in reservation['Instances']:\n                instance_id = instance['InstanceId']\n                ami_id = instance['ImageId']\n                \n                if approved_amis and ami_id not in approved_amis:\n                    non_compliant_instances.append({\n                        'InstanceId': instance_id,\n                        'AMI': ami_id,\n                        'State': instance['State']['Name'],\n                        'LaunchTime': instance['LaunchTime'].isoformat()\n                    })\n        \n        # Generate compliance report\n        report = {\n            'Timestamp': datetime.utcnow().isoformat(),\n            'ApprovedAMIs': approved_amis,\n            'TotalInstancesChecked': sum(len(r['Instances']) for r in instances['Reservations']),\n            'NonCompliantInstances': len(non_compliant_instances),\n            'Details': non_compliant_instances\n        }\n        \n        # Store report in S3\n        report_key = f\"ami-compliance/{datetime.utcnow().strftime('%Y/%m/%d/%H%M%S')}.json\"\n        s3.put_object(\n            Bucket=os.environ['S3_BUCKET'],\n            Key=report_key,\n            Body=json.dumps(report, indent=2),\n            ContentType='application/json'\n        )\n        \n        # Send SNS notification if non-compliant instances found\n        if non_compliant_instances:\n            message = f\"AMI Compliance Violation Detected\\n\\n\"\n            message += f\"Total Non-Compliant Instances: {len(non_compliant_instances)}\\n\\n\"\n            message += \"Details:\\n\"\n            for instance in non_compliant_instances[:10]:\n                message += f\"- Instance: {instance['InstanceId']} using unapproved AMI: {instance['AMI']}\\n\"\n            \n            sns.publish(\n                TopicArn=os.environ['SNS_TOPIC_ARN'],\n                Subject='Infrastructure AMI Compliance Alert',\n                Message=message\n            )\n        \n        return {\n            'statusCode': 200,\n            'body': json.dumps({\n                'message': 'AMI compliance check completed',\n                'nonCompliantInstances': len(non_compliant_instances)\n            })\n        }\n        \n    except Exception as e:\n        print(f'Error: {str(e)}')\n        raise\n"
        }
      }
    },
    "DriftDetectionFunction": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "FunctionName": {
          "Fn::Sub": "drift-detection-${EnvironmentSuffix}"
        },
        "Runtime": "python3.9",
        "Handler": "index.lambda_handler",
        "Role": {
          "Fn::GetAtt": ["LambdaExecutionRole", "Arn"]
        },
        "MemorySize": 256,
        "Timeout": 300,
        "Environment": {
          "Variables": {
            "SNS_TOPIC_ARN": {
              "Ref": "ComplianceAlertTopic"
            },
            "S3_BUCKET": {
              "Ref": "ComplianceReportBucket"
            }
          }
        },
        "Code": {
          "ZipFile": "import json\nimport boto3\nimport os\nfrom datetime import datetime\n\ncfn = boto3.client('cloudformation')\nsns = boto3.client('sns')\ns3 = boto3.client('s3')\n\ndef lambda_handler(event, context):\n    print(f'Received event: {json.dumps(event)}')\n    \n    drift_results = []\n    \n    try:\n        # Get all CloudFormation stacks\n        paginator = cfn.get_paginator('list_stacks')\n        page_iterator = paginator.paginate(\n            StackStatusFilter=['CREATE_COMPLETE', 'UPDATE_COMPLETE', 'UPDATE_ROLLBACK_COMPLETE']\n        )\n        \n        for page in page_iterator:\n            for stack in page['StackSummaries']:\n                stack_name = stack['StackName']\n                \n                try:\n                    # Check drift status\n                    drift_info = cfn.detect_stack_drift(StackName=stack_name)\n                    drift_detection_id = drift_info['StackDriftDetectionId']\n                    \n                    # Wait for drift detection to complete\n                    import time\n                    for _ in range(30):\n                        status = cfn.describe_stack_drift_detection_status(\n                            StackDriftDetectionId=drift_detection_id\n                        )\n                        if status['DetectionStatus'] == 'DETECTION_COMPLETE':\n                            break\n                        time.sleep(2)\n                    \n                    drift_status = status.get('StackDriftStatus', 'UNKNOWN')\n                    \n                    if drift_status in ['DRIFTED', 'UNKNOWN']:\n                        drift_results.append({\n                            'StackName': stack_name,\n                            'DriftStatus': drift_status,\n                            'Timestamp': datetime.utcnow().isoformat()\n                        })\n                        \n                except Exception as e:\n                    print(f'Error checking drift for {stack_name}: {str(e)}')\n                    continue\n        \n        # Generate report\n        report = {\n            'Timestamp': datetime.utcnow().isoformat(),\n            'DriftedStacks': len(drift_results),\n            'Details': drift_results\n        }\n        \n        # Store report in S3\n        report_key = f\"drift-detection/{datetime.utcnow().strftime('%Y/%m/%d/%H%M%S')}.json\"\n        s3.put_object(\n            Bucket=os.environ['S3_BUCKET'],\n            Key=report_key,\n            Body=json.dumps(report, indent=2),\n            ContentType='application/json'\n        )\n        \n        # Send SNS notification if drift detected\n        if drift_results:\n            message = f\"CloudFormation Stack Drift Detected\\n\\n\"\n            message += f\"Total Drifted Stacks: {len(drift_results)}\\n\\n\"\n            message += \"Details:\\n\"\n            for result in drift_results:\n                message += f\"- Stack: {result['StackName']} - Status: {result['DriftStatus']}\\n\"\n            \n            sns.publish(\n                TopicArn=os.environ['SNS_TOPIC_ARN'],\n                Subject='CloudFormation Stack Drift Alert',\n                Message=message\n            )\n        \n        return {\n            'statusCode': 200,\n            'body': json.dumps({\n                'message': 'Drift detection completed',\n                'driftedStacks': len(drift_results)\n            })\n        }\n        \n    except Exception as e:\n        print(f'Error: {str(e)}')\n        raise\n"
        }
      }
    },
    "TagComplianceFunctionLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "DeletionPolicy": "Delete",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/aws/lambda/tag-compliance-${EnvironmentSuffix}"
        },
        "RetentionInDays": 30
      }
    },
    "AMIComplianceFunctionLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "DeletionPolicy": "Delete",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/aws/lambda/ami-compliance-${EnvironmentSuffix}"
        },
        "RetentionInDays": 30
      }
    },
    "DriftDetectionFunctionLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "DeletionPolicy": "Delete",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/aws/lambda/drift-detection-${EnvironmentSuffix}"
        },
        "RetentionInDays": 30
      }
    },
    "ConfigComplianceEventRule": {
      "Type": "AWS::Events::Rule",
      "Properties": {
        "Name": {
          "Fn::Sub": "config-compliance-changes-${EnvironmentSuffix}"
        },
        "Description": "Trigger Lambda on AWS Config compliance changes",
        "EventPattern": {
          "source": ["aws.config"],
          "detail-type": ["Config Rules Compliance Change"]
        },
        "State": "ENABLED",
        "Targets": [
          {
            "Arn": {
              "Fn::GetAtt": ["TagComplianceFunction", "Arn"]
            },
            "Id": "TagComplianceTarget"
          }
        ]
      }
    },
    "ScheduledComplianceCheckRule": {
      "Type": "AWS::Events::Rule",
      "Properties": {
        "Name": {
          "Fn::Sub": "scheduled-compliance-check-${EnvironmentSuffix}"
        },
        "Description": "Run compliance checks every 6 hours",
        "ScheduleExpression": "rate(6 hours)",
        "State": "ENABLED",
        "Targets": [
          {
            "Arn": {
              "Fn::GetAtt": ["TagComplianceFunction", "Arn"]
            },
            "Id": "TagComplianceScheduled"
          },
          {
            "Arn": {
              "Fn::GetAtt": ["AMIComplianceFunction", "Arn"]
            },
            "Id": "AMIComplianceScheduled"
          },
          {
            "Arn": {
              "Fn::GetAtt": ["DriftDetectionFunction", "Arn"]
            },
            "Id": "DriftDetectionScheduled"
          }
        ]
      }
    },
    "TagComplianceFunctionEventPermission": {
      "Type": "AWS::Lambda::Permission",
      "Properties": {
        "FunctionName": {
          "Ref": "TagComplianceFunction"
        },
        "Action": "lambda:InvokeFunction",
        "Principal": "events.amazonaws.com",
        "SourceArn": {
          "Fn::GetAtt": ["ConfigComplianceEventRule", "Arn"]
        }
      }
    },
    "TagComplianceFunctionSchedulePermission": {
      "Type": "AWS::Lambda::Permission",
      "Properties": {
        "FunctionName": {
          "Ref": "TagComplianceFunction"
        },
        "Action": "lambda:InvokeFunction",
        "Principal": "events.amazonaws.com",
        "SourceArn": {
          "Fn::GetAtt": ["ScheduledComplianceCheckRule", "Arn"]
        }
      }
    },
    "AMIComplianceFunctionSchedulePermission": {
      "Type": "AWS::Lambda::Permission",
      "Properties": {
        "FunctionName": {
          "Ref": "AMIComplianceFunction"
        },
        "Action": "lambda:InvokeFunction",
        "Principal": "events.amazonaws.com",
        "SourceArn": {
          "Fn::GetAtt": ["ScheduledComplianceCheckRule", "Arn"]
        }
      }
    },
    "DriftDetectionFunctionSchedulePermission": {
      "Type": "AWS::Lambda::Permission",
      "Properties": {
        "FunctionName": {
          "Ref": "DriftDetectionFunction"
        },
        "Action": "lambda:InvokeFunction",
        "Principal": "events.amazonaws.com",
        "SourceArn": {
          "Fn::GetAtt": ["ScheduledComplianceCheckRule", "Arn"]
        }
      }
    },
    "RequiredTagsConfigRule": {
      "Type": "AWS::Config::ConfigRule",
      "DependsOn": ["ConfigRecorder"],
      "Properties": {
        "ConfigRuleName": {
          "Fn::Sub": "required-tags-${EnvironmentSuffix}"
        },
        "Description": "Checks that resources have required tags: Environment, Owner, CostCenter",
        "Source": {
          "Owner": "AWS",
          "SourceIdentifier": "REQUIRED_TAGS"
        },
        "InputParameters": {
          "tag1Key": "Environment",
          "tag2Key": "Owner",
          "tag3Key": "CostCenter"
        }
      }
    },
    "ApprovedAMIsParameter": {
      "Type": "AWS::SSM::Parameter",
      "Properties": {
        "Name": "/compliance/approved-amis",
        "Description": "List of approved AMI IDs for EC2 instances",
        "Type": "String",
        "Value": {
          "Fn::Sub": [
            "[\"${AMI1}\", \"${AMI2}\"]",
            {
              "AMI1": {
                "Fn::Select": [0, {"Ref": "ApprovedAMIs"}]
              },
              "AMI2": {
                "Fn::Select": [1, {"Ref": "ApprovedAMIs"}]
              }
            }
          ]
        }
      }
    },
    "ComplianceThresholdParameter": {
      "Type": "AWS::SSM::Parameter",
      "Properties": {
        "Name": "/compliance/threshold",
        "Description": "Compliance threshold percentage for alerting",
        "Type": "String",
        "Value": "95"
      }
    },
    "ComplianceDashboard": {
      "Type": "AWS::CloudWatch::Dashboard",
      "Properties": {
        "DashboardName": {
          "Fn::Sub": "compliance-dashboard-${EnvironmentSuffix}"
        },
        "DashboardBody": {
          "Fn::Sub": [
            "{\"widgets\":[{\"type\":\"metric\",\"properties\":{\"metrics\":[[\"AWS/Lambda\",\"Invocations\",{\"stat\":\"Sum\",\"label\":\"Tag Compliance Checks\"}],[\"AWS/Lambda\",\"Errors\",{\"stat\":\"Sum\",\"label\":\"Lambda Errors\"}]],\"period\":300,\"stat\":\"Average\",\"region\":\"${Region}\",\"title\":\"Lambda Execution Metrics\",\"yAxis\":{\"left\":{\"min\":0}}}},{\"type\":\"metric\",\"properties\":{\"metrics\":[[\"AWS/Lambda\",\"Duration\",{\"stat\":\"Average\"}]],\"period\":300,\"stat\":\"Average\",\"region\":\"${Region}\",\"title\":\"Lambda Duration\",\"yAxis\":{\"left\":{\"min\":0}}}},{\"type\":\"log\",\"properties\":{\"query\":\"SOURCE '/aws/lambda/tag-compliance-${Suffix}'\\n| fields @timestamp, @message\\n| filter @message like /non-compliant/\\n| sort @timestamp desc\\n| limit 20\",\"region\":\"${Region}\",\"title\":\"Recent Compliance Violations\"}},{\"type\":\"metric\",\"properties\":{\"metrics\":[[\"AWS/Config\",\"ConfigRuleEvaluations\",{\"stat\":\"Sum\"}]],\"period\":300,\"stat\":\"Sum\",\"region\":\"${Region}\",\"title\":\"AWS Config Rule Evaluations\"}}]}",
            {
              "Region": {"Ref": "AWS::Region"},
              "Suffix": {"Ref": "EnvironmentSuffix"}
            }
          ]
        }
      }
    }
  },
  "Outputs": {
    "ComplianceReportBucketName": {
      "Description": "S3 bucket for compliance reports",
      "Value": {
        "Ref": "ComplianceReportBucket"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-ComplianceReportBucket"
        }
      }
    },
    "ComplianceAlertTopicArn": {
      "Description": "SNS topic ARN for compliance alerts",
      "Value": {
        "Ref": "ComplianceAlertTopic"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-ComplianceAlertTopic"
        }
      }
    },
    "TagComplianceFunctionArn": {
      "Description": "ARN of Tag Compliance Lambda function",
      "Value": {
        "Fn::GetAtt": ["TagComplianceFunction", "Arn"]
      }
    },
    "AMIComplianceFunctionArn": {
      "Description": "ARN of AMI Compliance Lambda function",
      "Value": {
        "Fn::GetAtt": ["AMIComplianceFunction", "Arn"]
      }
    },
    "DriftDetectionFunctionArn": {
      "Description": "ARN of Drift Detection Lambda function",
      "Value": {
        "Fn::GetAtt": ["DriftDetectionFunction", "Arn"]
      }
    },
    "ConfigRecorderName": {
      "Description": "Name of AWS Config recorder",
      "Value": {
        "Ref": "ConfigRecorder"
      }
    },
    "ComplianceDashboardURL": {
      "Description": "CloudWatch Dashboard URL",
      "Value": {
        "Fn::Sub": "https://console.aws.amazon.com/cloudwatch/home?region=${AWS::Region}#dashboards:name=compliance-dashboard-${EnvironmentSuffix}"
      }
    }
  }
}
```

## File: lambda/tag_compliance.py

```python
import json
import boto3
import os
from datetime import datetime

ec2 = boto3.client('ec2')
sns = boto3.client('sns')
s3 = boto3.client('s3')

REQUIRED_TAGS = ['Environment', 'Owner', 'CostCenter']

def lambda_handler(event, context):
    """
    Validates that all EC2 instances have required tags.
    Generates compliance report and sends SNS notification for violations.
    """
    print(f'Received event: {json.dumps(event)}')

    non_compliant_resources = []

    try:
        # Check EC2 instances for required tags
        instances = ec2.describe_instances()

        for reservation in instances['Reservations']:
            for instance in reservation['Instances']:
                instance_id = instance['InstanceId']
                tags = {tag['Key']: tag['Value'] for tag in instance.get('Tags', [])}

                missing_tags = [tag for tag in REQUIRED_TAGS if tag not in tags]

                if missing_tags:
                    non_compliant_resources.append({
                        'ResourceType': 'EC2Instance',
                        'ResourceId': instance_id,
                        'MissingTags': missing_tags,
                        'ExistingTags': list(tags.keys())
                    })

        # Generate compliance report
        report = {
            'Timestamp': datetime.utcnow().isoformat(),
            'TotalResourcesChecked': len(instances['Reservations']),
            'NonCompliantResources': len(non_compliant_resources),
            'Details': non_compliant_resources
        }

        # Store report in S3
        report_key = f"tag-compliance/{datetime.utcnow().strftime('%Y/%m/%d/%H%M%S')}.json"
        s3.put_object(
            Bucket=os.environ['S3_BUCKET'],
            Key=report_key,
            Body=json.dumps(report, indent=2),
            ContentType='application/json'
        )

        # Send SNS notification if non-compliant resources found
        if non_compliant_resources:
            message = f"Tag Compliance Violation Detected\n\n"
            message += f"Total Non-Compliant Resources: {len(non_compliant_resources)}\n\n"
            message += "Details:\n"
            for resource in non_compliant_resources[:10]:  # Limit to first 10
                message += f"- {resource['ResourceType']}: {resource['ResourceId']}\n"
                message += f"  Missing Tags: {', '.join(resource['MissingTags'])}\n"

            sns.publish(
                TopicArn=os.environ['SNS_TOPIC_ARN'],
                Subject='Infrastructure Tag Compliance Alert',
                Message=message
            )

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Tag compliance check completed',
                'nonCompliantResources': len(non_compliant_resources)
            })
        }

    except Exception as e:
        print(f'Error: {str(e)}')
        raise
```

## File: lambda/ami_compliance.py

```python
import json
import boto3
import os
from datetime import datetime

ec2 = boto3.client('ec2')
sns = boto3.client('sns')
s3 = boto3.client('s3')
ssm = boto3.client('ssm')

def lambda_handler(event, context):
    """
    Validates that all EC2 instances use approved AMIs.
    Approved AMI list is stored in Systems Manager Parameter Store.
    """
    print(f'Received event: {json.dumps(event)}')

    non_compliant_instances = []

    try:
        # Get approved AMIs from Parameter Store
        try:
            param = ssm.get_parameter(Name=os.environ['APPROVED_AMIS_PARAM'])
            approved_amis = json.loads(param['Parameter']['Value'])
        except:
            approved_amis = []
            print('No approved AMIs configured in Parameter Store')

        # Check all running instances
        instances = ec2.describe_instances(
            Filters=[{'Name': 'instance-state-name', 'Values': ['running', 'stopped']}]
        )

        for reservation in instances['Reservations']:
            for instance in reservation['Instances']:
                instance_id = instance['InstanceId']
                ami_id = instance['ImageId']

                if approved_amis and ami_id not in approved_amis:
                    non_compliant_instances.append({
                        'InstanceId': instance_id,
                        'AMI': ami_id,
                        'State': instance['State']['Name'],
                        'LaunchTime': instance['LaunchTime'].isoformat()
                    })

        # Generate compliance report
        report = {
            'Timestamp': datetime.utcnow().isoformat(),
            'ApprovedAMIs': approved_amis,
            'TotalInstancesChecked': sum(len(r['Instances']) for r in instances['Reservations']),
            'NonCompliantInstances': len(non_compliant_instances),
            'Details': non_compliant_instances
        }

        # Store report in S3
        report_key = f"ami-compliance/{datetime.utcnow().strftime('%Y/%m/%d/%H%M%S')}.json"
        s3.put_object(
            Bucket=os.environ['S3_BUCKET'],
            Key=report_key,
            Body=json.dumps(report, indent=2),
            ContentType='application/json'
        )

        # Send SNS notification if non-compliant instances found
        if non_compliant_instances:
            message = f"AMI Compliance Violation Detected\n\n"
            message += f"Total Non-Compliant Instances: {len(non_compliant_instances)}\n\n"
            message += "Details:\n"
            for instance in non_compliant_instances[:10]:
                message += f"- Instance: {instance['InstanceId']} using unapproved AMI: {instance['AMI']}\n"

            sns.publish(
                TopicArn=os.environ['SNS_TOPIC_ARN'],
                Subject='Infrastructure AMI Compliance Alert',
                Message=message
            )

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'AMI compliance check completed',
                'nonCompliantInstances': len(non_compliant_instances)
            })
        }

    except Exception as e:
        print(f'Error: {str(e)}')
        raise
```

## File: lambda/drift_detection.py

```python
import json
import boto3
import os
import time
from datetime import datetime

cfn = boto3.client('cloudformation')
sns = boto3.client('sns')
s3 = boto3.client('s3')

def lambda_handler(event, context):
    """
    Detects drift in CloudFormation stacks.
    Generates report and sends notifications for drifted stacks.
    """
    print(f'Received event: {json.dumps(event)}')

    drift_results = []

    try:
        # Get all CloudFormation stacks
        paginator = cfn.get_paginator('list_stacks')
        page_iterator = paginator.paginate(
            StackStatusFilter=['CREATE_COMPLETE', 'UPDATE_COMPLETE', 'UPDATE_ROLLBACK_COMPLETE']
        )

        for page in page_iterator:
            for stack in page['StackSummaries']:
                stack_name = stack['StackName']

                try:
                    # Check drift status
                    drift_info = cfn.detect_stack_drift(StackName=stack_name)
                    drift_detection_id = drift_info['StackDriftDetectionId']

                    # Wait for drift detection to complete
                    for _ in range(30):
                        status = cfn.describe_stack_drift_detection_status(
                            StackDriftDetectionId=drift_detection_id
                        )
                        if status['DetectionStatus'] == 'DETECTION_COMPLETE':
                            break
                        time.sleep(2)

                    drift_status = status.get('StackDriftStatus', 'UNKNOWN')

                    if drift_status in ['DRIFTED', 'UNKNOWN']:
                        drift_results.append({
                            'StackName': stack_name,
                            'DriftStatus': drift_status,
                            'Timestamp': datetime.utcnow().isoformat()
                        })

                except Exception as e:
                    print(f'Error checking drift for {stack_name}: {str(e)}')
                    continue

        # Generate report
        report = {
            'Timestamp': datetime.utcnow().isoformat(),
            'DriftedStacks': len(drift_results),
            'Details': drift_results
        }

        # Store report in S3
        report_key = f"drift-detection/{datetime.utcnow().strftime('%Y/%m/%d/%H%M%S')}.json"
        s3.put_object(
            Bucket=os.environ['S3_BUCKET'],
            Key=report_key,
            Body=json.dumps(report, indent=2),
            ContentType='application/json'
        )

        # Send SNS notification if drift detected
        if drift_results:
            message = f"CloudFormation Stack Drift Detected\n\n"
            message += f"Total Drifted Stacks: {len(drift_results)}\n\n"
            message += "Details:\n"
            for result in drift_results:
                message += f"- Stack: {result['StackName']} - Status: {result['DriftStatus']}\n"

            sns.publish(
                TopicArn=os.environ['SNS_TOPIC_ARN'],
                Subject='CloudFormation Stack Drift Alert',
                Message=message
            )

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Drift detection completed',
                'driftedStacks': len(drift_results)
            })
        }

    except Exception as e:
        print(f'Error: {str(e)}')
        raise
```

## File: README.md

```markdown
# Infrastructure Compliance Monitoring System

Automated infrastructure compliance analysis system for monitoring CloudFormation stack drift, validating security policies, and alerting on non-compliant resources.

## Architecture Overview

This solution deploys:

- **AWS Config**: Continuous monitoring of resource configurations and compliance
- **Lambda Functions**: Custom compliance validation (Tag, AMI, and Drift checks)
- **S3 Buckets**: Storage for compliance reports with lifecycle management
- **EventBridge**: Event-driven compliance checks triggered by AWS Config changes
- **SNS**: Real-time notifications to security team on compliance violations
- **CloudWatch**: Dashboard for compliance metrics and Lambda function monitoring
- **Systems Manager Parameter Store**: Configuration management for approved AMIs and thresholds
- **IAM Roles**: Least privilege access for all services

## Prerequisites

- AWS CLI 2.x configured with appropriate credentials
- AWS account with permissions to create all required resources
- Valid email address for security team notifications

## Deployment

### Step 1: Validate Template

```bash
aws cloudformation validate-template --template-body file://template.json
```

### Step 2: Deploy Stack

```bash
aws cloudformation create-stack \
  --stack-name compliance-monitoring \
  --template-body file://template.json \
  --parameters \
    ParameterKey=EnvironmentSuffix,ParameterValue=prod \
    ParameterKey=SecurityTeamEmail,ParameterValue=security@example.com \
    ParameterKey=ApprovedAMIs,ParameterValue="ami-0c55b159cbfafe1f0,ami-0abcdef1234567890" \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

### Step 3: Confirm SNS Subscription

After deployment, check the email address specified in `SecurityTeamEmail` parameter and confirm the SNS subscription.

### Step 4: Start AWS Config Recorder

```bash
RECORDER_NAME=$(aws cloudformation describe-stacks \
  --stack-name compliance-monitoring \
  --query 'Stacks[0].Outputs[?OutputKey==`ConfigRecorderName`].OutputValue' \
  --output text)

aws configservice start-configuration-recorder \
  --configuration-recorder-name $RECORDER_NAME \
  --region us-east-1
```

## Parameters

| Parameter | Description | Default | Required |
|-----------|-------------|---------|----------|
| EnvironmentSuffix | Unique suffix for resource naming | dev | Yes |
| SecurityTeamEmail | Email for compliance notifications | - | Yes |
| ApprovedAMIs | Comma-separated list of approved AMI IDs | ami-0c55b159cbfafe1f0,ami-0abcdef1234567890 | No |

## Features

### 1. Tag Compliance Monitoring

Validates that all EC2 instances have required tags:
- Environment
- Owner
- CostCenter

**Schedule**: Every 6 hours
**Lambda**: `tag-compliance-{EnvironmentSuffix}`

### 2. AMI Compliance Monitoring

Ensures all EC2 instances use approved AMIs stored in Parameter Store.

**Schedule**: Every 6 hours
**Lambda**: `ami-compliance-{EnvironmentSuffix}`
**Parameter**: `/compliance/approved-amis`

### 3. CloudFormation Drift Detection

Detects configuration drift in CloudFormation stacks.

**Schedule**: Every 6 hours
**Lambda**: `drift-detection-{EnvironmentSuffix}`

### 4. AWS Config Rules

- **required-tags**: Validates presence of required tags on resources

### 5. Compliance Reports

All compliance check results are stored in S3:
- **Bucket**: `compliance-reports-{EnvironmentSuffix}`
- **Lifecycle**: Transition to Glacier after 30 days, delete after 90 days
- **Organization**: Reports organized by check type and date

### 6. CloudWatch Dashboard

View compliance metrics at:
```
https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=compliance-dashboard-{EnvironmentSuffix}
```

Dashboard includes:
- Lambda execution metrics
- Lambda error rates
- Recent compliance violations
- AWS Config rule evaluations

## Compliance Checks

### Real-Time Events

EventBridge triggers compliance checks on:
- AWS Config compliance state changes
- Configuration changes detected by AWS Config

### Scheduled Checks

All three Lambda functions run every 6 hours:
- 00:00, 06:00, 12:00, 18:00 UTC

## Notifications

Security team receives SNS email notifications for:
- Resources with missing required tags
- EC2 instances using unapproved AMIs
- CloudFormation stacks with detected drift
- AWS Config compliance rule violations

## Updating Approved AMIs

Update the approved AMI list in Parameter Store:

```bash
aws ssm put-parameter \
  --name "/compliance/approved-amis" \
  --value '["ami-newami1", "ami-newami2"]' \
  --type String \
  --overwrite \
  --region us-east-1
```

## Monitoring

### CloudWatch Logs

Lambda function logs are retained for 30 days:
- `/aws/lambda/tag-compliance-{EnvironmentSuffix}`
- `/aws/lambda/ami-compliance-{EnvironmentSuffix}`
- `/aws/lambda/drift-detection-{EnvironmentSuffix}`

### Compliance Reports

Access reports in S3:
```bash
aws s3 ls s3://compliance-reports-{EnvironmentSuffix}/tag-compliance/
aws s3 ls s3://compliance-reports-{EnvironmentSuffix}/ami-compliance/
aws s3 ls s3://compliance-reports-{EnvironmentSuffix}/drift-detection/
```

## Troubleshooting

### AWS Config Not Recording

Ensure the Configuration Recorder is started:
```bash
aws configservice describe-configuration-recorder-status --region us-east-1
```

If stopped, start it:
```bash
aws configservice start-configuration-recorder \
  --configuration-recorder-name config-recorder-{EnvironmentSuffix} \
  --region us-east-1
```

### Lambda Function Errors

Check CloudWatch Logs:
```bash
aws logs tail /aws/lambda/tag-compliance-{EnvironmentSuffix} --follow
```

### SNS Notifications Not Received

1. Check SNS subscription status:
```bash
aws sns list-subscriptions-by-topic \
  --topic-arn $(aws cloudformation describe-stacks \
    --stack-name compliance-monitoring \
    --query 'Stacks[0].Outputs[?OutputKey==`ComplianceAlertTopicArn`].OutputValue' \
    --output text)
```

2. Confirm subscription via email if pending

## Cost Optimization

- Lambda functions: 256MB memory, ~1-2 minute execution, 4 executions/day = minimal cost
- S3: Lifecycle policies transition to Glacier after 30 days
- AWS Config: Charges for configuration items recorded and rule evaluations
- CloudWatch: 30-day log retention, basic dashboard (no charge for first 3)

## Cleanup

To delete the stack and all resources:

```bash
# Empty S3 buckets first
aws s3 rm s3://compliance-reports-{EnvironmentSuffix} --recursive
aws s3 rm s3://aws-config-bucket-{EnvironmentSuffix} --recursive

# Stop Config Recorder
aws configservice stop-configuration-recorder \
  --configuration-recorder-name config-recorder-{EnvironmentSuffix}

# Delete stack
aws cloudformation delete-stack --stack-name compliance-monitoring
```

## Security Considerations

1. **IAM Roles**: All roles follow least privilege principle
2. **S3 Buckets**: Block all public access enabled
3. **Encryption**: Server-side encryption (AES256) enabled on all S3 buckets
4. **Parameter Store**: Use SecureString type for sensitive parameters
5. **Network**: No VPC required; all services are managed AWS services

## Outputs

| Output | Description |
|--------|-------------|
| ComplianceReportBucketName | S3 bucket for compliance reports |
| ComplianceAlertTopicArn | SNS topic ARN for alerts |
| TagComplianceFunctionArn | Tag compliance Lambda function ARN |
| AMIComplianceFunctionArn | AMI compliance Lambda function ARN |
| DriftDetectionFunctionArn | Drift detection Lambda function ARN |
| ConfigRecorderName | AWS Config recorder name |
| ComplianceDashboardURL | CloudWatch dashboard URL |

## Support

For issues or questions:
1. Check CloudWatch Logs for Lambda function errors
2. Verify AWS Config is recording
3. Confirm SNS subscription is active
4. Review compliance reports in S3

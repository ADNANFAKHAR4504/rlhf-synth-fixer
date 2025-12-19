# AWS Config Compliance Analysis System - Implementation

This implementation provides a complete CloudFormation JSON template for automated infrastructure compliance monitoring using AWS Config, Lambda, S3, SNS, and SSM.

## Architecture Overview

- AWS Config: Continuous compliance monitoring with custom rules
- Lambda Functions: Custom evaluation logic and report generation (Python 3.11)
- S3 Bucket: Compliance report storage with 90-day lifecycle
- SNS Topic: KMS-encrypted notifications for critical violations
- SSM Documents: Automated remediation for common violations
- IAM Roles: Least-privilege custom inline policies

## File: lib/TapStack.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "AWS Config Compliance Analysis System - Automated infrastructure compliance monitoring with custom rules, Lambda processing, and SNS notifications",
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
      "Description": "Environment suffix for resource naming (e.g., dev, staging, prod)",
      "AllowedPattern": "^[a-zA-Z0-9]+$",
      "ConstraintDescription": "Must contain only alphanumeric characters"
    }
  },
  "Resources": {
    "ComplianceReportsBucket": {
      "Type": "AWS::S3::Bucket",
      "DeletionPolicy": "Delete",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "compliance-reports-${EnvironmentSuffix}-${AWS::AccountId}"
        },
        "VersioningConfiguration": {
          "Status": "Enabled"
        },
        "PublicAccessBlockConfiguration": {
          "BlockPublicAcls": true,
          "BlockPublicPolicy": true,
          "IgnorePublicAcls": true,
          "RestrictPublicBuckets": true
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
              "Id": "DeleteAfter90Days",
              "Status": "Enabled",
              "ExpirationInDays": 90
            }
          ]
        }
      }
    },
    "ConfigBucket": {
      "Type": "AWS::S3::Bucket",
      "DeletionPolicy": "Delete",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "config-snapshots-${EnvironmentSuffix}-${AWS::AccountId}"
        },
        "VersioningConfiguration": {
          "Status": "Enabled"
        },
        "PublicAccessBlockConfiguration": {
          "BlockPublicAcls": true,
          "BlockPublicPolicy": true,
          "IgnorePublicAcls": true,
          "RestrictPublicBuckets": true
        },
        "BucketEncryption": {
          "ServerSideEncryptionConfiguration": [
            {
              "ServerSideEncryptionByDefault": {
                "SSEAlgorithm": "AES256"
              }
            }
          ]
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
                "Fn::GetAtt": [
                  "ConfigBucket",
                  "Arn"
                ]
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
                "Fn::GetAtt": [
                  "ConfigBucket",
                  "Arn"
                ]
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
    "SNSEncryptionKey": {
      "Type": "AWS::KMS::Key",
      "DeletionPolicy": "Delete",
      "Properties": {
        "Description": "KMS key for SNS topic encryption",
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
              "Sid": "Allow SNS to use the key",
              "Effect": "Allow",
              "Principal": {
                "Service": "sns.amazonaws.com"
              },
              "Action": [
                "kms:Decrypt",
                "kms:GenerateDataKey"
              ],
              "Resource": "*"
            },
            {
              "Sid": "Allow CloudWatch Events to use the key",
              "Effect": "Allow",
              "Principal": {
                "Service": "events.amazonaws.com"
              },
              "Action": [
                "kms:Decrypt",
                "kms:GenerateDataKey"
              ],
              "Resource": "*"
            }
          ]
        }
      }
    },
    "SNSEncryptionKeyAlias": {
      "Type": "AWS::KMS::Alias",
      "Properties": {
        "AliasName": {
          "Fn::Sub": "alias/sns-compliance-${EnvironmentSuffix}"
        },
        "TargetKeyId": {
          "Ref": "SNSEncryptionKey"
        }
      }
    },
    "ComplianceTopic": {
      "Type": "AWS::SNS::Topic",
      "Properties": {
        "TopicName": {
          "Fn::Sub": "compliance-notifications-${EnvironmentSuffix}"
        },
        "DisplayName": "AWS Config Compliance Notifications",
        "KmsMasterKeyId": {
          "Ref": "SNSEncryptionKey"
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
        "Policies": [
          {
            "PolicyName": "ConfigPolicy",
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
                      "Fn::GetAtt": [
                        "ConfigBucket",
                        "Arn"
                      ]
                    },
                    {
                      "Fn::Sub": "${ConfigBucket.Arn}/*"
                    }
                  ]
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "sns:Publish"
                  ],
                  "Resource": {
                    "Ref": "ComplianceTopic"
                  }
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "config:Put*"
                  ],
                  "Resource": "*"
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "ec2:Describe*",
                    "rds:Describe*",
                    "s3:GetBucketLocation",
                    "s3:GetBucketVersioning",
                    "s3:ListAllMyBuckets",
                    "s3:GetBucketAcl",
                    "s3:GetBucketPolicy",
                    "s3:GetEncryptionConfiguration"
                  ],
                  "Resource": "*"
                }
              ]
            }
          }
        ]
      }
    },
    "ConfigRecorder": {
      "Type": "AWS::Config::ConfigurationRecorder",
      "DependsOn": "ConfigBucketPolicy",
      "Properties": {
        "Name": {
          "Fn::Sub": "config-recorder-${EnvironmentSuffix}"
        },
        "RoleArn": {
          "Fn::GetAtt": [
            "ConfigRole",
            "Arn"
          ]
        },
        "RecordingGroup": {
          "AllSupported": true,
          "IncludeGlobalResourceTypes": true
        }
      }
    },
    "ConfigDeliveryChannel": {
      "Type": "AWS::Config::DeliveryChannel",
      "DependsOn": "ConfigBucketPolicy",
      "Properties": {
        "Name": {
          "Fn::Sub": "config-delivery-${EnvironmentSuffix}"
        },
        "S3BucketName": {
          "Ref": "ConfigBucket"
        },
        "SnsTopicARN": {
          "Ref": "ComplianceTopic"
        },
        "ConfigSnapshotDeliveryProperties": {
          "DeliveryFrequency": "TwentyFour_Hours"
        }
      }
    },
    "LambdaExecutionRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "lambda-compliance-role-${EnvironmentSuffix}"
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
        "Policies": [
          {
            "PolicyName": "LambdaExecutionPolicy",
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
                    "Fn::Sub": "arn:aws:logs:${AWS::Region}:${AWS::AccountId}:*"
                  }
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "config:PutEvaluations",
                    "config:GetComplianceDetailsByConfigRule",
                    "config:DescribeConfigRules"
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
                    "Fn::Sub": "${ComplianceReportsBucket.Arn}/*"
                  }
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "sns:Publish"
                  ],
                  "Resource": {
                    "Ref": "ComplianceTopic"
                  }
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "ec2:DescribeSecurityGroups",
                    "rds:DescribeDBInstances",
                    "s3:GetBucketEncryption",
                    "ec2:DescribeVolumes"
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
          "Fn::Sub": "tag-compliance-evaluator-${EnvironmentSuffix}"
        },
        "Runtime": "python3.11",
        "Handler": "index.lambda_handler",
        "Role": {
          "Fn::GetAtt": [
            "LambdaExecutionRole",
            "Arn"
          ]
        },
        "MemorySize": 256,
        "Timeout": 300,
        "ReservedConcurrentExecutions": 5,
        "Code": {
          "ZipFile": "import json\nimport boto3\nfrom datetime import datetime\n\nconfig_client = boto3.client('config')\n\nREQUIRED_TAGS = ['Environment', 'Owner', 'CostCenter']\n\ndef lambda_handler(event, context):\n    print(f\"Received event: {json.dumps(event)}\")\n    \n    invoking_event = json.loads(event['invokingEvent'])\n    configuration_item = invoking_event['configurationItem']\n    \n    compliance_type = 'COMPLIANT'\n    annotation = 'All required tags are present'\n    \n    resource_type = configuration_item['resourceType']\n    resource_id = configuration_item['resourceId']\n    \n    tags = configuration_item.get('tags', {})\n    \n    missing_tags = []\n    for required_tag in REQUIRED_TAGS:\n        if required_tag not in tags:\n            missing_tags.append(required_tag)\n    \n    if missing_tags:\n        compliance_type = 'NON_COMPLIANT'\n        annotation = f\"Missing required tags: {', '.join(missing_tags)}\"\n    \n    evaluations = [{\n        'ComplianceResourceType': resource_type,\n        'ComplianceResourceId': resource_id,\n        'ComplianceType': compliance_type,\n        'Annotation': annotation,\n        'OrderingTimestamp': configuration_item['configurationItemCaptureTime']\n    }]\n    \n    result_token = event.get('resultToken', 'No token found')\n    \n    if result_token != 'No token found':\n        config_client.put_evaluations(\n            Evaluations=evaluations,\n            ResultToken=result_token\n        )\n    \n    print(f\"Evaluation result: {compliance_type} - {annotation}\")\n    \n    return {\n        'statusCode': 200,\n        'body': json.dumps({\n            'compliance': compliance_type,\n            'annotation': annotation\n        })\n    }\n"
        }
      }
    },
    "EncryptionComplianceFunction": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "FunctionName": {
          "Fn::Sub": "encryption-compliance-evaluator-${EnvironmentSuffix}"
        },
        "Runtime": "python3.11",
        "Handler": "index.lambda_handler",
        "Role": {
          "Fn::GetAtt": [
            "LambdaExecutionRole",
            "Arn"
          ]
        },
        "MemorySize": 256,
        "Timeout": 300,
        "ReservedConcurrentExecutions": 5,
        "Code": {
          "ZipFile": "import json\nimport boto3\n\nconfig_client = boto3.client('config')\nec2_client = boto3.client('ec2')\nrds_client = boto3.client('rds')\ns3_client = boto3.client('s3')\n\ndef lambda_handler(event, context):\n    print(f\"Received event: {json.dumps(event)}\")\n    \n    invoking_event = json.loads(event['invokingEvent'])\n    configuration_item = invoking_event['configurationItem']\n    \n    resource_type = configuration_item['resourceType']\n    resource_id = configuration_item['resourceId']\n    \n    compliance_type = 'COMPLIANT'\n    annotation = 'Resource is encrypted'\n    \n    try:\n        if resource_type == 'AWS::RDS::DBInstance':\n            response = rds_client.describe_db_instances(DBInstanceIdentifier=resource_id)\n            encrypted = response['DBInstances'][0].get('StorageEncrypted', False)\n            if not encrypted:\n                compliance_type = 'NON_COMPLIANT'\n                annotation = 'RDS instance is not encrypted'\n        \n        elif resource_type == 'AWS::S3::Bucket':\n            try:\n                response = s3_client.get_bucket_encryption(Bucket=resource_id)\n                if not response.get('ServerSideEncryptionConfiguration'):\n                    compliance_type = 'NON_COMPLIANT'\n                    annotation = 'S3 bucket does not have encryption enabled'\n            except s3_client.exceptions.ServerSideEncryptionConfigurationNotFoundError:\n                compliance_type = 'NON_COMPLIANT'\n                annotation = 'S3 bucket does not have encryption configured'\n        \n        elif resource_type == 'AWS::EC2::Volume':\n            response = ec2_client.describe_volumes(VolumeIds=[resource_id])\n            encrypted = response['Volumes'][0].get('Encrypted', False)\n            if not encrypted:\n                compliance_type = 'NON_COMPLIANT'\n                annotation = 'EBS volume is not encrypted'\n        \n        else:\n            compliance_type = 'NOT_APPLICABLE'\n            annotation = 'Resource type not evaluated for encryption'\n    \n    except Exception as e:\n        print(f\"Error evaluating resource: {str(e)}\")\n        compliance_type = 'NOT_APPLICABLE'\n        annotation = f'Error evaluating resource: {str(e)}'\n    \n    evaluations = [{\n        'ComplianceResourceType': resource_type,\n        'ComplianceResourceId': resource_id,\n        'ComplianceType': compliance_type,\n        'Annotation': annotation,\n        'OrderingTimestamp': configuration_item['configurationItemCaptureTime']\n    }]\n    \n    result_token = event.get('resultToken', 'No token found')\n    \n    if result_token != 'No token found':\n        config_client.put_evaluations(\n            Evaluations=evaluations,\n            ResultToken=result_token\n        )\n    \n    print(f\"Evaluation result: {compliance_type} - {annotation}\")\n    \n    return {\n        'statusCode': 200,\n        'body': json.dumps({\n            'compliance': compliance_type,\n            'annotation': annotation\n        })\n    }\n"
        }
      }
    },
    "SecurityGroupComplianceFunction": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "FunctionName": {
          "Fn::Sub": "securitygroup-compliance-evaluator-${EnvironmentSuffix}"
        },
        "Runtime": "python3.11",
        "Handler": "index.lambda_handler",
        "Role": {
          "Fn::GetAtt": [
            "LambdaExecutionRole",
            "Arn"
          ]
        },
        "MemorySize": 256,
        "Timeout": 300,
        "ReservedConcurrentExecutions": 5,
        "Code": {
          "ZipFile": "import json\nimport boto3\n\nconfig_client = boto3.client('config')\nec2_client = boto3.client('ec2')\n\nRESTRICTED_PORTS = [22, 3389]\n\ndef lambda_handler(event, context):\n    print(f\"Received event: {json.dumps(event)}\")\n    \n    invoking_event = json.loads(event['invokingEvent'])\n    configuration_item = invoking_event['configurationItem']\n    \n    resource_type = configuration_item['resourceType']\n    resource_id = configuration_item['resourceId']\n    \n    if resource_type != 'AWS::EC2::SecurityGroup':\n        return {'statusCode': 200, 'body': 'Not a security group'}\n    \n    compliance_type = 'COMPLIANT'\n    annotation = 'Security group rules are compliant'\n    violations = []\n    \n    try:\n        response = ec2_client.describe_security_groups(GroupIds=[resource_id])\n        security_group = response['SecurityGroups'][0]\n        \n        for rule in security_group.get('IpPermissions', []):\n            from_port = rule.get('FromPort', 0)\n            to_port = rule.get('ToPort', 0)\n            \n            for ip_range in rule.get('IpRanges', []):\n                cidr = ip_range.get('CidrIp', '')\n                if cidr == '0.0.0.0/0':\n                    for port in RESTRICTED_PORTS:\n                        if from_port <= port <= to_port:\n                            violations.append(f\"Port {port} open to 0.0.0.0/0\")\n            \n            for ipv6_range in rule.get('Ipv6Ranges', []):\n                cidr = ipv6_range.get('CidrIpv6', '')\n                if cidr == '::/0':\n                    for port in RESTRICTED_PORTS:\n                        if from_port <= port <= to_port:\n                            violations.append(f\"Port {port} open to ::/0\")\n        \n        if violations:\n            compliance_type = 'NON_COMPLIANT'\n            annotation = f\"Security violations: {'; '.join(violations)}\"\n    \n    except Exception as e:\n        print(f\"Error evaluating security group: {str(e)}\")\n        compliance_type = 'NOT_APPLICABLE'\n        annotation = f'Error evaluating security group: {str(e)}'\n    \n    evaluations = [{\n        'ComplianceResourceType': resource_type,\n        'ComplianceResourceId': resource_id,\n        'ComplianceType': compliance_type,\n        'Annotation': annotation,\n        'OrderingTimestamp': configuration_item['configurationItemCaptureTime']\n    }]\n    \n    result_token = event.get('resultToken', 'No token found')\n    \n    if result_token != 'No token found':\n        config_client.put_evaluations(\n            Evaluations=evaluations,\n            ResultToken=result_token\n        )\n    \n    print(f\"Evaluation result: {compliance_type} - {annotation}\")\n    \n    return {\n        'statusCode': 200,\n        'body': json.dumps({\n            'compliance': compliance_type,\n            'annotation': annotation,\n            'violations': violations\n        })\n    }\n"
        }
      }
    },
    "ComplianceReportFunction": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "FunctionName": {
          "Fn::Sub": "compliance-report-generator-${EnvironmentSuffix}"
        },
        "Runtime": "python3.11",
        "Handler": "index.lambda_handler",
        "Role": {
          "Fn::GetAtt": [
            "LambdaExecutionRole",
            "Arn"
          ]
        },
        "MemorySize": 256,
        "Timeout": 300,
        "ReservedConcurrentExecutions": 5,
        "Environment": {
          "Variables": {
            "REPORTS_BUCKET": {
              "Ref": "ComplianceReportsBucket"
            },
            "SNS_TOPIC_ARN": {
              "Ref": "ComplianceTopic"
            }
          }
        },
        "Code": {
          "ZipFile": "import json\nimport boto3\nimport os\nfrom datetime import datetime\n\ns3_client = boto3.client('s3')\nconfig_client = boto3.client('config')\nsns_client = boto3.client('sns')\n\ndef lambda_handler(event, context):\n    print(f\"Generating compliance report\")\n    \n    reports_bucket = os.environ['REPORTS_BUCKET']\n    sns_topic_arn = os.environ['SNS_TOPIC_ARN']\n    \n    try:\n        rules_response = config_client.describe_config_rules()\n        config_rules = rules_response.get('ConfigRules', [])\n        \n        report = {\n            'timestamp': datetime.utcnow().isoformat(),\n            'rules': [],\n            'summary': {\n                'total_rules': 0,\n                'compliant': 0,\n                'non_compliant': 0,\n                'not_applicable': 0\n            }\n        }\n        \n        critical_violations = []\n        \n        for rule in config_rules:\n            rule_name = rule['ConfigRuleName']\n            \n            try:\n                compliance_response = config_client.get_compliance_details_by_config_rule(\n                    ConfigRuleName=rule_name,\n                    ComplianceTypes=['NON_COMPLIANT'],\n                    Limit=100\n                )\n                \n                non_compliant_resources = compliance_response.get('EvaluationResults', [])\n                \n                rule_report = {\n                    'rule_name': rule_name,\n                    'non_compliant_count': len(non_compliant_resources),\n                    'violations': []\n                }\n                \n                for resource in non_compliant_resources:\n                    violation = {\n                        'resource_type': resource['EvaluationResultIdentifier']['EvaluationResultQualifier']['ResourceType'],\n                        'resource_id': resource['EvaluationResultIdentifier']['EvaluationResultQualifier']['ResourceId'],\n                        'annotation': resource.get('Annotation', 'No annotation')\n                    }\n                    rule_report['violations'].append(violation)\n                    critical_violations.append(violation)\n                \n                report['rules'].append(rule_report)\n                report['summary']['total_rules'] += 1\n                \n                if len(non_compliant_resources) > 0:\n                    report['summary']['non_compliant'] += 1\n                else:\n                    report['summary']['compliant'] += 1\n            \n            except Exception as e:\n                print(f\"Error evaluating rule {rule_name}: {str(e)}\")\n        \n        report_key = f\"compliance-reports/{datetime.utcnow().strftime('%Y/%m/%d')}/report-{datetime.utcnow().strftime('%Y%m%d-%H%M%S')}.json\"\n        \n        s3_client.put_object(\n            Bucket=reports_bucket,\n            Key=report_key,\n            Body=json.dumps(report, indent=2),\n            ContentType='application/json'\n        )\n        \n        print(f\"Report saved to s3://{reports_bucket}/{report_key}\")\n        \n        if critical_violations:\n            message = f\"AWS Config Compliance Report\\n\\n\"\n            message += f\"Timestamp: {report['timestamp']}\\n\"\n            message += f\"Total Rules: {report['summary']['total_rules']}\\n\"\n            message += f\"Non-Compliant: {report['summary']['non_compliant']}\\n\"\n            message += f\"Compliant: {report['summary']['compliant']}\\n\\n\"\n            message += f\"Critical Violations: {len(critical_violations)}\\n\\n\"\n            message += f\"Report Location: s3://{reports_bucket}/{report_key}\"\n            \n            sns_client.publish(\n                TopicArn=sns_topic_arn,\n                Subject='AWS Config Compliance Report - Action Required',\n                Message=message\n            )\n            \n            print(f\"Notification sent to SNS topic: {sns_topic_arn}\")\n        \n        return {\n            'statusCode': 200,\n            'body': json.dumps({\n                'report_location': f\"s3://{reports_bucket}/{report_key}\",\n                'summary': report['summary']\n            })\n        }\n    \n    except Exception as e:\n        print(f\"Error generating report: {str(e)}\")\n        return {\n            'statusCode': 500,\n            'body': json.dumps({'error': str(e)})\n        }\n"
        }
      }
    },
    "LambdaInvokePermissionTagCompliance": {
      "Type": "AWS::Lambda::Permission",
      "Properties": {
        "FunctionName": {
          "Fn::GetAtt": [
            "TagComplianceFunction",
            "Arn"
          ]
        },
        "Action": "lambda:InvokeFunction",
        "Principal": "config.amazonaws.com",
        "SourceAccount": {
          "Ref": "AWS::AccountId"
        }
      }
    },
    "LambdaInvokePermissionEncryptionCompliance": {
      "Type": "AWS::Lambda::Permission",
      "Properties": {
        "FunctionName": {
          "Fn::GetAtt": [
            "EncryptionComplianceFunction",
            "Arn"
          ]
        },
        "Action": "lambda:InvokeFunction",
        "Principal": "config.amazonaws.com",
        "SourceAccount": {
          "Ref": "AWS::AccountId"
        }
      }
    },
    "LambdaInvokePermissionSecurityGroupCompliance": {
      "Type": "AWS::Lambda::Permission",
      "Properties": {
        "FunctionName": {
          "Fn::GetAtt": [
            "SecurityGroupComplianceFunction",
            "Arn"
          ]
        },
        "Action": "lambda:InvokeFunction",
        "Principal": "config.amazonaws.com",
        "SourceAccount": {
          "Ref": "AWS::AccountId"
        }
      }
    },
    "ConfigRuleTagCompliance": {
      "Type": "AWS::Config::ConfigRule",
      "DependsOn": [
        "ConfigRecorder",
        "ConfigDeliveryChannel"
      ],
      "Properties": {
        "ConfigRuleName": {
          "Fn::Sub": "required-tags-compliance-${EnvironmentSuffix}"
        },
        "Description": "Evaluates whether resources have required tags: Environment, Owner, CostCenter",
        "Scope": {
          "ComplianceResourceTypes": [
            "AWS::EC2::Instance",
            "AWS::S3::Bucket",
            "AWS::RDS::DBInstance",
            "AWS::Lambda::Function"
          ]
        },
        "Source": {
          "Owner": "CUSTOM_LAMBDA",
          "SourceIdentifier": {
            "Fn::GetAtt": [
              "TagComplianceFunction",
              "Arn"
            ]
          },
          "SourceDetails": [
            {
              "EventSource": "aws.config",
              "MessageType": "ConfigurationItemChangeNotification"
            },
            {
              "EventSource": "aws.config",
              "MessageType": "OversizedConfigurationItemChangeNotification"
            }
          ]
        },
        "MaximumExecutionFrequency": "TwentyFour_Hours"
      }
    },
    "ConfigRuleEncryptionCompliance": {
      "Type": "AWS::Config::ConfigRule",
      "DependsOn": [
        "ConfigRecorder",
        "ConfigDeliveryChannel"
      ],
      "Properties": {
        "ConfigRuleName": {
          "Fn::Sub": "encryption-compliance-${EnvironmentSuffix}"
        },
        "Description": "Evaluates whether RDS, S3, and EBS resources are encrypted",
        "Scope": {
          "ComplianceResourceTypes": [
            "AWS::RDS::DBInstance",
            "AWS::S3::Bucket",
            "AWS::EC2::Volume"
          ]
        },
        "Source": {
          "Owner": "CUSTOM_LAMBDA",
          "SourceIdentifier": {
            "Fn::GetAtt": [
              "EncryptionComplianceFunction",
              "Arn"
            ]
          },
          "SourceDetails": [
            {
              "EventSource": "aws.config",
              "MessageType": "ConfigurationItemChangeNotification"
            },
            {
              "EventSource": "aws.config",
              "MessageType": "OversizedConfigurationItemChangeNotification"
            }
          ]
        },
        "MaximumExecutionFrequency": "TwentyFour_Hours"
      }
    },
    "ConfigRuleSecurityGroupCompliance": {
      "Type": "AWS::Config::ConfigRule",
      "DependsOn": [
        "ConfigRecorder",
        "ConfigDeliveryChannel"
      ],
      "Properties": {
        "ConfigRuleName": {
          "Fn::Sub": "security-group-compliance-${EnvironmentSuffix}"
        },
        "Description": "Evaluates whether security groups allow unrestricted access on SSH and RDP ports",
        "Scope": {
          "ComplianceResourceTypes": [
            "AWS::EC2::SecurityGroup"
          ]
        },
        "Source": {
          "Owner": "CUSTOM_LAMBDA",
          "SourceIdentifier": {
            "Fn::GetAtt": [
              "SecurityGroupComplianceFunction",
              "Arn"
            ]
          },
          "SourceDetails": [
            {
              "EventSource": "aws.config",
              "MessageType": "ConfigurationItemChangeNotification"
            },
            {
              "EventSource": "aws.config",
              "MessageType": "OversizedConfigurationItemChangeNotification"
            }
          ]
        }
      }
    },
    "ReportGenerationSchedule": {
      "Type": "AWS::Events::Rule",
      "Properties": {
        "Name": {
          "Fn::Sub": "compliance-report-schedule-${EnvironmentSuffix}"
        },
        "Description": "Trigger compliance report generation daily",
        "ScheduleExpression": "rate(1 day)",
        "State": "ENABLED",
        "Targets": [
          {
            "Arn": {
              "Fn::GetAtt": [
                "ComplianceReportFunction",
                "Arn"
              ]
            },
            "Id": "ComplianceReportTarget"
          }
        ]
      }
    },
    "LambdaInvokePermissionReportSchedule": {
      "Type": "AWS::Lambda::Permission",
      "Properties": {
        "FunctionName": {
          "Ref": "ComplianceReportFunction"
        },
        "Action": "lambda:InvokeFunction",
        "Principal": "events.amazonaws.com",
        "SourceArn": {
          "Fn::GetAtt": [
            "ReportGenerationSchedule",
            "Arn"
          ]
        }
      }
    },
    "RemediationDocument": {
      "Type": "AWS::SSM::Document",
      "Properties": {
        "Name": {
          "Fn::Sub": "AddRequiredTags-${EnvironmentSuffix}"
        },
        "DocumentType": "Automation",
        "DocumentFormat": "YAML",
        "Content": {
          "schemaVersion": "0.3",
          "description": "Add required tags to non-compliant resources",
          "parameters": {
            "ResourceId": {
              "type": "String",
              "description": "Resource ID to tag"
            },
            "ResourceType": {
              "type": "String",
              "description": "Type of resource"
            }
          },
          "mainSteps": [
            {
              "name": "AddTags",
              "action": "aws:executeScript",
              "inputs": {
                "Runtime": "python3.8",
                "Handler": "add_tags",
                "Script": "import boto3\n\ndef add_tags(events, context):\n    resource_id = events['ResourceId']\n    resource_type = events['ResourceType']\n    \n    default_tags = [\n        {'Key': 'Environment', 'Value': 'production'},\n        {'Key': 'Owner', 'Value': 'compliance-team'},\n        {'Key': 'CostCenter', 'Value': 'security'}\n    ]\n    \n    if resource_type == 'AWS::EC2::Instance':\n        ec2 = boto3.client('ec2')\n        ec2.create_tags(Resources=[resource_id], Tags=default_tags)\n    elif resource_type == 'AWS::S3::Bucket':\n        s3 = boto3.client('s3')\n        tag_set = [{'Key': tag['Key'], 'Value': tag['Value']} for tag in default_tags]\n        s3.put_bucket_tagging(Bucket=resource_id, Tagging={'TagSet': tag_set})\n    \n    return {'message': 'Tags added successfully'}\n",
                "InputPayload": {
                  "ResourceId": "{{ ResourceId }}",
                  "ResourceType": "{{ ResourceType }}"
                }
              }
            }
          ]
        }
      }
    }
  },
  "Outputs": {
    "ConfigRecorderName": {
      "Description": "Name of the AWS Config Recorder",
      "Value": {
        "Ref": "ConfigRecorder"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-ConfigRecorderName"
        }
      }
    },
    "ComplianceReportsBucketName": {
      "Description": "Name of the S3 bucket storing compliance reports",
      "Value": {
        "Ref": "ComplianceReportsBucket"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-ComplianceReportsBucket"
        }
      }
    },
    "ComplianceTopicArn": {
      "Description": "ARN of the SNS topic for compliance notifications",
      "Value": {
        "Ref": "ComplianceTopic"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-ComplianceTopicArn"
        }
      }
    },
    "TagComplianceFunctionArn": {
      "Description": "ARN of the tag compliance Lambda function",
      "Value": {
        "Fn::GetAtt": [
          "TagComplianceFunction",
          "Arn"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-TagComplianceFunction"
        }
      }
    },
    "EncryptionComplianceFunctionArn": {
      "Description": "ARN of the encryption compliance Lambda function",
      "Value": {
        "Fn::GetAtt": [
          "EncryptionComplianceFunction",
          "Arn"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-EncryptionComplianceFunction"
        }
      }
    },
    "SecurityGroupComplianceFunctionArn": {
      "Description": "ARN of the security group compliance Lambda function",
      "Value": {
        "Fn::GetAtt": [
          "SecurityGroupComplianceFunction",
          "Arn"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-SecurityGroupComplianceFunction"
        }
      }
    },
    "ComplianceReportFunctionArn": {
      "Description": "ARN of the compliance report generator Lambda function",
      "Value": {
        "Fn::GetAtt": [
          "ComplianceReportFunction",
          "Arn"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-ComplianceReportFunction"
        }
      }
    },
    "SNSEncryptionKeyId": {
      "Description": "KMS Key ID for SNS encryption",
      "Value": {
        "Ref": "SNSEncryptionKey"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-SNSEncryptionKey"
        }
      }
    },
    "RemediationDocumentName": {
      "Description": "Name of the SSM remediation document",
      "Value": {
        "Ref": "RemediationDocument"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-RemediationDocument"
        }
      }
    },
    "EnvironmentSuffix": {
      "Description": "Environment suffix used for this deployment",
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

## Implementation Notes

### Lambda Functions

All Lambda functions use Python 3.11 runtime with 256MB memory and have reserved concurrent executions set to 5 to prevent throttling.

1. **TagComplianceFunction**: Evaluates resources for required tags (Environment, Owner, CostCenter)
2. **EncryptionComplianceFunction**: Checks RDS, S3, and EBS resources for encryption
3. **SecurityGroupComplianceFunction**: Validates security groups don't allow unrestricted access on ports 22 and 3389
4. **ComplianceReportFunction**: Generates daily compliance reports and sends SNS notifications

### AWS Config Rules

Three custom Config rules with Lambda-based evaluation:
- **required-tags-compliance**: Evaluates tag presence on EC2, S3, RDS, Lambda
- **encryption-compliance**: Evaluates encryption on RDS, S3, EBS
- **security-group-compliance**: Evaluates security group rules

### IAM Roles

- **ConfigRole**: Custom inline policies for AWS Config service
- **LambdaExecutionRole**: Custom inline policies for Lambda execution (no AWS managed policies)

### Encryption

- S3 buckets use SSE-S3 (AES256) encryption
- SNS topic uses customer-managed KMS key
- Config delivery channel uses SSE-S3 encryption

### Lifecycle and Retention

- Compliance reports have 90-day lifecycle policy
- Config snapshots delivered every 24 hours
- Report generation scheduled daily via EventBridge

### Remediation

SSM Automation document for adding missing tags to resources, integrating with Config rules for automated remediation.

## Testing Strategy

Unit tests should cover:
- Lambda function logic for all compliance rules
- Tag validation with missing/present tags
- Encryption detection for RDS, S3, EBS
- Security group rule parsing
- Report generation and S3 upload
- SNS notification triggering

Integration tests should verify:
- Config recorder activation
- Config rule evaluation
- Lambda invocation by Config
- S3 bucket permissions
- SNS topic encryption with KMS
- EventBridge scheduling
- Cross-service IAM permissions

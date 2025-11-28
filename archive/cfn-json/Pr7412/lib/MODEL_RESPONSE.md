# CloudFormation Observability Infrastructure Solution

This solution provides comprehensive monitoring, logging, and tracing infrastructure for ECS-based microservices using CloudFormation JSON.

## Architecture Overview

The infrastructure includes:
- CloudWatch Log Groups with 90-day retention
- X-Ray sampling configuration for distributed tracing
- Custom CloudWatch metrics namespace
- 5 metric alarms (CPU, memory, error rate, latency, availability)
- Composite alarm for critical conditions
- SNS topic for notifications
- CloudWatch Dashboard with 4+ widgets
- CloudWatch Synthetics canary for endpoint monitoring
- Parameter Store for alarm thresholds

## File: lib/TapStack.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Comprehensive observability infrastructure for ECS microservices with CloudWatch, X-Ray, and Synthetics",
  "Parameters": {
    "environmentSuffix": {
      "Type": "String",
      "Description": "Environment suffix for resource naming to ensure uniqueness",
      "Default": "prod",
      "AllowedPattern": "^[a-z0-9-]+$",
      "ConstraintDescription": "Must contain only lowercase letters, numbers, and hyphens"
    },
    "NotificationEmail": {
      "Type": "String",
      "Description": "Email address for alarm notifications",
      "Default": "platform-team@example.com",
      "AllowedPattern": "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
      "ConstraintDescription": "Must be a valid email address"
    },
    "HealthCheckEndpoint": {
      "Type": "String",
      "Description": "Health check endpoint URL for Synthetics canary",
      "Default": "https://api.example.com/health"
    },
    "ECSClusterName": {
      "Type": "String",
      "Description": "Name of the ECS cluster to monitor",
      "Default": "finance-app-cluster"
    }
  },
  "Resources": {
    "ApplicationLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/aws/ecs/financeapp-${environmentSuffix}"
        },
        "RetentionInDays": 90,
        "Tags": [
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "Team",
            "Value": "Platform"
          }
        ]
      }
    },
    "ServiceLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/aws/ecs/services-${environmentSuffix}"
        },
        "RetentionInDays": 90,
        "Tags": [
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "Team",
            "Value": "Platform"
          }
        ]
      }
    },
    "ContainerInsightsLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/aws/ecs/containerinsights/${ECSClusterName}/performance-${environmentSuffix}"
        },
        "RetentionInDays": 90,
        "Tags": [
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "Team",
            "Value": "Platform"
          }
        ]
      }
    },
    "XRayGroup": {
      "Type": "AWS::XRay::Group",
      "Properties": {
        "GroupName": {
          "Fn::Sub": "FinanceApp-${environmentSuffix}"
        },
        "FilterExpression": "service(\"financeapp\") AND annotation.environment = \"production\"",
        "Tags": [
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "Team",
            "Value": "Platform"
          }
        ]
      }
    },
    "XRaySamplingRule": {
      "Type": "AWS::XRay::SamplingRule",
      "Properties": {
        "RuleName": {
          "Fn::Sub": "FinanceAppSampling-${environmentSuffix}"
        },
        "Priority": 1000,
        "Version": 1,
        "ReservoirSize": 1,
        "FixedRate": 0.1,
        "URLPath": "*",
        "Host": "*",
        "HTTPMethod": "*",
        "ServiceType": "*",
        "ServiceName": "*",
        "ResourceARN": "*",
        "Tags": [
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "Team",
            "Value": "Platform"
          }
        ]
      }
    },
    "AlarmNotificationTopic": {
      "Type": "AWS::SNS::Topic",
      "Properties": {
        "TopicName": {
          "Fn::Sub": "observability-alarms-${environmentSuffix}"
        },
        "DisplayName": "Observability Alarm Notifications",
        "Tags": [
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "Team",
            "Value": "Platform"
          }
        ]
      }
    },
    "AlarmEmailSubscription": {
      "Type": "AWS::SNS::Subscription",
      "Properties": {
        "Protocol": "email",
        "TopicArn": {
          "Ref": "AlarmNotificationTopic"
        },
        "Endpoint": {
          "Ref": "NotificationEmail"
        }
      }
    },
    "CPUThresholdParameter": {
      "Type": "AWS::SSM::Parameter",
      "Properties": {
        "Name": {
          "Fn::Sub": "/financeapp/${environmentSuffix}/alarms/cpu-threshold"
        },
        "Type": "SecureString",
        "Value": "80",
        "Description": "CPU utilization alarm threshold percentage",
        "Tags": {
          "Environment": "Production",
          "Team": "Platform"
        }
      }
    },
    "MemoryThresholdParameter": {
      "Type": "AWS::SSM::Parameter",
      "Properties": {
        "Name": {
          "Fn::Sub": "/financeapp/${environmentSuffix}/alarms/memory-threshold"
        },
        "Type": "SecureString",
        "Value": "85",
        "Description": "Memory utilization alarm threshold percentage",
        "Tags": {
          "Environment": "Production",
          "Team": "Platform"
        }
      }
    },
    "ErrorRateThresholdParameter": {
      "Type": "AWS::SSM::Parameter",
      "Properties": {
        "Name": {
          "Fn::Sub": "/financeapp/${environmentSuffix}/alarms/error-rate-threshold"
        },
        "Type": "SecureString",
        "Value": "5",
        "Description": "Error rate alarm threshold percentage",
        "Tags": {
          "Environment": "Production",
          "Team": "Platform"
        }
      }
    },
    "LatencyThresholdParameter": {
      "Type": "AWS::SSM::Parameter",
      "Properties": {
        "Name": {
          "Fn::Sub": "/financeapp/${environmentSuffix}/alarms/latency-threshold"
        },
        "Type": "SecureString",
        "Value": "1000",
        "Description": "Latency alarm threshold in milliseconds",
        "Tags": {
          "Environment": "Production",
          "Team": "Platform"
        }
      }
    },
    "AvailabilityThresholdParameter": {
      "Type": "AWS::SSM::Parameter",
      "Properties": {
        "Name": {
          "Fn::Sub": "/financeapp/${environmentSuffix}/alarms/availability-threshold"
        },
        "Type": "SecureString",
        "Value": "99.9",
        "Description": "Availability alarm threshold percentage",
        "Tags": {
          "Environment": "Production",
          "Team": "Platform"
        }
      }
    },
    "CPUAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "FinanceApp-HighCPU-${environmentSuffix}"
        },
        "AlarmDescription": "Alarm when CPU utilization exceeds 80%",
        "MetricName": "CPUUtilization",
        "Namespace": "AWS/ECS",
        "Statistic": "Average",
        "Period": 300,
        "EvaluationPeriods": 2,
        "Threshold": 80,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "ClusterName",
            "Value": {
              "Ref": "ECSClusterName"
            }
          }
        ],
        "AlarmActions": [
          {
            "Ref": "AlarmNotificationTopic"
          }
        ],
        "Tags": [
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "Team",
            "Value": "Platform"
          }
        ]
      }
    },
    "MemoryAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "FinanceApp-HighMemory-${environmentSuffix}"
        },
        "AlarmDescription": "Alarm when memory utilization exceeds 85%",
        "MetricName": "MemoryUtilization",
        "Namespace": "AWS/ECS",
        "Statistic": "Average",
        "Period": 300,
        "EvaluationPeriods": 2,
        "Threshold": 85,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "ClusterName",
            "Value": {
              "Ref": "ECSClusterName"
            }
          }
        ],
        "AlarmActions": [
          {
            "Ref": "AlarmNotificationTopic"
          }
        ],
        "Tags": [
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "Team",
            "Value": "Platform"
          }
        ]
      }
    },
    "ErrorRateAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "FinanceApp-HighErrorRate-${environmentSuffix}"
        },
        "AlarmDescription": "Alarm when error rate exceeds 5%",
        "MetricName": "ErrorRate",
        "Namespace": "FinanceApp/Production",
        "Statistic": "Average",
        "Period": 300,
        "EvaluationPeriods": 2,
        "Threshold": 5,
        "ComparisonOperator": "GreaterThanThreshold",
        "AlarmActions": [
          {
            "Ref": "AlarmNotificationTopic"
          }
        ],
        "Tags": [
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "Team",
            "Value": "Platform"
          }
        ]
      }
    },
    "LatencyAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "FinanceApp-HighLatency-${environmentSuffix}"
        },
        "AlarmDescription": "Alarm when latency exceeds 1000ms",
        "MetricName": "Latency",
        "Namespace": "FinanceApp/Production",
        "Statistic": "Average",
        "Period": 300,
        "EvaluationPeriods": 2,
        "Threshold": 1000,
        "ComparisonOperator": "GreaterThanThreshold",
        "AlarmActions": [
          {
            "Ref": "AlarmNotificationTopic"
          }
        ],
        "Tags": [
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "Team",
            "Value": "Platform"
          }
        ]
      }
    },
    "AvailabilityAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "FinanceApp-LowAvailability-${environmentSuffix}"
        },
        "AlarmDescription": "Alarm when availability drops below 99.9%",
        "MetricName": "Availability",
        "Namespace": "FinanceApp/Production",
        "Statistic": "Average",
        "Period": 300,
        "EvaluationPeriods": 2,
        "Threshold": 99.9,
        "ComparisonOperator": "LessThanThreshold",
        "AlarmActions": [
          {
            "Ref": "AlarmNotificationTopic"
          }
        ],
        "Tags": [
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "Team",
            "Value": "Platform"
          }
        ]
      }
    },
    "CompositeAlarm": {
      "Type": "AWS::CloudWatch::CompositeAlarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "FinanceApp-CriticalCondition-${environmentSuffix}"
        },
        "AlarmDescription": "Critical alarm when both CPU > 80% AND memory > 85%",
        "AlarmRule": {
          "Fn::Sub": "ALARM(${CPUAlarm}) AND ALARM(${MemoryAlarm})"
        },
        "AlarmActions": [
          {
            "Ref": "AlarmNotificationTopic"
          }
        ],
        "Tags": [
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "Team",
            "Value": "Platform"
          }
        ]
      }
    },
    "ObservabilityDashboard": {
      "Type": "AWS::CloudWatch::Dashboard",
      "Properties": {
        "DashboardName": {
          "Fn::Sub": "FinanceApp-Observability-${environmentSuffix}"
        },
        "DashboardBody": {
          "Fn::Sub": [
            "{\"widgets\":[{\"type\":\"metric\",\"properties\":{\"metrics\":[[\"AWS/ECS\",\"CPUUtilization\",{\"stat\":\"Average\",\"label\":\"CPU Utilization\"}]],\"region\":\"${AWS::Region}\",\"title\":\"CPU Utilization\",\"period\":300,\"yAxis\":{\"left\":{\"min\":0,\"max\":100}}}},{\"type\":\"metric\",\"properties\":{\"metrics\":[[\"AWS/ECS\",\"MemoryUtilization\",{\"stat\":\"Average\",\"label\":\"Memory Utilization\"}]],\"region\":\"${AWS::Region}\",\"title\":\"Memory Utilization\",\"period\":300,\"yAxis\":{\"left\":{\"min\":0,\"max\":100}}}},{\"type\":\"metric\",\"properties\":{\"metrics\":[[\"FinanceApp/Production\",\"RequestCount\",{\"stat\":\"Sum\",\"label\":\"Request Count\"}]],\"region\":\"${AWS::Region}\",\"title\":\"Request Count\",\"period\":300}},{\"type\":\"metric\",\"properties\":{\"metrics\":[[\"FinanceApp/Production\",\"ErrorRate\",{\"stat\":\"Average\",\"label\":\"Error Rate\"}]],\"region\":\"${AWS::Region}\",\"title\":\"Error Rate\",\"period\":300,\"yAxis\":{\"left\":{\"min\":0}}}}]}",
            {}
          ]
        }
      }
    },
    "SyntheticsCanaryRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "FinanceAppSyntheticsRole-${environmentSuffix}"
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
          "arn:aws:iam::aws:policy/CloudWatchSyntheticsFullAccess"
        ],
        "Policies": [
          {
            "PolicyName": "SyntheticsCanaryPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:PutObject",
                    "s3:GetBucketLocation"
                  ],
                  "Resource": [
                    {
                      "Fn::GetAtt": [
                        "SyntheticsResultsBucket",
                        "Arn"
                      ]
                    },
                    {
                      "Fn::Sub": "${SyntheticsResultsBucket.Arn}/*"
                    }
                  ]
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents"
                  ],
                  "Resource": [
                    {
                      "Fn::Sub": "arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/cwsyn-*"
                    }
                  ]
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "cloudwatch:PutMetricData"
                  ],
                  "Resource": "*",
                  "Condition": {
                    "StringEquals": {
                      "cloudwatch:namespace": "CloudWatchSynthetics"
                    }
                  }
                }
              ]
            }
          }
        ],
        "Tags": [
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "Team",
            "Value": "Platform"
          }
        ]
      }
    },
    "SyntheticsResultsBucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "financeapp-synthetics-results-${environmentSuffix}-${AWS::AccountId}"
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
        "LifecycleConfiguration": {
          "Rules": [
            {
              "Id": "DeleteOldResults",
              "Status": "Enabled",
              "ExpirationInDays": 30
            }
          ]
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "Team",
            "Value": "Platform"
          }
        ]
      }
    },
    "HealthCheckCanary": {
      "Type": "AWS::Synthetics::Canary",
      "Properties": {
        "Name": {
          "Fn::Sub": "financeapp-healthcheck-${environmentSuffix}"
        },
        "ExecutionRoleArn": {
          "Fn::GetAtt": [
            "SyntheticsCanaryRole",
            "Arn"
          ]
        },
        "Code": {
          "Handler": "index.handler",
          "Script": {
            "Fn::Sub": [
              "const synthetics = require('Synthetics');\nconst log = require('SyntheticsLogger');\nconst https = require('https');\nconst http = require('http');\n\nconst apiCanaryBlueprint = async function () {\n    const url = '${HealthCheckEndpoint}';\n    \n    const requestOptions = {\n        hostname: new URL(url).hostname,\n        path: new URL(url).pathname,\n        method: 'GET',\n        port: new URL(url).protocol === 'https:' ? 443 : 80\n    };\n    \n    let stepConfig = {\n        includeRequestHeaders: true,\n        includeResponseHeaders: true,\n        includeRequestBody: true,\n        includeResponseBody: true\n    };\n\n    await synthetics.executeHttpStep('Verify health check endpoint', requestOptions, null, stepConfig);\n};\n\nexports.handler = async () => {\n    return await apiCanaryBlueprint();\n};",
              {
                "HealthCheckEndpoint": {
                  "Ref": "HealthCheckEndpoint"
                }
              }
            ]
          }
        },
        "ArtifactS3Location": {
          "Fn::Sub": "s3://${SyntheticsResultsBucket}/canary-results"
        },
        "RuntimeVersion": "syn-nodejs-puppeteer-9.0",
        "Schedule": {
          "Expression": "rate(5 minutes)",
          "DurationInSeconds": 0
        },
        "RunConfig": {
          "TimeoutInSeconds": 60,
          "MemoryInMB": 960,
          "ActiveTracing": true
        },
        "FailureRetentionPeriod": 31,
        "SuccessRetentionPeriod": 31,
        "StartCanaryAfterCreation": true,
        "Tags": [
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "Team",
            "Value": "Platform"
          }
        ]
      },
      "DependsOn": [
        "SyntheticsResultsBucket",
        "SyntheticsCanaryRole"
      ]
    }
  },
  "Outputs": {
    "ApplicationLogGroupName": {
      "Description": "Application log group name",
      "Value": {
        "Ref": "ApplicationLogGroup"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-ApplicationLogGroup"
        }
      }
    },
    "ServiceLogGroupName": {
      "Description": "Service log group name",
      "Value": {
        "Ref": "ServiceLogGroup"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-ServiceLogGroup"
        }
      }
    },
    "XRayGroupName": {
      "Description": "X-Ray group name",
      "Value": {
        "Ref": "XRayGroup"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-XRayGroup"
        }
      }
    },
    "AlarmTopicArn": {
      "Description": "SNS topic ARN for alarm notifications",
      "Value": {
        "Ref": "AlarmNotificationTopic"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-AlarmTopic"
        }
      }
    },
    "DashboardName": {
      "Description": "CloudWatch dashboard name",
      "Value": {
        "Ref": "ObservabilityDashboard"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-Dashboard"
        }
      }
    },
    "CanaryName": {
      "Description": "Synthetics canary name",
      "Value": {
        "Ref": "HealthCheckCanary"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-Canary"
        }
      }
    },
    "SyntheticsResultsBucketName": {
      "Description": "S3 bucket for Synthetics results",
      "Value": {
        "Ref": "SyntheticsResultsBucket"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-SyntheticsBucket"
        }
      }
    }
  }
}
```

## File: lib/README.md

```markdown
# ECS Observability Infrastructure

Comprehensive monitoring and observability infrastructure for ECS-based microservices using CloudFormation.

## Architecture

This CloudFormation stack deploys:

1. **CloudWatch Logs** - Centralized logging with 90-day retention
   - Application logs: `/aws/ecs/financeapp-{environmentSuffix}`
   - Service logs: `/aws/ecs/services-{environmentSuffix}`
   - Container Insights: `/aws/ecs/containerinsights/{ClusterName}/performance-{environmentSuffix}`

2. **X-Ray Tracing** - Distributed tracing with 10% sampling rate
   - X-Ray Group: `FinanceApp-{environmentSuffix}`
   - Sampling Rule: 0.1 fixed rate (10% of requests)

3. **Custom Metrics** - Application metrics in namespace `FinanceApp/Production`

4. **CloudWatch Alarms** - 5 metric alarms plus 1 composite alarm
   - CPU Utilization > 80%
   - Memory Utilization > 85%
   - Error Rate > 5%
   - Latency > 1000ms
   - Availability < 99.9%
   - Composite: CPU > 80% AND Memory > 85%

5. **SNS Notifications** - Email alerts for all alarms

6. **Parameter Store** - Secure threshold storage
   - CPU threshold
   - Memory threshold
   - Error rate threshold
   - Latency threshold
   - Availability threshold

7. **CloudWatch Dashboard** - Visual monitoring with 4 widgets
   - CPU Utilization
   - Memory Utilization
   - Request Count
   - Error Rate

8. **CloudWatch Synthetics** - Endpoint monitoring
   - Health check canary running every 5 minutes
   - Results stored in S3 bucket

## Deployment

### Prerequisites

- AWS CLI configured with appropriate credentials
- Target ECS cluster already deployed
- Valid email address for alarm notifications
- Health check endpoint URL

### Deploy the Stack

```bash
aws cloudformation create-stack \
  --stack-name financeapp-observability \
  --template-body file://lib/TapStack.json \
  --parameters \
    ParameterKey=environmentSuffix,ParameterValue=prod \
    ParameterKey=NotificationEmail,ParameterValue=platform-team@example.com \
    ParameterKey=HealthCheckEndpoint,ParameterValue=https://api.example.com/health \
    ParameterKey=ECSClusterName,ParameterValue=finance-app-cluster \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

### Update the Stack

```bash
aws cloudformation update-stack \
  --stack-name financeapp-observability \
  --template-body file://lib/TapStack.json \
  --parameters \
    ParameterKey=environmentSuffix,UsePreviousValue=true \
    ParameterKey=NotificationEmail,UsePreviousValue=true \
    ParameterKey=HealthCheckEndpoint,UsePreviousValue=true \
    ParameterKey=ECSClusterName,UsePreviousValue=true \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

### Delete the Stack

```bash
# First, empty the Synthetics results bucket
aws s3 rm s3://financeapp-synthetics-results-prod-{AccountId} --recursive

# Then delete the stack
aws cloudformation delete-stack \
  --stack-name financeapp-observability \
  --region us-east-1
```

## Configuration

### Parameters

- **environmentSuffix**: Unique suffix for resource names (e.g., "prod", "staging")
- **NotificationEmail**: Email address for alarm notifications (must confirm subscription)
- **HealthCheckEndpoint**: URL to monitor with Synthetics canary
- **ECSClusterName**: Name of the ECS cluster to monitor

### Alarm Thresholds

Thresholds are stored in Parameter Store as SecureString parameters:

```bash
# View thresholds
aws ssm get-parameter --name /financeapp/prod/alarms/cpu-threshold --with-decryption
aws ssm get-parameter --name /financeapp/prod/alarms/memory-threshold --with-decryption
aws ssm get-parameter --name /financeapp/prod/alarms/error-rate-threshold --with-decryption
aws ssm get-parameter --name /financeapp/prod/alarms/latency-threshold --with-decryption
aws ssm get-parameter --name /financeapp/prod/alarms/availability-threshold --with-decryption

# Update thresholds
aws ssm put-parameter --name /financeapp/prod/alarms/cpu-threshold --value "85" --type SecureString --overwrite
```

## Monitoring

### View Dashboard

Navigate to CloudWatch Console → Dashboards → `FinanceApp-Observability-{environmentSuffix}`

### View Logs

```bash
# Application logs
aws logs tail /aws/ecs/financeapp-prod --follow

# Service logs
aws logs tail /aws/ecs/services-prod --follow
```

### View X-Ray Traces

Navigate to X-Ray Console → Service Map → `FinanceApp-{environmentSuffix}`

### View Canary Results

Navigate to CloudWatch Console → Synthetics → Canaries → `financeapp-healthcheck-{environmentSuffix}`

## Custom Metrics

Applications can publish custom metrics to the `FinanceApp/Production` namespace:

```python
import boto3

cloudwatch = boto3.client('cloudwatch')

cloudwatch.put_metric_data(
    Namespace='FinanceApp/Production',
    MetricData=[
        {
            'MetricName': 'ErrorRate',
            'Value': 2.5,
            'Unit': 'Percent'
        },
        {
            'MetricName': 'Latency',
            'Value': 450,
            'Unit': 'Milliseconds'
        },
        {
            'MetricName': 'RequestCount',
            'Value': 1,
            'Unit': 'Count'
        }
    ]
)
```

## Compliance

- **Log Retention**: All log groups configured with 90-day retention per financial regulations
- **Encryption**: S3 bucket uses AES256 encryption
- **Access Control**: S3 bucket blocks all public access
- **Tagging**: All resources tagged with Environment=Production and Team=Platform

## Cost Optimization

- Log retention limited to 90 days (not indefinite)
- Synthetics canary runs every 5 minutes (not continuous)
- Canary results retained for 31 days
- S3 lifecycle policy deletes old Synthetics results after 30 days
- X-Ray sampling at 10% to reduce trace storage costs

## Troubleshooting

### Canary Failures

1. Check canary execution logs:
```bash
aws logs tail /aws/lambda/cwsyn-financeapp-healthcheck-prod --follow
```

2. Verify endpoint accessibility:
```bash
curl -I https://api.example.com/health
```

3. Check IAM role permissions for canary

### Alarm Not Triggering

1. Verify metrics are being published:
```bash
aws cloudwatch list-metrics --namespace "FinanceApp/Production"
```

2. Check alarm configuration:
```bash
aws cloudwatch describe-alarms --alarm-names FinanceApp-HighCPU-prod
```

3. Confirm SNS email subscription is confirmed

### Missing Logs

1. Verify log group exists:
```bash
aws logs describe-log-groups --log-group-name-prefix /aws/ecs/financeapp
```

2. Check ECS task IAM role has CloudWatch Logs permissions
3. Verify ECS task definition log configuration

## Security

- All Parameter Store values use SecureString encryption
- S3 bucket blocks public access
- IAM roles follow least privilege principle
- CloudWatch Logs encrypted at rest
- X-Ray data encrypted in transit and at rest

## Support

For issues or questions:
- Platform Team: platform-team@example.com
- CloudWatch Documentation: https://docs.aws.amazon.com/cloudwatch/
- X-Ray Documentation: https://docs.aws.amazon.com/xray/
- Synthetics Documentation: https://docs.aws.amazon.com/synthetics/
```

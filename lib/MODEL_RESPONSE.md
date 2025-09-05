```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Security‑focused AWS infrastructure as code",
  "Resources": {
    "ProjectTag": {
      "Type": "AWS::SSM::Parameter",
      "Properties": {
        "Name": "/project/tag",
        "Type": "String",
        "Value": "env‑security"
      }
    },
    "WAFWebACL": {
      "Type": "AWS::WAFv2::WebACL",
      "Properties": {
        "Scope": "REGIONAL",
        "Name": "ApiGatewayWebACL",
        "DefaultAction": { "Allow": {} },
        "VisibilityConfig": {
          "SampledRequestsEnabled": true,
          "CloudWatchMetricsEnabled": true,
          "MetricName": "ApiGatewayWebACL"
        },
        "Rules": [
          {
            "Name": "AWSBasicRuleSet",
            "Priority": 0,
            "Statement": {
              "ManagedRuleGroupStatement": {
                "VendorName": "AWS",
                "Name": "AWSManagedRulesCommonRuleSet"
              }
            },
            "OverrideAction": { "None": {} },
            "VisibilityConfig": {
              "SampledRequestsEnabled": true,
              "CloudWatchMetricsEnabled": true,
              "MetricName": "CommonRuleSet"
            }
          }
        ],
        "Tags": [
          { "Key": "project", "Value": "env‑security" }
        ]
      }
    },
    "ApiGateway": {
      "Type": "AWS::ApiGateway::RestApi",
      "Properties": {
        "Name": "ProtectedApi",
        "EndpointConfiguration": { "Types": ["REGIONAL"] },
        "Tags": [
          { "Key": "project", "Value": "env‑security" }
        ]
      }
    },
    "WAFAssociation": {
      "Type": "AWS::WAFv2::WebACLAssociation",
      "Properties": {
        "ResourceArn": { "Fn::Sub": "arn:aws:apigateway:${AWS::Region}::/restapis/${ApiGateway}/stages/prod" },
        "WebACLArn": { "Ref": "WAFWebACL" }
      }
    },
    "CloudFrontRealtimeLogRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "AssumeRolePolicyDocument": {
          "Version": "2012‑10‑17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": { "Service": "cloudfront.amazonaws.com" },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "ManagedPolicyArns": [],
        "Policies": [
          {
            "PolicyName": "KinesisPutRecords",
            "PolicyDocument": {
              "Version": "2012‑10‑17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": ["kinesis:PutRecord", "kinesis:PutRecords"],
                  "Resource": "*"
                }
              ]
            }
          }
        ],
        "Tags": [
          { "Key": "project", "Value": "env‑security" }
        ]
      }
    },
    "RealtimeLogStream": {
      "Type": "AWS::Kinesis::Stream",
      "Properties": {
        "ShardCount": 1,
        "Tags": [
          { "Key": "project", "Value": "env‑security" }
        ]
      }
    },
    "RealtimeLogConfig": {
      "Type": "AWS::CloudFront::RealtimeLogConfig",
      "Properties": {
        "Name": "CFRealtimeLogConfig",
        "SamplingRate": 100,
        "Fields": ["timestamp", "c-ip", "cs-method", "cs-uri‑stem", "sc-status"],
        "EndPoints": [
          {
            "StreamType": "Kinesis",
            "KinesisStreamConfig": {
              "RoleArn": { "Fn::GetAtt": ["CloudFrontRealtimeLogRole", "Arn"] },
              "StreamArn": { "Fn::GetAtt": ["RealtimeLogStream", "Arn"] }
            }
          }
        ]
      }
    },
    "Route53DNSSEC": {
      "Type": "AWS::Route53::DNSSEC",
      "Properties": {
        "HostedZoneId": "YOUR_HOSTED_ZONE_ID"
      }
    },
    "LogBucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": { "Fn::Sub": "${AWS::StackName}-vpcflow-logs" },
        "BucketEncryption": {
          "ServerSideEncryptionConfiguration": [
            {
              "ServerSideEncryptionByDefault": {
                "SSEAlgorithm": "AES256"
              }
            }
          ]
        },
        "Tags": [
          { "Key": "project", "Value": "env‑security" }
        ]
      }
    },
    "VPCFlowLogs": {
      "Type": "AWS::EC2::FlowLog",
      "Properties": {
        "ResourceType": "VPC",
        "ResourceId": "YOUR_VPC_ID",
        "TrafficType": "ALL",
        "LogDestinationType": "s3",
        "LogDestination": { "Fn::GetAtt": ["LogBucket", "Arn"] },
        "DeliverLogsPermissionArn": "arn:aws:iam::aws:policy/service-role/AmazonEC2FlowLogsRole"
      }
    },
    "SecuritySNS": {
      "Type": "AWS::SNS::Topic",
      "Properties": {
        "TopicName": "SecurityAlertsTopic",
        "Tags": [
          { "Key": "project", "Value": "env‑security" }
        ]
      }
    },
    "LambdaExecRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": "LambdaExecLeastPrivilege",
        "AssumeRolePolicyDocument": {
          "Version": "2012‑10‑17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": { "Service": "lambda.amazonaws.com" },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "Policies": [
          {
            "PolicyName": "LambdaBasicExecution",
            "PolicyDocument": {
              "Version": "2012‑10‑17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"],
                  "Resource": "*"
                }
              ]
            }
          }
        ],
        "Tags": [
          { "Key": "project", "Value": "env‑security" }
        ]
      }
    },
    "MonitoredLambda": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "FunctionName": "SecureMonitoredFunction",
        "Handler": "index.handler",
        "Role": { "Fn::GetAtt": ["LambdaExecRole", "Arn"] },
        "Runtime": "python3.9",
        "Code": {
          "ZipFile": "def handler(event, context):\n  return {'statusCode':200,'body':'OK'}"
        },
        "Tags": [
          { "Key": "project", "Value": "env‑security" }
        ]
      }
    },
    "LambdaInvocationsAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": "LambdaInvocationsTooHigh",
        "MetricName": "Invocations",
        "Namespace": "AWS/Lambda",
        "Statistic": "Sum",
        "Period": 300,
        "EvaluationPeriods": 1,
        "Threshold": 1000,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "FunctionName",
            "Value": { "Ref": "MonitoredLambda" }
          }
        ],
        "AlarmActions": [{ "Ref": "SecuritySNS" }],
        "Tags": [
          { "Key": "project", "Value": "env‑security" }
        ]
      }
    },
    "LambdaErrorsAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": "LambdaErrorsDetected",
        "MetricName": "Errors",
        "Namespace": "AWS/Lambda",
        "Statistic": "Sum",
        "Period": 300,
        "EvaluationPeriods": 1,
        "Threshold": 1,
        "ComparisonOperator": "GreaterThanOrEqualToThreshold",
        "Dimensions": [
          {
            "Name": "FunctionName",
            "Value": { "Ref": "MonitoredLambda" }
          }
        ],
        "AlarmActions": [{ "Ref": "SecuritySNS" }],
        "Tags": [
          { "Key": "project", "Value": "env‑security" }
        ]
      }
    },
    "S3ReadOnlyPolicy": {
      "Type": "AWS::IAM::Policy",
      "Properties": {
        "PolicyName": "S3ListGetObjectOnly",
        "PolicyDocument": {
          "Version": "2012‑10‑17",
          "Statement": [
            {
              "Effect": "Allow",
              "Action": ["s3:ListBucket", "s3:GetObject"],
              "Resource": "*"
            }
          ]
        },
        "Roles": [{ "Ref": "LambdaExecRole" }],
        "Tags": [
          { "Key": "project", "Value": "env‑security" }
        ]
      }
    }
  },
  "Outputs": {
    "WAFWebACLArn": {
      "Description": "Web ACL ARN",
      "Value": { "Ref": "WAFWebACL" }
    },
    "RealtimeLogStreamArn": {
      "Description": "Kinesis Stream ARN for real‑time logs",
      "Value": { "Fn::GetAtt": ["RealtimeLogStream", "Arn"] }
    },
    "SecurityTopicArn": {
      "Description": "SNS Topic for security alerts",
      "Value": { "Ref": "SecuritySNS" }
    },
    "LambdaRoleArn": {
      "Description": "Execution Role ARN for Lambda",
      "Value": { "Fn::GetAtt": ["LambdaExecRole", "Arn"] }
    }
  }
}

```
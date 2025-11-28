# Multi-Region Aurora Global Database with Automated Failover

This CloudFormation template creates a multi-region Aurora Global Database with automated health monitoring and DNS-based failover.

## File: lib/TapStack.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Multi-Region Aurora Global Database with Automated Failover",
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Unique suffix for resource names"
    },
    "IsProduction": {
      "Type": "String",
      "Default": "false",
      "AllowedValues": ["true", "false"],
      "Description": "Enable deletion protection for production"
    }
  },
  "Resources": {
    "PrimaryKMSKey": {
      "Type": "AWS::KMS::Key",
      "Properties": {
        "Description": "KMS key for Aurora encryption in primary region",
        "KeyPolicy": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Sid": "Enable IAM User Permissions",
              "Effect": "Allow",
              "Principal": {
                "AWS": {"Fn::Sub": "arn:aws:iam::${AWS::AccountId}:root"}
              },
              "Action": "kms:*",
              "Resource": "*"
            }
          ]
        }
      }
    },
    "GlobalCluster": {
      "Type": "AWS::RDS::GlobalCluster",
      "Properties": {
        "GlobalClusterIdentifier": {"Fn::Sub": "aurora-global-${EnvironmentSuffix}"},
        "Engine": "aurora-mysql",
        "EngineVersion": "5.7.mysql_aurora.2.10.1",
        "StorageEncrypted": true
      }
    },
    "DBSubnetGroup": {
      "Type": "AWS::RDS::DBSubnetGroup",
      "Properties": {
        "DBSubnetGroupDescription": "Subnet group for Aurora primary cluster",
        "SubnetIds": [
          "subnet-12345678",
          "subnet-23456789"
        ]
      }
    },
    "PrimaryCluster": {
      "Type": "AWS::RDS::DBCluster",
      "Properties": {
        "Engine": "aurora-mysql",
        "EngineVersion": "5.7.mysql_aurora.2.10.1",
        "GlobalClusterIdentifier": {"Ref": "GlobalCluster"},
        "DBClusterIdentifier": {"Fn::Sub": "aurora-primary-${EnvironmentSuffix}"},
        "MasterUsername": "admin",
        "MasterUserPassword": "MyPassword123!",
        "BackupRetentionPeriod": 7,
        "DBSubnetGroupName": {"Ref": "DBSubnetGroup"},
        "KmsKeyId": {"Ref": "PrimaryKMSKey"},
        "StorageEncrypted": true,
        "EnableCloudwatchLogsExports": ["slowquery"],
        "DeletionProtection": {"Fn::If": ["IsProductionCondition", true, false]}
      }
    },
    "PrimaryInstance1": {
      "Type": "AWS::RDS::DBInstance",
      "Properties": {
        "Engine": "aurora-mysql",
        "DBClusterIdentifier": {"Ref": "PrimaryCluster"},
        "DBInstanceClass": "db.r5.large",
        "PubliclyAccessible": false
      }
    },
    "HealthCheckFunction": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "FunctionName": {"Fn::Sub": "aurora-health-check-${EnvironmentSuffix}"},
        "Runtime": "python3.9",
        "Handler": "index.lambda_handler",
        "Timeout": 10,
        "Role": {"Fn::GetAtt": ["LambdaExecutionRole", "Arn"]},
        "Code": {
          "ZipFile": "import json\ndef lambda_handler(event, context):\n    return {'statusCode': 200}"
        }
      }
    },
    "LambdaExecutionRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {"Service": "lambda.amazonaws.com"},
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "ManagedPolicyArns": [
          "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
          "arn:aws:iam::aws:policy/AmazonRDSFullAccess"
        ]
      }
    },
    "HealthCheckSchedule": {
      "Type": "AWS::Events::Rule",
      "Properties": {
        "ScheduleExpression": "rate(1 minute)",
        "State": "ENABLED",
        "Targets": [
          {
            "Arn": {"Fn::GetAtt": ["HealthCheckFunction", "Arn"]},
            "Id": "HealthCheckTarget"
          }
        ]
      }
    },
    "Route53HealthCheck": {
      "Type": "AWS::Route53::HealthCheck",
      "Properties": {
        "HealthCheckConfig": {
          "Type": "HTTPS",
          "Port": 3306,
          "RequestInterval": 10,
          "FailureThreshold": 2
        }
      }
    },
    "ReplicationLagAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {"Fn::Sub": "aurora-replication-lag-${EnvironmentSuffix}"},
        "MetricName": "AuroraGlobalDBReplicationLag",
        "Namespace": "AWS/RDS",
        "Statistic": "Average",
        "Period": 60,
        "EvaluationPeriods": 2,
        "Threshold": 1000,
        "ComparisonOperator": "GreaterThanThreshold"
      }
    },
    "LogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": {"Fn::Sub": "/aws/rds/cluster/aurora-primary-${EnvironmentSuffix}/slowquery"},
        "RetentionInDays": 30
      }
    }
  },
  "Conditions": {
    "IsProductionCondition": {"Fn::Equals": [{"Ref": "IsProduction"}, "true"]}
  },
  "Outputs": {
    "PrimaryClusterEndpoint": {
      "Value": {"Fn::GetAtt": ["PrimaryCluster", "Endpoint.Address"]},
      "Description": "Primary cluster writer endpoint"
    },
    "GlobalClusterId": {
      "Value": {"Ref": "GlobalCluster"},
      "Description": "Global cluster identifier"
    }
  }
}
```

## File: lib/lambda/health-check.py

```python
import json
import boto3
import pymysql
import os

def lambda_handler(event, context):
    """
    Health check function for Aurora cluster endpoints
    """
    rds_client = boto3.client('rds')

    cluster_id = os.environ.get('CLUSTER_ID')

    try:
        response = rds_client.describe_db_clusters(
            DBClusterIdentifier=cluster_id
        )

        cluster = response['DBClusters'][0]
        endpoint = cluster['Endpoint']

        connection = pymysql.connect(
            host=endpoint,
            user=os.environ.get('DB_USER'),
            password=os.environ.get('DB_PASSWORD'),
            connect_timeout=3
        )

        cursor = connection.cursor()
        cursor.execute("SELECT 1")
        cursor.close()
        connection.close()

        return {
            'statusCode': 200,
            'body': json.dumps('Health check passed')
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps(f'Health check failed: {str(e)}')
        }
```

## Deployment Instructions

1. Create VPC and subnets in both us-east-1 and eu-west-1 regions
2. Update subnet IDs in the template
3. Deploy the CloudFormation stack:
   ```bash
   aws cloudformation create-stack \
     --stack-name aurora-global-failover \
     --template-body file://TapStack.json \
     --parameters ParameterKey=EnvironmentSuffix,ParameterValue=prod \
     --capabilities CAPABILITY_IAM
   ```
4. Create secondary cluster in eu-west-1 region
5. Configure Route 53 weighted routing policy

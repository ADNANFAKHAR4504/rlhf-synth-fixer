# CloudFormation Template for Optimized Financial Transaction Processing

This response provides a complete CloudFormation JSON template that addresses all the requirements for optimizing the financial transaction processing system.

## File: lib/template.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Optimized CloudFormation template for financial transaction processing with RDS Aurora ServerlessV2 and Lambda",
  "Parameters": {
    "EnvironmentName": {
      "Type": "String",
      "Default": "dev",
      "AllowedValues": ["dev", "staging", "prod"],
      "Description": "Environment name for resource tagging and conditional logic"
    },
    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Unique suffix for resource naming to enable multiple deployments",
      "MinLength": 1,
      "MaxLength": 20,
      "AllowedPattern": "[a-zA-Z0-9-]*",
      "ConstraintDescription": "Must contain only alphanumeric characters and hyphens"
    },
    "DBUsername": {
      "Type": "String",
      "Default": "admin",
      "MinLength": 1,
      "MaxLength": 16,
      "AllowedPattern": "[a-zA-Z][a-zA-Z0-9]*",
      "ConstraintDescription": "Must begin with a letter and contain only alphanumeric characters"
    },
    "DBPassword": {
      "Type": "String",
      "NoEcho": true,
      "MinLength": 8,
      "MaxLength": 41,
      "Description": "Database master password (8-41 characters)"
    },
    "VPCId": {
      "Type": "AWS::EC2::VPC::Id",
      "Description": "Existing VPC ID where resources will be deployed"
    },
    "PrivateSubnetIds": {
      "Type": "List<AWS::EC2::Subnet::Id>",
      "Description": "List of private subnet IDs for RDS and Lambda deployment"
    }
  },
  "Conditions": {
    "IsProduction": {
      "Fn::Equals": [
        { "Ref": "EnvironmentName" },
        "prod"
      ]
    }
  },
  "Resources": {
    "DBSubnetGroup": {
      "Type": "AWS::RDS::DBSubnetGroup",
      "Properties": {
        "DBSubnetGroupName": {
          "Fn::Sub": "db-subnet-group-${EnvironmentSuffix}"
        },
        "DBSubnetGroupDescription": "Subnet group for Aurora ServerlessV2 cluster",
        "SubnetIds": {
          "Ref": "PrivateSubnetIds"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "db-subnet-group-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentName"
            }
          }
        ]
      }
    },
    "DBSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupName": {
          "Fn::Sub": "db-security-group-${EnvironmentSuffix}"
        },
        "GroupDescription": "Security group for RDS Aurora cluster",
        "VpcId": {
          "Ref": "VPCId"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 3306,
            "ToPort": 3306,
            "SourceSecurityGroupId": {
              "Ref": "LambdaSecurityGroup"
            },
            "Description": "Allow MySQL access from Lambda functions"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "db-security-group-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentName"
            }
          }
        ]
      }
    },
    "LambdaSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupName": {
          "Fn::Sub": "lambda-security-group-${EnvironmentSuffix}"
        },
        "GroupDescription": "Security group for Lambda functions",
        "VpcId": {
          "Ref": "VPCId"
        },
        "SecurityGroupEgress": [
          {
            "IpProtocol": "-1",
            "CidrIp": "0.0.0.0/0",
            "Description": "Allow all outbound traffic"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "lambda-security-group-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentName"
            }
          }
        ]
      }
    },
    "AuroraDBCluster": {
      "Type": "AWS::RDS::DBCluster",
      "DeletionPolicy": "Retain",
      "UpdateReplacePolicy": "Retain",
      "Properties": {
        "Engine": "aurora-mysql",
        "EngineVersion": "8.0.mysql_aurora.3.04.0",
        "DatabaseName": "transactions",
        "MasterUsername": {
          "Ref": "DBUsername"
        },
        "MasterUserPassword": {
          "Ref": "DBPassword"
        },
        "DBSubnetGroupName": {
          "Ref": "DBSubnetGroup"
        },
        "VpcSecurityGroupIds": [
          {
            "Ref": "DBSecurityGroup"
          }
        ],
        "BackupRetentionPeriod": 7,
        "PreferredBackupWindow": "03:00-04:00",
        "PreferredMaintenanceWindow": "mon:04:00-mon:05:00",
        "EnableCloudwatchLogsExports": ["error", "slowquery"],
        "ServerlessV2ScalingConfiguration": {
          "MinCapacity": 0.5,
          "MaxCapacity": 1.0
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "aurora-cluster-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentName"
            }
          }
        ]
      }
    },
    "AuroraDBInstance": {
      "Type": "AWS::RDS::DBInstance",
      "Properties": {
        "Engine": "aurora-mysql",
        "DBClusterIdentifier": {
          "Ref": "AuroraDBCluster"
        },
        "DBInstanceClass": "db.serverless",
        "DBInstanceIdentifier": {
          "Fn::Sub": "aurora-instance-${EnvironmentSuffix}"
        },
        "PubliclyAccessible": false,
        "EnablePerformanceInsights": {
          "Fn::If": [
            "IsProduction",
            true,
            false
          ]
        },
        "PerformanceInsightsRetentionPeriod": {
          "Fn::If": [
            "IsProduction",
            7,
            {
              "Ref": "AWS::NoValue"
            }
          ]
        },
        "MonitoringInterval": {
          "Fn::If": [
            "IsProduction",
            60,
            0
          ]
        },
        "MonitoringRoleArn": {
          "Fn::If": [
            "IsProduction",
            {
              "Fn::GetAtt": ["RDSMonitoringRole", "Arn"]
            },
            {
              "Ref": "AWS::NoValue"
            }
          ]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "aurora-instance-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentName"
            }
          }
        ]
      }
    },
    "RDSMonitoringRole": {
      "Type": "AWS::IAM::Role",
      "Condition": "IsProduction",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "${AWS::StackName}-rds-monitoring-role"
        },
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "monitoring.rds.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "ManagedPolicyArns": [
          "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "${AWS::StackName}-rds-monitoring-role"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentName"
            }
          }
        ]
      }
    },
    "TransactionProcessorRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "${AWS::StackName}-transaction-processor-role"
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
          "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
        ],
        "Policies": [
          {
            "PolicyName": "TransactionProcessorPolicy",
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
                    "Fn::Sub": "arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/transaction-processor-${EnvironmentSuffix}:*"
                  }
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "rds:DescribeDBClusters",
                    "rds:DescribeDBInstances"
                  ],
                  "Resource": "*"
                }
              ]
            }
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "${AWS::StackName}-transaction-processor-role"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentName"
            }
          }
        ]
      }
    },
    "TransactionProcessorFunction": {
      "Type": "AWS::Lambda::Function",
      "DeletionPolicy": "Delete",
      "DependsOn": [
        "AuroraDBCluster",
        "AuroraDBInstance"
      ],
      "Properties": {
        "FunctionName": {
          "Fn::Sub": "transaction-processor-${EnvironmentSuffix}"
        },
        "Runtime": "python3.11",
        "Handler": "index.lambda_handler",
        "Role": {
          "Fn::GetAtt": ["TransactionProcessorRole", "Arn"]
        },
        "Code": {
          "ZipFile": {
            "Fn::Join": [
              "\n",
              [
                "import json",
                "import os",
                "",
                "def lambda_handler(event, context):",
                "    # Placeholder for transaction processing logic",
                "    db_endpoint = os.environ.get('DB_ENDPOINT', '')",
                "    db_name = os.environ.get('DB_NAME', '')",
                "    ",
                "    return {",
                "        'statusCode': 200,",
                "        'body': json.dumps({",
                "            'message': 'Transaction processor initialized',",
                "            'database': db_name,",
                "            'endpoint': db_endpoint",
                "        })",
                "    }"
              ]
            ]
          }
        },
        "MemorySize": 3008,
        "Timeout": 300,
        "ReservedConcurrentExecutions": 100,
        "Environment": {
          "Variables": {
            "DB_ENDPOINT": {
              "Fn::GetAtt": ["AuroraDBCluster", "Endpoint.Address"]
            },
            "DB_NAME": "transactions",
            "DB_PORT": "3306",
            "ENVIRONMENT": {
              "Ref": "EnvironmentName"
            }
          }
        },
        "VpcConfig": {
          "SecurityGroupIds": [
            {
              "Ref": "LambdaSecurityGroup"
            }
          ],
          "SubnetIds": {
            "Ref": "PrivateSubnetIds"
          }
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "transaction-processor-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentName"
            }
          }
        ]
      }
    },
    "TransactionProcessorLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/aws/lambda/transaction-processor-${EnvironmentSuffix}"
        },
        "RetentionInDays": {
          "Fn::If": [
            "IsProduction",
            30,
            7
          ]
        }
      }
    },
    "DBSecret": {
      "Type": "AWS::SecretsManager::Secret",
      "Properties": {
        "Name": {
          "Fn::Sub": "rds-credentials-${EnvironmentSuffix}"
        },
        "Description": "RDS Aurora database credentials",
        "SecretString": {
          "Fn::Sub": "{\"username\":\"${DBUsername}\",\"password\":\"${DBPassword}\",\"engine\":\"mysql\",\"host\":\"${AuroraDBCluster.Endpoint.Address}\",\"port\":3306,\"dbname\":\"transactions\"}"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "rds-credentials-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentName"
            }
          }
        ]
      }
    },
    "NotificationTopic": {
      "Type": "AWS::SNS::Topic",
      "Properties": {
        "TopicName": {
          "Fn::Sub": "deployment-notifications-${EnvironmentSuffix}"
        },
        "DisplayName": "Deployment Notifications",
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "deployment-notifications-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentName"
            }
          }
        ]
      }
    },
    "CloudWatchDashboard": {
      "Type": "AWS::CloudWatch::Dashboard",
      "Condition": "IsProduction",
      "Properties": {
        "DashboardName": {
          "Fn::Sub": "transaction-processing-${EnvironmentSuffix}"
        },
        "DashboardBody": {
          "Fn::Sub": "{\"widgets\":[{\"type\":\"metric\",\"properties\":{\"metrics\":[[\"AWS/Lambda\",\"Invocations\",{\"stat\":\"Sum\",\"label\":\"Lambda Invocations\"}],[\".\",\"Errors\",{\"stat\":\"Sum\",\"label\":\"Lambda Errors\"}],[\".\",\"Duration\",{\"stat\":\"Average\",\"label\":\"Avg Duration\"}],[\".\",\"ConcurrentExecutions\",{\"stat\":\"Maximum\",\"label\":\"Max Concurrent\"}]],\"view\":\"timeSeries\",\"region\":\"${AWS::Region}\",\"title\":\"Lambda Metrics\",\"period\":300}},{\"type\":\"metric\",\"properties\":{\"metrics\":[[\"AWS/RDS\",\"ServerlessDatabaseCapacity\",{\"stat\":\"Average\",\"label\":\"RDS Capacity (ACU)\"}],[\".\",\"DatabaseConnections\",{\"stat\":\"Average\",\"label\":\"DB Connections\"}]],\"view\":\"timeSeries\",\"region\":\"${AWS::Region}\",\"title\":\"RDS Metrics\",\"period\":300}}]}"
        }
      }
    }
  },
  "Outputs": {
    "RDSClusterEndpoint": {
      "Description": "Aurora cluster endpoint for application connections",
      "Value": {
        "Fn::GetAtt": ["AuroraDBCluster", "Endpoint.Address"]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-RDSClusterEndpoint"
        }
      }
    },
    "RDSClusterReadEndpoint": {
      "Description": "Aurora cluster read endpoint for read-only connections",
      "Value": {
        "Fn::GetAtt": ["AuroraDBCluster", "ReadEndpoint.Address"]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-RDSClusterReadEndpoint"
        }
      }
    },
    "LambdaFunctionArn": {
      "Description": "ARN of the transaction processor Lambda function",
      "Value": {
        "Fn::GetAtt": ["TransactionProcessorFunction", "Arn"]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-LambdaFunctionArn"
        }
      }
    },
    "LambdaSecurityGroupId": {
      "Description": "Security group ID for Lambda functions",
      "Value": {
        "Ref": "LambdaSecurityGroup"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-LambdaSecurityGroupId"
        }
      }
    },
    "DBSecurityGroupId": {
      "Description": "Security group ID for RDS cluster",
      "Value": {
        "Ref": "DBSecurityGroup"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-DBSecurityGroupId"
        }
      }
    },
    "DBSecretArn": {
      "Description": "ARN of the Secrets Manager secret containing database credentials",
      "Value": {
        "Ref": "DBSecret"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-DBSecretArn"
        }
      }
    },
    "NotificationTopicArn": {
      "Description": "ARN of the SNS topic for deployment notifications",
      "Value": {
        "Ref": "NotificationTopic"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-NotificationTopicArn"
        }
      }
    }
  }
}
```

## File: lib/README.md

```markdown
# Financial Transaction Processing Infrastructure

This CloudFormation template deploys an optimized infrastructure stack for financial transaction processing using RDS Aurora MySQL ServerlessV2 and AWS Lambda.

## Architecture Overview

The template creates:

- **RDS Aurora MySQL ServerlessV2 Cluster**: Scalable database cluster with 0.5-1.0 ACU range
- **Lambda Function**: Transaction processor with 3GB memory and reserved concurrency of 100
- **VPC Integration**: Security groups for Lambda and RDS with proper ingress/egress rules
- **Secrets Manager**: Secure storage for database credentials
- **CloudWatch Dashboard**: Production monitoring (enabled for prod environment only)
- **SNS Topic**: Deployment notifications

## Key Features

### Deployment Optimization

- **Zero Circular Dependencies**: All resources use explicit DependsOn or Ref/GetAtt patterns
- **Fast Deployment**: Optimized for under 15-minute deployment time
- **Update Safety**: UpdateReplacePolicy set to Retain for stateful resources
- **Resource Control**: ReservedConcurrentExecutions prevents Lambda scaling issues

### Environment-Specific Behavior

- **Production**: Enhanced monitoring, Performance Insights, 30-day log retention, CloudWatch dashboard
- **Dev/Staging**: Basic monitoring, 7-day log retention, no dashboard

### Security

- VPC-isolated Lambda and RDS deployment
- Security groups with minimal required access
- Secrets Manager integration for credential management
- No public accessibility for database

## Prerequisites

- Existing VPC in us-east-1 region
- At least 2 private subnets in different availability zones
- VPC ID and subnet IDs available for parameters

## Parameters

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| EnvironmentName | String | Environment (dev/staging/prod) | dev |
| EnvironmentSuffix | String | Unique suffix for resource naming | Required |
| DBUsername | String | Database master username | admin |
| DBPassword | String | Database master password | Required |
| VPCId | VPC ID | Existing VPC for deployment | Required |
| PrivateSubnetIds | Subnet IDs | Private subnets for RDS and Lambda | Required |

## Deployment

### Using AWS CLI

```bash
aws cloudformation create-stack \
  --stack-name transaction-processing-stack \
  --template-body file://lib/template.json \
  --parameters \
    ParameterKey=EnvironmentName,ParameterValue=prod \
    ParameterKey=EnvironmentSuffix,ParameterValue=prod-v1 \
    ParameterKey=DBUsername,ParameterValue=admin \
    ParameterKey=DBPassword,ParameterValue=YourSecurePassword123! \
    ParameterKey=VPCId,ParameterValue=vpc-xxxxxxxxx \
    ParameterKey=PrivateSubnetIds,ParameterValue="subnet-xxxxxxxx\\,subnet-yyyyyyyy" \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

### Using AWS Console

1. Navigate to CloudFormation console in us-east-1 region
2. Click "Create stack" > "With new resources"
3. Upload `lib/template.json`
4. Fill in required parameters
5. Acknowledge IAM resource creation
6. Click "Create stack"

### Validation

Before deploying, validate the template:

```bash
aws cloudformation validate-template \
  --template-body file://lib/template.json \
  --region us-east-1
```

## Stack Outputs

| Output | Description | Exported As |
|--------|-------------|-------------|
| RDSClusterEndpoint | Aurora cluster write endpoint | ${StackName}-RDSClusterEndpoint |
| RDSClusterReadEndpoint | Aurora cluster read endpoint | ${StackName}-RDSClusterReadEndpoint |
| LambdaFunctionArn | Lambda function ARN | ${StackName}-LambdaFunctionArn |
| LambdaSecurityGroupId | Lambda security group ID | ${StackName}-LambdaSecurityGroupId |
| DBSecurityGroupId | RDS security group ID | ${StackName}-DBSecurityGroupId |
| DBSecretArn | Secrets Manager secret ARN | ${StackName}-DBSecretArn |
| NotificationTopicArn | SNS topic ARN | ${StackName}-NotificationTopicArn |

## Resource Dependencies

```
DBSubnetGroup
  ↓
AuroraDBCluster (DeletionPolicy: Retain, UpdateReplacePolicy: Retain)
  ↓
AuroraDBInstance
  ↓
TransactionProcessorFunction (DependsOn: AuroraDBCluster, AuroraDBInstance)
```

Security groups are created independently to avoid circular dependencies.

## Update Strategy

### Safe Updates

- RDS cluster uses DeletionPolicy: Retain and UpdateReplacePolicy: Retain
- Lambda uses DeletionPolicy: Delete for clean removal
- No circular dependencies allow stack updates without deletion

### Update Procedure

1. Test changes in dev environment first
2. Validate template before updating: `aws cloudformation validate-template`
3. Create change set: `aws cloudformation create-change-set`
4. Review changes in change set
5. Execute change set if changes are acceptable

## Monitoring

### CloudWatch Logs

- Lambda logs: `/aws/lambda/transaction-processor-{EnvironmentSuffix}`
- RDS logs: Error logs and slow query logs exported to CloudWatch

### CloudWatch Dashboard (Production Only)

Access at: CloudWatch > Dashboards > `transaction-processing-{EnvironmentSuffix}`

Metrics included:
- Lambda invocations, errors, duration, concurrent executions
- RDS capacity (ACU), database connections

### Performance Insights (Production Only)

- Enabled for RDS instance in production
- 7-day retention period
- Access via RDS console > Performance Insights

## Cost Optimization

- ServerlessV2 scaling: 0.5-1.0 ACU range minimizes idle costs
- Enhanced monitoring: Production only
- Log retention: 7 days (dev/staging), 30 days (prod)
- Reserved concurrency: Prevents runaway Lambda costs

## Troubleshooting

### Stack Creation Fails

1. Verify VPC and subnet IDs exist and are in us-east-1
2. Ensure subnets are in different availability zones
3. Check IAM permissions for CloudFormation
4. Validate password meets complexity requirements (8-41 characters)

### Lambda Cannot Connect to RDS

1. Verify security group rules allow traffic on port 3306
2. Check Lambda is deployed in same VPC as RDS
3. Verify RDS cluster is in available state
4. Check RDS endpoint in Lambda environment variables

### Deployment Takes Too Long

1. Verify using ServerlessV2 (not provisioned instances)
2. Check no unnecessary dependencies in template
3. Ensure VPC subnets have proper routing
4. Monitor stack events in CloudFormation console

## Cleanup

To delete the stack:

```bash
aws cloudformation delete-stack \
  --stack-name transaction-processing-stack \
  --region us-east-1
```

**Note**: RDS cluster will be retained due to DeletionPolicy: Retain. To delete it:

```bash
aws rds delete-db-cluster \
  --db-cluster-identifier aurora-cluster-{EnvironmentSuffix} \
  --skip-final-snapshot \
  --region us-east-1
```

## Security Considerations

- Change default database password immediately after deployment
- Restrict SNS topic subscriptions to authorized personnel
- Review and tighten security group rules based on actual traffic patterns
- Enable VPC Flow Logs for network traffic analysis
- Consider using AWS WAF if Lambda is exposed via API Gateway
- Rotate database credentials regularly using Secrets Manager rotation

## Support

For issues or questions:
1. Check CloudFormation stack events for error messages
2. Review Lambda CloudWatch logs
3. Check RDS cluster status and events
4. Validate all parameters are correct
5. Ensure IAM permissions are sufficient
```

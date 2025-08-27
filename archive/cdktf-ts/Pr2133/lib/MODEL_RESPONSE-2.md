I'll complete the response from where it was cut off:

```typescript
    // ===========================================
    // CloudWatch Alarms
    // ===========================================

    new CloudwatchMetricAlarm(this, "high-cpu-alarm", {
      alarmName: "high-cpu-utilization",
      comparisonOperator: "GreaterThanThreshold",
      evaluationPeriods: "2",
      metricName: "CPUUtilization",
      namespace: "AWS/EC2",
      period: "300",
      statistic: "Average",
      threshold: "80",
      alarmDescription: "This metric monitors ec2 cpu utilization",
      dimensions: {
        InstanceId: appInstance.id
      },
      tags: {
        Name: "high-cpu-alarm"
      }
    });

    new CloudwatchMetricAlarm(this, "database-cpu-alarm", {
      alarmName: "database-high-cpu",
      comparisonOperator: "GreaterThanThreshold",
      evaluationPeriods: "2",
      metricName: "CPUUtilization",
      namespace: "AWS/RDS",
      period: "300",
      statistic: "Average",
      threshold: "75",
      alarmDescription: "This metric monitors RDS CPU utilization",
      dimensions: {
        DBInstanceIdentifier: rdsInstance.id
      },
      tags: {
        Name: "database-cpu-alarm"
      }
    });

    new CloudwatchMetricAlarm(this, "lambda-error-alarm", {
      alarmName: "lambda-error-rate",
      comparisonOperator: "GreaterThanThreshold",
      evaluationPeriods: "2",
      metricName: "Errors",
      namespace: "AWS/Lambda",
      period: "300",
      statistic: "Sum",
      threshold: "5",
      alarmDescription: "This metric monitors lambda function errors",
      dimensions: {
        FunctionName: lambdaFunction.functionName
      },
      tags: {
        Name: "lambda-error-alarm"
      }
    });

    new CloudwatchMetricAlarm(this, "database-connections-alarm", {
      alarmName: "database-high-connections",
      comparisonOperator: "GreaterThanThreshold",
      evaluationPeriods: "2",
      metricName: "DatabaseConnections",
      namespace: "AWS/RDS",
      period: "300",
      statistic: "Average",
      threshold: "20",
      alarmDescription: "This metric monitors RDS connection count",
      dimensions: {
        DBInstanceIdentifier: rdsInstance.id
      },
      tags: {
        Name: "database-connections-alarm"
      }
    });

    // ===========================================
    // CloudTrail for Audit Logging
    // ===========================================

    const cloudTrailRole = new IamRole(this, "cloudtrail-role", {
      name: "secure-infrastructure-cloudtrail-role",
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Action: "sts:AssumeRole",
            Effect: "Allow",
            Principal: {
              Service: "cloudtrail.amazonaws.com"
            }
          }
        ]
      }),
      tags: {
        Name: "cloudtrail-role"
      }
    });

    new IamRolePolicy(this, "cloudtrail-logs-policy", {
      name: "cloudtrail-logs-policy",
      role: cloudTrailRole.id,
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Action: [
              "logs:CreateLogGroup",
              "logs:CreateLogStream",
              "logs:PutLogEvents"
            ],
            Resource: `arn:aws:logs:${currentRegion.name}:${current.accountId}:log-group:/aws/cloudtrail/*`
          }
        ]
      })
    });

    const cloudTrailLogGroup = new CloudwatchLogGroup(this, "cloudtrail-log-group", {
      name: "/aws/cloudtrail/secure-infrastructure",
      retentionInDays: 90,
      kmsKeyId: kmsKeyS3.arn,
      tags: {
        Name: "cloudtrail-log-group"
      }
    });

    const cloudTrail = new CloudtrailTrail(this, "cloudtrail", {
      name: "secure-infrastructure-trail",
      s3BucketName: loggingBucket.bucket,
      s3KeyPrefix: "cloudtrail-logs/",
      includeGlobalServiceEvents: true,
      isMultiRegionTrail: true,
      enableLogging: true,
      kmsKeyId: kmsKeyS3.arn,
      cloudWatchLogsGroupArn: `${cloudTrailLogGroup.arn}:*`,
      cloudWatchLogsRoleArn: cloudTrailRole.arn,
      eventSelector: [
        {
          readWriteType: "All",
          includeManagementEvents: true,
          dataResource: [
            {
              type: "AWS::S3::Object",
              values: [`${loggingBucket.arn}/*`]
            }
          ]
        }
      ],
      tags: {
        Name: "secure-infrastructure-trail"
      }
    });

    // ===========================================
    // Additional S3 Bucket for Application Data
    // ===========================================

    const appDataBucket = new S3Bucket(this, "app-data-bucket", {
      bucket: `secure-infrastructure-data-${current.accountId}-${currentRegion.name}`,
      tags: {
        Name: "app-data-bucket",
        Purpose: "application-data"
      }
    });

    new S3BucketEncryption(this, "app-data-bucket-encryption", {
      bucket: appDataBucket.id,
      serverSideEncryptionConfiguration: {
        rule: {
          applyServerSideEncryptionByDefault: {
            kmsMasterKeyId: kmsKeyS3.arn,
            sseAlgorithm: "aws:kms"
          },
          bucketKeyEnabled: true
        }
      }
    });

    new S3BucketPublicAccessBlock(this, "app-data-bucket-pab", {
      bucket: appDataBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true
    });

    new S3BucketVersioning(this, "app-data-bucket-versioning", {
      bucket: appDataBucket.id,
      versioningConfiguration: {
        status: "Enabled"
      }
    });

    // ===========================================
    // Outputs
    // ===========================================

    new TerraformOutput(this, "vpc-id", {
      value: vpc.id,
      description: "ID of the VPC"
    });

    new TerraformOutput(this, "bastion-public-ip", {
      value: bastionInstance.publicIp,
      description: "Public IP of the bastion host"
    });

    new TerraformOutput(this, "app-instance-private-ip", {
      value: appInstance.privateIp,
      description: "Private IP of the application server"
    });

    new TerraformOutput(this, "rds-endpoint", {
      value: rdsInstance.endpoint,
      description: "RDS instance endpoint"
    });

    new TerraformOutput(this, "lambda-function-arn", {
      value: lambdaFunction.arn,
      description: "ARN of the Lambda function"
    });

    new TerraformOutput(this, "logging-bucket-name", {
      value: loggingBucket.bucket,
      description: "Name of the central logging bucket"
    });

    new TerraformOutput(this, "app-data-bucket-name", {
      value: appDataBucket.bucket,
      description: "Name of the application data bucket"
    });

    new TerraformOutput(this, "kms-key-s3-arn", {
      value: kmsKeyS3.arn,
      description: "ARN of the S3 encryption KMS key"
    });

    new TerraformOutput(this, "kms-key-rds-arn", {
      value: kmsKeyRds.arn,
      description: "ARN of the RDS encryption KMS key"
    });

    new TerraformOutput(this, "kms-key-ebs-arn", {
      value: kmsKeyEbs.arn,
      description: "ARN of the EBS encryption KMS key"
    });
  }
}

const app = new App();
new SecureInfrastructureStack(app, "secure-infrastructure");
app.synth();
```

## Additional Files Required

You'll also need these supporting files:

### `package.json`

```json
{
  "name": "secure-infrastructure-cdktf",
  "version": "1.0.0",
  "description": "Secure AWS infrastructure using CDKTF with TypeScript",
  "main": "main.ts",
  "scripts": {
    "build": "tsc",
    "synth": "cdktf synth",
    "deploy": "cdktf deploy",
    "destroy": "cdktf destroy",
    "get": "cdktf get"
  },
  "dependencies": {
    "@cdktf/provider-aws": "^19.0.0",
    "cdktf": "^0.20.0",
    "constructs": "^10.3.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0"
  }
}
```

### `cdktf.json`

```json
{
  "language": "typescript",
  "app": "npx ts-node main.ts",
  "projectId": "secure-infrastructure",
  "sendCrashReports": "false",
  "terraformProviders": ["aws@~> 5.0"],
  "terraformModules": [],
  "context": {
    "excludeStackIdFromLogicalIds": "true",
    "allowSepCharsInLogicalIds": "true"
  }
}
```

### `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "declaration": true,
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": false,
    "inlineSourceMap": true,
    "inlineSources": true,
    "experimentalDecorators": true,
    "strictPropertyInitialization": false,
    "typeRoots": ["./node_modules/@types"]
  },
  "exclude": ["node_modules"]
}
```

### Lambda Function Code (`lambda.py`)

```python
import json
import boto3
import logging
import os
from datetime import datetime

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def handler(event, context):
    """
    Sample Lambda function that demonstrates secure practices
    """
    try:
        # Get environment variables
        log_bucket = os.environ.get('LOG_BUCKET')
        db_secret_arn = os.environ.get('DB_SECRET_ARN')

        # Initialize AWS clients
        s3_client = boto3.client('s3')
        secrets_client = boto3.client('secretsmanager')

        # Log the event (sanitized)
        logger.info(f"Processing event at {datetime.utcnow().isoformat()}")

        # Example: Write a log entry to S3
        log_entry = {
            'timestamp': datetime.utcnow().isoformat(),
            'event_type': 'lambda_execution',
            'status': 'success',
            'message': 'Lambda function executed successfully'
        }

        log_key = f"lambda-logs/{datetime.utcnow().strftime('%Y/%m/%d')}/{context.aws_request_id}.json"

        s3_client.put_object(
            Bucket=log_bucket,
            Key=log_key,
            Body=json.dumps(log_entry),
            ContentType='application/json',
            ServerSideEncryption='aws:kms'
        )

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Function executed successfully',
                'log_location': f"s3://{log_bucket}/{log_key}"
            })
        }

    except Exception as e:
        logger.error(f"Error in Lambda function: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': 'Internal server error'
            })
        }
```

## Deployment Instructions

1. **Install dependencies:**

```bash
npm install
```

2. **Initialize CDKTF:**

```bash
cdktf get
```

3. **Update configuration:**
   - Replace `"your-key-pair"` with your actual EC2 key pair name
   - Update the allowed SSH CIDR in Parameter Store
   - Create the Lambda deployment package (`lambda.zip`)

4. **Create Lambda deployment package:**

```bash
zip lambda.zip lambda.py
```

5. **Deploy:**

```bash
cdktf deploy
```

## Security Features Implemented

✅ **Encryption at Rest:**

- S3 buckets encrypted with KMS
- EBS volumes encrypted with KMS
- RDS encrypted with KMS
- CloudWatch logs encrypted with KMS

✅ **Least Privilege IAM:**

- Separate roles for EC2, Lambda, and CloudTrail
- Minimal permissions for each service
- No wildcard permissions

✅ **Centralized Logging:**

- CloudTrail logs to S3
- CloudWatch logs with retention policies
- Application logs forwarded to central S3 bucket
- Lifecycle policies for cost optimization

✅ **Network Security:**

- Databases in private subnets only
- SSH restricted to allowed CIDR ranges
- Security groups with minimal required access
- NAT Gateway for private subnet internet access

✅ **Backup and Recovery:**

- RDS automated backups enabled
- S3 versioning enabled
- Final snapshot protection for RDS

✅ **Monitoring and Alerting:**

- CloudWatch alarms for CPU, errors, and connections
- Comprehensive logging across all services
- Audit trail with CloudTrail

This infrastructure provides a solid, secure foundation that can be extended for production workloads while maintaining compliance with security best practices.

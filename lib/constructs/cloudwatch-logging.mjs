import { RemovalPolicy } from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export class CloudWatchLoggingConstruct extends Construct {
  constructor(scope, id, props) {
    super(scope, id);

    const { s3BucketName } = props;

    // Create CloudWatch Log Group
    this.logGroup = new logs.LogGroup(this, 'LogGroup', {
      retention: logs.RetentionDays.THREE_MONTHS, // Adjust as needed
      removalPolicy: RemovalPolicy.RETAIN
    });

    // Reference existing S3 bucket
    this.logsBucket = s3.Bucket.fromBucketName(this, 'ExistingLogsBucket', s3BucketName);

    // Create CloudWatch Logs destination for S3 export
    const s3ExportRole = new iam.Role(this, 'CloudWatchLogsS3ExportRole', {
      assumedBy: new iam.ServicePrincipal('logs.amazonaws.com'),
      inlinePolicies: {
        S3ExportPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:PutObject',
                's3:GetBucketAcl'
              ],
              resources: [
                this.logsBucket.bucketArn,
                `${this.logsBucket.bucketArn}/*`
              ]
            })
          ]
        })
      }
    });

    // CloudWatch agent configuration for instances
    this.cloudWatchConfig = {
      agent: {
        metrics_collection_interval: 60,
        run_as_user: "cwagent"
      },
      logs: {
        logs_collected: {
          files: {
            collect_list: [
              {
                file_path: "/var/log/messages",
                log_group_name: this.logGroup.logGroupName,
                log_stream_name: "{instance_id}/var/log/messages"
              },
              {
                file_path: "/var/log/secure",
                log_group_name: this.logGroup.logGroupName,
                log_stream_name: "{instance_id}/var/log/secure"
              },
              {
                file_path: "/var/log/httpd/access_log",
                log_group_name: this.logGroup.logGroupName,
                log_stream_name: "{instance_id}/httpd/access"
              },
              {
                file_path: "/var/log/httpd/error_log",
                log_group_name: this.logGroup.logGroupName,
                log_stream_name: "{instance_id}/httpd/error"
              }
            ]
          }
        }
      },
      metrics: {
        namespace: "/EC2",
        metrics_collected: {
          cpu: {
            measurement: ["cpu_usage_idle", "cpu_usage_iowait", "cpu_usage_user", "cpu_usage_system"],
            metrics_collection_interval: 60
          },
          disk: {
            measurement: ["used_percent"],
            metrics_collection_interval: 60,
            resources: ["*"]
          },
          diskio: {
            measurement: ["io_time"],
            metrics_collection_interval: 60,
            resources: ["*"]
          },
          mem: {
            measurement: ["mem_used_percent"],
            metrics_collection_interval: 60
          }
        }
      }
    };
  }
}

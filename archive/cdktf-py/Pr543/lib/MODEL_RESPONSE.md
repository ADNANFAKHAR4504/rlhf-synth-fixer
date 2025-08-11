```python
from constructs import Construct
from cdktf import App, TerraformStack, TerraformOutput
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.data_aws_ami import DataAwsAmi
from cdktf_cdktf_provider_aws.instance import Instance
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.s3_bucket_versioning import S3BucketVersioning
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_policy import IamPolicy
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.iam_instance_profile import IamInstanceProfile
from cdktf_cdktf_provider_aws.cloudwatch_metric_alarm import CloudwatchMetricAlarm
from cdktf_cdktf_provider_aws.sns_topic import SnsTopic
import json


class InfrastructureStack(TerraformStack):
    def __init__(self, scope: Construct, id: str):
        super().__init__(scope, id)

        # Configure AWS Provider for us-west-2 region
        AwsProvider(self, "aws", region="us-west-2")

        # Data source to get the latest Amazon Linux 2 AMI
        amazon_linux_ami = DataAwsAmi(
            self, "amazon_linux_ami",
            most_recent=True,
            owners=["amazon"],
            filter=[
                {
                    "name": "name",
                    "values": ["amzn2-ami-hvm-*-x86_64-gp2"]
                },
                {
                    "name": "virtualization-type",
                    "values": ["hvm"]
                }
            ]
        )

        # Create S3 bucket for backup purposes
        backup_bucket = S3Bucket(
            self, "backup_bucket",
            bucket="ec2-backup-bucket-${random_id}",
            tags={
                "Name": "EC2 Backup Bucket",
                "Environment": "production"
            }
        )

        # Enable versioning on S3 bucket
        S3BucketVersioning(
            self, "backup_bucket_versioning",
            bucket=backup_bucket.id,
            versioning_configuration={
                "status": "Enabled"
            }
        )

        # Create IAM policy with least-privilege permissions for S3 access
        s3_access_policy_document = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "s3:GetObject",
                        "s3:PutObject",
                        "s3:ListBucket"
                    ],
                    "Resource": [
                        backup_bucket.arn,
                        f"{backup_bucket.arn}/*"
                    ]
                }
            ]
        }

        s3_access_policy = IamPolicy(
            self, "s3_access_policy",
            name="EC2S3AccessPolicy",
            description="Least-privilege policy for EC2 to access S3 backup bucket",
            policy=json.dumps(s3_access_policy_document)
        )

        # Create IAM role for EC2 instance
        ec2_assume_role_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "ec2.amazonaws.com"
                    }
                }
            ]
        }

        ec2_role = IamRole(
            self, "ec2_role",
            name="EC2BackupRole",
            assume_role_policy=json.dumps(ec2_assume_role_policy),
            tags={
                "Name": "EC2 Backup Role",
                "Environment": "production"
            }
        )

        # Attach the S3 access policy to the IAM role
        IamRolePolicyAttachment(
            self, "ec2_role_policy_attachment",
            role=ec2_role.name,
            policy_arn=s3_access_policy.arn
        )

        # Create IAM instance profile
        instance_profile = IamInstanceProfile(
            self, "ec2_instance_profile",
            name="EC2BackupInstanceProfile",
            role=ec2_role.name
        )

        # Create EC2 instance
        ec2_instance = Instance(
            self, "ec2_instance",
            ami=amazon_linux_ami.id,
            instance_type="t3.micro",
            iam_instance_profile=instance_profile.name,
            tags={
                "Name": "EC2 Instance with S3 Access",
                "Environment": "production"
            }
        )

        # Create SNS topic for CloudWatch alarm notifications
        alarm_topic = SnsTopic(
            self, "cpu_alarm_topic",
            name="ec2-cpu-alarm-notifications",
            tags={
                "Name": "CPU Alarm Notifications",
                "Environment": "production"
            }
        )

        # Create CloudWatch alarm for EC2 CPU usage
        CloudwatchMetricAlarm(
            self, "cpu_utilization_alarm",
            alarm_name="EC2-CPU-Utilization-High",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="CPUUtilization",
            namespace="AWS/EC2",
            period=300,
            statistic="Average",
            threshold=80,
            alarm_description="Alarm when EC2 CPU usage exceeds 80%",
            alarm_actions=[alarm_topic.arn],
            dimensions={
                "InstanceId": ec2_instance.id
            },
            tags={
                "Name": "EC2 CPU High Utilization Alarm",
                "Environment": "production"
            }
        )

        # Outputs
        TerraformOutput(
            self, "ec2_instance_id",
            value=ec2_instance.id,
            description="ID of the created EC2 instance"
        )

        TerraformOutput(
            self, "s3_bucket_name",
            value=backup_bucket.bucket,
            description="Name of the S3 backup bucket"
        )

        TerraformOutput(
            self, "iam_role_arn",
            value=ec2_role.arn,
            description="ARN of the IAM role attached to EC2 instance"
        )


app = App()
InfrastructureStack(app, "infrastructure")
app.synth()
```

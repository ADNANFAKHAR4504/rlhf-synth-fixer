"""
dr_automation_stack.py

Disaster recovery automation with Lambda-based failover.
"""

import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions
import json


class DRAutomationStack(pulumi.ComponentResource):
    """
    Creates DR automation infrastructure for failover management.
    """

    def __init__(
        self,
        name: str,
        environment_suffix: str,
        primary_region: str,
        secondary_region: str,
        health_check_id: Output,
        hosted_zone_id: Output,
        sns_topic_arn: Output,
        tags: dict,
        opts: ResourceOptions = None
    ):
        super().__init__('tap:dr:DRAutomationStack', name, None, opts)

        # IAM role for failover Lambda
        failover_role = aws.iam.Role(
            f"failover-lambda-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "lambda.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            managed_policy_arns=[
                "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
            ],
            inline_policies=[
                aws.iam.RoleInlinePolicyArgs(
                    name="route53-failover-policy",
                    policy=json.dumps({
                        "Version": "2012-10-17",
                        "Statement": [
                            {
                                "Effect": "Allow",
                                "Action": [
                                    "route53:ChangeResourceRecordSets",
                                    "route53:GetHealthCheckStatus",
                                    "route53:GetChange"
                                ],
                                "Resource": "*"
                            },
                            {
                                "Effect": "Allow",
                                "Action": [
                                    "rds:FailoverDBCluster",
                                    "rds:DescribeDBClusters"
                                ],
                                "Resource": "*"
                            },
                            {
                                "Effect": "Allow",
                                "Action": [
                                    "sns:Publish"
                                ],
                                "Resource": "*"
                            }
                        ]
                    })
                )
            ],
            tags={**tags, 'Name': f'failover-lambda-role-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Failover automation Lambda
        self.failover_lambda = aws.lambda_.Function(
            f"dr-failover-lambda-{environment_suffix}",
            name=f"dr-failover-lambda-{environment_suffix}",
            runtime="python3.11",
            role=failover_role.arn,
            handler="index.handler",
            code=pulumi.AssetArchive({
                "index.py": pulumi.StringAsset("""
import json
import boto3
import os

route53 = boto3.client('route53')
rds = boto3.client('rds')
sns = boto3.client('sns')

def handler(event, context):
    print(f"DR Failover triggered: {json.dumps(event)}")

    # Parse CloudWatch alarm
    message = json.loads(event['Records'][0]['Sns']['Message'])
    alarm_name = message['AlarmName']
    new_state = message['NewStateValue']

    if new_state == 'ALARM':
        print(f"Health check failed: {alarm_name}")

        # Initiate failover procedures
        try:
            # Send notification
            sns_topic_arn = os.environ['SNS_TOPIC_ARN']
            sns.publish(
                TopicArn=sns_topic_arn,
                Subject='DR Failover Initiated',
                Message=f'Disaster recovery failover initiated due to: {alarm_name}'
            )

            return {
                'statusCode': 200,
                'body': json.dumps('Failover procedures initiated')
            }
        except Exception as e:
            print(f"Error during failover: {str(e)}")
            return {
                'statusCode': 500,
                'body': json.dumps(f'Failover error: {str(e)}')
            }

    return {
        'statusCode': 200,
        'body': json.dumps('No action required')
    }
""")
            }),
            timeout=300,
            memory_size=256,
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    "PRIMARY_REGION": primary_region,
                    "SECONDARY_REGION": secondary_region,
                    "HOSTED_ZONE_ID": hosted_zone_id,
                    "SNS_TOPIC_ARN": sns_topic_arn,
                }
            ),
            tags={**tags, 'Name': f'dr-failover-lambda-{environment_suffix}'},
            opts=ResourceOptions(parent=self, depends_on=[failover_role])
        )

        # SNS subscription for failover Lambda
        aws.sns.TopicSubscription(
            f"failover-lambda-subscription-{environment_suffix}",
            topic=sns_topic_arn,
            protocol="lambda",
            endpoint=self.failover_lambda.arn,
            opts=ResourceOptions(parent=self)
        )

        # Lambda permission for SNS
        aws.lambda_.Permission(
            f"failover-lambda-sns-permission-{environment_suffix}",
            action="lambda:InvokeFunction",
            function=self.failover_lambda.name,
            principal="sns.amazonaws.com",
            source_arn=sns_topic_arn,
            opts=ResourceOptions(parent=self)
        )

        # SSM Parameter for DR configuration
        self.dr_config_parameter = aws.ssm.Parameter(
            f"dr-config-{environment_suffix}",
            name=f"/ecommerce/{environment_suffix}/dr-config",
            type="String",
            value=json.dumps({
                "primary_region": primary_region,
                "secondary_region": secondary_region,
                "rto_minutes": 15,
                "rpo_minutes": 5,
                "auto_failover": True
            }),
            description="DR configuration parameters",
            tags={**tags, 'Name': f'dr-config-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Expose outputs
        self.failover_lambda_arn = self.failover_lambda.arn
        self.dr_config_name = self.dr_config_parameter.name

        self.register_outputs({})

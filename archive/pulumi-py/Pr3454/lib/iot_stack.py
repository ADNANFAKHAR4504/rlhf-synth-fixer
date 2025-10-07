"""
iot_stack.py

AWS IoT Core resources including Thing registry, policies, rules, and Device Defender.
"""

import json
import pulumi
from pulumi import ResourceOptions
import pulumi_aws as aws


class IoTStack(pulumi.ComponentResource):
    """
    IoT Core infrastructure component.
    """
    def __init__(
        self,
        name: str,
        *,
        environment_suffix: str,
        lambda_function_arn: pulumi.Output[str],
        kinesis_stream_arn: pulumi.Output[str],
        tags: dict,
        opts: ResourceOptions = None
    ):
        super().__init__('tap:iot:IoTStack', name, None, opts)

        # Get IoT endpoint
        iot_endpoint_result = aws.iot.get_endpoint()
        self.iot_endpoint = iot_endpoint_result.endpoint_address

        # Create IoT Thing Type
        self.thing_type = aws.iot.ThingType(
            f"industrial-sensor-{environment_suffix}",
            name=f"IndustrialSensor-{environment_suffix}",
            deprecated=False,
            tags=tags,
            opts=ResourceOptions(parent=self)
        )

        # Create IoT Policy for devices
        self.device_policy = aws.iot.Policy(
            f"device-policy-{environment_suffix}",
            name=f"DevicePolicy-{environment_suffix}",
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "iot:Connect",
                            "iot:Publish",
                            "iot:Subscribe",
                            "iot:Receive"
                        ],
                        "Resource": "*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "greengrass:Discover"
                        ],
                        "Resource": "*"
                    }
                ]
            }),
            tags=tags,
            opts=ResourceOptions(parent=self)
        )

        # IAM role for IoT Rule
        self.iot_rule_role = aws.iam.Role(
            f"iot-rule-role-{environment_suffix}",
            name=f"IoTRuleRole-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "iot.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags=tags,
            opts=ResourceOptions(parent=self)
        )

        # IAM policies for IoT Rule
        self.iot_lambda_policy = aws.iam.RolePolicy(
            f"iot-lambda-policy-{environment_suffix}",
            role=self.iot_rule_role.id,
            policy=pulumi.Output.json_dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": ["lambda:InvokeFunction"],
                    "Resource": lambda_function_arn
                }]
            }),
            opts=ResourceOptions(parent=self)
        )

        self.iot_kinesis_policy = aws.iam.RolePolicy(
            f"iot-kinesis-policy-{environment_suffix}",
            role=self.iot_rule_role.id,
            policy=pulumi.Output.json_dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": [
                        "kinesis:PutRecord",
                        "kinesis:PutRecords"
                    ],
                    "Resource": kinesis_stream_arn
                }]
            }),
            opts=ResourceOptions(parent=self)
        )

        # IoT Rule for anomaly detection
        self.anomaly_rule = aws.iot.TopicRule(
            f"anomaly-detection-rule-{environment_suffix}",
            name=f"AnomalyDetectionRule_{environment_suffix}",
            description="Route sensor data with high temperature or vibration to Lambda",
            enabled=True,
            sql="SELECT * FROM 'topic/sensor/+' WHERE temperature > 100 OR vibration > 50",
            sql_version="2016-03-23",
            lambdas=[aws.iot.TopicRuleLambdaArgs(
                function_arn=lambda_function_arn
            )],
            tags=tags,
            opts=ResourceOptions(parent=self)
        )

        # IoT Rule for all data to Kinesis
        self.kinesis_rule = aws.iot.TopicRule(
            f"kinesis-ingestion-rule-{environment_suffix}",
            name=f"KinesisIngestionRule_{environment_suffix}",
            description="Route all sensor data to Kinesis Data Stream",
            enabled=True,
            sql="SELECT *, timestamp() as ingestion_time FROM 'topic/sensor/+'",
            sql_version="2016-03-23",
            kineses=[aws.iot.TopicRuleKinesisArgs(
                role_arn=self.iot_rule_role.arn,
                stream_name=kinesis_stream_arn.apply(
                    lambda arn: arn.split("/")[-1]
                ),
                partition_key="${topic(3)}"
            )],
            tags=tags,
            opts=ResourceOptions(parent=self)
        )

        # Device Defender Security Profile - Not available in current Pulumi AWS provider
        # TODO: Security Profile needs to be created separately when available
        self.security_profile = None

        # Greengrass V2 Core Device Role
        self.greengrass_role = aws.iam.Role(
            f"greengrass-core-role-{environment_suffix}",
            name=f"GreengrassCoreRole-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "greengrass.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            managed_policy_arns=[
                "arn:aws:iam::aws:policy/service-role/AWSGreengrassResourceAccessRolePolicy"
            ],
            tags=tags,
            opts=ResourceOptions(parent=self)
        )

        self.register_outputs({
            'iot_endpoint': self.iot_endpoint,
            'thing_type': self.thing_type.name,
            'device_policy': self.device_policy.name
        })

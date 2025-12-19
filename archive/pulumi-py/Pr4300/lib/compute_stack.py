"""
compute_stack.py

Multi-region compute infrastructure with ALB and Lambda functions.
"""

import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions
import json


class ComputeStack(pulumi.ComponentResource):
    """
    Creates multi-region compute infrastructure for application hosting.
    """

    def __init__(
        self,
        name: str,
        environment_suffix: str,
        primary_region: str,
        secondary_region: str,
        primary_vpc_id: Output,
        secondary_vpc_id: Output,
        primary_subnet_ids: list,
        secondary_subnet_ids: list,
        database_endpoint: Output,
        storage_bucket: Output,
        tags: dict,
        opts: ResourceOptions = None
    ):
        super().__init__('tap:compute:ComputeStack', name, None, opts)

        secondary_provider = aws.Provider(
            f"compute-secondary-provider-{environment_suffix}",
            region=secondary_region,
            opts=ResourceOptions(parent=self)
        )

        # Security group for ALB in primary region
        self.primary_alb_sg = aws.ec2.SecurityGroup(
            f"primary-alb-sg-{environment_suffix}",
            vpc_id=primary_vpc_id,
            description="Security group for primary ALB",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=80,
                    to_port=80,
                    cidr_blocks=["0.0.0.0/0"],
                ),
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=443,
                    to_port=443,
                    cidr_blocks=["0.0.0.0/0"],
                )
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["0.0.0.0/0"],
                )
            ],
            tags={**tags, 'Name': f'primary-alb-sg-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Security group for ALB in secondary region
        self.secondary_alb_sg = aws.ec2.SecurityGroup(
            f"secondary-alb-sg-{environment_suffix}",
            vpc_id=secondary_vpc_id,
            description="Security group for secondary ALB",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=80,
                    to_port=80,
                    cidr_blocks=["0.0.0.0/0"],
                ),
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=443,
                    to_port=443,
                    cidr_blocks=["0.0.0.0/0"],
                )
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["0.0.0.0/0"],
                )
            ],
            tags={**tags, 'Name': f'secondary-alb-sg-{environment_suffix}'},
            opts=ResourceOptions(parent=self, provider=secondary_provider)
        )

        # Primary ALB
        self.primary_alb = aws.lb.LoadBalancer(
            f"primary-alb-{environment_suffix}",
            name=f"primary-alb-{environment_suffix}",
            internal=False,
            load_balancer_type="application",
            security_groups=[self.primary_alb_sg.id],
            subnets=primary_subnet_ids,
            enable_deletion_protection=False,
            tags={**tags, 'Name': f'primary-alb-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Secondary ALB
        self.secondary_alb = aws.lb.LoadBalancer(
            f"secondary-alb-{environment_suffix}",
            name=f"secondary-alb-{environment_suffix}",
            internal=False,
            load_balancer_type="application",
            security_groups=[self.secondary_alb_sg.id],
            subnets=secondary_subnet_ids,
            enable_deletion_protection=False,
            tags={**tags, 'Name': f'secondary-alb-{environment_suffix}'},
            opts=ResourceOptions(parent=self, provider=secondary_provider)
        )

        # Target groups
        self.primary_target_group = aws.lb.TargetGroup(
            f"primary-tg-{environment_suffix}",
            name=f"primary-tg-{environment_suffix}",
            port=80,
            protocol="HTTP",
            vpc_id=primary_vpc_id,
            target_type="lambda",
            health_check=aws.lb.TargetGroupHealthCheckArgs(
                enabled=True,
                path="/health",
                interval=30,
                timeout=5,
                healthy_threshold=2,
                unhealthy_threshold=2,
            ),
            tags={**tags, 'Name': f'primary-tg-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        self.secondary_target_group = aws.lb.TargetGroup(
            f"secondary-tg-{environment_suffix}",
            name=f"secondary-tg-{environment_suffix}",
            port=80,
            protocol="HTTP",
            vpc_id=secondary_vpc_id,
            target_type="lambda",
            health_check=aws.lb.TargetGroupHealthCheckArgs(
                enabled=True,
                path="/health",
                interval=30,
                timeout=5,
                healthy_threshold=2,
                unhealthy_threshold=2,
            ),
            tags={**tags, 'Name': f'secondary-tg-{environment_suffix}'},
            opts=ResourceOptions(parent=self, provider=secondary_provider)
        )

        # Listeners
        self.primary_listener = aws.lb.Listener(
            f"primary-listener-{environment_suffix}",
            load_balancer_arn=self.primary_alb.arn,
            port=80,
            protocol="HTTP",
            default_actions=[aws.lb.ListenerDefaultActionArgs(
                type="forward",
                target_group_arn=self.primary_target_group.arn,
            )],
            tags={**tags, 'Name': f'primary-listener-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        self.secondary_listener = aws.lb.Listener(
            f"secondary-listener-{environment_suffix}",
            load_balancer_arn=self.secondary_alb.arn,
            port=80,
            protocol="HTTP",
            default_actions=[aws.lb.ListenerDefaultActionArgs(
                type="forward",
                target_group_arn=self.secondary_target_group.arn,
            )],
            tags={**tags, 'Name': f'secondary-listener-{environment_suffix}'},
            opts=ResourceOptions(parent=self, provider=secondary_provider)
        )

        # IAM role for Lambda
        lambda_role = aws.iam.Role(
            f"lambda-exec-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "lambda.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            managed_policy_arns=[
                "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
                "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
            ],
            tags={**tags, 'Name': f'lambda-exec-role-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )
        # Lambda function for primary region
        self.primary_lambda = aws.lambda_.Function(
            f"primary-app-lambda-{environment_suffix}",
            name=f"primary-app-lambda-{environment_suffix}",
            runtime="python3.11",
            role=lambda_role.arn,
            handler="index.handler",
            code=pulumi.AssetArchive({
                "index.py": pulumi.StringAsset("""
import json

def handler(event, context):
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json'},
        'body': json.dumps({
            'message': 'E-commerce API - Primary Region',
            'region': 'us-east-1',
            'status': 'active'
        })
    }
""")
            }),
            timeout=30,
            memory_size=256,
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    "REGION": primary_region,
                    "DB_ENDPOINT": database_endpoint,
                    "STORAGE_BUCKET": storage_bucket,
                }
            ),
            tags={**tags, 'Name': f'primary-app-lambda-{environment_suffix}'},
            opts=ResourceOptions(parent=self, depends_on=[lambda_role])
        )

        # Lambda function for secondary region
        self.secondary_lambda = aws.lambda_.Function(
            f"secondary-app-lambda-{environment_suffix}",
            name=f"secondary-app-lambda-{environment_suffix}",
            runtime="python3.11",
            role=lambda_role.arn,
            handler="index.handler",
            code=pulumi.AssetArchive({
                "index.py": pulumi.StringAsset("""
import json

def handler(event, context):
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json'},
        'body': json.dumps({
            'message': 'E-commerce API - Secondary Region',
            'region': 'us-west-2',
            'status': 'standby'
        })
    }
""")
            }),
            timeout=30,
            memory_size=256,
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    "REGION": secondary_region,
                }
            ),
            tags={**tags, 'Name': f'secondary-app-lambda-{environment_suffix}'},
            opts=ResourceOptions(parent=self, provider=secondary_provider, depends_on=[lambda_role])
        )

        # Lambda permissions for ALB
        primary_lambda_permission = aws.lambda_.Permission(
            f"primary-lambda-alb-permission-{environment_suffix}",
            action="lambda:InvokeFunction",
            function=self.primary_lambda.name,
            principal="elasticloadbalancing.amazonaws.com",
            source_arn=self.primary_target_group.arn,
            opts=ResourceOptions(parent=self)
        )

        secondary_lambda_permission = aws.lambda_.Permission(
            f"secondary-lambda-alb-permission-{environment_suffix}",
            action="lambda:InvokeFunction",
            function=self.secondary_lambda.name,
            principal="elasticloadbalancing.amazonaws.com",
            source_arn=self.secondary_target_group.arn,
            opts=ResourceOptions(parent=self, provider=secondary_provider)
        )

        # Attach Lambda to target groups
        # Must depend on permission to ensure ELB can invoke Lambda
        aws.lb.TargetGroupAttachment(
            f"primary-lambda-tg-attachment-{environment_suffix}",
            target_group_arn=self.primary_target_group.arn,
            target_id=self.primary_lambda.arn,
            opts=ResourceOptions(parent=self, depends_on=[self.primary_lambda, primary_lambda_permission])
        )

        aws.lb.TargetGroupAttachment(
            f"secondary-lambda-tg-attachment-{environment_suffix}",
            target_group_arn=self.secondary_target_group.arn,
            target_id=self.secondary_lambda.arn,
            opts=ResourceOptions(
                parent=self,
                provider=secondary_provider,
                depends_on=[self.secondary_lambda, secondary_lambda_permission]
            )
        )

        # Expose outputs
        self.primary_alb_dns = self.primary_alb.dns_name
        self.secondary_alb_dns = self.secondary_alb.dns_name
        self.primary_target_group_arn = self.primary_target_group.arn
        self.primary_lambda_arn = self.primary_lambda.arn
        self.secondary_lambda_arn = self.secondary_lambda.arn

        self.register_outputs({})

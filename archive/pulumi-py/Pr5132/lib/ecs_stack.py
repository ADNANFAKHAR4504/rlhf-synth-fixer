"""
ecs_stack.py

ECS Fargate cluster with task definitions for healthcare analytics platform
Includes IAM roles and security configurations
"""

from typing import Optional, List
import json

import pulumi
from pulumi import ResourceOptions, Output
import pulumi_aws as aws


class ECSStackArgs:
    """Arguments for ECS stack"""

    def __init__(
        self,
        environment_suffix: str,
        tags: dict,
        vpc_id: Output[str],
        private_subnet_ids: List[Output[str]],
        redis_endpoint: Output[str],
        redis_port: Output[int],
        redis_secret_arn: Output[str]
    ):
        self.environment_suffix = environment_suffix
        self.tags = tags
        self.vpc_id = vpc_id
        self.private_subnet_ids = private_subnet_ids
        self.redis_endpoint = redis_endpoint
        self.redis_port = redis_port
        self.redis_secret_arn = redis_secret_arn


class ECSStack(pulumi.ComponentResource):
    """
    ECS Fargate cluster with task definitions
    Includes IAM roles for task execution and application permissions
    """

    def __init__(
        self,
        name: str,
        args: ECSStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:ecs:ECSStack', name, None, opts)

        # Create security group for ECS tasks
        self.ecs_task_sg = aws.ec2.SecurityGroup(
            f"ecs-task-sg-{args.environment_suffix}",
            vpc_id=args.vpc_id,
            description='Security group for ECS tasks',
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol='tcp',
                    from_port=8080,
                    to_port=8080,
                    cidr_blocks=['10.0.0.0/16'],
                    description='Allow inbound traffic to application'
                )
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    protocol='-1',
                    from_port=0,
                    to_port=0,
                    cidr_blocks=['0.0.0.0/0'],
                    description='Allow all outbound traffic'
                )
            ],
            tags={
                **args.tags,
                'Name': f'ecs-task-sg-{args.environment_suffix}'
            },
            opts=ResourceOptions(parent=self)
        )

        # Create ECS cluster
        self.cluster = aws.ecs.Cluster(
            f"ecs-cluster-{args.environment_suffix}",
            name=f"healthcare-analytics-{args.environment_suffix}",
            settings=[
                aws.ecs.ClusterSettingArgs(
                    name='containerInsights',
                    value='enabled'
                )
            ],
            tags={
                **args.tags,
                'Name': f'ecs-cluster-{args.environment_suffix}'
            },
            opts=ResourceOptions(parent=self)
        )

        # Create IAM role for ECS task execution
        self.task_execution_role = aws.iam.Role(
            f"ecs-task-execution-role-{args.environment_suffix}",
            name=f"ecs-task-execution-{args.environment_suffix}",
            assume_role_policy=json.dumps({
                'Version': '2012-10-17',
                'Statement': [{
                    'Effect': 'Allow',
                    'Principal': {
                        'Service': 'ecs-tasks.amazonaws.com'
                    },
                    'Action': 'sts:AssumeRole'
                }]
            }),
            tags={
                **args.tags,
                'Name': f'ecs-task-execution-role-{args.environment_suffix}'
            },
            opts=ResourceOptions(parent=self)
        )

        # Attach AWS managed policy for ECS task execution
        aws.iam.RolePolicyAttachment(
            f"ecs-task-execution-policy-{args.environment_suffix}",
            role=self.task_execution_role.name,
            policy_arn='arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
            opts=ResourceOptions(parent=self)
        )

        # Add policy for Secrets Manager access
        self.secrets_policy = aws.iam.RolePolicy(
            f"ecs-secrets-policy-{args.environment_suffix}",
            role=self.task_execution_role.id,
            policy=args.redis_secret_arn.apply(
                lambda arn: json.dumps({
                    'Version': '2012-10-17',
                    'Statement': [{
                        'Effect': 'Allow',
                        'Action': [
                            'secretsmanager:GetSecretValue'
                        ],
                        'Resource': [arn]
                    }]
                })
            ),
            opts=ResourceOptions(parent=self)
        )

        # Create IAM role for ECS task
        self.task_role = aws.iam.Role(
            f"ecs-task-role-{args.environment_suffix}",
            name=f"ecs-task-{args.environment_suffix}",
            assume_role_policy=json.dumps({
                'Version': '2012-10-17',
                'Statement': [{
                    'Effect': 'Allow',
                    'Principal': {
                        'Service': 'ecs-tasks.amazonaws.com'
                    },
                    'Action': 'sts:AssumeRole'
                }]
            }),
            tags={
                **args.tags,
                'Name': f'ecs-task-role-{args.environment_suffix}'
            },
            opts=ResourceOptions(parent=self)
        )

        # Add CloudWatch Logs policy for task role
        self.logs_policy = aws.iam.RolePolicy(
            f"ecs-logs-policy-{args.environment_suffix}",
            role=self.task_role.id,
            policy=json.dumps({
                'Version': '2012-10-17',
                'Statement': [{
                    'Effect': 'Allow',
                    'Action': [
                        'logs:CreateLogGroup',
                        'logs:CreateLogStream',
                        'logs:PutLogEvents'
                    ],
                    'Resource': 'arn:aws:logs:*:*:*'
                }]
            }),
            opts=ResourceOptions(parent=self)
        )

        # Create CloudWatch log group
        self.log_group = aws.cloudwatch.LogGroup(
            f"ecs-log-group-{args.environment_suffix}",
            name=f"/ecs/healthcare-analytics-{args.environment_suffix}",
            retention_in_days=7,
            tags={
                **args.tags,
                'Name': f'ecs-log-group-{args.environment_suffix}'
            },
            opts=ResourceOptions(parent=self)
        )

        # Create ECS task definition
        self.task_definition = aws.ecs.TaskDefinition(
            f"ecs-task-def-{args.environment_suffix}",
            family=f"healthcare-analytics-{args.environment_suffix}",
            network_mode='awsvpc',
            requires_compatibilities=['FARGATE'],
            cpu='256',
            memory='512',
            execution_role_arn=self.task_execution_role.arn,
            task_role_arn=self.task_role.arn,
            container_definitions=Output.all(
                args.redis_endpoint,
                args.redis_port,
                args.redis_secret_arn,
                self.log_group.name
            ).apply(
                lambda args_list: json.dumps([{
                    'name': 'healthcare-analytics-app',
                    'image': 'nginx:latest',
                    'essential': True,
                    'portMappings': [{
                        'containerPort': 8080,
                        'protocol': 'tcp'
                    }],
                    'environment': [
                        {
                            'name': 'REDIS_ENDPOINT',
                            'value': args_list[0]
                        },
                        {
                            'name': 'REDIS_PORT',
                            'value': str(args_list[1])
                        },
                        {
                            'name': 'ENVIRONMENT',
                            'value': args.environment_suffix
                        }
                    ],
                    'secrets': [{
                        'name': 'REDIS_AUTH_TOKEN',
                        'valueFrom': f"{args_list[2]}:auth_token::"
                    }],
                    'logConfiguration': {
                        'logDriver': 'awslogs',
                        'options': {
                            'awslogs-group': args_list[3],
                            'awslogs-region': 'eu-west-1',
                            'awslogs-stream-prefix': 'ecs'
                        }
                    }
                }])
            ),
            tags={
                **args.tags,
                'Name': f'ecs-task-def-{args.environment_suffix}'
            },
            opts=ResourceOptions(parent=self)
        )

        # Export properties
        self.cluster_name = self.cluster.name
        self.cluster_arn = self.cluster.arn
        self.task_definition_arn = self.task_definition.arn

        self.register_outputs({
            'cluster_name': self.cluster_name,
            'cluster_arn': self.cluster_arn,
            'task_definition_arn': self.task_definition_arn
        })

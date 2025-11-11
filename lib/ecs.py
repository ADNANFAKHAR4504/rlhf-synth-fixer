"""
ECS Cluster and Service
Creates ECS Fargate cluster and service with task definition
"""

import pulumi
import pulumi_aws as aws
import json

def create_ecs_cluster(environment_suffix: str):
    """
    Create ECS Fargate cluster
    """

    cluster = aws.ecs.Cluster(
        f"flask-cluster-{environment_suffix}",
        name=f"flask-cluster-{environment_suffix}",
        settings=[
            aws.ecs.ClusterSettingArgs(
                name="containerInsights",
                value="enabled"
            )
        ],
        tags={
            "Name": f"flask-cluster-{environment_suffix}",
            "EnvironmentSuffix": environment_suffix
        }
    )

    return cluster

def create_ecs_service(  # pylint: disable=too-many-positional-arguments,too-many-arguments
        environment_suffix: str,
        cluster,
        private_subnets,
        security_group,
        target_group,
        ecr_repo,
        db_secret,
        listener=None):
    """
    Create ECS service with Fargate tasks
    """

    # Create CloudWatch log group
    log_group = aws.cloudwatch.LogGroup(
        f"ecs-flask-{environment_suffix}",
        name=f"/ecs/flask-{environment_suffix}",
        retention_in_days=7,
        tags={
            "Name": f"ecs-flask-{environment_suffix}",
            "EnvironmentSuffix": environment_suffix
        }
    )

    # Create IAM role for task execution
    task_execution_role = aws.iam.Role(
        f"ecs-task-execution-role-{environment_suffix}",
        name=f"ecs-task-execution-role-{environment_suffix}",
        assume_role_policy=json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "ecs-tasks.amazonaws.com"
                    },
                    "Action": "sts:AssumeRole"
                }
            ]
        }),
        tags={
            "Name": f"ecs-task-execution-role-{environment_suffix}",
            "EnvironmentSuffix": environment_suffix
        }
    )

    # Attach AWS managed policy for ECS task execution
    task_execution_policy_attachment = aws.iam.RolePolicyAttachment(
        f"ecs-task-execution-policy-{environment_suffix}",
        role=task_execution_role.name,
        policy_arn="arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
    )

    # Create inline policy for Secrets Manager access
    secrets_policy = aws.iam.RolePolicy(
        f"ecs-secrets-policy-{environment_suffix}",
        role=task_execution_role.id,
        policy=db_secret.arn.apply(lambda arn: json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "secretsmanager:GetSecretValue"
                    ],
                    "Resource": arn
                }
            ]
        }))
    )

    # Create IAM role for task
    task_role = aws.iam.Role(
        f"ecs-task-role-{environment_suffix}",
        name=f"ecs-task-role-{environment_suffix}",
        assume_role_policy=json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "ecs-tasks.amazonaws.com"
                    },
                    "Action": "sts:AssumeRole"
                }
            ]
        }),
        tags={
            "Name": f"ecs-task-role-{environment_suffix}",
            "EnvironmentSuffix": environment_suffix
        }
    )

    # Add policy for DynamoDB access
    dynamodb_policy = aws.iam.RolePolicy(
        f"ecs-dynamodb-policy-{environment_suffix}",
        role=task_role.id,
        policy=json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "dynamodb:PutItem",
                        "dynamodb:GetItem",
                        "dynamodb:UpdateItem",
                        "dynamodb:DeleteItem",
                        "dynamodb:Query",
                        "dynamodb:Scan"
                    ],
                    "Resource": f"arn:aws:dynamodb:*:*:table/user-sessions-{environment_suffix}"
                }
            ]
        })
    )

    # Create task definition
    task_definition = aws.ecs.TaskDefinition(
        f"flask-task-{environment_suffix}",
        family=f"flask-task-{environment_suffix}",
        network_mode="awsvpc",
        requires_compatibilities=["FARGATE"],
        cpu="512",
        memory="1024",
        execution_role_arn=task_execution_role.arn,
        task_role_arn=task_role.arn,
        container_definitions=pulumi.Output.all(ecr_repo.repository_url, log_group.name, db_secret.arn).apply(
            lambda args: json.dumps([
                {
                    "name": "flask-app",
                    "image": f"{args[0]}:latest",
                    "essential": True,
                    "portMappings": [
                        {
                            "containerPort": 5000,
                            "protocol": "tcp"
                        }
                    ],
                    "environment": [
                        {
                            "name": "FLASK_ENV",
                            "value": "production"
                        },
                        {
                            "name": "DYNAMODB_TABLE",
                            "value": f"user-sessions-{environment_suffix}"
                        }
                    ],
                    "secrets": [
                        {
                            "name": "DATABASE_URL",
                            "valueFrom": args[2]
                        }
                    ],
                    "logConfiguration": {
                        "logDriver": "awslogs",
                        "options": {
                            "awslogs-group": args[1],
                            "awslogs-region": "us-east-2",
                            "awslogs-stream-prefix": "flask"
                        }
                    },
                    "healthCheck": {
                        "command": ["CMD-SHELL", "curl -f http://localhost:5000/health || exit 1"],
                        "interval": 30,
                        "timeout": 5,
                        "retries": 3,
                        "startPeriod": 60
                    }
                }
            ])
        ),
        tags={
            "Name": f"flask-task-{environment_suffix}",
            "EnvironmentSuffix": environment_suffix
        }
    )

    # Create ECS service
    depends_on_resources = [target_group]
    if listener:
        depends_on_resources.append(listener)

    service = aws.ecs.Service(
        f"flask-service-{environment_suffix}",
        name=f"flask-service-{environment_suffix}",
        cluster=cluster.arn,
        task_definition=task_definition.arn,
        desired_count=2,
        launch_type="FARGATE",
        network_configuration=aws.ecs.ServiceNetworkConfigurationArgs(
            subnets=[subnet.id for subnet in private_subnets],
            security_groups=[security_group.id],
            assign_public_ip=False
        ),
        load_balancers=[
            aws.ecs.ServiceLoadBalancerArgs(
                target_group_arn=target_group.arn,
                container_name="flask-app",
                container_port=5000
            )
        ],
        health_check_grace_period_seconds=60,
        tags={
            "Name": f"flask-service-{environment_suffix}",
            "EnvironmentSuffix": environment_suffix
        },
        opts=pulumi.ResourceOptions(depends_on=depends_on_resources)
    )

    return {
        "service": service,
        "task_definition": task_definition,
        "task_execution_role": task_execution_role,
        "task_role": task_role,
        "log_group": log_group
    }

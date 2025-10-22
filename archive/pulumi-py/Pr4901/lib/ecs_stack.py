"""
ecs_stack.py

ECS Fargate cluster with autoscaling and integration with RDS, ElastiCache, and EFS.
"""

import json
import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions
from typing import Optional, List


class EcsStack(pulumi.ComponentResource):
    """
    Creates ECS Fargate cluster with application deployment and autoscaling.
    """

    def __init__(
        self,
        name: str,
        vpc_id: Output[str],
        private_subnet_ids: List[Output[str]],
        public_subnet_ids: List[Output[str]],
        rds_security_group_id: Output[str],
        elasticache_security_group_id: Output[str],
        efs_id: Output[str],
        rds_endpoint: Output[str],
        rds_reader_endpoint: Output[str],
        elasticache_endpoint: Output[str],
        db_secret_arn: Output[str],
        tags: Optional[dict] = None,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('custom:ecs:EcsStack', name, None, opts)

        self.tags = tags or {}
        child_opts = ResourceOptions(parent=self)

        # Create ECS cluster
        self.cluster = aws.ecs.Cluster(
            f'{name}-cluster',
            settings=[aws.ecs.ClusterSettingArgs(
                name='containerInsights',
                value='enabled'
            )],
            tags=self.tags,
            opts=child_opts
        )

        # Create security group for ECS tasks
        self.task_sg = aws.ec2.SecurityGroup(
            f'{name}-task-sg',
            vpc_id=vpc_id,
            description='Security group for ECS Fargate tasks',
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    from_port=80,
                    to_port=80,
                    protocol='tcp',
                    cidr_blocks=['10.0.0.0/16']
                ),
                aws.ec2.SecurityGroupIngressArgs(
                    from_port=443,
                    to_port=443,
                    protocol='tcp',
                    cidr_blocks=['10.0.0.0/16']
                )
            ],
            egress=[aws.ec2.SecurityGroupEgressArgs(
                from_port=0,
                to_port=0,
                protocol='-1',
                cidr_blocks=['0.0.0.0/0']
            )],
            tags={**self.tags, 'Name': f'{name}-task-sg'},
            opts=child_opts
        )

        # Update RDS security group to allow access from ECS
        aws.ec2.SecurityGroupRule(
            f'{name}-rds-from-ecs',
            type='ingress',
            from_port=5432,
            to_port=5432,
            protocol='tcp',
            source_security_group_id=self.task_sg.id,
            security_group_id=rds_security_group_id,
            opts=child_opts
        )

        # Update ElastiCache security group to allow access from ECS
        aws.ec2.SecurityGroupRule(
            f'{name}-elasticache-from-ecs',
            type='ingress',
            from_port=6379,
            to_port=6379,
            protocol='tcp',
            source_security_group_id=self.task_sg.id,
            security_group_id=elasticache_security_group_id,
            opts=child_opts
        )

        # Create IAM role for ECS task execution
        execution_role_policy = aws.iam.get_policy_document(
            statements=[aws.iam.GetPolicyDocumentStatementArgs(
                effect='Allow',
                principals=[aws.iam.GetPolicyDocumentStatementPrincipalArgs(
                    type='Service',
                    identifiers=['ecs-tasks.amazonaws.com']
                )],
                actions=['sts:AssumeRole']
            )]
        )

        self.execution_role = aws.iam.Role(
            f'{name}-execution-role',
            assume_role_policy=execution_role_policy.json,
            tags=self.tags,
            opts=child_opts
        )

        aws.iam.RolePolicyAttachment(
            f'{name}-execution-role-policy',
            role=self.execution_role.name,
            policy_arn='arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
            opts=child_opts
        )

        # Add secrets manager permissions
        secrets_policy = aws.iam.Policy(
            f'{name}-secrets-policy',
            policy=json.dumps({
                'Version': '2012-10-17',
                'Statement': [
                    {
                        'Effect': 'Allow',
                        'Action': [
                            'secretsmanager:GetSecretValue'
                        ],
                        'Resource': '*'
                    }
                ]
            }),
            opts=child_opts
        )

        aws.iam.RolePolicyAttachment(
            f'{name}-secrets-policy-attach',
            role=self.execution_role.name,
            policy_arn=secrets_policy.arn,
            opts=child_opts
        )

        # Create IAM role for ECS task
        task_role_policy = aws.iam.get_policy_document(
            statements=[aws.iam.GetPolicyDocumentStatementArgs(
                effect='Allow',
                principals=[aws.iam.GetPolicyDocumentStatementPrincipalArgs(
                    type='Service',
                    identifiers=['ecs-tasks.amazonaws.com']
                )],
                actions=['sts:AssumeRole']
            )]
        )

        self.task_role = aws.iam.Role(
            f'{name}-task-role',
            assume_role_policy=task_role_policy.json,
            tags=self.tags,
            opts=child_opts
        )

        # Create CloudWatch log group
        self.log_group = aws.cloudwatch.LogGroup(
            f'{name}-logs',
            retention_in_days=7,
            tags=self.tags,
            opts=child_opts
        )

        # Create task definition
        self.task_definition = aws.ecs.TaskDefinition(
            f'{name}-task',
            family=f'{name}-app',
            cpu='512',
            memory='1024',
            network_mode='awsvpc',
            requires_compatibilities=['FARGATE'],
            execution_role_arn=self.execution_role.arn,
            task_role_arn=self.task_role.arn,
            container_definitions=Output.all(
                rds_endpoint,
                rds_reader_endpoint,
                elasticache_endpoint,
                db_secret_arn,
                self.log_group.name
            ).apply(lambda args: json.dumps([{
                'name': 'globecart-app',
                'image': 'public.ecr.aws/docker/library/nginx:alpine',
                'cpu': 512,
                'memory': 1024,
                'essential': True,
                'portMappings': [{
                    'containerPort': 80,
                    'protocol': 'tcp'
                }],
                'environment': [
                    {'name': 'RDS_WRITER_ENDPOINT', 'value': args[0]},
                    {'name': 'RDS_READER_ENDPOINT', 'value': args[1]},
                    {'name': 'REDIS_ENDPOINT', 'value': args[2]}
                ],
                'secrets': [{
                    'name': 'DB_CREDENTIALS',
                    'valueFrom': args[3]
                }],
                'logConfiguration': {
                    'logDriver': 'awslogs',
                    'options': {
                        'awslogs-group': args[4],
                        'awslogs-region': 'ca-central-1',
                        'awslogs-stream-prefix': 'ecs'
                    }
                },
                'mountPoints': [{
                    'sourceVolume': 'efs-storage',
                    'containerPath': '/mnt/efs',
                    'readOnly': False
                }]
            }])),
            volumes=[aws.ecs.TaskDefinitionVolumeArgs(
                name='efs-storage',
                efs_volume_configuration=aws.ecs.TaskDefinitionVolumeEfsVolumeConfigurationArgs(
                    file_system_id=efs_id,
                    transit_encryption='ENABLED'
                )
            )],
            tags=self.tags,
            opts=child_opts
        )

        # Create Application Load Balancer
        self.alb_sg = aws.ec2.SecurityGroup(
            f'{name}-alb-sg',
            vpc_id=vpc_id,
            description='Security group for ALB',
            ingress=[aws.ec2.SecurityGroupIngressArgs(
                from_port=80,
                to_port=80,
                protocol='tcp',
                cidr_blocks=['0.0.0.0/0']
            )],
            egress=[aws.ec2.SecurityGroupEgressArgs(
                from_port=0,
                to_port=0,
                protocol='-1',
                cidr_blocks=['0.0.0.0/0']
            )],
            tags={**self.tags, 'Name': f'{name}-alb-sg'},
            opts=child_opts
        )

        self.alb = aws.lb.LoadBalancer(
            f'{name}-alb',
            load_balancer_type='application',
            security_groups=[self.alb_sg.id],
            subnets=public_subnet_ids,
            tags=self.tags,
            opts=child_opts
        )

        self.target_group = aws.lb.TargetGroup(
            f'{name}-tg',
            port=80,
            protocol='HTTP',
            vpc_id=vpc_id,
            target_type='ip',
            health_check=aws.lb.TargetGroupHealthCheckArgs(
                enabled=True,
                healthy_threshold=2,
                interval=30,
                timeout=5,
                path='/',
                protocol='HTTP'
            ),
            tags=self.tags,
            opts=child_opts
        )

        self.listener = aws.lb.Listener(
            f'{name}-listener',
            load_balancer_arn=self.alb.arn,
            port=80,
            protocol='HTTP',
            default_actions=[aws.lb.ListenerDefaultActionArgs(
                type='forward',
                target_group_arn=self.target_group.arn
            )],
            opts=child_opts
        )

        # Create ECS service
        self.service = aws.ecs.Service(
            f'{name}-service',
            cluster=self.cluster.id,
            task_definition=self.task_definition.arn,
            desired_count=2,
            launch_type='FARGATE',
            network_configuration=aws.ecs.ServiceNetworkConfigurationArgs(
                subnets=private_subnet_ids,
                security_groups=[self.task_sg.id],
                assign_public_ip=False
            ),
            load_balancers=[aws.ecs.ServiceLoadBalancerArgs(
                target_group_arn=self.target_group.arn,
                container_name='globecart-app',
                container_port=80
            )],
            tags=self.tags,
            opts=ResourceOptions(parent=self, depends_on=[self.listener])
        )

        # Create autoscaling target
        self.autoscaling_target = aws.appautoscaling.Target(
            f'{name}-autoscaling-target',
            max_capacity=10,
            min_capacity=2,
            resource_id=Output.concat('service/', self.cluster.name, '/', self.service.name),
            scalable_dimension='ecs:service:DesiredCount',
            service_namespace='ecs',
            opts=child_opts
        )

        # Create autoscaling policy based on CPU
        self.autoscaling_policy = aws.appautoscaling.Policy(
            f'{name}-cpu-scaling',
            policy_type='TargetTrackingScaling',
            resource_id=self.autoscaling_target.resource_id,
            scalable_dimension=self.autoscaling_target.scalable_dimension,
            service_namespace=self.autoscaling_target.service_namespace,
            target_tracking_scaling_policy_configuration=aws.appautoscaling.PolicyTargetTrackingScalingPolicyConfigurationArgs(  # pylint: disable=line-too-long
                predefined_metric_specification=aws.appautoscaling.PolicyTargetTrackingScalingPolicyConfigurationPredefinedMetricSpecificationArgs(  # pylint: disable=line-too-long
                    predefined_metric_type='ECSServiceAverageCPUUtilization'
                ),
                target_value=70.0,
                scale_in_cooldown=300,
                scale_out_cooldown=60
            ),
            opts=child_opts
        )

        # Store outputs
        self.cluster_name = self.cluster.name
        self.cluster_arn = self.cluster.arn
        self.service_name = self.service.name
        self.alb_dns = self.alb.dns_name

        self.register_outputs({
            'cluster_name': self.cluster_name,
            'cluster_arn': self.cluster_arn,
            'service_name': self.service_name,
            'alb_dns_name': self.alb_dns,
        })

import pulumi
import pulumi_aws as aws
from pulumi import Output
import json

class EcsStack:
    def __init__(self, name: str,
                 vpc_id: Output[str], 
                 public_subnet_ids: list,
                 private_subnet_ids: list,
                 security_groups: dict,
                 iam_roles: dict,
                 db_endpoint: Output[str],
                 db_secret_arn: Output[str],
                 container_image: str,
                 container_port: int,
                 cpu: int,
                 memory: int,
                 desired_count: int,
                 environment: str,
                 blue_weight: int,
                 green_weight: int,
                 min_capacity: int,
                 max_capacity: int,
                 scale_target_cpu: int,
                 scale_target_memory: int):
        self.name = name
        self.vpc_id = vpc_id
        self.container_image = container_image
        self.container_port = container_port
        self.cpu = cpu
        self.memory = memory
        self.desired_count = desired_count
        self.environment = environment
        self.blue_weight = blue_weight
        self.green_weight = green_weight
        self.min_capacity = min_capacity
        self.max_capacity = max_capacity
        self.scale_target_cpu = scale_target_cpu
        self.scale_target_memory = scale_target_memory
        self.db_endpoint = db_endpoint
        self.db_secret_arn = db_secret_arn
        
        # Enable Container Insights
        self.cluster = aws.ecs.Cluster(
            f"{name}-cluster",
            settings=[{
                "name": "containerInsights",
                "value": "enabled"
            }],
            tags={"Name": f"{name}-cluster", "Environment": self.environment}
        )
        
        # CloudWatch Log Group for ECS tasks
        self.log_group = aws.cloudwatch.LogGroup(
            f"{name}-ecs-logs",
            retention_in_days=7 if self.environment == "dev" else 30,
            tags={"Name": f"{name}-ecs-logs"}
        )
        
        # Create task definitions for blue and green deployments
        self.blue_task_definition = self._create_task_definition(
            "blue", 
            iam_roles
        )
        
        self.green_task_definition = self._create_task_definition(
            "green", 
            iam_roles
        )
        
        # Application Load Balancer
        self.alb = aws.lb.LoadBalancer(
            f"{name}-alb",
            load_balancer_type="application",
            security_groups=[security_groups["alb_sg"].id],
            subnets=[subnet.id for subnet in public_subnet_ids],
            enable_deletion_protection=False if self.environment == "dev" else True,
            enable_http2=True,
            enable_cross_zone_load_balancing=True,
            tags={"Name": f"{name}-alb", "Environment": self.environment}
        )
        
        # Target Groups for Blue and Green deployments
        # Use shorter names to avoid AWS 32-character limit
        # Extract abbreviated name (take first 15 chars to leave room for suffix and random chars)
        short_name = name[:15] if len(name) > 15 else name
        
        self.blue_target_group = aws.lb.TargetGroup(
            f"{short_name}-blue",
            port=self.container_port,
            protocol="HTTP",
            vpc_id=self.vpc_id,
            target_type="ip",
            health_check={
                "enabled": True,
                "healthy_threshold": 2,
                "unhealthy_threshold": 3,
                "timeout": 10,
                "interval": 30,
                "path": "/health",
                "matcher": "200-299"
            },
            deregistration_delay=30 if self.environment == "dev" else 300,
            stickiness={
                "enabled": True,
                "type": "lb_cookie",
                "cookie_duration": 86400
            },
            tags={"Name": f"{name}-blue-tg", "Deployment": "blue"}
        )
        
        self.green_target_group = aws.lb.TargetGroup(
            f"{short_name}-green",
            port=self.container_port,
            protocol="HTTP",
            vpc_id=self.vpc_id,
            target_type="ip",
            health_check={
                "enabled": True,
                "healthy_threshold": 2,
                "unhealthy_threshold": 3,
                "timeout": 10,
                "interval": 30,
                "path": "/health",
                "matcher": "200-299"
            },
            deregistration_delay=30 if self.environment == "dev" else 300,
            stickiness={
                "enabled": True,
                "type": "lb_cookie",
                "cookie_duration": 86400
            },
            tags={"Name": f"{name}-green-tg", "Deployment": "green"}
        )
        
        # ALB Listener with weighted target groups
        self.listener = aws.lb.Listener(
            f"{name}-listener",
            load_balancer_arn=self.alb.arn,
            port=80,
            protocol="HTTP",
            default_actions=[{
                "type": "forward",
                "forward": {
                    "target_groups": [
                        {
                            "arn": self.blue_target_group.arn,
                            "weight": self.blue_weight
                        },
                        {
                            "arn": self.green_target_group.arn,
                            "weight": self.green_weight
                        }
                    ],
                    "stickiness": {
                        "enabled": True,
                        "duration": 3600
                    }
                }
            }]
        )
        
        # Create ECS Services
        self.blue_service = self._create_ecs_service(
            "blue",
            self.blue_task_definition,
            self.blue_target_group,
            private_subnet_ids,
            security_groups["ecs_sg"]
        )
        
        self.green_service = self._create_ecs_service(
            "green",
            self.green_task_definition,
            self.green_target_group,
            private_subnet_ids,
            security_groups["ecs_sg"]
        )
        
        # Setup auto-scaling for both services
        self._setup_autoscaling("blue", self.blue_service, iam_roles["autoscaling_role"])
        self._setup_autoscaling("green", self.green_service, iam_roles["autoscaling_role"])
    
    def _create_task_definition(self, deployment_type: str, iam_roles: dict):
        """Create ECS task definition"""
        
        # Container definition with environment variables and secrets
        container_definitions = Output.all(self.db_endpoint, self.db_secret_arn).apply(
            lambda args: json.dumps([{
                "name": f"{self.name}-{deployment_type}",
                "image": self.container_image,
                "cpu": self.cpu,
                "memory": self.memory,
                "essential": True,
                "portMappings": [{
                    "containerPort": self.container_port,
                    "protocol": "tcp"
                }],
                "environment": [
                    {"name": "DEPLOYMENT_TYPE", "value": deployment_type},
                    {"name": "DB_ENDPOINT", "value": str(args[0]) if args[0] else ""},
                    {"name": "APP_ENV", "value": self.environment}
                ],
                "secrets": [
                    {
                        "name": "DB_PASSWORD",
                        "valueFrom": str(args[1]) if args[1] else ""
                    }
                ],
                "logConfiguration": {
                    "logDriver": "awslogs",
                    "options": {
                        "awslogs-group": f"/ecs/{self.name}",
                        "awslogs-region": aws.get_region().name,
                        "awslogs-stream-prefix": deployment_type
                    }
                },
                "healthCheck": {
                    "command": ["CMD-SHELL", "curl -f http://localhost/health || exit 1"],
                    "interval": 30,
                    "timeout": 5,
                    "retries": 3,
                    "startPeriod": 60
                }
            }])
        )
        
        return aws.ecs.TaskDefinition(
            f"{self.name}-{deployment_type}-task",
            family=f"{self.name}-{deployment_type}",
            network_mode="awsvpc",
            requires_compatibilities=["FARGATE"],
            cpu=str(self.cpu),
            memory=str(self.memory),
            execution_role_arn=iam_roles["execution_role"].arn,
            task_role_arn=iam_roles["task_role"].arn,
            container_definitions=container_definitions,
            tags={"Name": f"{self.name}-{deployment_type}-task", "Deployment": deployment_type}
        )
    
    def _create_ecs_service(self, deployment_type: str, 
                           task_definition: aws.ecs.TaskDefinition,
                           target_group: aws.lb.TargetGroup,
                           subnets: list,
                           security_group: aws.ec2.SecurityGroup):
        """Create ECS service"""
        
        return aws.ecs.Service(
            f"{self.name}-{deployment_type}-service",
            cluster=self.cluster.arn,
            task_definition=task_definition.arn,
            desired_count=self.desired_count,
            launch_type="FARGATE",
            deployment_maximum_percent=200,
            deployment_minimum_healthy_percent=100,
            deployment_circuit_breaker=aws.ecs.ServiceDeploymentCircuitBreakerArgs(
                enable=True,
                rollback=True
            ),
            network_configuration=aws.ecs.ServiceNetworkConfigurationArgs(
                assign_public_ip=False,
                subnets=[subnet.id for subnet in subnets],
                security_groups=[security_group.id]
            ),
            load_balancers=[aws.ecs.ServiceLoadBalancerArgs(
                target_group_arn=target_group.arn,
                container_name=f"{self.name}-{deployment_type}",
                container_port=self.container_port
            )],
            health_check_grace_period_seconds=60,
            enable_ecs_managed_tags=True,
            propagate_tags="SERVICE",
            tags={"Name": f"{self.name}-{deployment_type}-service", "Deployment": deployment_type}
        )
    
    def _setup_autoscaling(self, deployment_type: str, 
                          service: aws.ecs.Service,
                          autoscaling_role: aws.iam.Role):
        """Setup auto-scaling for ECS service"""
        
        # Register scalable target
        scalable_target = aws.appautoscaling.Target(
            f"{self.name}-{deployment_type}-scaling-target",
            max_capacity=self.max_capacity,
            min_capacity=self.min_capacity,
            resource_id=Output.all(self.cluster.name, service.name).apply(
                lambda args: f"service/{args[0] if args[0] else 'mock-cluster'}/{args[1] if args[1] else 'mock-service'}"
            ),
            scalable_dimension="ecs:service:DesiredCount",
            service_namespace="ecs",
            role_arn=autoscaling_role.arn
        )
        
        # CPU scaling policy
        aws.appautoscaling.Policy(
            f"{self.name}-{deployment_type}-cpu-scaling",
            policy_type="TargetTrackingScaling",
            resource_id=scalable_target.resource_id,
            scalable_dimension=scalable_target.scalable_dimension,
            service_namespace=scalable_target.service_namespace,
            target_tracking_scaling_policy_configuration={
                "target_value": self.scale_target_cpu,
                "predefined_metric_specification": {
                    "predefined_metric_type": "ECSServiceAverageCPUUtilization"
                },
                "scale_in_cooldown": 300,
                "scale_out_cooldown": 60
            }
        )
        
        # Memory scaling policy
        aws.appautoscaling.Policy(
            f"{self.name}-{deployment_type}-memory-scaling",
            policy_type="TargetTrackingScaling",
            resource_id=scalable_target.resource_id,
            scalable_dimension=scalable_target.scalable_dimension,
            service_namespace=scalable_target.service_namespace,
            target_tracking_scaling_policy_configuration={
                "target_value": self.scale_target_memory,
                "predefined_metric_specification": {
                    "predefined_metric_type": "ECSServiceAverageMemoryUtilization"
                },
                "scale_in_cooldown": 300,
                "scale_out_cooldown": 60
            }
        )


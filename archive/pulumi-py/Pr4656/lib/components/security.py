import pulumi
import pulumi_aws as aws
import json

class SecurityStack:
    def __init__(self, name: str, vpc_id: pulumi.Output[str], container_port: int):
        self.name = name
        self.vpc_id = vpc_id
        self.container_port = container_port
        
        # ALB Security Group - Allow HTTP/HTTPS from internet
        self.alb_sg = aws.ec2.SecurityGroup(
            f"{name}-alb-sg",
            vpc_id=vpc_id,
            description="Security group for Application Load Balancer",
            ingress=[
                {
                    "protocol": "tcp",
                    "from_port": 80,
                    "to_port": 80,
                    "cidr_blocks": ["0.0.0.0/0"],
                    "description": "Allow HTTP"
                },
                {
                    "protocol": "tcp",
                    "from_port": 443,
                    "to_port": 443,
                    "cidr_blocks": ["0.0.0.0/0"],
                    "description": "Allow HTTPS"
                }
            ],
            egress=[{
                "protocol": "-1",
                "from_port": 0,
                "to_port": 0,
                "cidr_blocks": ["0.0.0.0/0"],
                "description": "Allow all outbound"
            }],
            tags={"Name": f"{name}-alb-sg"}
        )
        
        # ECS Tasks Security Group - Allow traffic from ALB only
        self.ecs_sg = aws.ec2.SecurityGroup(
            f"{name}-ecs-sg",
            vpc_id=vpc_id,
            description="Security group for ECS tasks",
            ingress=[
                {
                    "protocol": "tcp",
                    "from_port": self.container_port,
                    "to_port": self.container_port,
                    "security_groups": [self.alb_sg.id],
                    "description": f"Allow traffic from ALB on port {self.container_port}"
                }
            ],
            egress=[{
                "protocol": "-1",
                "from_port": 0,
                "to_port": 0,
                "cidr_blocks": ["0.0.0.0/0"],
                "description": "Allow all outbound"
            }],
            tags={"Name": f"{name}-ecs-sg"}
        )
        
        # RDS Security Group - Allow traffic from ECS tasks only
        self.rds_sg = aws.ec2.SecurityGroup(
            f"{name}-rds-sg",
            vpc_id=vpc_id,
            description="Security group for RDS database",
            ingress=[
                {
                    "protocol": "tcp",
                    "from_port": 5432,
                    "to_port": 5432,
                    "security_groups": [self.ecs_sg.id],
                    "description": "Allow PostgreSQL from ECS tasks"
                }
            ],
            egress=[{
                "protocol": "-1",
                "from_port": 0,
                "to_port": 0,
                "cidr_blocks": ["0.0.0.0/0"],
                "description": "Allow all outbound"
            }],
            tags={"Name": f"{name}-rds-sg"}
        )
        
        # ECS Task Execution Role - For pulling images and logging
        self.ecs_execution_role = aws.iam.Role(
            f"{name}-ecs-execution-role",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Principal": {"Service": "ecs-tasks.amazonaws.com"},
                    "Effect": "Allow"
                }]
            })
        )
        
        # Attach AWS managed policy for ECS task execution
        aws.iam.RolePolicyAttachment(
            f"{name}-ecs-execution-policy",
            role=self.ecs_execution_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
        )
        
        # ECS Task Role - For application permissions
        self.ecs_task_role = aws.iam.Role(
            f"{name}-ecs-task-role",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Principal": {"Service": "ecs-tasks.amazonaws.com"},
                    "Effect": "Allow"
                }]
            })
        )
        
        # Task role policy with least privilege
        task_policy = aws.iam.RolePolicy(
            f"{name}-ecs-task-policy",
            role=self.ecs_task_role.id,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:GetObject",
                            "s3:PutObject"
                        ],
                        "Resource": "arn:aws:s3:::my-app-bucket/*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "secretsmanager:GetSecretValue"
                        ],
                        "Resource": "arn:aws:secretsmanager:*:*:secret:*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "ssm:GetParameter",
                            "ssm:GetParameters"
                        ],
                        "Resource": "arn:aws:ssm:*:*:parameter/*"
                    }
                ]
            })
        )
        
        # Auto-scaling role
        self.autoscaling_role = aws.iam.Role(
            f"{name}-autoscaling-role",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Principal": {"Service": "application-autoscaling.amazonaws.com"},
                    "Effect": "Allow"
                }]
            })
        )
        
        aws.iam.RolePolicyAttachment(
            f"{name}-autoscaling-policy",
            role=self.autoscaling_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AmazonEC2ContainerServiceAutoscaleRole"
        )


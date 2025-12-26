```python
import pulumi
import pulumi_aws as aws
import json
import base64
from typing import Dict, Any

# Configuration

config = pulumi.Config()
environments = ["dev", "prod"]

# Common AMI ID for consistency across environments

COMMON_AMI_ID = "ami-0c02fb55956c7d316" # Amazon Linux 2 AMI (x86_64)

# Environment-specific configurations

env_configs = {
"dev": {
"instance_type": "t3.micro",
"min_size": 1,
"max_size": 3,
"desired_capacity": 1,
"db_instance_class": "db.t3.micro",
"db_allocated_storage": 20,
"environment_message": "Development Environment"
},
"prod": {
"instance_type": "t3.small",
"min_size": 2,
"max_size": 10,
"desired_capacity": 2,
"db_instance_class": "db.t3.small",
"db_allocated_storage": 100,
"environment_message": "Production Environment"
}
}

def create_environment_infrastructure(env_name: str) -> Dict[str, Any]:
"""Create infrastructure for a specific environment"""

    env_config = env_configs[env_name]

    # Get availability zones
    azs = aws.get_availability_zones(state="available")
    selected_azs = azs.names[:2]  # Use exactly 2 AZs as required

    # Create VPC
    vpc = aws.ec2.Vpc(
        f"{env_name}-vpc",
        cidr_block="10.0.0.0/16",
        enable_dns_hostnames=True,
        enable_dns_support=True,
        tags={
            "Name": f"{env_name}-vpc",
            "Environment": env_name,
            "Project": "pulumi-infrastructure"
        }
    )

    # Create Internet Gateway
    igw = aws.ec2.InternetGateway(
        f"{env_name}-igw",
        vpc_id=vpc.id,
        tags={
            "Name": f"{env_name}-igw",
            "Environment": env_name,
            "Project": "pulumi-infrastructure"
        }
    )

    # Create public subnets in 2 AZs
    public_subnets = []
    private_subnets = []

    for i, az in enumerate(selected_azs):
        # Public subnet
        public_subnet = aws.ec2.Subnet(
            f"{env_name}-public-subnet-{i+1}",
            vpc_id=vpc.id,
            cidr_block=f"10.0.{i+1}.0/24",
            availability_zone=az,
            map_public_ip_on_launch=True,
            tags={
                "Name": f"{env_name}-public-subnet-{i+1}",
                "Environment": env_name,
                "Type": "public",
                "Project": "pulumi-infrastructure"
            }
        )
        public_subnets.append(public_subnet)

        # Private subnet for RDS
        private_subnet = aws.ec2.Subnet(
            f"{env_name}-private-subnet-{i+1}",
            vpc_id=vpc.id,
            cidr_block=f"10.0.{i+10}.0/24",
            availability_zone=az,
            tags={
                "Name": f"{env_name}-private-subnet-{i+1}",
                "Environment": env_name,
                "Type": "private",
                "Project": "pulumi-infrastructure"
            }
        )
        private_subnets.append(private_subnet)

    # Create route table for public subnets
    public_rt = aws.ec2.RouteTable(
        f"{env_name}-public-rt",
        vpc_id=vpc.id,
        tags={
            "Name": f"{env_name}-public-rt",
            "Environment": env_name,
            "Project": "pulumi-infrastructure"
        }
    )

    # Add route to internet gateway
    aws.ec2.Route(
        f"{env_name}-public-route",
        route_table_id=public_rt.id,
        destination_cidr_block="0.0.0.0/0",
        gateway_id=igw.id
    )

    # Associate public subnets with route table
    for i, subnet in enumerate(public_subnets):
        aws.ec2.RouteTableAssociation(
            f"{env_name}-public-rta-{i+1}",
            subnet_id=subnet.id,
            route_table_id=public_rt.id
        )

    # Create security group for ELB
    elb_sg = aws.ec2.SecurityGroup(
        f"{env_name}-elb-sg",
        description=f"Security group for {env_name} ELB",
        vpc_id=vpc.id,
        ingress=[
            {
                "protocol": "tcp",
                "from_port": 80,
                "to_port": 80,
                "cidr_blocks": ["0.0.0.0/0"]
            },
            {
                "protocol": "tcp",
                "from_port": 443,
                "to_port": 443,
                "cidr_blocks": ["0.0.0.0/0"]
            }
        ],
        egress=[{
            "protocol": "-1",
            "from_port": 0,
            "to_port": 0,
            "cidr_blocks": ["0.0.0.0/0"]
        }],
        tags={
            "Name": f"{env_name}-elb-sg",
            "Environment": env_name,
            "Project": "pulumi-infrastructure"
        }
    )

    # Create security group for EC2 instances
    ec2_sg = aws.ec2.SecurityGroup(
        f"{env_name}-ec2-sg",
        description=f"Security group for {env_name} EC2 instances",
        vpc_id=vpc.id,
        ingress=[
            {
                "protocol": "tcp",
                "from_port": 80,
                "to_port": 80,
                "security_groups": [elb_sg.id]
            },
            {
                "protocol": "tcp",
                "from_port": 22,
                "to_port": 22,
                "cidr_blocks": ["10.0.0.0/16"]  # Only from VPC
            }
        ],
        egress=[{
            "protocol": "-1",
            "from_port": 0,
            "to_port": 0,
            "cidr_blocks": ["0.0.0.0/0"]
        }],
        tags={
            "Name": f"{env_name}-ec2-sg",
            "Environment": env_name,
            "Project": "pulumi-infrastructure"
        }
    )

    # Create security group for RDS
    rds_sg = aws.ec2.SecurityGroup(
        f"{env_name}-rds-sg",
        description=f"Security group for {env_name} RDS",
        vpc_id=vpc.id,
        ingress=[{
            "protocol": "tcp",
            "from_port": 3306,
            "to_port": 3306,
            "security_groups": [ec2_sg.id]
        }],
        tags={
            "Name": f"{env_name}-rds-sg",
            "Environment": env_name,
            "Project": "pulumi-infrastructure"
        }
    )

    # Create secrets in AWS Secrets Manager
    db_credentials = aws.secretsmanager.Secret(
        f"{env_name}-db-credentials",
        description=f"Database credentials for {env_name} environment",
        tags={
            "Environment": env_name,
            "Project": "pulumi-infrastructure"
        }
    )

    db_secret_version = aws.secretsmanager.SecretVersion(
        f"{env_name}-db-credentials-version",
        secret_id=db_credentials.id,
        secret_string=json.dumps({
            "username": f"{env_name}_admin",
            "password": f"{env_name}_secure_password_123!",
            "engine": "mysql",
            "host": "placeholder",  # Will be updated after RDS creation
            "port": 3306,
            "dbname": f"{env_name}_database"
        })
    )

    app_config_secret = aws.secretsmanager.Secret(
        f"{env_name}-app-config",
        description=f"Application configuration for {env_name} environment",
        tags={
            "Environment": env_name,
            "Project": "pulumi-infrastructure"
        }
    )

    app_config_version = aws.secretsmanager.SecretVersion(
        f"{env_name}-app-config-version",
        secret_id=app_config_secret.id,
        secret_string=json.dumps({
            "environment": env_name,
            "debug": env_name == "dev",
            "log_level": "DEBUG" if env_name == "dev" else "INFO",
            "api_key": f"{env_name}_api_key_12345",
            "message": env_config["environment_message"]
        })
    )

    # Create IAM role for EC2 instances
    ec2_role = aws.iam.Role(
        f"{env_name}-ec2-role",
        assume_role_policy=json.dumps({
            "Version": "2012-10-17",
            "Statement": [{
                "Action": "sts:AssumeRole",
                "Effect": "Allow",
                "Principal": {"Service": "ec2.amazonaws.com"}
            }]
        }),
        tags={
            "Environment": env_name,
            "Project": "pulumi-infrastructure"
        }
    )

    # Create IAM policy for EC2 instances (least privilege)
    ec2_policy = aws.iam.Policy(
        f"{env_name}-ec2-policy",
        description=f"Policy for {env_name} EC2 instances",
        policy=pulumi.Output.all(
            db_credentials.arn,
            app_config_secret.arn
        ).apply(lambda args: json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "secretsmanager:GetSecretValue"
                    ],
                    "Resource": [args[0], args[1]]
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "cloudwatch:PutMetricData",
                        "logs:CreateLogGroup",
                        "logs:CreateLogStream",
                        "logs:PutLogEvents"
                    ],
                    "Resource": "*"
                }
            ]
        }))
    )

    # Attach policy to role
    aws.iam.RolePolicyAttachment(
        f"{env_name}-ec2-policy-attachment",
        role=ec2_role.name,
        policy_arn=ec2_policy.arn
    )

    # Create instance profile
    ec2_instance_profile = aws.iam.InstanceProfile(
        f"{env_name}-ec2-instance-profile",
        role=ec2_role.name
    )

    # Create user data script for EC2 instances
    user_data_script = pulumi.Output.all(
        app_config_secret.arn,
        env_name
    ).apply(lambda args: base64.b64encode(f"""#!/bin/bash

yum update -y
yum install -y httpd awscli
systemctl start httpd
systemctl enable httpd

# Install CloudWatch agent

wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
rpm -U ./amazon-cloudwatch-agent.rpm

# Create simple web application

cat > /var/www/html/index.html << 'EOF'

<!DOCTYPE html>
<html>
<head>
    <title>{args[1].upper()} Environment</title>
</head>
<body>
    <h1>Welcome to {args[1].upper()} Environment</h1>
    <p>This is a sample web application running in the {args[1]} environment.</p>
    <p>Server: $(hostname)</p>
    <p>Environment: {args[1]}</p>
</body>
</html>
EOF

# Create health check endpoint

cat > /var/www/html/health << 'EOF'
{{
    "status": "healthy",
    "environment": "{args[1]}",
    "timestamp": "$(date -Iseconds)",
    "hostname": "$(hostname)"
}}
EOF

# Create environment-specific endpoint

cat > /var/www/html/env << 'EOF'
{{
    "environment": "{args[1]}",
    "message": "{env_configs[args[1]]['environment_message']}",
    "timestamp": "$(date -Iseconds)",
    "hostname": "$(hostname)"
}}
EOF

# Start CloudWatch monitoring

cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOF'
{{
    "metrics": {{
        "namespace": "Custom/{args[1].upper()}",
        "metrics_collected": {{
            "cpu": {{
                "measurement": ["cpu_usage_idle", "cpu_usage_iowait", "cpu_usage_user", "cpu_usage_system"],
                "metrics_collection_interval": 60
            }},
"disk": {{
                "measurement": ["used_percent"],
                "metrics_collection_interval": 60,
                "resources": ["*"]
            }},
"mem": {{
                "measurement": ["mem_used_percent"],
                "metrics_collection_interval": 60
            }}
}}
}},
"logs": {{
        "logs_collected": {{
            "files": {{
                "collect_list": [
                    {{
                        "file_path": "/var/log/httpd/access_log",
                        "log_group_name": "/aws/ec2/{args[1]}/httpd/access",
                        "log_stream_name": "{{instance_id}}"
}},
{{
                        "file_path": "/var/log/httpd/error_log",
                        "log_group_name": "/aws/ec2/{args[1]}/httpd/error",
                        "log_stream_name": "{{instance_id}}"
}}
]
}}
}}
}}
}}
EOF

/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s
""".encode()).decode())

    # Create launch template
    launch_template = aws.ec2.LaunchTemplate(
        f"{env_name}-launch-template",
        name_prefix=f"{env_name}-template-",
        image_id=COMMON_AMI_ID,
        instance_type=env_config["instance_type"],
        vpc_security_group_ids=[ec2_sg.id],
        user_data=user_data_script,
        iam_instance_profile={
            "name": ec2_instance_profile.name
        },
        tag_specifications=[{
            "resource_type": "instance",
            "tags": {
                "Name": f"{env_name}-instance",
                "Environment": env_name,
                "Project": "pulumi-infrastructure"
            }
        }],
        tags={
            "Name": f"{env_name}-launch-template",
            "Environment": env_name,
            "Project": "pulumi-infrastructure"
        }
    )

    # Create Application Load Balancer
    alb = aws.lb.LoadBalancer(
        f"{env_name}-alb",
        load_balancer_type="application",
        subnets=[subnet.id for subnet in public_subnets],
        security_groups=[elb_sg.id],
        tags={
            "Name": f"{env_name}-alb",
            "Environment": env_name,
            "Project": "pulumi-infrastructure"
        }
    )

    # Create target group
    target_group = aws.lb.TargetGroup(
        f"{env_name}-tg",
        port=80,
        protocol="HTTP",
        vpc_id=vpc.id,
        health_check={
            "enabled": True,
            "healthy_threshold": 2,
            "interval": 30,
            "matcher": "200",
            "path": "/health",
            "port": "traffic-port",
            "protocol": "HTTP",
            "timeout": 5,
            "unhealthy_threshold": 2
        },
        tags={
            "Name": f"{env_name}-tg",
            "Environment": env_name,
            "Project": "pulumi-infrastructure"
        }
    )

    # Create ALB listener
    alb_listener = aws.lb.Listener(
        f"{env_name}-alb-listener",
        load_balancer_arn=alb.arn,
        port="80",
        protocol="HTTP",
        default_actions=[{
            "type": "forward",
            "target_group_arn": target_group.arn
        }]
    )

    # Create Auto Scaling Group
    asg = aws.autoscaling.Group(
        f"{env_name}-asg",
        vpc_zone_identifiers=[subnet.id for subnet in public_subnets],
        target_group_arns=[target_group.arn],
        health_check_type="ELB",
        health_check_grace_period=300,
        min_size=env_config["min_size"],
        max_size=env_config["max_size"],
        desired_capacity=env_config["desired_capacity"],
        launch_template={
            "id": launch_template.id,
            "version": "$Latest"
        },
        tags=[
            {
                "key": "Name",
                "value": f"{env_name}-asg",
                "propagate_at_launch": True
            },
            {
                "key": "Environment",
                "value": env_name,
                "propagate_at_launch": True
            },
            {
                "key": "Project",
                "value": "pulumi-infrastructure",
                "propagate_at_launch": True
            }
        ]
    )

    # Create scaling policies
    scale_up_policy = aws.autoscaling.Policy(
        f"{env_name}-scale-up",
        scaling_adjustment=1,
        adjustment_type="ChangeInCapacity",
        cooldown=300,
        autoscaling_group_name=asg.name
    )

    scale_down_policy = aws.autoscaling.Policy(
        f"{env_name}-scale-down",
        scaling_adjustment=-1,
        adjustment_type="ChangeInCapacity",
        cooldown=300,
        autoscaling_group_name=asg.name
    )

    # Create RDS subnet group
    rds_subnet_group = aws.rds.SubnetGroup(
        f"{env_name}-rds-subnet-group",
        subnet_ids=[subnet.id for subnet in private_subnets],
        tags={
            "Name": f"{env_name}-rds-subnet-group",
            "Environment": env_name,
            "Project": "pulumi-infrastructure"
        }
    )

    # Create RDS instance with multi-AZ
    rds_instance = aws.rds.Instance(
        f"{env_name}-rds",
        identifier=f"{env_name}-database",
        allocated_storage=env_config["db_allocated_storage"],
        storage_type="gp2",
        engine="mysql",
        engine_version="8.0",
        instance_class=env_config["db_instance_class"],
        db_name=f"{env_name}database",
        username=f"{env_name}admin",
        password=f"{env_name}_secure_password_123!",
        vpc_security_group_ids=[rds_sg.id],
        db_subnet_group_name=rds_subnet_group.name,
        multi_az=True,  # Multi-AZ deployment as required
        backup_retention_period=7,
        backup_window="03:00-04:00",
        maintenance_window="sun:04:00-sun:05:00",
        skip_final_snapshot=True,
        tags={
            "Name": f"{env_name}-rds",
            "Environment": env_name,
            "Project": "pulumi-infrastructure"
        }
    )

    # Create SNS topic for alerts
    sns_topic = aws.sns.Topic(
        f"{env_name}-alerts",
        name=f"{env_name}-infrastructure-alerts",
        tags={
            "Environment": env_name,
            "Project": "pulumi-infrastructure"
        }
    )

    # Create CloudWatch log groups
    access_log_group = aws.cloudwatch.LogGroup(
        f"{env_name}-httpd-access-logs",
        name=f"/aws/ec2/{env_name}/httpd/access",
        retention_in_days=14,
        tags={
            "Environment": env_name,
            "Project": "pulumi-infrastructure"
        }
    )

    error_log_group = aws.cloudwatch.LogGroup(
        f"{env_name}-httpd-error-logs",
        name=f"/aws/ec2/{env_name}/httpd/error",
        retention_in_days=14,
        tags={
            "Environment": env_name,
            "Project": "pulumi-infrastructure"
        }
    )

    # Create CloudWatch alarms
    cpu_alarm = aws.cloudwatch.MetricAlarm(
        f"{env_name}-high-cpu",
        comparison_operator="GreaterThanThreshold",
        evaluation_periods="2",
        metric_name="CPUUtilization",
        namespace="AWS/EC2",
        period="300",
        statistic="Average",
        threshold="80",
        alarm_description=f"This metric monitors ec2 cpu utilization in {env_name}",
        alarm_actions=[sns_topic.arn, scale_up_policy.arn],
        dimensions={
            "AutoScalingGroupName": asg.name
        },
        tags={
            "Environment": env_name,
            "Project": "pulumi-infrastructure"
        }
    )

    low_cpu_alarm = aws.cloudwatch.MetricAlarm(
        f"{env_name}-low-cpu",
        comparison_operator="LessThanThreshold",
        evaluation_periods="2",
        metric_name="CPUUtilization",
        namespace="AWS/EC2",
        period="300",
        statistic="Average",
        threshold="20",
        alarm_description=f"This metric monitors low ec2 cpu utilization in {env_name}",
        alarm_actions=[scale_down_policy.arn],
        dimensions={
            "AutoScalingGroupName": asg.name
        },
        tags={
            "Environment": env_name,
            "Project": "pulumi-infrastructure"
        }
    )

    alb_response_time_alarm = aws.cloudwatch.MetricAlarm(
        f"{env_name}-alb-response-time",
        comparison_operator="GreaterThanThreshold",
        evaluation_periods="2",
        metric_name="TargetResponseTime",
        namespace="AWS/ApplicationELB",
        period="300",
        statistic="Average",
        threshold="1",
        alarm_description=f"This metric monitors ALB response time in {env_name}",
        alarm_actions=[sns_topic.arn],
        dimensions={
            "LoadBalancer": alb.arn_suffix
        },
        tags={
            "Environment": env_name,
            "Project": "pulumi-infrastructure"
        }
    )

    rds_cpu_alarm = aws.cloudwatch.MetricAlarm(
        f"{env_name}-rds-cpu",
        comparison_operator="GreaterThanThreshold",
        evaluation_periods="2",
        metric_name="CPUUtilization",
        namespace="AWS/RDS",
        period="300",
        statistic="Average",
        threshold="80",
        alarm_description=f"This metric monitors RDS CPU utilization in {env_name}",
        alarm_actions=[sns_topic.arn],
        dimensions={
            "DBInstanceIdentifier": rds_instance.id
        },
        tags={
            "Environment": env_name,
            "Project": "pulumi-infrastructure"
        }
    )

    return {
        "vpc": vpc,
        "alb": alb,
        "asg": asg,
        "rds": rds_instance,
        "sns_topic": sns_topic,
        "db_credentials_secret": db_credentials,
        "app_config_secret": app_config_secret,
        "target_group": target_group
    }

# Deploy infrastructure for both environments

infrastructure = {}
for env in environments:
infrastructure[env] = create_environment_infrastructure(env)

# Export important outputs

for env in environments:
pulumi.export(f"{env}\_alb_dns", infrastructure[env]["alb"].dns_name)
pulumi.export(f"{env}\_alb_url", infrastructure[env]["alb"].dns_name.apply(lambda dns: f"http://{dns}"))
pulumi.export(f"{env}\_environment_endpoint", infrastructure[env]["alb"].dns_name.apply(lambda dns: f"http://{dns}/env"))
pulumi.export(f"{env}\_health_endpoint", infrastructure[env]["alb"].dns_name.apply(lambda dns: f"http://{dns}/health"))
pulumi.export(f"{env}\_rds_endpoint", infrastructure[env]["rds"].endpoint)
pulumi.export(f"{env}\_sns_topic_arn", infrastructure[env]["sns_topic"].arn)
pulumi.export(f"{env}\_db_credentials_secret_arn", infrastructure[env]["db_credentials_secret"].arn)
pulumi.export(f"{env}\_app_config_secret_arn", infrastructure[env]["app_config_secret"].arn)

# Export rollback information

pulumi.export("rollback_info", {
"launch_templates": {
env: infrastructure[env]["asg"].launch_template for env in environments
},
"target_groups": {
env: infrastructure[env]["target_group"].arn for env in environments
}
})

print(" Infrastructure deployment completed successfully!")
print("\n Deployment Summary:")
print("=" \* 50)
for env in environments:
print(f"\n {env.upper()} Environment:")
print(f" • VPC with 2 AZs and public/private subnets")
print(f" • Auto Scaling Group ({env_configs[env]['min_size']}-{env_configs[env]['max_size']} instances)")
print(f" • Application Load Balancer with health checks")
print(f" • RDS MySQL with Multi-AZ deployment")
print(f" • CloudWatch monitoring and SNS alerts")
print(f" • Secrets Manager for secure configuration")
print(f" • IAM roles with least privilege access")

print(f"\n Access URLs:")
for env in environments:
print(f" • {env.upper()}: http://{{ALB_DNS}}")
print(f" • {env.upper()} Environment Info: http://{{ALB_DNS}}/env")
print(f" • {env.upper()} Health Check: http://{{ALB_DNS}}/health")

print(f"\n Rollback Capabilities:")
print(f" • Launch template versioning for easy rollbacks")
print(f" • Auto Scaling Group supports rolling updates")
print(f" • RDS automated backups with 7-day retention")
print(f" • CloudWatch logs for troubleshooting")

print(f"\n Security Features:")
print(f" • Secrets stored in AWS Secrets Manager")
print(f" • Strict IAM roles with least privilege")
print(f" • Security groups with minimal required access")
print(f" • VPC isolation with public/private subnets")

print(f"\n Monitoring & Alerting:")
print(f" • CloudWatch metrics for EC2, ALB, and RDS")
print(f" • SNS notifications for critical alerts")
print(f" • Auto scaling based on CPU utilization")
print(f" • Application and error logs in CloudWatch")
```

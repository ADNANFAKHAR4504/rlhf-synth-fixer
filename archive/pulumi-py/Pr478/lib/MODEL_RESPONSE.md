4. modules/networking.py
"""
Networking module for multi-region VPC setup
"""
```python
import pulumi
import pulumi_aws as aws
from typing import Dict, Any

class NetworkingStack:
    def __init__(self, region: str, tags: Dict[str, str]):
        self.region = region
        self.tags = tags
        self.vpc = None
        self.public_subnets = []
        self.private_subnets = []
        self.internet_gateway = None
        self.nat_gateways = []
        
    def create_vpc(self) -> aws.ec2.Vpc:
        """Create VPC for the region"""
        self.vpc = aws.ec2.Vpc(
            f"vpc-{self.region}",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                **self.tags,
                "Name": f"vpc-nova-{self.region}",
                "Type": "VPC"
            }
        )
        return self.vpc
    
    def create_internet_gateway(self) -> aws.ec2.InternetGateway:
        """Create Internet Gateway"""
        self.internet_gateway = aws.ec2.InternetGateway(
            f"igw-{self.region}",
            vpc_id=self.vpc.id,
            tags={
                **self.tags,
                "Name": f"igw-nova-{self.region}",
                "Type": "InternetGateway"
            }
        )
        return self.internet_gateway
    
    def create_subnets(self) -> tuple:
        """Create public and private subnets across AZs"""
        # Get availability zones
        azs = aws.get_availability_zones(state="available")
        
        for i, az in enumerate(azs.names[:3]):  # Use first 3 AZs
            # Public subnet
            public_subnet = aws.ec2.Subnet(
                f"public-subnet-{self.region}-{i+1}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i+1}.0/24",
                availability_zone=az,
                map_public_ip_on_launch=True,
                tags={
                    **self.tags,
                    "Name": f"public-subnet-nova-{self.region}-{i+1}",
                    "Type": "PublicSubnet",
                    "Tier": "Public"
                }
            )
            self.public_subnets.append(public_subnet)
            
            # Private subnet
            private_subnet = aws.ec2.Subnet(
                f"private-subnet-{self.region}-{i+1}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i+10}.0/24",
                availability_zone=az,
                tags={
                    **self.tags,
                    "Name": f"private-subnet-nova-{self.region}-{i+1}",
                    "Type": "PrivateSubnet",
                    "Tier": "Private"
                }
            )
            self.private_subnets.append(private_subnet)
            
            # NAT Gateway for each public subnet
            eip = aws.ec2.Eip(
                f"nat-eip-{self.region}-{i+1}",
                domain="vpc",
                tags={
                    **self.tags,
                    "Name": f"nat-eip-nova-{self.region}-{i+1}",
                    "Type": "ElasticIP"
                }
            )
            
            nat_gateway = aws.ec2.NatGateway(
                f"nat-gateway-{self.region}-{i+1}",
                allocation_id=eip.id,
                subnet_id=public_subnet.id,
                tags={
                    **self.tags,
                    "Name": f"nat-gateway-nova-{self.region}-{i+1}",
                    "Type": "NATGateway"
                }
            )
            self.nat_gateways.append(nat_gateway)
        
        return self.public_subnets, self.private_subnets
    
    def create_route_tables(self):
        """Create and configure route tables"""
        # Public route table
        public_rt = aws.ec2.RouteTable(
            f"public-rt-{self.region}",
            vpc_id=self.vpc.id,
            tags={
                **self.tags,
                "Name": f"public-rt-nova-{self.region}",
                "Type": "PublicRouteTable"
            }
        )
        
        # Public route to internet gateway
        aws.ec2.Route(
            f"public-route-{self.region}",
            route_table_id=public_rt.id,
            destination_cidr_block="0.0.0.0/0",
            gateway_id=self.internet_gateway.id
        )
        
        # Associate public subnets with public route table
        for i, subnet in enumerate(self.public_subnets):
            aws.ec2.RouteTableAssociation(
                f"public-rta-{self.region}-{i+1}",
                subnet_id=subnet.id,
                route_table_id=public_rt.id
            )
        
        # Private route tables (one per AZ for HA)
        for i, (subnet, nat_gw) in enumerate(zip(self.private_subnets, self.nat_gateways)):
            private_rt = aws.ec2.RouteTable(
                f"private-rt-{self.region}-{i+1}",
                vpc_id=self.vpc.id,
                tags={
                    **self.tags,
                    "Name": f"private-rt-nova-{self.region}-{i+1}",
                    "Type": "PrivateRouteTable"
                }
            )
            
            # Private route to NAT gateway
            aws.ec2.Route(
                f"private-route-{self.region}-{i+1}",
                route_table_id=private_rt.id,
                destination_cidr_block="0.0.0.0/0",
                nat_gateway_id=nat_gw.id
            )
            
            # Associate private subnet with private route table
            aws.ec2.RouteTableAssociation(
                f"private-rta-{self.region}-{i+1}",
                subnet_id=subnet.id,
                route_table_id=private_rt.id
            )
5. modules/elastic_beanstalk.py
"""
Elastic Beanstalk module for application deployment
"""
import pulumi
import pulumi_aws as aws
from typing import Dict, List, Any

class ElasticBeanstalkStack:
    def __init__(self, region: str, vpc_id: str, subnet_ids: List[str], tags: Dict[str, str]):
        self.region = region
        self.vpc_id = vpc_id
        self.subnet_ids = subnet_ids
        self.tags = tags
        self.application = None
        self.environment = None
        
    def create_application(self, app_name: str) -> aws.elasticbeanstalk.Application:
        """Create Elastic Beanstalk application"""
        self.application = aws.elasticbeanstalk.Application(
            f"eb-app-{self.region}",
            name=f"{app_name}-{self.region}",
            description=f"Nova Model Breaking Application - {self.region}",
            tags={
                **self.tags,
                "Name": f"{app_name}-{self.region}",
                "Type": "ElasticBeanstalkApplication"
            }
        )
        return self.application
    
    def create_application_version(self, version_label: str) -> aws.elasticbeanstalk.ApplicationVersion:
        """Create application version"""
        # Create S3 bucket for application source
        source_bucket = aws.s3.Bucket(
            f"eb-source-{self.region}",
            bucket=f"nova-eb-source-{self.region}-{pulumi.get_stack()}",
            tags={
                **self.tags,
                "Name": f"nova-eb-source-{self.region}",
                "Type": "S3Bucket"
            }
        )
        
        # Upload sample application (you would replace this with your actual app)
        source_object = aws.s3.BucketObject(
            f"eb-source-object-{self.region}",
            bucket=source_bucket.id,
            key="application.zip",
            source=pulumi.FileAsset("./sample-app.zip"),  # You need to create this
            tags=self.tags
        )
        
        app_version = aws.elasticbeanstalk.ApplicationVersion(
            f"eb-version-{self.region}",
            name=version_label,
            application=self.application.name,
            bucket=source_bucket.id,
            key=source_object.key,
            tags={
                **self.tags,
                "Name": f"{version_label}-{self.region}",
                "Type": "ApplicationVersion"
            }
        )
        return app_version
    
    def create_environment(self, env_name: str, version_label: str, config: Dict[str, Any]) -> aws.elasticbeanstalk.Environment:
        """Create Elastic Beanstalk environment with auto-scaling"""
        
        # Create security group for EB instances
        security_group = aws.ec2.SecurityGroup(
            f"eb-sg-{self.region}",
            name=f"nova-eb-sg-{self.region}",
            description="Security group for Elastic Beanstalk instances",
            vpc_id=self.vpc_id,
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    from_port=80,
                    to_port=80,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"]
                ),
                aws.ec2.SecurityGroupIngressArgs(
                    from_port=443,
                    to_port=443,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            tags={
                **self.tags,
                "Name": f"nova-eb-sg-{self.region}",
                "Type": "SecurityGroup"
            }
        )
        
        # Create IAM role for EC2 instances
        instance_role = aws.iam.Role(
            f"eb-instance-role-{self.region}",
            assume_role_policy="""{
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "ec2.amazonaws.com"
                        },
                        "Action": "sts:AssumeRole"
                    }
                ]
            }""",
            tags={
                **self.tags,
                "Name": f"nova-eb-instance-role-{self.region}",
                "Type": "IAMRole"
            }
        )
        
        # Attach policies to instance role
        aws.iam.RolePolicyAttachment(
            f"eb-instance-policy-web-{self.region}",
            role=instance_role.name,
            policy_arn="arn:aws-us-gov:iam::aws:policy/AWSElasticBeanstalkWebTier"
        )
        
        aws.iam.RolePolicyAttachment(
            f"eb-instance-policy-worker-{self.region}",
            role=instance_role.name,
            policy_arn="arn:aws-us-gov:iam::aws:policy/AWSElasticBeanstalkWorkerTier"
        )
        
        aws.iam.RolePolicyAttachment(
            f"eb-instance-policy-multicontainer-{self.region}",
            role=instance_role.name,
            policy_arn="arn:aws-us-gov:iam::aws:policy/AWSElasticBeanstalkMulticontainerDocker"
        )
        
        # Create instance profile
        instance_profile = aws.iam.InstanceProfile(
            f"eb-instance-profile-{self.region}",
            role=instance_role.name,
            tags={
                **self.tags,
                "Name": f"nova-eb-instance-profile-{self.region}",
                "Type": "InstanceProfile"
            }
        )
        
        # Create service role
        service_role = aws.iam.Role(
            f"eb-service-role-{self.region}",
            assume_role_policy="""{
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "elasticbeanstalk.amazonaws.com"
                        },
                        "Action": "sts:AssumeRole"
                    }
                ]
            }""",
            tags={
                **self.tags,
                "Name": f"nova-eb-service-role-{self.region}",
                "Type": "IAMRole"
            }
        )
        
        aws.iam.RolePolicyAttachment(
            f"eb-service-policy-{self.region}",
            role=service_role.name,
            policy_arn="arn:aws-us-gov:iam::aws:policy/service-role/AWSElasticBeanstalkService"
        )
        
        aws.iam.RolePolicyAttachment(
            f"eb-service-policy-health-{self.region}",
            role=service_role.name,
            policy_arn="arn:aws-us-gov:iam::aws:policy/service-role/AWSElasticBeanstalkEnhancedHealth"
        )
        
        # Environment configuration settings
        settings = [
            # VPC Configuration
            aws.elasticbeanstalk.EnvironmentSettingArgs(
                namespace="aws:ec2:vpc",
                name="VPCId",
                value=self.vpc_id
            ),
            aws.elasticbeanstalk.EnvironmentSettingArgs(
                namespace="aws:ec2:vpc",
                name="Subnets",
                value=",".join(self.subnet_ids)
            ),
            aws.elasticbeanstalk.EnvironmentSettingArgs(
                namespace="aws:ec2:vpc",
                name="ELBSubnets",
                value=",".join(self.subnet_ids)
            ),
            
            # Auto Scaling Configuration
            aws.elasticbeanstalk.EnvironmentSettingArgs(
                namespace="aws:autoscaling:asg",
                name="MinSize",
                value=str(config.get("min_capacity", 2))
            ),
            aws.elasticbeanstalk.EnvironmentSettingArgs(
                namespace="aws:autoscaling:asg",
                name="MaxSize",
                value=str(config.get("max_capacity", 10))
            ),
            
            # Instance Configuration
            aws.elasticbeanstalk.EnvironmentSettingArgs(
                namespace="aws:autoscaling:launchconfiguration",
                name="InstanceType",
                value=config.get("instance_type", "t3.medium")
            ),
            aws.elasticbeanstalk.EnvironmentSettingArgs(
                namespace="aws:autoscaling:launchconfiguration",
                name="IamInstanceProfile",
                value=instance_profile.name
            ),
            aws.elasticbeanstalk.EnvironmentSettingArgs(
                namespace="aws:autoscaling:launchconfiguration",
                name="SecurityGroups",
                value=security_group.id
            ),
            
            # Auto Scaling Triggers
            aws.elasticbeanstalk.EnvironmentSettingArgs(
                namespace="aws:autoscaling:trigger",
                name="MeasureName",
                value="CPUUtilization"
            ),
            aws.elasticbeanstalk.EnvironmentSettingArgs(
                namespace="aws:autoscaling:trigger",
                name="Statistic",
                value="Average"
            ),
            aws.elasticbeanstalk.EnvironmentSettingArgs(
                namespace="aws:autoscaling:trigger",
                name="Unit",
                value="Percent"
            ),
            aws.elasticbeanstalk.EnvironmentSettingArgs(
                namespace="aws:autoscaling:trigger",
                name="UpperThreshold",
                value=str(config.get("cpu_threshold_high", 70))
            ),
            aws.elasticbeanstalk.EnvironmentSettingArgs(
                namespace="aws:autoscaling:trigger",
                name="LowerThreshold",
                value=str(config.get("cpu_threshold_low", 30))
            ),
            aws.elasticbeanstalk.EnvironmentSettingArgs(
                namespace="aws:autoscaling:trigger",
                name="ScaleUpIncrement",
                value="1"
            ),
            aws.elasticbeanstalk.EnvironmentSettingArgs(
                namespace="aws:autoscaling:trigger",
                name="ScaleDownIncrement",
                value="-1"
            ),
            
            # Load Balancer Configuration
            aws.elasticbeanstalk.EnvironmentSettingArgs(
                namespace="aws:elasticbeanstalk:environment",
                name="LoadBalancerType",
                value="application"
            ),
            aws.elasticbeanstalk.EnvironmentSettingArgs(
                namespace="aws:elasticbeanstalk:environment",
                name="ServiceRole",
                value=service_role.name
            ),
            
            # Health Reporting
            aws.elasticbeanstalk.EnvironmentSettingArgs(
                namespace="aws:elasticbeanstalk:healthreporting:system",
                name="SystemType",
                value="enhanced"
            ),
            
            # Platform Configuration
            aws.elasticbeanstalk.EnvironmentSettingArgs(
                namespace="aws:elasticbeanstalk:container:python",
                name="WSGIPath",
                value="application.py"
            )
        ]
        
        self.environment = aws.elasticbeanstalk.Environment(
            f"eb-env-{self.region}",
            name=env_name,
            application=self.application.name,
            solution_stack_name="64bit Amazon Linux 2 v3.4.0 running Python 3.8",
            version_label=version_label,
            settings=settings,
            tags={
                **self.tags,
                "Name": env_name,
                "Type": "ElasticBeanstalkEnvironment"
            }
        )
        
        return self.environment
6. modules/monitoring.py
"""
CloudWatch monitoring and alerting module
"""
import pulumi
import pulumi_aws as aws
from typing import Dict, Any

class MonitoringStack:
    def __init__(self, region: str, tags: Dict[str, str]):
        self.region = region
        self.tags = tags
        
    def create_cloudwatch_alarms(self, environment_name: str, config: Dict[str, Any]):
        """Create CloudWatch alarms for monitoring"""
        
        # SNS Topic for alerts
        alert_topic = aws.sns.Topic(
            f"alerts-{self.region}",
            name=f"nova-alerts-{self.region}",
            tags={
                **self.tags,
                "Name": f"nova-alerts-{self.region}",
                "Type": "SNSTopic"
            }
        )
        
        # High CPU Utilization Alarm
        high_cpu_alarm = aws.cloudwatch.MetricAlarm(
            f"high-cpu-{self.region}",
            alarm_name=f"nova-high-cpu-{self.region}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="CPUUtilization",
            namespace="AWS/ElasticBeanstalk",
            period=300,
            statistic="Average",
            threshold=config.get("cpu_threshold_high", 70),
            alarm_description="High CPU utilization detected",
            alarm_actions=[alert_topic.arn],
            dimensions={
                "EnvironmentName": environment_name
            },
            tags={
                **self.tags,
                "Name": f"nova-high-cpu-{self.region}",
                "Type": "CloudWatchAlarm"
            }
        )
        
        # Application Health Alarm
        health_alarm = aws.cloudwatch.MetricAlarm(
            f"app-health-{self.region}",
            alarm_name=f"nova-app-health-{self.region}",
            comparison_operator="LessThanThreshold",
            evaluation_periods=2,
            metric_name="ApplicationRequestsTotal",
            namespace="AWS/ElasticBeanstalk",
            period=300,
            statistic="Sum",
            threshold=1,
            alarm_description="Application health check failure",
            alarm_actions=[alert_topic.arn],
            dimensions={
                "EnvironmentName": environment_name
            },
            tags={
                **self.tags,
                "Name": f"nova-app-health-{self.region}",
                "Type": "CloudWatchAlarm"
            }
        )
        
        return alert_topic, [high_cpu_alarm, health_alarm]
    
    def create_dashboard(self, environment_name: str):
        """Create CloudWatch dashboard"""
        dashboard_body = pulumi.Output.all().apply(lambda _: f"""{{
            "widgets": [
                {{
                    "type": "metric",
                    "x": 0,
                    "y": 0,
                    "width": 12,
                    "height": 6,
                    "properties": {{
                        "metrics": [
                            [ "AWS/ElasticBeanstalk", "CPUUtilization", "EnvironmentName", "{environment_name}" ],
                            [ ".", "NetworkIn", ".", "." ],
                            [ ".", "NetworkOut", ".", "." ]
                        ],
                        "period": 300,
                        "stat": "Average",
                        "region": "{self.region}",
                        "title": "EC2 Instance Metrics"
                    }}
                }},
                {{
                    "type": "metric",
                    "x": 0,
                    "y": 6,
                    "width": 12,
                    "height": 6,
                    "properties": {{
                        "metrics": [
                            [ "AWS/ElasticBeanstalk", "ApplicationRequestsTotal", "EnvironmentName", "{environment_name}" ],
                            [ ".", "ApplicationRequests2xx", ".", "." ],
                            [ ".", "ApplicationRequests4xx", ".", "." ],
                            [ ".", "ApplicationRequests5xx", ".", "." ]
                        ],
                        "period": 300,
                        "stat": "Sum",
                        "region": "{self.region}",
                        "title": "Application Requests"
                    }}
                }}
            ]
        }}""")
        
        dashboard = aws.cloudwatch.Dashboard(
            f"dashboard-{self.region}",
            dashboard_name=f"nova-dashboard-{self.region}",
            dashboard_body=dashboard_body,
            tags={
                **self.tags,
                "Name": f"nova-dashboard-{self.region}",
                "Type": "CloudWatchDashboard"
            }
        )
        
        return dashboard
7. main.py
"""
AWS Nova Model Breaking - Multi-Region Web Application Deployment
Infrastructure as Code using Pulumi Python for AWS GovCloud
"""

import pulumi
import pulumi_aws as aws
from modules.networking import NetworkingStack
from modules.elastic_beanstalk import ElasticBeanstalkStack
from modules.monitoring import MonitoringStack

# Configuration
config = pulumi.Config()
primary_region = config.get("primary-region", "us-gov-west-1")
secondary_region = config.get("secondary-region", "us-gov-east-1")
environment = config.get("environment", "production")
application_name = config.get("application-name", "nova-model-breaking")
instance_type = config.get("instance-type", "t3.medium")
min_capacity = config.get_int("min-capacity", 2)
max_capacity = config.get_int("max-capacity", 10)
cpu_threshold_high = config.get_int("cpu-threshold-high", 70)
cpu_threshold_low = config.get_int("cpu-threshold-low", 30)

# Common tags for all resources
common_tags = {
    "Project": "IaC-AWS-Nova-Model-Breaking",
    "Environment": environment,
    "ManagedBy": "Pulumi",
    "Compliance": "GovCloud",
    "Owner": "DevOps-Team",
    "CostCenter": "Engineering",
    "SecurityLevel": "High",
    "DataClassification": "Sensitive"
}

# Application configuration
app_config = {
    "instance_type": instance_type,
    "min_capacity": min_capacity,
    "max_capacity": max_capacity,
    "cpu_threshold_high": cpu_threshold_high,
    "cpu_threshold_low": cpu_threshold_low
}

def deploy_region(region: str, is_primary: bool = False):
    """Deploy infrastructure in a specific region"""
    
    # Create AWS provider for the region
    provider = aws.Provider(
        f"aws-{region}",
        region=region,
        profile=config.get("aws:profile", "govcloud")
    )
    
    # Networking Stack
    networking = NetworkingStack(region, common_tags)
    
    # Create VPC and networking components
    vpc = networking.create_vpc()
    igw = networking.create_internet_gateway()
    public_subnets, private_subnets = networking.create_subnets()
    networking.create_route_tables()
    
    # Elastic Beanstalk Stack
    eb_stack = ElasticBeanstalkStack(
        region=region,
        vpc_id=vpc.id,
        subnet_ids=[subnet.id for subnet in public_subnets],
        tags=common_tags
    )
    
    # Create Elastic Beanstalk application
    eb_app = eb_stack.create_application(application_name)
    
    # Create application version
    version_label = f"v1.0.0-{region}"
    app_version = eb_stack.create_application_version(version_label)
    
    # Create environment
    env_name = f"{application_name}-{environment}-{region}"
    eb_env = eb_stack.create_environment(env_name, version_label, app_config)
    
    # Monitoring Stack
    monitoring = MonitoringStack(region, common_tags)
    alert_topic, alarms = monitoring.create_cloudwatch_alarms(env_name, app_config)
    dashboard = monitoring.create_dashboard(env_name)
    
    # Route 53 Health Check (for primary region)
    health_check = None
    if is_primary:
        health_check = aws.route53.HealthCheck(
            f"health-check-{region}",
            fqdn=eb_env.endpoint_url.apply(lambda url: url.replace("http://", "").replace("https://", "")),
            port=80,
            type="HTTP",
            resource_path="/health",
            failure_threshold=3,
            request_interval=30,
            tags={
                **common_tags,
                "Name": f"nova-health-check-{region}",
                "Type": "Route53HealthCheck"
            },
            opts=pulumi.ResourceOptions(provider=provider)
        )
    
    return {
        "region": region,
        "vpc": vpc,
        "public_subnets": public_su

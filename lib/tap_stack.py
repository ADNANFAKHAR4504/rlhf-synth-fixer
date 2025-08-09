import pulumi
import pulumi_aws as aws
from typing import Dict, List, Optional, Any
import json
import base64

class TapStack:
    def __init__(self, project_name: str, regions: List[str] = None, config: Optional[Dict[str, Any]] = None):
        self.project_name = project_name
        self.regions = regions or ["us-east-1", "eu-west-1"]
        self.config = config or {}
        
        # Initialize storage for resources
        self.providers = {}
        self.vpcs = {}
        self.subnets = {}
        self.security_groups = {}
        self.load_balancers = {}
        self.auto_scaling_groups = {}
        self.s3_buckets = {}
        self.iam_roles = {}
        self.internet_gateways = {}
        self.route_tables = {}
        self.launch_templates = {}
        self.scaling_policies = {}
        self.cloudwatch_alarms = {}
        self.replication_config = {}
        
        # Validate inputs
        self._validate_inputs()
        
        # Initialize providers for each region
        self._setup_providers()
        
        # Create infrastructure components in order
        self._create_infrastructure()
        
    def _validate_inputs(self):
        """Validate input parameters"""
        if not self.project_name:
            raise ValueError("Project name cannot be empty")
        
        if not self.regions or len(self.regions) < 1:
            raise ValueError("At least one region must be specified")
        
        valid_regions = ['us-east-1', 'us-west-1', 'us-west-2', 'eu-west-1', 'eu-central-1', 'ap-southeast-1']
        for region in self.regions:
            if region not in valid_regions:
                raise ValueError(f"Invalid region: {region}")
    
    def _setup_providers(self):
        """Set up AWS providers for each region"""
        try:
            for region in self.regions:
                self.providers[region] = aws.Provider(
                    f"aws-{region.replace('-', '_')}",
                    region=region,
                    default_tags=aws.ProviderDefaultTagsArgs(
                        tags={
                            "Project": self.project_name,
                            "ManagedBy": "Pulumi",
                            "Environment": pulumi.get_stack()
                        }
                    )
                )
        except Exception as e:
            raise RuntimeError(f"Failed to setup providers: {str(e)}")
    
    def _create_infrastructure(self):
        """Create the complete infrastructure in proper order"""
        try:
            # Step 1: Create IAM roles (global resources)
            self._create_iam_roles()
            
            # Step 2: Create S3 buckets with cross-region replication
            self._create_s3_buckets()
            
            # Step 3: Create networking infrastructure
            self._create_networking()
            
            # Step 4: Create security groups
            self._create_security_groups()
            
            # Step 5: Create load balancers
            self._create_load_balancers()
            
            # Step 6: Create auto scaling groups
            self._create_auto_scaling_groups()
            
        except Exception as e:
            raise RuntimeError(f"Failed to create infrastructure: {str(e)}")
    
    def _create_s3_buckets(self):
        """Create S3 buckets with cross-region replication"""
        try:
            # Primary bucket in first region
            primary_region = self.regions[0]
            primary_bucket_name = f"{self.project_name}-primary-data-{pulumi.get_stack()}"
            
            primary_bucket = aws.s3.Bucket(
                "primary-data-bucket",
                bucket=primary_bucket_name,
                opts=pulumi.ResourceOptions(provider=self.providers[primary_region])
            )
            
            # Enable versioning on primary bucket
            primary_versioning = aws.s3.BucketVersioning(
                "primary-bucket-versioning",
                bucket=primary_bucket.id,
                versioning_configuration=aws.s3.BucketVersioningVersioningConfigurationArgs(
                    status="Enabled"
                ),
                opts=pulumi.ResourceOptions(provider=self.providers[primary_region])
            )
            
            self.s3_buckets["primary"] = primary_bucket
            
            # Create replica bucket if more than one region
            if len(self.regions) > 1:
                replica_region = self.regions[1]
                replica_bucket_name = f"{self.project_name}-replica-data-{pulumi.get_stack()}"
                
                replica_bucket = aws.s3.Bucket(
                    "replica-data-bucket",
                    bucket=replica_bucket_name,
                    opts=pulumi.ResourceOptions(provider=self.providers[replica_region])
                )
                
                # Enable versioning on replica bucket
                replica_versioning = aws.s3.BucketVersioning(
                    "replica-bucket-versioning",
                    bucket=replica_bucket.id,
                    versioning_configuration=aws.s3.BucketVersioningVersioningConfigurationArgs(
                        status="Enabled"
                    ),
                    opts=pulumi.ResourceOptions(provider=self.providers[replica_region])
                )
                
                self.s3_buckets["replica"] = replica_bucket
                
                # Create cross-region replication
                self._setup_s3_replication(primary_bucket, replica_bucket, primary_region)
                
        except Exception as e:
            raise RuntimeError(f"Failed to create S3 buckets: {str(e)}")
    
    def _setup_s3_replication(self, primary_bucket, replica_bucket, primary_region):
        """Set up S3 cross-region replication"""
        try:
            # Replication role
            replication_assume_role_policy = json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Principal": {"Service": "s3.amazonaws.com"},
                        "Action": "sts:AssumeRole"
                    }
                ]
            })
            
            replication_role = aws.iam.Role(
                "s3-replication-role",
                assume_role_policy=replication_assume_role_policy,
                opts=pulumi.ResourceOptions(provider=self.providers[primary_region])
            )
            
            # Replication policy
            replication_policy_doc = pulumi.Output.all(
                primary_bucket.arn,
                replica_bucket.arn
            ).apply(lambda arns: json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:GetObjectVersionForReplication",
                            "s3:GetObjectVersionAcl"
                        ],
                        "Resource": f"{arns[0]}/*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": ["s3:ListBucket"],
                        "Resource": arns
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:ReplicateObject",
                            "s3:ReplicateDelete"
                        ],
                        "Resource": f"{arns[1]}/*"
                    }
                ]
            }))
            
            replication_policy = aws.iam.RolePolicy(
                "s3-replication-policy",
                role=replication_role.id,
                policy=replication_policy_doc,
                opts=pulumi.ResourceOptions(provider=self.providers[primary_region])
            )
            
            # Replication configuration
            replication_config = aws.s3.BucketReplicationConfiguration(
                "bucket-replication",
                role=replication_role.arn,
                bucket=primary_bucket.id,
                rules=[aws.s3.BucketReplicationConfigurationRuleArgs(
                    id="replica-rule",
                    status="Enabled",
                    destination=aws.s3.BucketReplicationConfigurationRuleDestinationArgs(
                        bucket=replica_bucket.arn,
                        storage_class="STANDARD"
                    )
                )],
                opts=pulumi.ResourceOptions(
                    provider=self.providers[primary_region],
                    depends_on=[replication_policy]
                )
            )
            
            self.replication_config["role"] = replication_role
            self.replication_config["policy"] = replication_policy
            self.replication_config["config"] = replication_config
            
        except Exception as e:
            raise RuntimeError(f"Failed to setup S3 replication: {str(e)}")
    
    def _create_iam_roles(self):
        """Create IAM roles for EC2 instances"""
        try:
            for region in self.regions:
                # EC2 instance assume role policy
                assume_role_policy = json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Principal": {"Service": "ec2.amazonaws.com"},
                            "Action": "sts:AssumeRole"
                        }
                    ]
                })
                
                # Create instance role
                instance_role = aws.iam.Role(
                    f"ec2-instance-role-{region}",
                    name=f"{self.project_name}-ec2-role-{region}-{pulumi.get_stack()}",
                    assume_role_policy=assume_role_policy,
                    opts=pulumi.ResourceOptions(provider=self.providers[region])
                )
                
                # Attach CloudWatch policy
                cloudwatch_policy_attachment = aws.iam.RolePolicyAttachment(
                    f"ec2-cloudwatch-policy-{region}",
                    role=instance_role.name,
                    policy_arn="arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy",
                    opts=pulumi.ResourceOptions(provider=self.providers[region])
                )
                
                # Attach SSM policy
                ssm_policy_attachment = aws.iam.RolePolicyAttachment(
                    f"ec2-ssm-policy-{region}",
                    role=instance_role.name,
                    policy_arn="arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore",
                    opts=pulumi.ResourceOptions(provider=self.providers[region])
                )
                
                # Create instance profile
                instance_profile = aws.iam.InstanceProfile(
                    f"ec2-instance-profile-{region}",
                    name=f"{self.project_name}-ec2-profile-{region}-{pulumi.get_stack()}",
                    role=instance_role.name,
                    opts=pulumi.ResourceOptions(provider=self.providers[region])
                )
                
                self.iam_roles[region] = {
                    "role": instance_role,
                    "profile": instance_profile,
                    "cloudwatch_policy": cloudwatch_policy_attachment,
                    "ssm_policy": ssm_policy_attachment
                }
                
        except Exception as e:
            raise RuntimeError(f"Failed to create IAM roles: {str(e)}")
    
    def _create_networking(self):
        """Create VPC and networking components"""
        try:
            for region in self.regions:
                # Create VPC
                vpc = aws.ec2.Vpc(
                    f"vpc-{region}",
                    cidr_block="10.0.0.0/16",
                    enable_dns_hostnames=True,
                    enable_dns_support=True,
                    tags={"Name": f"{self.project_name}-vpc-{region}"},
                    opts=pulumi.ResourceOptions(provider=self.providers[region])
                )
                
                # Create Internet Gateway
                igw = aws.ec2.InternetGateway(
                    f"igw-{region}",
                    vpc_id=vpc.id,
                    tags={"Name": f"{self.project_name}-igw-{region}"},
                    opts=pulumi.ResourceOptions(provider=self.providers[region])
                )
                
                # Get availability zones
                azs = aws.get_availability_zones(
                    state="available",
                    opts=pulumi.InvokeOptions(provider=self.providers[region])
                )
                
                # Create subnets across multiple AZs
                subnets = []
                max_subnets = min(3, len(azs.names))
                
                for i in range(max_subnets):
                    subnet = aws.ec2.Subnet(
                        f"subnet-{region}-{i}",
                        vpc_id=vpc.id,
                        cidr_block=f"10.0.{i+1}.0/24",
                        availability_zone=azs.names[i],
                        map_public_ip_on_launch=True,
                        tags={"Name": f"{self.project_name}-subnet-{region}-{i}"},
                        opts=pulumi.ResourceOptions(provider=self.providers[region])
                    )
                    subnets.append(subnet)
                
                # Create route table
                route_table = aws.ec2.RouteTable(
                    f"rt-{region}",
                    vpc_id=vpc.id,
                    routes=[aws.ec2.RouteTableRouteArgs(
                        cidr_block="0.0.0.0/0",
                        gateway_id=igw.id
                    )],
                    tags={"Name": f"{self.project_name}-rt-{region}"},
                    opts=pulumi.ResourceOptions(provider=self.providers[region])
                )
                
                # Associate subnets with route table
                for i, subnet in enumerate(subnets):
                    aws.ec2.RouteTableAssociation(
                        f"rta-{region}-{i}",
                        subnet_id=subnet.id,
                        route_table_id=route_table.id,
                        opts=pulumi.ResourceOptions(provider=self.providers[region])
                    )
                
                self.vpcs[region] = vpc
                self.subnets[region] = subnets
                self.internet_gateways[region] = igw
                self.route_tables[region] = route_table
                
        except Exception as e:
            raise RuntimeError(f"Failed to create networking: {str(e)}")
    
    def _create_security_groups(self):
        """Create security groups with proper rules"""
        try:
            for region in self.regions:
                vpc = self.vpcs[region]
                
                # ALB Security Group
                alb_sg = aws.ec2.SecurityGroup(
                    f"alb-sg-{region}",
                    name=f"{self.project_name}-alb-sg-{region}",
                    description="Security group for Application Load Balancer",
                    vpc_id=vpc.id,
                    ingress=[
                        aws.ec2.SecurityGroupIngressArgs(
                            from_port=80,
                            to_port=80,
                            protocol="tcp",
                            cidr_blocks=["0.0.0.0/0"],
                            description="HTTP traffic"
                        ),
                        aws.ec2.SecurityGroupIngressArgs(
                            from_port=443,
                            to_port=443,
                            protocol="tcp",
                            cidr_blocks=["0.0.0.0/0"],
                            description="HTTPS traffic"
                        )
                    ],
                    egress=[aws.ec2.SecurityGroupEgressArgs(
                        from_port=0,
                        to_port=0,
                        protocol="-1",
                        cidr_blocks=["0.0.0.0/0"]
                    )],
                    tags={"Name": f"{self.project_name}-alb-sg-{region}"},
                    opts=pulumi.ResourceOptions(provider=self.providers[region])
                )
                
                # EC2 Security Group
                ec2_sg = aws.ec2.SecurityGroup(
                    f"ec2-sg-{region}",
                    name=f"{self.project_name}-ec2-sg-{region}",
                    description="Security group for EC2 instances",
                    vpc_id=vpc.id,
                    ingress=[
                        aws.ec2.SecurityGroupIngressArgs(
                            from_port=80,
                            to_port=80,
                            protocol="tcp",
                            security_groups=[alb_sg.id],
                            description="HTTP from ALB"
                        ),
                        aws.ec2.SecurityGroupIngressArgs(
                            from_port=443,
                            to_port=443,
                            protocol="tcp",
                            security_groups=[alb_sg.id],
                            description="HTTPS from ALB"
                        ),
                        aws.ec2.SecurityGroupIngressArgs(
                            from_port=22,
                            to_port=22,
                            protocol="tcp",
                            cidr_blocks=["10.0.0.0/16"],
                            description="SSH from VPC"
                        )
                    ],
                    egress=[aws.ec2.SecurityGroupEgressArgs(
                        from_port=0,
                        to_port=0,
                        protocol="-1",
                        cidr_blocks=["0.0.0.0/0"]
                    )],
                    tags={"Name": f"{self.project_name}-ec2-sg-{region}"},
                    opts=pulumi.ResourceOptions(provider=self.providers[region])
                )
                
                self.security_groups[region] = {
                    "alb": alb_sg,
                    "ec2": ec2_sg
                }
                
        except Exception as e:
            raise RuntimeError(f"Failed to create security groups: {str(e)}")
    
    def _create_load_balancers(self):
        """Create Application Load Balancers"""
        try:
            for region in self.regions:
                subnets = self.subnets[region]
                vpc = self.vpcs[region]
                alb_sg = self.security_groups[region]["alb"]
                
                # Application Load Balancer
                alb = aws.lb.LoadBalancer(
                    f"alb-{region}",
                    name=f"{self.project_name}-alb-{region}",
                    load_balancer_type="application",
                    security_groups=[alb_sg.id],
                    subnets=[subnet.id for subnet in subnets],
                    enable_deletion_protection=False,
                    tags={"Name": f"{self.project_name}-alb-{region}"},
                    opts=pulumi.ResourceOptions(provider=self.providers[region])
                )
                
                # Target Group with health checks
                target_group = aws.lb.TargetGroup(
                    f"tg-{region}",
                    name=f"{self.project_name}-tg-{region}",
                    port=80,
                    protocol="HTTP",
                    vpc_id=vpc.id,
                    target_type="instance",
                    health_check=aws.lb.TargetGroupHealthCheckArgs(
                        enabled=True,
                        healthy_threshold=2,
                        unhealthy_threshold=2,
                        timeout=5,
                        interval=30,
                        path="/health",
                        matcher="200",
                        protocol="HTTP",
                        port="traffic-port"
                    ),
                    tags={"Name": f"{self.project_name}-tg-{region}"},
                    opts=pulumi.ResourceOptions(provider=self.providers[region])
                )
                
                # Listener
                listener = aws.lb.Listener(
                    f"listener-{region}",
                    load_balancer_arn=alb.arn,
                    port="80",
                    protocol="HTTP",
                    default_actions=[aws.lb.ListenerDefaultActionArgs(
                        type="forward",
                        target_group_arn=target_group.arn
                    )],
                    opts=pulumi.ResourceOptions(provider=self.providers[region])
                )
                
                self.load_balancers[region] = {
                    "alb": alb,
                    "target_group": target_group,
                    "listener": listener
                }
                
        except Exception as e:
            raise RuntimeError(f"Failed to create load balancers: {str(e)}")
    
    def _get_user_data_script(self, region: str) -> str:
        """Generate user data script for EC2 instances"""
        return f"""#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd

# Create health check endpoint
echo "OK" > /var/www/html/health

# Create index page with region and instance info
cat <<EOF > /var/www/html/index.html
<!DOCTYPE html>
<html>
<head>
    <title>{self.project_name} - {region}</title>
</head>
<body>
    <h1>Welcome to {self.project_name}</h1>
    <p>Region: {region}</p>
    <p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>
    <p>Availability Zone: $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)</p>
    <p>Timestamp: $(date)</p>
</body>
</html>
EOF

# Install and configure CloudWatch agent
yum install -y amazon-cloudwatch-agent
cat <<EOF > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
{{
    "metrics": {{
        "namespace": "AWS/EC2",
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
    }}
}}
EOF

# Start CloudWatch agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s

# Configure log rotation
echo '/var/log/httpd/*.log {{
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 644 apache apache
    postrotate
        systemctl reload httpd
    endscript
}}' > /etc/logrotate.d/httpd
"""
    
    def _create_auto_scaling_groups(self):
        """Create Auto Scaling Groups with launch templates"""
        try:
            for region in self.regions:
                # Get latest Amazon Linux 2 AMI
                ami = aws.ec2.get_ami(
                    most_recent=True,
                    owners=["amazon"],
                    filters=[
                        aws.ec2.GetAmiFilterArgs(
                            name="name",
                            values=["amzn2-ami-hvm-*-x86_64-gp2"]
                        )
                    ],
                    opts=pulumi.InvokeOptions(provider=self.providers[region])
                )
                
                # Create launch template
                user_data_script = self._get_user_data_script(region)
                encoded_user_data = base64.b64encode(user_data_script.encode()).decode()
                
                launch_template = aws.ec2.LaunchTemplate(
                    f"lt-{region}",
                    name=f"{self.project_name}-lt-{region}",
                    description=f"Launch template for {self.project_name} in {region}",
                    image_id=ami.id,
                    instance_type=self.config.get("instance_type", "t3.micro"),
                    iam_instance_profile=aws.ec2.LaunchTemplateIamInstanceProfileArgs(
                        name=self.iam_roles[region]["profile"].name
                    ),
                    vpc_security_group_ids=[self.security_groups[region]["ec2"].id],
                    user_data=encoded_user_data,
                    monitoring=aws.ec2.LaunchTemplateMonitoringArgs(enabled=True),
                    metadata_options=aws.ec2.LaunchTemplateMetadataOptionsArgs(
                        http_endpoint="enabled",
                        http_tokens="required",
                        http_put_response_hop_limit=2
                    ),
                    tags={"Name": f"{self.project_name}-lt-{region}"},
                    opts=pulumi.ResourceOptions(provider=self.providers[region])
                )
                
                # Create Auto Scaling Group
                min_size = self.config.get("min_size", 3)
                max_size = self.config.get("max_size", 9)
                desired_capacity = self.config.get("desired_capacity", 3)
                
                asg = aws.autoscaling.Group(
                    f"asg-{region}",
                    name=f"{self.project_name}-asg-{region}",
                    vpc_zone_identifiers=[subnet.id for subnet in self.subnets[region]],
                    target_group_arns=[self.load_balancers[region]["target_group"].arn],
                    health_check_type="ELB",
                    health_check_grace_period=300,
                    min_size=min_size,
                    max_size=max_size,
                    desired_capacity=desired_capacity,
                    default_cooldown=60,  # Quick recovery
                    launch_template=aws.autoscaling.GroupLaunchTemplateArgs(
                        id=launch_template.id,
                        version="$Latest"
                    ),
                    tags=[
                        aws.autoscaling.GroupTagArgs(
                            key="Name",
                            value=f"{self.project_name}-instance-{region}",
                            propagate_at_launch=True
                        ),
                        aws.autoscaling.GroupTagArgs(
                            key="Project",
                            value=self.project_name,
                            propagate_at_launch=True
                        )
                    ],
                    opts=pulumi.ResourceOptions(provider=self.providers[region])
                )
                
                # Create scaling policies
                scale_up_policy = aws.autoscaling.Policy(
                    f"scale-up-{region}",
                    name=f"{self.project_name}-scale-up-{region}",
                    scaling_adjustment=1,
                    adjustment_type="ChangeInCapacity",
                    cooldown=60,
                    autoscaling_group_name=asg.name,
                    policy_type="SimpleScaling",
                    opts=pulumi.ResourceOptions(provider=self.providers[region])
                )
                
                scale_down_policy = aws.autoscaling.Policy(
                    f"scale-down-{region}",
                    name=f"{self.project_name}-scale-down-{region}",
                    scaling_adjustment=-1,
                    adjustment_type="ChangeInCapacity",
                    cooldown=60,
                    autoscaling_group_name=asg.name,
                    policy_type="SimpleScaling",
                    opts=pulumi.ResourceOptions(provider=self.providers[region])
                )
                
                # Create CloudWatch alarms
                cpu_high_alarm = aws.cloudwatch.MetricAlarm(
                    f"cpu-high-{region}",
                    alarm_name=f"{self.project_name}-cpu-high-{region}",
                    comparison_operator="GreaterThanThreshold",
                    evaluation_periods="2",
                    metric_name="CPUUtilization",
                    namespace="AWS/EC2",
                    period="60",
                    statistic="Average",
                    threshold="70.0",
                    alarm_description=f"High CPU utilization for {self.project_name} in {region}",
                    alarm_actions=[scale_up_policy.arn],
                    dimensions={"AutoScalingGroupName": asg.name},
                    tags={"Project": self.project_name},
                    opts=pulumi.ResourceOptions(provider=self.providers[region])
                )
                
                cpu_low_alarm = aws.cloudwatch.MetricAlarm(
                    f"cpu-low-{region}",
                    alarm_name=f"{self.project_name}-cpu-low-{region}",
                    comparison_operator="LessThanThreshold",
                    evaluation_periods="2",
                    metric_name="CPUUtilization",
                    namespace="AWS/EC2",
                    period="60",
                    statistic="Average",
                    threshold="10.0",
                    alarm_description=f"Low CPU utilization for {self.project_name} in {region}",
                    alarm_actions=[scale_down_policy.arn],
                    dimensions={"AutoScalingGroupName": asg.name},
                    tags={"Project": self.project_name},
                    opts=pulumi.ResourceOptions(provider=self.providers[region])
                )
                
                # Store resources
                self.launch_templates[region] = launch_template
                self.auto_scaling_groups[region] = {
                    "asg": asg,
                    "launch_template": launch_template
                }
                self.scaling_policies[region] = {
                    "scale_up": scale_up_policy,
                    "scale_down": scale_down_policy
                }
                self.cloudwatch_alarms[region] = {
                    "cpu_high": cpu_high_alarm,
                    "cpu_low": cpu_low_alarm
                }
                
        except Exception as e:
            raise RuntimeError(f"Failed to create auto scaling groups: {str(e)}")
    
    def get_resource_count(self) -> Dict[str, int]:
        """Get count of created resources for testing"""
        return {
            "providers": len(self.providers),
            "vpcs": len(self.vpcs),
            "subnets": sum(len(subnets) for subnets in self.subnets.values()),
            "security_groups": sum(len(sg) for sg in self.security_groups.values()),
            "load_balancers": len(self.load_balancers),
            "auto_scaling_groups": len(self.auto_scaling_groups),
            "s3_buckets": len(self.s3_buckets),
            "iam_roles": len(self.iam_roles),
            "scaling_policies": sum(len(policies) for policies in self.scaling_policies.values()),
            "cloudwatch_alarms": sum(len(alarms) for alarms in self.cloudwatch_alarms.values())
        }
    
    def get_outputs(self) -> Dict[str, Any]:
        """Return stack outputs"""
        outputs = {}
        
        try:
            # Load balancer outputs
            for region in self.regions:
                if region in self.load_balancers:
                    region_key = region.replace('-', '_')
                    outputs[f"alb_dns_{region_key}"] = self.load_balancers[region]["alb"].dns_name
                    outputs[f"alb_zone_id_{region_key}"] = self.load_balancers[region]["alb"].zone_id
                    outputs[f"alb_arn_{region_key}"] = self.load_balancers[region]["alb"].arn
            
            # S3 bucket outputs
            if "primary" in self.s3_buckets:
                outputs["primary_s3_bucket"] = self.s3_buckets["primary"].bucket
                outputs["primary_s3_bucket_arn"] = self.s3_buckets["primary"].arn
            
            if "replica" in self.s3_buckets:
                outputs["replica_s3_bucket"] = self.s3_buckets["replica"].bucket
                outputs["replica_s3_bucket_arn"] = self.s3_buckets["replica"].arn
            
            # VPC outputs
            for region in self.regions:
                if region in self.vpcs:
                    region_key = region.replace('-', '_')
                    outputs[f"vpc_id_{region_key}"] = self.vpcs[region].id
            
            # Resource counts
            outputs["resource_counts"] = self.get_resource_count()
            
        except Exception as e:
            raise RuntimeError(f"Failed to generate outputs: {str(e)}")
        
        return outputs

    def validate_infrastructure(self) -> Dict[str, bool]:
        """Validate that infrastructure meets requirements"""
        validation_results = {}
        
        try:
            # Validate multi-region deployment
            validation_results["multi_region_deployment"] = len(self.regions) >= 2
            
            # Validate minimum instances per region
            validation_results["minimum_instances"] = all(
                "asg" in self.auto_scaling_groups.get(region, {})
                for region in self.regions
            )
            
            # Validate multi-AZ deployment
            validation_results["multi_az_deployment"] = all(
                len(self.subnets.get(region, [])) >= 2
                for region in self.regions
            )
            
            # Validate S3 cross-region replication
            validation_results["s3_replication"] = (
                len(self.s3_buckets) >= 2 and
                "config" in self.replication_config
            )
            
            # Validate load balancers
            validation_results["load_balancers"] = all(
                "alb" in self.load_balancers.get(region, {})
                for region in self.regions
            )
            
            # Validate security groups
            validation_results["security_groups"] = all(
                len(self.security_groups.get(region, {})) >= 2
                for region in self.regions
            )
            
            # Validate IAM roles
            validation_results["iam_roles"] = all(
                "role" in self.iam_roles.get(region, {})
                for region in self.regions
            )
            
            # Overall validation
            validation_results["overall"] = all(validation_results.values())
            
        except Exception as e:
            validation_results["error"] = str(e)
            validation_results["overall"] = False
        
        return validation_results


def create_stack(project_name: str = None, regions: List[str] = None, config: Dict[str, Any] = None):
    """Factory function to create TapStack"""
    if not project_name:
        project_name = pulumi.get_project()
    
    stack = TapStack(project_name, regions, config)
    
    # Export outputs
    outputs = stack.get_outputs()
    for key, value in outputs.items():
        pulumi.export(key, value)
    
    # Export validation results
    validation = stack.validate_infrastructure()
    pulumi.export("validation_results", validation)
    
    return stack

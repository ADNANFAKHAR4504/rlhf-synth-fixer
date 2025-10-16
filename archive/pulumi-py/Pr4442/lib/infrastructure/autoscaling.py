import pulumi
import pulumi_aws as aws

from .config import WebAppConfig


class AutoScalingStack:
    """Auto Scaling Group with Application Load Balancer and health checks."""
    
    def __init__(self, config: WebAppConfig, provider: aws.Provider):
        self.config = config
        self.provider = provider
        self.vpc, self.subnet1, self.subnet2 = self._create_vpc_and_subnets()
        self.subnets = pulumi.Output.all([self.subnet1.id, self.subnet2.id])
        self.security_group = self._create_security_group()
        self.load_balancer = self._create_load_balancer()
        self.target_group = self._create_target_group()
        self.load_balancer_listener = self._create_load_balancer_listener()
        self.auto_scaling_group = None
    
    def _create_vpc_and_subnets(self):
        """Create VPC and subnets for the web application."""
        # Create VPC
        vpc = aws.ec2.Vpc(
            "webapp-vpc",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                **self.config.get_common_tags(),
                "Name": self.config.get_tag_name("vpc")
            },
            opts=pulumi.ResourceOptions(provider=self.provider)
        )
        
        # Create internet gateway
        igw = aws.ec2.InternetGateway(
            "webapp-igw",
            vpc_id=vpc.id,
            tags={
                **self.config.get_common_tags(),
                "Name": self.config.get_tag_name("igw")
            },
            opts=pulumi.ResourceOptions(provider=self.provider)
        )
        
        # Create subnets in different AZs
        subnet1 = aws.ec2.Subnet(
            "webapp-subnet-1",
            vpc_id=vpc.id,
            cidr_block="10.0.1.0/24",
            availability_zone=f"{self.config.region}a",
            map_public_ip_on_launch=True,
            tags={
                **self.config.get_common_tags(),
                "Name": self.config.get_tag_name("subnet-1")
            },
            opts=pulumi.ResourceOptions(provider=self.provider)
        )
        
        subnet2 = aws.ec2.Subnet(
            "webapp-subnet-2", 
            vpc_id=vpc.id,
            cidr_block="10.0.2.0/24",
            availability_zone=f"{self.config.region}b",
            map_public_ip_on_launch=True,
            tags={
                **self.config.get_common_tags(),
                "Name": self.config.get_tag_name("subnet-2")
            },
            opts=pulumi.ResourceOptions(provider=self.provider)
        )
        
        # Create route table and routes
        route_table = aws.ec2.RouteTable(
            "webapp-rt",
            vpc_id=vpc.id,
            tags={
                **self.config.get_common_tags(),
                "Name": self.config.get_tag_name("rt")
            },
            opts=pulumi.ResourceOptions(provider=self.provider)
        )
        
        # Route to internet gateway
        aws.ec2.Route(
            "webapp-route",
            route_table_id=route_table.id,
            destination_cidr_block="0.0.0.0/0",
            gateway_id=igw.id,
            opts=pulumi.ResourceOptions(provider=self.provider)
        )
        
        # Associate subnets with route table
        aws.ec2.RouteTableAssociation(
            "webapp-rta-1",
            subnet_id=subnet1.id,
            route_table_id=route_table.id,
            opts=pulumi.ResourceOptions(provider=self.provider)
        )
        
        aws.ec2.RouteTableAssociation(
            "webapp-rta-2",
            subnet_id=subnet2.id,
            route_table_id=route_table.id,
            opts=pulumi.ResourceOptions(provider=self.provider)
        )
        
        return vpc, subnet1, subnet2
    
    def _create_security_group(self) -> aws.ec2.SecurityGroup:
        """Create security group for load balancer and EC2 instances."""
        return aws.ec2.SecurityGroup(
            "webapp-sg",
            name=self.config.get_tag_name("webapp-sg"),
            description="Security group for web application",
            vpc_id=self.vpc,
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=80,
                    to_port=80,
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow HTTP access"
                ),
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=443,
                    to_port=443,
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow HTTPS access"
                ),
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=22,
                    to_port=22,
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow SSH access"
                )
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all egress"
                )
            ],
            tags=self.config.get_common_tags(),
            opts=pulumi.ResourceOptions(provider=self.provider)
        )
    
    def _create_load_balancer(self) -> aws.lb.LoadBalancer:
        """Create Application Load Balancer."""
        return aws.lb.LoadBalancer(
            "webapp-alb",
            name=self.config.lb_name,
            load_balancer_type="application",
            security_groups=[self.security_group.id],
            subnets=[self.subnet1.id, self.subnet2.id],
            enable_deletion_protection=False,
            tags=self.config.get_common_tags(),
            opts=pulumi.ResourceOptions(provider=self.provider)
        )
    
    def _create_target_group(self) -> aws.lb.TargetGroup:
        """Create target group for load balancer."""
        return aws.lb.TargetGroup(
            "webapp-tg",
            name=self.config.target_group_name,
            port=80,
            protocol="HTTP",
            vpc_id=self.vpc,
            health_check=aws.lb.TargetGroupHealthCheckArgs(
                enabled=True,
                healthy_threshold=2,
                interval=30,
                matcher="200",
                path="/",
                port="traffic-port",
                protocol="HTTP",
                timeout=5,
                unhealthy_threshold=2
            ),
            tags=self.config.get_common_tags(),
            opts=pulumi.ResourceOptions(provider=self.provider)
        )
    
    def _create_load_balancer_listener(self) -> aws.lb.Listener:
        """Create load balancer listener."""
        return aws.lb.Listener(
            "webapp-alb-listener",
            load_balancer_arn=self.load_balancer.arn,
            port=80,
            protocol="HTTP",
            default_actions=[aws.lb.ListenerDefaultActionArgs(
                type="forward",
                target_group_arn=self.target_group.arn
            )],
            opts=pulumi.ResourceOptions(provider=self.provider)
        )
    
    def create_auto_scaling_group(self, launch_template_id: pulumi.Output[str]) -> None:
        """Create Auto Scaling Group with launch template."""
        self.auto_scaling_group = aws.autoscaling.Group(
            "webapp-asg",
            name=self.config.asg_name,
            vpc_zone_identifiers=[self.subnet1.id, self.subnet2.id],
            target_group_arns=[self.target_group.arn],
            health_check_type="ELB",
            health_check_grace_period=300,
            min_size=self.config.min_size,
            max_size=self.config.max_size,
            desired_capacity=self.config.desired_capacity,
            launch_template=aws.autoscaling.GroupLaunchTemplateArgs(
                id=launch_template_id,
                version="$Latest"
            ),
            tags=[aws.autoscaling.GroupTagArgs(
                key="Name",
                value=self.config.get_tag_name("asg-instance"),
                propagate_at_launch=True
            )],
            opts=pulumi.ResourceOptions(provider=self.provider)
        )
    
    def get_load_balancer_dns_name(self) -> pulumi.Output[str]:
        """Get load balancer DNS name."""
        return self.load_balancer.dns_name
    
    def get_load_balancer_arn(self) -> pulumi.Output[str]:
        """Get load balancer ARN."""
        return self.load_balancer.arn
    
    def get_target_group_arn(self) -> pulumi.Output[str]:
        """Get target group ARN."""
        return self.target_group.arn
    
    def get_auto_scaling_group_name(self) -> pulumi.Output[str]:
        """Get Auto Scaling Group name."""
        if self.auto_scaling_group is None:
            return pulumi.Output.from_input("")
        return self.auto_scaling_group.name

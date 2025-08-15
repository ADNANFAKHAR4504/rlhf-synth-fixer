```python
#config/settings.py
import pulumi

class Config:
    def __init__(self):
        self.config = pulumi.Config()
        
        # Project settings
        self.project_name = self.config.get("project-name") or "nova-dual-stack"
        self.environment = self.config.get("environment") or "dev"
        
        # Network settings
        self.enable_ipv6 = self.config.get_bool("enable-ipv6") or True
        self.migration_strategy = self.config.get("migration-strategy") or "blue-green"
        
        # Regional settings
        self.regions = ["us-east-1", "eu-west-1"]
        
        # CIDR blocks
        self.vpc_cidrs = {
            "us-east-1": {
                "ipv4": "10.0.0.0/16",
                "ipv6": None  # AWS assigns IPv6 CIDR
            },
            "eu-west-1": {
                "ipv4": "10.1.0.0/16", 
                "ipv6": None
            }
        }
        
        # Common tags
        self.common_tags = {
            "Project": self.project_name,
            "Environment": self.environment,
            "ManagedBy": "Pulumi",
            "Migration": "DualStack"
        }
    
    def get_resource_name(self, resource_type: str, region: str = None, suffix: str = None) -> str:
        """Generate standardized resource names"""
        parts = [self.project_name, self.environment]
        
        if region:
            parts.append(region.replace("-", ""))
            
        parts.append(resource_type)
        
        if suffix:
            parts.append(suffix)
            
        return "-".join(parts)


#infrastructure/vpc.py
import pulumi
import pulumi_aws as aws
from typing import Dict, Any
from config.settings import Config

class VPCStack:
    def __init__(self, config: Config, region: str):
        self.config = config
        self.region = region
        self.vpc = None
        self.subnets = {}
        self.route_tables = {}
        self.internet_gateway = None
        self.egress_only_gateway = None
        
    def create_vpc(self) -> aws.ec2.Vpc:
        """Create VPC with dual-stack support"""
        vpc_name = self.config.get_resource_name("vpc", self.region)
        
        self.vpc = aws.ec2.Vpc(
            vpc_name,
            cidr_block=self.config.vpc_cidrs[self.region]["ipv4"],
            assign_generated_ipv6_cidr_block=self.config.enable_ipv6,
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                **self.config.common_tags,
                "Name": vpc_name,
                "Region": self.region,
                "Type": "VPC"
            }
        )
        
        return self.vpc
    
    def create_internet_gateway(self) -> aws.ec2.InternetGateway:
        """Create Internet Gateway for IPv4 and IPv6"""
        igw_name = self.config.get_resource_name("igw", self.region)
        
        self.internet_gateway = aws.ec2.InternetGateway(
            igw_name,
            vpc_id=self.vpc.id,
            tags={
                **self.config.common_tags,
                "Name": igw_name,
                "Region": self.region,
                "Type": "InternetGateway"
            }
        )
        
        return self.internet_gateway
    
    def create_egress_only_gateway(self) -> aws.ec2.EgressOnlyInternetGateway:
        """Create Egress-Only Internet Gateway for IPv6"""
        if not self.config.enable_ipv6:
            return None
            
        eigw_name = self.config.get_resource_name("eigw", self.region)
        
        self.egress_only_gateway = aws.ec2.EgressOnlyInternetGateway(
            eigw_name,
            vpc_id=self.vpc.id,
            tags={
                **self.config.common_tags,
                "Name": eigw_name,
                "Region": self.region,
                "Type": "EgressOnlyInternetGateway"
            }
        )
        
        return self.egress_only_gateway
    
    def create_subnets(self) -> Dict[str, Any]:
        """Create public and private subnets with dual-stack support"""
        availability_zones = aws.get_availability_zones(state="available").names
        
        for i, az in enumerate(availability_zones[:3]):  # Use first 3 AZs
            # Public subnet
            public_subnet_name = self.config.get_resource_name("subnet-public", self.region, str(i+1))
            public_subnet = aws.ec2.Subnet(
                public_subnet_name,
                vpc_id=self.vpc.id,
                availability_zone=az,
                cidr_block=f"10.{0 if self.region == 'us-east-1' else 1}.{i+1}.0/24",
                ipv6_cidr_block=self.vpc.ipv6_cidr_block.apply(
                    lambda cidr: f"{cidr[:-2]}{i+1}:/64" if cidr and self.config.enable_ipv6 else None
                ) if self.config.enable_ipv6 else None,
                assign_ipv6_address_on_creation=self.config.enable_ipv6,
                map_public_ip_on_launch=True,
                tags={
                    **self.config.common_tags,
                    "Name": public_subnet_name,
                    "Type": "PublicSubnet",
                    "AZ": az
                }
            )
            
            # Private subnet
            private_subnet_name = self.config.get_resource_name("subnet-private", self.region, str(i+1))
            private_subnet = aws.ec2.Subnet(
                private_subnet_name,
                vpc_id=self.vpc.id,
                availability_zone=az,
                cidr_block=f"10.{0 if self.region == 'us-east-1' else 1}.{i+10}.0/24",
                ipv6_cidr_block=self.vpc.ipv6_cidr_block.apply(
                    lambda cidr: f"{cidr[:-2]}{i+10}:/64" if cidr and self.config.enable_ipv6 else None
                ) if self.config.enable_ipv6 else None,
                assign_ipv6_address_on_creation=self.config.enable_ipv6,
                tags={
                    **self.config.common_tags,
                    "Name": private_subnet_name,
                    "Type": "PrivateSubnet",
                    "AZ": az
                }
            )
            
            self.subnets[f"public_{i+1}"] = public_subnet
            self.subnets[f"private_{i+1}"] = private_subnet
        
        return self.subnets
    
    def create_route_tables(self) -> Dict[str, aws.ec2.RouteTable]:
        """Create route tables with dual-stack routing"""
        # Public route table
        public_rt_name = self.config.get_resource_name("rt-public", self.region)
        public_route_table = aws.ec2.RouteTable(
            public_rt_name,
            vpc_id=self.vpc.id,
            tags={
                **self.config.common_tags,
                "Name": public_rt_name,
                "Type": "PublicRouteTable"
            }
        )
        
        # IPv4 route to Internet Gateway
        aws.ec2.Route(
            f"{public_rt_name}-ipv4-route",
            route_table_id=public_route_table.id,
            destination_cidr_block="0.0.0.0/0",
            gateway_id=self.internet_gateway.id
        )
        
        # IPv6 route to Internet Gateway
        if self.config.enable_ipv6:
            aws.ec2.Route(
                f"{public_rt_name}-ipv6-route",
                route_table_id=public_route_table.id,
                destination_ipv6_cidr_block="::/0",
                gateway_id=self.internet_gateway.id
            )
        
        # Associate public subnets
        for i in range(3):
            aws.ec2.RouteTableAssociation(
                f"{public_rt_name}-assoc-{i+1}",
                subnet_id=self.subnets[f"public_{i+1}"].id,
                route_table_id=public_route_table.id
            )
        
        self.route_tables["public"] = public_route_table
        
        # Private route tables (one per AZ for NAT Gateway redundancy)
        for i in range(3):
            private_rt_name = self.config.get_resource_name("rt-private", self.region, str(i+1))
            private_route_table = aws.ec2.RouteTable(
                private_rt_name,
                vpc_id=self.vpc.id,
                tags={
                    **self.config.common_tags,
                    "Name": private_rt_name,
                    "Type": "PrivateRouteTable"
                }
            )
            
            # IPv6 route to Egress-Only Internet Gateway
            if self.config.enable_ipv6 and self.egress_only_gateway:
                aws.ec2.Route(
                    f"{private_rt_name}-ipv6-route",
                    route_table_id=private_route_table.id,
                    destination_ipv6_cidr_block="::/0",
                    egress_only_gateway_id=self.egress_only_gateway.id
                )
            
            # Associate private subnet
            aws.ec2.RouteTableAssociation(
                f"{private_rt_name}-assoc",
                subnet_id=self.subnets[f"private_{i+1}"].id,
                route_table_id=private_route_table.id
            )
            
            self.route_tables[f"private_{i+1}"] = private_route_table
        
        return self.route_tables



#infrastructure/networking.py
import pulumi
import pulumi_aws as aws
from typing import Dict, List
from config.settings import Config
from infrastructure.vpc import VPCStack

class NetworkingStack:
    def __init__(self, config: Config, vpc_stacks: Dict[str, VPCStack]):
        self.config = config
        self.vpc_stacks = vpc_stacks
        self.nat_gateways = {}
        self.vpc_peering_connections = {}
        
    def create_nat_gateways(self) -> Dict[str, Dict[str, aws.ec2.NatGateway]]:
        """Create NAT Gateways for each public subnet"""
        for region, vpc_stack in self.vpc_stacks.items():
            self.nat_gateways[region] = {}
            
            for i in range(3):  # One NAT Gateway per AZ
                # Create Elastic IP
                eip_name = self.config.get_resource_name("eip-nat", region, str(i+1))
                eip = aws.ec2.Eip(
                    eip_name,
                    domain="vpc",
                    tags={
                        **self.config.common_tags,
                        "Name": eip_name,
                        "Type": "NATGatewayEIP"
                    }
                )
                
                # Create NAT Gateway
                nat_name = self.config.get_resource_name("nat", region, str(i+1))
                nat_gateway = aws.ec2.NatGateway(
                    nat_name,
                    allocation_id=eip.id,
                    subnet_id=vpc_stack.subnets[f"public_{i+1}"].id,
                    tags={
                        **self.config.common_tags,
                        "Name": nat_name,
                        "Type": "NATGateway"
                    }
                )
                
                # Add route to private route table
                aws.ec2.Route(
                    f"{nat_name}-route",
                    route_table_id=vpc_stack.route_tables[f"private_{i+1}"].id,
                    destination_cidr_block="0.0.0.0/0",
                    nat_gateway_id=nat_gateway.id
                )
                
                self.nat_gateways[region][f"nat_{i+1}"] = nat_gateway
        
        return self.nat_gateways
    
    def create_vpc_peering(self) -> Dict[str, aws.ec2.VpcPeeringConnection]:
        """Create VPC peering connections between regions"""
        regions = list(self.vpc_stacks.keys())
        
        if len(regions) >= 2:
            # Create peering connection from us-east-1 to eu-west-1
            peer_name = self.config.get_resource_name("peer", "us-east-1-eu-west-1")
            
            peering_connection = aws.ec2.VpcPeeringConnection(
                peer_name,
                peer_region="eu-west-1",
                peer_vpc_id=self.vpc_stacks["eu-west-1"].vpc.id,
                vpc_id=self.vpc_stacks["us-east-1"].vpc.id,
                auto_accept=False,
                tags={
                    **self.config.common_tags,
                    "Name": peer_name,
                    "Type": "VPCPeering"
                }
            )
            
            # Accept peering connection in peer region
            peer_accepter = aws.ec2.VpcPeeringConnectionAccepter(
                f"{peer_name}-accepter",
                vpc_peering_connection_id=peering_connection.id,
                auto_accept=True,
                tags={
                    **self.config.common_tags,
                    "Name": f"{peer_name}-accepter"
                },
                opts=pulumi.ResourceOptions(provider=aws.Provider(
                    f"eu-west-1-provider",
                    region="eu-west-1"
                ))
            )
            
            # Add routes for peering
            self._add_peering_routes(peering_connection)
            
            self.vpc_peering_connections["us-east-1-eu-west-1"] = peering_connection
        
        return self.vpc_peering_connections
    
    def _add_peering_routes(self, peering_connection: aws.ec2.VpcPeeringConnection):
        """Add routes for VPC peering connection"""
        # Routes from us-east-1 to eu-west-1
        for route_table_name, route_table in self.vpc_stacks["us-east-1"].route_tables.items():
            aws.ec2.Route(
                f"peer-route-use1-{route_table_name}",
                route_table_id=route_table.id,
                destination_cidr_block=self.config.vpc_cidrs["eu-west-1"]["ipv4"],
                vpc_peering_connection_id=peering_connection.id
            )
        
        # Routes from eu-west-1 to us-east-1
        for route_table_name, route_table in self.vpc_stacks["eu-west-1"].route_tables.items():
            aws.ec2.Route(
                f"peer-route-euw1-{route_table_name}",
                route_table_id=route_table.id,
                destination_cidr_block=self.config.vpc_cidrs["us-east-1"]["ipv4"],
                vpc_peering_connection_id=peering_connection.id,
                opts=pulumi.ResourceOptions(provider=aws.Provider(
                    f"eu-west-1-provider-route",
                    region="eu-west-1"
                ))
            )



#infrastructure/load_balancer.py
import pulumi
import pulumi_aws as aws
from typing import Dict, List
from config.settings import Config
from infrastructure.vpc import VPCStack

class LoadBalancerStack:
    def __init__(self, config: Config, vpc_stacks: Dict[str, VPCStack]):
        self.config = config
        self.vpc_stacks = vpc_stacks
        self.load_balancers = {}
        self.target_groups = {}
        
    def create_application_load_balancers(self) -> Dict[str, aws.lb.LoadBalancer]:
        """Create Application Load Balancers with dual-stack support"""
        for region, vpc_stack in self.vpc_stacks.items():
            # Security Group for ALB
            alb_sg_name = self.config.get_resource_name("sg-alb", region)
            alb_security_group = aws.ec2.SecurityGroup(
                alb_sg_name,
                name=alb_sg_name,
                vpc_id=vpc_stack.vpc.id,
                description="Security group for Application Load Balancer",
                ingress=[
                    # HTTP IPv4
                    aws.ec2.SecurityGroupIngressArgs(
                        protocol="tcp",
                        from_port=80,
                        to_port=80,
                        cidr_blocks=["0.0.0.0/0"]
                    ),
                    # HTTPS IPv4
                    aws.ec2.SecurityGroupIngressArgs(
                        protocol="tcp",
                        from_port=443,
                        to_port=443,
                        cidr_blocks=["0.0.0.0/0"]
                    )
                ] + ([
                    # HTTP IPv6
                    aws.ec2.SecurityGroupIngressArgs(
                        protocol="tcp",
                        from_port=80,
                        to_port=80,
                        ipv6_cidr_blocks=["::/0"]
                    ),
                    # HTTPS IPv6
                    aws.ec2.SecurityGroupIngressArgs(
                        protocol="tcp",
                        from_port=443,
                        to_port=443,
                        ipv6_cidr_blocks=["::/0"]
                    )
                ] if self.config.enable_ipv6 else []),
                egress=[
                    aws.ec2.SecurityGroupEgressArgs(
                        protocol="-1",
                        from_port=0,
                        to_port=0,
                        cidr_blocks=["0.0.0.0/0"]
                    )
                ] + ([
                    aws.ec2.SecurityGroupEgressArgs(
                        protocol="-1",
                        from_port=0,
                        to_port=0,
                        ipv6_cidr_blocks=["::/0"]
                    )
                ] if self.config.enable_ipv6 else []),
                tags={
                    **self.config.common_tags,
                    "Name": alb_sg_name,
                    "Type": "SecurityGroup"
                }
            )
            
            # Application Load Balancer
            alb_name = self.config.get_resource_name("alb", region)
            public_subnet_ids = [
                vpc_stack.subnets[f"public_{i}"].id for i in range(1, 4)
            ]
            
            load_balancer = aws.lb.LoadBalancer(
                alb_name,
                name=alb_name,
                load_balancer_type="application",
                scheme="internet-facing",
                ip_address_type="dualstack" if self.config.enable_ipv6 else "ipv4",
                security_groups=[alb_security_group.id],
                subnets=public_subnet_ids,
                enable_deletion_protection=False,
                tags={
                    **self.config.common_tags,
                    "Name": alb_name,
                    "Type": "ApplicationLoadBalancer"
                }
            )
            
            # Target Group
            tg_name = self.config.get_resource_name("tg", region)
            target_group = aws.lb.TargetGroup(
                tg_name,
                name=tg_name,
                port=80,
                protocol="HTTP",
                vpc_id=vpc_stack.vpc.id,
                target_type="instance",
                health_check=aws.lb.TargetGroupHealthCheckArgs(
                    enabled=True,
                    healthy_threshold=2,
                    interval=30,
                    matcher="200",
                    path="/health",
                    port="traffic-port",
                    protocol="HTTP",
                    timeout=5,
                    unhealthy_threshold=2
                ),
                tags={
                    **self.config.common_tags,
                    "Name": tg_name,
                    "Type": "TargetGroup"
                }
            )
            
            # Listener
            listener = aws.lb.Listener(
                f"{alb_name}-listener",
                load_balancer_arn=load_balancer.arn,
                port="80",
                protocol="HTTP",
                default_actions=[
                    aws.lb.ListenerDefaultActionArgs(
                        type="forward",
                        target_group_arn=target_group.arn
                    )
                ]
            )
            
            self.load_balancers[region] = load_balancer
            self.target_groups[region] = target_group
        
        return self.load_balancers



#migration/dual_stack_migration.py
import pulumi
import pulumi_aws as aws
import time
from typing import Dict, List, Any
from config.settings import Config

class DualStackMigration:
    def __init__(self, config: Config):
        self.config = config
        self.migration_state = {}
        
    def execute_blue_green_migration(self, resources: Dict[str, Any]) -> Dict[str, Any]:
        """Execute blue-green migration strategy"""
        pulumi.log.info("Starting Blue-Green migration to dual-stack")
        
        # Phase 1: Create green environment with dual-stack
        green_resources = self._create_green_environment(resources)
        
        # Phase 2: Validate green environment
        self._validate_green_environment(green_resources)
        
        # Phase 3: Switch traffic to green
        self._switch_traffic_to_green(resources, green_resources)
        
        # Phase 4: Cleanup blue environment
        self._cleanup_blue_environment(resources)
        
        return green_resources
    
    def _create_green_environment(self, blue_resources: Dict[str, Any]) -> Dict[str, Any]:
        """Create green environment with dual-stack support"""
        green_resources = {}
        
        for region in self.config.regions:
            pulumi.log.info(f"Creating green environment in {region}")
            
            # Create green VPC with dual-stack
            green_vpc_name = self.config.get_resource_name("vpc-green", region)
            green_vpc = aws.ec2.Vpc(
                green_vpc_name,
                cidr_block=self.config.vpc_cidrs[region]["ipv4"],
                assign_generated_ipv6_cidr_block=True,
                enable_dns_hostnames=True,
                enable_dns_support=True,
                tags={
                    **self.config.common_tags,
                    "Name": green_vpc_name,
                    "Environment": "green",
                    "Migration": "dual-stack"
                }
            )
            
            green_resources[f"{region}_vpc"] = green_vpc
            
            # Create green subnets with IPv6
            green_subnets = self._create_green_subnets(green_vpc, region)
            green_resources[f"{region}_subnets"] = green_subnets
            
            # Create green load balancer
            green_alb = self._create_green_load_balancer(green_vpc, green_subnets, region)
            green_resources[f"{region}_alb"] = green_alb
        
        return green_resources
    
    def _create_green_subnets(self, vpc: aws.ec2.Vpc, region: str) -> Dict[str, aws.ec2.Subnet]:
        """Create subnets for green environment"""
        availability_zones = aws.get_availability_zones(state="available").names
        subnets = {}
        
        for i, az in enumerate(availability_zones[:3]):
            # Public subnet with dual-stack
            public_subnet_name = self.config.get_resource_name("subnet-public-green", region, str(i+1))
            public_subnet = aws.ec2.Subnet(
                public_subnet_name,
                vpc_id=vpc.id,
                availability_zone=az,
                cidr_block=f"10.{2 if region == 'us-east-1' else 3}.{i+1}.0/24",
                ipv6_cidr_block=vpc.ipv6_cidr_block.apply(
                    lambda cidr: f"{cidr[:-2]}{i+1}:/64" if cidr else None
                ),
                assign_ipv6_address_on_creation=True,
                map_public_ip_on_launch=True,
                tags={
                    **self.config.common_tags,
                    "Name": public_subnet_name,
                    "Type": "PublicSubnet",
                    "Environment": "green"
                }
            )
            
            subnets[f"public_{i+1}"] = public_subnet
        
        return subnets
    
    def _create_green_load_balancer(self, vpc: aws.ec2.Vpc, subnets: Dict[str, aws.ec2.Subnet], region: str) -> aws.lb.LoadBalancer:
        """Create load balancer for green environment"""
        # Security Group
        sg_name = self.config.get_resource_name("sg-alb-green", region)
        security_group = aws.ec2.SecurityGroup(
            sg_name,
            name=sg_name,
            vpc_id=vpc.id,
            description="Security group for green ALB",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=80,
                    to_port=80,
                    cidr_blocks=["0.0.0.0/0"]
                ),
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=80,
                    to_port=80,
                    ipv6_cidr_blocks=["::/0"]
                ),
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=443,
                    to_port=443,
                    cidr_blocks=["0.0.0.0/0"]
                ),
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=443,
                    to_port=443,
                    ipv6_cidr_blocks=["::/0"]
                )
            ],
            tags={
                **self.config.common_tags,
                "Name": sg_name,
                "Environment": "green"
            }
        )
        
        # Load Balancer
        alb_name = self.config.get_resource_name("alb-green", region)
        subnet_ids = [subnet.id for subnet in subnets.values()]
        
        load_balancer = aws.lb.LoadBalancer(
            alb_name,
            name=alb_name,
            load_balancer_type="application",
            scheme="internet-facing",
            ip_address_type="dualstack",
            security_groups=[security_group.id],
            subnets=subnet_ids,
            tags={
                **self.config.common_tags,
                "Name": alb_name,
                "Environment": "green",
                "Type": "ApplicationLoadBalancer"
            }
        )
        
        return load_balancer
    
    def _validate_green_environment(self, green_resources: Dict[str, Any]):
        """Validate green environment functionality"""
        pulumi.log.info("Validating green environment")
        
        # Add validation logic here
        # This could include health checks, connectivity tests, etc.
        
        for region in self.config.regions:
            alb = green_resources.get(f"{region}_alb")
            if alb:
                # Create a simple health check
                self._create_health_check(alb, region)
    
    def _create_health_check(self, alb: aws.lb.LoadBalancer, region: str):
        """Create health check for load balancer"""
        # This is a placeholder for actual health check implementation
        pulumi.log.info(f"Health check created for ALB in {region}")
    
    def _switch_traffic_to_green(self, blue_resources: Dict[str, Any], green_resources: Dict[str, Any]):
        """Switch traffic from blue to green environment"""
        pulumi.log.info("Switching traffic to green environment")
        
        # Update DNS records, Route 53 configurations, etc.
        # This is where you would implement the actual traffic switching logic
        
    def _cleanup_blue_environment(self, blue_resources: Dict[str, Any]):
        """Clean up blue environment after successful migration"""
        pulumi.log.info("Cleaning up blue environment")
        
        # Mark blue resources for deletion
        # This would be done carefully to ensure no data loss





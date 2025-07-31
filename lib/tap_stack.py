from constructs import Construct
from cdktf import TerraformStack, TerraformOutput, Token
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.route_table import RouteTable
from cdktf_cdktf_provider_aws.route_table_association import RouteTableAssociation
from cdktf_cdktf_provider_aws.route import Route
from cdktf_cdktf_provider_aws.instance import Instance
from cdktf_cdktf_provider_aws.security_group import SecurityGroup, SecurityGroupIngress
from cdktf_cdktf_provider_aws.data_aws_ami import DataAwsAmi

class TapStack(TerraformStack):
    def __init__(
        self,
        scope: Construct,
        id: str,
        environment_suffix: str,
        state_bucket: str,
        state_bucket_region: str,
        aws_region: str,
        default_tags: dict,
    ):
        super().__init__(scope, id)

        AwsProvider(self, "Aws", region=aws_region, default_tags=default_tags)

        # VPC
        vpc = Vpc(self, "MainVPC",
            cidr_block="10.0.0.0/16",
            enable_dns_support=True,
            enable_dns_hostnames=True,
            tags={"Name": f"main-vpc-{environment_suffix}"}
        )

        # Internet Gateway
        igw = InternetGateway(self, "IGW",
            vpc_id=vpc.id,
            tags={"Name": f"igw-{environment_suffix}"}
        )

        # Route Table
        route_table = RouteTable(self, "RouteTable",
            vpc_id=vpc.id,
            tags={"Name": f"route-table-{environment_suffix}"}
        )

        Route(self, "DefaultRoute",
            route_table_id=route_table.id,
            destination_cidr_block="0.0.0.0/0",
            gateway_id=igw.id
        )

        # Subnets
        subnet1 = Subnet(self, "PublicSubnet1",
            vpc_id=vpc.id,
            cidr_block="10.0.1.0/24",
            availability_zone=f"{aws_region}a",
            map_public_ip_on_launch=True,
            tags={"Name": f"public-subnet-1-{environment_suffix}"}
        )

        subnet2 = Subnet(self, "PublicSubnet2",
            vpc_id=vpc.id,
            cidr_block="10.0.2.0/24",
            availability_zone=f"{aws_region}b",
            map_public_ip_on_launch=True,
            tags={"Name": f"public-subnet-2-{environment_suffix}"}
        )

        # Associate Subnets with Route Table
        RouteTableAssociation(self, "RTA1",
            subnet_id=subnet1.id,
            route_table_id=route_table.id
        )

        RouteTableAssociation(self, "RTA2",
            subnet_id=subnet2.id,
            route_table_id=route_table.id
        )

        # Security Group
        sg = SecurityGroup(self, "WebSG",
            vpc_id=vpc.id,
            name=f"web-sg-{environment_suffix}",
            description="Allow HTTP and SSH",
            ingress=[
                SecurityGroupIngress(
                    from_port=22,
                    to_port=22,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"]
                ),
                SecurityGroupIngress(
                    from_port=80,
                    to_port=80,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            egress=[{
                "from_port": 0,
                "to_port": 0,
                "protocol": "-1",
                "cidr_blocks": ["0.0.0.0/0"]
            }],
            tags={"Name": f"web-sg-{environment_suffix}"}
        )

        # Use latest Amazon Linux 2 AMI
        ami = DataAwsAmi(self, "AmazonLinux",
            most_recent=True,
            owners=["amazon"],
            filter=[{
                "name": "name",
                "values": ["amzn2-ami-hvm-*-x86_64-gp2"]
            }]
        )

        # EC2 Instances
        for i, subnet in enumerate([subnet1, subnet2], start=1):
            Instance(self, f"WebInstance{i}",
                ami=Token().as_string(ami.id),
                instance_type="t2.micro",
                subnet_id=subnet.id,
                vpc_security_group_ids=[sg.id],
                associate_public_ip_address=True,
                tags={"Name": f"web-instance-{i}-{environment_suffix}"}
            )

        # Outputs
        TerraformOutput(self, "vpc_id", value=vpc.id)
        TerraformOutput(self, "public_subnet_1", value=subnet1.id)
        TerraformOutput(self, "public_subnet_2", value=subnet2.id)
        TerraformOutput(self, "security_group_id", value=sg.id)
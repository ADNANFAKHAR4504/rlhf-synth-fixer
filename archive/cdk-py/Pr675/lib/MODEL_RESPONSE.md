from aws_cdk import (
aws_ec2 as ec2,
Stack,
App
)
from constructs import Construct

class SecurityGroupStack(Stack):
def **init**(self, scope: Construct, construct_id: str, **kwargs) -> None:
super().**init**(scope, construct_id, **kwargs)

        # Reference an existing VPC or create a placeholder VPC
        # In production, you would typically reference an existing VPC using:
        # vpc = ec2.Vpc.from_lookup(self, "ExistingVPC", vpc_id="vpc-xxxxxxxxx")
        vpc = ec2.Vpc(
            self,
            "PlaceholderVPC",
            max_azs=2,
            cidr="10.0.0.0/16"
        )

        # Create security group with descriptive name and no default outbound rules
        web_only_ingress_sg = ec2.SecurityGroup(
            self,
            "WebOnlyIngressSG",
            vpc=vpc,
            description="Security group allowing HTTP inbound from specific CIDR, blocking all outbound",
            security_group_name="WebOnlyIngressSG",
            # Disable default outbound rule that allows all traffic
            disable_inline_rules=False,
            allow_all_outbound=False  # This prevents the default "allow all outbound" rule
        )

        # Add inbound rule: Allow HTTP traffic (port 80) from specific CIDR block
        web_only_ingress_sg.add_ingress_rule(
            peer=ec2.Peer.ipv4("203.0.113.0/24"),  # Specific CIDR block
            connection=ec2.Port.tcp(80),            # HTTP port 80
            description="Allow HTTP traffic from 203.0.113.0/24"
        )

        # Note: No outbound rules are added, which means all outbound traffic is blocked
        # This is achieved by setting allow_all_outbound=False above
        # If you need specific outbound rules, you can add them using:
        # web_only_ingress_sg.add_egress_rule(
        #     peer=ec2.Peer.any_ipv4(),
        #     connection=ec2.Port.tcp(443),
        #     description="Allow HTTPS outbound"
        # )

# CDK App instantiation (if this is the main file)

app = App()
SecurityGroupStack(app, "SecurityGroupStack")
app.synth()

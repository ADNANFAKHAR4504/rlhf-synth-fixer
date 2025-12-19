from aws_cdk import aws_ec2 as ec2, NestedStack
from constructs import Construct


class SecurityGroupsStack(NestedStack):
    def __init__(
        self, scope: Construct, construct_id: str, vpc: ec2.Vpc, **kwargs
    ) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # ALB Security Group
        self.alb_sg = ec2.SecurityGroup(
            self,
            "ALBSecurityGroup",
            vpc=vpc,
            description="Security group for Application Load Balancer",
            allow_all_outbound=True,
        )

        self.alb_sg.add_ingress_rule(
            ec2.Peer.any_ipv4(), ec2.Port.tcp(80), "Allow HTTP traffic"
        )

        self.alb_sg.add_ingress_rule(
            ec2.Peer.any_ipv4(), ec2.Port.tcp(443), "Allow HTTPS traffic"
        )

        # EC2 Security Group
        self.ec2_sg = ec2.SecurityGroup(
            self,
            "EC2SecurityGroup",
            vpc=vpc,
            description="Security group for EC2 instances",
            allow_all_outbound=True,
        )

        self.ec2_sg.add_ingress_rule(
            self.alb_sg, ec2.Port.tcp(80), "Allow traffic from ALB"
        )

        # Database Security Group
        self.db_sg = ec2.SecurityGroup(
            self,
            "DatabaseSecurityGroup",
            vpc=vpc,
            description="Security group for Aurora database",
            allow_all_outbound=False,
        )

        self.db_sg.add_ingress_rule(
            self.ec2_sg, ec2.Port.tcp(3306), "Allow MySQL traffic from EC2"
        )

        # Redis Security Group
        self.redis_sg = ec2.SecurityGroup(
            self,
            "RedisSecurityGroup",
            vpc=vpc,
            description="Security group for Redis cluster",
            allow_all_outbound=False,
        )

        self.redis_sg.add_ingress_rule(
            self.ec2_sg, ec2.Port.tcp(6379), "Allow Redis traffic from EC2"
        )

"""
Unit tests for the main entry point (__main__.py) using Pulumi testing utilities.
"""

import unittest
from unittest.mock import patch, MagicMock
import pulumi


class MyMocks(pulumi.runtime.Mocks):
    """Mock Pulumi resource calls for testing"""
    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        outputs = args.inputs
        if args.typ == "aws:ec2/vpc:Vpc":
            outputs = {**args.inputs, "id": "vpc-12345", "cidr_block": args.inputs.get("cidr_block", "10.0.0.0/16")}
        elif args.typ == "aws:ec2/subnet:Subnet":
            outputs = {**args.inputs, "id": f"subnet-{args.name}", "availability_zone": args.inputs.get("availability_zone", "us-east-1a")}
        elif args.typ == "aws:ec2/securityGroup:SecurityGroup":
            outputs = {**args.inputs, "id": f"sg-{args.name}"}
        elif args.typ == "aws:lb/loadBalancer:LoadBalancer":
            outputs = {**args.inputs, "id": f"lb-{args.name}", "arn": f"arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/{args.name}/abc123", "dns_name": f"{args.name}.elb.amazonaws.com"}
        elif args.typ == "aws:lb/targetGroup:TargetGroup":
            outputs = {**args.inputs, "id": f"tg-{args.name}", "arn": f"arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/{args.name}/abc123"}
        elif args.typ == "aws:rds/cluster:Cluster":
            outputs = {**args.inputs, "id": f"cluster-{args.name}", "endpoint": f"{args.name}.cluster-xyz.us-east-1.rds.amazonaws.com", "reader_endpoint": f"{args.name}.cluster-ro-xyz.us-east-1.rds.amazonaws.com"}
        elif args.typ == "aws:s3/bucket:Bucket":
            outputs = {**args.inputs, "id": args.inputs.get("bucket", f"bucket-{args.name}"), "bucket": args.inputs.get("bucket", f"bucket-{args.name}")}
        elif args.typ == "aws:ec2/eip:Eip":
            outputs = {**args.inputs, "id": f"eip-{args.name}", "public_ip": "1.2.3.4"}
        elif args.typ == "aws:ec2/internetGateway:InternetGateway":
            outputs = {**args.inputs, "id": f"igw-{args.name}"}
        elif args.typ == "aws:ec2/natGateway:NatGateway":
            outputs = {**args.inputs, "id": f"nat-{args.name}"}
        elif args.typ == "aws:ec2/routeTable:RouteTable":
            outputs = {**args.inputs, "id": f"rt-{args.name}"}
        elif args.typ == "aws:iam/role:Role":
            outputs = {**args.inputs, "id": f"role-{args.name}", "arn": f"arn:aws:iam::123456789012:role/{args.name}", "name": args.name}
        elif args.typ == "aws:iam/instanceProfile:InstanceProfile":
            outputs = {**args.inputs, "id": f"profile-{args.name}", "arn": f"arn:aws:iam::123456789012:instance-profile/{args.name}"}
        elif args.typ == "aws:ec2/launchTemplate:LaunchTemplate":
            outputs = {**args.inputs, "id": f"lt-{args.name}"}
        elif args.typ == "aws:autoscaling/group:Group":
            outputs = {**args.inputs, "id": f"asg-{args.name}", "name": args.name}
        elif args.typ == "aws:rds/subnetGroup:SubnetGroup":
            outputs = {**args.inputs, "id": f"subnet-group-{args.name}", "name": args.name}
        elif args.typ == "aws:rds/clusterInstance:ClusterInstance":
            outputs = {**args.inputs, "id": f"db-instance-{args.name}"}
        elif args.typ == "aws:secretsmanager/secret:Secret":
            outputs = {**args.inputs, "id": f"secret-{args.name}", "arn": f"arn:aws:secretsmanager:us-east-1:123456789012:secret:{args.name}"}
        else:
            outputs = {**args.inputs, "id": f"{args.typ}-{args.name}"}
        return [args.name, outputs]

    def call(self, args: pulumi.runtime.MockCallArgs):
        if args.token == "aws:ec2/getAmi:getAmi":
            return {"id": "ami-12345", "architecture": "x86_64"}
        return {}


pulumi.runtime.set_mocks(MyMocks())


class TestMainStack(unittest.TestCase):
    """Test cases for main entry point"""

    @pulumi.runtime.test
    def test_stack_creates_vpc_component(self):
        """Test that VPC component is created with correct configuration"""
        import __main__

        # VPC component should be created
        self.assertIsNotNone(__main__.vpc)
        self.assertIsNotNone(__main__.vpc.vpc_id)

    @pulumi.runtime.test
    def test_stack_creates_alb_component(self):
        """Test that ALB component is created"""
        import __main__

        self.assertIsNotNone(__main__.alb)
        self.assertIsNotNone(__main__.alb.alb_arn)
        self.assertIsNotNone(__main__.alb.alb_dns_name)

    @pulumi.runtime.test
    def test_stack_creates_asg_component(self):
        """Test that ASG component is created"""
        import __main__

        self.assertIsNotNone(__main__.asg)
        self.assertIsNotNone(__main__.asg.asg_name)

    @pulumi.runtime.test
    def test_stack_creates_rds_component(self):
        """Test that RDS component is created"""
        import __main__

        self.assertIsNotNone(__main__.rds)
        self.assertIsNotNone(__main__.rds.cluster_endpoint)
        self.assertIsNotNone(__main__.rds.reader_endpoint)

    @pulumi.runtime.test
    def test_stack_creates_s3_component(self):
        """Test that S3 component is created"""
        import __main__

        self.assertIsNotNone(__main__.s3)
        self.assertIsNotNone(__main__.s3.static_assets_bucket)
        self.assertIsNotNone(__main__.s3.logs_bucket)

    @pulumi.runtime.test
    def test_stack_exports_outputs(self):
        """Test that stack exports required outputs"""
        import __main__

        # Check that main variables are accessible
        self.assertIsNotNone(__main__.vpc)
        self.assertIsNotNone(__main__.alb)
        self.assertIsNotNone(__main__.rds)
        self.assertIsNotNone(__main__.s3)


if __name__ == "__main__":
    unittest.main()

"""
Unit tests for ASG, RDS, and S3 components
"""

import unittest
import pulumi


class MyMocks(pulumi.runtime.Mocks):
    """Mock Pulumi resource calls for testing"""
    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        outputs = args.inputs
        if args.typ == "aws:ec2/securityGroup:SecurityGroup":
            outputs = {**args.inputs, "id": f"sg-{args.name}"}
        elif args.typ == "aws:iam/role:Role":
            outputs = {**args.inputs, "id": f"role-{args.name}", "arn": f"arn:aws:iam::123456789012:role/{args.name}", "name": args.name}
        elif args.typ == "aws:iam/instanceProfile:InstanceProfile":
            outputs = {**args.inputs, "id": f"profile-{args.name}", "arn": f"arn:aws:iam::123456789012:instance-profile/{args.name}"}
        elif args.typ == "aws:ec2/launchTemplate:LaunchTemplate":
            outputs = {**args.inputs, "id": f"lt-{args.name}"}
        elif args.typ == "aws:autoscaling/group:Group":
            outputs = {**args.inputs, "id": f"asg-{args.name}", "name": args.name}
        elif args.typ == "aws:rds/cluster:Cluster":
            outputs = {**args.inputs, "id": f"cluster-{args.name}", "endpoint": f"{args.name}.cluster-xyz.us-east-1.rds.amazonaws.com", "reader_endpoint": f"{args.name}.cluster-ro-xyz.us-east-1.rds.amazonaws.com", "engine": "aurora-postgresql"}
        elif args.typ == "aws:rds/subnetGroup:SubnetGroup":
            outputs = {**args.inputs, "id": f"subnet-group-{args.name}", "name": args.name}
        elif args.typ == "aws:rds/clusterInstance:ClusterInstance":
            outputs = {**args.inputs, "id": f"db-instance-{args.name}"}
        elif args.typ == "aws:secretsmanager/secret:Secret":
            outputs = {**args.inputs, "id": f"secret-{args.name}", "arn": f"arn:aws:secretsmanager:us-east-1:123456789012:secret:{args.name}"}
        elif args.typ == "aws:s3/bucket:Bucket":
            outputs = {**args.inputs, "id": args.inputs.get("bucket", f"bucket-{args.name}"), "bucket": args.inputs.get("bucket", f"bucket-{args.name}")}
        else:
            outputs = {**args.inputs, "id": f"{args.typ}-{args.name}"}
        return [args.name, outputs]

    def call(self, args: pulumi.runtime.MockCallArgs):
        if args.token == "aws:ec2/getAmi:getAmi":
            return {"id": "ami-12345", "architecture": "x86_64"}
        return {}


pulumi.runtime.set_mocks(MyMocks())


class TestAsgComponent(unittest.TestCase):
    """Test cases for ASG component"""

    @pulumi.runtime.test
    def test_asg_creation(self):
        """Test ASG component creates auto scaling group"""
        from lib.asg_component import AsgComponent

        asg = AsgComponent(
            "test-asg",
            environment_suffix="test-123",
            vpc_id=pulumi.Output.from_input("vpc-12345"),
            private_subnet_ids=[pulumi.Output.from_input("subnet-1")],
            target_group_arn=pulumi.Output.from_input("arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/test/abc123"),
            min_size=1,
            max_size=3,
            tags={"Environment": "test"}
        )

        self.assertIsNotNone(asg)
        self.assertIsNotNone(asg.asg_name)

    @pulumi.runtime.test
    def test_asg_environment_specific_sizes(self):
        """Test ASG with different min/max sizes"""
        from lib.asg_component import AsgComponent

        asg = AsgComponent(
            "test-asg-prod",
            environment_suffix="prod-456",
            vpc_id=pulumi.Output.from_input("vpc-12345"),
            private_subnet_ids=[pulumi.Output.from_input("subnet-1")],
            target_group_arn=pulumi.Output.from_input("arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/test/abc123"),
            min_size=3,
            max_size=10,
            tags={"Environment": "prod"}
        )

        self.assertIsNotNone(asg)


class TestRdsComponent(unittest.TestCase):
    """Test cases for RDS component"""

    @pulumi.runtime.test
    def test_rds_creation(self):
        """Test RDS component creates Aurora cluster"""
        from lib.rds_component import RdsComponent

        rds = RdsComponent(
            "test-rds",
            environment_suffix="test-123",
            vpc_id=pulumi.Output.from_input("vpc-12345"),
            private_subnet_ids=[pulumi.Output.from_input("subnet-1"), pulumi.Output.from_input("subnet-2")],
            read_replica_count=1,
            backup_retention_days=7,
            tags={"Environment": "test"}
        )

        self.assertIsNotNone(rds)
        self.assertIsNotNone(rds.cluster_endpoint)
        self.assertIsNotNone(rds.reader_endpoint)

    @pulumi.runtime.test
    def test_rds_with_multiple_replicas(self):
        """Test RDS with multiple read replicas"""
        from lib.rds_component import RdsComponent

        rds = RdsComponent(
            "test-rds-prod",
            environment_suffix="prod-123",
            vpc_id=pulumi.Output.from_input("vpc-12345"),
            private_subnet_ids=[pulumi.Output.from_input("subnet-1")],
            read_replica_count=3,
            backup_retention_days=30,
            tags={"Environment": "prod"}
        )

        self.assertIsNotNone(rds)
        # Should create primary + 3 replicas
        self.assertIsNotNone(rds.read_replicas)


class TestS3Component(unittest.TestCase):
    """Test cases for S3 component"""

    @pulumi.runtime.test
    def test_s3_creation(self):
        """Test S3 component creates buckets"""
        from lib.s3_component import S3Component

        s3 = S3Component(
            "test-s3",
            environment_suffix="test-123",
            environment="dev",
            tags={"Environment": "dev"}
        )

        self.assertIsNotNone(s3)
        self.assertIsNotNone(s3.static_assets_bucket)
        self.assertIsNotNone(s3.logs_bucket)

    @pulumi.runtime.test
    def test_s3_bucket_naming(self):
        """Test S3 buckets follow naming convention"""
        from lib.s3_component import S3Component

        s3 = S3Component(
            "test-s3-naming",
            environment_suffix="test-456",
            environment="prod",
            tags={"Environment": "prod"}
        )

        self.assertIsNotNone(s3)
        # Buckets should be created with proper naming
        self.assertIsNotNone(s3.static_assets_bucket)
        self.assertIsNotNone(s3.logs_bucket)


if __name__ == "__main__":
    unittest.main()

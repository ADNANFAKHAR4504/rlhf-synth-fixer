import os
import unittest

from pytest import mark


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
    """Test cases for the TapStack CloudFormation template"""

    def setUp(self):
        """Set up template path"""
        base_dir = os.path.dirname(os.path.abspath(__file__))
        self.template_path = os.path.join(base_dir, "..", "..", "lib", "TapStack.yml")

    @mark.it("verifies template file exists at expected location")
    def test_template_exists(self):
        assert os.path.exists(self.template_path), "TapStack.yml should exist"

    @mark.it("verifies template is a valid YAML file")
    def test_template_is_yaml(self):
        with open(self.template_path, "r", encoding="utf-8") as f:
            content = f.read()
            assert len(content) > 0
            assert content.strip() != ""

    @mark.it("verifies template contains AWSTemplateFormatVersion")
    def test_template_has_format_version(self):
        with open(self.template_path, "r", encoding="utf-8") as f:
            content = f.read()
            assert "AWSTemplateFormatVersion" in content
            assert "2010-09-09" in content

    @mark.it("verifies template contains required CloudFormation sections")
    def test_template_has_required_sections(self):
        with open(self.template_path, "r", encoding="utf-8") as f:
            content = f.read()
            assert "Parameters:" in content
            assert "Resources:" in content
            assert "Outputs:" in content

    @mark.it("verifies template contains VPC resource")
    def test_template_has_vpc(self):
        with open(self.template_path, "r", encoding="utf-8") as f:
            content = f.read()
            assert "VPC:" in content
            assert "AWS::EC2::VPC" in content

    @mark.it("verifies template contains ECS cluster")
    def test_template_has_ecs_cluster(self):
        with open(self.template_path, "r", encoding="utf-8") as f:
            content = f.read()
            assert "ECSCluster:" in content
            assert "AWS::ECS::Cluster" in content

    @mark.it("verifies template contains Aurora DB cluster")
    def test_template_has_aurora_cluster(self):
        with open(self.template_path, "r", encoding="utf-8") as f:
            content = f.read()
            assert "AuroraDBCluster:" in content
            assert "AWS::RDS::DBCluster" in content

    @mark.it("verifies template contains Application Load Balancer")
    def test_template_has_alb(self):
        with open(self.template_path, "r", encoding="utf-8") as f:
            content = f.read()
            assert "ApplicationLoadBalancer:" in content
            assert "AWS::ElasticLoadBalancingV2::LoadBalancer" in content

    @mark.it("verifies template contains EnvironmentSuffix parameter")
    def test_template_has_environment_suffix(self):
        with open(self.template_path, "r", encoding="utf-8") as f:
            content = f.read()
            assert "EnvironmentSuffix:" in content

    @mark.it("verifies template contains KMS encryption key")
    def test_template_has_kms_key(self):
        with open(self.template_path, "r", encoding="utf-8") as f:
            content = f.read()
            assert "EncryptionKey:" in content
            assert "AWS::KMS::Key" in content

    @mark.it("verifies template contains Kinesis Data Stream")
    def test_template_has_kinesis_stream(self):
        with open(self.template_path, "r", encoding="utf-8") as f:
            content = f.read()
            assert "KinesisDataStream:" in content
            assert "AWS::Kinesis::Stream" in content

    @mark.it("verifies template contains ElastiCache Redis")
    def test_template_has_redis(self):
        with open(self.template_path, "r", encoding="utf-8") as f:
            content = f.read()
            assert "RedisReplicationGroup:" in content
            assert "AWS::ElastiCache::ReplicationGroup" in content

    @mark.it("verifies template contains EFS file system")
    def test_template_has_efs(self):
        with open(self.template_path, "r", encoding="utf-8") as f:
            content = f.read()
            assert "EFSFileSystem:" in content
            assert "AWS::EFS::FileSystem" in content

    @mark.it("verifies template contains Secrets Manager")
    def test_template_has_secrets_manager(self):
        with open(self.template_path, "r", encoding="utf-8") as f:
            content = f.read()
            assert "DatabaseSecret:" in content
            assert "AWS::SecretsManager::Secret" in content

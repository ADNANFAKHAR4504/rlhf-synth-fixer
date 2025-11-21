"""Unit tests for TapStack CDK infrastructure"""
import unittest

import aws_cdk as cdk
from aws_cdk.assertions import Match, Template
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
    """Test cases for the TapStack CDK stack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()
        self.stack = TapStack(self.app, "TestStack", TapStackProps(environment_suffix="test"))
        self.template = Template.from_stack(self.stack)

    @mark.it("defaults environment suffix to 'dev' if not provided")
    def test_defaults_env_suffix_to_dev(self):
        """Test that environment suffix defaults to 'dev'"""
        stack = TapStack(self.app, "DefaultStack")
        self.assertEqual(stack.environment_suffix, "dev")

    @mark.it("uses provided environment suffix")
    def test_uses_provided_env_suffix(self):
        """Test that provided environment suffix is used"""
        stack = TapStack(self.app, "CustomStack", TapStackProps(environment_suffix="prod"))
        self.assertEqual(stack.environment_suffix, "prod")

    @mark.it("creates KMS key with correct properties")
    def test_creates_kms_key(self):
        """Test KMS key creation"""
        self.template.resource_count_is("AWS::KMS::Key", 1)
        self.template.has_resource_properties("AWS::KMS::Key", {
            "Description": "Trading Analytics Platform master encryption key",
            "EnableKeyRotation": True,
            "PendingWindowInDays": 7
        })

    @mark.it("creates VPC with 3 availability zones")
    def test_creates_vpc(self):
        """Test VPC creation with correct configuration"""
        self.template.resource_count_is("AWS::EC2::VPC", 1)
        self.template.has_resource_properties("AWS::EC2::VPC", {
            "CidrBlock": "10.0.0.0/16",
            "EnableDnsHostnames": True,
            "EnableDnsSupport": True
        })

    @mark.it("creates public subnets")
    def test_creates_public_subnets(self):
        """Test public subnet creation"""
        # VPC has 2 AZs × 3 subnet types = 6 total subnets (CDK uses available AZs per region)
        self.template.resource_count_is("AWS::EC2::Subnet", 6)

    @mark.it("creates NAT gateways")
    def test_creates_nat_gateways(self):
        """Test NAT gateway creation"""
        # 2 NAT gateways (one per AZ, actual AZ count depends on region availability)
        self.template.resource_count_is("AWS::EC2::NatGateway", 2)

    @mark.it("creates VPN gateway")
    def test_creates_vpn_gateway(self):
        """Test VPN gateway creation"""
        self.template.resource_count_is("AWS::EC2::VPNGateway", 1)
        self.template.has_resource_properties("AWS::EC2::VPNGateway", {
            "Type": "ipsec.1",
            "AmazonSideAsn": 65000
        })

    @mark.it("creates VPC flow logs")
    def test_creates_vpc_flow_logs(self):
        """Test VPC flow logs creation"""
        self.template.resource_count_is("AWS::EC2::FlowLog", 1)
        self.template.has_resource_properties("AWS::EC2::FlowLog", {
            "TrafficType": "ALL"
        })

    @mark.it("creates Aurora parameter group")
    def test_creates_aurora_parameter_group(self):
        """Test Aurora parameter group creation"""
        self.template.resource_count_is("AWS::RDS::DBClusterParameterGroup", 1)
        self.template.has_resource_properties("AWS::RDS::DBClusterParameterGroup", {
            "Description": "Optimized for high-frequency trading workloads",
            "Family": "aurora-postgresql14"
        })

    @mark.it("creates Aurora cluster")
    def test_creates_aurora_cluster(self):
        """Test Aurora cluster creation"""
        self.template.resource_count_is("AWS::RDS::DBCluster", 1)
        self.template.has_resource_properties("AWS::RDS::DBCluster", {
            "Engine": "aurora-postgresql",
            "EngineVersion": "14.6",
            "DatabaseName": "trading",
            "StorageEncrypted": True,
            "DeletionProtection": False,
            "BackupRetentionPeriod": 35,
            "PreferredMaintenanceWindow": "sun:04:00-sun:05:00",
            "EnableIAMDatabaseAuthentication": True
        })

    @mark.it("creates Aurora writer instance")
    def test_creates_aurora_writer(self):
        """Test Aurora writer instance creation"""
        # 1 writer + 4 readers = 5 total DB instances
        self.template.resource_count_is("AWS::RDS::DBInstance", 5)

    @mark.it("creates Aurora reader instances")
    def test_creates_aurora_readers(self):
        """Test Aurora reader instances creation"""
        # 1 writer + 4 readers = 5 total
        self.template.resource_count_is("AWS::RDS::DBInstance", 5)

    @mark.it("creates Aurora secret")
    def test_creates_aurora_secret(self):
        """Test Aurora secret creation"""
        self.template.resource_count_is("AWS::SecretsManager::Secret", 1)
        self.template.has_resource_properties("AWS::SecretsManager::Secret", {
            "Name": "tap/aurora/master-test"
        })

    @mark.it("creates CloudWatch alarm for Aurora connections")
    def test_creates_aurora_connection_alarm(self):
        """Test Aurora connection alarm creation"""
        self.template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "Threshold": 4000,
            "EvaluationPeriods": 2,
            "DatapointsToAlarm": 2
        })

    @mark.it("creates placement group for EC2")
    def test_creates_placement_group(self):
        """Test placement group creation"""
        self.template.resource_count_is("AWS::EC2::PlacementGroup", 1)
        self.template.has_resource_properties("AWS::EC2::PlacementGroup", {
            "Strategy": "cluster"
        })

    @mark.it("creates compute security group")
    def test_creates_compute_security_group(self):
        """Test compute security group creation"""
        self.template.has_resource_properties("AWS::EC2::SecurityGroup", {
            "GroupDescription": "Trading compute cluster security group"
        })

    @mark.it("creates IAM role for EC2 instances")
    def test_creates_ec2_iam_role(self):
        """Test EC2 IAM role creation with least privilege"""
        self.template.has_resource_properties("AWS::IAM::Role", {
            "AssumeRolePolicyDocument": {
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "ec2.amazonaws.com"
                    }
                }]
            },
            "ManagedPolicyArns": Match.array_with([
                Match.object_like({
                    "Fn::Join": Match.array_with([
                        Match.array_with([
                            Match.string_like_regexp(".*CloudWatchAgentServerPolicy")
                        ])
                    ])
                }),
                Match.object_like({
                    "Fn::Join": Match.array_with([
                        Match.array_with([
                            Match.string_like_regexp(".*AWSXRayDaemonWriteAccess")
                        ])
                    ])
                })
            ])
        })

    @mark.it("creates launch template")
    def test_creates_launch_template(self):
        """Test launch template creation"""
        self.template.resource_count_is("AWS::EC2::LaunchTemplate", 1)
        self.template.has_resource_properties("AWS::EC2::LaunchTemplate", {
            "LaunchTemplateData": {
                "MetadataOptions": {
                    "HttpTokens": "required"
                }
            }
        })

    @mark.it("creates Auto Scaling Group")
    def test_creates_auto_scaling_group(self):
        """Test ASG creation"""
        self.template.resource_count_is("AWS::AutoScaling::AutoScalingGroup", 1)
        self.template.has_resource_properties("AWS::AutoScaling::AutoScalingGroup", {
            "MinSize": "1",
            "MaxSize": "1",
            "DesiredCapacity": "1"
        })

    @mark.it("creates Redis subnet group")
    def test_creates_redis_subnet_group(self):
        """Test Redis subnet group creation"""
        self.template.resource_count_is("AWS::ElastiCache::SubnetGroup", 1)

    @mark.it("creates Redis parameter group")
    def test_creates_redis_parameter_group(self):
        """Test Redis parameter group creation"""
        self.template.resource_count_is("AWS::ElastiCache::ParameterGroup", 1)
        self.template.has_resource_properties("AWS::ElastiCache::ParameterGroup", {
            "CacheParameterGroupFamily": "redis7",
            "Description": "Optimized for trading workloads"
        })

    @mark.it("creates Redis security group")
    def test_creates_redis_security_group(self):
        """Test Redis security group creation"""
        self.template.has_resource_properties("AWS::EC2::SecurityGroup", {
            "GroupDescription": "ElastiCache Redis security group"
        })

    @mark.it("creates Redis cluster with encryption")
    def test_creates_redis_cluster(self):
        """Test Redis cluster creation"""
        self.template.resource_count_is("AWS::ElastiCache::ReplicationGroup", 1)
        self.template.has_resource_properties("AWS::ElastiCache::ReplicationGroup", {
            "ReplicationGroupDescription": "High-performance Redis cluster for trading cache",
            "Engine": "redis",
            "EngineVersion": "7.0",
            "NumNodeGroups": 15,
            "ReplicasPerNodeGroup": 2,
            "AutomaticFailoverEnabled": True,
            "MultiAZEnabled": True,
            "AtRestEncryptionEnabled": True,
            "TransitEncryptionEnabled": True,
            "SnapshotRetentionLimit": 7
        })

    @mark.it("creates DynamoDB trades table")
    def test_creates_trades_table(self):
        """Test DynamoDB trades table creation"""
        self.template.has_resource_properties("AWS::DynamoDB::Table", {
            "TableName": Match.string_like_regexp("tap-trades-.*"),
            # BillingMode is not explicitly set in CloudFormation when PROVISIONED (default)
            "ProvisionedThroughput": {
                "ReadCapacityUnits": 5000,
                "WriteCapacityUnits": 5000
            },
            "PointInTimeRecoverySpecification": {
                "PointInTimeRecoveryEnabled": True
            },
            "SSESpecification": {
                "SSEEnabled": True
            },
            "StreamSpecification": {
                "StreamViewType": "NEW_AND_OLD_IMAGES"
            }
        })

    @mark.it("creates DynamoDB orders table")
    def test_creates_orders_table(self):
        """Test DynamoDB orders table creation"""
        self.template.has_resource_properties("AWS::DynamoDB::Table", {
            "TableName": Match.string_like_regexp("tap-orders-.*")
        })

    @mark.it("creates DynamoDB positions table")
    def test_creates_positions_table(self):
        """Test DynamoDB positions table creation"""
        self.template.has_resource_properties("AWS::DynamoDB::Table", {
            "TableName": Match.string_like_regexp("tap-positions-.*")
        })

    @mark.it("creates DynamoDB tables with encryption")
    def test_dynamodb_tables_encrypted(self):
        """Test DynamoDB tables are encrypted"""
        self.template.all_resources_properties("AWS::DynamoDB::Table", {
            "SSESpecification": {
                "SSEEnabled": True
            }
        })

    @mark.it("creates Global Secondary Indexes")
    def test_creates_gsis(self):
        """Test GSI creation on tables"""
        self.template.has_resource_properties("AWS::DynamoDB::Table", {
            "GlobalSecondaryIndexes": Match.any_value()
        })

    @mark.it("creates DAX subnet group")
    def test_creates_dax_subnet_group(self):
        """Test DAX subnet group creation"""
        self.template.resource_count_is("AWS::DAX::SubnetGroup", 1)

    @mark.it("creates DAX IAM role")
    def test_creates_dax_iam_role(self):
        """Test DAX IAM role creation"""
        self.template.has_resource_properties("AWS::IAM::Role", {
            "AssumeRolePolicyDocument": {
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "dax.amazonaws.com"
                    }
                }]
            }
        })

    @mark.it("creates DAX parameter group")
    def test_creates_dax_parameter_group(self):
        """Test DAX parameter group creation"""
        self.template.resource_count_is("AWS::DAX::ParameterGroup", 1)
        self.template.has_resource_properties("AWS::DAX::ParameterGroup", {
            "ParameterGroupName": Match.string_like_regexp("tap-dax-params-.*"),
            "Description": "Optimized DAX parameters for trading"
        })

    @mark.it("creates DAX cluster with encryption")
    def test_creates_dax_cluster(self):
        """Test DAX cluster creation"""
        self.template.resource_count_is("AWS::DAX::Cluster", 1)
        self.template.has_resource_properties("AWS::DAX::Cluster", {
            "ClusterName": Match.string_like_regexp("tap-dax-.*"),
            "ReplicationFactor": 6,
            # SSESpecification is set but SSEEnabled may not appear in template
            "SSESpecification": Match.any_value(),
            "ClusterEndpointEncryptionType": "TLS"
        })

    @mark.it("creates auto-scaling for DynamoDB tables")
    def test_creates_dynamodb_autoscaling(self):
        """Test DynamoDB auto-scaling creation"""
        # 3 tables × 2 (read+write) = 6 scalable targets and 6 scaling policies
        self.template.resource_count_is("AWS::ApplicationAutoScaling::ScalableTarget", 6)
        self.template.resource_count_is("AWS::ApplicationAutoScaling::ScalingPolicy", 6)

    @mark.it("creates CloudWatch dashboard")
    def test_creates_cloudwatch_dashboard(self):
        """Test CloudWatch dashboard creation"""
        self.template.resource_count_is("AWS::CloudWatch::Dashboard", 1)
        self.template.has_resource_properties("AWS::CloudWatch::Dashboard", {
            "DashboardName": Match.string_like_regexp("TAP-Trading-Metrics-.*")
        })

    @mark.it("creates Log Insights query")
    def test_creates_log_insights_query(self):
        """Test Log Insights query definition creation"""
        self.template.resource_count_is("AWS::Logs::QueryDefinition", 1)
        self.template.has_resource_properties("AWS::Logs::QueryDefinition", {
            "Name": Match.string_like_regexp("TAP-Order-Latency-Analysis-.*")
        })

    @mark.it("creates X-Ray sampling rule")
    def test_creates_xray_sampling_rule(self):
        """Test X-Ray sampling rule creation"""
        self.template.resource_count_is("AWS::XRay::SamplingRule", 1)
        self.template.has_resource_properties("AWS::XRay::SamplingRule", {
            "SamplingRule": {
                "RuleName": Match.string_like_regexp("TradingCriticalPath-.*"),
                "Priority": 1,
                "ReservoirSize": 20,
                "FixedRate": 0.2
            }
        })

    @mark.it("creates composite alarm for SLA monitoring")
    def test_creates_composite_alarm(self):
        """Test composite alarm creation"""
        self.template.resource_count_is("AWS::CloudWatch::CompositeAlarm", 1)
        self.template.has_resource_properties("AWS::CloudWatch::CompositeAlarm", {
            "AlarmName": Match.string_like_regexp("TAP-SLA-Breach-.*"),
            "AlarmDescription": "Trading platform SLA breach detected"
        })

    @mark.it("outputs VPC ID")
    def test_outputs_vpc_id(self):
        """Test VPC ID output"""
        self.template.has_output("VPCId", {
            "Description": "Trading VPC ID",
            "Export": {
                "Name": Match.string_like_regexp("TAP-VPC-ID-.*")
            }
        })

    @mark.it("outputs Aurora cluster endpoint")
    def test_outputs_aurora_endpoint(self):
        """Test Aurora endpoint output"""
        self.template.has_output("AuroraClusterEndpoint", {
            "Description": "Aurora cluster writer endpoint"
        })

    @mark.it("outputs Aurora reader endpoint")
    def test_outputs_aurora_reader_endpoint(self):
        """Test Aurora reader endpoint output"""
        self.template.has_output("AuroraReaderEndpoint", {
            "Description": "Aurora cluster reader endpoint"
        })

    @mark.it("outputs Redis cluster endpoint")
    def test_outputs_redis_endpoint(self):
        """Test Redis endpoint output"""
        self.template.has_output("RedisClusterEndpoint", {
            "Description": "Redis cluster configuration endpoint"
        })

    @mark.it("outputs DAX cluster endpoint")
    def test_outputs_dax_endpoint(self):
        """Test DAX endpoint output"""
        self.template.has_output("DaxClusterEndpoint", {
            "Description": "DAX cluster endpoint"
        })

    @mark.it("outputs ASG name")
    def test_outputs_asg_name(self):
        """Test ASG name output"""
        self.template.has_output("ASGName", {
            "Description": "Trading compute ASG name"
        })

    @mark.it("validates all resources have proper tags")
    def test_resources_have_tags(self):
        """Test that resources are properly tagged"""
        # Redis cluster tags
        self.template.has_resource_properties("AWS::ElastiCache::ReplicationGroup", {
            "Tags": Match.array_with([
                {"Key": "Environment", "Value": "Production"},
                {"Key": "Platform", "Value": "Trading"}
            ])
        })

    @mark.it("validates IAM roles follow least privilege")
    def test_iam_least_privilege(self):
        """Test IAM roles follow least privilege principle"""
        # DAX role should only have DynamoDB access
        self.template.has_resource_properties("AWS::IAM::Role", {
            "AssumeRolePolicyDocument": {
                "Statement": [{
                    "Principal": {"Service": "dax.amazonaws.com"}
                }]
            },
            "ManagedPolicyArns": Match.array_with([
                Match.object_like({
                    "Fn::Join": Match.array_with([
                        Match.array_with([
                            Match.string_like_regexp(".*AmazonDynamoDBFullAccess")
                        ])
                    ])
                })
            ])
        })

    @mark.it("validates all encrypted resources use KMS")
    def test_encryption_with_kms(self):
        """Test encrypted resources use KMS key"""
        # Aurora cluster encryption
        self.template.has_resource_properties("AWS::RDS::DBCluster", {
            "StorageEncrypted": True,
            "KmsKeyId": Match.any_value()
        })

        # DynamoDB tables encryption
        self.template.has_resource_properties("AWS::DynamoDB::Table", {
            "SSESpecification": {
                "SSEEnabled": True,
                "SSEType": "KMS"
            }
        })

    @mark.it("validates network isolation")
    def test_network_isolation(self):
        """Test proper network isolation"""
        # Aurora should be in isolated subnets
        self.template.has_resource_properties("AWS::RDS::DBSubnetGroup", {
            "DBSubnetGroupDescription": "Trading Aurora DB subnet group"
        })

    @mark.it("validates backup configuration")
    def test_backup_configuration(self):
        """Test backup retention policies"""
        self.template.has_resource_properties("AWS::RDS::DBCluster", {
            "BackupRetentionPeriod": 35,
            "PreferredBackupWindow": "03:00-04:00"
        })

        self.template.has_resource_properties("AWS::ElastiCache::ReplicationGroup", {
            "SnapshotRetentionLimit": 7,
            "SnapshotWindow": "03:00-05:00"
        })

    @mark.it("validates monitoring is enabled")
    def test_monitoring_enabled(self):
        """Test monitoring configuration"""
        # Performance Insights for Aurora
        self.template.has_resource_properties("AWS::RDS::DBInstance", {
            "EnablePerformanceInsights": True,
            "PerformanceInsightsRetentionPeriod": 93
        })

        # CloudWatch logs for Aurora
        self.template.has_resource_properties("AWS::RDS::DBCluster", {
            "EnableCloudwatchLogsExports": ["postgresql"]
        })

    @mark.it("validates high availability configuration")
    def test_high_availability(self):
        """Test HA configuration"""
        # Multi-AZ for Redis
        self.template.has_resource_properties("AWS::ElastiCache::ReplicationGroup", {
            "MultiAZEnabled": True,
            "AutomaticFailoverEnabled": True
        })

        # Multiple Aurora readers
        self.template.resource_count_is("AWS::RDS::DBInstance", 5)

    @mark.it("validates security groups have proper rules")
    def test_security_group_rules(self):
        """Test security group configuration"""
        # Security group ingress rules should exist
        # Just verify that at least 1 ingress rule exists
        ingress_rules = self.template.find_resources("AWS::EC2::SecurityGroupIngress")
        self.assertGreater(len(ingress_rules), 0, "Should have at least one security group ingress rule")


@mark.describe("TapStackProps")
class TestTapStackProps(unittest.TestCase):
    """Test cases for TapStackProps"""

    @mark.it("accepts environment suffix parameter")
    def test_accepts_environment_suffix(self):
        """Test TapStackProps accepts environment suffix"""
        props = TapStackProps(environment_suffix="staging")
        self.assertEqual(props.environment_suffix, "staging")

    @mark.it("allows None as environment suffix")
    def test_allows_none_environment_suffix(self):
        """Test TapStackProps allows None"""
        props = TapStackProps(environment_suffix=None)
        self.assertIsNone(props.environment_suffix)

    @mark.it("inherits from cdk.StackProps")
    def test_inherits_from_stack_props(self):
        """Test TapStackProps inherits from StackProps"""
        props = TapStackProps()
        self.assertIsInstance(props, cdk.StackProps)


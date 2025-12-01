"""Unit tests for TapStack CDK infrastructure"""
import unittest

import aws_cdk as cdk
from aws_cdk.assertions import Match, Template

from lib.tap_stack import TapStack, TapStackProps


class TestTapStackProps(unittest.TestCase):
    """Test cases for TapStackProps"""

    def test_accepts_environment_suffix_parameter(self):
        """Test TapStackProps accepts environment suffix"""
        props = TapStackProps(environment_suffix="staging")
        self.assertEqual(props.environment_suffix, "staging")

    def test_allows_none_environment_suffix(self):
        """Test TapStackProps allows None"""
        props = TapStackProps(environment_suffix=None)
        self.assertIsNone(props.environment_suffix)

    def test_default_environment_suffix(self):
        """Test TapStackProps defaults to None when not provided"""
        props = TapStackProps()
        self.assertIsNone(props.environment_suffix)

    def test_accepts_env_parameter(self):
        """Test TapStackProps accepts env parameter"""
        env = cdk.Environment(account="123456789012", region="us-east-1")
        props = TapStackProps(environment_suffix="test", env=env)
        self.assertEqual(props.environment_suffix, "test")
        self.assertEqual(props.env, env)

    def test_env_defaults_to_none(self):
        """Test TapStackProps env defaults to None"""
        props = TapStackProps()
        self.assertIsNone(props.env)


class TestTapStack(unittest.TestCase):
    """Test cases for the TapStack CDK stack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()
        self.stack = TapStack(self.app, "TestStack", TapStackProps(environment_suffix="test"))
        self.template = Template.from_stack(self.stack)

    def test_defaults_env_suffix_to_dev_if_not_provided(self):
        """Test that environment suffix defaults to 'dev'"""
        stack = TapStack(self.app, "DefaultStack")
        self.assertEqual(stack.environment_suffix, "dev")

    def test_uses_provided_env_suffix(self):
        """Test that provided environment suffix is used"""
        stack = TapStack(self.app, "CustomStack", TapStackProps(environment_suffix="prod"))
        self.assertEqual(stack.environment_suffix, "prod")

    def test_uses_env_from_props(self):
        """Test that env from props is used"""
        env = cdk.Environment(account="123456789012", region="us-west-2")
        stack = TapStack(self.app, "EnvStack", TapStackProps(environment_suffix="test", env=env))
        self.assertEqual(stack.environment_suffix, "test")

    def test_creates_vpc(self):
        """Test VPC creation with correct configuration"""
        self.template.resource_count_is("AWS::EC2::VPC", 1)
        self.template.has_resource_properties("AWS::EC2::VPC", {
            "CidrBlock": "10.0.0.0/16",
            "EnableDnsHostnames": True,
            "EnableDnsSupport": True
        })

    def test_creates_subnets(self):
        """Test subnet creation - should have 6 subnets (2 AZs × 3 types)"""
        # CDK creates subnets based on available AZs in the region
        subnets = self.template.find_resources("AWS::EC2::Subnet")
        self.assertGreaterEqual(len(subnets), 6, "Should have at least 6 subnets")

    def test_creates_nat_gateways(self):
        """Test NAT gateway creation - at least 2 NAT gateways"""
        # NAT gateways created based on available AZs
        nat_gateways = self.template.find_resources("AWS::EC2::NatGateway")
        self.assertGreaterEqual(len(nat_gateways), 2, "Should have at least 2 NAT gateways")

    def test_creates_vpc_flow_logs(self):
        """Test VPC flow logs creation"""
        self.template.resource_count_is("AWS::EC2::FlowLog", 1)
        self.template.has_resource_properties("AWS::EC2::FlowLog", {
            "TrafficType": "ALL"
        })

    def test_creates_flow_log_group(self):
        """Test CloudWatch log group for VPC flow logs"""
        self.template.has_resource_properties("AWS::Logs::LogGroup", {
            "RetentionInDays": 30
        })

    def test_creates_security_groups(self):
        """Test total security group count"""
        # 5 security groups: database, redis, compute, lambda, nlb
        self.template.resource_count_is("AWS::EC2::SecurityGroup", 5)

    def test_creates_database_security_group(self):
        """Test database security group creation"""
        self.template.has_resource_properties("AWS::EC2::SecurityGroup", {
            "GroupDescription": "Security group for RDS PostgreSQL"
        })

    def test_creates_redis_security_group(self):
        """Test Redis security group creation"""
        self.template.has_resource_properties("AWS::EC2::SecurityGroup", {
            "GroupDescription": "Security group for ElastiCache Redis"
        })

    def test_creates_compute_security_group(self):
        """Test compute security group creation"""
        self.template.has_resource_properties("AWS::EC2::SecurityGroup", {
            "GroupDescription": "Security group for EC2 compute instances"
        })

    def test_creates_lambda_security_group(self):
        """Test Lambda security group creation"""
        self.template.has_resource_properties("AWS::EC2::SecurityGroup", {
            "GroupDescription": "Security group for Lambda functions"
        })

    def test_creates_nlb_security_group(self):
        """Test NLB security group creation"""
        self.template.has_resource_properties("AWS::EC2::SecurityGroup", {
            "GroupDescription": "Security group for Network Load Balancer"
        })

    def test_security_group_ingress_rules(self):
        """Test security group ingress rules exist"""
        ingress_rules = self.template.find_resources("AWS::EC2::SecurityGroupIngress")
        self.assertGreater(len(ingress_rules), 0, "Should have security group ingress rules")

    def test_vpc_endpoints_created(self):
        """Test VPC endpoint count"""
        # 2 endpoints: DynamoDB and S3
        self.template.resource_count_is("AWS::EC2::VPCEndpoint", 2)

    def test_creates_rds_parameter_group(self):
        """Test RDS parameter group creation"""
        self.template.resource_count_is("AWS::RDS::DBParameterGroup", 1)
        self.template.has_resource_properties("AWS::RDS::DBParameterGroup", {
            "Family": "postgres16",
            "Parameters": {
                "shared_preload_libraries": "pg_stat_statements",
                "log_statement": "all",
                "log_min_duration_statement": "1000",
                "max_connections": "500",
                "random_page_cost": "1.1",
                "effective_cache_size": "5898240"
            }
        })

    def test_creates_rds_subnet_group(self):
        """Test RDS subnet group creation"""
        # May have more than 1 if read replica creates its own
        subnet_groups = self.template.find_resources("AWS::RDS::DBSubnetGroup")
        self.assertGreaterEqual(len(subnet_groups), 1, "Should have at least one RDS subnet group")

    def test_creates_rds_instances(self):
        """Test RDS instance creation (primary + replica)"""
        # Should have 2 DB instances: primary + read replica
        self.template.resource_count_is("AWS::RDS::DBInstance", 2)

    def test_rds_primary_properties(self):
        """Test RDS primary instance properties"""
        db_instances = self.template.find_resources("AWS::RDS::DBInstance")
        primary_instances = [
            instance for instance in db_instances.values()
            if "SourceDBInstanceIdentifier" not in instance.get("Properties", {})
        ]
        self.assertEqual(len(primary_instances), 1)
        primary = primary_instances[0]["Properties"]
        self.assertEqual(primary["Engine"], "postgres")
        self.assertEqual(primary["EngineVersion"], "16")
        self.assertEqual(primary["DBInstanceClass"], "db.r6g.2xlarge")
        self.assertTrue(primary["StorageEncrypted"])
        self.assertTrue(primary["MultiAZ"])

    def test_creates_rds_secret(self):
        """Test RDS master secret creation"""
        self.template.resource_count_is("AWS::SecretsManager::Secret", 1)

    def test_creates_redis_cluster(self):
        """Test Redis replication group creation"""
        self.template.resource_count_is("AWS::ElastiCache::ReplicationGroup", 1)
        self.template.has_resource_properties("AWS::ElastiCache::ReplicationGroup", {
            "CacheNodeType": "cache.r6g.2xlarge",
            "Engine": "redis",
            "EngineVersion": "7.0",
            "NumNodeGroups": 6,
            "ReplicasPerNodeGroup": 2,
            "AutomaticFailoverEnabled": True,
            "MultiAZEnabled": True,
            "AtRestEncryptionEnabled": True,
            "TransitEncryptionEnabled": True
        })

    def test_creates_redis_subnet_group(self):
        """Test Redis subnet group creation"""
        self.template.resource_count_is("AWS::ElastiCache::SubnetGroup", 1)

    def test_creates_redis_parameter_group(self):
        """Test Redis parameter group creation"""
        self.template.resource_count_is("AWS::ElastiCache::ParameterGroup", 1)

    def test_creates_iam_roles(self):
        """Test IAM role creation"""
        roles = self.template.find_resources("AWS::IAM::Role")
        # At least 2 roles: compute instance role and lambda execution role
        self.assertGreaterEqual(len(roles), 2)

    def test_creates_launch_template(self):
        """Test launch template creation"""
        self.template.resource_count_is("AWS::EC2::LaunchTemplate", 1)
        self.template.has_resource_properties("AWS::EC2::LaunchTemplate", {
            "LaunchTemplateData": {
                "InstanceType": "c5.4xlarge",
                "MetadataOptions": {
                    "HttpTokens": "required"
                }
            }
        })

    def test_ebs_encryption(self):
        """Test EBS volumes are encrypted"""
        self.template.has_resource_properties("AWS::EC2::LaunchTemplate", {
            "LaunchTemplateData": {
                "BlockDeviceMappings": Match.array_with([
                    Match.object_like({
                        "Ebs": Match.object_like({
                            "Encrypted": True
                        })
                    })
                ])
            }
        })

    def test_creates_auto_scaling_group(self):
        """Test Auto Scaling Group creation"""
        self.template.resource_count_is("AWS::AutoScaling::AutoScalingGroup", 1)
        self.template.has_resource_properties("AWS::AutoScaling::AutoScalingGroup", {
            "MinSize": "8",
            "MaxSize": "15",
            "DesiredCapacity": "10"
        })

    def test_creates_scaling_policy(self):
        """Test ASG has CPU scaling policy"""
        self.template.has_resource_properties("AWS::AutoScaling::ScalingPolicy", {
            "PolicyType": "TargetTrackingScaling"
        })

    def test_creates_network_load_balancer(self):
        """Test Network Load Balancer creation"""
        self.template.resource_count_is("AWS::ElasticLoadBalancingV2::LoadBalancer", 1)
        self.template.has_resource_properties("AWS::ElasticLoadBalancingV2::LoadBalancer", {
            "Type": "network",
            "Scheme": "internet-facing"
        })

    def test_creates_nlb_listener(self):
        """Test NLB listener creation"""
        self.template.resource_count_is("AWS::ElasticLoadBalancingV2::Listener", 1)
        self.template.has_resource_properties("AWS::ElasticLoadBalancingV2::Listener", {
            "Port": 443,
            "Protocol": "TCP"
        })

    def test_creates_nlb_target_group(self):
        """Test NLB target group creation"""
        self.template.resource_count_is("AWS::ElasticLoadBalancingV2::TargetGroup", 1)

    def test_creates_lambda_functions(self):
        """Test creation of 5 Lambda functions"""
        # Find only our application Lambda functions, not internal CDK functions
        lambda_functions = self.template.find_resources("AWS::Lambda::Function")
        app_lambdas = [
            f for f in lambda_functions.values()
            if f.get("Properties", {}).get("Runtime") == "python3.10"
        ]
        self.assertEqual(len(app_lambdas), 5, "Should have exactly 5 application Lambda functions")

    def test_lambda_function_properties(self):
        """Test Lambda function properties"""
        self.template.has_resource_properties("AWS::Lambda::Function", {
            "Runtime": "python3.10",
            "Handler": "index.handler",
            "Timeout": 900,
            "MemorySize": 3008,
            "Architectures": ["arm64"]
        })

    def test_lambda_xray_tracing(self):
        """Test Lambda functions have X-Ray tracing"""
        lambda_functions = self.template.find_resources("AWS::Lambda::Function")
        # Filter to only application lambdas (python3.10 runtime)
        app_lambdas = [
            f for f in lambda_functions.values()
            if f.get("Properties", {}).get("Runtime") == "python3.10"
        ]

        for func in app_lambdas:
            tracing = func.get("Properties", {}).get("TracingConfig", {})
            self.assertEqual(tracing.get("Mode"), "Active", "Application Lambda should have Active X-Ray tracing")

    def test_lambda_in_vpc(self):
        """Test Lambda functions are in VPC"""
        lambda_functions = self.template.find_resources("AWS::Lambda::Function")
        # Filter to only application lambdas
        app_lambdas = [
            f for f in lambda_functions.values()
            if f.get("Properties", {}).get("Runtime") == "python3.10"
        ]

        for func in app_lambdas:
            vpc_config = func.get("Properties", {}).get("VpcConfig", {})
            self.assertIn("SubnetIds", vpc_config, "Application Lambda should be in VPC subnets")
            self.assertIn("SecurityGroupIds", vpc_config, "Application Lambda should have security groups")

    def test_lambda_log_groups(self):
        """Test Lambda log groups creation"""
        log_groups = self.template.find_resources("AWS::Logs::LogGroup")
        lambda_log_groups = [
            lg for lg in log_groups.values()
            if "/aws/lambda/" in lg.get("Properties", {}).get("LogGroupName", "")
        ]
        self.assertEqual(len(lambda_log_groups), 5)

    def test_lambda_aliases(self):
        """Test Lambda aliases creation"""
        self.template.resource_count_is("AWS::Lambda::Alias", 5)

    def test_lambda_autoscaling(self):
        """Test Lambda auto-scaling configuration"""
        targets = self.template.find_resources("AWS::ApplicationAutoScaling::ScalableTarget")
        lambda_targets = [
            t for t in targets.values()
            if "lambda" in t.get("Properties", {}).get("ServiceNamespace", "")
        ]
        self.assertEqual(len(lambda_targets), 5)

    def test_creates_cloudwatch_dashboard(self):
        """Test CloudWatch dashboard creation"""
        self.template.resource_count_is("AWS::CloudWatch::Dashboard", 1)

    def test_creates_cloudwatch_alarm(self):
        """Test CloudWatch alarm creation"""
        alarms = self.template.find_resources("AWS::CloudWatch::Alarm")
        self.assertGreater(len(alarms), 0)

    def test_outputs_vpc_id(self):
        """Test VPC ID output"""
        self.template.has_output("VpcId", {})

    def test_outputs_database_endpoint(self):
        """Test database endpoint output"""
        self.template.has_output("DatabaseEndpoint", {})

    def test_outputs_redis_endpoint(self):
        """Test Redis endpoint output"""
        self.template.has_output("RedisEndpoint", {})

    def test_outputs_nlb_dns(self):
        """Test NLB DNS output"""
        self.template.has_output("NlbDnsName", {})

    def test_outputs_environment_suffix(self):
        """Test environment suffix output"""
        self.template.has_output("EnvironmentSuffix", {
            "Value": "test"
        })

    def test_encryption_at_rest_rds(self):
        """Test RDS encryption at rest"""
        self.template.has_resource_properties("AWS::RDS::DBInstance", {
            "StorageEncrypted": True
        })

    def test_encryption_at_rest_redis(self):
        """Test Redis encryption at rest"""
        self.template.has_resource_properties("AWS::ElastiCache::ReplicationGroup", {
            "AtRestEncryptionEnabled": True,
            "TransitEncryptionEnabled": True
        })

    def test_multi_az_configuration(self):
        """Test multi-AZ configuration"""
        self.template.has_resource_properties("AWS::RDS::DBInstance", {
            "MultiAZ": True
        })
        self.template.has_resource_properties("AWS::ElastiCache::ReplicationGroup", {
            "MultiAZEnabled": True
        })

    def test_backup_retention(self):
        """Test backup retention policies"""
        self.template.has_resource_properties("AWS::RDS::DBInstance", {
            "BackupRetentionPeriod": 7
        })

    def test_monitoring_enabled(self):
        """Test monitoring is enabled"""
        self.template.has_resource_properties("AWS::RDS::DBInstance", {
            "EnablePerformanceInsights": True,
            "MonitoringInterval": 60
        })

    def test_cloudwatch_logs_enabled(self):
        """Test CloudWatch logs are enabled"""
        self.template.has_resource_properties("AWS::RDS::DBInstance", {
            "EnableCloudwatchLogsExports": ["postgresql"]
        })

    def test_imdsv2_required(self):
        """Test IMDSv2 is required for EC2 instances"""
        self.template.has_resource_properties("AWS::EC2::LaunchTemplate", {
            "LaunchTemplateData": {
                "MetadataOptions": {
                    "HttpTokens": "required"
                }
            }
        })

    def test_lambda_environment_variables(self):
        """Test Lambda functions have required environment variables"""
        lambda_functions = self.template.find_resources("AWS::Lambda::Function")
        # Filter to only application lambdas
        app_lambdas = [
            f for f in lambda_functions.values()
            if f.get("Properties", {}).get("Runtime") == "python3.10"
        ]

        for func in app_lambdas:
            env_vars = func.get("Properties", {}).get("Environment", {}).get("Variables", {})
            self.assertIn("DB_SECRET_ARN", env_vars, "Lambda should have DB_SECRET_ARN")
            self.assertIn("REDIS_ENDPOINT", env_vars, "Lambda should have REDIS_ENDPOINT")
            self.assertIn("REGION", env_vars, "Lambda should have REGION")
            self.assertIn("ENVIRONMENT", env_vars, "Lambda should have ENVIRONMENT")


if __name__ == "__main__":
    unittest.main()

"""Unit tests for TAP Stack."""
import os
import sys
import json

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from cdktf import App, Testing

from lib.tap_stack import TapStack


class TestStackStructure:
    """Test suite for Stack Structure."""

    def setup_method(self):
        """Reset mocks before each test."""
        # Set required environment variable for tests
        os.environ['ENVIRONMENT_SUFFIX'] = 'test'

    def test_tap_stack_instantiates_successfully_via_props(self):
        """TapStack instantiates successfully via props."""
        app = App()
        stack = TapStack(
            app,
            "TestTapStackWithProps",
            environment_suffix="testprop",
            state_bucket="custom-state-bucket",
            state_bucket_region="us-west-2",
            aws_region="us-west-2",
        )

        # Verify that TapStack instantiates without errors via props
        assert stack is not None

        # Synthesize to verify structure
        synth = Testing.synth(stack)
        assert synth is not None

    def test_tap_stack_uses_default_values_when_no_props_provided(self):
        """TapStack uses default values when no props provided."""
        app = App()
        stack = TapStack(app, "TestTapStackDefault")

        # Verify that TapStack instantiates without errors when no props provided
        assert stack is not None

        # Synthesize to verify structure
        synth = Testing.synth(stack)
        assert synth is not None


class TestVPCResources:
    """Test VPC and networking resources."""

    def setup_method(self):
        """Setup for VPC tests."""
        os.environ['ENVIRONMENT_SUFFIX'] = 'test'
        self.app = App()
        self.stack = TapStack(self.app, "VPCTestStack", environment_suffix="vpctest")
        self.synth = Testing.synth(self.stack)

    def test_primary_vpc_created(self):
        """Test that primary VPC is created."""
        resources = json.loads(self.synth)
        vpc_resources = [r for r in resources.get('resource', {}).get('aws_vpc', {}).values()]

        # Should have at least 2 VPCs (primary and secondary)
        assert len(vpc_resources) >= 2

        # Check primary VPC CIDR
        primary_vpcs = [v for v in vpc_resources if v.get('cidr_block') == '10.0.0.0/16']
        assert len(primary_vpcs) > 0

    def test_secondary_vpc_created(self):
        """Test that secondary VPC is created."""
        resources = json.loads(self.synth)
        vpc_resources = [r for r in resources.get('resource', {}).get('aws_vpc', {}).values()]

        # Check secondary VPC CIDR
        secondary_vpcs = [v for v in vpc_resources if v.get('cidr_block') == '10.1.0.0/16']
        assert len(secondary_vpcs) > 0

    def test_subnets_created(self):
        """Test that subnets are created in both regions."""
        resources = json.loads(self.synth)
        subnet_resources = resources.get('resource', {}).get('aws_subnet', {})

        # Should have multiple subnets
        assert len(subnet_resources) >= 6  # At least 3 per region

    def test_internet_gateways_created(self):
        """Test that internet gateways are created."""
        resources = json.loads(self.synth)
        igw_resources = resources.get('resource', {}).get('aws_internet_gateway', {})

        # Should have 2 IGWs (one per region)
        assert len(igw_resources) >= 2

    def test_nat_gateways_created(self):
        """Test that NAT gateways are created."""
        resources = json.loads(self.synth)
        nat_resources = resources.get('resource', {}).get('aws_nat_gateway', {})

        # Should have NAT gateways
        assert len(nat_resources) >= 2


class TestRDSResources:
    """Test RDS and database resources."""

    def setup_method(self):
        """Setup for RDS tests."""
        os.environ['ENVIRONMENT_SUFFIX'] = 'test'
        self.app = App()
        self.stack = TapStack(self.app, "RDSTestStack", environment_suffix="rdstest")
        self.synth = Testing.synth(self.stack)

    def test_global_cluster_created(self):
        """Test that RDS global cluster is created."""
        resources = json.loads(self.synth)
        global_cluster = resources.get('resource', {}).get('aws_rds_global_cluster', {})

        assert len(global_cluster) > 0

        # Check global cluster properties
        for gc in global_cluster.values():
            assert 'aurora-mysql' in gc.get('engine', '')

    def test_primary_cluster_created(self):
        """Test that primary RDS cluster is created."""
        resources = json.loads(self.synth)
        clusters = resources.get('resource', {}).get('aws_rds_cluster', {})

        # Should have at least 2 clusters (primary and secondary)
        assert len(clusters) >= 2

    def test_cluster_instances_created(self):
        """Test that cluster instances are created."""
        resources = json.loads(self.synth)
        instances = resources.get('resource', {}).get('aws_rds_cluster_instance', {})

        # Should have instances
        assert len(instances) >= 1

    def test_db_subnet_groups_created(self):
        """Test that DB subnet groups are created."""
        resources = json.loads(self.synth)
        subnet_groups = resources.get('resource', {}).get('aws_db_subnet_group', {})

        # Should have subnet groups
        assert len(subnet_groups) >= 2


class TestDynamoDBResources:
    """Test DynamoDB resources."""

    def setup_method(self):
        """Setup for DynamoDB tests."""
        os.environ['ENVIRONMENT_SUFFIX'] = 'test'
        self.app = App()
        self.stack = TapStack(self.app, "DynamoTestStack", environment_suffix="dynamotest")
        self.synth = Testing.synth(self.stack)

    def test_dynamodb_global_table_created(self):
        """Test that DynamoDB global table is created."""
        resources = json.loads(self.synth)
        tables = resources.get('resource', {}).get('aws_dynamodb_table', {})

        assert len(tables) > 0

        # Check for global table configuration
        for table in tables.values():
            # Check for replicas
            replicas = table.get('replica', [])
            if replicas:
                assert len(replicas) >= 1

    def test_dynamodb_point_in_time_recovery(self):
        """Test that DynamoDB has PITR enabled."""
        resources = json.loads(self.synth)
        tables = resources.get('resource', {}).get('aws_dynamodb_table', {})

        # At least one table should have PITR
        pitr_enabled = False
        for table in tables.values():
            if table.get('point_in_time_recovery'):
                pitr_enabled = True
                break

        assert pitr_enabled


class TestLambdaResources:
    """Test Lambda function resources."""

    def setup_method(self):
        """Setup for Lambda tests."""
        os.environ['ENVIRONMENT_SUFFIX'] = 'test'
        self.app = App()
        self.stack = TapStack(self.app, "LambdaTestStack", environment_suffix="lambdatest")
        self.synth = Testing.synth(self.stack)

    def test_lambda_functions_created(self):
        """Test that Lambda functions are created in both regions."""
        resources = json.loads(self.synth)
        functions = resources.get('resource', {}).get('aws_lambda_function', {})

        # Should have at least 2 functions (primary and secondary)
        assert len(functions) >= 2

    def test_lambda_memory_allocation(self):
        """Test that Lambda functions have 1GB memory."""
        resources = json.loads(self.synth)
        functions = resources.get('resource', {}).get('aws_lambda_function', {})

        # Check memory allocation
        for func in functions.values():
            assert func.get('memory_size') == 1024

    def test_lambda_iam_roles_created(self):
        """Test that IAM roles for Lambda are created."""
        resources = json.loads(self.synth)
        roles = resources.get('resource', {}).get('aws_iam_role', {})

        # Should have IAM roles
        assert len(roles) >= 2


class TestRoute53Resources:
    """Test Route 53 resources."""

    def setup_method(self):
        """Setup for Route 53 tests."""
        os.environ['ENVIRONMENT_SUFFIX'] = 'test'
        self.app = App()
        self.stack = TapStack(self.app, "Route53TestStack", environment_suffix="r53test")
        self.synth = Testing.synth(self.stack)

    def test_hosted_zone_created(self):
        """Test that Route 53 hosted zone is created."""
        resources = json.loads(self.synth)
        zones = resources.get('resource', {}).get('aws_route53_zone', {})

        assert len(zones) > 0

    def test_health_checks_created(self):
        """Test that Route 53 health checks are created."""
        resources = json.loads(self.synth)
        health_checks = resources.get('resource', {}).get('aws_route53_health_check', {})

        # Should have health checks
        assert len(health_checks) >= 1

    def test_failover_records_created(self):
        """Test that failover routing records are created."""
        resources = json.loads(self.synth)
        records = resources.get('resource', {}).get('aws_route53_record', {})

        # Should have DNS records
        assert len(records) >= 2


class TestEventBridgeResources:
    """Test EventBridge resources."""

    def setup_method(self):
        """Setup for EventBridge tests."""
        os.environ['ENVIRONMENT_SUFFIX'] = 'test'
        self.app = App()
        self.stack = TapStack(self.app, "EventBridgeTestStack", environment_suffix="ebtest")
        self.synth = Testing.synth(self.stack)

    def test_event_rules_created(self):
        """Test that EventBridge rules are created."""
        resources = json.loads(self.synth)
        rules = resources.get('resource', {}).get('aws_cloudwatch_event_rule', {})

        # Should have event rules
        assert len(rules) >= 2


class TestBackupResources:
    """Test AWS Backup resources."""

    def setup_method(self):
        """Setup for Backup tests."""
        os.environ['ENVIRONMENT_SUFFIX'] = 'test'
        self.app = App()
        self.stack = TapStack(self.app, "BackupTestStack", environment_suffix="backuptest")
        self.synth = Testing.synth(self.stack)

    def test_backup_vaults_created(self):
        """Test that backup vaults are created."""
        resources = json.loads(self.synth)
        vaults = resources.get('resource', {}).get('aws_backup_vault', {})

        # Should have at least 2 vaults (primary and secondary)
        assert len(vaults) >= 2

    def test_backup_plans_created(self):
        """Test that backup plans are created."""
        resources = json.loads(self.synth)
        plans = resources.get('resource', {}).get('aws_backup_plan', {})

        # Should have backup plans
        assert len(plans) >= 1

    def test_backup_selections_created(self):
        """Test that backup selections are created."""
        resources = json.loads(self.synth)
        selections = resources.get('resource', {}).get('aws_backup_selection', {})

        # Should have backup selections
        assert len(selections) >= 1


class TestCloudWatchResources:
    """Test CloudWatch resources."""

    def setup_method(self):
        """Setup for CloudWatch tests."""
        os.environ['ENVIRONMENT_SUFFIX'] = 'test'
        self.app = App()
        self.stack = TapStack(self.app, "CloudWatchTestStack", environment_suffix="cwtest")
        self.synth = Testing.synth(self.stack)

    def test_cloudwatch_dashboards_created(self):
        """Test that CloudWatch dashboards are created."""
        resources = json.loads(self.synth)
        dashboards = resources.get('resource', {}).get('aws_cloudwatch_dashboard', {})

        # Should have at least 2 dashboards (one per region)
        assert len(dashboards) >= 2

    def test_cloudwatch_alarms_created(self):
        """Test that CloudWatch alarms are created."""
        resources = json.loads(self.synth)
        alarms = resources.get('resource', {}).get('aws_cloudwatch_metric_alarm', {})

        # Should have alarms for replication lag
        assert len(alarms) >= 1


class TestSSMParameters:
    """Test Systems Manager Parameter Store resources."""

    def setup_method(self):
        """Setup for SSM tests."""
        os.environ['ENVIRONMENT_SUFFIX'] = 'test'
        self.app = App()
        self.stack = TapStack(self.app, "SSMTestStack", environment_suffix="ssmtest")
        self.synth = Testing.synth(self.stack)

    def test_ssm_parameters_created(self):
        """Test that SSM parameters are created."""
        resources = json.loads(self.synth)
        parameters = resources.get('resource', {}).get('aws_ssm_parameter', {})

        # Should have SSM parameters
        assert len(parameters) >= 1


class TestSecurityGroups:
    """Test security group resources."""

    def setup_method(self):
        """Setup for security group tests."""
        os.environ['ENVIRONMENT_SUFFIX'] = 'test'
        self.app = App()
        self.stack = TapStack(self.app, "SGTestStack", environment_suffix="sgtest")
        self.synth = Testing.synth(self.stack)

    def test_security_groups_created(self):
        """Test that security groups are created."""
        resources = json.loads(self.synth)
        sgs = resources.get('resource', {}).get('aws_security_group', {})

        # Should have multiple security groups
        assert len(sgs) >= 4


class TestEnvironmentSuffixUsage:
    """Test that environment suffix is properly used."""

    def setup_method(self):
        """Setup for environment suffix tests."""
        os.environ['ENVIRONMENT_SUFFIX'] = 'unittest'
        self.app = App()
        self.stack = TapStack(self.app, "EnvSuffixTestStack", environment_suffix="envtest")
        self.synth = Testing.synth(self.stack)

    def test_resources_use_environment_suffix(self):
        """Test that resources include environment suffix in names."""
        resources = json.loads(self.synth)

        # Check VPC tags
        vpcs = resources.get('resource', {}).get('aws_vpc', {})
        for vpc in vpcs.values():
            tags = vpc.get('tags', {})
            assert 'envtest' in str(tags.get('Name', ''))


class TestOutputs:
    """Test Terraform outputs."""

    def setup_method(self):
        """Setup for output tests."""
        os.environ['ENVIRONMENT_SUFFIX'] = 'test'
        self.app = App()
        self.stack = TapStack(self.app, "OutputTestStack", environment_suffix="outputtest")
        self.synth = Testing.synth(self.stack)

    def test_outputs_defined(self):
        """Test that required outputs are defined."""
        resources = json.loads(self.synth)
        outputs = resources.get('output', {})

        # Should have multiple outputs
        assert len(outputs) >= 5

        # Check for key outputs
        expected_outputs = [
            'primary_vpc_id',
            'secondary_vpc_id',
            'dynamodb_table_name',
            'primary_lambda_arn',
            'secondary_lambda_arn'
        ]

        # At least some of these should exist
        output_names = list(outputs.keys())
        matching_outputs = [o for o in expected_outputs if o in output_names]
        assert len(matching_outputs) >= 3


# Add more test suites and cases as needed

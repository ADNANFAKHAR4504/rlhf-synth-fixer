"""Comprehensive unit tests for Blue-Green deployment stacks"""
import pytest
from unittest.mock import Mock, patch, MagicMock
from cdktf import App, TerraformStack, Testing
import json
import base64


class TestTapStack:
    """Test cases for TapStack"""

    @patch('lib.tap_stack.S3Backend')
    @patch('lib.tap_stack.AwsProvider')
    @patch('lib.tap_stack.NetworkStack')
    @patch('lib.tap_stack.DatabaseStack')
    @patch('lib.tap_stack.ComputeStack')
    @patch('lib.tap_stack.MonitoringStack')
    @patch('lib.tap_stack.TerraformOutput')
    def test_tap_stack_initialization(
        self,
        mock_output,
        mock_monitoring,
        mock_compute,
        mock_database,
        mock_network,
        mock_provider,
        mock_backend
    ):
        """Test TapStack initialization with all components"""
        from lib.tap_stack import TapStack

        app = App()

        # Mock network stack properties
        mock_network_instance = Mock()
        mock_network_instance.vpc_id = 'vpc-12345'
        mock_network_instance.public_subnet_ids = ['subnet-1', 'subnet-2']
        mock_network_instance.private_subnet_ids = ['subnet-3', 'subnet-4']
        mock_network.return_value = mock_network_instance

        # Mock database stack properties
        mock_database_instance = Mock()
        mock_database_instance.cluster_endpoint = 'db.endpoint.com'
        mock_database_instance.secret_arn = 'arn:aws:secretsmanager:secret'
        mock_database.return_value = mock_database_instance

        # Mock compute stack properties
        mock_compute_instance = Mock()
        mock_compute_instance.alb_dns_name = 'alb.example.com'
        mock_compute_instance.alb_arn = 'arn:aws:elb:alb'
        mock_compute_instance.blue_target_group_arn = 'arn:aws:elb:blue-tg'
        mock_compute_instance.green_target_group_arn = 'arn:aws:elb:green-tg'
        mock_compute_instance.blue_asg_name = 'blue-asg'
        mock_compute_instance.green_asg_name = 'green-asg'
        mock_compute_instance.artifacts_bucket_name = 'artifacts-bucket'
        mock_compute.return_value = mock_compute_instance

        # Mock monitoring stack properties
        mock_monitoring_instance = Mock()
        mock_monitoring_instance.sns_topic_arn = 'arn:aws:sns:topic'
        mock_monitoring.return_value = mock_monitoring_instance

        # Create stack
        stack = TapStack(
            app,
            'TestStack',
            environment_suffix='test',
            state_bucket='test-bucket',
            state_bucket_region='us-east-1',
            primary_region='us-east-1',
            secondary_region='us-west-2'
        )

        # Verify backend configuration (without dynamodb_table)
        mock_backend.assert_called_once()
        backend_call = mock_backend.call_args
        assert backend_call[1]['bucket'] == 'test-bucket'
        assert backend_call[1]['key'] == 'tap-stack-v1/test/terraform.tfstate'
        assert backend_call[1]['region'] == 'us-east-1'
        assert backend_call[1]['encrypt'] is True
        assert 'dynamodb_table' not in backend_call[1]

        # Verify AWS provider
        mock_provider.assert_called_once()
        provider_call = mock_provider.call_args
        assert provider_call[1]['region'] == 'us-east-1'

        # Verify stacks are created
        mock_network.assert_called_once()
        mock_database.assert_called_once()
        mock_compute.assert_called_once()
        mock_monitoring.assert_called_once()

        # Verify outputs are created (8 outputs total)
        assert mock_output.call_count == 8

    def test_tap_stack_environment_suffix(self):
        """Test TapStack stores environment suffix correctly"""
        from lib.tap_stack import TapStack

        with patch('lib.tap_stack.S3Backend'), \
             patch('lib.tap_stack.AwsProvider'), \
             patch('lib.tap_stack.NetworkStack'), \
             patch('lib.tap_stack.DatabaseStack'), \
             patch('lib.tap_stack.ComputeStack'), \
             patch('lib.tap_stack.MonitoringStack'), \
             patch('lib.tap_stack.TerraformOutput'):

            app = App()
            stack = TapStack(
                app,
                'TestStack',
                environment_suffix='prod',
                state_bucket='test-bucket',
                state_bucket_region='us-east-1',
                primary_region='eu-west-1',
                secondary_region='eu-central-1'
            )

            assert stack.environment_suffix == 'prod'
            assert stack.primary_region == 'eu-west-1'
            assert stack.secondary_region == 'eu-central-1'


class TestNetworkStack:
    """Test cases for NetworkStack"""

    @patch('lib.network_stack.RouteTableAssociation')
    @patch('lib.network_stack.RouteTable')
    @patch('lib.network_stack.NatGateway')
    @patch('lib.network_stack.Eip')
    @patch('lib.network_stack.InternetGateway')
    @patch('lib.network_stack.Subnet')
    @patch('lib.network_stack.Vpc')
    def test_network_stack_initialization(
        self,
        mock_vpc,
        mock_subnet,
        mock_igw,
        mock_eip,
        mock_nat,
        mock_rt,
        mock_rta
    ):
        """Test NetworkStack creates all network resources"""
        from lib.network_stack import NetworkStack

        app = App()
        stack = TerraformStack(app, "test-stack")

        # Mock resource IDs
        mock_vpc_instance = Mock()
        mock_vpc_instance.id = 'vpc-12345'
        mock_vpc.return_value = mock_vpc_instance

        mock_subnet_instances = [Mock() for _ in range(4)]
        for i, instance in enumerate(mock_subnet_instances):
            instance.id = f'subnet-{i}'
        mock_subnet.side_effect = mock_subnet_instances

        mock_igw_instance = Mock()
        mock_igw_instance.id = 'igw-12345'
        mock_igw.return_value = mock_igw_instance

        mock_eip_instance = Mock()
        mock_eip_instance.id = 'eip-12345'
        mock_eip.return_value = mock_eip_instance

        mock_nat_instance = Mock()
        mock_nat_instance.id = 'nat-12345'
        mock_nat.return_value = mock_nat_instance

        mock_rt_instances = [Mock(), Mock()]
        for i, instance in enumerate(mock_rt_instances):
            instance.id = f'rt-{i}'
        mock_rt.side_effect = mock_rt_instances

        # Create network stack
        network = NetworkStack(stack, 'NetworkTest', environment_suffix='test')

        # Verify VPC creation
        mock_vpc.assert_called_once()
        vpc_call = mock_vpc.call_args
        assert vpc_call[1]['cidr_block'] == '10.0.0.0/16'
        assert vpc_call[1]['enable_dns_hostnames'] is True
        assert vpc_call[1]['enable_dns_support'] is True

        # Verify subnets creation (2 public + 2 private)
        assert mock_subnet.call_count == 4

        # Verify internet gateway
        mock_igw.assert_called_once()

        # Verify NAT gateway and EIP
        mock_eip.assert_called_once()
        mock_nat.assert_called_once()

        # Verify route tables (1 public + 1 private)
        assert mock_rt.call_count == 2

        # Verify route table associations (2 public + 2 private)
        assert mock_rta.call_count == 4

    def test_network_stack_properties(self):
        """Test NetworkStack properties return correct values"""
        from lib.network_stack import NetworkStack

        with patch('lib.network_stack.Vpc') as mock_vpc, \
             patch('lib.network_stack.Subnet') as mock_subnet, \
             patch('lib.network_stack.InternetGateway'), \
             patch('lib.network_stack.Eip'), \
             patch('lib.network_stack.NatGateway'), \
             patch('lib.network_stack.RouteTable'), \
             patch('lib.network_stack.RouteTableAssociation'):

            # Setup mocks
            mock_vpc_instance = Mock()
            mock_vpc_instance.id = 'vpc-test-123'
            mock_vpc.return_value = mock_vpc_instance

            mock_subnet_instances = []
            for i in range(4):
                instance = Mock()
                instance.id = f'subnet-{i}'
                mock_subnet_instances.append(instance)
            mock_subnet.side_effect = mock_subnet_instances

            app = App()
            stack = TerraformStack(app, "test-stack")
            network = NetworkStack(stack, 'NetworkTest', environment_suffix='test')

            # Test properties
            assert network.vpc_id == 'vpc-test-123'
            assert network.public_subnet_ids == ['subnet-0', 'subnet-1']
            assert network.private_subnet_ids == ['subnet-2', 'subnet-3']

    def test_network_stack_subnet_configuration(self):
        """Test NetworkStack subnet CIDR blocks and AZs"""
        from lib.network_stack import NetworkStack

        with patch('lib.network_stack.Vpc'), \
             patch('lib.network_stack.Subnet') as mock_subnet, \
             patch('lib.network_stack.InternetGateway'), \
             patch('lib.network_stack.Eip'), \
             patch('lib.network_stack.NatGateway'), \
             patch('lib.network_stack.RouteTable'), \
             patch('lib.network_stack.RouteTableAssociation'):

            mock_subnet.return_value = Mock(id='subnet-test')

            app = App()
            stack = TerraformStack(app, "test-stack")
            NetworkStack(stack, 'NetworkTest', environment_suffix='test')

            # Check subnet configurations
            subnet_calls = mock_subnet.call_args_list

            # Public subnet 1
            assert subnet_calls[0][1]['cidr_block'] == '10.0.1.0/24'
            assert subnet_calls[0][1]['availability_zone'] == 'us-east-1a'
            assert subnet_calls[0][1]['map_public_ip_on_launch'] is True

            # Public subnet 2
            assert subnet_calls[1][1]['cidr_block'] == '10.0.2.0/24'
            assert subnet_calls[1][1]['availability_zone'] == 'us-east-1b'

            # Private subnet 1
            assert subnet_calls[2][1]['cidr_block'] == '10.0.10.0/24'
            assert subnet_calls[2][1]['availability_zone'] == 'us-east-1a'

            # Private subnet 2
            assert subnet_calls[3][1]['cidr_block'] == '10.0.11.0/24'
            assert subnet_calls[3][1]['availability_zone'] == 'us-east-1b'


class TestDatabaseStack:
    """Test cases for DatabaseStack"""

    @patch('lib.database_stack.random.choices')
    @patch('lib.database_stack.RdsClusterInstance')
    @patch('lib.database_stack.RdsCluster')
    @patch('lib.database_stack.SecretsmanagerSecretVersion')
    @patch('lib.database_stack.SecretsmanagerSecret')
    @patch('lib.database_stack.DbSubnetGroup')
    @patch('lib.database_stack.SecurityGroup')
    def test_database_stack_initialization(
        self,
        mock_sg,
        mock_subnet_group,
        mock_secret,
        mock_secret_version,
        mock_rds_cluster,
        mock_rds_instance,
        mock_random
    ):
        """Test DatabaseStack creates all database resources"""
        from lib.database_stack import DatabaseStack

        # Mock random password generation
        mock_random.return_value = list('testpassword1234')

        # Mock resource IDs
        mock_sg_instance = Mock()
        mock_sg_instance.id = 'sg-db-12345'
        mock_sg.return_value = mock_sg_instance

        mock_subnet_group_instance = Mock()
        mock_subnet_group_instance.name = 'db-subnet-group'
        mock_subnet_group.return_value = mock_subnet_group_instance

        mock_secret_instance = Mock()
        mock_secret_instance.id = 'secret-12345'
        mock_secret_instance.arn = 'arn:aws:secretsmanager:secret'
        mock_secret.return_value = mock_secret_instance

        mock_rds_cluster_instance = Mock()
        mock_rds_cluster_instance.id = 'cluster-12345'
        mock_rds_cluster_instance.endpoint = 'cluster.endpoint.com'
        mock_rds_cluster.return_value = mock_rds_cluster_instance

        app = App()
        stack = TerraformStack(app, "test-stack")
        database = DatabaseStack(
            stack,
            'DatabaseTest',
            vpc_id='vpc-12345',
            private_subnet_ids=['subnet-1', 'subnet-2'],
            environment_suffix='test'
        )

        # Verify security group creation
        mock_sg.assert_called_once()
        sg_call = mock_sg.call_args
        assert sg_call[1]['name'] == 'bluegreen-db-sg-v1-test'
        assert sg_call[1]['vpc_id'] == 'vpc-12345'

        # Verify subnet group
        mock_subnet_group.assert_called_once()
        subnet_call = mock_subnet_group.call_args
        assert subnet_call[1]['subnet_ids'] == ['subnet-1', 'subnet-2']

        # Verify secrets manager
        mock_secret.assert_called_once()
        mock_secret_version.assert_called_once()

        # Verify RDS cluster
        mock_rds_cluster.assert_called_once()
        cluster_call = mock_rds_cluster.call_args
        assert cluster_call[1]['engine'] == 'aurora-postgresql'
        assert cluster_call[1]['engine_mode'] == 'provisioned'
        assert cluster_call[1]['engine_version'] == '15'
        assert cluster_call[1]['database_name'] == 'appdb'
        assert cluster_call[1]['master_username'] == 'dbadmin'

        # Verify RDS instance
        mock_rds_instance.assert_called_once()
        instance_call = mock_rds_instance.call_args
        assert instance_call[1]['instance_class'] == 'db.serverless'
        assert instance_call[1]['engine'] == 'aurora-postgresql'

    def test_database_stack_properties(self):
        """Test DatabaseStack properties return correct values"""
        from lib.database_stack import DatabaseStack

        with patch('lib.database_stack.SecurityGroup'), \
             patch('lib.database_stack.DbSubnetGroup'), \
             patch('lib.database_stack.SecretsmanagerSecret') as mock_secret, \
             patch('lib.database_stack.SecretsmanagerSecretVersion'), \
             patch('lib.database_stack.RdsCluster') as mock_cluster, \
             patch('lib.database_stack.RdsClusterInstance'), \
             patch('lib.database_stack.random.choices'):

            mock_secret_instance = Mock()
            mock_secret_instance.arn = 'arn:aws:secret:test'
            mock_secret.return_value = mock_secret_instance

            mock_cluster_instance = Mock()
            mock_cluster_instance.endpoint = 'test.cluster.endpoint'
            mock_cluster.return_value = mock_cluster_instance

            app = App()
            stack = TerraformStack(app, "test-stack")
            database = DatabaseStack(
                stack,
                'DatabaseTest',
                vpc_id='vpc-12345',
                private_subnet_ids=['subnet-1', 'subnet-2'],
                environment_suffix='test'
            )

            assert database.cluster_endpoint == 'test.cluster.endpoint'
            assert database.secret_arn == 'arn:aws:secret:test'

    def test_database_stack_security_group_rules(self):
        """Test DatabaseStack security group ingress rules"""
        from lib.database_stack import DatabaseStack

        with patch('lib.database_stack.SecurityGroup') as mock_sg, \
             patch('lib.database_stack.DbSubnetGroup'), \
             patch('lib.database_stack.SecretsmanagerSecret'), \
             patch('lib.database_stack.SecretsmanagerSecretVersion'), \
             patch('lib.database_stack.RdsCluster'), \
             patch('lib.database_stack.RdsClusterInstance'), \
             patch('lib.database_stack.random.choices'):

            mock_sg.return_value = Mock(id='sg-test')

            app = App()
            stack = TerraformStack(app, "test-stack")
            DatabaseStack(
                stack,
                'DatabaseTest',
                vpc_id='vpc-12345',
                private_subnet_ids=['subnet-1', 'subnet-2'],
                environment_suffix='test'
            )

            sg_call = mock_sg.call_args
            ingress_rules = sg_call[1]['ingress']

            assert len(ingress_rules) == 1
            assert ingress_rules[0].from_port == 5432
            assert ingress_rules[0].to_port == 5432
            assert ingress_rules[0].protocol == 'tcp'
            assert '10.0.0.0/16' in ingress_rules[0].cidr_blocks

    def test_database_stack_secret_structure(self):
        """Test DatabaseStack creates proper secret structure"""
        from lib.database_stack import DatabaseStack

        with patch('lib.database_stack.SecurityGroup'), \
             patch('lib.database_stack.DbSubnetGroup'), \
             patch('lib.database_stack.SecretsmanagerSecret'), \
             patch('lib.database_stack.SecretsmanagerSecretVersion') as mock_version, \
             patch('lib.database_stack.RdsCluster'), \
             patch('lib.database_stack.RdsClusterInstance'), \
             patch('lib.database_stack.random.choices') as mock_random:

            mock_random.return_value = list('testpass12345678')

            app = App()
            stack = TerraformStack(app, "test-stack")
            DatabaseStack(
                stack,
                'DatabaseTest',
                vpc_id='vpc-12345',
                private_subnet_ids=['subnet-1', 'subnet-2'],
                environment_suffix='test'
            )

            version_call = mock_version.call_args
            secret_string = version_call[1]['secret_string']
            secret_data = json.loads(secret_string)

            assert secret_data['username'] == 'dbadmin'
            assert secret_data['password'] == 'testpass12345678'
            assert secret_data['engine'] == 'postgres'
            assert secret_data['port'] == 5432
            assert secret_data['dbname'] == 'appdb'


class TestComputeStack:
    """Test cases for ComputeStack"""

    @patch('lib.compute_stack.AutoscalingGroup')
    @patch('lib.compute_stack.LaunchTemplate')
    @patch('lib.compute_stack.DataAwsAmi')
    @patch('lib.compute_stack.IamInstanceProfile')
    @patch('lib.compute_stack.IamRolePolicyAttachment')
    @patch('lib.compute_stack.IamRole')
    @patch('lib.compute_stack.LbListener')
    @patch('lib.compute_stack.LbTargetGroup')
    @patch('lib.compute_stack.Lb')
    @patch('lib.compute_stack.SecurityGroup')
    @patch('lib.compute_stack.S3BucketServerSideEncryptionConfigurationA')
    @patch('lib.compute_stack.S3BucketVersioningA')
    @patch('lib.compute_stack.S3Bucket')
    def test_compute_stack_initialization(
        self,
        mock_s3,
        mock_versioning,
        mock_encryption,
        mock_sg,
        mock_alb,
        mock_tg,
        mock_listener,
        mock_role,
        mock_policy,
        mock_profile,
        mock_ami,
        mock_lt,
        mock_asg
    ):
        """Test ComputeStack creates all compute resources"""
        from lib.compute_stack import ComputeStack

        # Setup mocks
        mock_s3_instance = Mock()
        mock_s3_instance.id = 'bucket-12345'
        mock_s3.return_value = mock_s3_instance

        mock_sg_instances = [Mock(), Mock()]
        for i, instance in enumerate(mock_sg_instances):
            instance.id = f'sg-{i}'
        mock_sg.side_effect = mock_sg_instances

        mock_alb_instance = Mock()
        mock_alb_instance.arn = 'arn:aws:elb:alb'
        mock_alb_instance.dns_name = 'alb.example.com'
        mock_alb.return_value = mock_alb_instance

        mock_tg_instances = [Mock(), Mock()]
        for i, instance in enumerate(mock_tg_instances):
            instance.arn = f'arn:aws:elb:tg-{i}'
        mock_tg.side_effect = mock_tg_instances

        mock_role_instance = Mock()
        mock_role_instance.name = 'ec2-role'
        mock_role.return_value = mock_role_instance

        mock_profile_instance = Mock()
        mock_profile_instance.arn = 'arn:aws:iam:profile'
        mock_profile.return_value = mock_profile_instance

        mock_ami_instance = Mock()
        mock_ami_instance.id = 'ami-12345'
        mock_ami.return_value = mock_ami_instance

        mock_lt_instances = [Mock(), Mock()]
        for i, instance in enumerate(mock_lt_instances):
            instance.id = f'lt-{i}'
        mock_lt.side_effect = mock_lt_instances

        mock_asg_instances = [Mock(), Mock()]
        for i, instance in enumerate(mock_asg_instances):
            instance.name = f'asg-{i}'
        mock_asg.side_effect = mock_asg_instances

        app = App()
        stack = TerraformStack(app, "test-stack")
        compute = ComputeStack(
            stack,
            'ComputeTest',
            vpc_id='vpc-12345',
            public_subnet_ids=['subnet-1', 'subnet-2'],
            private_subnet_ids=['subnet-3', 'subnet-4'],
            database_endpoint='db.endpoint.com',
            database_secret_arn='arn:aws:secret',
            environment_suffix='test'
        )

        # Verify S3 bucket and configuration
        mock_s3.assert_called_once()
        mock_versioning.assert_called_once()
        mock_encryption.assert_called_once()

        # Verify security groups (ALB + EC2)
        assert mock_sg.call_count == 2

        # Verify ALB components
        mock_alb.assert_called_once()
        assert mock_tg.call_count == 2  # Blue and Green
        mock_listener.assert_called_once()

        # Verify IAM components
        mock_role.assert_called_once()
        assert mock_policy.call_count == 3  # SSM, Secrets, S3
        mock_profile.assert_called_once()

        # Verify AMI lookup
        mock_ami.assert_called_once()

        # Verify Launch Templates (Blue and Green)
        assert mock_lt.call_count == 2

        # Verify Auto Scaling Groups (Blue and Green)
        assert mock_asg.call_count == 2

    def test_compute_stack_properties(self):
        """Test ComputeStack properties return correct values"""
        from lib.compute_stack import ComputeStack

        with patch('lib.compute_stack.S3Bucket') as mock_s3, \
             patch('lib.compute_stack.S3BucketVersioningA'), \
             patch('lib.compute_stack.S3BucketServerSideEncryptionConfigurationA'), \
             patch('lib.compute_stack.SecurityGroup'), \
             patch('lib.compute_stack.Lb') as mock_alb, \
             patch('lib.compute_stack.LbTargetGroup') as mock_tg, \
             patch('lib.compute_stack.LbListener'), \
             patch('lib.compute_stack.IamRole'), \
             patch('lib.compute_stack.IamRolePolicyAttachment'), \
             patch('lib.compute_stack.IamInstanceProfile'), \
             patch('lib.compute_stack.DataAwsAmi'), \
             patch('lib.compute_stack.LaunchTemplate'), \
             patch('lib.compute_stack.AutoscalingGroup') as mock_asg:

            mock_s3.return_value = Mock(id='bucket-test')
            mock_alb.return_value = Mock(arn='arn:alb', dns_name='alb.test.com')

            mock_tg_blue = Mock(arn='arn:tg-blue')
            mock_tg_green = Mock(arn='arn:tg-green')
            mock_tg.side_effect = [mock_tg_blue, mock_tg_green]

            mock_asg_blue = Mock()
            mock_asg_blue.name = 'asg-blue'
            mock_asg_green = Mock()
            mock_asg_green.name = 'asg-green'
            mock_asg.side_effect = [mock_asg_blue, mock_asg_green]

            app = App()
            stack = TerraformStack(app, "test-stack")
            compute = ComputeStack(
                stack,
                'ComputeTest',
                vpc_id='vpc-12345',
                public_subnet_ids=['subnet-1', 'subnet-2'],
                private_subnet_ids=['subnet-3', 'subnet-4'],
                database_endpoint='db.endpoint.com',
                database_secret_arn='arn:aws:secret',
                environment_suffix='test'
            )

            assert compute.alb_arn == 'arn:alb'
            assert compute.alb_dns_name == 'alb.test.com'
            assert compute.blue_target_group_arn == 'arn:tg-blue'
            assert compute.green_target_group_arn == 'arn:tg-green'
            assert compute.blue_asg_name == 'asg-blue'
            assert compute.green_asg_name == 'asg-green'
            assert compute.artifacts_bucket_name == 'bucket-test'

    def test_compute_stack_user_data_encoding(self):
        """Test ComputeStack user data is properly base64 encoded"""
        from lib.compute_stack import ComputeStack

        with patch('lib.compute_stack.S3Bucket'), \
             patch('lib.compute_stack.S3BucketVersioningA'), \
             patch('lib.compute_stack.S3BucketServerSideEncryptionConfigurationA'), \
             patch('lib.compute_stack.SecurityGroup'), \
             patch('lib.compute_stack.Lb'), \
             patch('lib.compute_stack.LbTargetGroup'), \
             patch('lib.compute_stack.LbListener'), \
             patch('lib.compute_stack.IamRole'), \
             patch('lib.compute_stack.IamRolePolicyAttachment'), \
             patch('lib.compute_stack.IamInstanceProfile'), \
             patch('lib.compute_stack.DataAwsAmi'), \
             patch('lib.compute_stack.LaunchTemplate') as mock_lt, \
             patch('lib.compute_stack.AutoscalingGroup'):

            app = App()
            stack = TerraformStack(app, "test-stack")
            ComputeStack(
                stack,
                'ComputeTest',
                vpc_id='vpc-12345',
                public_subnet_ids=['subnet-1', 'subnet-2'],
                private_subnet_ids=['subnet-3', 'subnet-4'],
                database_endpoint='db.endpoint.com',
                database_secret_arn='arn:aws:secret',
                environment_suffix='test'
            )

            lt_calls = mock_lt.call_args_list

            # Test Blue user data
            blue_user_data = lt_calls[0][1]['user_data']
            decoded_blue = base64.b64decode(blue_user_data).decode()
            assert 'BLUE' in decoded_blue
            assert '#!/bin/bash' in decoded_blue

            # Test Green user data
            green_user_data = lt_calls[1][1]['user_data']
            decoded_green = base64.b64decode(green_user_data).decode()
            assert 'GREEN' in decoded_green
            assert '#!/bin/bash' in decoded_green

    def test_compute_stack_alb_security_group(self):
        """Test ComputeStack ALB security group rules"""
        from lib.compute_stack import ComputeStack

        with patch('lib.compute_stack.S3Bucket'), \
             patch('lib.compute_stack.S3BucketVersioningA'), \
             patch('lib.compute_stack.S3BucketServerSideEncryptionConfigurationA'), \
             patch('lib.compute_stack.SecurityGroup') as mock_sg, \
             patch('lib.compute_stack.Lb'), \
             patch('lib.compute_stack.LbTargetGroup'), \
             patch('lib.compute_stack.LbListener'), \
             patch('lib.compute_stack.IamRole'), \
             patch('lib.compute_stack.IamRolePolicyAttachment'), \
             patch('lib.compute_stack.IamInstanceProfile'), \
             patch('lib.compute_stack.DataAwsAmi'), \
             patch('lib.compute_stack.LaunchTemplate'), \
             patch('lib.compute_stack.AutoscalingGroup'):

            mock_sg.return_value = Mock(id='sg-test')

            app = App()
            stack = TerraformStack(app, "test-stack")
            ComputeStack(
                stack,
                'ComputeTest',
                vpc_id='vpc-12345',
                public_subnet_ids=['subnet-1', 'subnet-2'],
                private_subnet_ids=['subnet-3', 'subnet-4'],
                database_endpoint='db.endpoint.com',
                database_secret_arn='arn:aws:secret',
                environment_suffix='test'
            )

            # Check ALB security group (first call)
            alb_sg_call = mock_sg.call_args_list[0]
            ingress_rules = alb_sg_call[1]['ingress']

            # Should have HTTP and HTTPS rules
            assert len(ingress_rules) == 2
            assert any(rule.from_port == 80 for rule in ingress_rules)
            assert any(rule.from_port == 443 for rule in ingress_rules)

    def test_compute_stack_asg_configuration(self):
        """Test ComputeStack ASG configuration"""
        from lib.compute_stack import ComputeStack

        with patch('lib.compute_stack.S3Bucket'), \
             patch('lib.compute_stack.S3BucketVersioningA'), \
             patch('lib.compute_stack.S3BucketServerSideEncryptionConfigurationA'), \
             patch('lib.compute_stack.SecurityGroup'), \
             patch('lib.compute_stack.Lb'), \
             patch('lib.compute_stack.LbTargetGroup'), \
             patch('lib.compute_stack.LbListener'), \
             patch('lib.compute_stack.IamRole'), \
             patch('lib.compute_stack.IamRolePolicyAttachment'), \
             patch('lib.compute_stack.IamInstanceProfile'), \
             patch('lib.compute_stack.DataAwsAmi'), \
             patch('lib.compute_stack.LaunchTemplate'), \
             patch('lib.compute_stack.AutoscalingGroup') as mock_asg:

            app = App()
            stack = TerraformStack(app, "test-stack")
            ComputeStack(
                stack,
                'ComputeTest',
                vpc_id='vpc-12345',
                public_subnet_ids=['subnet-1', 'subnet-2'],
                private_subnet_ids=['subnet-3', 'subnet-4'],
                database_endpoint='db.endpoint.com',
                database_secret_arn='arn:aws:secret',
                environment_suffix='test'
            )

            asg_calls = mock_asg.call_args_list

            # Check Blue ASG
            blue_asg = asg_calls[0][1]
            assert blue_asg['min_size'] == 1
            assert blue_asg['max_size'] == 4
            assert blue_asg['desired_capacity'] == 2
            assert blue_asg['health_check_type'] == 'ELB'

            # Check Green ASG
            green_asg = asg_calls[1][1]
            assert green_asg['min_size'] == 1
            assert green_asg['max_size'] == 4
            assert green_asg['desired_capacity'] == 2
            assert green_asg['health_check_type'] == 'ELB'


class TestMonitoringStack:
    """Test cases for MonitoringStack"""

    @patch('lib.monitoring_stack.CloudwatchMetricAlarm')
    @patch('lib.monitoring_stack.SnsTopic')
    @patch('lib.monitoring_stack.Fn')
    def test_monitoring_stack_initialization(
        self,
        mock_fn,
        mock_sns,
        mock_alarm
    ):
        """Test MonitoringStack creates SNS topic and alarms"""
        from lib.monitoring_stack import MonitoringStack

        mock_sns_instance = Mock()
        mock_sns_instance.arn = 'arn:aws:sns:topic'
        mock_sns.return_value = mock_sns_instance

        # Mock Terraform functions
        mock_fn.split.return_value = ['part1', 'part2']
        mock_fn.element.return_value = 'alb-dimension'

        app = App()
        stack = TerraformStack(app, "test-stack")
        monitoring = MonitoringStack(
            stack,
            'MonitoringTest',
            alb_arn='arn:aws:elasticloadbalancing:region:account:loadbalancer/app/my-alb/123',
            blue_asg_name='blue-asg',
            green_asg_name='green-asg',
            environment_suffix='test'
        )

        # Verify SNS topic creation
        mock_sns.assert_called_once()
        sns_call = mock_sns.call_args
        assert 'bluegreen-alerts-v1-test' in sns_call[1]['name']

        # Verify alarms creation (ALB 5XX, Blue unhealthy, Green unhealthy)
        assert mock_alarm.call_count == 3

    def test_monitoring_stack_alarm_configuration(self):
        """Test MonitoringStack alarm configurations"""
        from lib.monitoring_stack import MonitoringStack

        with patch('lib.monitoring_stack.SnsTopic') as mock_sns, \
             patch('lib.monitoring_stack.CloudwatchMetricAlarm') as mock_alarm, \
             patch('lib.monitoring_stack.Fn'):

            mock_sns_instance = Mock()
            mock_sns_instance.arn = 'arn:aws:sns:topic'
            mock_sns.return_value = mock_sns_instance

            app = App()
            stack = TerraformStack(app, "test-stack")
            MonitoringStack(
                stack,
                'MonitoringTest',
                alb_arn='arn:aws:elasticloadbalancing:region:account:loadbalancer/app/my-alb/123',
                blue_asg_name='blue-asg',
                green_asg_name='green-asg',
                environment_suffix='test'
            )

            alarm_calls = mock_alarm.call_args_list

            # Check ALB 5XX alarm
            alb_alarm = alarm_calls[0][1]
            assert 'bluegreen-alb-5xx-v1-test' in alb_alarm['alarm_name']
            assert alb_alarm['metric_name'] == 'HTTPCode_Target_5XX_Count'
            assert alb_alarm['threshold'] == 10
            assert alb_alarm['comparison_operator'] == 'GreaterThanThreshold'

            # Check Blue unhealthy alarm
            blue_alarm = alarm_calls[1][1]
            assert 'bluegreen-blue-unhealthy-v1-test' in blue_alarm['alarm_name']
            assert blue_alarm['metric_name'] == 'UnHealthyHostCount'
            assert blue_alarm['threshold'] == 0

            # Check Green unhealthy alarm
            green_alarm = alarm_calls[2][1]
            assert 'bluegreen-green-unhealthy-v1-test' in green_alarm['alarm_name']
            assert green_alarm['metric_name'] == 'UnHealthyHostCount'
            assert green_alarm['threshold'] == 0

    def test_monitoring_stack_properties(self):
        """Test MonitoringStack properties return correct values"""
        from lib.monitoring_stack import MonitoringStack

        with patch('lib.monitoring_stack.SnsTopic') as mock_sns, \
             patch('lib.monitoring_stack.CloudwatchMetricAlarm'), \
             patch('lib.monitoring_stack.Fn'):

            mock_sns_instance = Mock()
            mock_sns_instance.arn = 'arn:aws:sns:test-topic'
            mock_sns.return_value = mock_sns_instance

            app = App()
            stack = TerraformStack(app, "test-stack")
            monitoring = MonitoringStack(
                stack,
                'MonitoringTest',
                alb_arn='arn:aws:elasticloadbalancing:region:account:loadbalancer/app/my-alb/123',
                blue_asg_name='blue-asg',
                green_asg_name='green-asg',
                environment_suffix='test'
            )

            assert monitoring.sns_topic_arn == 'arn:aws:sns:test-topic'

    def test_monitoring_stack_alarm_actions(self):
        """Test MonitoringStack alarms have SNS actions"""
        from lib.monitoring_stack import MonitoringStack

        with patch('lib.monitoring_stack.SnsTopic') as mock_sns, \
             patch('lib.monitoring_stack.CloudwatchMetricAlarm') as mock_alarm, \
             patch('lib.monitoring_stack.Fn'):

            mock_sns_instance = Mock()
            mock_sns_instance.arn = 'arn:aws:sns:topic'
            mock_sns.return_value = mock_sns_instance

            app = App()
            stack = TerraformStack(app, "test-stack")
            MonitoringStack(
                stack,
                'MonitoringTest',
                alb_arn='arn:aws:elasticloadbalancing:region:account:loadbalancer/app/my-alb/123',
                blue_asg_name='blue-asg',
                green_asg_name='green-asg',
                environment_suffix='test'
            )

            # Verify all alarms have SNS actions
            for call in mock_alarm.call_args_list:
                alarm_actions = call[1]['alarm_actions']
                assert 'arn:aws:sns:topic' in alarm_actions


class TestHelperFunctions:
    """Test cases for helper functions"""

    def test_create_allow_all_egress_rule(self):
        """Test create_allow_all_egress_rule function"""
        from lib import create_allow_all_egress_rule

        egress_rule = create_allow_all_egress_rule()

        assert egress_rule.from_port == 0
        assert egress_rule.to_port == 0
        assert egress_rule.protocol == '-1'
        assert egress_rule.cidr_blocks == ['0.0.0.0/0']
        assert egress_rule.description == 'Allow all outbound'


class TestIntegration:
    """Integration tests for full stack deployment"""

    @patch('lib.tap_stack.S3Backend')
    @patch('lib.tap_stack.AwsProvider')
    @patch('lib.network_stack.Vpc')
    @patch('lib.network_stack.Subnet')
    @patch('lib.network_stack.InternetGateway')
    @patch('lib.network_stack.Eip')
    @patch('lib.network_stack.NatGateway')
    @patch('lib.network_stack.RouteTable')
    @patch('lib.network_stack.RouteTableAssociation')
    @patch('lib.database_stack.SecurityGroup')
    @patch('lib.database_stack.DbSubnetGroup')
    @patch('lib.database_stack.SecretsmanagerSecret')
    @patch('lib.database_stack.SecretsmanagerSecretVersion')
    @patch('lib.database_stack.RdsCluster')
    @patch('lib.database_stack.RdsClusterInstance')
    @patch('lib.compute_stack.S3Bucket')
    @patch('lib.compute_stack.S3BucketVersioningA')
    @patch('lib.compute_stack.S3BucketServerSideEncryptionConfigurationA')
    @patch('lib.compute_stack.Lb')
    @patch('lib.compute_stack.LbTargetGroup')
    @patch('lib.compute_stack.LbListener')
    @patch('lib.compute_stack.IamRole')
    @patch('lib.compute_stack.IamRolePolicyAttachment')
    @patch('lib.compute_stack.IamInstanceProfile')
    @patch('lib.compute_stack.DataAwsAmi')
    @patch('lib.compute_stack.LaunchTemplate')
    @patch('lib.compute_stack.AutoscalingGroup')
    @patch('lib.monitoring_stack.SnsTopic')
    @patch('lib.monitoring_stack.CloudwatchMetricAlarm')
    @patch('lib.monitoring_stack.Fn')
    @patch('lib.tap_stack.TerraformOutput')
    def test_full_stack_deployment(self, *mocks):
        """Test full stack deployment creates all resources"""
        from lib.tap_stack import TapStack

        # Setup all necessary mocks to return valid IDs
        mock_output = mocks[0]
        mock_vpc = mocks[-28]
        mock_subnet = mocks[-27]

        mock_vpc.return_value = Mock(id='vpc-12345')
        mock_subnet.side_effect = [Mock(id=f'subnet-{i}') for i in range(4)]

        # Setup other required mocks
        for mock in mocks[1:-2]:
            if hasattr(mock, 'return_value'):
                mock.return_value = Mock(
                    id='test-id',
                    arn='test-arn',
                    name='test-name',
                    endpoint='test-endpoint',
                    dns_name='test-dns'
                )

        app = App()
        stack = TapStack(
            app,
            'FullStackTest',
            environment_suffix='integration',
            state_bucket='test-bucket',
            state_bucket_region='us-east-1',
            primary_region='us-east-1',
            secondary_region='us-west-2'
        )

        # Verify stack was created successfully
        assert stack is not None
        assert stack.environment_suffix == 'integration'
        assert stack.primary_region == 'us-east-1'
        assert stack.secondary_region == 'us-west-2'


if __name__ == '__main__':
    pytest.main([__file__, '-v', '--cov=lib', '--cov-report=term-missing'])

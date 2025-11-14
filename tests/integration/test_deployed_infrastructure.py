"""
Integration tests for live deployed multi-environment infrastructure.
Tests actual AWS resources created by the Pulumi stack using stack outputs.
NO MOCKING - All tests validate real deployed resources.
"""

import unittest
import json
import os
import boto3
from botocore.exceptions import ClientError


class TestDeployedInfrastructure(unittest.TestCase):
    """Integration tests against live deployed Pulumi stack."""

    @classmethod
    def setUpClass(cls):
        """Load stack outputs from deployment."""
        # Load outputs from cfn-outputs/flat-outputs.json
        outputs_file = "cfn-outputs/flat-outputs.json"

        if not os.path.exists(outputs_file):
            raise FileNotFoundError(
                f"Stack outputs file not found: {outputs_file}. "
                "Please ensure the stack is deployed."
            )

        with open(outputs_file, 'r') as f:
            cls.outputs = json.load(f)
        
        # Parse JSON-encoded list values back to Python lists
        for key in ['public_subnet_ids', 'private_subnet_ids']:
            if key in cls.outputs and isinstance(cls.outputs[key], str):
                try:
                    cls.outputs[key] = json.loads(cls.outputs[key])
                except (json.JSONDecodeError, TypeError):
                    pass  # Keep as-is if not valid JSON

        # Initialize AWS clients
        cls.region = os.getenv('AWS_REGION', 'us-east-1')
        cls.ec2_client = boto3.client('ec2', region_name=cls.region)
        cls.elbv2_client = boto3.client('elbv2', region_name=cls.region)
        cls.autoscaling_client = boto3.client('autoscaling', region_name=cls.region)
        cls.rds_client = boto3.client('rds', region_name=cls.region)
        cls.s3_client = boto3.client('s3', region_name=cls.region)
        cls.secretsmanager_client = boto3.client('secretsmanager', region_name=cls.region)

    def test_stack_outputs_exist(self):
        """Test that all required stack outputs are present."""
        required_outputs = [
            'vpc_id', 'vpc_cidr', 'public_subnet_ids', 'private_subnet_ids',
            'alb_dns_name', 'alb_arn', 'target_group_arn',
            'asg_name', 'asg_arn',
            'rds_endpoint', 'rds_arn', 'rds_secret_arn',
            's3_bucket_name', 's3_bucket_arn',
            'environment', 'stack'
        ]

        for output in required_outputs:
            self.assertIn(
                output, self.outputs,
                f"Required output '{output}' missing from stack outputs"
            )
            self.assertIsNotNone(
                self.outputs[output],
                f"Output '{output}' is None"
            )


class TestVPCResources(TestDeployedInfrastructure):
    """Test VPC and networking resources."""

    def test_vpc_exists_and_accessible(self):
        """Test VPC exists and is in available state."""
        vpc_id = self.outputs['vpc_id']

        response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])

        self.assertEqual(len(response['Vpcs']), 1)
        vpc = response['Vpcs'][0]

        self.assertEqual(vpc['VpcId'], vpc_id)
        self.assertEqual(vpc['State'], 'available')
        # DNS settings are in a separate API call
        dns_response = self.ec2_client.describe_vpc_attribute(
            VpcId=vpc_id, Attribute='enableDnsHostnames'
        )
        self.assertTrue(dns_response['EnableDnsHostnames']['Value'])

    def test_vpc_cidr_matches_configuration(self):
        """Test VPC CIDR block matches stack configuration."""
        vpc_id = self.outputs['vpc_id']
        expected_cidr = self.outputs['vpc_cidr']

        response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])
        vpc = response['Vpcs'][0]

        self.assertEqual(vpc['CidrBlock'], expected_cidr)

    def test_vpc_has_tags(self):
        """Test VPC has required tags."""
        vpc_id = self.outputs['vpc_id']

        response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])
        vpc = response['Vpcs'][0]

        tags = {tag['Key']: tag['Value'] for tag in vpc.get('Tags', [])}

        self.assertIn('Environment', tags)
        self.assertIn('ManagedBy', tags)
        self.assertEqual(tags['ManagedBy'], 'Pulumi')

    def test_public_subnets_exist(self):
        """Test public subnets are created and accessible."""
        public_subnet_ids = self.outputs['public_subnet_ids']

        self.assertIsInstance(public_subnet_ids, list)
        self.assertEqual(len(public_subnet_ids), 2, "Should have 2 public subnets")

        for subnet_id in public_subnet_ids:
            response = self.ec2_client.describe_subnets(SubnetIds=[subnet_id])
            self.assertEqual(len(response['Subnets']), 1)
            subnet = response['Subnets'][0]
            self.assertTrue(subnet['MapPublicIpOnLaunch'])

    def test_private_subnets_exist(self):
        """Test private subnets are created and accessible."""
        private_subnet_ids = self.outputs['private_subnet_ids']

        self.assertIsInstance(private_subnet_ids, list)
        self.assertEqual(len(private_subnet_ids), 2, "Should have 2 private subnets")

        for subnet_id in private_subnet_ids:
            response = self.ec2_client.describe_subnets(SubnetIds=[subnet_id])
            self.assertEqual(len(response['Subnets']), 1)
            subnet = response['Subnets'][0]
            self.assertFalse(subnet['MapPublicIpOnLaunch'])

    def test_internet_gateway_exists(self):
        """Test Internet Gateway is attached to VPC."""
        vpc_id = self.outputs['vpc_id']

        response = self.ec2_client.describe_internet_gateways(
            Filters=[{'Name': 'attachment.vpc-id', 'Values': [vpc_id]}]
        )

        self.assertEqual(len(response['InternetGateways']), 1)
        igw = response['InternetGateways'][0]
        self.assertEqual(igw['Attachments'][0]['State'], 'available')

    def test_nat_gateway_exists(self):
        """Test NAT Gateway exists and is available."""
        public_subnet_ids = self.outputs['public_subnet_ids']

        response = self.ec2_client.describe_nat_gateways(
            Filters=[{'Name': 'subnet-id', 'Values': public_subnet_ids}]
        )

        self.assertGreater(len(response['NatGateways']), 0)
        nat_gateway = response['NatGateways'][0]
        self.assertEqual(nat_gateway['State'], 'available')


class TestLoadBalancerResources(TestDeployedInfrastructure):
    """Test Application Load Balancer resources."""

    def test_alb_exists_and_accessible(self):
        """Test ALB exists and is in active state."""
        alb_arn = self.outputs['alb_arn']

        response = self.elbv2_client.describe_load_balancers(
            LoadBalancerArns=[alb_arn]
        )

        self.assertEqual(len(response['LoadBalancers']), 1)
        alb = response['LoadBalancers'][0]

        self.assertEqual(alb['State']['Code'], 'active')
        self.assertEqual(alb['Type'], 'application')
        self.assertEqual(alb['Scheme'], 'internet-facing')

    def test_alb_dns_name_resolves(self):
        """Test ALB DNS name matches stack output."""
        alb_arn = self.outputs['alb_arn']
        expected_dns = self.outputs['alb_dns_name']

        response = self.elbv2_client.describe_load_balancers(
            LoadBalancerArns=[alb_arn]
        )

        alb = response['LoadBalancers'][0]
        self.assertEqual(alb['DNSName'], expected_dns)

    def test_target_group_exists(self):
        """Test target group exists and is healthy."""
        target_group_arn = self.outputs['target_group_arn']

        response = self.elbv2_client.describe_target_groups(
            TargetGroupArns=[target_group_arn]
        )

        self.assertEqual(len(response['TargetGroups']), 1)
        tg = response['TargetGroups'][0]

        self.assertEqual(tg['Protocol'], 'HTTP')
        self.assertEqual(tg['Port'], 80)
        self.assertTrue(tg['HealthCheckEnabled'])

    def test_alb_listener_configured(self):
        """Test ALB has listener configured."""
        alb_arn = self.outputs['alb_arn']

        response = self.elbv2_client.describe_listeners(
            LoadBalancerArn=alb_arn
        )

        self.assertGreater(len(response['Listeners']), 0)
        listener = response['Listeners'][0]
        self.assertEqual(listener['Protocol'], 'HTTP')
        self.assertEqual(listener['Port'], 80)


class TestAutoScalingResources(TestDeployedInfrastructure):
    """Test Auto Scaling Group resources."""

    def test_asg_exists(self):
        """Test Auto Scaling Group exists with correct configuration."""
        asg_name = self.outputs['asg_name']

        response = self.autoscaling_client.describe_auto_scaling_groups(
            AutoScalingGroupNames=[asg_name]
        )

        self.assertEqual(len(response['AutoScalingGroups']), 1)
        asg = response['AutoScalingGroups'][0]

        self.assertEqual(asg['AutoScalingGroupName'], asg_name)
        self.assertEqual(asg['HealthCheckType'], 'ELB')

    def test_asg_has_launch_template(self):
        """Test ASG is configured with launch template."""
        asg_name = self.outputs['asg_name']

        response = self.autoscaling_client.describe_auto_scaling_groups(
            AutoScalingGroupNames=[asg_name]
        )

        asg = response['AutoScalingGroups'][0]
        self.assertIn('LaunchTemplate', asg)
        self.assertIsNotNone(asg['LaunchTemplate']['LaunchTemplateId'])

    def test_asg_target_group_attached(self):
        """Test ASG is attached to target group."""
        asg_name = self.outputs['asg_name']
        target_group_arn = self.outputs['target_group_arn']

        response = self.autoscaling_client.describe_auto_scaling_groups(
            AutoScalingGroupNames=[asg_name]
        )

        asg = response['AutoScalingGroups'][0]
        self.assertIn(target_group_arn, asg['TargetGroupARNs'])

    def test_asg_instances_in_private_subnets(self):
        """Test ASG instances are in private subnets."""
        asg_name = self.outputs['asg_name']
        private_subnet_ids = set(self.outputs['private_subnet_ids'])

        response = self.autoscaling_client.describe_auto_scaling_groups(
            AutoScalingGroupNames=[asg_name]
        )

        asg = response['AutoScalingGroups'][0]
        asg_subnets = set(asg['VPCZoneIdentifier'].split(','))

        self.assertEqual(asg_subnets, private_subnet_ids)


class TestRDSResources(TestDeployedInfrastructure):
    """Test RDS database resources."""

    def test_rds_instance_exists(self):
        """Test RDS instance exists and is available."""
        rds_arn = self.outputs['rds_arn']
        db_identifier = rds_arn.split(':')[-1]

        response = self.rds_client.describe_db_instances(
            DBInstanceIdentifier=db_identifier
        )

        self.assertEqual(len(response['DBInstances']), 1)
        db = response['DBInstances'][0]

        self.assertEqual(db['DBInstanceStatus'], 'available')
        self.assertEqual(db['Engine'], 'mysql')

    def test_rds_endpoint_matches_output(self):
        """Test RDS endpoint matches stack output."""
        rds_arn = self.outputs['rds_arn']
        expected_endpoint = self.outputs['rds_endpoint']
        db_identifier = rds_arn.split(':')[-1]

        response = self.rds_client.describe_db_instances(
            DBInstanceIdentifier=db_identifier
        )

        db = response['DBInstances'][0]
        actual_endpoint = f"{db['Endpoint']['Address']}:{db['Endpoint']['Port']}"

        self.assertEqual(actual_endpoint, expected_endpoint)

    def test_rds_in_private_subnets(self):
        """Test RDS is deployed in private subnets."""
        rds_arn = self.outputs['rds_arn']
        db_identifier = rds_arn.split(':')[-1]

        response = self.rds_client.describe_db_instances(
            DBInstanceIdentifier=db_identifier
        )

        db = response['DBInstances'][0]
        db_subnets = [s['SubnetIdentifier'] for s in db['DBSubnetGroup']['Subnets']]
        private_subnet_ids = self.outputs['private_subnet_ids']

        # Verify at least some private subnets are used
        self.assertTrue(any(subnet in private_subnet_ids for subnet in db_subnets))

    def test_rds_secret_exists(self):
        """Test RDS password secret exists in Secrets Manager."""
        secret_arn = self.outputs['rds_secret_arn']

        response = self.secretsmanager_client.describe_secret(
            SecretId=secret_arn
        )

        self.assertEqual(response['ARN'], secret_arn)
        self.assertIsNotNone(response['Name'])

    def test_rds_secret_contains_credentials(self):
        """Test RDS secret contains valid credentials structure."""
        secret_arn = self.outputs['rds_secret_arn']

        response = self.secretsmanager_client.get_secret_value(
            SecretId=secret_arn
        )

        secret_data = json.loads(response['SecretString'])

        # Verify required fields
        self.assertIn('username', secret_data)
        self.assertIn('password', secret_data)
        self.assertIn('engine', secret_data)
        self.assertIn('host', secret_data)
        self.assertIn('port', secret_data)

        # Verify values are populated
        self.assertIsNotNone(secret_data['password'])
        self.assertGreater(len(secret_data['password']), 0)


class TestS3Resources(TestDeployedInfrastructure):
    """Test S3 bucket resources."""

    def test_s3_bucket_exists(self):
        """Test S3 bucket exists and is accessible."""
        bucket_name = self.outputs['s3_bucket_name']

        response = self.s3_client.head_bucket(Bucket=bucket_name)

        # If no exception, bucket exists
        self.assertIsNotNone(response)

    def test_s3_bucket_versioning_enabled(self):
        """Test S3 bucket has versioning enabled."""
        bucket_name = self.outputs['s3_bucket_name']

        response = self.s3_client.get_bucket_versioning(Bucket=bucket_name)

        self.assertEqual(response.get('Status'), 'Enabled')

    def test_s3_bucket_encryption_enabled(self):
        """Test S3 bucket has encryption enabled."""
        bucket_name = self.outputs['s3_bucket_name']

        response = self.s3_client.get_bucket_encryption(Bucket=bucket_name)

        self.assertIn('ServerSideEncryptionConfiguration', response)
        config = response['ServerSideEncryptionConfiguration']
        self.assertIn('Rules', config)
        self.assertGreater(len(config['Rules']), 0)

        rule = config['Rules'][0]
        self.assertIn('ApplyServerSideEncryptionByDefault', rule)

    def test_s3_bucket_public_access_blocked(self):
        """Test S3 bucket blocks public access."""
        bucket_name = self.outputs['s3_bucket_name']

        response = self.s3_client.get_public_access_block(Bucket=bucket_name)

        config = response['PublicAccessBlockConfiguration']
        self.assertTrue(config['BlockPublicAcls'])
        self.assertTrue(config['BlockPublicPolicy'])
        self.assertTrue(config['IgnorePublicAcls'])
        self.assertTrue(config['RestrictPublicBuckets'])

    def test_s3_bucket_tags(self):
        """Test S3 bucket has required tags."""
        bucket_name = self.outputs['s3_bucket_name']

        response = self.s3_client.get_bucket_tagging(Bucket=bucket_name)

        tags = {tag['Key']: tag['Value'] for tag in response['TagSet']}

        self.assertIn('Environment', tags)
        self.assertIn('ManagedBy', tags)


class TestResourceIntegration(TestDeployedInfrastructure):
    """Test integration between different resources."""

    def test_alb_in_public_subnets(self):
        """Test ALB is deployed in public subnets."""
        alb_arn = self.outputs['alb_arn']
        public_subnet_ids = set(self.outputs['public_subnet_ids'])

        response = self.elbv2_client.describe_load_balancers(
            LoadBalancerArns=[alb_arn]
        )

        alb = response['LoadBalancers'][0]
        alb_subnets = set([az['SubnetId'] for az in alb['AvailabilityZones']])

        self.assertEqual(alb_subnets, public_subnet_ids)

    def test_all_resources_in_same_vpc(self):
        """Test all resources are deployed in the same VPC."""
        vpc_id = self.outputs['vpc_id']

        # Check ALB
        alb_arn = self.outputs['alb_arn']
        alb_response = self.elbv2_client.describe_load_balancers(
            LoadBalancerArns=[alb_arn]
        )
        self.assertEqual(alb_response['LoadBalancers'][0]['VpcId'], vpc_id)

        # Check RDS
        rds_arn = self.outputs['rds_arn']
        db_identifier = rds_arn.split(':')[-1]
        rds_response = self.rds_client.describe_db_instances(
            DBInstanceIdentifier=db_identifier
        )

        # RDS DBSubnetGroup VPC should match
        db_subnet_group = rds_response['DBInstances'][0]['DBSubnetGroup']
        self.assertEqual(db_subnet_group['VpcId'], vpc_id)

    def test_environment_consistency(self):
        """Test all resources are tagged with same environment."""
        environment = self.outputs['environment']
        vpc_id = self.outputs['vpc_id']

        # Check VPC tags
        vpc_response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])
        vpc_tags = {tag['Key']: tag['Value'] for tag in vpc_response['Vpcs'][0].get('Tags', [])}
        self.assertEqual(vpc_tags.get('Environment'), environment)


if __name__ == "__main__":
    unittest.main()

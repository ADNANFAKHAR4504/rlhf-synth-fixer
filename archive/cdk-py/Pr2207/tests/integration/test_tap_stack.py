import json
import os
import unittest
import boto3
from botocore.exceptions import ClientError
from pytest import mark

# Open file cfn-outputs/flat-outputs.json
base_dir = os.path.dirname(os.path.abspath(__file__))
flat_outputs_path = os.path.join(
    base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json'
)

if os.path.exists(flat_outputs_path):
    with open(flat_outputs_path, 'r', encoding='utf-8') as f:
        flat_outputs = f.read()
else:
    flat_outputs = '{}'

flat_outputs = json.loads(flat_outputs)


@mark.describe("TapStack Integration Tests")
class TestTapStack(unittest.TestCase):
    """Integration test cases for the TapStack CDK stack"""

    def setUp(self):
        """Set up AWS clients for integration testing"""
        self.region = os.environ.get('AWS_REGION', 'us-west-2')

        # Initialize AWS clients
        self.ec2_client = boto3.client('ec2', region_name=self.region)
        self.elbv2_client = boto3.client('elbv2', region_name=self.region)
        self.autoscaling_client = boto3.client('autoscaling', region_name=self.region)
        self.rds_client = boto3.client('rds', region_name=self.region)
        self.s3_client = boto3.client('s3', region_name=self.region)
        self.cloudwatch_client = boto3.client('cloudwatch', region_name=self.region)
        self.lambda_client = boto3.client('lambda', region_name=self.region)
        self.kms_client = boto3.client('kms', region_name=self.region)
        self.secretsmanager_client = boto3.client('secretsmanager', region_name=self.region)

    @mark.it("validates VPC exists with correct configuration")
    def test_vpc_exists_with_correct_configuration(self):
        """Test that VPC exists and has correct configuration"""
        vpc_id = flat_outputs.get('VPCID')
        vpc_cidr = flat_outputs.get('VPCCIDR')

        self.assertIsNotNone(vpc_id, "VPC ID should be in outputs")
        self.assertIsNotNone(vpc_cidr, "VPC CIDR should be in outputs")

        # Validate VPC exists
        vpc_response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])
        vpc = vpc_response['Vpcs'][0]

        self.assertEqual(vpc['CidrBlock'], vpc_cidr)
        self.assertEqual(vpc['State'], 'available')

    @mark.it("validates subnets exist across multiple AZs")
    def test_subnets_exist_across_multiple_azs(self):
        """Test that subnets exist and span multiple availability zones"""
        public_subnet_ids = flat_outputs.get('PublicSubnetIDs', '').split(',')
        private_subnet_ids = flat_outputs.get('PrivateSubnetIDs', '').split(',')
        isolated_subnet_ids = flat_outputs.get('IsolatedSubnetIDs', '').split(',')

        all_subnet_ids = public_subnet_ids + private_subnet_ids + isolated_subnet_ids
        all_subnet_ids = [sid for sid in all_subnet_ids if sid.strip()]

        self.assertEqual(len(all_subnet_ids), 6, "Should have 6 subnets total")

        # Get subnet details
        subnets_response = self.ec2_client.describe_subnets(SubnetIds=all_subnet_ids)

        # Check availability zones
        azs = set(subnet['AvailabilityZone'] for subnet in subnets_response['Subnets'])
        self.assertEqual(len(azs), 2, "Should span 2 availability zones")

        # Validate each subnet type
        self.assertEqual(len(public_subnet_ids), 2, "Should have 2 public subnets")
        self.assertEqual(len(private_subnet_ids), 2, "Should have 2 private subnets")
        self.assertEqual(len(isolated_subnet_ids), 2, "Should have 2 isolated subnets")

    @mark.it("validates security groups exist with correct rules")
    def test_security_groups_exist_with_correct_rules(self):
        """Test that security groups exist with correct ingress/egress rules"""
        alb_sg_id = flat_outputs.get('ALBSecurityGroupID')
        ec2_sg_id = flat_outputs.get('EC2SecurityGroupID')
        db_sg_id = flat_outputs.get('DBSecurityGroupID')

        self.assertIsNotNone(alb_sg_id, "ALB Security Group ID should be in outputs")
        self.assertIsNotNone(ec2_sg_id, "EC2 Security Group ID should be in outputs")
        self.assertIsNotNone(db_sg_id, "DB Security Group ID should be in outputs")

        # Get security groups
        sg_response = self.ec2_client.describe_security_groups(
            GroupIds=[alb_sg_id, ec2_sg_id, db_sg_id]
        )

        # Find ALB security group and validate rules
        alb_sg = next(sg for sg in sg_response['SecurityGroups'] if sg['GroupId'] == alb_sg_id)

        # Check HTTP and HTTPS ingress rules
        ingress_rules = alb_sg['IpPermissions']
        http_rule_exists = any(
            rule['FromPort'] == 80 and rule['ToPort'] == 80 and
            any(ip_range['CidrIp'] == '0.0.0.0/0' for ip_range in rule.get('IpRanges', []))
            for rule in ingress_rules
        )
        https_rule_exists = any(
            rule['FromPort'] == 443 and rule['ToPort'] == 443 and
            any(ip_range['CidrIp'] == '0.0.0.0/0' for ip_range in rule.get('IpRanges', []))
            for rule in ingress_rules
        )

        self.assertTrue(http_rule_exists, "ALB should allow HTTP traffic")
        self.assertTrue(https_rule_exists, "ALB should allow HTTPS traffic")

    @mark.it("validates ALB exists and is properly configured")
    def test_alb_exists_and_configured(self):
        """Test that Application Load Balancer exists and is properly configured"""
        alb_dns = flat_outputs.get('ALBDNS')
        alb_arn = flat_outputs.get('ALBARN')
        alb_hosted_zone_id = flat_outputs.get('ALBHostedZoneID')

        self.assertIsNotNone(alb_dns, "ALB DNS should be in outputs")
        self.assertIsNotNone(alb_arn, "ALB ARN should be in outputs")
        self.assertIsNotNone(alb_hosted_zone_id, "ALB Hosted Zone ID should be in outputs")

        # Get load balancer details
        alb_response = self.elbv2_client.describe_load_balancers(
            LoadBalancerArns=[alb_arn]
        )
        alb = alb_response['LoadBalancers'][0]

        self.assertEqual(alb['Scheme'], 'internet-facing')
        self.assertEqual(alb['Type'], 'application')
        self.assertEqual(alb['State']['Code'], 'active')
        self.assertEqual(alb['DNSName'], alb_dns)
        self.assertEqual(alb['CanonicalHostedZoneId'], alb_hosted_zone_id)

    @mark.it("validates ALB listener has HTTP to HTTPS redirect")
    def test_alb_listener_redirect_configuration(self):
        """Test that ALB listener has proper HTTP to HTTPS redirect"""
        alb_arn = flat_outputs.get('ALBARN')

        # Get listeners
        listeners_response = self.elbv2_client.describe_listeners(
            LoadBalancerArn=alb_arn
        )

        # Find HTTP listener
        http_listener = next(
            (listener for listener in listeners_response['Listeners']
             if listener['Port'] == 80 and listener['Protocol'] == 'HTTP'),
            None
        )

        self.assertIsNotNone(http_listener, "HTTP listener should exist")

        # Check redirect configuration
        default_actions = http_listener['DefaultActions']
        self.assertEqual(len(default_actions), 1)
        self.assertEqual(default_actions[0]['Type'], 'redirect')

        redirect_config = default_actions[0]['RedirectConfig']
        self.assertEqual(redirect_config['Protocol'], 'HTTPS')
        self.assertEqual(redirect_config['Port'], '443')
        self.assertIn(redirect_config['StatusCode'], ['HTTP_301', 'HTTP_302'])

    @mark.it("validates Auto Scaling Group configuration")
    def test_auto_scaling_group_configuration(self):
        """Test that Auto Scaling Group is properly configured"""
        asg_name = flat_outputs.get('AutoScalingGroupName')
        asg_arn = flat_outputs.get('AutoScalingGroupARN')
        launch_template_id = flat_outputs.get('LaunchTemplateID')

        self.assertIsNotNone(asg_name, "ASG Name should be in outputs")
        self.assertIsNotNone(asg_arn, "ASG ARN should be in outputs")
        self.assertIsNotNone(launch_template_id, "Launch Template ID should be in outputs")

        # Get Auto Scaling Group details
        asg_response = self.autoscaling_client.describe_auto_scaling_groups(
            AutoScalingGroupNames=[asg_name]
        )
        asg = asg_response['AutoScalingGroups'][0]

        self.assertEqual(asg['MinSize'], 1)
        self.assertEqual(asg['MaxSize'], 5)
        self.assertGreaterEqual(len(asg['AvailabilityZones']), 2)

        # Validate launch template
        launch_template_response = self.ec2_client.describe_launch_templates(
            LaunchTemplateIds=[launch_template_id]
        )
        self.assertEqual(len(launch_template_response['LaunchTemplates']), 1)

    @mark.it("validates RDS Aurora cluster configuration")
    def test_rds_aurora_cluster_configuration(self):
        """Test that RDS Aurora cluster is properly configured"""
        cluster_identifier = flat_outputs.get('RDSClusterIdentifier')
        cluster_endpoint = flat_outputs.get('RDSClusterEndpoint')
        cluster_reader_endpoint = flat_outputs.get('RDSClusterReaderEndpoint')
        cluster_arn = flat_outputs.get('RDSClusterARN')
        secret_arn = flat_outputs.get('RDSSecretARN')

        self.assertIsNotNone(cluster_identifier, "RDS Cluster Identifier should be in outputs")
        self.assertIsNotNone(cluster_endpoint, "RDS Cluster Endpoint should be in outputs")
        self.assertIsNotNone(cluster_reader_endpoint, "RDS Reader Endpoint should be in outputs")
        self.assertIsNotNone(cluster_arn, "RDS Cluster ARN should be in outputs")
        self.assertIsNotNone(secret_arn, "RDS Secret ARN should be in outputs")

        # Get cluster details
        cluster_response = self.rds_client.describe_db_clusters(
            DBClusterIdentifier=cluster_identifier
        )
        cluster = cluster_response['DBClusters'][0]

        self.assertEqual(cluster['Engine'], 'aurora-mysql')
        self.assertEqual(cluster['DatabaseName'], 'tapdb')
        self.assertEqual(cluster['Status'], 'available')
        self.assertEqual(cluster['Endpoint'], cluster_endpoint)
        self.assertEqual(cluster['ReaderEndpoint'], cluster_reader_endpoint)

        # Validate cluster has writer and reader instances
        self.assertGreaterEqual(len(cluster['DBClusterMembers']), 2)

        # Check if secret exists and is accessible
        try:
            secret_response = self.secretsmanager_client.describe_secret(SecretId=secret_arn)
            self.assertIsNotNone(secret_response['Name'])
        except ClientError as e:
            self.fail(f"RDS secret should be accessible: {e}")

    @mark.it("validates S3 bucket operations")
    def test_s3_bucket_operations(self):
        """Test that S3 buckets support basic operations"""
        primary_bucket = flat_outputs.get('PrimaryBucket')
        test_key = 'integration-test/test-file.txt'
        test_content = 'Integration test content for TapStack'

        try:
            # Put object
            self.s3_client.put_object(
                Bucket=primary_bucket,
                Key=test_key,
                Body=test_content,
                ContentType='text/plain'
            )

            # Get object
            get_response = self.s3_client.get_object(
                Bucket=primary_bucket,
                Key=test_key
            )
            retrieved_content = get_response['Body'].read().decode('utf-8')
            self.assertEqual(retrieved_content, test_content)

            # Verify encryption
            self.assertIn('ServerSideEncryption', get_response)

        except ClientError as e:
            self.fail(f"S3 operations should work: {e}")

        finally:
            # Clean up test object
            try:
                self.s3_client.delete_object(Bucket=primary_bucket, Key=test_key)
            except ClientError:
                pass  # Ignore cleanup errors

    def test_overall_deployment_health(self):
        """Test that all components are healthy and accessible"""
        health_status = {
            'VPC': False,
            'ALB': False,
            'ASG': False,
            'RDS': False,
            'S3_Primary': False,
            'S3_Backup': False,
            'Lambda': False,
            'KMS': False
        }

        # Check VPC
        vpc_id = flat_outputs.get('VPCID')
        if vpc_id:
            try:
                vpc_response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])
                if vpc_response['Vpcs'][0]['State'] == 'available':
                    health_status['VPC'] = True
            except ClientError:
                pass

        # Check ALB
        alb_arn = flat_outputs.get('ALBARN')
        if alb_arn:
            try:
                alb_response = self.elbv2_client.describe_load_balancers(LoadBalancerArns=[alb_arn])
                if alb_response['LoadBalancers'][0]['State']['Code'] == 'active':
                    health_status['ALB'] = True
            except ClientError:
                pass

        # Check ASG
        asg_name = flat_outputs.get('AutoScalingGroupName')
        if asg_name:
            try:
                asg_response = self.autoscaling_client.describe_auto_scaling_groups(
                    AutoScalingGroupNames=[asg_name]
                )
                if len(asg_response['AutoScalingGroups']) > 0:
                    health_status['ASG'] = True
            except ClientError:
                pass

        # Check RDS
        cluster_identifier = flat_outputs.get('RDSClusterIdentifier')
        if cluster_identifier:
            try:
                cluster_response = self.rds_client.describe_db_clusters(
                    DBClusterIdentifier=cluster_identifier
                )
                if cluster_response['DBClusters'][0]['Status'] == 'available':
                    health_status['RDS'] = True
            except ClientError:
                pass

        # Check S3 buckets
        for bucket_key in ['PrimaryBucket', 'BackupBucket']:
            bucket_name = flat_outputs.get(bucket_key)
            if bucket_name:
                try:
                    self.s3_client.head_bucket(Bucket=bucket_name)
                    health_status[f'S3_{bucket_key.replace("Bucket", "")}'] = True
                except ClientError:
                    pass

        # Check Lambda
        function_name = flat_outputs.get('LambdaFunctionName')
        if function_name:
            try:
                function_response = self.lambda_client.get_function(FunctionName=function_name)
                if function_response['Configuration']['State'] == 'Active':
                    health_status['Lambda'] = True
            except ClientError:
                pass

        # Check KMS
        kms_key_id = flat_outputs.get('KMSKeyID')
        if kms_key_id:
            try:
                key_response = self.kms_client.describe_key(KeyId=kms_key_id)
                if key_response['KeyMetadata']['KeyState'] == 'Enabled':
                    health_status['KMS'] = True
            except ClientError:
                pass

        # Assert all components are healthy
        failed_components = [component for component, healthy in health_status.items() if not healthy]
        self.assertEqual(len(failed_components), 0,
                        f"The following components are not healthy: {failed_components}")

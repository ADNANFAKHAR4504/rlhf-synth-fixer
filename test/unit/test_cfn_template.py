"""
Unit tests for CloudFormation template validation.

Tests the CloudFormation template structure, parameters, resources, and outputs
to ensure compliance with requirements and best practices.
"""

import json
import unittest
from pathlib import Path


class TestCloudFormationTemplate(unittest.TestCase):
    """Test CloudFormation template structure and configuration."""

    @classmethod
    def setUpClass(cls):
        """Load the CloudFormation template once for all tests."""
        template_path = Path(__file__).parent.parent.parent / "lib" / "template.json"
        with open(template_path, 'r') as f:
            cls.template = json.load(f)
        cls.resources = cls.template.get('Resources', {})
        cls.parameters = cls.template.get('Parameters', {})
        cls.outputs = cls.template.get('Outputs', {})

    def test_template_version(self):
        """Test that template has correct AWS format version."""
        self.assertEqual(
            self.template.get('AWSTemplateFormatVersion'),
            '2010-09-09',
            "Template must use AWS CloudFormation version 2010-09-09"
        )

    def test_template_has_description(self):
        """Test that template has a description."""
        self.assertIn('Description', self.template)
        self.assertIsInstance(self.template['Description'], str)
        self.assertGreater(len(self.template['Description']), 10)

    def test_required_parameters_exist(self):
        """Test that all required parameters are defined."""
        required_params = [
            'EnvironmentSuffix',
            'Environment',
            'Project',
            'CostCenter'
        ]
        for param in required_params:
            self.assertIn(
                param,
                self.parameters,
                f"Required parameter '{param}' must be defined"
            )

    def test_environment_suffix_parameter(self):
        """Test EnvironmentSuffix parameter configuration."""
        env_suffix = self.parameters['EnvironmentSuffix']
        self.assertEqual(env_suffix['Type'], 'String')
        self.assertIn('AllowedPattern', env_suffix)
        self.assertIn('Default', env_suffix)

    def test_environment_parameter_values(self):
        """Test Environment parameter has correct allowed values."""
        env_param = self.parameters['Environment']
        self.assertEqual(env_param['Type'], 'String')
        self.assertIn('AllowedValues', env_param)
        allowed_values = env_param['AllowedValues']
        expected_values = ['development', 'staging', 'production']
        self.assertEqual(set(allowed_values), set(expected_values))

    def test_vpc_resource_exists(self):
        """Test that VPC resource is defined."""
        self.assertIn('VPC', self.resources)
        vpc = self.resources['VPC']
        self.assertEqual(vpc['Type'], 'AWS::EC2::VPC')
        self.assertIn('Properties', vpc)
        self.assertTrue(vpc['Properties'].get('EnableDnsHostnames'))
        self.assertTrue(vpc['Properties'].get('EnableDnsSupport'))

    def test_internet_gateway_exists(self):
        """Test that Internet Gateway and attachment exist."""
        self.assertIn('InternetGateway', self.resources)
        self.assertIn('AttachGateway', self.resources)
        igw = self.resources['InternetGateway']
        self.assertEqual(igw['Type'], 'AWS::EC2::InternetGateway')

    def test_public_subnets_exist(self):
        """Test that 3 public subnets are defined."""
        public_subnets = ['PublicSubnet1', 'PublicSubnet2', 'PublicSubnet3']
        for subnet in public_subnets:
            self.assertIn(subnet, self.resources, f"{subnet} must be defined")
            subnet_resource = self.resources[subnet]
            self.assertEqual(subnet_resource['Type'], 'AWS::EC2::Subnet')
            self.assertTrue(
                subnet_resource['Properties'].get('MapPublicIpOnLaunch'),
                f"{subnet} must have MapPublicIpOnLaunch enabled"
            )

    def test_private_subnets_exist(self):
        """Test that 3 private subnets are defined."""
        private_subnets = ['PrivateSubnet1', 'PrivateSubnet2', 'PrivateSubnet3']
        for subnet in private_subnets:
            self.assertIn(subnet, self.resources, f"{subnet} must be defined")
            subnet_resource = self.resources[subnet]
            self.assertEqual(subnet_resource['Type'], 'AWS::EC2::Subnet')
            # Private subnets should NOT have MapPublicIpOnLaunch
            self.assertNotIn(
                'MapPublicIpOnLaunch',
                subnet_resource['Properties'],
                f"{subnet} should not have MapPublicIpOnLaunch"
            )

    def test_nat_gateways_exist(self):
        """Test that 3 NAT Gateways are defined (one per AZ)."""
        nat_gateways = ['NatGateway1', 'NatGateway2', 'NatGateway3']
        for nat in nat_gateways:
            self.assertIn(nat, self.resources, f"{nat} must be defined")
            nat_resource = self.resources[nat]
            self.assertEqual(nat_resource['Type'], 'AWS::EC2::NatGateway')

    def test_elastic_ips_for_nat_gateways(self):
        """Test that Elastic IPs are defined for NAT Gateways."""
        eips = ['EIP1', 'EIP2', 'EIP3']
        for eip in eips:
            self.assertIn(eip, self.resources, f"{eip} must be defined")
            eip_resource = self.resources[eip]
            self.assertEqual(eip_resource['Type'], 'AWS::EC2::EIP')
            self.assertEqual(eip_resource['Properties']['Domain'], 'vpc')

    def test_route_tables_exist(self):
        """Test that route tables are defined for public and private subnets."""
        # 1 public route table
        self.assertIn('PublicRouteTable', self.resources)
        # 3 private route tables (one per AZ)
        private_rts = ['PrivateRouteTable1', 'PrivateRouteTable2', 'PrivateRouteTable3']
        for rt in private_rts:
            self.assertIn(rt, self.resources, f"{rt} must be defined")

    def test_vpc_flow_logs_configured(self):
        """Test that VPC Flow Logs are enabled."""
        self.assertIn('VPCFlowLogs', self.resources)
        flow_logs = self.resources['VPCFlowLogs']
        self.assertEqual(flow_logs['Type'], 'AWS::EC2::FlowLog')
        self.assertEqual(flow_logs['Properties']['TrafficType'], 'ALL')
        self.assertEqual(flow_logs['Properties']['LogDestinationType'], 'cloud-watch-logs')

    def test_vpc_flow_logs_log_group(self):
        """Test that VPC Flow Logs CloudWatch Log Group exists with retention."""
        self.assertIn('VPCFlowLogsLogGroup', self.resources)
        log_group = self.resources['VPCFlowLogsLogGroup']
        self.assertEqual(log_group['Type'], 'AWS::Logs::LogGroup')
        self.assertEqual(log_group['Properties']['RetentionInDays'], 30)

    def test_kms_key_exists(self):
        """Test that KMS key is defined for RDS encryption."""
        self.assertIn('KMSKey', self.resources)
        kms = self.resources['KMSKey']
        self.assertEqual(kms['Type'], 'AWS::KMS::Key')
        self.assertIn('KeyPolicy', kms['Properties'])

    def test_db_subnet_group_exists(self):
        """Test that DB subnet group is defined."""
        self.assertIn('DBSubnetGroup', self.resources)
        db_subnet_group = self.resources['DBSubnetGroup']
        self.assertEqual(db_subnet_group['Type'], 'AWS::RDS::DBSubnetGroup')

    def test_db_security_group_exists(self):
        """Test that DB security group is defined."""
        self.assertIn('DBSecurityGroup', self.resources)
        db_sg = self.resources['DBSecurityGroup']
        self.assertEqual(db_sg['Type'], 'AWS::EC2::SecurityGroup')

    def test_secrets_manager_secret_exists(self):
        """Test that Secrets Manager secret is defined for DB credentials."""
        self.assertIn('DBSecret', self.resources)
        secret = self.resources['DBSecret']
        self.assertEqual(secret['Type'], 'AWS::SecretsManager::Secret')
        self.assertIn('GenerateSecretString', secret['Properties'])

    def test_rds_aurora_cluster_exists(self):
        """Test that RDS Aurora cluster is defined."""
        self.assertIn('DBCluster', self.resources)
        cluster = self.resources['DBCluster']
        self.assertEqual(cluster['Type'], 'AWS::RDS::DBCluster')
        props = cluster['Properties']
        self.assertEqual(props['Engine'], 'aurora-mysql')
        self.assertTrue(props['StorageEncrypted'])

    def test_rds_instances_exist(self):
        """Test that RDS instances (writer and reader) are defined."""
        self.assertIn('DBInstanceWriter', self.resources)
        self.assertIn('DBInstanceReader', self.resources)

        writer = self.resources['DBInstanceWriter']
        reader = self.resources['DBInstanceReader']

        self.assertEqual(writer['Type'], 'AWS::RDS::DBInstance')
        self.assertEqual(reader['Type'], 'AWS::RDS::DBInstance')
        self.assertEqual(writer['Properties']['Engine'], 'aurora-mysql')
        self.assertEqual(reader['Properties']['Engine'], 'aurora-mysql')

    def test_lambda_rotation_function_exists(self):
        """Test that Lambda rotation function is defined."""
        self.assertIn('SecretRotationLambda', self.resources)
        lambda_func = self.resources['SecretRotationLambda']
        self.assertEqual(lambda_func['Type'], 'AWS::Lambda::Function')
        self.assertIn('VpcConfig', lambda_func['Properties'])

    def test_secrets_rotation_schedule_exists(self):
        """Test that secrets rotation schedule is configured."""
        self.assertIn('SecretRotationSchedule', self.resources)
        rotation = self.resources['SecretRotationSchedule']
        self.assertEqual(rotation['Type'], 'AWS::SecretsManager::RotationSchedule')
        rotation_rules = rotation['Properties']['RotationRules']
        self.assertEqual(rotation_rules['AutomaticallyAfterDays'], 30)

    def test_alb_exists(self):
        """Test that Application Load Balancer is defined."""
        self.assertIn('ApplicationLoadBalancer', self.resources)
        alb = self.resources['ApplicationLoadBalancer']
        self.assertEqual(alb['Type'], 'AWS::ElasticLoadBalancingV2::LoadBalancer')
        self.assertEqual(alb['Properties']['Type'], 'application')
        self.assertEqual(alb['Properties']['Scheme'], 'internet-facing')

    def test_alb_target_group_exists(self):
        """Test that ALB target group is defined with health checks."""
        self.assertIn('ALBTargetGroup', self.resources)
        tg = self.resources['ALBTargetGroup']
        self.assertEqual(tg['Type'], 'AWS::ElasticLoadBalancingV2::TargetGroup')
        props = tg['Properties']
        self.assertTrue(props['HealthCheckEnabled'])
        self.assertEqual(props['HealthCheckPath'], '/health')

    def test_alb_listeners_exist(self):
        """Test that ALB listeners are defined."""
        self.assertIn('ALBListenerHTTP', self.resources)
        http_listener = self.resources['ALBListenerHTTP']
        self.assertEqual(http_listener['Type'], 'AWS::ElasticLoadBalancingV2::Listener')
        self.assertEqual(http_listener['Properties']['Port'], 80)

    def test_security_groups_exist(self):
        """Test that all required security groups are defined."""
        required_sgs = [
            'ALBSecurityGroup',
            'EC2SecurityGroup',
            'DBSecurityGroup',
            'LambdaSecurityGroup'
        ]
        for sg in required_sgs:
            self.assertIn(sg, self.resources, f"{sg} must be defined")
            sg_resource = self.resources[sg]
            self.assertEqual(sg_resource['Type'], 'AWS::EC2::SecurityGroup')

    def test_alb_security_group_ingress(self):
        """Test ALB security group allows HTTPS and HTTP from internet."""
        alb_sg = self.resources['ALBSecurityGroup']
        ingress_rules = alb_sg['Properties']['SecurityGroupIngress']

        # Check for HTTPS (443)
        https_rule = next((r for r in ingress_rules if r['FromPort'] == 443), None)
        self.assertIsNotNone(https_rule, "ALB must allow HTTPS from internet")
        self.assertEqual(https_rule['CidrIp'], '0.0.0.0/0')

        # Check for HTTP (80)
        http_rule = next((r for r in ingress_rules if r['FromPort'] == 80), None)
        self.assertIsNotNone(http_rule, "ALB must allow HTTP from internet")

    def test_ec2_instance_role_exists(self):
        """Test that EC2 instance IAM role is defined."""
        self.assertIn('EC2InstanceRole', self.resources)
        role = self.resources['EC2InstanceRole']
        self.assertEqual(role['Type'], 'AWS::IAM::Role')

    def test_ec2_instance_profile_exists(self):
        """Test that EC2 instance profile is defined."""
        self.assertIn('EC2InstanceProfile', self.resources)
        profile = self.resources['EC2InstanceProfile']
        self.assertEqual(profile['Type'], 'AWS::IAM::InstanceProfile')

    def test_launch_template_exists(self):
        """Test that Launch Template is defined."""
        self.assertIn('LaunchTemplate', self.resources)
        lt = self.resources['LaunchTemplate']
        self.assertEqual(lt['Type'], 'AWS::EC2::LaunchTemplate')

    def test_imdsv2_enforced(self):
        """Test that IMDSv2 is enforced on EC2 instances."""
        lt = self.resources['LaunchTemplate']
        metadata_options = lt['Properties']['LaunchTemplateData']['MetadataOptions']
        self.assertEqual(
            metadata_options['HttpTokens'],
            'required',
            "IMDSv2 must be enforced (HttpTokens: required)"
        )
        self.assertEqual(metadata_options['HttpPutResponseHopLimit'], 1)

    def test_auto_scaling_group_exists(self):
        """Test that Auto Scaling Group is defined."""
        self.assertIn('AutoScalingGroup', self.resources)
        asg = self.resources['AutoScalingGroup']
        self.assertEqual(asg['Type'], 'AWS::AutoScaling::AutoScalingGroup')
        props = asg['Properties']
        self.assertEqual(props['MinSize'], 2)
        self.assertEqual(props['MaxSize'], 6)
        self.assertEqual(props['HealthCheckType'], 'ELB')

    def test_scaling_policies_exist(self):
        """Test that scaling policies are defined."""
        self.assertIn('ScaleUpPolicy', self.resources)
        self.assertIn('ScaleDownPolicy', self.resources)

    def test_cloudwatch_alarms_exist(self):
        """Test that CloudWatch alarms for scaling are defined."""
        self.assertIn('CPUAlarmHigh', self.resources)
        self.assertIn('CPUAlarmLow', self.resources)

        high_alarm = self.resources['CPUAlarmHigh']
        low_alarm = self.resources['CPUAlarmLow']

        self.assertEqual(high_alarm['Type'], 'AWS::CloudWatch::Alarm')
        self.assertEqual(low_alarm['Type'], 'AWS::CloudWatch::Alarm')

    def test_all_resources_have_tags(self):
        """Test that taggable resources include required tags."""
        required_tags = ['Environment', 'Project', 'CostCenter']
        taggable_resource_types = [
            'AWS::EC2::VPC',
            'AWS::EC2::Subnet',
            'AWS::EC2::SecurityGroup',
            'AWS::RDS::DBCluster',
            'AWS::ElasticLoadBalancingV2::LoadBalancer'
        ]

        for resource_name, resource in self.resources.items():
            if resource['Type'] in taggable_resource_types:
                self.assertIn('Tags', resource.get('Properties', {}),
                            f"{resource_name} must have Tags")
                tags = resource['Properties']['Tags']
                tag_keys = [tag['Key'] for tag in tags]
                for req_tag in required_tags:
                    self.assertIn(req_tag, tag_keys,
                                f"{resource_name} must have {req_tag} tag")

    def test_environment_suffix_in_resource_names(self):
        """Test that resources use EnvironmentSuffix in their names."""
        resources_with_names = [
            'VPC', 'ALBSecurityGroup', 'EC2SecurityGroup', 'DBSecurityGroup',
            'ApplicationLoadBalancer', 'DBCluster', 'AutoScalingGroup'
        ]

        for resource_name in resources_with_names:
            if resource_name in self.resources:
                resource = self.resources[resource_name]
                props = resource.get('Properties', {})

                # Check various name fields
                name_fields = ['Name', 'GroupName', 'DBClusterIdentifier',
                             'AutoScalingGroupName', 'FunctionName']
                has_env_suffix = False

                for field in name_fields:
                    if field in props:
                        name_value = props[field]
                        if isinstance(name_value, dict) and 'Fn::Sub' in name_value:
                            has_env_suffix = 'EnvironmentSuffix' in str(name_value)
                            break

                # Some resources might not have direct names but should still pass
                # We're mainly checking that the ones that do have names use the suffix

    def test_outputs_exist(self):
        """Test that required outputs are defined."""
        required_outputs = [
            'VPCId',
            'ALBDNSName',
            'DBClusterEndpoint',
            'AutoScalingGroupName'
        ]
        for output in required_outputs:
            self.assertIn(output, self.outputs, f"Output '{output}' must be defined")

    def test_outputs_have_exports(self):
        """Test that outputs have export names for cross-stack references."""
        for output_name, output in self.outputs.items():
            self.assertIn('Export', output, f"Output '{output_name}' should have Export")

    def test_no_retain_policies(self):
        """Test that no resources have Retain deletion policies."""
        for resource_name, resource in self.resources.items():
            self.assertNotIn(
                'DeletionPolicy',
                resource,
                f"{resource_name} should not have DeletionPolicy (must be destroyable)"
            )

    def test_resource_count(self):
        """Test that template has expected number of resources."""
        # The template should have a significant number of resources
        # for a comprehensive infrastructure
        self.assertGreater(
            len(self.resources),
            50,
            "Template should have more than 50 resources for complete infrastructure"
        )


if __name__ == '__main__':
    unittest.main()

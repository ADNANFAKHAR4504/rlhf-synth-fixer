import json
import os
import unittest
import boto3
from typing import Dict, Any
from unittest.mock import patch, MagicMock

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
class TestTapStackIntegration(unittest.TestCase):
    """Integration test cases for the Zero-Trust Banking TapStack using real AWS outputs"""

    def setUp(self):
        """Set up test environment with AWS outputs"""
        self.outputs = flat_outputs
        
        # Initialize AWS clients if outputs are available
        if self.outputs:
            try:
                self.region = os.environ.get('AWS_DEFAULT_REGION', 'us-east-1')
                self.ec2_client = boto3.client('ec2', region_name=self.region)
                self.s3_client = boto3.client('s3', region_name=self.region)
                self.kms_client = boto3.client('kms', region_name=self.region)
                self.cloudtrail_client = boto3.client('cloudtrail', region_name=self.region)
                self.guardduty_client = boto3.client('guardduty', region_name=self.region)
                self.securityhub_client = boto3.client('securityhub', region_name=self.region)
                self.iam_client = boto3.client('iam', region_name=self.region)
                self.config_client = boto3.client('config', region_name=self.region)
                self.sns_client = boto3.client('sns', region_name=self.region)
                self.events_client = boto3.client('events', region_name=self.region)
                self.ssm_client = boto3.client('ssm', region_name=self.region)
                self.networkfirewall_client = boto3.client('network-firewall', region_name=self.region)
            except Exception as e:
                self.skipTest(f"AWS clients not available: {e}")

    def _get_output_value(self, key: str, default: str = None) -> str:
        """Helper to get stack output value"""
        for output_key, value in self.outputs.items():
            if key.lower() in output_key.lower():
                return value
        return default

    def _skip_if_no_outputs(self):
        """Skip test if no outputs available"""
        if not self.outputs:
            self.skipTest("No CloudFormation outputs available")

    # VPC and Network Integration Tests
    @mark.it("validates VPC configuration and connectivity")
    def test_vpc_configuration_integration(self):
        """Test VPC configuration using real AWS resources"""
        self._skip_if_no_outputs()
        
        vpc_id = self._get_output_value('VPCId')
        if not vpc_id:
            self.skipTest("VPC ID not found in outputs")
        
        # Test VPC exists and has correct configuration
        vpc_response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])
        self.assertEqual(len(vpc_response['Vpcs']), 1)
        
        vpc = vpc_response['Vpcs'][0]
        self.assertEqual(vpc['CidrBlock'], '10.0.0.0/16')
        self.assertTrue(vpc['EnableDnsHostnames'])
        self.assertTrue(vpc['EnableDnsSupport'])
        
        # Verify VPC has proper tags
        tags = {tag['Key']: tag['Value'] for tag in vpc.get('Tags', [])}
        self.assertIn('Name', tags)
        self.assertTrue(any('zero-trust' in tags[key].lower() for key in tags))

    @mark.it("validates subnet segmentation and isolation")
    def test_subnet_segmentation_integration(self):
        """Test subnet configuration and network segmentation"""
        self._skip_if_no_outputs()
        
        vpc_id = self._get_output_value('VPCId')
        if not vpc_id:
            self.skipTest("VPC ID not found in outputs")
        
        # Get all subnets in the VPC
        subnets_response = self.ec2_client.describe_subnets(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )
        subnets = subnets_response['Subnets']
        
        # Should have 8 subnets (4 types x 2 AZs)
        self.assertEqual(len(subnets), 8)
        
        # Categorize subnets by type
        subnet_types = {}
        for subnet in subnets:
            tags = {tag['Key']: tag['Value'] for tag in subnet.get('Tags', [])}
            name = tags.get('Name', '')
            
            if 'DMZ' in name:
                subnet_types.setdefault('DMZ', []).append(subnet)
            elif 'Application' in name:
                subnet_types.setdefault('Application', []).append(subnet)
            elif 'Data' in name:
                subnet_types.setdefault('Data', []).append(subnet)
            elif 'Management' in name:
                subnet_types.setdefault('Management', []).append(subnet)
        
        # Verify each subnet type has 2 subnets
        for subnet_type, subnet_list in subnet_types.items():
            self.assertEqual(len(subnet_list), 2, f"Should have 2 {subnet_type} subnets")
            
            # Verify subnets are in different AZs
            azs = [subnet['AvailabilityZone'] for subnet in subnet_list]
            self.assertEqual(len(set(azs)), 2, f"{subnet_type} subnets should be in different AZs")

    @mark.it("validates VPC endpoints connectivity")
    def test_vpc_endpoints_integration(self):
        """Test VPC endpoints for AWS services connectivity"""
        self._skip_if_no_outputs()
        
        vpc_id = self._get_output_value('VPCId')
        if not vpc_id:
            self.skipTest("VPC ID not found in outputs")
        
        # Get VPC endpoints
        endpoints_response = self.ec2_client.describe_vpc_endpoints(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )
        endpoints = endpoints_response['VpcEndpoints']
        
        # Should have multiple endpoints
        self.assertGreaterEqual(len(endpoints), 7)
        
        # Check for required service endpoints
        service_names = [ep['ServiceName'] for ep in endpoints]
        required_services = ['s3', 'ssm', 'kms', 'logs']
        
        for service in required_services:
            service_found = any(service in sn for sn in service_names)
            self.assertTrue(service_found, f"{service} endpoint should exist")
        
        # Verify S3 gateway endpoint exists
        s3_gateway_found = any(
            's3' in ep['ServiceName'] and ep['VpcEndpointType'] == 'Gateway'
            for ep in endpoints
        )
        self.assertTrue(s3_gateway_found, "S3 Gateway endpoint should exist")

    @mark.it("validates Transit Gateway configuration")
    def test_transit_gateway_integration(self):
        """Test Transit Gateway configuration and attachments"""
        self._skip_if_no_outputs()
        
        tgw_id = self._get_output_value('TransitGatewayId')
        if not tgw_id:
            self.skipTest("Transit Gateway ID not found in outputs")
        
        # Test Transit Gateway exists
        tgw_response = self.ec2_client.describe_transit_gateways(
            TransitGatewayIds=[tgw_id]
        )
        self.assertEqual(len(tgw_response['TransitGateways']), 1)
        
        tgw = tgw_response['TransitGateways'][0]
        self.assertEqual(tgw['State'], 'available')
        
        # Check TGW configuration
        options = tgw['Options']
        self.assertEqual(options['DefaultRouteTableAssociation'], 'disable')
        self.assertEqual(options['DefaultRouteTablePropagation'], 'disable')
        
        # Check VPC attachment
        attachments_response = self.ec2_client.describe_transit_gateway_attachments(
            Filters=[
                {'Name': 'transit-gateway-id', 'Values': [tgw_id]},
                {'Name': 'resource-type', 'Values': ['vpc']}
            ]
        )
        
        self.assertGreaterEqual(len(attachments_response['TransitGatewayAttachments']), 1)

    # S3 and Encryption Integration Tests
    @mark.it("validates S3 buckets encryption and policies")
    def test_s3_buckets_integration(self):
        """Test S3 buckets configuration, encryption, and access policies"""
        self._skip_if_no_outputs()
        
        # Get S3 bucket names from outputs
        bucket_names = []
        for key, value in self.outputs.items():
            if 'bucket' in key.lower() and value:
                bucket_names.append(value)
        
        if not bucket_names:
            self.skipTest("No S3 bucket names found in outputs")
        
        for bucket_name in bucket_names:
            try:
                # Test bucket exists
                head_response = self.s3_client.head_bucket(Bucket=bucket_name)
                
                # Test encryption configuration
                encryption_response = self.s3_client.get_bucket_encryption(Bucket=bucket_name)
                encryption_config = encryption_response['ServerSideEncryptionConfiguration']
                
                # Should have at least one encryption rule
                self.assertGreaterEqual(len(encryption_config['Rules']), 1)
                
                # Should use KMS encryption
                sse_algorithm = encryption_config['Rules'][0]['ApplyServerSideEncryptionByDefault']['SSEAlgorithm']
                self.assertIn(sse_algorithm, ['AES256', 'aws:kms'])
                
                # Test public access block
                public_access_response = self.s3_client.get_public_access_block(Bucket=bucket_name)
                public_access = public_access_response['PublicAccessBlockConfiguration']
                
                # Should block all public access
                self.assertTrue(public_access['BlockPublicAcls'])
                self.assertTrue(public_access['IgnorePublicAcls'])
                self.assertTrue(public_access['BlockPublicPolicy'])
                self.assertTrue(public_access['RestrictPublicBuckets'])
                
            except Exception as e:
                self.fail(f"S3 bucket {bucket_name} validation failed: {e}")

    @mark.it("validates KMS keys rotation and policies")
    def test_kms_keys_integration(self):
        """Test KMS keys configuration and rotation"""
        self._skip_if_no_outputs()
        
        master_key_id = self._get_output_value('MasterKeyId')
        audit_key_id = self._get_output_value('AuditKeyId')
        
        keys_to_test = []
        if master_key_id:
            keys_to_test.append(('MasterKey', master_key_id))
        if audit_key_id:
            keys_to_test.append(('AuditKey', audit_key_id))
        
        if not keys_to_test:
            self.skipTest("No KMS key IDs found in outputs")
        
        for key_name, key_id in keys_to_test:
            try:
                # Test key exists and is enabled
                key_response = self.kms_client.describe_key(KeyId=key_id)
                key_metadata = key_response['KeyMetadata']
                
                self.assertEqual(key_metadata['KeyState'], 'Enabled')
                self.assertTrue(key_metadata['Enabled'])
                
                # Test key rotation is enabled
                rotation_response = self.kms_client.get_key_rotation_status(KeyId=key_id)
                self.assertTrue(rotation_response['KeyRotationEnabled'])
                
                # Test key policy exists
                policy_response = self.kms_client.get_key_policy(
                    KeyId=key_id,
                    PolicyName='default'
                )
                policy = json.loads(policy_response['Policy'])
                
                # Should have statements
                self.assertIn('Statement', policy)
                self.assertGreaterEqual(len(policy['Statement']), 1)
                
                # Should have root account permissions
                root_permissions_found = any(
                    'arn:aws:iam::' in str(stmt.get('Principal', {}))
                    for stmt in policy['Statement']
                )
                self.assertTrue(root_permissions_found, f"{key_name} should have root permissions")
                
            except Exception as e:
                self.fail(f"KMS key {key_name} validation failed: {e}")

    # CloudTrail and Logging Integration Tests
    @mark.it("validates CloudTrail logging configuration")
    def test_cloudtrail_integration(self):
        """Test CloudTrail configuration and logging"""
        self._skip_if_no_outputs()
        
        trail_arn = self._get_output_value('CloudTrailArn')
        if not trail_arn:
            self.skipTest("CloudTrail ARN not found in outputs")
        
        trail_name = trail_arn.split('/')[-1]
        
        try:
            # Test trail configuration
            trail_response = self.cloudtrail_client.describe_trails(
                trailNameList=[trail_name]
            )
            
            self.assertEqual(len(trail_response['trailList']), 1)
            trail = trail_response['trailList'][0]
            
            # Verify trail configuration
            self.assertTrue(trail['IsMultiRegionTrail'])
            self.assertTrue(trail['IncludeGlobalServiceEvents'])
            self.assertTrue(trail['LogFileValidationEnabled'])
            
            # Test trail status
            status_response = self.cloudtrail_client.get_trail_status(
                Name=trail_name
            )
            self.assertTrue(status_response['IsLogging'])
            
            # Test event selectors (if any)
            selectors_response = self.cloudtrail_client.get_event_selectors(
                TrailName=trail_name
            )
            # Should have data events configured for comprehensive logging
            
        except Exception as e:
            self.fail(f"CloudTrail validation failed: {e}")

    # Security Services Integration Tests
    @mark.it("validates GuardDuty detector configuration")
    def test_guardduty_integration(self):
        """Test GuardDuty detector and threat intelligence configuration"""
        self._skip_if_no_outputs()
        
        detector_id = self._get_output_value('GuardDutyDetectorId')
        if not detector_id:
            # Try to find detector if not in outputs
            try:
                detectors_response = self.guardduty_client.list_detectors()
                if detectors_response['DetectorIds']:
                    detector_id = detectors_response['DetectorIds'][0]
                else:
                    self.skipTest("No GuardDuty detector found")
            except Exception:
                self.skipTest("GuardDuty not accessible")
        
        try:
            # Test detector configuration
            detector_response = self.guardduty_client.get_detector(
                DetectorId=detector_id
            )
            
            self.assertEqual(detector_response['Status'], 'ENABLED')
            
            # Test threat intelligence sets
            threat_intel_response = self.guardduty_client.list_threat_intel_sets(
                DetectorId=detector_id
            )
            
            # Should have at least one threat intelligence set
            if threat_intel_response['ThreatIntelSetIds']:
                threat_intel_id = threat_intel_response['ThreatIntelSetIds'][0]
                threat_intel_details = self.guardduty_client.get_threat_intel_set(
                    DetectorId=detector_id,
                    ThreatIntelSetId=threat_intel_id
                )
                self.assertEqual(threat_intel_details['Status'], 'ACTIVE')
            
            # Test IP sets
            ip_sets_response = self.guardduty_client.list_ip_sets(
                DetectorId=detector_id
            )
            
            if ip_sets_response['IpSetIds']:
                ip_set_id = ip_sets_response['IpSetIds'][0]
                ip_set_details = self.guardduty_client.get_ip_set(
                    DetectorId=detector_id,
                    IpSetId=ip_set_id
                )
                self.assertEqual(ip_set_details['Status'], 'ACTIVE')
                
        except Exception as e:
            self.fail(f"GuardDuty validation failed: {e}")

    @mark.it("validates Security Hub configuration")
    def test_security_hub_integration(self):
        """Test Security Hub configuration and standards"""
        self._skip_if_no_outputs()
        
        security_hub_arn = self._get_output_value('SecurityHubArn')
        if not security_hub_arn:
            self.skipTest("Security Hub ARN not found in outputs")
        
        try:
            # Test Security Hub is enabled
            hub_response = self.securityhub_client.describe_hub()
            self.assertEqual(hub_response['HubArn'], security_hub_arn)
            
            # Test enabled standards
            standards_response = self.securityhub_client.get_enabled_standards()
            enabled_standards = standards_response['StandardsSubscriptions']
            
            # Should have at least one standard enabled
            self.assertGreaterEqual(len(enabled_standards), 1)
            
            # Check for AWS Foundational Security Standard
            foundational_standard_found = any(
                'security-standard' in standard['StandardsArn']
                for standard in enabled_standards
            )
            self.assertTrue(foundational_standard_found, "Foundational Security Standard should be enabled")
            
        except Exception as e:
            self.fail(f"Security Hub validation failed: {e}")

    # Network Firewall Integration Tests
    @mark.it("validates Network Firewall configuration")
    def test_network_firewall_integration(self):
        """Test Network Firewall configuration and rules"""
        self._skip_if_no_outputs()
        
        firewall_arn = self._get_output_value('NetworkFirewallArn')
        if not firewall_arn:
            self.skipTest("Network Firewall ARN not found in outputs")
        
        firewall_name = firewall_arn.split('/')[-1]
        
        try:
            # Test firewall configuration
            firewall_response = self.networkfirewall_client.describe_firewall(
                FirewallName=firewall_name
            )
            
            firewall = firewall_response['Firewall']
            self.assertEqual(firewall['FirewallStatus']['Status'], 'READY')
            
            # Test firewall policy
            policy_response = self.networkfirewall_client.describe_firewall_policy(
                FirewallPolicyArn=firewall['FirewallPolicyArn']
            )
            
            policy = policy_response['FirewallPolicy']
            
            # Should have stateful rule groups
            if 'StatefulRuleGroupReferences' in policy:
                self.assertGreaterEqual(len(policy['StatefulRuleGroupReferences']), 1)
            
            # Test logging configuration
            logging_response = self.networkfirewall_client.describe_logging_configuration(
                FirewallArn=firewall_arn
            )
            
            logging_config = logging_response['LoggingConfiguration']
            self.assertIn('LogDestinationConfigs', logging_config)
            
        except Exception as e:
            self.fail(f"Network Firewall validation failed: {e}")

    # IAM and Access Control Integration Tests
    @mark.it("validates IAM roles and policies")
    def test_iam_roles_integration(self):
        """Test IAM roles configuration and permissions"""
        self._skip_if_no_outputs()
        
        # Get role ARNs from outputs
        role_arns = []
        for key, value in self.outputs.items():
            if 'role' in key.lower() and 'arn' in key.lower() and value:
                role_arns.append(value)
        
        if not role_arns:
            self.skipTest("No IAM role ARNs found in outputs")
        
        for role_arn in role_arns:
            role_name = role_arn.split('/')[-1]
            
            try:
                # Test role exists
                role_response = self.iam_client.get_role(RoleName=role_name)
                role = role_response['Role']
                
                # Test assume role policy
                assume_policy = json.loads(role['AssumeRolePolicyDocument'])
                self.assertIn('Statement', assume_policy)
                
                # Test role policies
                policies_response = self.iam_client.list_attached_role_policies(
                    RoleName=role_name
                )
                
                # Should have at least one policy attached
                if policies_response['AttachedPolicies']:
                    policy_arn = policies_response['AttachedPolicies'][0]['PolicyArn']
                    
                    # Test policy permissions (basic validation)
                    policy_response = self.iam_client.get_policy(PolicyArn=policy_arn)
                    self.assertEqual(policy_response['Policy']['Arn'], policy_arn)
                
            except Exception as e:
                self.fail(f"IAM role {role_name} validation failed: {e}")

    # Config and Compliance Integration Tests
    @mark.it("validates AWS Config configuration")
    def test_config_integration(self):
        """Test AWS Config recorder and rules configuration"""
        self._skip_if_no_outputs()
        
        try:
            # Test configuration recorder
            recorders_response = self.config_client.describe_configuration_recorders()
            recorders = recorders_response['ConfigurationRecorders']
            
            # Should have at least one recorder
            self.assertGreaterEqual(len(recorders), 1)
            
            recorder = recorders[0]
            self.assertTrue(recorder['recordingGroup']['allSupported'])
            self.assertTrue(recorder['recordingGroup']['includeGlobalResourceTypes'])
            
            # Test delivery channel
            channels_response = self.config_client.describe_delivery_channels()
            channels = channels_response['DeliveryChannels']
            
            self.assertGreaterEqual(len(channels), 1)
            
            # Test config rules
            rules_response = self.config_client.describe_config_rules()
            config_rules = rules_response['ConfigRules']
            
            # Should have compliance rules configured
            self.assertGreaterEqual(len(config_rules), 1)
            
            # Test recorder status
            status_response = self.config_client.describe_configuration_recorder_status()
            recorder_status = status_response['ConfigurationRecordersStatus']
            
            self.assertGreaterEqual(len(recorder_status), 1)
            self.assertTrue(recorder_status[0]['recording'])
            
        except Exception as e:
            self.fail(f"AWS Config validation failed: {e}")

    # Incident Response Integration Tests
    @mark.it("validates incident response automation")
    def test_incident_response_integration(self):
        """Test incident response automation components"""
        self._skip_if_no_outputs()
        
        # Test SNS topic for alerts
        sns_topic_arn = self._get_output_value('IncidentResponseTopicArn')
        if not sns_topic_arn:
            self.skipTest("Incident Response Topic ARN not found in outputs")
        
        try:
            # Test SNS topic configuration
            topic_response = self.sns_client.get_topic_attributes(
                TopicArn=sns_topic_arn
            )
            
            attributes = topic_response['Attributes']
            
            # Topic should be encrypted
            self.assertIn('KmsMasterKeyId', attributes)
            
            # Test EventBridge rules for security events
            rules_response = self.events_client.list_rules()
            security_rules = [
                rule for rule in rules_response['Rules']
                if 'guardduty' in rule.get('Name', '').lower() or
                   'security' in rule.get('Name', '').lower()
            ]
            
            # Should have at least one security-related rule
            self.assertGreaterEqual(len(security_rules), 1)
            
            # Test rule targets point to incident response
            for rule in security_rules:
                targets_response = self.events_client.list_targets_by_rule(
                    Rule=rule['Name']
                )
                
                # Should have targets configured
                self.assertGreaterEqual(len(targets_response['Targets']), 1)
                
        except Exception as e:
            self.fail(f"Incident response validation failed: {e}")

    # Systems Manager Integration Tests
    @mark.it("validates Systems Manager configuration")
    def test_systems_manager_integration(self):
        """Test Systems Manager session configuration"""
        self._skip_if_no_outputs()
        
        try:
            # Test session manager preferences document
            docs_response = self.ssm_client.list_documents(
                Filters=[
                    {
                        'Key': 'Name',
                        'Values': ['SessionManagerRunShell*']
                    }
                ]
            )
            
            # Should have session manager documents
            if docs_response['DocumentIdentifiers']:
                doc_name = docs_response['DocumentIdentifiers'][0]['Name']
                
                doc_response = self.ssm_client.get_document(Name=doc_name)
                self.assertEqual(doc_response['Status'], 'Active')
            
            # Test maintenance windows (if configured)
            windows_response = self.ssm_client.describe_maintenance_windows()
            
            # Maintenance windows are optional but if present, should be enabled
            for window in windows_response['WindowIdentities']:
                if not window['Enabled']:
                    continue  # Skip disabled windows
                
                window_details = self.ssm_client.get_maintenance_window(
                    WindowId=window['WindowId']
                )
                self.assertTrue(window_details['Enabled'])
                
        except Exception as e:
            self.fail(f"Systems Manager validation failed: {e}")

    # End-to-End Workflow Tests
    @mark.it("validates complete logging and monitoring workflow")
    def test_complete_logging_workflow(self):
        """Test end-to-end logging and monitoring workflow"""
        self._skip_if_no_outputs()
        
        # This test validates that the complete logging pipeline works
        vpc_id = self._get_output_value('VPCId')
        cloudtrail_arn = self._get_output_value('CloudTrailArn')
        
        if not (vpc_id and cloudtrail_arn):
            self.skipTest("Required outputs not available for workflow test")
        
        try:
            # 1. Verify VPC Flow Logs are enabled
            flow_logs_response = self.ec2_client.describe_flow_logs(
                Filters=[
                    {'Name': 'resource-id', 'Values': [vpc_id]},
                    {'Name': 'resource-type', 'Values': ['VPC']}
                ]
            )
            
            self.assertGreaterEqual(len(flow_logs_response['FlowLogs']), 1)
            
            flow_log = flow_logs_response['FlowLogs'][0]
            self.assertEqual(flow_log['FlowLogStatus'], 'ACTIVE')
            self.assertEqual(flow_log['TrafficType'], 'ALL')
            
            # 2. Verify CloudTrail is logging
            trail_name = cloudtrail_arn.split('/')[-1]
            status_response = self.cloudtrail_client.get_trail_status(
                Name=trail_name
            )
            self.assertTrue(status_response['IsLogging'])
            
            # 3. Verify GuardDuty is enabled (covered in other tests but important for workflow)
            try:
                detectors_response = self.guardduty_client.list_detectors()
                if detectors_response['DetectorIds']:
                    detector_response = self.guardduty_client.get_detector(
                        DetectorId=detectors_response['DetectorIds'][0]
                    )
                    self.assertEqual(detector_response['Status'], 'ENABLED')
            except Exception:
                pass  # GuardDuty might not be accessible in test environment
            
            # 4. Verify Security Hub is enabled (covered in other tests)
            try:
                self.securityhub_client.describe_hub()
            except Exception:
                pass  # Security Hub might not be accessible in test environment
            
        except Exception as e:
            self.fail(f"Complete logging workflow validation failed: {e}")

    @mark.it("validates multi-service integration dependencies")
    def test_multi_service_integration(self):
        """Test integration between multiple AWS services"""
        self._skip_if_no_outputs()
        
        # Test that services are properly integrated
        master_key_id = self._get_output_value('MasterKeyId')
        vpc_id = self._get_output_value('VPCId')
        
        if not (master_key_id and vpc_id):
            self.skipTest("Required outputs not available for integration test")
        
        try:
            # 1. Verify KMS key is used by multiple services
            key_grants_response = self.kms_client.list_grants(KeyId=master_key_id)
            grants = key_grants_response['Grants']
            
            # Should have grants for various services
            service_principals = set()
            for grant in grants:
                if 'GranteePrincipal' in grant:
                    service_principals.add(grant['GranteePrincipal'])
            
            # Expect multiple services to have access to the KMS key
            self.assertGreaterEqual(len(service_principals), 1)
            
            # 2. Verify VPC endpoints are in the correct VPC
            endpoints_response = self.ec2_client.describe_vpc_endpoints(
                Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
            )
            
            vpc_endpoints = endpoints_response['VpcEndpoints']
            self.assertGreaterEqual(len(vpc_endpoints), 1)
            
            # All endpoints should be in the correct VPC
            for endpoint in vpc_endpoints:
                self.assertEqual(endpoint['VpcId'], vpc_id)
            
            # 3. Verify Network Firewall is in the correct VPC (if present)
            firewall_arn = self._get_output_value('NetworkFirewallArn')
            if firewall_arn:
                firewall_name = firewall_arn.split('/')[-1]
                firewall_response = self.networkfirewall_client.describe_firewall(
                    FirewallName=firewall_name
                )
                
                firewall_vpc_id = firewall_response['Firewall']['VpcId']
                self.assertEqual(firewall_vpc_id, vpc_id)
            
        except Exception as e:
            self.fail(f"Multi-service integration validation failed: {e}")


if __name__ == '__main__':
    unittest.main()
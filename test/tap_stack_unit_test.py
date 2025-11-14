"""
Unit tests for CloudFormation Compliance System template

Tests validate:
- Template structure and syntax
- Resource configurations
- Parameter definitions
- IAM policies and roles
- EventBridge rules
- Lambda function configuration
- S3 bucket settings
- SNS topic setup
- CloudWatch dashboard
- SSM documents
- Resource naming with EnvironmentSuffix
- DeletionPolicy settings
- Tags configuration
"""

import json
import pytest
import os


@pytest.fixture
def template():
    """Load the CloudFormation template"""
    template_path = os.path.join(os.path.dirname(__file__), '..', 'lib', 'template.json')
    with open(template_path, 'r') as f:
        return json.load(f)


class TestTemplateStructure:
    """Test template structure and basic properties"""

    def test_template_format_version(self, template):
        """Test CloudFormation template format version"""
        assert 'AWSTemplateFormatVersion' in template
        assert template['AWSTemplateFormatVersion'] == '2010-09-09'

    def test_template_description(self, template):
        """Test template has description"""
        assert 'Description' in template
        assert 'Compliance' in template['Description']
        assert len(template['Description']) > 10

    def test_template_has_parameters(self, template):
        """Test template has parameters section"""
        assert 'Parameters' in template
        assert len(template['Parameters']) == 3

    def test_template_has_resources(self, template):
        """Test template has resources section"""
        assert 'Resources' in template
        assert len(template['Resources']) == 18

    def test_template_has_outputs(self, template):
        """Test template has outputs section"""
        assert 'Outputs' in template
        assert len(template['Outputs']) == 7


class TestParameters:
    """Test parameter definitions"""

    def test_environment_suffix_parameter(self, template):
        """Test EnvironmentSuffix parameter configuration"""
        params = template['Parameters']
        assert 'EnvironmentSuffix' in params

        env_suffix = params['EnvironmentSuffix']
        assert env_suffix['Type'] == 'String'
        assert 'Description' in env_suffix
        assert 'Default' in env_suffix
        assert 'AllowedPattern' in env_suffix
        assert env_suffix['AllowedPattern'] == '[a-z0-9-]+'

    def test_compliance_email_parameter(self, template):
        """Test ComplianceEmailAddress parameter"""
        params = template['Parameters']
        assert 'ComplianceEmailAddress' in params

        email_param = params['ComplianceEmailAddress']
        assert email_param['Type'] == 'String'
        assert 'Description' in email_param
        assert 'Default' in email_param

    def test_approved_ami_list_parameter(self, template):
        """Test ApprovedAMIList parameter"""
        params = template['Parameters']
        assert 'ApprovedAMIList' in params

        ami_param = params['ApprovedAMIList']
        assert ami_param['Type'] == 'CommaDelimitedList'
        assert 'Description' in ami_param
        assert 'Default' in ami_param


class TestS3Resources:
    """Test S3 bucket configuration"""

    def test_compliance_reports_bucket_exists(self, template):
        """Test S3 bucket resource exists"""
        resources = template['Resources']
        assert 'ComplianceReportsBucket' in resources

        bucket = resources['ComplianceReportsBucket']
        assert bucket['Type'] == 'AWS::S3::Bucket'

    def test_bucket_deletion_policy(self, template):
        """Test S3 bucket has Retain deletion policy"""
        bucket = template['Resources']['ComplianceReportsBucket']
        assert 'DeletionPolicy' in bucket
        assert bucket['DeletionPolicy'] == 'Retain'

    def test_bucket_versioning(self, template):
        """Test S3 bucket has versioning enabled"""
        bucket = template['Resources']['ComplianceReportsBucket']
        assert 'VersioningConfiguration' in bucket['Properties']
        assert bucket['Properties']['VersioningConfiguration']['Status'] == 'Enabled'

    def test_bucket_encryption(self, template):
        """Test S3 bucket has encryption enabled"""
        bucket = template['Resources']['ComplianceReportsBucket']
        assert 'BucketEncryption' in bucket['Properties']

        encryption = bucket['Properties']['BucketEncryption']
        assert 'ServerSideEncryptionConfiguration' in encryption
        assert len(encryption['ServerSideEncryptionConfiguration']) > 0
        assert encryption['ServerSideEncryptionConfiguration'][0]['ServerSideEncryptionByDefault']['SSEAlgorithm'] == 'AES256'

    def test_bucket_lifecycle_policy(self, template):
        """Test S3 bucket has lifecycle policy for Glacier transition"""
        bucket = template['Resources']['ComplianceReportsBucket']
        assert 'LifecycleConfiguration' in bucket['Properties']

        lifecycle = bucket['Properties']['LifecycleConfiguration']
        assert 'Rules' in lifecycle
        assert len(lifecycle['Rules']) > 0

        rule = lifecycle['Rules'][0]
        assert rule['Status'] == 'Enabled'
        assert 'Transitions' in rule
        assert rule['Transitions'][0]['TransitionInDays'] == 90
        assert rule['Transitions'][0]['StorageClass'] == 'GLACIER'

    def test_bucket_public_access_block(self, template):
        """Test S3 bucket blocks public access"""
        bucket = template['Resources']['ComplianceReportsBucket']
        assert 'PublicAccessBlockConfiguration' in bucket['Properties']

        public_access = bucket['Properties']['PublicAccessBlockConfiguration']
        assert public_access['BlockPublicAcls'] == True
        assert public_access['BlockPublicPolicy'] == True
        assert public_access['IgnorePublicAcls'] == True
        assert public_access['RestrictPublicBuckets'] == True

    def test_bucket_has_tags(self, template):
        """Test S3 bucket has required tags"""
        bucket = template['Resources']['ComplianceReportsBucket']
        assert 'Tags' in bucket['Properties']

        tags = bucket['Properties']['Tags']
        assert len(tags) == 2

        tag_dict = {tag['Key']: tag['Value'] for tag in tags}
        assert tag_dict['Environment'] == 'qa'
        assert tag_dict['Project'] == 'compliance-checker'

    def test_bucket_name_includes_environment_suffix(self, template):
        """Test S3 bucket name includes EnvironmentSuffix"""
        bucket = template['Resources']['ComplianceReportsBucket']
        bucket_name = bucket['Properties']['BucketName']
        assert 'Fn::Sub' in bucket_name
        assert '${EnvironmentSuffix}' in bucket_name['Fn::Sub']


class TestSNSResources:
    """Test SNS topic and subscription configuration"""

    def test_sns_topic_exists(self, template):
        """Test SNS topic resource exists"""
        resources = template['Resources']
        assert 'ComplianceAlertTopic' in resources

        topic = resources['ComplianceAlertTopic']
        assert topic['Type'] == 'AWS::SNS::Topic'

    def test_sns_subscription_exists(self, template):
        """Test SNS subscription resource exists"""
        resources = template['Resources']
        assert 'ComplianceAlertSubscription' in resources

        subscription = resources['ComplianceAlertSubscription']
        assert subscription['Type'] == 'AWS::SNS::Subscription'

    def test_sns_subscription_protocol(self, template):
        """Test SNS subscription uses email protocol"""
        subscription = template['Resources']['ComplianceAlertSubscription']
        assert subscription['Properties']['Protocol'] == 'email'

    def test_sns_topic_name_includes_environment_suffix(self, template):
        """Test SNS topic name includes EnvironmentSuffix"""
        topic = template['Resources']['ComplianceAlertTopic']
        topic_name = topic['Properties']['TopicName']
        assert 'Fn::Sub' in topic_name
        assert '${EnvironmentSuffix}' in topic_name['Fn::Sub']

    def test_sns_topic_has_tags(self, template):
        """Test SNS topic has required tags"""
        topic = template['Resources']['ComplianceAlertTopic']
        assert 'Tags' in topic['Properties']

        tags = topic['Properties']['Tags']
        tag_dict = {tag['Key']: tag['Value'] for tag in tags}
        assert tag_dict['Environment'] == 'qa'
        assert tag_dict['Project'] == 'compliance-checker'


class TestLambdaResources:
    """Test Lambda function configuration"""

    def test_lambda_function_exists(self, template):
        """Test Lambda function resource exists"""
        resources = template['Resources']
        assert 'ComplianceReportProcessorFunction' in resources

        function = resources['ComplianceReportProcessorFunction']
        assert function['Type'] == 'AWS::Lambda::Function'

    def test_lambda_role_exists(self, template):
        """Test Lambda execution role exists"""
        resources = template['Resources']
        assert 'ComplianceReportProcessorRole' in resources

        role = resources['ComplianceReportProcessorRole']
        assert role['Type'] == 'AWS::IAM::Role'

    def test_lambda_runtime(self, template):
        """Test Lambda function runtime"""
        function = template['Resources']['ComplianceReportProcessorFunction']
        assert function['Properties']['Runtime'] == 'python3.11'

    def test_lambda_timeout(self, template):
        """Test Lambda function timeout"""
        function = template['Resources']['ComplianceReportProcessorFunction']
        assert function['Properties']['Timeout'] == 300

    def test_lambda_handler(self, template):
        """Test Lambda function handler"""
        function = template['Resources']['ComplianceReportProcessorFunction']
        assert function['Properties']['Handler'] == 'index.lambda_handler'

    def test_lambda_environment_variables(self, template):
        """Test Lambda function environment variables"""
        function = template['Resources']['ComplianceReportProcessorFunction']
        assert 'Environment' in function['Properties']

        env = function['Properties']['Environment']['Variables']
        assert 'BUCKET_NAME' in env
        assert 'SNS_TOPIC_ARN' in env
        assert 'ENVIRONMENT_SUFFIX' in env

    def test_lambda_inline_code(self, template):
        """Test Lambda function has inline code"""
        function = template['Resources']['ComplianceReportProcessorFunction']
        assert 'Code' in function['Properties']
        assert 'ZipFile' in function['Properties']['Code']

    def test_lambda_log_group_exists(self, template):
        """Test CloudWatch Log Group for Lambda exists"""
        resources = template['Resources']
        assert 'ComplianceReportProcessorLogGroup' in resources

        log_group = resources['ComplianceReportProcessorLogGroup']
        assert log_group['Type'] == 'AWS::Logs::LogGroup'

    def test_lambda_log_retention(self, template):
        """Test CloudWatch Log Group retention"""
        log_group = template['Resources']['ComplianceReportProcessorLogGroup']
        assert log_group['Properties']['RetentionInDays'] == 30

    def test_lambda_log_group_deletion_policy(self, template):
        """Test CloudWatch Log Group has Delete policy"""
        log_group = template['Resources']['ComplianceReportProcessorLogGroup']
        assert 'DeletionPolicy' in log_group
        assert log_group['DeletionPolicy'] == 'Delete'

    def test_lambda_name_includes_environment_suffix(self, template):
        """Test Lambda function name includes EnvironmentSuffix"""
        function = template['Resources']['ComplianceReportProcessorFunction']
        function_name = function['Properties']['FunctionName']
        assert 'Fn::Sub' in function_name
        assert '${EnvironmentSuffix}' in function_name['Fn::Sub']


class TestIAMRoles:
    """Test IAM role configurations"""

    def test_lambda_role_assume_policy(self, template):
        """Test Lambda role has correct assume role policy"""
        role = template['Resources']['ComplianceReportProcessorRole']
        assume_policy = role['Properties']['AssumeRolePolicyDocument']

        assert assume_policy['Version'] == '2012-10-17'
        assert len(assume_policy['Statement']) > 0

        statement = assume_policy['Statement'][0]
        assert statement['Effect'] == 'Allow'
        assert statement['Principal']['Service'] == 'lambda.amazonaws.com'
        assert statement['Action'] == 'sts:AssumeRole'

    def test_lambda_role_has_managed_policy(self, template):
        """Test Lambda role has basic execution managed policy"""
        role = template['Resources']['ComplianceReportProcessorRole']
        assert 'ManagedPolicyArns' in role['Properties']
        assert 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole' in role['Properties']['ManagedPolicyArns']

    def test_lambda_role_has_inline_policies(self, template):
        """Test Lambda role has inline policies"""
        role = template['Resources']['ComplianceReportProcessorRole']
        assert 'Policies' in role['Properties']
        assert len(role['Properties']['Policies']) > 0

    def test_lambda_role_s3_permissions(self, template):
        """Test Lambda role has S3 permissions"""
        role = template['Resources']['ComplianceReportProcessorRole']
        policy = role['Properties']['Policies'][0]['PolicyDocument']

        # Check for S3 permissions in statements
        s3_statement = None
        for statement in policy['Statement']:
            if 's3:PutObject' in statement.get('Action', []):
                s3_statement = statement
                break

        assert s3_statement is not None
        assert 's3:PutObject' in s3_statement['Action']

    def test_ssm_automation_role_exists(self, template):
        """Test SSM automation role exists"""
        resources = template['Resources']
        assert 'SSMAutomationRole' in resources

        role = resources['SSMAutomationRole']
        assert role['Type'] == 'AWS::IAM::Role'

    def test_ssm_role_assume_policy(self, template):
        """Test SSM role has correct assume role policy"""
        role = template['Resources']['SSMAutomationRole']
        assume_policy = role['Properties']['AssumeRolePolicyDocument']

        statement = assume_policy['Statement'][0]
        assert statement['Principal']['Service'] == 'ssm.amazonaws.com'

    def test_eventbridge_role_exists(self, template):
        """Test EventBridge role exists"""
        resources = template['Resources']
        assert 'EventBridgeInvokeLambdaRole' in resources

        role = resources['EventBridgeInvokeLambdaRole']
        assert role['Type'] == 'AWS::IAM::Role'

    def test_all_roles_have_tags(self, template):
        """Test all IAM roles have required tags"""
        roles = ['ComplianceReportProcessorRole', 'SSMAutomationRole', 'EventBridgeInvokeLambdaRole']

        for role_name in roles:
            role = template['Resources'][role_name]
            assert 'Tags' in role['Properties']

            tags = role['Properties']['Tags']
            tag_dict = {tag['Key']: tag['Value'] for tag in tags}
            assert tag_dict['Environment'] == 'qa'
            assert tag_dict['Project'] == 'compliance-checker'


class TestSSMDocuments:
    """Test SSM automation document configurations"""

    def test_imdsv2_document_exists(self, template):
        """Test IMDSv2 compliance document exists"""
        resources = template['Resources']
        assert 'IMDSv2ComplianceDocument' in resources

        document = resources['IMDSv2ComplianceDocument']
        assert document['Type'] == 'AWS::SSM::Document'

    def test_approved_ami_document_exists(self, template):
        """Test approved AMI compliance document exists"""
        resources = template['Resources']
        assert 'ApprovedAMIComplianceDocument' in resources

        document = resources['ApprovedAMIComplianceDocument']
        assert document['Type'] == 'AWS::SSM::Document'

    def test_required_tags_document_exists(self, template):
        """Test required tags compliance document exists"""
        resources = template['Resources']
        assert 'RequiredTagsComplianceDocument' in resources

        document = resources['RequiredTagsComplianceDocument']
        assert document['Type'] == 'AWS::SSM::Document'

    def test_ssm_documents_are_automation_type(self, template):
        """Test all SSM documents are Automation type"""
        documents = ['IMDSv2ComplianceDocument', 'ApprovedAMIComplianceDocument', 'RequiredTagsComplianceDocument']

        for doc_name in documents:
            document = template['Resources'][doc_name]
            assert document['Properties']['DocumentType'] == 'Automation'
            assert document['Properties']['DocumentFormat'] == 'JSON'

    def test_ssm_documents_have_content(self, template):
        """Test all SSM documents have content with schema version"""
        documents = ['IMDSv2ComplianceDocument', 'ApprovedAMIComplianceDocument', 'RequiredTagsComplianceDocument']

        for doc_name in documents:
            document = template['Resources'][doc_name]
            content = document['Properties']['Content']
            assert content['schemaVersion'] == '0.3'
            assert 'description' in content
            assert 'parameters' in content
            assert 'mainSteps' in content

    def test_ssm_documents_have_tags(self, template):
        """Test all SSM documents have required tags"""
        documents = ['IMDSv2ComplianceDocument', 'ApprovedAMIComplianceDocument', 'RequiredTagsComplianceDocument']

        for doc_name in documents:
            document = template['Resources'][doc_name]
            assert 'Tags' in document['Properties']

            tags = document['Properties']['Tags']
            tag_dict = {tag['Key']: tag['Value'] for tag in tags}
            assert tag_dict['Environment'] == 'qa'
            assert tag_dict['Project'] == 'compliance-checker'


class TestEventBridgeRules:
    """Test EventBridge rule configurations"""

    def test_ec2_state_change_rule_exists(self, template):
        """Test EC2 state change rule exists"""
        resources = template['Resources']
        assert 'EC2StateChangeRule' in resources

        rule = resources['EC2StateChangeRule']
        assert rule['Type'] == 'AWS::Events::Rule'

    def test_security_group_change_rule_exists(self, template):
        """Test security group change rule exists"""
        resources = template['Resources']
        assert 'SecurityGroupChangeRule' in resources

        rule = resources['SecurityGroupChangeRule']
        assert rule['Type'] == 'AWS::Events::Rule'

    def test_iam_role_change_rule_exists(self, template):
        """Test IAM role change rule exists"""
        resources = template['Resources']
        assert 'IAMRoleChangeRule' in resources

        rule = resources['IAMRoleChangeRule']
        assert rule['Type'] == 'AWS::Events::Rule'

    def test_eventbridge_rules_are_enabled(self, template):
        """Test all EventBridge rules are enabled"""
        rules = ['EC2StateChangeRule', 'SecurityGroupChangeRule', 'IAMRoleChangeRule']

        for rule_name in rules:
            rule = template['Resources'][rule_name]
            assert rule['Properties']['State'] == 'ENABLED'

    def test_eventbridge_rules_have_event_patterns(self, template):
        """Test all EventBridge rules have event patterns"""
        rules = ['EC2StateChangeRule', 'SecurityGroupChangeRule', 'IAMRoleChangeRule']

        for rule_name in rules:
            rule = template['Resources'][rule_name]
            assert 'EventPattern' in rule['Properties']
            assert 'source' in rule['Properties']['EventPattern']
            assert 'detail-type' in rule['Properties']['EventPattern']

    def test_eventbridge_rules_have_targets(self, template):
        """Test all EventBridge rules have Lambda targets"""
        rules = ['EC2StateChangeRule', 'SecurityGroupChangeRule', 'IAMRoleChangeRule']

        for rule_name in rules:
            rule = template['Resources'][rule_name]
            assert 'Targets' in rule['Properties']
            assert len(rule['Properties']['Targets']) > 0

            target = rule['Properties']['Targets'][0]
            assert 'Arn' in target
            assert 'RoleArn' in target

    def test_lambda_permissions_exist(self, template):
        """Test Lambda permissions for EventBridge rules exist"""
        permissions = ['EC2StateChangeRulePermission', 'SecurityGroupChangeRulePermission', 'IAMRoleChangeRulePermission']

        for perm_name in permissions:
            assert perm_name in template['Resources']
            permission = template['Resources'][perm_name]
            assert permission['Type'] == 'AWS::Lambda::Permission'
            assert permission['Properties']['Action'] == 'lambda:InvokeFunction'
            assert permission['Properties']['Principal'] == 'events.amazonaws.com'


class TestCloudWatchDashboard:
    """Test CloudWatch dashboard configuration"""

    def test_dashboard_exists(self, template):
        """Test CloudWatch dashboard resource exists"""
        resources = template['Resources']
        assert 'ComplianceDashboard' in resources

        dashboard = resources['ComplianceDashboard']
        assert dashboard['Type'] == 'AWS::CloudWatch::Dashboard'

    def test_dashboard_has_body(self, template):
        """Test CloudWatch dashboard has body"""
        dashboard = template['Resources']['ComplianceDashboard']
        assert 'DashboardBody' in dashboard['Properties']

    def test_dashboard_name_includes_environment_suffix(self, template):
        """Test CloudWatch dashboard name includes EnvironmentSuffix"""
        dashboard = template['Resources']['ComplianceDashboard']
        dashboard_name = dashboard['Properties']['DashboardName']
        assert 'Fn::Sub' in dashboard_name
        assert '${EnvironmentSuffix}' in dashboard_name['Fn::Sub']


class TestOutputs:
    """Test stack outputs"""

    def test_bucket_name_output(self, template):
        """Test S3 bucket name output exists"""
        outputs = template['Outputs']
        assert 'ComplianceReportsBucketName' in outputs

        output = outputs['ComplianceReportsBucketName']
        assert 'Description' in output
        assert 'Value' in output

    def test_topic_arn_output(self, template):
        """Test SNS topic ARN output exists"""
        outputs = template['Outputs']
        assert 'ComplianceAlertTopicArn' in outputs

        output = outputs['ComplianceAlertTopicArn']
        assert 'Description' in output
        assert 'Value' in output

    def test_lambda_arn_output(self, template):
        """Test Lambda function ARN output exists"""
        outputs = template['Outputs']
        assert 'ComplianceReportProcessorFunctionArn' in outputs

        output = outputs['ComplianceReportProcessorFunctionArn']
        assert 'Description' in output
        assert 'Value' in output

    def test_dashboard_url_output(self, template):
        """Test CloudWatch dashboard URL output exists"""
        outputs = template['Outputs']
        assert 'ComplianceDashboardURL' in outputs

        output = outputs['ComplianceDashboardURL']
        assert 'Description' in output
        assert 'Value' in output

    def test_ssm_document_outputs(self, template):
        """Test SSM document name outputs exist"""
        outputs = template['Outputs']
        assert 'IMDSv2ComplianceDocumentName' in outputs
        assert 'ApprovedAMIComplianceDocumentName' in outputs
        assert 'RequiredTagsComplianceDocumentName' in outputs


class TestResourceNaming:
    """Test resource naming conventions"""

    def test_resources_with_environment_suffix(self, template):
        """Test resources that should have EnvironmentSuffix in names"""
        resources_with_suffix = [
            'ComplianceReportsBucket',
            'ComplianceAlertTopic',
            'ComplianceReportProcessorRole',
            'ComplianceReportProcessorLogGroup',
            'ComplianceReportProcessorFunction',
            'SSMAutomationRole',
            'IMDSv2ComplianceDocument',
            'ApprovedAMIComplianceDocument',
            'RequiredTagsComplianceDocument',
            'EventBridgeInvokeLambdaRole',
            'EC2StateChangeRule',
            'SecurityGroupChangeRule',
            'IAMRoleChangeRule',
            'ComplianceDashboard'
        ]

        for resource_name in resources_with_suffix:
            resource = template['Resources'][resource_name]
            # Convert resource properties to string to search for EnvironmentSuffix
            resource_str = json.dumps(resource['Properties'])
            assert '${EnvironmentSuffix}' in resource_str or 'EnvironmentSuffix' in resource_str


class TestDeletionPolicies:
    """Test deletion policy configurations"""

    def test_s3_bucket_has_retain_policy(self, template):
        """Test S3 bucket has Retain deletion policy"""
        bucket = template['Resources']['ComplianceReportsBucket']
        assert bucket['DeletionPolicy'] == 'Retain'

    def test_log_group_has_delete_policy(self, template):
        """Test CloudWatch Log Group has Delete policy"""
        log_group = template['Resources']['ComplianceReportProcessorLogGroup']
        assert log_group['DeletionPolicy'] == 'Delete'

    def test_other_resources_no_retain_policy(self, template):
        """Test other resources don't have Retain policy"""
        resources = template['Resources']

        for resource_name, resource in resources.items():
            if resource_name not in ['ComplianceReportsBucket', 'ComplianceReportProcessorLogGroup']:
                # These resources should not have Retain policy
                deletion_policy = resource.get('DeletionPolicy', 'Delete')
                assert deletion_policy != 'Retain', f"{resource_name} should not have Retain policy"


class TestTagging:
    """Test resource tagging"""

    def test_resources_have_required_tags(self, template):
        """Test resources that support tagging have required tags"""
        taggable_resources = [
            'ComplianceReportsBucket',
            'ComplianceAlertTopic',
            'ComplianceReportProcessorRole',
            'ComplianceReportProcessorFunction',
            'SSMAutomationRole',
            'IMDSv2ComplianceDocument',
            'ApprovedAMIComplianceDocument',
            'RequiredTagsComplianceDocument',
            'EventBridgeInvokeLambdaRole'
        ]

        for resource_name in taggable_resources:
            resource = template['Resources'][resource_name]
            assert 'Tags' in resource['Properties'], f"{resource_name} missing Tags"

            tags = resource['Properties']['Tags']
            tag_dict = {tag['Key']: tag['Value'] for tag in tags}

            assert 'Environment' in tag_dict, f"{resource_name} missing Environment tag"
            assert tag_dict['Environment'] == 'qa', f"{resource_name} Environment tag not 'qa'"

            assert 'Project' in tag_dict, f"{resource_name} missing Project tag"
            assert tag_dict['Project'] == 'compliance-checker', f"{resource_name} Project tag not 'compliance-checker'"

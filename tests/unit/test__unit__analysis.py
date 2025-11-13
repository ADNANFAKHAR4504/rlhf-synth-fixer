"""""""""

Unit Tests for S3 Security Auditor

Unit Tests for S3 Security AuditorUnit Tests for S3 Security Auditor

This file contains unit tests for the S3SecurityAuditor class.

"""



import sys============================================================================================================================================================

import os

import jsonThis file contains comprehensive unit tests for the S3SecurityAuditor class.INSTRUCTIONS: How to Use This Template

from datetime import datetime, timezone, timedelta

from unittest.mock import MagicMock, patchUnit tests use unittest.mock to test logic WITHOUT external services (no Moto).==============================================================================



import pytest==============================================================================



# Add parent directory to path to import the analysis module"""This template provides a structure for unit testing the S3SecurityAuditor class.

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'lib'))

Unit tests use unittest.mock to test logic WITHOUT external services (no Moto).

from analyse import S3SecurityAuditor, Finding

import sys



class TestS3SecurityAuditor:import osSTEP 1: Update Class and Method Names

    """Test suite for S3SecurityAuditor class"""

import json--------------------------------------

    @patch('analyse.boto3.client')

    def test_initialization(self, mock_boto_client):from datetime import datetime, timezone, timedeltaReplace these placeholders throughout the file:

        """Test that auditor initializes correctly"""

        auditor = S3SecurityAuditor(region='us-east-1')from unittest.mock import MagicMock, patch, call- [AnalyzerClass] → S3SecurityAuditor

        assert auditor.region == 'us-east-1'

        assert auditor.findings == []- [analyze_method_1] → _check_public_access

        assert auditor.bucket_cache == {}

import pytest- [analyze_method_2] → _check_encryption

    @patch('analyse.boto3.client')

    def test_bucket_filtering(self, mock_boto_client):- etc.

        """Test bucket filtering logic"""

        mock_s3_client = MagicMock()# Add parent directory to path to import the analysis module

        mock_boto_client.return_value = mock_s3_client

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'lib'))STEP 2: Update AWS Service Mocks

        # Mock buckets with different creation dates

        recent_date = datetime.now(timezone.utc) - timedelta(days=30)---------------------------------

        old_date = datetime.now(timezone.utc) - timedelta(days=90)

# Import the S3SecurityAuditor classUpdate the boto3.client() mock calls to match your AWS services:

        mock_s3_client.list_buckets.return_value = {

            'Buckets': [from analyse import S3SecurityAuditor, Finding- S3 client for bucket operations

                {'Name': 'recent-bucket', 'CreationDate': recent_date},

                {'Name': 'old-bucket', 'CreationDate': old_date},- CloudWatch client for metrics

                {'Name': 'temp-bucket', 'CreationDate': old_date}

            ]

        }

class TestS3SecurityAuditor:STEP 3: Copy and Adapt Analysis Method Tests

        auditor = S3SecurityAuditor()

        buckets = auditor._get_buckets_to_audit()    """---------------------------------------------



        assert len(buckets) == 1    Test suite for S3SecurityAuditor classFor EACH _check_* method in S3SecurityAuditor:

        assert buckets[0]['Name'] == 'old-bucket'

    """1. Copy the "Analysis Method Template" section

    @patch('analyse.boto3.client')

    def test_public_access_detection(self, mock_boto_client):2. Replace [analyze_method_X] with your method name

        """Test public access detection"""

        mock_s3_client = MagicMock()    # =========================================================================3. Update mock data to match AWS API responses for S3

        mock_boto_client.return_value = mock_s3_client

    # INITIALIZATION TESTS4. Update assertions to match your Finding structure

        # Mock ACL with public access

        mock_s3_client.get_bucket_acl.return_value = {    # =========================================================================

            'Grants': [{

                'Grantee': {STEP 4: Test Your Helper Methods

                    'Type': 'Group',

                    'URI': 'http://acs.amazonaws.com/groups/global/AllUsers'    @patch('analyse.boto3.client')---------------------------------

                },

                'Permission': 'READ'    def test_initialization_creates_aws_clients(self, mock_boto_client):Add tests for helper/private methods that contain business logic

            }]

        }        """Test that auditor initializes with correct AWS clients"""



        auditor = S3SecurityAuditor()        auditor = S3SecurityAuditor(region='us-east-1')STEP 5: Update Main/Report Tests

        auditor.bucket_cache = {'test-bucket': {'arn': 'arn:aws:s3:::test-bucket'}}

        auditor._check_public_access('test-bucket')---------------------------------



        assert len(auditor.findings) == 1        assert auditor.region == 'us-east-1'Ensure main() and report generation tests match your implementation

        assert auditor.findings[0].issue_type == 'PUBLIC_ACCESS'

        assert auditor.findings[0].severity == 'CRITICAL'        assert auditor.findings == []



    @patch('analyse.boto3.client')        assert auditor.bucket_cache == {}==============================================================================

    def test_encryption_check(self, mock_boto_client):

        """Test encryption requirement detection"""KEY DIFFERENCES FROM INTEGRATION TESTS (test-analysis-py.py):

        mock_s3_client = MagicMock()

        mock_boto_client.return_value = mock_s3_client        # Verify boto3.client calls==============================================================================



        # Mock missing encryption        expected_calls = [UNIT TESTS (this file):

        mock_s3_client.get_bucket_encryption.side_effect = \

            mock_s3_client.exceptions.ServerSideEncryptionConfigurationNotFoundError({}, '')            call('s3', region_name='us-east-1'),- Use unittest.mock to mock boto3 clients



        auditor = S3SecurityAuditor()            call('cloudwatch', region_name='us-east-1')- No Moto server required

        auditor.bucket_cache = {'test-bucket': {'arn': 'arn:aws:s3:::test-bucket'}}

        auditor._check_encryption('test-bucket')        ]- Test individual methods in isolation



        assert len(auditor.findings) == 1        mock_boto_client.assert_has_calls(expected_calls)- Fast execution

        assert auditor.findings[0].issue_type == 'NO_ENCRYPTION'

- Mock AWS API responses directly

    @patch('analyse.boto3.client')

    def test_secure_transport_check(self, mock_boto_client):    @patch('analyse.boto3.client')

        """Test SSL/TLS enforcement detection"""

        mock_s3_client = MagicMock()    @patch.dict(os.environ, {'AWS_ENDPOINT_URL': 'http://localhost:5000'})INTEGRATION TESTS (test-analysis-py.py):

        mock_boto_client.return_value = mock_s3_client

    def test_initialization_uses_endpoint_from_environment(self, mock_boto_client):- Use Moto to create actual mock AWS resources

        # Mock policy without secure transport

        mock_s3_client.get_bucket_policy.return_value = {        """Test auditor uses Moto endpoint from AWS_ENDPOINT_URL environment variable"""- Moto server runs in background

            'Policy': json.dumps({

                'Statement': [{        auditor = S3SecurityAuditor()- Test complete workflows end-to-end

                    'Effect': 'Allow',

                    'Action': 's3:GetObject'- Slower execution

                    # Missing aws:SecureTransport condition

                }]        # Verify endpoint_url was passed to boto3 clients- Creates resources via boto3, reads them back

            })

        }        calls = mock_boto_client.call_args_list



        auditor = S3SecurityAuditor()        for call_args in calls:==============================================================================

        auditor.bucket_cache = {'test-bucket': {'arn': 'arn:aws:s3:::test-bucket'}}

        auditor._check_secure_transport('test-bucket')            assert call_args[1].get('endpoint_url') == 'http://localhost:5000'"""



        assert len(auditor.findings) == 1

        assert auditor.findings[0].issue_type == 'NO_SECURE_TRANSPORT'

    # =========================================================================import sys

    @patch('analyse.boto3.client')

    def test_compliance_summary(self, mock_boto_client):    # BUCKET AUDIT SELECTION TESTSimport os

        """Test compliance summary generation"""

        auditor = S3SecurityAuditor()    # =========================================================================import json



        # Add mock findingsfrom datetime import datetime, timezone, timedelta

        auditor.findings = [

            Finding('bucket1', 'arn:aws:s3:::bucket1', 'PUBLIC_ACCESS', 'CRITICAL', ['SOC2'], '', '', ''),    @patch('analyse.boto3.client')from unittest.mock import MagicMock, patch, call

            Finding('bucket2', 'arn:aws:s3:::bucket2', 'NO_ENCRYPTION', 'HIGH', ['SOC2'], '', '', '')

        ]    def test_get_buckets_to_audit_filters_recent_buckets(self, mock_boto_client):



        audited_buckets = [        """Test _get_buckets_to_audit excludes buckets created less than 60 days ago"""import pytest

            {'Name': 'bucket1'},

            {'Name': 'bucket2'},        mock_s3_client = MagicMock()

            {'Name': 'bucket3'}

        ]        mock_boto_client.return_value = mock_s3_client# Add parent directory to path to import the analysis module



        summary = auditor._generate_compliance_summary(audited_buckets)sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'lib'))



        assert summary['total_buckets_audited'] == 3        # Mock list_buckets response with recent bucket

        assert summary['compliant_buckets'] == 1

        assert summary['non_compliant_buckets'] == 2        recent_date = datetime.now(timezone.utc) - timedelta(days=30)# Import the S3SecurityAuditor class

        assert summary['findings_by_severity']['CRITICAL'] == 1

        assert summary['findings_by_severity']['HIGH'] == 1        mock_s3_client.list_buckets.return_value = {from analyse import S3SecurityAuditor, Finding



    @patch('analyse.boto3.client')            'Buckets': [

    def test_error_handling(self, mock_boto_client):

        """Test graceful error handling"""                {

        from botocore.exceptions import ClientError

                    'Name': 'recent-bucket',class TestS3SecurityAuditor:

        mock_s3_client = MagicMock()

        mock_boto_client.return_value = mock_s3_client                    'CreationDate': recent_date    """



        # Mock client error                },    Test suite for S3SecurityAuditor class

        mock_s3_client.get_bucket_acl.side_effect = ClientError(

            {'Error': {'Code': 'AccessDenied', 'Message': 'Access Denied'}}, 'GetBucketAcl'                {    """

        )

                    'Name': 'old-bucket',

        auditor = S3SecurityAuditor()

        auditor.bucket_cache = {'test-bucket': {'arn': 'arn:aws:s3:::test-bucket'}}                    'CreationDate': datetime.now(timezone.utc) - timedelta(days=90)    # =========================================================================



        # Should not raise exception                }    # INITIALIZATION TESTS

        auditor._check_public_access('test-bucket')

        assert len(auditor.findings) == 0  # Errors don't create findings            ]    # =========================================================================

        }

    @patch('analyse.boto3.client')

        auditor = S3SecurityAuditor()    def test_initialization_creates_aws_clients(self, mock_boto_client):

        buckets = auditor._get_buckets_to_audit()        """Test that auditor initializes with correct AWS clients"""

        auditor = S3SecurityAuditor(region='us-east-1')

        assert len(buckets) == 1

        assert buckets[0]['Name'] == 'old-bucket'        assert auditor.region == 'us-east-1'

        assert auditor.findings == []

    @patch('analyse.boto3.client')        assert auditor.bucket_cache == {}

    def test_get_buckets_to_audit_excludes_temp_buckets(self, mock_boto_client):

        """Test _get_buckets_to_audit excludes temp and test buckets"""        # Verify boto3.client calls

        mock_s3_client = MagicMock()        expected_calls = [

        mock_boto_client.return_value = mock_s3_client            call('s3', region_name='us-east-1'),

            call('cloudwatch', region_name='us-east-1')

        old_date = datetime.now(timezone.utc) - timedelta(days=90)        ]

        mock_s3_client.list_buckets.return_value = {        mock_boto_client.assert_has_calls(expected_calls)

            'Buckets': [

                {'Name': 'temp-bucket', 'CreationDate': old_date},    @patch('analyse.boto3.client')

                {'Name': 'test-bucket', 'CreationDate': old_date},    @patch.dict(os.environ, {'AWS_ENDPOINT_URL': 'http://localhost:5000'})

                {'Name': 'valid-bucket', 'CreationDate': old_date}    def test_initialization_uses_endpoint_from_environment(self, mock_boto_client):

            ]        """Test auditor uses Moto endpoint from AWS_ENDPOINT_URL environment variable"""

        }        auditor = S3SecurityAuditor()



        auditor = S3SecurityAuditor()        # Verify endpoint_url was passed to boto3 clients

        buckets = auditor._get_buckets_to_audit()        calls = mock_boto_client.call_args_list

        for call_args in calls:

        assert len(buckets) == 1            assert call_args[1].get('endpoint_url') == 'http://localhost:5000'

        assert buckets[0]['Name'] == 'valid-bucket'

    # =========================================================================

    @patch('analyse.boto3.client')    # BUCKET AUDIT SELECTION TESTS

    def test_get_buckets_to_audit_excludes_excludedfromaudit_buckets(self, mock_boto_client):    # =========================================================================

        """Test _get_buckets_to_audit excludes buckets with ExcludeFromAudit tag"""

        mock_s3_client = MagicMock()    @patch('analyse.boto3.client')

        mock_boto_client.return_value = mock_s3_client    def test_get_buckets_to_audit_filters_recent_buckets(self, mock_boto_client):

        """Test _get_buckets_to_audit excludes buckets created less than 60 days ago"""

        old_date = datetime.now(timezone.utc) - timedelta(days=90)        mock_s3_client = MagicMock()

        mock_boto_client.return_value = mock_s3_client

        # Mock list_buckets

        mock_s3_client.list_buckets.return_value = {        # Mock list_buckets response with recent bucket

            'Buckets': [        recent_date = datetime.now(timezone.utc) - timedelta(days=30)

                {'Name': 'excluded-bucket', 'CreationDate': old_date},        mock_s3_client.list_buckets.return_value = {

                {'Name': 'included-bucket', 'CreationDate': old_date}            'Buckets': [

            ]                {

        }                    'Name': 'recent-bucket',

                    'CreationDate': recent_date

        # Mock get_bucket_tagging for excluded bucket                },

        def mock_get_bucket_tagging(Bucket):                {

            if Bucket == 'excluded-bucket':                    'Name': 'old-bucket',

                return {'TagSet': [{'Key': 'ExcludeFromAudit', 'Value': 'true'}]}                    'CreationDate': datetime.now(timezone.utc) - timedelta(days=90)

            else:                }

                return {'TagSet': []}            ]

        }

        mock_s3_client.get_bucket_tagging.side_effect = mock_get_bucket_tagging

        auditor = S3SecurityAuditor()

        auditor = S3SecurityAuditor()        buckets = auditor._get_buckets_to_audit()

        buckets = auditor._get_buckets_to_audit()

        assert len(buckets) == 1

        assert len(buckets) == 1        assert buckets[0]['Name'] == 'old-bucket'

        assert buckets[0]['Name'] == 'included-bucket'

    @patch('analyse.boto3.client')

    # =========================================================================    def test_get_buckets_to_audit_excludes_temp_buckets(self, mock_boto_client):

    # SECURITY CHECK TESTS        """Test _get_buckets_to_audit excludes temp and test buckets"""

    # =========================================================================        mock_s3_client = MagicMock()

        mock_boto_client.return_value = mock_s3_client

    @patch('analyse.boto3.client')

    def test_check_public_access_detects_acl_public_access(self, mock_boto_client):        old_date = datetime.now(timezone.utc) - timedelta(days=90)

        """Test _check_public_access detects public access via ACL grants"""        mock_s3_client.list_buckets.return_value = {

        mock_s3_client = MagicMock()            'Buckets': [

        mock_boto_client.return_value = mock_s3_client                {'Name': 'temp-bucket', 'CreationDate': old_date},

                {'Name': 'test-bucket', 'CreationDate': old_date},

        # Mock ACL response with public grant                {'Name': 'valid-bucket', 'CreationDate': old_date}

        mock_s3_client.get_bucket_acl.return_value = {            ]

            'Grants': [        }

                {

                    'Grantee': {        auditor = S3SecurityAuditor()

                        'Type': 'Group',        buckets = auditor._get_buckets_to_audit()

                        'URI': 'http://acs.amazonaws.com/groups/global/AllUsers'

                    },        assert len(buckets) == 1

                    'Permission': 'READ'        assert buckets[0]['Name'] == 'valid-bucket'

                }

            ]    @patch('analyse.boto3.client')

        }    def test_get_buckets_to_audit_excludes_excludedfromaudit_buckets(self, mock_boto_client):

        """Test _get_buckets_to_audit excludes buckets with ExcludeFromAudit tag"""

        auditor = S3SecurityAuditor()        mock_s3_client = MagicMock()

        auditor.bucket_cache = {'test-bucket': {'arn': 'arn:aws:s3:::test-bucket'}}        mock_boto_client.return_value = mock_s3_client

        auditor._check_public_access('test-bucket')

        old_date = datetime.now(timezone.utc) - timedelta(days=90)

        assert len(auditor.findings) == 1

        finding = auditor.findings[0]        # Mock list_buckets

        assert finding.bucket_name == 'test-bucket'        mock_s3_client.list_buckets.return_value = {

        assert finding.issue_type == 'PUBLIC_ACCESS'            'Buckets': [

        assert finding.severity == 'CRITICAL'                {'Name': 'excluded-bucket', 'CreationDate': old_date},

        assert 'ACL grants' in finding.current_config                {'Name': 'included-bucket', 'CreationDate': old_date}

            ]

    @patch('analyse.boto3.client')        }

    def test_check_public_access_detects_policy_public_access(self, mock_boto_client):

        """Test _check_public_access detects public access via bucket policy"""        # Mock get_bucket_tagging for excluded bucket

        mock_s3_client = MagicMock()        def mock_get_bucket_tagging(Bucket):

        mock_boto_client.return_value = mock_s3_client            if Bucket == 'excluded-bucket':

                return {'TagSet': [{'Key': 'ExcludeFromAudit', 'Value': 'true'}]}

        # Mock ACL (no public grants)            else:

        mock_s3_client.get_bucket_acl.return_value = {'Grants': []}                return {'TagSet': []}



        # Mock policy with public access        mock_s3_client.get_bucket_tagging.side_effect = mock_get_bucket_tagging

        mock_s3_client.get_bucket_policy.return_value = {

            'Policy': json.dumps({        auditor = S3SecurityAuditor()

                'Statement': [{        buckets = auditor._get_buckets_to_audit()

                    'Principal': '*',

                    'Effect': 'Allow',        assert len(buckets) == 1

                    'Action': 's3:GetObject'        assert buckets[0]['Name'] == 'included-bucket'

                }]

            })    # =========================================================================

        }    # SECURITY CHECK TESTS

    # =========================================================================

        auditor = S3SecurityAuditor()

        auditor.bucket_cache = {'test-bucket': {'arn': 'arn:aws:s3:::test-bucket'}}    @patch('analyse.boto3.client')

        auditor._check_public_access('test-bucket')    def test_check_public_access_detects_acl_public_access(self, mock_boto_client):

        """Test _check_public_access detects public access via ACL grants"""

        assert len(auditor.findings) == 1        mock_s3_client = MagicMock()

        assert 'Policy allows Principal' in auditor.findings[0].current_config        mock_boto_client.return_value = mock_s3_client



    @patch('analyse.boto3.client')        # Mock ACL response with public grant

    def test_check_encryption_detects_missing_encryption(self, mock_boto_client):        mock_s3_client.get_bucket_acl.return_value = {

        """Test _check_encryption detects buckets without default encryption"""            'Grants': [

        mock_s3_client = MagicMock()                {

        mock_boto_client.return_value = mock_s3_client                    'Grantee': {

                        'Type': 'Group',

        # Mock missing encryption configuration                        'URI': 'http://acs.amazonaws.com/groups/global/AllUsers'

        mock_s3_client.get_bucket_encryption.side_effect = \                    },

            mock_s3_client.exceptions.ServerSideEncryptionConfigurationNotFoundError({}, '')                    'Permission': 'READ'

                }

        auditor = S3SecurityAuditor()            ]

        auditor.bucket_cache = {'test-bucket': {'arn': 'arn:aws:s3:::test-bucket'}}        }

        auditor._check_encryption('test-bucket')

        auditor = S3SecurityAuditor()

        assert len(auditor.findings) == 1        auditor.bucket_cache = {'test-bucket': {'arn': 'arn:aws:s3:::test-bucket'}}

        finding = auditor.findings[0]        auditor._check_public_access('test-bucket')

        assert finding.issue_type == 'NO_ENCRYPTION'

        assert finding.severity == 'HIGH'        assert len(auditor.findings) == 1

        finding = auditor.findings[0]

    @patch('analyse.boto3.client')        assert finding.bucket_name == 'test-bucket'

    def test_check_versioning_detects_disabled_versioning_for_critical_data(self, mock_boto_client):        assert finding.issue_type == 'PUBLIC_ACCESS'

        """Test _check_versioning detects disabled versioning for critical/confidential buckets"""        assert finding.severity == 'CRITICAL'

        mock_s3_client = MagicMock()        assert 'ACL grants' in finding.current_config

        mock_boto_client.return_value = mock_s3_client

    @patch('analyse.boto3.client')

        # Mock versioning disabled    def test_check_public_access_detects_policy_public_access(self, mock_boto_client):

        mock_s3_client.get_bucket_versioning.return_value = {'Status': 'Disabled'}        """Test _check_public_access detects public access via bucket policy"""

        mock_s3_client = MagicMock()

        auditor = S3SecurityAuditor()        mock_boto_client.return_value = mock_s3_client

        auditor.bucket_cache = {

            'test-bucket': {        # Mock ACL (no public grants)

                'arn': 'arn:aws:s3:::test-bucket',        mock_s3_client.get_bucket_acl.return_value = {'Grants': []}

                'tags': {'DataClassification': 'Critical'}

            }        # Mock policy with public access

        }        mock_s3_client.get_bucket_policy.return_value = {

        auditor._check_versioning('test-bucket')            'Policy': json.dumps({

                'Statement': [{

        assert len(auditor.findings) == 1                    'Principal': '*',

        finding = auditor.findings[0]                    'Effect': 'Allow',

        assert finding.issue_type == 'NO_VERSIONING'                    'Action': 's3:GetObject'

        assert finding.severity == 'HIGH'                }]

        assert 'Critical' in finding.current_config            })

        }

    @patch('analyse.boto3.client')

    def test_check_logging_detects_disabled_logging(self, mock_boto_client):        auditor = S3SecurityAuditor()

        """Test _check_logging detects buckets without server access logging"""        auditor.bucket_cache = {'test-bucket': {'arn': 'arn:aws:s3:::test-bucket'}}

        mock_s3_client = MagicMock()        auditor._check_public_access('test-bucket')

        mock_boto_client.return_value = mock_s3_client

        assert len(auditor.findings) == 1

        # Mock no logging configuration        assert 'Policy allows Principal' in auditor.findings[0].current_config

        mock_s3_client.get_bucket_logging.return_value = {}

    @patch('analyse.boto3.client')

        auditor = S3SecurityAuditor()    def test_check_encryption_detects_missing_encryption(self, mock_boto_client):

        auditor.bucket_cache = {'test-bucket': {'arn': 'arn:aws:s3:::test-bucket'}}        """Test _check_encryption detects buckets without default encryption"""

        auditor._check_logging('test-bucket')        mock_s3_client = MagicMock()

        mock_boto_client.return_value = mock_s3_client

        assert len(auditor.findings) == 1

        finding = auditor.findings[0]        # Mock missing encryption configuration

        assert finding.issue_type == 'NO_LOGGING'        mock_s3_client.get_bucket_encryption.side_effect = \

        assert finding.severity == 'MEDIUM'            mock_s3_client.exceptions.ServerSideEncryptionConfigurationNotFoundError({}, '')



    @patch('analyse.boto3.client')        auditor = S3SecurityAuditor()

    def test_check_secure_transport_detects_missing_ssl_policy(self, mock_boto_client):        auditor.bucket_cache = {'test-bucket': {'arn': 'arn:aws:s3:::test-bucket'}}

        """Test _check_secure_transport detects buckets without SSL/TLS enforcement"""        auditor._check_encryption('test-bucket')

        mock_s3_client = MagicMock()

        mock_boto_client.return_value = mock_s3_client        assert len(auditor.findings) == 1

        finding = auditor.findings[0]

        # Mock policy without secure transport condition        assert finding.issue_type == 'NO_ENCRYPTION'

        mock_s3_client.get_bucket_policy.return_value = {        assert finding.severity == 'HIGH'

            'Policy': json.dumps({

                'Statement': [{    @patch('analyse.boto3.client')

                    'Effect': 'Allow',    def test_check_versioning_detects_disabled_versioning_for_critical_data(self, mock_boto_client):

                    'Action': 's3:GetObject'        """Test _check_versioning detects disabled versioning for critical/confidential buckets"""

                    # No Condition with aws:SecureTransport        mock_s3_client = MagicMock()

                }]        mock_boto_client.return_value = mock_s3_client

            })

        }        # Mock versioning disabled

        mock_s3_client.get_bucket_versioning.return_value = {'Status': 'Disabled'}

        auditor = S3SecurityAuditor()

        auditor.bucket_cache = {'test-bucket': {'arn': 'arn:aws:s3:::test-bucket'}}        auditor = S3SecurityAuditor()

        auditor._check_secure_transport('test-bucket')        auditor.bucket_cache = {

            'test-bucket': {

        assert len(auditor.findings) == 1                'arn': 'arn:aws:s3:::test-bucket',

        finding = auditor.findings[0]                'tags': {'DataClassification': 'Critical'}

        assert finding.issue_type == 'NO_SECURE_TRANSPORT'            }

        assert finding.severity == 'HIGH'        }

        auditor._check_versioning('test-bucket')

    @patch('analyse.boto3.client')

    def test_check_secure_transport_detects_no_bucket_policy(self, mock_boto_client):        assert len(auditor.findings) == 1

        """Test _check_secure_transport detects buckets with no policy at all"""        finding = auditor.findings[0]

        mock_s3_client = MagicMock()        assert finding.issue_type == 'NO_VERSIONING'

        mock_boto_client.return_value = mock_s3_client        assert finding.severity == 'HIGH'

        assert 'Critical' in finding.current_config

        # Mock no bucket policy

        mock_s3_client.get_bucket_policy.side_effect = \    @patch('analyse.boto3.client')

            mock_s3_client.exceptions.NoSuchBucketPolicy({}, '')    def test_check_logging_detects_disabled_logging(self, mock_boto_client):

        """Test _check_logging detects buckets without server access logging"""

        auditor = S3SecurityAuditor()        mock_s3_client = MagicMock()

        auditor.bucket_cache = {'test-bucket': {'arn': 'arn:aws:s3:::test-bucket'}}        mock_boto_client.return_value = mock_s3_client

        auditor._check_secure_transport('test-bucket')

        # Mock no logging configuration

        assert len(auditor.findings) == 1        mock_s3_client.get_bucket_logging.return_value = {}

        assert 'No bucket policy to enforce SSL/TLS' in auditor.findings[0].current_config

        auditor = S3SecurityAuditor()

    @patch('analyse.boto3.client')        auditor.bucket_cache = {'test-bucket': {'arn': 'arn:aws:s3:::test-bucket'}}

    def test_check_object_lock_detects_disabled_lock_for_compliance_buckets(self, mock_boto_client):        auditor._check_logging('test-bucket')

        """Test _check_object_lock detects disabled object lock for compliance-required buckets"""

        mock_s3_client = MagicMock()        assert len(auditor.findings) == 1

        mock_boto_client.return_value = mock_s3_client        finding = auditor.findings[0]

        assert finding.issue_type == 'NO_LOGGING'

        # Mock object lock disabled        assert finding.severity == 'MEDIUM'

        mock_s3_client.get_object_lock_configuration.return_value = {

            'ObjectLockConfiguration': {'ObjectLockEnabled': 'Disabled'}    @patch('analyse.boto3.client')

        }    def test_check_secure_transport_detects_missing_ssl_policy(self, mock_boto_client):

        """Test _check_secure_transport detects buckets without SSL/TLS enforcement"""

        auditor = S3SecurityAuditor()        mock_s3_client = MagicMock()

        auditor.bucket_cache = {        mock_boto_client.return_value = mock_s3_client

            'test-bucket': {

                'arn': 'arn:aws:s3:::test-bucket',        # Mock policy without secure transport condition

                'tags': {'RequireCompliance': 'true'}        mock_s3_client.get_bucket_policy.return_value = {

            }            'Policy': json.dumps({

        }                'Statement': [{

        auditor._check_object_lock('test-bucket')                    'Effect': 'Allow',

                    'Action': 's3:GetObject'

        assert len(auditor.findings) == 1                    # No Condition with aws:SecureTransport

        finding = auditor.findings[0]                }]

        assert finding.issue_type == 'NO_OBJECT_LOCK'            })

        assert finding.severity == 'CRITICAL'        }



    @patch('analyse.boto3.client')        auditor = S3SecurityAuditor()

    def test_check_mfa_delete_detects_disabled_mfa_for_financial_buckets(self, mock_boto_client):        auditor.bucket_cache = {'test-bucket': {'arn': 'arn:aws:s3:::test-bucket'}}

        """Test _check_mfa_delete detects disabled MFA delete for financial buckets"""        auditor._check_secure_transport('test-bucket')

        mock_s3_client = MagicMock()

        mock_boto_client.return_value = mock_s3_client        assert len(auditor.findings) == 1

        finding = auditor.findings[0]

        # Mock versioning enabled but MFA delete disabled        assert finding.issue_type == 'NO_SECURE_TRANSPORT'

        mock_s3_client.get_bucket_versioning.return_value = {        assert finding.severity == 'HIGH'

            'Status': 'Enabled',

            'MFADelete': 'Disabled'    @patch('analyse.boto3.client')

        }    def test_check_secure_transport_detects_no_bucket_policy(self, mock_boto_client):

        """Test _check_secure_transport detects buckets with no policy at all"""

        auditor = S3SecurityAuditor()        mock_s3_client = MagicMock()

        auditor.bucket_cache = {        mock_boto_client.return_value = mock_s3_client

            'financial-records-bucket': {

                'arn': 'arn:aws:s3:::financial-records-bucket',        # Mock no bucket policy

                'tags': {}        mock_s3_client.get_bucket_policy.side_effect = \

            }            mock_s3_client.exceptions.NoSuchBucketPolicy({}, '')

        }

        auditor._check_mfa_delete('financial-records-bucket')        auditor = S3SecurityAuditor()

        auditor.bucket_cache = {'test-bucket': {'arn': 'arn:aws:s3:::test-bucket'}}

        assert len(auditor.findings) == 1        auditor._check_secure_transport('test-bucket')

        finding = auditor.findings[0]

        assert finding.issue_type == 'NO_MFA_DELETE'        assert len(auditor.findings) == 1

        assert finding.severity == 'HIGH'        assert 'No bucket policy to enforce SSL/TLS' in auditor.findings[0].current_config



    # =========================================================================    @patch('analyse.boto3.client')

    # COMPLIANCE SUMMARY TESTS    def test_check_object_lock_detects_disabled_lock_for_compliance_buckets(self, mock_boto_client):

    # =========================================================================        """Test _check_object_lock detects disabled object lock for compliance-required buckets"""

        mock_s3_client = MagicMock()

    @patch('analyse.boto3.client')        mock_boto_client.return_value = mock_s3_client

    def test_generate_compliance_summary_calculates_correct_stats(self, mock_boto_client):

        """Test _generate_compliance_summary calculates correct statistics"""        # Mock object lock disabled

        auditor = S3SecurityAuditor()        mock_s3_client.get_object_lock_configuration.return_value = {

            'ObjectLockConfiguration': {'ObjectLockEnabled': 'Disabled'}

        # Add some mock findings        }

        auditor.findings = [

            Finding('bucket1', 'arn:aws:s3:::bucket1', 'PUBLIC_ACCESS', 'CRITICAL', ['SOC2'], '', '', ''),        auditor = S3SecurityAuditor()

            Finding('bucket1', 'arn:aws:s3:::bucket1', 'NO_ENCRYPTION', 'HIGH', ['SOC2'], '', '', ''),        auditor.bucket_cache = {

            Finding('bucket2', 'arn:aws:s3:::bucket2', 'NO_LOGGING', 'MEDIUM', ['GDPR'], '', '', '')            'test-bucket': {

        ]                'arn': 'arn:aws:s3:::test-bucket',

                'tags': {'RequireCompliance': 'true'}

        audited_buckets = [            }

            {'Name': 'bucket1'},        }

            {'Name': 'bucket2'},        auditor._check_object_lock('test-bucket')

            {'Name': 'bucket3'}

        ]        assert len(auditor.findings) == 1

        finding = auditor.findings[0]

        summary = auditor._generate_compliance_summary(audited_buckets)        assert finding.issue_type == 'NO_OBJECT_LOCK'

        assert finding.severity == 'CRITICAL'

        assert summary['total_buckets_audited'] == 3

        assert summary['compliant_buckets'] == 1  # bucket3 has no findings    @patch('analyse.boto3.client')

        assert summary['non_compliant_buckets'] == 2    def test_check_mfa_delete_detects_disabled_mfa_for_financial_buckets(self, mock_boto_client):

        assert summary['findings_by_severity']['CRITICAL'] == 1        """Test _check_mfa_delete detects disabled MFA delete for financial buckets"""

        assert summary['findings_by_severity']['HIGH'] == 1        mock_s3_client = MagicMock()

        assert summary['findings_by_severity']['MEDIUM'] == 1        mock_boto_client.return_value = mock_s3_client

        assert summary['findings_by_issue_type']['PUBLIC_ACCESS'] == 1

        assert summary['findings_by_issue_type']['NO_ENCRYPTION'] == 1        # Mock versioning enabled but MFA delete disabled

        assert summary['findings_by_issue_type']['NO_LOGGING'] == 1        mock_s3_client.get_bucket_versioning.return_value = {

            'Status': 'Enabled',

    # =========================================================================            'MFADelete': 'Disabled'

    # MAIN WORKFLOW TESTS        }

    # =========================================================================

        auditor = S3SecurityAuditor()

    @patch('analyse.boto3.client')        auditor.bucket_cache = {

    def test_run_audit_executes_all_checks(self, mock_boto_client):            'financial-records-bucket': {

        """Test run_audit executes all security checks and returns results"""                'arn': 'arn:aws:s3:::financial-records-bucket',

        mock_s3_client = MagicMock()                'tags': {}

        mock_cloudwatch_client = MagicMock()            }

        mock_boto_client.side_effect = [mock_s3_client, mock_cloudwatch_client]        }

        auditor._check_mfa_delete('financial-records-bucket')

        # Mock bucket listing

        old_date = datetime.now(timezone.utc) - timedelta(days=90)        assert len(auditor.findings) == 1

        mock_s3_client.list_buckets.return_value = {        finding = auditor.findings[0]

            'Buckets': [{'Name': 'test-bucket', 'CreationDate': old_date}]        assert finding.issue_type == 'NO_MFA_DELETE'

        }        assert finding.severity == 'HIGH'



        # Mock no tags    # =========================================================================

        mock_s3_client.get_bucket_tagging.side_effect = \    # COMPLIANCE SUMMARY TESTS

            mock_s3_client.exceptions.NoSuchTagSet({}, '')    # =========================================================================



        auditor = S3SecurityAuditor()    @patch('analyse.boto3.client')

        findings, summary = auditor.run_audit()    def test_generate_compliance_summary_calculates_correct_stats(self, mock_boto_client):

        """Test _generate_compliance_summary calculates correct statistics"""

        # Verify results structure        auditor = S3SecurityAuditor()

        assert isinstance(findings, list)

        assert isinstance(summary, dict)        # Add some mock findings

        assert 'total_buckets_audited' in summary        auditor.findings = [

        assert 'compliant_buckets' in summary            Finding('bucket1', 'arn:aws:s3:::bucket1', 'PUBLIC_ACCESS', 'CRITICAL', ['SOC2'], '', '', ''),

        assert 'findings_by_severity' in summary            Finding('bucket1', 'arn:aws:s3:::bucket1', 'NO_ENCRYPTION', 'HIGH', ['SOC2'], '', '', ''),

            Finding('bucket2', 'arn:aws:s3:::bucket2', 'NO_LOGGING', 'MEDIUM', ['GDPR'], '', '', '')

    # =========================================================================        ]

    # REPORT GENERATION TESTS

    # =========================================================================        audited_buckets = [

            {'Name': 'bucket1'},

    @patch('analyse.boto3.client')            {'Name': 'bucket2'},

    @patch('builtins.open', create=True)            {'Name': 'bucket3'}

    @patch('json.dump')        ]

    def test_save_json_report_creates_file(self, mock_json_dump, mock_open, mock_boto_client):

        """Test save_json_report creates JSON output file"""        summary = auditor._generate_compliance_summary(audited_buckets)

        auditor = S3SecurityAuditor()

        auditor.findings = [Finding('test', 'arn', 'TEST', 'LOW', [], '', '', '')]        assert summary['total_buckets_audited'] == 3

        auditor._last_summary = {'test': 'summary'}        assert summary['compliant_buckets'] == 1  # bucket3 has no findings

        assert summary['non_compliant_buckets'] == 2

        auditor.save_json_report('test_report.json')        assert summary['findings_by_severity']['CRITICAL'] == 1

        assert summary['findings_by_severity']['HIGH'] == 1

        mock_open.assert_called_with('test_report.json', 'w')        assert summary['findings_by_severity']['MEDIUM'] == 1

        assert mock_json_dump.called        assert summary['findings_by_issue_type']['PUBLIC_ACCESS'] == 1

        assert summary['findings_by_issue_type']['NO_ENCRYPTION'] == 1

    @patch('analyse.boto3.client')        assert summary['findings_by_issue_type']['NO_LOGGING'] == 1

    @patch('builtins.open', create=True)

    def test_save_html_report_creates_file(self, mock_open, mock_boto_client):    # =========================================================================

        """Test save_html_report creates HTML output file"""    # MAIN WORKFLOW TESTS

        auditor = S3SecurityAuditor()    # =========================================================================

        findings = [Finding('test', 'arn', 'TEST', 'LOW', [], '', '', '')]

        summary = {'total_buckets_audited': 1, 'compliant_buckets': 1, 'non_compliant_buckets': 0,    @patch('analyse.boto3.client')

                  'findings_by_severity': {}, 'findings_by_issue_type': {}}    def test_run_audit_executes_all_checks(self, mock_boto_client):

        """Test run_audit executes all security checks and returns results"""

        auditor.save_html_report(findings, summary, 'test_report.html')        mock_s3_client = MagicMock()

        mock_cloudwatch_client = MagicMock()

        mock_open.assert_called_with('test_report.html', 'w')        mock_boto_client.side_effect = [mock_s3_client, mock_cloudwatch_client]



    # =========================================================================        # Mock bucket listing

    # ERROR HANDLING TESTS        old_date = datetime.now(timezone.utc) - timedelta(days=90)

    # =========================================================================        mock_s3_client.list_buckets.return_value = {

            'Buckets': [{'Name': 'test-bucket', 'CreationDate': old_date}]

    @patch('analyse.boto3.client')        }

    def test_check_methods_handle_client_errors_gracefully(self, mock_boto_client):

        """Test that security check methods handle AWS ClientError without raising exceptions"""        # Mock no tags

        from botocore.exceptions import ClientError        mock_s3_client.get_bucket_tagging.side_effect = \

            mock_s3_client.exceptions.NoSuchTagSet({}, '')

        mock_s3_client = MagicMock()

        mock_boto_client.return_value = mock_s3_client        auditor = S3SecurityAuditor()

        findings, summary = auditor.run_audit()

        # Mock ClientError for all operations

        mock_s3_client.get_bucket_acl.side_effect = ClientError(        # Verify results structure

            {'Error': {'Code': 'AccessDenied', 'Message': 'Access Denied'}}, 'GetBucketAcl'        assert isinstance(findings, list)

        )        assert isinstance(summary, dict)

        mock_s3_client.get_bucket_encryption.side_effect = ClientError(        assert 'total_buckets_audited' in summary

            {'Error': {'Code': 'AccessDenied', 'Message': 'Access Denied'}}, 'GetBucketEncryption'        assert 'compliant_buckets' in summary

        )        assert 'findings_by_severity' in summary



        auditor = S3SecurityAuditor()    # =========================================================================

        auditor.bucket_cache = {'test-bucket': {'arn': 'arn:aws:s3:::test-bucket'}}    # REPORT GENERATION TESTS

    # =========================================================================

        # These should not raise exceptions

        auditor._check_public_access('test-bucket')    @patch('analyse.boto3.client')

        auditor._check_encryption('test-bucket')    @patch('builtins.open', create=True)

    @patch('json.dump')

        # Findings list should remain empty (errors are logged but don't create findings)    def test_save_json_report_creates_file(self, mock_json_dump, mock_open, mock_boto_client):

        assert len(auditor.findings) == 0        """Test save_json_report creates JSON output file"""
        auditor = S3SecurityAuditor()
        auditor.findings = [Finding('test', 'arn', 'TEST', 'LOW', [], '', '', '')]
        auditor._last_summary = {'test': 'summary'}

        auditor.save_json_report('test_report.json')

        mock_open.assert_called_with('test_report.json', 'w')
        assert mock_json_dump.called

    @patch('analyse.boto3.client')
    @patch('builtins.open', create=True)
    def test_save_html_report_creates_file(self, mock_open, mock_boto_client):
        """Test save_html_report creates HTML output file"""
        auditor = S3SecurityAuditor()
        findings = [Finding('test', 'arn', 'TEST', 'LOW', [], '', '', '')]
        summary = {'total_buckets_audited': 1, 'compliant_buckets': 1, 'non_compliant_buckets': 0,
                  'findings_by_severity': {}, 'findings_by_issue_type': {}}

        auditor.save_html_report(findings, summary, 'test_report.html')

        mock_open.assert_called_with('test_report.html', 'w')

    # =========================================================================
    # ERROR HANDLING TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_check_methods_handle_client_errors_gracefully(self, mock_boto_client):
        """Test that security check methods handle AWS ClientError without raising exceptions"""
        from botocore.exceptions import ClientError

        mock_s3_client = MagicMock()
        mock_boto_client.return_value = mock_s3_client

        # Mock ClientError for all operations
        mock_s3_client.get_bucket_acl.side_effect = ClientError(
            {'Error': {'Code': 'AccessDenied', 'Message': 'Access Denied'}}, 'GetBucketAcl'
        )
        mock_s3_client.get_bucket_encryption.side_effect = ClientError(
            {'Error': {'Code': 'AccessDenied', 'Message': 'Access Denied'}}, 'GetBucketEncryption'
        )

        auditor = S3SecurityAuditor()
        auditor.bucket_cache = {'test-bucket': {'arn': 'arn:aws:s3:::test-bucket'}}

        # These should not raise exceptions
        auditor._check_public_access('test-bucket')
        auditor._check_encryption('test-bucket')

                        # Findings list should remain empty (errors are logged but don't create findings)
        assert len(auditor.findings) == 0

import sys
import os
from datetime import datetime
from unittest.mock import MagicMock, patch

import pytest

# Add parent directory to path to import the analysis module
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'lib'))

# TODO: Update this import to match your analyzer class
from analyse import S3SecurityAuditor


class TestS3SecurityAuditor:

    # =========================================================================
    # INITIALIZATION TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_initialization_creates_aws_clients(self, mock_boto_client):
        """Test that analyzer initializes with correct AWS clients"""
        # TODO: Update region parameter name if different (region vs region_name)
        analyzer = [AnalyzerClass](region='us-east-1')

        assert analyzer.region == 'us-east-1'

        # TODO: Update count and service names based on your AWS services
        assert mock_boto_client.call_count == 2  # Example: 2 services
        mock_boto_client.assert_any_call('service1', region_name='us-east-1', endpoint_url=None)
        mock_boto_client.assert_any_call('service2', region_name='us-east-1', endpoint_url=None)

    @patch('analyse.boto3.client')
    @patch.dict(os.environ, {'AWS_ENDPOINT_URL': 'http://localhost:5000'})
    def test_initialization_uses_endpoint_from_environment(self, mock_boto_client):
        """Test analyzer uses Moto endpoint from AWS_ENDPOINT_URL environment variable"""
        analyzer = [AnalyzerClass]()

        # Verify endpoint_url was passed to boto3 clients
        calls = mock_boto_client.call_args_list
        for call in calls:
            assert call[1].get('endpoint_url') == 'http://localhost:5000'

    # =========================================================================
    # ANALYSIS METHOD TESTS - TEMPLATE
    # =========================================================================
    # COPY THIS ENTIRE SECTION FOR EACH analyze_* METHOD IN YOUR CLASS

    @patch('analyse.boto3.client')
    def test_[analyze_method_1]_returns_expected_findings(self, mock_boto_client):
        """
        Test [analyze_method_1] identifies issues correctly

        TODO:
        1. Replace [analyze_method_1] with your actual method name
        2. Update mock_client to match your AWS service (e.g., mock_ec2, mock_s3)
        3. Update mock response structure to match actual AWS API
        4. Update assertions to match your finding structure
        """
        # Setup mock client
        mock_client = MagicMock()
        mock_boto_client.return_value = mock_client

        # Mock paginator (if your method uses pagination)
        mock_paginator = MagicMock()
        mock_client.get_paginator.return_value = mock_paginator

        # TODO: Create mock AWS API response matching actual structure
        # Example structure - customize for your service:
        mock_paginator.paginate.return_value = [
            {
                'ResourceKey': [  # TODO: Replace with actual key (Volumes, SecurityGroups, etc.)
                    {
                        'ResourceId': 'resource-1',
                        'State': 'problematic',  # TODO: Customize fields
                        'Field1': 'value1',
                        'Field2': 'value2',
                        'Tags': [{'Key': 'Name', 'Value': 'test'}]
                    },
                    {
                        'ResourceId': 'resource-2',
                        'State': 'ok',
                        'Field1': 'value3',
                    }
                ]
            }
        ]

        # Call analyzer method
        analyzer = [AnalyzerClass]()
        findings = analyzer.[analyze_method_1]()

        # Assert results - customize based on your output structure
        assert len(findings) > 0  # Should find at least one issue
        assert findings[0]['resource_id'] == 'resource-1'  # TODO: Update field names
        # Add more assertions specific to your findings structure

    @patch('analyse.boto3.client')
    def test_[analyze_method_1]_returns_empty_when_no_issues(self, mock_boto_client):
        """Test [analyze_method_1] returns empty list when no issues found"""
        mock_client = MagicMock()
        mock_boto_client.return_value = mock_client
        mock_paginator = MagicMock()
        mock_client.get_paginator.return_value = mock_paginator

        # Mock empty response
        mock_paginator.paginate.return_value = [{'ResourceKey': []}]  # TODO: Update key

        analyzer = [AnalyzerClass]()
        findings = analyzer.[analyze_method_1]()

        assert findings == []

    @patch('analyse.boto3.client')
    def test_[analyze_method_1]_handles_client_error_gracefully(self, mock_boto_client):
        """Test [analyze_method_1] handles AWS ClientError without raising exception"""
        from botocore.exceptions import ClientError

        # Setup mock to raise ClientError
        mock_client = MagicMock()
        mock_boto_client.return_value = mock_client
        mock_paginator = MagicMock()
        mock_client.get_paginator.return_value = mock_paginator
        mock_paginator.paginate.side_effect = ClientError(
            {'Error': {'Code': 'AccessDenied', 'Message': 'Access Denied'}},
            'DescribeOperation'  # TODO: Update operation name
        )

        analyzer = [AnalyzerClass]()
        findings = analyzer.[analyze_method_1]()

        # Should return empty list on error, not raise exception
        assert findings == []

    # =========================================================================
    # HELPER METHOD TESTS
    # =========================================================================
    # Add tests for private/helper methods that contain business logic

    @patch('analyse.boto3.client')
    def test_[helper_method]_logic(self, mock_boto_client):
        """
        Test [helper_method] helper method

        TODO: Add tests for helper methods like:
        - _extract_tags(tags) → test tag conversion
        - _calculate_cost(size, type) → test cost calculation
        - _format_output(data) → test data formatting
        - _filter_resources(resources, criteria) → test filtering logic
        """
        analyzer = [AnalyzerClass]()

        # Example: Testing a tag extraction helper
        # tags = [{'Key': 'Environment', 'Value': 'Production'}]
        # result = analyzer._extract_tags(tags)
        # assert result == {'Environment': 'Production'}

        pass  # TODO: Implement your helper method tests

    # =========================================================================
    # MAIN WORKFLOW TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_run_analysis_returns_complete_results(self, mock_boto_client):
        """
        Test run_analysis() executes all checks and returns structured results

        TODO: Update method names and expected structure
        """
        analyzer = [AnalyzerClass]()

        # Mock all analysis methods
        # TODO: Replace with your actual method names
        with patch.object(analyzer, '[analyze_method_1]', return_value=[{'finding': '1'}]):
            with patch.object(analyzer, '[analyze_method_2]', return_value=[{'finding': '2'}]):
                results = analyzer.run_analysis()

        # Verify result structure - TODO: Update keys to match your structure
        assert 'timestamp' in results  # or 'AuditTimestamp', 'scan_time', etc.
        assert 'region' in results  # or 'Region'
        assert 'findings' in results  # or specific keys like 'UnusedVolumes'
        assert 'summary' in results
        # assert len(results['findings']) == 2

    @patch('analyse.boto3.client')
    def test_run_analysis_generates_correct_summary_statistics(self, mock_boto_client):
        """Test that summary statistics are calculated correctly"""
        analyzer = [AnalyzerClass]()

        # Create mock findings with different attributes
        # TODO: Customize based on your finding structure
        mock_findings = [
            {'severity': 'HIGH', 'resource_type': 'Type1'},
            {'severity': 'HIGH', 'resource_type': 'Type2'},
            {'severity': 'MEDIUM', 'resource_type': 'Type1'},
            {'severity': 'LOW', 'resource_type': 'Type3'}
        ]
        analyzer.findings = mock_findings

        summary = analyzer._generate_summary()

        # Verify summary calculations
        assert summary['total_findings'] == 4
        assert summary['by_severity']['HIGH'] == 2
        assert summary['by_severity']['MEDIUM'] == 1
        assert summary['by_severity']['LOW'] == 1
        # TODO: Add assertions for other summary fields

    # =========================================================================
    # MAIN FUNCTION TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    @patch('builtins.print')
    def test_main_function_executes_successfully(self, mock_print, mock_boto_client):
        """Test main() function runs without errors and returns 0"""
        from analyse import main

        # Mock the analyzer
        with patch('analyse.[AnalyzerClass]') as MockAnalyzer:
            mock_instance = MockAnalyzer.return_value
            mock_instance.generate_report.return_value = None

            result = main()

            assert result == 0
            mock_instance.generate_report.assert_called_once()

    @patch('analyse.boto3.client')
    def test_main_function_returns_error_code_on_exception(self, mock_boto_client):
        """Test main() function handles exceptions and returns error code 1"""
        from analyse import main

        with patch('analyse.[AnalyzerClass]') as MockAnalyzer:
            MockAnalyzer.side_effect = Exception("Test error")

            result = main()

            assert result == 1

    # =========================================================================
    # REPORT GENERATION TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    @patch('builtins.open', create=True)
    @patch('json.dump')
    def test_generate_report_creates_json_file(self, mock_json_dump, mock_open, mock_boto_client):
        """Test generate_report() creates JSON output file"""
        analyzer = [AnalyzerClass]()

        mock_results = {'findings': [], 'summary': {}}
        with patch.object(analyzer, 'run_analysis', return_value=mock_results):
            analyzer.generate_report(json_file='test_report.json')

        # Verify file was opened for writing
        mock_open.assert_called_with('test_report.json', 'w')
        # Verify JSON was dumped
        assert mock_json_dump.called

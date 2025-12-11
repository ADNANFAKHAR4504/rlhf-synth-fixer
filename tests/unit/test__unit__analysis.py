# test_analyze_s3_security.py
import pytest
import json
import os
import sys
from moto import mock_aws
import boto3

# Add lib directory to path to import the analysis module
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'lib'))

from analyse import S3SecurityAnalyzer

@pytest.fixture
def s3_mock():
    with mock_aws():
        yield boto3.client('s3', region_name='us-east-1')

@pytest.fixture
def create_test_buckets(s3_mock):
    buckets_created = []
    
    # Create buckets with various configurations
    bucket_configs = [
        # Excluded buckets (25)
        *[{'name': f'test-bucket-{i}', 'excluded': True} for i in range(5)],
        *[{'name': f'temp-bucket-{i}', 'excluded': True} for i in range(5)],
        *[{'name': f'new-bucket-{i}', 'excluded': True} for i in range(5)],
        *[{'name': f'excluded-bucket-{i}', 'excluded': True} for i in range(5)],
        *[{'name': f'TestBucket{i}', 'excluded': True} for i in range(5)],
        
        # Compliant buckets (20)
        *[{'name': f'compliant-bucket-{i}', 
           'encryption': True, 
           'versioning': True, 
           'tags': {'Environment': 'prod', 'Owner': 'team', 'CostCenter': 'cc123'}} 
          for i in range(20)],
        
        # Missing encryption (15)
        *[{'name': f'no-encryption-{i}', 
           'encryption': False, 
           'versioning': True, 
           'tags': {'Environment': 'prod', 'Owner': 'team', 'CostCenter': 'cc123'}} 
          for i in range(15)],
        
        # Public access (10)
        *[{'name': f'public-bucket-{i}', 
           'encryption': True, 
           'public': True, 
           'versioning': True, 
           'tags': {'Environment': 'prod', 'Owner': 'team', 'CostCenter': 'cc123'}} 
          for i in range(10)],
        
        # Versioning disabled (15)
        *[{'name': f'no-version-{i}', 
           'encryption': True, 
           'versioning': False, 
           'tags': {'Environment': 'prod', 'Owner': 'team', 'CostCenter': 'cc123'}} 
          for i in range(15)],
        
        # Missing tags (10)
        *[{'name': f'no-tags-{i}', 
           'encryption': True, 
           'versioning': True, 
           'tags': {}} 
          for i in range(10)],
        
        # Multiple violations (15)
        *[{'name': f'multiple-issues-{i}', 
           'encryption': False, 
           'public': True, 
           'versioning': False, 
           'tags': {'Environment': 'dev'}} 
          for i in range(15)]
    ]
    
    for config in bucket_configs:
        bucket_name = config['name']
        s3_mock.create_bucket(Bucket=bucket_name)
        
        if not config.get('excluded', False):
            # Set encryption if specified
            if config.get('encryption', False):
                s3_mock.put_bucket_encryption(
                    Bucket=bucket_name,
                    ServerSideEncryptionConfiguration={
                        'Rules': [
                            {
                                'ApplyServerSideEncryptionByDefault': {
                                    'SSEAlgorithm': 'AES256'
                                }
                            }
                        ]
                    }
                )
            
            # Set public access if specified
            if config.get('public', False):
                s3_mock.put_bucket_acl(
                    Bucket=bucket_name,
                    GrantRead='uri="http://acs.amazonaws.com/groups/global/AllUsers"'
                )
            
            # Set versioning if specified
            if config.get('versioning', False):
                s3_mock.put_bucket_versioning(
                    Bucket=bucket_name,
                    VersioningConfiguration={'Status': 'Enabled'}
                )
            
            # Set tags if specified
            if config.get('tags'):
                tag_set = [{'Key': k, 'Value': v} for k, v in config['tags'].items()]
                s3_mock.put_bucket_tagging(
                    Bucket=bucket_name,
                    Tagging={'TagSet': tag_set}
                )
        
        buckets_created.append(config)
    
    return buckets_created

def test_bucket_exclusion(s3_mock, create_test_buckets):
    analyzer = S3SecurityAnalyzer(region='us-east-1')
    analyzer.scan_buckets()
    
    # Check that excluded buckets are properly excluded
    excluded_patterns = ['test', 'temp', 'new', 'excluded']
    for bucket_name in analyzer.excluded_buckets:
        assert any(pattern in bucket_name.lower() for pattern in excluded_patterns)
    
    # Check that non-excluded buckets are analyzed
    for bucket_name in analyzer.analyzed_buckets:
        assert not any(pattern in bucket_name.lower() for pattern in excluded_patterns)

def test_finding_severities(s3_mock, create_test_buckets):
    analyzer = S3SecurityAnalyzer(region='us-east-1')
    analyzer.scan_buckets()
    
    # Check severity assignments
    severity_mapping = {
        'PUBLIC_ACCESS': 'CRITICAL',
        'NO_ENCRYPTION': 'HIGH',
        'VERSIONING_DISABLED': 'MEDIUM',
        'MISSING_TAGS': 'LOW'
    }
    
    for finding in analyzer.findings:
        expected_severity = severity_mapping.get(finding['issue_type'])
        assert finding['severity'] == expected_severity

def test_json_structure(s3_mock, create_test_buckets):
    analyzer = S3SecurityAnalyzer(region='us-east-1')
    analyzer.scan_buckets()
    analyzer.save_json_report()
    
    # Load and validate JSON structure
    with open('s3_security_audit.json', 'r') as f:
        report = json.load(f)
    
    assert 'scan_date' in report
    assert 'region' in report
    assert 'findings' in report
    assert 'compliance_summary' in report
    
    # Validate compliance_summary structure
    summary = report['compliance_summary']
    assert 'compliant_buckets' in summary
    assert 'non_compliant_buckets' in summary
    assert 'frameworks' in summary
    assert 'SOC2' in summary['frameworks']
    assert 'GDPR' in summary['frameworks']
    assert 'passed' in summary['frameworks']['SOC2']
    assert 'failed' in summary['frameworks']['SOC2']
    
    # Validate finding structure
    for finding in report['findings']:
        assert 'bucket_name' in finding
        assert 'bucket_arn' in finding
        assert 'issue_type' in finding
        assert 'severity' in finding
        assert 'compliance_frameworks' in finding
        assert finding['compliance_frameworks'] == ['SOC2', 'GDPR']
        assert 'current_config' in finding
        assert 'required_config' in finding
        assert 'remediation_steps' in finding

def test_compliance_summary_numbers(s3_mock, create_test_buckets):
    analyzer = S3SecurityAnalyzer(region='us-east-1')
    analyzer.scan_buckets()
    
    compliance_summary = analyzer.generate_compliance_summary()
    
    # Count unique non-compliant buckets
    non_compliant_buckets = set(f['bucket_name'] for f in analyzer.findings)
    compliant_buckets = set(analyzer.analyzed_buckets) - non_compliant_buckets
    
    assert compliance_summary['compliant_buckets'] == len(compliant_buckets)
    assert compliance_summary['non_compliant_buckets'] == len(non_compliant_buckets)
    
    # Total should equal analyzed buckets
    assert (compliance_summary['compliant_buckets'] + 
            compliance_summary['non_compliant_buckets']) == len(analyzer.analyzed_buckets)

def test_html_generation(s3_mock, create_test_buckets):
    analyzer = S3SecurityAnalyzer(region='us-east-1')
    analyzer.scan_buckets()
    analyzer.generate_html_report()
    
    # Check HTML file exists
    assert os.path.exists('s3_audit_report.html')
    
    # Check HTML content
    with open('s3_audit_report.html', 'r') as f:
        html_content = f.read()
    
    # Verify required sections
    assert 'S3 Security Audit Report' in html_content
    assert 'Executive Summary' in html_content
    assert 'Severity Distribution' in html_content
    assert 'Framework Compliance' in html_content
    assert 'Detailed Findings' in html_content
    
    # Verify charts are included
    assert 'severityChart' in html_content
    assert 'complianceChart' in html_content
    
    # Verify plotly is included
    assert 'plotly' in html_content.lower()

def test_multiple_violations(s3_mock, create_test_buckets):
    analyzer = S3SecurityAnalyzer(region='us-east-1')
    analyzer.scan_buckets()
    
    # Find buckets with multiple issues
    bucket_issues = {}
    for finding in analyzer.findings:
        bucket_name = finding['bucket_name']
        if bucket_name not in bucket_issues:
            bucket_issues[bucket_name] = []
        bucket_issues[bucket_name].append(finding['issue_type'])
    
    # Check that multiple-issues buckets have multiple findings
    multiple_issue_buckets = [b for b in bucket_issues if 'multiple-issues' in b]
    for bucket in multiple_issue_buckets:
        assert len(bucket_issues[bucket]) > 1

def test_tag_validation(s3_mock, create_test_buckets):
    analyzer = S3SecurityAnalyzer(region='us-east-1')
    analyzer.scan_buckets()
    
    # Find missing tag findings
    tag_findings = [f for f in analyzer.findings if f['issue_type'] == 'MISSING_TAGS']
    
    # Verify that buckets without tags have the finding
    for finding in tag_findings:
        assert 'required_tags' in finding['required_config']
        assert finding['required_config']['required_tags'] == ['Environment', 'Owner', 'CostCenter']

def test_bucket_count(s3_mock, create_test_buckets):
    analyzer = S3SecurityAnalyzer(region='us-east-1')
    analyzer.scan_buckets()
    
    # We created 100 buckets total
    total_buckets = len(analyzer.analyzed_buckets) + len(analyzer.excluded_buckets)
    assert total_buckets >= 100
    
    # 25 buckets should be excluded
    assert len(analyzer.excluded_buckets) >= 25
    
    # At least 75 buckets should be analyzed
    assert len(analyzer.analyzed_buckets) >= 75

def test_cleanup():
    # Clean up generated files
    files_to_remove = ['s3_security_audit.json', 's3_audit_report.html']
    for file in files_to_remove:
        if os.path.exists(file):
            os.remove(file)
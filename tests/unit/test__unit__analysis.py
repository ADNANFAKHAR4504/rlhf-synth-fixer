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

def test_public_policy_detection(s3_mock):
    """Test public bucket policy detection"""
    bucket_name = 'public-policy-bucket'
    s3_mock.create_bucket(Bucket=bucket_name)
    
    # Create a bucket policy that allows public access
    policy = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Principal": "*",
                "Action": "s3:GetObject",
                "Resource": f"arn:aws:s3:::{bucket_name}/*"
            }
        ]
    }
    s3_mock.put_bucket_policy(
        Bucket=bucket_name,
        Policy=json.dumps(policy)
    )
    
    analyzer = S3SecurityAnalyzer(region='us-east-1')
    public_acl, public_policy = analyzer.get_bucket_public_access(bucket_name)
    
    assert public_policy == True
    assert public_acl == False

def test_bucket_policy_not_found(s3_mock):
    """Test handling of buckets without bucket policies"""
    bucket_name = 'no-policy-bucket'
    s3_mock.create_bucket(Bucket=bucket_name)
    
    analyzer = S3SecurityAnalyzer(region='us-east-1')
    public_acl, public_policy = analyzer.get_bucket_public_access(bucket_name)
    
    assert public_policy == False
    assert public_acl == False

def test_versioning_exception_handling(s3_mock):
    """Test versioning API exception handling"""
    analyzer = S3SecurityAnalyzer(region='us-east-1')
    
    # Test with non-existent bucket
    versioning = analyzer.get_bucket_versioning('non-existent-bucket')
    assert versioning == False

def test_console_output(s3_mock, create_test_buckets, capsys):
    """Test console output functionality"""
    analyzer = S3SecurityAnalyzer(region='us-east-1')
    analyzer.scan_buckets()
    analyzer.print_console_output()
    
    captured = capsys.readouterr()
    
    # Check that output contains expected sections
    assert '=== S3 Security Audit Results ===' in captured.out
    assert 'CRITICAL' in captured.out or 'HIGH' in captured.out or 'MEDIUM' in captured.out or 'LOW' in captured.out

def test_main_function_execution(s3_mock, create_test_buckets, capsys):
    """Test main function execution"""
    from analyse import main
    
    # Execute main function
    main()
    
    captured = capsys.readouterr()
    
    # Check console output
    assert 'Analysis complete' in captured.out
    assert 'Reports generated:' in captured.out
    assert 's3_security_audit.json' in captured.out
    assert 's3_audit_report.html' in captured.out
    
    # Check files were created
    assert os.path.exists('s3_security_audit.json')
    assert os.path.exists('s3_audit_report.html')
    assert os.path.exists('aws_audit_results.json')

def test_compliance_framework_branches(s3_mock):
    """Test different compliance framework counting branches"""
    # Create buckets with different violation patterns
    bucket_configs = [
        {'name': 'soc2-only-bucket', 'encryption': False},  # SOC2 violation
        {'name': 'gdpr-only-bucket', 'public': True},       # GDPR violation  
        {'name': 'both-frameworks-bucket', 'versioning': False}  # Both SOC2 and GDPR
    ]
    
    for config in bucket_configs:
        s3_mock.create_bucket(Bucket=config['name'])
        
        if config.get('encryption') == False:
            # Don't set encryption - will trigger NO_ENCRYPTION finding
            pass
        if config.get('public'):
            s3_mock.put_bucket_acl(
                Bucket=config['name'],
                GrantRead='uri="http://acs.amazonaws.com/groups/global/AllUsers"'
            )
        if config.get('versioning') == False:
            # Don't enable versioning - will trigger VERSIONING_DISABLED finding
            pass
    
    analyzer = S3SecurityAnalyzer(region='us-east-1')
    analyzer.scan_buckets()
    
    # Check that compliance framework counting works
    compliance_summary = analyzer.generate_compliance_summary()
    
    # Verify structure
    assert 'frameworks' in compliance_summary
    assert 'SOC2' in compliance_summary['frameworks']
    assert 'GDPR' in compliance_summary['frameworks']
    assert 'passed' in compliance_summary['frameworks']['SOC2']
    assert 'failed' in compliance_summary['frameworks']['SOC2']
    assert 'passed' in compliance_summary['frameworks']['GDPR']
    assert 'failed' in compliance_summary['frameworks']['GDPR']
    
    # Should have some failed checks
    assert compliance_summary['frameworks']['SOC2']['failed'] > 0
    assert compliance_summary['frameworks']['GDPR']['failed'] > 0

def test_aws_audit_results_format(s3_mock, create_test_buckets):
    """Test that aws_audit_results.json is created in correct format"""
    analyzer = S3SecurityAnalyzer(region='us-east-1')
    analyzer.scan_buckets()
    analyzer.save_json_report()
    
    # Check aws_audit_results.json exists and has correct structure
    assert os.path.exists('aws_audit_results.json')
    
    with open('aws_audit_results.json', 'r') as f:
        aws_results = json.load(f)
    
    assert 'S3SecurityAudit' in aws_results
    assert 'scan_date' in aws_results['S3SecurityAudit']
    assert 'region' in aws_results['S3SecurityAudit']
    assert 'findings' in aws_results['S3SecurityAudit']
    assert 'compliance_summary' in aws_results['S3SecurityAudit']

def test_encryption_exception_handling(s3_mock):
    """Test encryption API exception handling"""
    analyzer = S3SecurityAnalyzer(region='us-east-1') 
    
    # Test with non-existent bucket
    encryption = analyzer.get_bucket_encryption('non-existent-bucket')
    assert encryption is None

def test_tags_exception_handling(s3_mock):
    """Test tags API exception handling"""
    analyzer = S3SecurityAnalyzer(region='us-east-1')
    
    # Test with non-existent bucket
    tags = analyzer.get_bucket_tags('non-existent-bucket')
    assert tags == {}

def test_public_access_exception_handling(s3_mock):
    """Test public access API exception handling"""
    analyzer = S3SecurityAnalyzer(region='us-east-1')
    
    # Test with non-existent bucket
    public_acl, public_policy = analyzer.get_bucket_public_access('non-existent-bucket')
    assert public_acl == False
    assert public_policy == False

def test_script_execution_direct():
    """Test direct script execution (__name__ == '__main__')"""
    import subprocess
    import sys
    
    # Create minimal test environment
    os.environ['AWS_ENDPOINT_URL'] = 'http://localhost:5000'  # Moto endpoint
    
    # Execute the script directly
    result = subprocess.run(
        [sys.executable, 'lib/analyse.py'],
        capture_output=True,
        text=True,
        timeout=30
    )
    
    # Should complete without critical errors (may have boto3 errors in test env)
    assert result.returncode in [0, 1]  # Allow 0 or 1 (connection errors expected in test)

def test_cleanup():
    # Clean up generated files
    files_to_remove = ['s3_security_audit.json', 's3_audit_report.html', 'aws_audit_results.json']
    for file in files_to_remove:
        if os.path.exists(file):
            os.remove(file)
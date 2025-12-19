"""
REQUIRED Mock Configuration Setup for AWS Resource Analysis Testing
================================================================

This setup is MANDATORY for running and testing AWS resource analysis tasks.
All new resource analysis implementations must follow this testing framework
to ensure consistent mocking and validation of AWS resources.

Required Setup Steps:
-------------------

1. Environment Configuration (REQUIRED):
   - Ensure boto3 is configured with proper credentials
   - Set required environment variables:
     - AWS_ENDPOINT_URL
     - AWS_DEFAULT_REGION
     - AWS_ACCESS_KEY_ID 
     - AWS_SECRET_ACCESS_KEY

2. Create Mock Resource Setup (REQUIRED):
   a. Create a setup function (e.g., setup_your_resource()):
      - Use boto_client(service_name) to get AWS service client
      - Create your mock resources using boto3 API calls
      - Handle idempotency to avoid duplicate resources
      - Add error handling for existing resources

3. Create Test Function (REQUIRED):
   a. Define test function (e.g., test_your_resource_analysis())
   b. Call your setup function to create mock resources
   c. Call run_analysis_script() to execute analysis
   d. Assert expected results in the JSON output:
      - Check for correct section in results
      - Validate structure and required fields
      - Verify resource counts and metrics
      - Test specific resource attributes

Standard Implementation Template:
------------------------------
```python
def setup_your_resource():
    client = boto_client("your-service")
    # Create mock resources
    # Handle existing resources
    # Add configurations

def test_your_resource_analysis():
    # Setup resources
    setup_your_resource()
    
    # Run analysis
    results = run_analysis_script()
    
    # Validate results
    assert "YourSection" in results
    assert "ExpectedField" in results["YourSection"]
    # Add more specific assertions
```

Reference Implementations:
-----------------------
See existing implementations for detailed examples:
- EBS volumes (setup_ebs_volumes)
- Security groups (setup_security_groups)
- CloudWatch logs (setup_log_group_and_streams)

Note: Without this mock configuration setup, resource analysis tests will not 
function correctly and may produce invalid results.
"""

import json
import os
import subprocess
import sys
import time

import boto3
import pytest


def boto_client(service: str):
    # Set up default values for moto testing if environment vars are not set
    region = os.environ.get("AWS_DEFAULT_REGION") or "us-east-1"
    access_key = os.environ.get("AWS_ACCESS_KEY_ID") or "testing"
    secret_key = os.environ.get("AWS_SECRET_ACCESS_KEY") or "testing"
    endpoint_url = os.environ.get("AWS_ENDPOINT_URL")
    
    if endpoint_url:
        return boto3.client(
            service,
            endpoint_url=endpoint_url,
            region_name=region,
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
        )
    else:
        return boto3.client(
            service,
            region_name=region,
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
        )


def setup_ebs_volumes():
    ec2 = boto_client("ec2")
    # Create 3 unused volumes
    ec2.create_volume(AvailabilityZone="us-east-1a", Size=1)
    ec2.create_volume(AvailabilityZone="us-east-1a", Size=2)
    ec2.create_volume(AvailabilityZone="us-east-1a", Size=3)


def setup_security_groups():
    ec2 = boto_client("ec2")
    # Create two groups, one with public ingress
    # Ensure idempotency by checking if groups exist
    existing_sgs = ec2.describe_security_groups(Filters=[
        {'Name': 'group-name', 'Values': ['private', 'public']}
    ])['SecurityGroups']
    
    private_sg_id = next((sg['GroupId'] for sg in existing_sgs if sg['GroupName'] == 'private'), None)
    public_sg_id = next((sg['GroupId'] for sg in existing_sgs if sg['GroupName'] == 'public'), None)

    if not private_sg_id:
        private_sg_id = ec2.create_security_group(GroupName="private", Description="no public")['GroupId']
    if not public_sg_id:
        public_sg_id = ec2.create_security_group(GroupName="public", Description="has public")['GroupId']

    # Authorize ingress for the public group if not already authorized
    try:
        ec2.authorize_security_group_ingress(
            GroupId=public_sg_id,
            IpPermissions=[
                {'IpProtocol': 'tcp', 'FromPort': 22, 'ToPort': 22, 'IpRanges': [{'CidrIp': '0.0.0.0/0'}]}
            ]
        )
    except ec2.exceptions.ClientError as e:
        if "InvalidPermission.Duplicate" not in str(e):
            raise


def setup_log_group_and_streams():
    logs = boto_client("logs")
    ts = int(time.time() * 1000)

    # Create log group and streams
    try:
        logs.create_log_group(logGroupName="/test-group")
    except logs.exceptions.ResourceAlreadyExistsException:
        pass # Group already exists

    logs.create_log_stream(logGroupName="/test-group", logStreamName="s1")
    logs.create_log_stream(logGroupName="/test-group", logStreamName="s2")

    # Put dummy events to grow storedBytes
    logs.put_log_events(
        logGroupName="/test-group",
        logStreamName="s1",
        logEvents=[{"timestamp": ts, "message": "x" + "x" * 100}]
    )
    logs.put_log_events(
        logGroupName="/test-group",
        logStreamName="s2",
        logEvents=[{"timestamp": ts, "message": "x" + "x" * 300}]
    )


def setup_s3_buckets():
    """
    Create 100+ S3 buckets with various configurations for testing
    S3 security analysis. Includes:
    - 25 excluded buckets (test, temp, new, excluded patterns)
    - 20 compliant buckets (all security measures enabled)
    - 15 buckets missing encryption
    - 10 buckets with public access
    - 15 buckets with versioning disabled
    - 10 buckets with missing tags
    - 15 buckets with multiple violations
    """
    s3 = boto_client("s3")
    
    # Get existing buckets to avoid duplicates
    try:
        existing_buckets = {b['Name'] for b in s3.list_buckets().get('Buckets', [])}
    except Exception:
        existing_buckets = set()
    
    bucket_configs = [
        # Excluded buckets (25) - should not be analyzed
        *[{'name': f'test-bucket-{i}', 'excluded': True} for i in range(5)],
        *[{'name': f'temp-bucket-{i}', 'excluded': True} for i in range(5)],
        *[{'name': f'new-bucket-{i}', 'excluded': True} for i in range(5)],
        *[{'name': f'excluded-bucket-{i}', 'excluded': True} for i in range(5)],
        *[{'name': f'TestBucket{i}', 'excluded': True} for i in range(5)],
        
        # Compliant buckets (20) - all security measures enabled
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
        
        # Skip if bucket already exists
        if bucket_name in existing_buckets:
            continue
        
        try:
            # Create bucket
            s3.create_bucket(Bucket=bucket_name)
            
            if not config.get('excluded', False):
                # Set encryption if specified
                if config.get('encryption', False):
                    try:
                        s3.put_bucket_encryption(
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
                    except Exception:
                        pass
                
                # Set public access if specified
                if config.get('public', False):
                    try:
                        s3.put_bucket_acl(
                            Bucket=bucket_name,
                            GrantRead='uri="http://acs.amazonaws.com/groups/global/AllUsers"'
                        )
                    except Exception:
                        pass
                
                # Set versioning if specified
                if config.get('versioning', False):
                    try:
                        s3.put_bucket_versioning(
                            Bucket=bucket_name,
                            VersioningConfiguration={'Status': 'Enabled'}
                        )
                    except Exception:
                        pass
                
                # Set tags if specified
                if config.get('tags'):
                    try:
                        tag_set = [{'Key': k, 'Value': v} for k, v in config['tags'].items()]
                        s3.put_bucket_tagging(
                            Bucket=bucket_name,
                            Tagging={'TagSet': tag_set}
                        )
                    except Exception:
                        pass
        
        except s3.exceptions.BucketAlreadyOwnedByYou:
            # Bucket already exists, skip
            pass
        except Exception as e:
            # Log error but continue with other buckets
            print(f"Warning: Failed to create bucket {bucket_name}: {e}")


def run_analysis_script():
    """Helper to run the analysis script and return JSON results"""
    # Import analysis module and run directly (works with moto mocking)
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "lib"))
    from analyse import AWSInfrastructureAnalyzer
    from datetime import datetime
    
    json_output = os.path.join(os.path.dirname(__file__), "..", "aws_audit_results.json")
    
    # Remove old JSON file if it exists
    if os.path.exists(json_output):
        os.remove(json_output)
    
    # Set up environment variables for AWS credentials and moto
    os.environ.setdefault("AWS_ACCESS_KEY_ID", "testing")
    os.environ.setdefault("AWS_SECRET_ACCESS_KEY", "testing")  
    os.environ.setdefault("AWS_DEFAULT_REGION", "us-east-1")
    
    try:
        # Create analyzer and run all analyses
        analyzer = AWSInfrastructureAnalyzer()
        
        # Run all analyses
        ebs_results = analyzer.analyze_ebs_volumes()
        sg_results = analyzer.analyze_security_groups()
        logs_results = analyzer.analyze_cloudwatch_logs()
        
        # S3 Security Analysis
        analyzer.scan_buckets()
        compliance_summary = analyzer.generate_compliance_summary()
        s3_results = {
            'S3SecurityAudit': {
                'scan_date': datetime.now().isoformat(),
                'region': analyzer.region,
                'findings': analyzer.findings,
                'compliance_summary': compliance_summary
            }
        }
        
        # Combine all results
        all_results = {}
        all_results.update(ebs_results)
        all_results.update(sg_results)
        all_results.update(logs_results)
        all_results.update(s3_results)
        
        # Save results using the analyzer method
        analyzer.save_json_report(all_results)
        
        # Return the results
        return all_results
        
    except Exception as e:
        print(f"Error running analysis: {e}")
        import traceback
        traceback.print_exc()
        return {}


def test_ebs_volumes_analysis():
    # Set up environment variables for AWS credentials and moto
    os.environ.setdefault("AWS_ACCESS_KEY_ID", "testing")
    os.environ.setdefault("AWS_SECRET_ACCESS_KEY", "testing")  
    os.environ.setdefault("AWS_DEFAULT_REGION", "us-east-1")
    
    # Setup EBS volumes
    setup_ebs_volumes()
    
    results = run_analysis_script()
    
    # Check that UnusedEBSVolumes section exists in JSON
    assert "UnusedEBSVolumes" in results, "UnusedEBSVolumes key missing from JSON"
    
    # Check structure
    ebs_section = results["UnusedEBSVolumes"]
    assert "Count" in ebs_section, "Count key missing from UnusedEBSVolumes"
    assert "TotalSize" in ebs_section, "TotalSize key missing from UnusedEBSVolumes"
    assert "Volumes" in ebs_section, "Volumes key missing from UnusedEBSVolumes"
    
    # Should have 3 volumes (sizes 1, 2, 3)
    assert ebs_section["Count"] == 3, f"Expected 3 volumes, got {ebs_section['Count']}"
    assert ebs_section["TotalSize"] == 6, f"Expected total size of 6 GiB, got {ebs_section['TotalSize']}"
    
    # Validate volume structure
    volumes = ebs_section["Volumes"]
    assert len(volumes) == 3, f"Expected 3 volumes in list, got {len(volumes)}"
    
    # Check that each volume has required fields
    for vol in volumes:
        assert "VolumeId" in vol
        assert "Size" in vol
        assert "VolumeType" in vol
    
    # Check sizes
    sizes = sorted([vol["Size"] for vol in volumes])
    assert sizes == [1, 2, 3], f"Expected sizes [1, 2, 3], got {sizes}"


def test_security_groups_analysis():
    # Set up environment variables for AWS credentials and moto
    os.environ.setdefault("AWS_ACCESS_KEY_ID", "testing")
    os.environ.setdefault("AWS_SECRET_ACCESS_KEY", "testing")  
    os.environ.setdefault("AWS_DEFAULT_REGION", "us-east-1")
    
    # Setup security groups
    setup_security_groups()
    
    results = run_analysis_script()
    
    # Check that PublicSecurityGroups section exists in JSON
    assert "PublicSecurityGroups" in results, "PublicSecurityGroups key missing from JSON"
    
    # Check structure
    sg_section = results["PublicSecurityGroups"]
    assert "Count" in sg_section, "Count key missing from PublicSecurityGroups"
    assert "SecurityGroups" in sg_section, "SecurityGroups key missing from PublicSecurityGroups"
    
    # Should have at least 1 public security group
    assert sg_section["Count"] >= 1, f"Expected at least 1 public security group, got {sg_section['Count']}"
    
    # Validate security group structure
    security_groups = sg_section["SecurityGroups"]
    assert len(security_groups) >= 1, f"Expected at least 1 security group in list, got {len(security_groups)}"
    
    # Find the public security group we created
    public_sg = next((sg for sg in security_groups if sg["GroupName"] == "public"), None)
    assert public_sg is not None, "Public security group not found in results"
    
    # Validate the public security group has required fields
    assert "GroupId" in public_sg
    assert "GroupName" in public_sg
    assert "PublicIngressRules" in public_sg
    
    # Check that it has the public ingress rule we created
    assert len(public_sg["PublicIngressRules"]) >= 1, "Expected at least 1 public ingress rule"
    
    # Verify the rule allows SSH (port 22) from 0.0.0.0/0
    ssh_rule = next((rule for rule in public_sg["PublicIngressRules"] 
                     if rule.get("FromPort") == 22 and rule.get("Source") == "0.0.0.0/0"), None)
    assert ssh_rule is not None, "SSH rule from 0.0.0.0/0 not found"


def test_log_streams_analysis():
    # Set up environment variables for AWS credentials and moto
    os.environ.setdefault("AWS_ACCESS_KEY_ID", "testing")
    os.environ.setdefault("AWS_SECRET_ACCESS_KEY", "testing")  
    os.environ.setdefault("AWS_DEFAULT_REGION", "us-east-1")
    
    # Setup log groups and streams
    setup_log_group_and_streams()
    
    results = run_analysis_script()
    
    # Check that CloudWatchLogMetrics section exists in JSON
    assert "CloudWatchLogMetrics" in results, "CloudWatchLogMetrics key missing from JSON"
    
    # Check structure
    log_section = results["CloudWatchLogMetrics"]
    assert "TotalLogStreams" in log_section, "TotalLogStreams key missing from CloudWatchLogMetrics"
    assert "TotalSize" in log_section, "TotalSize key missing from CloudWatchLogMetrics"
    assert "AverageStreamSize" in log_section, "AverageStreamSize key missing from CloudWatchLogMetrics"
    assert "LogGroupMetrics" in log_section, "LogGroupMetrics key missing from CloudWatchLogMetrics"
    
    # Should have at least 2 log streams (s1 and s2)
    assert log_section["TotalLogStreams"] >= 2, f"Expected at least 2 log streams, got {log_section['TotalLogStreams']}"
    
    # Find the /test-group in the log group metrics
    log_groups = log_section["LogGroupMetrics"]
    test_group = next((lg for lg in log_groups if lg["LogGroupName"] == "/test-group"), None)
    assert test_group is not None, "/test-group not found in log group metrics"
    
    # Validate the test group has required fields
    assert "StreamCount" in test_group
    assert "TotalSize" in test_group
    assert "AverageStreamSize" in test_group
    
    # Should have 2 streams in /test-group
    assert test_group["StreamCount"] == 2, f"Expected 2 streams in /test-group, got {test_group['StreamCount']}"
    
    # Check average size is approximately correct (~200 bytes)
    # We created s1 with ~101 bytes and s2 with ~301 bytes, so average should be ~201 bytes
    avg = test_group["AverageStreamSize"]
    assert 150 <= avg <= 250, f"Expected average stream size between 150-250 bytes, got {avg}"


def test_s3_security_analysis():
    """
    Test S3 security analysis functionality.
    Creates 100+ mock S3 buckets with various security configurations
    and validates that the analysis correctly identifies security issues.
    """
    # Set up environment variables for AWS credentials and moto
    os.environ.setdefault("AWS_ACCESS_KEY_ID", "testing")
    os.environ.setdefault("AWS_SECRET_ACCESS_KEY", "testing")  
    os.environ.setdefault("AWS_DEFAULT_REGION", "us-east-1")
    
    # Setup S3 buckets with various configurations
    setup_s3_buckets()
    
    # Run the analysis script
    results = run_analysis_script()
    
    # Check that S3SecurityAudit section exists in JSON
    assert "S3SecurityAudit" in results, "S3SecurityAudit key missing from JSON output"
    
    # Check top-level structure
    s3_section = results["S3SecurityAudit"]
    assert "scan_date" in s3_section, "scan_date key missing from S3SecurityAudit"
    assert "region" in s3_section, "region key missing from S3SecurityAudit"
    assert "findings" in s3_section, "findings key missing from S3SecurityAudit"
    assert "compliance_summary" in s3_section, "compliance_summary key missing from S3SecurityAudit"
    
    # Validate compliance_summary structure
    summary = s3_section["compliance_summary"]
    assert "compliant_buckets" in summary, "compliant_buckets key missing from compliance_summary"
    assert "non_compliant_buckets" in summary, "non_compliant_buckets key missing from compliance_summary"
    assert "frameworks" in summary, "frameworks key missing from compliance_summary"
    
    # Validate framework structure
    frameworks = summary["frameworks"]
    assert "SOC2" in frameworks, "SOC2 framework missing from compliance_summary"
    assert "GDPR" in frameworks, "GDPR framework missing from compliance_summary"
    
    for framework in ["SOC2", "GDPR"]:
        assert "passed" in frameworks[framework], f"passed key missing from {framework}"
        assert "failed" in frameworks[framework], f"failed key missing from {framework}"
    
    # Validate findings structure
    findings = s3_section["findings"]
    assert isinstance(findings, list), "findings should be a list"
    
    # We expect findings since we created non-compliant buckets
    assert len(findings) > 0, "Expected findings for non-compliant buckets"
    
    # Check that each finding has required fields
    for finding in findings:
        assert "bucket_name" in finding, "bucket_name missing from finding"
        assert "bucket_arn" in finding, "bucket_arn missing from finding"
        assert "issue_type" in finding, "issue_type missing from finding"
        assert "severity" in finding, "severity missing from finding"
        assert "compliance_frameworks" in finding, "compliance_frameworks missing from finding"
        assert "current_config" in finding, "current_config missing from finding"
        assert "required_config" in finding, "required_config missing from finding"
        assert "remediation_steps" in finding, "remediation_steps missing from finding"
        
        # Validate compliance_frameworks always includes SOC2 and GDPR
        assert finding["compliance_frameworks"] == ["SOC2", "GDPR"], \
            f"Expected ['SOC2', 'GDPR'], got {finding['compliance_frameworks']}"
        
        # Validate severity values
        assert finding["severity"] in ["CRITICAL", "HIGH", "MEDIUM", "LOW"], \
            f"Invalid severity: {finding['severity']}"
    
    # Validate severity mapping
    severity_mapping = {
        'PUBLIC_ACCESS': 'CRITICAL',
        'NO_ENCRYPTION': 'HIGH',
        'VERSIONING_DISABLED': 'MEDIUM',
        'MISSING_TAGS': 'LOW'
    }
    
    for finding in findings:
        expected_severity = severity_mapping.get(finding['issue_type'])
        if expected_severity:
            assert finding['severity'] == expected_severity, \
                f"Expected severity {expected_severity} for {finding['issue_type']}, got {finding['severity']}"
    
    # Validate bucket exclusions
    # Buckets with 'test', 'temp', 'new', 'excluded' should not appear in findings
    excluded_patterns = ['test', 'temp', 'new', 'excluded']
    for finding in findings:
        bucket_name = finding['bucket_name'].lower()
        for pattern in excluded_patterns:
            assert pattern not in bucket_name, \
                f"Bucket '{finding['bucket_name']}' should have been excluded (contains '{pattern}')"
    
    # Count findings by issue type
    issue_counts = {}
    for finding in findings:
        issue_type = finding['issue_type']
        issue_counts[issue_type] = issue_counts.get(issue_type, 0) + 1
    
    # We created specific non-compliant buckets, so we should have:
    # - At least some NO_ENCRYPTION findings (15+ buckets without encryption)
    # - At least some PUBLIC_ACCESS findings (10+ public buckets)
    # - At least some VERSIONING_DISABLED findings (15+ buckets without versioning)
    # - At least some MISSING_TAGS findings (10+ buckets with missing tags)
    
    # Note: Some buckets have multiple issues, so counts may vary
    # We just check that each issue type is detected
    expected_issues = ['NO_ENCRYPTION', 'PUBLIC_ACCESS', 'VERSIONING_DISABLED', 'MISSING_TAGS']
    for issue in expected_issues:
        assert issue in issue_counts, f"Expected to find {issue} issues in findings"
        assert issue_counts[issue] > 0, f"Expected at least one {issue} finding"
    
    # Validate compliance summary numbers
    # Total analyzed buckets should be compliant + non_compliant
    total_analyzed = summary['compliant_buckets'] + summary['non_compliant_buckets']
    
    # We created 100 buckets, 25 should be excluded, so ~75 should be analyzed
    assert total_analyzed >= 70, f"Expected at least 70 analyzed buckets, got {total_analyzed}"
    
    # Should have some non-compliant buckets (we created 65 non-compliant ones)
    assert summary['non_compliant_buckets'] > 0, "Expected at least some non-compliant buckets"
    
    # Should have some compliant buckets (we created 20 compliant ones)
    assert summary['compliant_buckets'] > 0, "Expected at least some compliant buckets"
    
    print(f"\n✅ S3 Security Analysis Test Passed!")
    print(f"   - Analyzed {total_analyzed} buckets")
    print(f"   - Compliant: {summary['compliant_buckets']}")
    print(f"   - Non-compliant: {summary['non_compliant_buckets']}")
    print(f"   - Total findings: {len(findings)}")
    print(f"   - Issue types found: {list(issue_counts.keys())}")
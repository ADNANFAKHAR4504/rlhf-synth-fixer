# IDEAL RESPONSE

This is the complete implementation of the AWS Infrastructure Analysis tool.

## analyse.py

```python
# analyze_aws_infrastructure.py
import json
import boto3
import os
import re
from datetime import datetime
from collections import defaultdict
from jinja2 import Template

class AWSInfrastructureAnalyzer:
    def __init__(self, region='us-east-1'):
        self.region = region
        # Support AWS_ENDPOINT_URL for Moto testing
        endpoint_url = os.environ.get('AWS_ENDPOINT_URL')
        
        # Create clients with or without endpoint_url
        if endpoint_url:
            self.s3_client = boto3.client('s3', region_name=region, endpoint_url=endpoint_url)
            self.ec2_client = boto3.client('ec2', region_name=region, endpoint_url=endpoint_url)
            self.logs_client = boto3.client('logs', region_name=region, endpoint_url=endpoint_url)
        else:
            self.s3_client = boto3.client('s3', region_name=region)
            self.ec2_client = boto3.client('ec2', region_name=region)
            self.logs_client = boto3.client('logs', region_name=region)
        self.findings = []
        self.excluded_buckets = []
        self.analyzed_buckets = []
        
    def is_excluded_bucket(self, bucket_name):
        excluded_patterns = ['test', 'temp', 'new', 'excluded']
        for pattern in excluded_patterns:
            if pattern.lower() in bucket_name.lower():
                return True
        return False
    
    def get_bucket_encryption(self, bucket_name):
        try:
            response = self.s3_client.get_bucket_encryption(Bucket=bucket_name)
            return response.get('ServerSideEncryptionConfiguration', {})
        except Exception:
            return None
    
    def get_bucket_public_access(self, bucket_name):
        try:
            # Check bucket ACL
            acl = self.s3_client.get_bucket_acl(Bucket=bucket_name)
            public_acl = False
            for grant in acl.get('Grants', []):
                grantee = grant.get('Grantee', {})
                if grantee.get('Type') == 'Group' and grantee.get('URI', '').endswith('AllUsers'):
                    public_acl = True
                    break
            
            # Check bucket policy
            public_policy = False
            try:
                policy = self.s3_client.get_bucket_policy(Bucket=bucket_name)
                policy_json = json.loads(policy['Policy'])
                for statement in policy_json.get('Statement', []):
                    if statement.get('Effect') == 'Allow' and statement.get('Principal') == '*':
                        public_policy = True
                        break
            except Exception:
                pass
            
            return public_acl, public_policy
        except Exception:
            return False, False
    
    def get_bucket_versioning(self, bucket_name):
        try:
            response = self.s3_client.get_bucket_versioning(Bucket=bucket_name)
            return response.get('Status') == 'Enabled'
        except Exception:
            return False
    
    def get_bucket_tags(self, bucket_name):
        try:
            response = self.s3_client.get_bucket_tagging(Bucket=bucket_name)
            tags = {tag['Key']: tag['Value'] for tag in response.get('TagSet', [])}
            return tags
        except Exception:
            return {}
    
    def analyze_bucket(self, bucket_name, bucket_arn):
        findings = []
        
        # Check encryption
        encryption = self.get_bucket_encryption(bucket_name)
        if not encryption:
            findings.append({
                'bucket_name': bucket_name,
                'bucket_arn': bucket_arn,
                'issue_type': 'NO_ENCRYPTION',
                'severity': 'HIGH',
                'compliance_frameworks': ['SOC2', 'GDPR'],
                'current_config': {'encryption': 'None'},
                'required_config': {'encryption': 'AES256 or aws:kms'},
                'remediation_steps': 'Enable server-side encryption using S3 default encryption settings'
            })
        
        # Check public access
        public_acl, public_policy = self.get_bucket_public_access(bucket_name)
        if public_acl or public_policy:
            findings.append({
                'bucket_name': bucket_name,
                'bucket_arn': bucket_arn,
                'issue_type': 'PUBLIC_ACCESS',
                'severity': 'CRITICAL',
                'compliance_frameworks': ['SOC2', 'GDPR'],
                'current_config': {
                    'public_acl': public_acl,
                    'public_policy': public_policy
                },
                'required_config': {
                    'public_acl': False,
                    'public_policy': False
                },
                'remediation_steps': 'Remove public access permissions from bucket ACL and policy'
            })
        
        # Check versioning
        versioning_enabled = self.get_bucket_versioning(bucket_name)
        if not versioning_enabled:
            findings.append({
                'bucket_name': bucket_name,
                'bucket_arn': bucket_arn,
                'issue_type': 'VERSIONING_DISABLED',
                'severity': 'MEDIUM',
                'compliance_frameworks': ['SOC2', 'GDPR'],
                'current_config': {'versioning': 'Disabled'},
                'required_config': {'versioning': 'Enabled'},
                'remediation_steps': 'Enable bucket versioning for data protection and recovery'
            })
        
        # Check tags
        tags = self.get_bucket_tags(bucket_name)
        required_tags = ['Environment', 'Owner', 'CostCenter']
        missing_tags = [tag for tag in required_tags if tag not in tags]
        
        if missing_tags:
            findings.append({
                'bucket_name': bucket_name,
                'bucket_arn': bucket_arn,
                'issue_type': 'MISSING_TAGS',
                'severity': 'LOW',
                'compliance_frameworks': ['SOC2', 'GDPR'],
                'current_config': {'tags': list(tags.keys())},
                'required_config': {'required_tags': required_tags},
                'remediation_steps': f'Add missing tags: {", ".join(missing_tags)}'
            })
        
        return findings
    
    def analyze_ebs_volumes(self):
        """Analyze unused EBS volumes"""
        try:
            response = self.ec2_client.describe_volumes()
            unused_volumes = []
            total_size = 0
            
            for volume in response.get('Volumes', []):
                # Check if volume is attached
                if volume['State'] == 'available':  # Unattached volumes
                    volume_info = {
                        'VolumeId': volume['VolumeId'],
                        'Size': volume['Size'],
                        'VolumeType': volume.get('VolumeType', 'standard')
                    }
                    unused_volumes.append(volume_info)
                    total_size += volume['Size']
            
            return {
                'UnusedEBSVolumes': {
                    'Count': len(unused_volumes),
                    'TotalSize': total_size,
                    'Volumes': unused_volumes
                }
            }
        except Exception as e:
            print(f"Error analyzing EBS volumes: {e}")
            return {
                'UnusedEBSVolumes': {
                    'Count': 0,
                    'TotalSize': 0,
                    'Volumes': []
                }
            }
    
    def analyze_security_groups(self):
        """Analyze public security groups"""
        try:
            response = self.ec2_client.describe_security_groups()
            public_sgs = []
            
            for sg in response.get('SecurityGroups', []):
                public_rules = []
                
                # Check ingress rules for public access
                for rule in sg.get('IpPermissions', []):
                    for ip_range in rule.get('IpRanges', []):
                        if ip_range.get('CidrIp') == '0.0.0.0/0':
                            public_rules.append({
                                'IpProtocol': rule.get('IpProtocol'),
                                'FromPort': rule.get('FromPort'),
                                'ToPort': rule.get('ToPort'),
                                'Source': '0.0.0.0/0'
                            })
                
                if public_rules:
                    sg_info = {
                        'GroupId': sg['GroupId'],
                        'GroupName': sg['GroupName'],
                        'PublicIngressRules': public_rules
                    }
                    public_sgs.append(sg_info)
            
            return {
                'PublicSecurityGroups': {
                    'Count': len(public_sgs),
                    'SecurityGroups': public_sgs
                }
            }
        except Exception as e:
            print(f"Error analyzing security groups: {e}")
            return {
                'PublicSecurityGroups': {
                    'Count': 0,
                    'SecurityGroups': []
                }
            }
    
    def analyze_cloudwatch_logs(self):
        """Analyze CloudWatch log streams"""
        try:
            log_groups_response = self.logs_client.describe_log_groups()
            log_groups = log_groups_response.get('logGroups', [])
            
            total_streams = 0
            total_size = 0
            log_group_metrics = []
            
            for log_group in log_groups:
                log_group_name = log_group['logGroupName']
                
                try:
                    streams_response = self.logs_client.describe_log_streams(
                        logGroupName=log_group_name
                    )
                    streams = streams_response.get('logStreams', [])
                    
                    group_stream_count = len(streams)
                    group_total_size = sum(stream.get('storedBytes', 0) for stream in streams)
                    group_avg_size = group_total_size / max(group_stream_count, 1)
                    
                    log_group_metrics.append({
                        'LogGroupName': log_group_name,
                        'StreamCount': group_stream_count,
                        'TotalSize': group_total_size,
                        'AverageStreamSize': int(group_avg_size)
                    })
                    
                    total_streams += group_stream_count
                    total_size += group_total_size
                    
                except Exception as e:
                    print(f"Error processing log group {log_group_name}: {e}")
                    continue
            
            avg_stream_size = total_size / max(total_streams, 1)
            
            return {
                'CloudWatchLogMetrics': {
                    'TotalLogStreams': total_streams,
                    'TotalSize': total_size,
                    'AverageStreamSize': int(avg_stream_size),
                    'LogGroupMetrics': log_group_metrics
                }
            }
        except Exception as e:
            print(f"Error analyzing CloudWatch logs: {e}")
            return {
                'CloudWatchLogMetrics': {
                    'TotalLogStreams': 0,
                    'TotalSize': 0,
                    'AverageStreamSize': 0,
                    'LogGroupMetrics': []
                }
            }
    
    def scan_buckets(self):
        response = self.s3_client.list_buckets()
        buckets = response.get('Buckets', [])
        
        for bucket in buckets:
            bucket_name = bucket['Name']
            
            if self.is_excluded_bucket(bucket_name):
                self.excluded_buckets.append(bucket_name)
                continue
            
            bucket_arn = f'arn:aws:s3:::{bucket_name}'
            self.analyzed_buckets.append(bucket_name)
            
            bucket_findings = self.analyze_bucket(bucket_name, bucket_arn)
            self.findings.extend(bucket_findings)
    
    def generate_compliance_summary(self):
        compliant_buckets = set(self.analyzed_buckets)
        non_compliant_buckets = set()
        
        soc2_passed = 0
        soc2_failed = 0
        gdpr_passed = 0
        gdpr_failed = 0
        
        for finding in self.findings:
            non_compliant_buckets.add(finding['bucket_name'])
            if 'SOC2' in finding['compliance_frameworks']:
                soc2_failed += 1
            if 'GDPR' in finding['compliance_frameworks']:
                gdpr_failed += 1
        
        compliant_buckets = compliant_buckets - non_compliant_buckets
        
        # Count passed checks (buckets without findings)
        soc2_passed = len(compliant_buckets) * 4  # 4 checks per bucket
        gdpr_passed = len(compliant_buckets) * 4
        
        return {
            'compliant_buckets': len(compliant_buckets),
            'non_compliant_buckets': len(non_compliant_buckets),
            'frameworks': {
                'SOC2': {
                    'passed': soc2_passed,
                    'failed': soc2_failed
                },
                'GDPR': {
                    'passed': gdpr_passed,
                    'failed': gdpr_failed
                }
            }
        }
    
    def print_console_output(self):
        severity_groups = defaultdict(lambda: defaultdict(list))
        
        for finding in self.findings:
            severity = finding['severity']
            issue_type = finding['issue_type']
            bucket_name = finding['bucket_name']
            severity_groups[severity][issue_type].append(bucket_name)
        
        severities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']
        
        print("\n=== S3 Security Audit Results ===\n")
        
        for severity in severities:
            if severity in severity_groups:
                print(f"{severity}")
                print("-" * len(severity))
                for issue_type, buckets in severity_groups[severity].items():
                    print(f"  {issue_type}:")
                    for bucket in buckets:
                        print(f"    - {bucket}")
                print()
    
    def save_json_report(self, all_results=None):
        """Save comprehensive analysis results to JSON files"""
        # Backward compatibility for unit tests that call this without arguments
        if all_results is None:
            compliance_summary = self.generate_compliance_summary()
            s3_report = {
                'scan_date': datetime.now().isoformat(),
                'region': self.region,
                'findings': self.findings,
                'compliance_summary': compliance_summary
            }
            
            # Save to s3_security_audit.json (for direct use)
            with open('s3_security_audit.json', 'w') as f:
                json.dump(s3_report, f, indent=2)
            
            # Also save to aws_audit_results.json in the format expected by test framework
            all_results = {'S3SecurityAudit': s3_report}
        
        # Save to s3_security_audit.json (for direct use - S3 only)
        if 'S3SecurityAudit' in all_results:
            with open('s3_security_audit.json', 'w') as f:
                json.dump(all_results['S3SecurityAudit'], f, indent=2)
        
        # Save complete results to aws_audit_results.json (expected by test framework)
        with open('aws_audit_results.json', 'w') as f:
            json.dump(all_results, f, indent=2)
    
    def generate_html_report(self):
        compliance_summary = self.generate_compliance_summary()
        
        severity_counts = defaultdict(int)
        issue_type_counts = defaultdict(int)
        
        for finding in self.findings:
            severity_counts[finding['severity']] += 1
            issue_type_counts[finding['issue_type']] += 1
        
        template_str = '''<!DOCTYPE html>
<html>
<head>
    <title>S3 Security Audit Report</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background-color: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1, h2 {
            color: #333;
        }
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        .summary-card {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #007bff;
        }
        .critical {
            border-left-color: #dc3545;
        }
        .high {
            border-left-color: #fd7e14;
        }
        .medium {
            border-left-color: #ffc107;
        }
        .low {
            border-left-color: #28a745;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        th {
            background-color: #f8f9fa;
            font-weight: bold;
        }
        .severity-badge {
            padding: 4px 8px;
            border-radius: 4px;
            color: white;
            font-size: 12px;
            font-weight: bold;
        }
        .severity-critical {
            background-color: #dc3545;
        }
        .severity-high {
            background-color: #fd7e14;
        }
        .severity-medium {
            background-color: #ffc107;
            color: #333;
        }
        .severity-low {
            background-color: #28a745;
        }
        .chart {
            margin: 20px 0;
            height: 400px;
        }
    </style>
    <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
</head>
<body>
    <div class="container">
        <h1>S3 Security Audit Report</h1>
        <p>Generated on: {{ scan_date }}</p>
        
        <h2>Executive Summary</h2>
        <div class="summary-grid">
            <div class="summary-card">
                <h3>Total Buckets Analyzed</h3>
                <p style="font-size: 24px;">{{ total_analyzed }}</p>
            </div>
            <div class="summary-card">
                <h3>Compliant Buckets</h3>
                <p style="font-size: 24px; color: green;">{{ compliance_summary.compliant_buckets }}</p>
            </div>
            <div class="summary-card">
                <h3>Non-Compliant Buckets</h3>
                <p style="font-size: 24px; color: red;">{{ compliance_summary.non_compliant_buckets }}</p>
            </div>
        </div>
        
        <h2>Severity Distribution</h2>
        <div id="severityChart" class="chart"></div>
        
        <h2>Framework Compliance</h2>
        <div id="complianceChart" class="chart"></div>
        
        <h2>Detailed Findings</h2>
        <table>
            <thead>
                <tr>
                    <th>Bucket Name</th>
                    <th>Issue Type</th>
                    <th>Severity</th>
                    <th>Remediation Steps</th>
                </tr>
            </thead>
            <tbody>
                {% for finding in findings %}
                <tr>
                    <td>{{ finding.bucket_name }}</td>
                    <td>{{ finding.issue_type }}</td>
                    <td>
                        <span class="severity-badge severity-{{ finding.severity.lower() }}">
                            {{ finding.severity }}
                        </span>
                    </td>
                    <td>{{ finding.remediation_steps }}</td>
                </tr>
                {% endfor %}
            </tbody>
        </table>
    </div>
    
    <script>
        // Severity Distribution Pie Chart
        var severityData = [{
            values: [{{ severity_counts.CRITICAL }}, {{ severity_counts.HIGH }}, {{ severity_counts.MEDIUM }}, {{ severity_counts.LOW }}],
            labels: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
            type: 'pie',
            marker: {
                colors: ['#dc3545', '#fd7e14', '#ffc107', '#28a745']
            }
        }];
        
        var severityLayout = {
            title: 'Findings by Severity',
            height: 400
        };
        
        Plotly.newPlot('severityChart', severityData, severityLayout);
        
        // Compliance Chart
        var complianceData = [{
            x: ['SOC2 Passed', 'SOC2 Failed', 'GDPR Passed', 'GDPR Failed'],
            y: [{{ compliance_summary.frameworks.SOC2.passed }}, 
                {{ compliance_summary.frameworks.SOC2.failed }},
                {{ compliance_summary.frameworks.GDPR.passed }},
                {{ compliance_summary.frameworks.GDPR.failed }}],
            type: 'bar',
            marker: {
                color: ['#28a745', '#dc3545', '#28a745', '#dc3545']
            }
        }];
        
        var complianceLayout = {
            title: 'Framework Compliance Status',
            height: 400
        };
        
        Plotly.newPlot('complianceChart', complianceData, complianceLayout);
    </script>
</body>
</html>'''
        
        template = Template(template_str)
        html_content = template.render(
            scan_date=datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            total_analyzed=len(self.analyzed_buckets),
            compliance_summary=compliance_summary,
            findings=self.findings,
            severity_counts=severity_counts
        )
        
        with open('s3_audit_report.html', 'w') as f:
            f.write(html_content)

def main():
    analyzer = AWSInfrastructureAnalyzer()
    
    # Run all analyses
    print("Running AWS Infrastructure Analysis...")
    
    # EBS Volume Analysis
    print("Analyzing EBS volumes...")
    ebs_results = analyzer.analyze_ebs_volumes()
    
    # Security Group Analysis
    print("Analyzing security groups...")
    sg_results = analyzer.analyze_security_groups()
    
    # CloudWatch Logs Analysis
    print("Analyzing CloudWatch logs...")
    logs_results = analyzer.analyze_cloudwatch_logs()
    
    # S3 Security Analysis
    print("Analyzing S3 security...")
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
    
    # Generate outputs
    analyzer.print_console_output()
    analyzer.save_json_report(all_results)
    analyzer.generate_html_report()
    
    print(f"\nAnalysis complete!")
    print(f"- EBS volumes analyzed: {ebs_results['UnusedEBSVolumes']['Count']}")
    print(f"- Security groups with public access: {sg_results['PublicSecurityGroups']['Count']}")
    print(f"- CloudWatch log streams: {logs_results['CloudWatchLogMetrics']['TotalLogStreams']}")
    print(f"- S3 buckets analyzed: {len(analyzer.analyzed_buckets)}")
    print(f"- S3 buckets excluded: {len(analyzer.excluded_buckets)}")
    print("\nReports generated:")
    print("  - aws_audit_results.json")
    print("  - s3_security_audit.json")
    print("  - s3_audit_report.html")

# Backward compatibility for unit tests
S3SecurityAnalyzer = AWSInfrastructureAnalyzer

if __name__ == '__main__':
    main()
```

# Zero-Trust Security Architecture Deployment Runbook

## Overview
This runbook provides step-by-step instructions for deploying the zero-trust security architecture across AWS accounts.

## Prerequisites
1. AWS Organizations configured with all 50 accounts
2. Terraform >= 1.0 installed
3. AWS CLI configured with appropriate credentials
4. Central security and logging accounts identified
5. KMS keys created in each account for encryption

## Pre-Deployment Checklist
- [ ] Review and update `terraform.tfvars` with correct values
- [ ] Verify AWS Organizations structure
- [ ] Confirm network CIDR allocations don't overlap
- [ ] Validate compliance requirements are met
- [ ] Backup existing configurations
- [ ] Schedule maintenance window

## Deployment Sequence

### Phase 1: Pilot Deployment (3 Accounts)

#### Step 1: Initialize Terraform
```bash
cd environments/pilot
terraform init
terraform workspace new pilot

Step 2: Plan Infrastructure
terraform plan -out=pilot.tfplan
# Review the plan carefully
Step 3: Deploy Core Infrastructure
# Deploy in this order:
terraform apply -target=module.transit_gateway pilot.tfplan
terraform apply -target=module.central_logging pilot.tfplan
terraform apply -target=module.network_infrastructure pilot.tfplan
Step 4: Deploy Security Components
terraform apply -target=module.security_monitoring pilot.tfplan
terraform apply -target=module.access_control pilot.tfplan
Step 5: Deploy Automation
terraform apply -target=module.security_automation pilot.tfplan
Step 6: Apply Service Control Policies
terraform apply -target=aws_organizations_policy.zero_trust_scp pilot.tfplan
# Attach to pilot OUs only
Phase 2: Validation (1-2 Weeks)
Security Validation
Network Isolation Testing
Verify VPC segmentation
Test transit gateway routing
Validate Network Firewall rules
Access Control Testing
Test Session Manager connectivity
Verify MFA enforcement
Validate IP restrictions
Test time-based access controls
Monitoring Validation
Confirm GuardDuty findings are generated
Verify Security Hub aggregation
Test CloudTrail logging
Validate VPC Flow Logs
Automation Testing
Trigger test security events
Verify Lambda execution
Confirm SNS notifications
Test auto-remediation actions
Phase 3: Production Rollout
Step 1: Update Configuration
cd environments/production
# Update terraform.tfvars for all 50 accounts
Step 2: Phased Deployment
Deploy in groups of 10 accounts:

# Group 1 (Accounts 1-10)
terraform apply -target=module.network_infrastructure["account-1"] 
# ... repeat for accounts 2-10

# Group 2 (Accounts 11-20)
# ... continue pattern
Step 3: Monitor Each Phase
After each group:

Check CloudWatch dashboards
Review Security Hub findings
Verify cost metrics
Confirm compliance posture
Component Details
Transit Gateway
Purpose: Central network hub for inter-VPC communication
Key Settings:
Default route tables disabled (explicit routing only)
DNS support enabled
Multicast disabled (not needed for banking)
Network Firewall
Purpose: Deep packet inspection and threat prevention
Rules:
Stateful inspection for all traffic
IPS/IDS rules for known threats
Domain filtering for malicious sites
Custom rules for banking protocols
GuardDuty
Purpose: Continuous threat detection
Features Enabled:
S3 protection
EKS audit logs
Malware protection
15-minute publishing frequency
Security Hub
Purpose: Centralized security posture management
Standards:
CIS AWS Foundations Benchmark
PCI-DSS (for payment processing)
Custom banking controls
CloudTrail
Purpose: Comprehensive audit logging
Configuration:
Multi-region trail
All read/write events
S3 and Lambda data events
Insights enabled
Session Manager
Purpose: Secure instance access without bastion hosts
Features:
Session logging to S3 and CloudWatch
Encryption in transit
Idle timeout (20 minutes)
Maximum session duration (60 minutes)
Troubleshooting
Common Issues
Transit Gateway Attachment Failures
Verify subnet has available IPs
Check route table associations
Ensure DNS resolution is enabled
GuardDuty Not Detecting Threats
Verify detector is enabled
Check S3 bucket policies
Ensure VPC Flow Logs are active
Session Manager Connection Issues
Verify SSM agent is installed and running
Check instance IAM role
Validate network connectivity to SSM endpoints
Lambda Timeout Errors
Increase timeout value
Check VPC configuration
Verify security group rules
Rollback Procedures
If issues occur during deployment:

Immediate Rollback
terraform destroy -target=[problematic_resource]
Restore Previous State
terraform state pull > backup.tfstate
# Manually edit if needed
terraform state push backup.tfstate
Emergency Access
Use break-glass role if normal access fails
Document all emergency access usage
Review and revoke after incident
Post-Deployment Tasks
Documentation Updates
Update network diagrams
Document security controls
Create operational runbooks
Training
Train security team on new tools
Educate developers on Session Manager
Review incident response procedures
Compliance Validation
Run compliance reports
Schedule penetration testing
Prepare audit documentation
Monitoring and Maintenance
Daily Tasks
Review Security Hub findings
Check GuardDuty alerts
Monitor failed login attempts
Verify backup completion
Weekly Tasks
Analyze VPC Flow Logs
Review IAM access reports
Update security rules if needed
Cost optimization review
Monthly Tasks
Rotate credentials
Update security patches
Review and tune alerts
Compliance reporting
Success Criteria
The deployment is considered successful when:

 All VPCs are properly segmented
 Transit Gateway routing is functional
 Security monitoring is active in all accounts
 Automated incident response is working
 Compliance scans pass without critical findings
 Cost is within budget parameters
 Performance meets SLA requirements

## Testing Strategy

### testing-strategy.md
```markdown
# Zero-Trust Architecture Testing Strategy

## Overview
This document outlines the comprehensive testing approach for validating the zero-trust security architecture implementation.

## Testing Phases

### Phase 1: Unit Testing

#### Infrastructure Components
1. **VPC Configuration Tests**
   ```bash
   # Test VPC CIDR allocation
   aws ec2 describe-vpcs --filters "Name=tag:Project,Values=financial-zero-trust"
   
   # Verify subnet segmentation
   aws ec2 describe-subnets --filters "Name=vpc-id,Values=<vpc-id>"
   
   # Validate route tables
   aws ec2 describe-route-tables
Security Group Tests
# Script to validate security group rules
import boto3

def test_security_groups():
    ec2 = boto3.client('ec2')
    
    # Get all security groups
    sgs = ec2.describe_security_groups(
        Filters=[{'Name': 'tag:Project', 'Values': ['financial-zero-trust']}]
    )
    
    for sg in sgs['SecurityGroups']:
        # Verify no unrestricted ingress
        for rule in sg['IpPermissions']:
            assert '0.0.0.0/0' not in [r['CidrIp'] for r in rule.get('IpRanges', [])]
Phase 2: Integration Testing
Network Connectivity Tests
Transit Gateway Routing
# Test cross-VPC connectivity
aws ec2 describe-transit-gateway-attachments

# Verify routing between accounts
ping -c 4 <instance-in-different-vpc>
Network Firewall Testing
# Test firewall rules
import requests

def test_blocked_domains():
    blocked_domains = ['malicious-site.com', 'phishing-example.com']
    
    for domain in blocked_domains:
        try:
            response = requests.get(f'http://{domain}', timeout=5)
            assert False, f"Domain {domain} should be blocked"
        except:
            pass  # Expected behavior
Security Monitoring Tests
GuardDuty Detection
# Generate test findings
aws guardduty create-sample-findings \
  --detector-id <detector-id> \
  --finding-types "Recon:EC2/PortProbeUnprotectedPort"

# Verify findings appear
aws guardduty get-findings --detector-id <detector-id>
Security Hub Aggregation
# Test Security Hub findings aggregation
import boto3
from datetime import datetime, timedelta

def test_security_hub_aggregation():
    securityhub = boto3.client('securityhub')
    
    # Get findings from last hour
    response = securityhub.get_findings(
        Filters={
            'CreatedAt': [{
                'Start': (datetime.now() - timedelta(hours=1)).isoformat(),
                'End': datetime.now().isoformat()
            }]
        }
    )
    
    assert len(response['Findings']) > 0
Phase 3: Security Testing
Penetration Testing Checklist
Network Security
 Port scanning from external sources
 Attempt lateral movement between VPCs
 Test Network Firewall bypass techniques
 Validate encryption in transit
Access Control
 Attempt access without MFA
 Test from non-whitelisted IPs
 Try access outside allowed time windows
 Validate session timeout enforcement
Incident Response
# Test automated response
def test_incident_response():
    # Simulate security event
    create_test_security_finding()
    
    # Wait for Lambda execution
    time.sleep(30)
    
    # Verify remediation action taken
    assert instance_is_stopped(test_instance_id)
    assert security_group_modified(test_sg_id)
Phase 4: Compliance Testing
Audit Log Validation
# Verify CloudTrail is logging all events
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=EventName,AttributeValue=RunInstances \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S)

# Check log integrity
aws cloudtrail validate-logs \
  --trail-arn <trail-arn> \
  --start-time <start-time>
Compliance Scanning
# Run compliance checks
import boto3

def run_compliance_checks():
    config = boto3.client('config')
    
    # Trigger compliance evaluation
    response = config.start_config_rules_evaluation(
        ConfigRuleNames=[
            'required-tags',
            'encrypted-volumes',
            'restricted-ssh',
            'multi-region-cloudtrail-enabled'
        ]
    )
    
    # Wait and check results
    time.sleep(60)
    
    results = config.describe_compliance_by_config_rule()
    for rule in results['ComplianceByConfigRules']:
        assert rule['Compliance']['ComplianceType'] == 'COMPLIANT'
Phase 5: Performance Testing
Load Testing
# K6 load test configuration
import http from 'k6/http';
import { check } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 100 },
    { duration: '5m', target: 100 },
    { duration: '2m', target: 200 },
    { duration: '5m', target: 200 },
    { duration: '2m', target: 0 },
  ],
};

export default function() {
  // Test Session Manager connections
  let response = http.get('https://ssm.region.amazonaws.com/');
  
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
}
Monitoring Performance
# Check CloudWatch metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Duration \
  --dimensions Name=FunctionName,Value=zero-trust-incident-response \
  --statistics Average \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300
Test Scenarios
Scenario 1: Compromised EC2 Instance
Simulate cryptocurrency mining detection
Verify GuardDuty generates finding
Confirm Lambda triggers
Validate instance is isolated/stopped
Check SNS notification sent
Scenario 2: Unauthorized Access Attempt
Attempt login from non-whitelisted IP
Verify access is denied
Check CloudTrail logs event
Confirm alert is generated
Scenario 3: Data Exfiltration Attempt
Generate large outbound traffic
Verify VPC Flow Logs capture
Check Network Firewall blocks suspicious domains
Validate alerts are triggered
Scenario 4: Compliance Violation
Create non-compliant resource (unencrypted S3 bucket)
Verify Security Hub finding
Check auto-remediation enables encryption
Validate compliance status updates
Success Metrics
Security Metrics
Mean Time to Detect (MTTD): < 5 minutes
Mean Time to Respond (MTTR): < 15 minutes
False Positive Rate: < 5%
Security Finding Resolution: > 95% automated
Performance Metrics
API Response Time: < 500ms (p99)
Lambda Execution Time: < 30 seconds
Log Delivery Delay: < 5 minutes
Alert Notification Time: < 2 minutes
Compliance Metrics
Audit Log Completeness: 100%
Compliance Score: > 95%
Policy Violations: 0 critical, < 5 high
Encryption Coverage: 100%
Test Data Management
Test Account Setup
# Create test resources
./scripts/create-test-environment.sh

# Populate with test data
./scripts/generate-test-traffic.sh
Cleanup Procedures
# Remove test resources
./scripts/cleanup-test-environment.sh

# Verify cleanup
aws ec2 describe-instances --filters "Name=tag:TestResource,Values=true"
Reporting
Test Report Template
## Zero-Trust Architecture Test Report

**Date**: [DATE]
**Environment**: [PILOT/PRODUCTION]
**Test Phase**: [PHASE]

### Executive Summary
[Summary of test results]

### Test Results
| Test Category | Pass | Fail | Skip | Coverage |
|---------------|------|------|------|----------|
| Network       | X    | X    | X    | X%       |
| Security      | X    | X    | X    | X%       |
| Compliance    | X    | X    | X    | X%       |
| Performance   | X    | X    | X    | X%       |

### Critical Issues
[List any critical findings]

### Recommendations
[Improvement suggestions]

### Sign-off
- Security Team: ___________
- Compliance Team: _________
- Operations Team: _________
Continuous Testing
Automated Daily Tests
# GitHub Actions workflow
name: Daily Security Tests
on:
  schedule:
    - cron: '0 2 * * *'  # 2 AM UTC daily

jobs:
  security-tests:
    runs-on: ubuntu-latest
    steps:
      - name: Run Security Tests
        run: |
          python tests/security_validation.py
          python tests/compliance_checks.py
          
      - name: Generate Report
        run: |
          python scripts/generate_test_report.py
          
      - name: Notify on Failure
        if: failure()
        run: |
          aws sns publish --topic-arn $SNS_TOPIC --message "Daily security tests failed"
Chaos Engineering
# Chaos testing scenarios
import boto3
import random

def chaos_test():
    """Run chaos engineering tests"""
    
    scenarios = [
        stop_random_instance,
        modify_security_group,
        delete_vpc_endpoint,
        trigger_ddos_simulation
    ]
    
    # Run random scenario
    scenario = random.choice(scenarios)
    scenario()
    
    # Verify system recovers
    assert system_is_healthy()
Test Documentation
All test results should be documented and stored:

Test execution logs: S3 bucket with versioning
Test reports: Confluence/SharePoint
Metrics dashboards: CloudWatch/Grafana
Issue tracking: JIRA/ServiceNow

This comprehensive zero-trust security architecture provides:

1. **Complete Infrastructure**: All components needed for banking-grade security
2. **Modular Design**: Easy to deploy and scale from pilot to production
3. **Security Best Practices**: MFA, least privilege, encryption, monitoring
4. **Automation**: Incident response and remediation
5. **Compliance Ready**: Audit trails and controls for banking regulations
6. **Detailed Documentation**: Runbook and testing strategy for operations

The architecture ensures no implicit trust, continuous verification, and comprehensive monitoring across all 50 AWS accounts while meeting stringent banking compliance requirements.
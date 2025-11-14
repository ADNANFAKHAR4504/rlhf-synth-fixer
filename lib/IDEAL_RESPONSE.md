# Amazon EKS Cluster Infrastructure - IDEAL RESPONSE

This document mirrors every file under `lib/` in Markdown form so reviewers can inspect the exact source without leaving this document.

## Architecture Overview
- Production-grade Amazon EKS cluster with managed node group and full VPC networking
- Dedicated AWS KMS key for control-plane secret encryption and comprehensive logging
- Private subnets for workloads, public subnets plus single NAT for egress, and S3 gateway endpoint for cost savings
- Parameterized cluster version, instance type, and scaling values so environments stay configurable

## Source Files
Each subsection below embeds the corresponding file verbatim with an appropriate fenced code block.

### `lib/MODEL_FAILURES.md`
```markdown
# Model Response Failures Analysis

This document analyzes the gaps between the MODEL_RESPONSE implementation and the IDEAL_RESPONSE, identifying areas where the initial model generation could be improved to produce more production-ready, enterprise-grade infrastructure code.

## Overview

The MODEL_RESPONSE provides a functional multi-region disaster recovery infrastructure that meets the core requirements. However, several enhancements and best practices were missing that would elevate it to truly production-ready, enterprise-grade code. This analysis focuses on what the model should have generated initially to demonstrate deeper AWS expertise and operational maturity.

## Summary of Issues

- **0 Critical Failures** (deployment blockers, security vulnerabilities)
- **3 High-Impact Gaps** (missing production best practices)
- **5 Medium-Impact Gaps** (operational excellence improvements)
- **4 Low-Impact Gaps** (documentation and guidance enhancements)

**Training Value**: Medium-High. The template is functionally correct but lacks the depth of operational wisdom and production-hardening that distinguishes senior-level infrastructure engineering.

---

## High-Impact Gaps

### 1. Limited Operational Guidance

**Impact Level**: High

**MODEL_RESPONSE Issue**:
The MODEL_RESPONSE provides basic deployment instructions but lacks comprehensive operational runbooks, disaster recovery testing procedures, and production readiness guidance. The deployment section is minimal:

```markdown
### Deploy Primary Region (us-east-1)

```bash
aws cloudformation create-stack \
  --stack-name trading-platform-dr-primary \
  --template-body file://lib/trading-platform-dr-primary.json \
  --parameters ... \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```
```

**IDEAL_RESPONSE Enhancement**:
Comprehensive operational documentation including:
- Detailed post-deployment validation steps with specific AWS CLI commands
- Disaster recovery testing procedures with step-by-step failover simulation
- RTO/RPO analysis with actual timing expectations
- Incident response runbooks for common failure scenarios
- Scaling operations procedures
- Cost monitoring and optimization guidance

**Example Enhancement**:
```markdown
### Post-Deployment Validation

After deployment, verify each component:

1. **VPC and Network Connectivity**:
```bash
aws ec2 describe-vpcs --filters "Name=tag:Name,Values=trading-vpc-${ENVIRONMENT_SUFFIX}"
```

2. **Load Balancer Health**:
```bash
aws elbv2 describe-target-health --target-group-arn ${TG_ARN}
```

[Additional 4-6 validation steps with expected outputs]
```

**Root Cause**: The model generated functional code but didn't anticipate the operational context where infrastructure engineers need comprehensive guidance for deployment, testing, and troubleshooting.

**Training Recommendation**: Train on real-world operational documentation patterns, disaster recovery testing procedures, and production readiness checklists.

---

### 2. Cost Optimization Analysis Missing

**Impact Level**: High

**MODEL_RESPONSE Issue**:
While the template uses cost-effective defaults (single NAT Gateway, t3.large instances, on-demand DynamoDB), there's no cost analysis, optimization strategies, or guidance on cost vs. reliability tradeoffs. The model mentions cost optimization briefly:

```markdown
## Cost Optimization

- Use t3.large instances instead of larger instance types
- RDS Multi-AZ for HA within region
- DynamoDB on-demand billing
- Single NAT Gateway for cost savings (can add second for full HA)
```

**IDEAL_RESPONSE Enhancement**:
Detailed cost analysis with actual numbers:

```markdown
### Current Monthly Cost Estimate (Primary Region)

**Compute**:
- EC2 (2× t3.large, 24/7): ~$120
- ALB (always on + LCU): ~$25
- NAT Gateway + data transfer: ~$35-100

**Database**:
- RDS MySQL (db.r6g.large Multi-AZ): ~$350
- RDS storage (100 GB): ~$23

**NoSQL**:
- DynamoDB (on-demand, estimated): ~$50-200

**Total: $678-1,218/month** (primary region)

### Optimization Recommendations

1. **Right-Size Instances**: Monitor actual usage, consider t3.medium ($60/month savings)
2. **Reserved Instances**: 1-year RDS RI provides 30% savings (~$100/month)
3. **Auto Scaling Schedules**: Scale down during off-hours
4. **Standby Region Optimization**: Keep secondary stopped until needed (50-70% savings)
```

**Root Cause**: The model focused on functionality without considering the business context where infrastructure cost is a critical decision factor. Senior engineers provide cost-benefit analysis to help stakeholders make informed decisions.

**AWS Documentation Reference**: 
- AWS Pricing Calculator: https://calculator.aws/
- AWS Cost Explorer Best Practices: https://docs.aws.amazon.com/cost-management/

**Training Recommendation**: Train on cost estimation patterns, Reserved Instance strategies, and cost optimization techniques specific to disaster recovery architectures.

---

### 3. Security Hardening Guidance Incomplete

**Impact Level**: High

**MODEL_RESPONSE Issue**:
The template implements basic security (Secrets Manager, encryption, security groups) but doesn't provide guidance on advanced security hardening like VPC Flow Logs, network firewall, secrets rotation, enhanced IAM policies with conditions, or compliance considerations.

The security section mentions:
```markdown
## Security and Access Control

- IAM roles for EC2 instances and services
- IAM policies following least-privilege principle
- Security Groups restricting traffic between components
- Encryption at rest and in transit where applicable
```

**IDEAL_RESPONSE Enhancement**:
Comprehensive security hardening section:

```markdown
### Security Hardening

#### Enhanced IAM Policies

Replace wildcard ARNs with specific resource ARNs and add condition keys:

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["dynamodb:GetItem", "dynamodb:PutItem"],
    "Resource": "arn:aws:dynamodb:us-east-1:123456789012:table/trading-sessions-prod-dr",
    "Condition": {
      "StringEquals": {
        "aws:RequestedRegion": ["us-east-1", "us-west-2"]
      }
    }
  }]
}
```

#### Network Security Enhancements

**VPC Flow Logs** (for traffic analysis):
```bash
aws ec2 create-flow-logs \
  --resource-type VPC \
  --resource-ids ${VPC_ID} \
  --traffic-type ALL \
  --log-destination-type cloud-watch-logs
```

#### Secrets Rotation

Enable automatic rotation:
```bash
aws secretsmanager rotate-secret \
  --secret-id trading-db-password-${ENVIRONMENT_SUFFIX} \
  --rotation-rules AutomaticallyAfterDays=30
```

#### Compliance Considerations

- Implement audit logging via CloudTrail
- Use AWS Config for compliance monitoring
- Consider AWS Security Hub for centralized security findings
```

**Root Cause**: The model implemented baseline security but didn't demonstrate deep security expertise expected from senior cloud architects. Production systems require defense-in-depth strategies beyond basic encryption and IAM roles.

**Security Impact**: While not vulnerable, the infrastructure lacks the hardening and monitoring that would detect and prevent sophisticated attacks or insider threats.

**Training Recommendation**: Train on AWS security best practices, compliance frameworks (PCI DSS, HIPAA, SOC 2), and defense-in-depth strategies for production systems.

---

## Medium-Impact Gaps

### 4. Monitoring Dashboard and Observability Missing

**Impact Level**: Medium

**MODEL_RESPONSE Issue**:
The template includes three CloudWatch alarms (ALB unhealthy targets, RDS CPU, DynamoDB throttling) but doesn't provide a CloudWatch dashboard configuration or discuss broader observability strategies (logs, tracing, metrics).

**IDEAL_RESPONSE Enhancement**:
```markdown
### CloudWatch Dashboard

Create custom dashboard for operational visibility:

```bash
aws cloudwatch put-dashboard \
  --dashboard-name "trading-platform-dr-${ENVIRONMENT_SUFFIX}" \
  --dashboard-body file://dashboard-config.json
```

Dashboard includes:
- ALB request count and latency metrics
- EC2 CPU and memory utilization
- RDS connections and IOPS
- DynamoDB consumed capacity
- Auto Scaling Group metrics
- Route53 health check status
- CloudWatch alarm states

### Enhanced Observability

1. **AWS X-Ray**: Distributed tracing for application performance analysis
2. **CloudWatch Logs Insights**: Advanced log querying and analysis
3. **CloudWatch Synthetics**: Canary testing for continuous validation
4. **Third-Party APM**: Consider Datadog or New Relic for advanced monitoring
```

**Root Cause**: The model generated monitoring components but didn't think holistically about operational observability - the ability for operators to understand system behavior and troubleshoot issues quickly.

**Operational Impact**: Operations teams struggle to diagnose issues without unified dashboards and comprehensive observability tools.

**Training Recommendation**: Train on CloudWatch dashboard patterns, observability best practices, and how monitoring fits into broader operational excellence.

---

### 5. Backup and Recovery Procedures Incomplete

**Impact Level**: Medium

**MODEL_RESPONSE Issue**:
The template enables RDS automated backups (7-day retention) and DynamoDB point-in-time recovery, but doesn't provide guidance on manual backup procedures, cross-region snapshot copies, or restore testing.

MODEL_RESPONSE mentions backups briefly:
```markdown
- RDS with automated snapshots for DR
```

**IDEAL_RESPONSE Enhancement**:
```markdown
### Backup and Recovery Procedures

**Automated Backups**:
- RDS: Daily automated backups with 7-day retention
- DynamoDB: Point-in-time recovery up to 35 days
- S3: Versioning enabled with lifecycle policies

**Manual Backup Procedures**:

```bash
# Create RDS snapshot before major changes
aws rds create-db-snapshot \
  --db-instance-identifier trading-db-${ENVIRONMENT_SUFFIX} \
  --db-snapshot-identifier trading-db-manual-$(date +%Y%m%d-%H%M%S)

# Copy snapshot to secondary region for DR
aws rds copy-db-snapshot \
  --source-db-snapshot-identifier ${SNAPSHOT_ARN} \
  --target-db-snapshot-identifier trading-db-${ENVIRONMENT_SUFFIX}-dr \
  --source-region us-east-1 \
  --region us-west-2

# DynamoDB on-demand backup
aws dynamodb create-backup \
  --table-name trading-sessions-${ENVIRONMENT_SUFFIX} \
  --backup-name trading-sessions-manual-$(date +%Y%m%d)

# Export DynamoDB to S3
aws dynamodb export-table-to-point-in-time \
  --table-arn arn:aws:dynamodb:us-east-1:${ACCOUNT_ID}:table/trading-sessions-${ENVIRONMENT_SUFFIX} \
  --s3-bucket trading-data-${ENVIRONMENT_SUFFIX}-${ACCOUNT_ID} \
  --s3-prefix dynamodb-backups/
```

**Recovery Testing**:
- Schedule quarterly DR drills
- Document restore procedures and RTO
- Test cross-region snapshot restore
```

**Root Cause**: The model enabled backup features but didn't provide the operational procedures that turn backup capabilities into actual recoverability.

**Business Impact**: Backups are useless if teams don't know how to restore or haven't tested recovery procedures. Many organizations discover backup failures during actual disasters.

**Training Recommendation**: Train on backup strategies, disaster recovery testing methodologies, and the difference between backup capabilities and tested recovery procedures.

---

### 6. Infrastructure as Code Best Practices Gap

**Impact Level**: Medium

**MODEL_RESPONSE Issue**:
The template is a single 900-line CloudFormation JSON file. While functional, there's no discussion of IaC best practices like nested stacks, template modularization, parameter validation patterns, or migration paths to more maintainable tools.

**IDEAL_RESPONSE Enhancement**:
```markdown
### Infrastructure as Code Improvements

1. **Nested Stacks**: Break down into logical components
   - Network stack (VPC, subnets, NAT)
   - Compute stack (ALB, ASG, Launch Template)
   - Database stack (RDS, DynamoDB)
   - Monitoring stack (alarms, dashboards)

2. **StackSets**: Deploy identical infrastructure across regions
   - Single template definition
   - Parallel deployment to multiple regions
   - Consistent configuration

3. **CloudFormation Macros**: Template transformation and reusability
   - Custom resource type creation
   - Template preprocessing

4. **Testing**: Implement automated testing
   - cfn-nag for security/compliance scanning
   - taskcat for multi-region/multi-account testing
   - cfn-lint for template validation

5. **CDK Migration**: Consider AWS CDK for improved developer experience
   - Type-safe infrastructure code
   - Familiar programming languages (TypeScript, Python)
   - Better IDE support and refactoring capabilities
```

**Root Cause**: The model generated a working template but didn't consider maintainability, team collaboration, or long-term evolution of the codebase.

**Maintainability Impact**: Large monolithic templates become difficult to understand, modify, and test as infrastructure grows.

**Training Recommendation**: Train on CloudFormation best practices, nested stacks patterns, and modern IaC approaches (CDK, Terraform modules).

---

### 7. Advanced AWS Services Not Considered

**Impact Level**: Medium

**MODEL_RESPONSE Issue**:
The template uses core AWS services (VPC, EC2, RDS, Route53) but doesn't mention or recommend advanced services that could improve performance, security, or operational efficiency:
- AWS Global Accelerator (faster failover than Route53)
- AWS Transit Gateway (multi-region VPC connectivity)
- AWS CloudFront (CDN for static assets)
- AWS WAF (application firewall)
- AWS Network Firewall (network-layer security)

**IDEAL_RESPONSE Enhancement**:
```markdown
### Advanced AWS Services for Enhanced DR

1. **AWS Global Accelerator**: 
   - Faster failover than Route53 health checks (instant vs. 90 seconds)
   - Anycast IP addresses for consistent endpoints
   - DDoS protection via AWS Shield

2. **AWS Transit Gateway**: 
   - Centralized VPC connectivity across regions
   - Simplified network architecture
   - Better for multiple region deployment

3. **AWS CloudFront**:
   - CDN for static assets reduces origin load
   - Edge caching improves global performance
   - AWS WAF integration for DDoS protection

4. **AWS WAF**:
   - Application-layer firewall
   - Protects against OWASP Top 10 vulnerabilities
   - Rate limiting and geographic restrictions

5. **AWS Network Firewall**:
   - Advanced network protection
   - Deep packet inspection
   - Centralized firewall management
```

**Root Cause**: The model provided a functional solution with common services but didn't demonstrate awareness of AWS's full portfolio or when advanced services add value.

**Performance Impact**: Using Route53 health checks results in 90-120 second failover time. Global Accelerator provides sub-second failover.

**AWS Documentation Reference**:
- Global Accelerator FAQs: https://aws.amazon.com/global-accelerator/faqs/
- Multi-Region Best Practices: https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/

**Training Recommendation**: Train on AWS advanced networking services, when to use Global Accelerator vs Route53, and multi-region architecture patterns.

---

### 8. No Discussion of Testing Strategy

**Impact Level**: Medium

**MODEL_RESPONSE Issue**:
The MODEL_RESPONSE doesn't mention testing approaches for CloudFormation templates. No unit tests, integration tests, or validation strategies are discussed.

**IDEAL_RESPONSE Enhancement**:
```markdown
## Testing Framework

### Unit Tests

Comprehensive test suite with 77 tests covering:
- Template structure and syntax (6 tests)
- Parameter validation (6 tests)
- VPC and network resources (6 tests)
- Security groups (4 tests)
- Compute resources (6 tests)
- Database resources (4 tests)
- S3 and replication (5 tests)
- IAM roles and permissions (4 tests)
- Route53 and health checks (2 tests)
- Monitoring and alarms (5 tests)
- Resource naming (1 test)
- Outputs validation (8 tests)
- Circular dependencies (1 test)
- Security best practices (4 tests)
- High availability (4 tests)
- Disaster recovery (5 tests)
- Cost optimization (3 tests)
- Template resource count (2 tests)

**Run Tests**:
```bash
npm test -- --testPathPattern=trading-platform-dr-stack.unit.test.ts --coverage
```

### Integration Testing Approach

Integration tests verify:
1. Stack deployment succeeds
2. Health checks pass
3. ALB responds to requests
4. DynamoDB replication works
5. S3 objects replicate
6. Failover routing functions
7. Alarms trigger correctly
```

**Root Cause**: The model generated infrastructure code without considering how that code should be validated and tested, which is essential for production deployments.

**Quality Impact**: Untested infrastructure leads to production failures, longer troubleshooting times, and fear of making changes.

**Training Recommendation**: Train on infrastructure testing methodologies, CloudFormation validation tools (cfn-nag, cfn-lint), and integration testing patterns.

---

## Low-Impact Gaps

### 9. RTO/RPO Analysis Lacks Quantitative Detail

**Impact Level**: Low

**MODEL_RESPONSE Issue**:
The model mentions RTO/RPO targets in architecture highlights:
```markdown
- **Disaster Recovery**: RTO < 5 minutes, RPO < 1 minute with DynamoDB Global Tables
```

But doesn't provide detailed breakdown of timing for each component or how to optimize.

**IDEAL_RESPONSE Enhancement**:
```markdown
### Recovery Time Objective (RTO) Analysis

**Component Breakdown**:
- Health check detection: 90 seconds (3 failures × 30s interval)
- DNS propagation: 60-300 seconds (depends on TTL settings)
- Secondary instance warmup: 0-300 seconds (pre-warmed vs cold start)
- **Total RTO: 2.5-10 minutes**

**Optimization Strategies**:
- Reduce health check interval to 10 seconds (fast interval option): Saves 60 seconds
- Pre-warm secondary with running instances: Saves 300 seconds
- Use shorter DNS TTL (60 seconds): Faster propagation
- Implement application-level health checks: Faster detection

**Optimized RTO: 70-190 seconds (1.2-3.2 minutes)**

### Recovery Point Objective (RPO) Analysis

**By Service**:
- DynamoDB Global Tables: < 1 second (active-active)
- S3 Cross-Region Replication (RTC): < 15 minutes
- RDS Automated Snapshots: 5 minutes to 24 hours (depending on last backup)

**Critical Data RPO**: < 1 minute (DynamoDB session data)

**Meeting Requirements**: ✅ Meets sub-5-minute RTO and sub-1-minute RPO for critical data
```

**Root Cause**: The model stated objectives but didn't analyze timing or provide optimization guidance.

**Training Recommendation**: Train on DR metrics calculation, component-level timing analysis, and RTO/RPO optimization techniques.

---

### 10. Prerequisite Steps Not Clearly Documented

**Impact Level**: Low

**MODEL_RESPONSE Issue**:
The deployment section mentions prerequisites but doesn't provide detailed step-by-step instructions with proper error handling:

```markdown
### Prerequisites

1. Create a Secrets Manager secret for the database password:
```bash
aws secretsmanager create-secret \
  --name trading-db-password-${ENVIRONMENT_SUFFIX} \
  --secret-string '{"password":"YourSecurePassword123!"}'
```

**IDEAL_RESPONSE Enhancement**:
```markdown
### Prerequisites

#### 1. Create Database Password Secret

```bash
# Generate strong random password
DB_PASSWORD=$(openssl rand -base64 32)

# Create secret with proper tags
aws secretsmanager create-secret \
  --name "trading-db-password-${ENVIRONMENT_SUFFIX}" \
  --description "RDS MySQL password for trading platform DR" \
  --secret-string "{\"password\":\"${DB_PASSWORD}\"}" \
  --region us-east-1 \
  --tags Key=Environment,Value=${ENVIRONMENT_SUFFIX} Key=Application,Value=TradingPlatform

# Verify secret created
aws secretsmanager describe-secret \
  --secret-id "trading-db-password-${ENVIRONMENT_SUFFIX}" \
  --region us-east-1

# Expected output: Secret ARN and creation date
```

**Security Best Practice**: Never use static passwords like "YourSecurePassword123!" even in examples. Generate random passwords or use AWS Secrets Manager's random password generation feature.
```

**Root Cause**: The model provided example commands but didn't think about user experience, error handling, or security implications of example passwords.

**Training Recommendation**: Train on documentation best practices, security implications of example code, and user experience considerations.

---

### 11. No Tagging Strategy Discussion

**Impact Level**: Low

**MODEL_RESPONSE Issue**:
The template includes basic tags (Name, Environment) but doesn't discuss tagging strategies for cost allocation, governance, automation, or compliance.

**IDEAL_RESPONSE Enhancement**:
```markdown
### Tagging Strategy

**Required Tags (on all resources)**:
- `Name`: Resource-specific identifier with EnvironmentSuffix
- `Environment`: Deployment environment (production, staging, dev)
- `Application`: "TradingPlatform"
- `DisasterRecovery`: "enabled" or "disabled"
- `CostCenter`: For cost allocation (e.g., "infrastructure", "trading-ops")
- `ManagedBy`: "CloudFormation" or stack name
- `Owner`: Team or individual responsible
- `BackupPolicy`: "daily", "weekly", or "none"

**Optional Tags**:
- `Compliance`: PCI-DSS, HIPAA, SOC2 etc.
- `DataClassification`: public, internal, confidential, restricted
- `Project`: For project-specific cost tracking
- `Department`: For departmental chargeback

**Automation**:
- Use tags for automated backup selection
- Use tags for automated shutdown/startup schedules
- Use tags for security group auditing
- Use tags for Cost Explorer filtering

**AWS Config Rules**:
- Enforce required tags on new resources
- Alert on untagged resources
- Validate tag value formats
```

**Root Cause**: The model included basic tags but didn't consider enterprise tagging requirements for governance, cost management, and compliance.

**Training Recommendation**: Train on AWS tagging best practices, cost allocation strategies, and governance frameworks.

---

### 12. Secondary Region Deployment Not Fully Specified

**Impact Level**: Low

**MODEL_RESPONSE Issue**:
The model mentions deploying to secondary region but doesn't provide detailed instructions:

```markdown
### Deploy Secondary Region (us-west-2)

Deploy a similar stack in us-west-2 with:
- Same template but different environment suffix or use conditions
- Route53 record with SECONDARY failover policy
- Read-only RDS replica or snapshot-based restoration strategy
```

**IDEAL_RESPONSE Enhancement**:
```markdown
### Secondary Region Deployment (us-west-2)

**Option 1: Full Active-Passive (Recommended)**

Deploy the same template with modifications:

```bash
# Create separate parameter file for secondary
cat > secondary-params.json <<EOF
[
  {"ParameterKey": "EnvironmentSuffix", "ParameterValue": "${ENVIRONMENT_SUFFIX}-secondary"},
  {"ParameterKey": "InstanceType", "ParameterValue": "t3.small"},
  {"ParameterKey": "MinSize", "ParameterValue": "0"},
  {"ParameterKey": "DesiredCapacity", "ParameterValue": "0"}
]
EOF

# Deploy to us-west-2
aws cloudformation create-stack \
  --stack-name TradingPlatformDRSecondary \
  --template-body file://lib/trading-platform-dr-primary.json \
  --parameters file://secondary-params.json \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-west-2

# Update Route53 record to SECONDARY after deployment
aws route53 change-resource-record-sets \
  --hosted-zone-id ${HOSTED_ZONE_ID} \
  --change-batch file://route53-secondary-change.json
```

**Option 2: Standby with RDS Read Replica**

Use AWS DMS or native replication for near-real-time RDS replication to secondary region.

**Cost Comparison**:
- Full active-passive: ~$1,200/month (both regions)
- Standby with read replica: ~$900/month
- Standby stopped (DynamoDB replication only): ~$150/month
```

**Root Cause**: The model mentioned secondary region deployment but didn't provide actionable implementation details or discuss tradeoffs.

**Training Recommendation**: Train on multi-region deployment patterns, standby vs active-active architectures, and cost-performance tradeoffs.

---

## Training Value Assessment

### Overall Training Quality: Medium-High

**Why This Task Is Valuable**:
1. **Real-World Complexity**: Multi-region DR is a common enterprise requirement with many nuances
2. **Multiple Services**: Demonstrates integration of VPC, compute, database, storage, DNS, monitoring
3. **Operational Context**: Exposes gaps in operational thinking (runbooks, cost analysis, testing)
4. **Security Depth**: Shows difference between baseline security and defense-in-depth
5. **Production Readiness**: Highlights gap between "works" and "production-ready"

### Key Training Gaps Identified

1. **Operational Excellence**: Model needs more training on runbooks, monitoring, incident response
2. **Cost Awareness**: Lack of cost analysis and optimization strategies
3. **Security Depth**: Baseline security implemented but advanced hardening missing
4. **Testing Mindset**: No consideration of how infrastructure should be tested
5. **Documentation Quality**: Functional docs but lacks depth for operational teams
6. **Enterprise Context**: Missing enterprise concerns like tagging, compliance, governance

### Recommended Training Data Enhancements

1. **Real Runbooks**: Incorporate actual incident response and operational procedures
2. **Cost Models**: Include cost estimation and optimization analysis
3. **DR Testing Procedures**: Add disaster recovery drill documentation
4. **Security Frameworks**: Train on compliance requirements (PCI-DSS, HIPAA, SOC2)
5. **Production War Stories**: Include lessons learned from production incidents
6. **Enterprise Patterns**: Incorporate large organization infrastructure patterns

---

## Conclusion

The MODEL_RESPONSE provides a functionally correct multi-region disaster recovery solution that meets all core technical requirements. The CloudFormation template would successfully deploy and operate. However, it lacks the operational depth, security hardening, cost analysis, and production readiness guidance that distinguishes senior-level infrastructure engineering.

**What Works Well**:
- ✅ Complete feature coverage (multi-AZ, multi-region, auto failover)
- ✅ Correct AWS service usage and configuration
- ✅ Proper parameter validation and resource naming
- ✅ Basic security and encryption
- ✅ Clean, well-structured template

**What Needs Improvement**:
- ⚠️ Operational guidance (runbooks, DR testing, troubleshooting)
- ⚠️ Cost analysis and optimization strategies
- ⚠️ Advanced security hardening and compliance
- ⚠️ Testing and validation approaches
- ⚠️ Comprehensive monitoring and observability
- ⚠️ Backup/recovery procedures and testing

**Training Impact**: Adding these elements to training data will help the model generate not just functional code, but production-ready infrastructure with the operational wisdom and enterprise context that experienced cloud architects provide.
```

### `lib/MODEL_RESPONSE.md`
```markdown
# Multi-Region Disaster Recovery CloudFormation Implementation

I'll create a comprehensive CloudFormation JSON template for multi-region disaster recovery infrastructure for your trading platform. This will deploy infrastructure across two regions with automated failover capabilities.

## Architecture Overview

This solution implements an active-passive disaster recovery architecture with:
- Primary region (us-east-1) with full infrastructure
- Secondary region (us-west-2) with standby infrastructure
- Route53 health checks and failover routing
- Cross-region data replication (DynamoDB Global Tables, S3 CRR)
- RDS with automated snapshots for DR
- CloudWatch monitoring and alarms

## File: lib/trading-platform-dr-primary.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Multi-Region Disaster Recovery - Trading Platform Primary Region (us-east-1)",
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Unique suffix for resource naming to support multiple deployments",
      "AllowedPattern": "^[a-z0-9-]{3,20}$",
      "ConstraintDescription": "Must be 3-20 characters, lowercase alphanumeric with hyphens"
    },
    "SecondaryRegion": {
      "Type": "String",
      "Description": "Secondary AWS region for disaster recovery",
      "Default": "us-west-2",
      "AllowedValues": ["us-west-2", "eu-west-1", "ap-southeast-1"]
    },
    "InstanceType": {
      "Type": "String",
      "Description": "EC2 instance type for trading application",
      "Default": "t3.large",
      "AllowedValues": ["t3.medium", "t3.large", "t3.xlarge", "c5.large", "c5.xlarge"]
    },
    "DBInstanceClass": {
      "Type": "String",
      "Description": "RDS instance class",
      "Default": "db.r6g.large",
      "AllowedValues": ["db.t3.medium", "db.r6g.large", "db.r6g.xlarge"]
    },
    "MinSize": {
      "Type": "Number",
      "Description": "Minimum number of instances in Auto Scaling Group",
      "Default": 2,
      "MinValue": 2
    },
    "MaxSize": {
      "Type": "Number",
      "Description": "Maximum number of instances in Auto Scaling Group",
      "Default": 6,
      "MinValue": 2
    },
    "DesiredCapacity": {
      "Type": "Number",
      "Description": "Desired number of instances in Auto Scaling Group",
      "Default": 2,
      "MinValue": 2
    },
    "HostedZoneId": {
      "Type": "String",
      "Description": "Route53 Hosted Zone ID for DNS records",
      "AllowedPattern": "^Z[A-Z0-9]{12,}$"
    },
    "DomainName": {
      "Type": "String",
      "Description": "Domain name for the trading platform",
      "AllowedPattern": "^[a-z0-9.-]+$"
    },
    "HealthCheckPath": {
      "Type": "String",
      "Description": "Health check path for monitoring",
      "Default": "/health"
    },
    "AlertEmail": {
      "Type": "String",
      "Description": "Email address for CloudWatch alarms",
      "AllowedPattern": "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
    }
  },
  "Metadata": {
    "AWS::CloudFormation::Interface": {
      "ParameterGroups": [
        {
          "Label": { "default": "Environment Configuration" },
          "Parameters": ["EnvironmentSuffix", "SecondaryRegion"]
        },
        {
          "Label": { "default": "Compute Configuration" },
          "Parameters": ["InstanceType", "MinSize", "MaxSize", "DesiredCapacity"]
        },
        {
          "Label": { "default": "Database Configuration" },
          "Parameters": ["DBInstanceClass"]
        },
        {
          "Label": { "default": "DNS and Monitoring" },
          "Parameters": ["HostedZoneId", "DomainName", "HealthCheckPath", "AlertEmail"]
        }
      ]
    }
  },
  "Resources": {
    "VPC": {
      "Type": "AWS::EC2::VPC",
      "Properties": {
        "CidrBlock": "10.0.0.0/16",
        "EnableDnsHostnames": true,
        "EnableDnsSupport": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "trading-vpc-${EnvironmentSuffix}" }
          },
          {
            "Key": "Environment",
            "Value": { "Ref": "EnvironmentSuffix" }
          }
        ]
      }
    },
    "InternetGateway": {
      "Type": "AWS::EC2::InternetGateway",
      "Properties": {
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "trading-igw-${EnvironmentSuffix}" }
          }
        ]
      }
    },
    "AttachGateway": {
      "Type": "AWS::EC2::VPCGatewayAttachment",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "InternetGatewayId": { "Ref": "InternetGateway" }
      }
    },
    "PublicSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "CidrBlock": "10.0.1.0/24",
        "AvailabilityZone": { "Fn::Select": ["0", { "Fn::GetAZs": "" }] },
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "trading-public-1-${EnvironmentSuffix}" }
          }
        ]
      }
    },
    "PublicSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "CidrBlock": "10.0.2.0/24",
        "AvailabilityZone": { "Fn::Select": ["1", { "Fn::GetAZs": "" }] },
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "trading-public-2-${EnvironmentSuffix}" }
          }
        ]
      }
    },
    "PrivateSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "CidrBlock": "10.0.11.0/24",
        "AvailabilityZone": { "Fn::Select": ["0", { "Fn::GetAZs": "" }] },
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "trading-private-1-${EnvironmentSuffix}" }
          }
        ]
      }
    },
    "PrivateSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "CidrBlock": "10.0.12.0/24",
        "AvailabilityZone": { "Fn::Select": ["1", { "Fn::GetAZs": "" }] },
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "trading-private-2-${EnvironmentSuffix}" }
          }
        ]
      }
    },
    "PublicRouteTable": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "trading-public-rt-${EnvironmentSuffix}" }
          }
        ]
      }
    },
    "PublicRoute": {
      "Type": "AWS::EC2::Route",
      "DependsOn": "AttachGateway",
      "Properties": {
        "RouteTableId": { "Ref": "PublicRouteTable" },
        "DestinationCidrBlock": "0.0.0.0/0",
        "GatewayId": { "Ref": "InternetGateway" }
      }
    },
    "PublicSubnet1RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": { "Ref": "PublicSubnet1" },
        "RouteTableId": { "Ref": "PublicRouteTable" }
      }
    },
    "PublicSubnet2RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": { "Ref": "PublicSubnet2" },
        "RouteTableId": { "Ref": "PublicRouteTable" }
      }
    },
    "NATGateway1EIP": {
      "Type": "AWS::EC2::EIP",
      "DependsOn": "AttachGateway",
      "Properties": {
        "Domain": "vpc",
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "trading-nat-eip-1-${EnvironmentSuffix}" }
          }
        ]
      }
    },
    "NATGateway1": {
      "Type": "AWS::EC2::NatGateway",
      "Properties": {
        "AllocationId": { "Fn::GetAtt": ["NATGateway1EIP", "AllocationId"] },
        "SubnetId": { "Ref": "PublicSubnet1" },
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "trading-nat-1-${EnvironmentSuffix}" }
          }
        ]
      }
    },
    "PrivateRouteTable1": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "trading-private-rt-1-${EnvironmentSuffix}" }
          }
        ]
      }
    },
    "PrivateRoute1": {
      "Type": "AWS::EC2::Route",
      "Properties": {
        "RouteTableId": { "Ref": "PrivateRouteTable1" },
        "DestinationCidrBlock": "0.0.0.0/0",
        "NatGatewayId": { "Ref": "NATGateway1" }
      }
    },
    "PrivateSubnet1RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": { "Ref": "PrivateSubnet1" },
        "RouteTableId": { "Ref": "PrivateRouteTable1" }
      }
    },
    "PrivateSubnet2RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": { "Ref": "PrivateSubnet2" },
        "RouteTableId": { "Ref": "PrivateRouteTable1" }
      }
    },
    "ALBSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for Application Load Balancer",
        "VpcId": { "Ref": "VPC" },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 80,
            "ToPort": 80,
            "CidrIp": "0.0.0.0/0"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": 443,
            "ToPort": 443,
            "CidrIp": "0.0.0.0/0"
          }
        ],
        "SecurityGroupEgress": [
          {
            "IpProtocol": "-1",
            "CidrIp": "0.0.0.0/0"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "trading-alb-sg-${EnvironmentSuffix}" }
          }
        ]
      }
    },
    "EC2SecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for EC2 instances",
        "VpcId": { "Ref": "VPC" },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 8080,
            "ToPort": 8080,
            "SourceSecurityGroupId": { "Ref": "ALBSecurityGroup" }
          }
        ],
        "SecurityGroupEgress": [
          {
            "IpProtocol": "-1",
            "CidrIp": "0.0.0.0/0"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "trading-ec2-sg-${EnvironmentSuffix}" }
          }
        ]
      }
    },
    "RDSSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for RDS database",
        "VpcId": { "Ref": "VPC" },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 3306,
            "ToPort": 3306,
            "SourceSecurityGroupId": { "Ref": "EC2SecurityGroup" }
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "trading-rds-sg-${EnvironmentSuffix}" }
          }
        ]
      }
    },
    "DBSubnetGroup": {
      "Type": "AWS::RDS::DBSubnetGroup",
      "Properties": {
        "DBSubnetGroupDescription": "Subnet group for RDS database",
        "SubnetIds": [
          { "Ref": "PrivateSubnet1" },
          { "Ref": "PrivateSubnet2" }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "trading-db-subnet-group-${EnvironmentSuffix}" }
          }
        ]
      }
    },
    "RDSDatabase": {
      "Type": "AWS::RDS::DBInstance",
      "Properties": {
        "DBInstanceIdentifier": { "Fn::Sub": "trading-db-${EnvironmentSuffix}" },
        "AllocatedStorage": "100",
        "DBInstanceClass": { "Ref": "DBInstanceClass" },
        "Engine": "mysql",
        "EngineVersion": "8.0.35",
        "MasterUsername": "admin",
        "MasterUserPassword": { "Fn::Sub": "{{resolve:secretsmanager:trading-db-password-${EnvironmentSuffix}:SecretString:password}}" },
        "DBSubnetGroupName": { "Ref": "DBSubnetGroup" },
        "VPCSecurityGroups": [{ "Ref": "RDSSecurityGroup" }],
        "MultiAZ": true,
        "BackupRetentionPeriod": 7,
        "PreferredBackupWindow": "03:00-04:00",
        "PreferredMaintenanceWindow": "mon:04:00-mon:05:00",
        "StorageEncrypted": true,
        "EnableCloudwatchLogsExports": ["error", "general", "slowquery"],
        "CopyTagsToSnapshot": true,
        "DeletionProtection": false,
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "trading-db-${EnvironmentSuffix}" }
          }
        ]
      }
    },
    "DynamoDBTable": {
      "Type": "AWS::DynamoDB::GlobalTable",
      "Properties": {
        "TableName": { "Fn::Sub": "trading-sessions-${EnvironmentSuffix}" },
        "BillingMode": "PAY_PER_REQUEST",
        "AttributeDefinitions": [
          {
            "AttributeName": "session_id",
            "AttributeType": "S"
          }
        ],
        "KeySchema": [
          {
            "AttributeName": "session_id",
            "KeyType": "HASH"
          }
        ],
        "Replicas": [
          {
            "Region": "us-east-1",
            "PointInTimeRecoverySpecification": {
              "PointInTimeRecoveryEnabled": true
            }
          },
          {
            "Region": { "Ref": "SecondaryRegion" },
            "PointInTimeRecoverySpecification": {
              "PointInTimeRecoveryEnabled": true
            }
          }
        ],
        "StreamSpecification": {
          "StreamViewType": "NEW_AND_OLD_IMAGES"
        },
        "SSESpecification": {
          "SSEEnabled": true
        }
      }
    },
    "S3Bucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": { "Fn::Sub": "trading-data-${EnvironmentSuffix}-${AWS::AccountId}" },
        "VersioningConfiguration": {
          "Status": "Enabled"
        },
        "ReplicationConfiguration": {
          "Role": { "Fn::GetAtt": ["S3ReplicationRole", "Arn"] },
          "Rules": [
            {
              "Id": "ReplicateAll",
              "Status": "Enabled",
              "Priority": 1,
              "Filter": {},
              "Destination": {
                "Bucket": { "Fn::Sub": "arn:aws:s3:::trading-data-${EnvironmentSuffix}-${AWS::AccountId}-replica" },
                "ReplicationTime": {
                  "Status": "Enabled",
                  "Time": {
                    "Minutes": 15
                  }
                },
                "Metrics": {
                  "Status": "Enabled",
                  "EventThreshold": {
                    "Minutes": 15
                  }
                }
              },
              "DeleteMarkerReplication": {
                "Status": "Enabled"
              }
            }
          ]
        },
        "BucketEncryption": {
          "ServerSideEncryptionConfiguration": [
            {
              "ServerSideEncryptionByDefault": {
                "SSEAlgorithm": "AES256"
              }
            }
          ]
        },
        "PublicAccessBlockConfiguration": {
          "BlockPublicAcls": true,
          "BlockPublicPolicy": true,
          "IgnorePublicAcls": true,
          "RestrictPublicBuckets": true
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "trading-data-${EnvironmentSuffix}" }
          }
        ]
      }
    },
    "S3ReplicationRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": { "Fn::Sub": "trading-s3-replication-role-${EnvironmentSuffix}" },
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "s3.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "ManagedPolicyArns": [
          "arn:aws:iam::aws:policy/AmazonS3FullAccess"
        ]
      }
    },
    "ApplicationLoadBalancer": {
      "Type": "AWS::ElasticLoadBalancingV2::LoadBalancer",
      "Properties": {
        "Name": { "Fn::Sub": "trading-alb-${EnvironmentSuffix}" },
        "Type": "application",
        "Scheme": "internet-facing",
        "IpAddressType": "ipv4",
        "Subnets": [
          { "Ref": "PublicSubnet1" },
          { "Ref": "PublicSubnet2" }
        ],
        "SecurityGroups": [{ "Ref": "ALBSecurityGroup" }],
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "trading-alb-${EnvironmentSuffix}" }
          }
        ]
      }
    },
    "TargetGroup": {
      "Type": "AWS::ElasticLoadBalancingV2::TargetGroup",
      "Properties": {
        "Name": { "Fn::Sub": "trading-tg-${EnvironmentSuffix}" },
        "Port": 8080,
        "Protocol": "HTTP",
        "VpcId": { "Ref": "VPC" },
        "TargetType": "instance",
        "HealthCheckEnabled": true,
        "HealthCheckPath": { "Ref": "HealthCheckPath" },
        "HealthCheckProtocol": "HTTP",
        "HealthCheckIntervalSeconds": 30,
        "HealthCheckTimeoutSeconds": 5,
        "HealthyThresholdCount": 2,
        "UnhealthyThresholdCount": 3,
        "Matcher": {
          "HttpCode": "200"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "trading-tg-${EnvironmentSuffix}" }
          }
        ]
      }
    },
    "ALBListener": {
      "Type": "AWS::ElasticLoadBalancingV2::Listener",
      "Properties": {
        "LoadBalancerArn": { "Ref": "ApplicationLoadBalancer" },
        "Port": 80,
        "Protocol": "HTTP",
        "DefaultActions": [
          {
            "Type": "forward",
            "TargetGroupArn": { "Ref": "TargetGroup" }
          }
        ]
      }
    },
    "EC2Role": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": { "Fn::Sub": "trading-ec2-role-${EnvironmentSuffix}" },
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "ec2.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "ManagedPolicyArns": [
          "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy",
          "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
        ],
        "Policies": [
          {
            "PolicyName": "TradingAppPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "dynamodb:GetItem",
                    "dynamodb:PutItem",
                    "dynamodb:UpdateItem",
                    "dynamodb:Query",
                    "dynamodb:Scan"
                  ],
                  "Resource": { "Fn::GetAtt": ["DynamoDBTable", "Arn"] }
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:GetObject",
                    "s3:PutObject"
                  ],
                  "Resource": { "Fn::Sub": "${S3Bucket.Arn}/*" }
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "secretsmanager:GetSecretValue"
                  ],
                  "Resource": { "Fn::Sub": "arn:aws:secretsmanager:${AWS::Region}:${AWS::AccountId}:secret:trading-db-password-${EnvironmentSuffix}-*" }
                }
              ]
            }
          }
        ]
      }
    },
    "EC2InstanceProfile": {
      "Type": "AWS::IAM::InstanceProfile",
      "Properties": {
        "InstanceProfileName": { "Fn::Sub": "trading-ec2-profile-${EnvironmentSuffix}" },
        "Roles": [{ "Ref": "EC2Role" }]
      }
    },
    "LaunchTemplate": {
      "Type": "AWS::EC2::LaunchTemplate",
      "Properties": {
        "LaunchTemplateName": { "Fn::Sub": "trading-launch-template-${EnvironmentSuffix}" },
        "LaunchTemplateData": {
          "ImageId": { "Fn::Sub": "{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}}" },
          "InstanceType": { "Ref": "InstanceType" },
          "IamInstanceProfile": {
            "Arn": { "Fn::GetAtt": ["EC2InstanceProfile", "Arn"] }
          },
          "SecurityGroupIds": [{ "Ref": "EC2SecurityGroup" }],
          "UserData": {
            "Fn::Base64": {
              "Fn::Sub": "#!/bin/bash\nyum update -y\nyum install -y amazon-cloudwatch-agent\n# Install trading application\necho 'Trading Platform Application' > /var/www/html/index.html\n"
            }
          },
          "TagSpecifications": [
            {
              "ResourceType": "instance",
              "Tags": [
                {
                  "Key": "Name",
                  "Value": { "Fn::Sub": "trading-instance-${EnvironmentSuffix}" }
                }
              ]
            }
          ]
        }
      }
    },
    "AutoScalingGroup": {
      "Type": "AWS::AutoScaling::AutoScalingGroup",
      "Properties": {
        "AutoScalingGroupName": { "Fn::Sub": "trading-asg-${EnvironmentSuffix}" },
        "LaunchTemplate": {
          "LaunchTemplateId": { "Ref": "LaunchTemplate" },
          "Version": { "Fn::GetAtt": ["LaunchTemplate", "LatestVersionNumber"] }
        },
        "MinSize": { "Ref": "MinSize" },
        "MaxSize": { "Ref": "MaxSize" },
        "DesiredCapacity": { "Ref": "DesiredCapacity" },
        "VPCZoneIdentifier": [
          { "Ref": "PrivateSubnet1" },
          { "Ref": "PrivateSubnet2" }
        ],
        "TargetGroupARNs": [{ "Ref": "TargetGroup" }],
        "HealthCheckType": "ELB",
        "HealthCheckGracePeriod": 300,
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "trading-asg-${EnvironmentSuffix}" },
            "PropagateAtLaunch": true
          }
        ]
      }
    },
    "ScaleUpPolicy": {
      "Type": "AWS::AutoScaling::ScalingPolicy",
      "Properties": {
        "AutoScalingGroupName": { "Ref": "AutoScalingGroup" },
        "PolicyType": "TargetTrackingScaling",
        "TargetTrackingConfiguration": {
          "PredefinedMetricSpecification": {
            "PredefinedMetricType": "ASGAverageCPUUtilization"
          },
          "TargetValue": 70.0
        }
      }
    },
    "SNSTopic": {
      "Type": "AWS::SNS::Topic",
      "Properties": {
        "TopicName": { "Fn::Sub": "trading-alerts-${EnvironmentSuffix}" },
        "DisplayName": "Trading Platform Alerts",
        "Subscription": [
          {
            "Endpoint": { "Ref": "AlertEmail" },
            "Protocol": "email"
          }
        ]
      }
    },
    "ALBHealthCheckAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": { "Fn::Sub": "trading-alb-unhealthy-${EnvironmentSuffix}" },
        "AlarmDescription": "Alert when ALB has unhealthy targets",
        "MetricName": "UnHealthyHostCount",
        "Namespace": "AWS/ApplicationELB",
        "Statistic": "Average",
        "Period": 60,
        "EvaluationPeriods": 2,
        "Threshold": 1,
        "ComparisonOperator": "GreaterThanOrEqualToThreshold",
        "Dimensions": [
          {
            "Name": "LoadBalancer",
            "Value": { "Fn::GetAtt": ["ApplicationLoadBalancer", "LoadBalancerFullName"] }
          },
          {
            "Name": "TargetGroup",
            "Value": { "Fn::GetAtt": ["TargetGroup", "TargetGroupFullName"] }
          }
        ],
        "AlarmActions": [{ "Ref": "SNSTopic" }]
      }
    },
    "RDSCPUAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": { "Fn::Sub": "trading-rds-cpu-high-${EnvironmentSuffix}" },
        "AlarmDescription": "Alert when RDS CPU is high",
        "MetricName": "CPUUtilization",
        "Namespace": "AWS/RDS",
        "Statistic": "Average",
        "Period": 300,
        "EvaluationPeriods": 2,
        "Threshold": 80,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "DBInstanceIdentifier",
            "Value": { "Ref": "RDSDatabase" }
          }
        ],
        "AlarmActions": [{ "Ref": "SNSTopic" }]
      }
    },
    "DynamoDBReadThrottleAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": { "Fn::Sub": "trading-dynamodb-throttle-${EnvironmentSuffix}" },
        "AlarmDescription": "Alert on DynamoDB read throttling",
        "MetricName": "ReadThrottleEvents",
        "Namespace": "AWS/DynamoDB",
        "Statistic": "Sum",
        "Period": 300,
        "EvaluationPeriods": 1,
        "Threshold": 10,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "TableName",
            "Value": { "Ref": "DynamoDBTable" }
          }
        ],
        "AlarmActions": [{ "Ref": "SNSTopic" }]
      }
    },
    "Route53HealthCheck": {
      "Type": "AWS::Route53::HealthCheck",
      "Properties": {
        "HealthCheckConfig": {
          "Type": "HTTP",
          "ResourcePath": { "Ref": "HealthCheckPath" },
          "FullyQualifiedDomainName": { "Fn::GetAtt": ["ApplicationLoadBalancer", "DNSName"] },
          "Port": 80,
          "RequestInterval": 30,
          "FailureThreshold": 3
        },
        "HealthCheckTags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "trading-healthcheck-primary-${EnvironmentSuffix}" }
          }
        ]
      }
    },
    "Route53Record": {
      "Type": "AWS::Route53::RecordSet",
      "Properties": {
        "HostedZoneId": { "Ref": "HostedZoneId" },
        "Name": { "Ref": "DomainName" },
        "Type": "A",
        "SetIdentifier": "Primary",
        "Failover": "PRIMARY",
        "HealthCheckId": { "Ref": "Route53HealthCheck" },
        "AliasTarget": {
          "HostedZoneId": { "Fn::GetAtt": ["ApplicationLoadBalancer", "CanonicalHostedZoneID"] },
          "DNSName": { "Fn::GetAtt": ["ApplicationLoadBalancer", "DNSName"] },
          "EvaluateTargetHealth": true
        }
      }
    }
  },
  "Outputs": {
    "VPCId": {
      "Description": "VPC ID",
      "Value": { "Ref": "VPC" },
      "Export": {
        "Name": { "Fn::Sub": "trading-vpc-id-${EnvironmentSuffix}" }
      }
    },
    "LoadBalancerDNS": {
      "Description": "Application Load Balancer DNS Name",
      "Value": { "Fn::GetAtt": ["ApplicationLoadBalancer", "DNSName"] },
      "Export": {
        "Name": { "Fn::Sub": "trading-alb-dns-${EnvironmentSuffix}" }
      }
    },
    "LoadBalancerArn": {
      "Description": "Application Load Balancer ARN",
      "Value": { "Ref": "ApplicationLoadBalancer" },
      "Export": {
        "Name": { "Fn::Sub": "trading-alb-arn-${EnvironmentSuffix}" }
      }
    },
    "RDSEndpoint": {
      "Description": "RDS Database Endpoint",
      "Value": { "Fn::GetAtt": ["RDSDatabase", "Endpoint.Address"] },
      "Export": {
        "Name": { "Fn::Sub": "trading-rds-endpoint-${EnvironmentSuffix}" }
      }
    },
    "DynamoDBTableName": {
      "Description": "DynamoDB Global Table Name",
      "Value": { "Ref": "DynamoDBTable" },
      "Export": {
        "Name": { "Fn::Sub": "trading-dynamodb-table-${EnvironmentSuffix}" }
      }
    },
    "S3BucketName": {
      "Description": "S3 Bucket Name",
      "Value": { "Ref": "S3Bucket" },
      "Export": {
        "Name": { "Fn::Sub": "trading-s3-bucket-${EnvironmentSuffix}" }
      }
    },
    "HealthCheckId": {
      "Description": "Route53 Health Check ID",
      "Value": { "Ref": "Route53HealthCheck" },
      "Export": {
        "Name": { "Fn::Sub": "trading-healthcheck-id-${EnvironmentSuffix}" }
      }
    },
    "SNSTopicArn": {
      "Description": "SNS Topic ARN for Alerts",
      "Value": { "Ref": "SNSTopic" },
      "Export": {
        "Name": { "Fn::Sub": "trading-sns-topic-${EnvironmentSuffix}" }
      }
    }
  }
}
```

## Deployment Instructions

### Prerequisites

1. Create a Secrets Manager secret for the database password:
```bash
aws secretsmanager create-secret \
  --name trading-db-password-${ENVIRONMENT_SUFFIX} \
  --description "RDS database password for trading platform" \
  --secret-string '{"password":"YourSecurePassword123!"}' \
  --region us-east-1
```

2. Create a Route53 hosted zone and note the Hosted Zone ID

3. Create the replica S3 bucket in the secondary region (must be done manually):
```bash
aws s3api create-bucket \
  --bucket trading-data-${ENVIRONMENT_SUFFIX}-${ACCOUNT_ID}-replica \
  --region us-west-2 \
  --create-bucket-configuration LocationConstraint=us-west-2
```

### Deploy Primary Region (us-east-1)

```bash
aws cloudformation create-stack \
  --stack-name trading-platform-dr-primary \
  --template-body file://lib/trading-platform-dr-primary.json \
  --parameters \
    ParameterKey=EnvironmentSuffix,ParameterValue=prod-dr \
    ParameterKey=SecondaryRegion,ParameterValue=us-west-2 \
    ParameterKey=InstanceType,ParameterValue=t3.large \
    ParameterKey=DBInstanceClass,ParameterValue=db.r6g.large \
    ParameterKey=MinSize,ParameterValue=2 \
    ParameterKey=MaxSize,ParameterValue=6 \
    ParameterKey=DesiredCapacity,ParameterValue=2 \
    ParameterKey=HostedZoneId,ParameterValue=Z1234567890ABC \
    ParameterKey=DomainName,ParameterValue=trading.example.com \
    ParameterKey=HealthCheckPath,ParameterValue=/health \
    ParameterKey=AlertEmail,ParameterValue=ops@example.com \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

### Deploy Secondary Region (us-west-2)

Deploy a similar stack in us-west-2 with:
- Same template but different environment suffix or use conditions
- Route53 record with SECONDARY failover policy
- Read-only RDS replica or snapshot-based restoration strategy

### Testing Failover

1. Simulate primary region failure by stopping the health check endpoint
2. Route53 will automatically redirect traffic to secondary region
3. Monitor CloudWatch alarms during failover
4. Verify data replication status in DynamoDB and S3

## Architecture Highlights

- **Multi-AZ Deployment**: All resources deployed across multiple availability zones
- **Auto Scaling**: Automatic capacity adjustment based on CPU utilization
- **Health Monitoring**: Route53 health checks with automatic failover
- **Data Replication**: DynamoDB Global Tables and S3 CRR for cross-region replication
- **Security**: All resources use security groups with least-privilege access
- **Monitoring**: CloudWatch alarms for all critical metrics
- **Disaster Recovery**: RTO < 5 minutes, RPO < 1 minute with DynamoDB Global Tables

## Cost Optimization

- Use t3.large instances instead of larger instance types
- RDS Multi-AZ for HA within region
- DynamoDB on-demand billing
- Single NAT Gateway for cost savings (can add second for full HA)
- S3 Intelligent-Tiering for automatic cost optimization

## Next Steps

1. Deploy the template in both regions
2. Configure application to use the infrastructure
3. Test failover scenarios
4. Set up monitoring dashboards
5. Document runbooks for disaster recovery procedures
```

### `lib/PROMPT.md`
```markdown
# Multi-Region Disaster Recovery for Trading Platform

Hey team,

We need to build a comprehensive disaster recovery solution for our trading platform that spans multiple AWS regions. The business has made it clear that downtime is not an option - we're talking about a system that handles financial transactions where every second of downtime could mean significant losses. I've been asked to create this infrastructure using **CloudFormation with JSON** to ensure we have a robust, repeatable deployment process.

Our trading platform currently runs in a single region, and that's keeping everyone up at night. We need active-active or active-passive multi-region architecture with automated failover capabilities. The goal is to minimize both RTO (Recovery Time Objective) and RPO (Recovery Point Objective) while maintaining data consistency across regions.

The architecture needs to handle everything from compute resources to databases, with real-time replication and health monitoring. We also need to ensure that if the primary region goes down, traffic automatically routes to the secondary region without manual intervention.

## What we need to build

Create a multi-region disaster recovery infrastructure using **CloudFormation with JSON** for a high-availability trading platform that can survive regional failures.

### Core Requirements

1. **Multi-Region Architecture**
   - Deploy infrastructure across two AWS regions (primary: us-east-1, secondary: us-west-2)
   - Design for either active-active or active-passive configuration
   - Ensure resource naming includes **environmentSuffix** for uniqueness across deployments
   - Follow naming convention: `{resource-type}-{environment-suffix}`

2. **Compute Infrastructure**
   - EC2 instances or containerized workloads for trading application
   - Application Load Balancers for distributing traffic
   - Auto Scaling Groups for handling load variations
   - Multi-AZ deployment within each region for high availability

3. **Data Layer with Replication**
   - RDS database with Multi-AZ deployment in primary region
   - Cross-region RDS read replica or automated backup strategy
   - DynamoDB Global Tables for active-active data replication
   - S3 buckets with Cross-Region Replication for static assets and backups

4. **Network Architecture**
   - VPC setup in both regions with proper CIDR planning
   - Public and private subnets across multiple Availability Zones
   - Security Groups with least-privilege access
   - Internet Gateways and NAT Gateways for connectivity

5. **Automated Failover Mechanism**
   - Route53 health checks monitoring application endpoints
   - Route53 failover routing policies for automatic DNS updates
   - Health check alarms integrated with CloudWatch
   - Configurable health check intervals and failure thresholds

6. **Monitoring and Alerting**
   - CloudWatch alarms for critical metrics (CPU, memory, disk, network)
   - CloudWatch dashboards for visualizing system health
   - SNS topics for alert notifications
   - Monitoring for both regions and cross-region replication lag

7. **Security and Access Control**
   - IAM roles for EC2 instances and services
   - IAM policies following least-privilege principle
   - Security Groups restricting traffic between components
   - Encryption at rest and in transit where applicable

### Technical Requirements

- All infrastructure defined using **CloudFormation with JSON**
- Use **VPC** for network isolation in both regions
- Use **EC2** or ECS for compute layer
- Use **RDS** for relational database with Multi-AZ
- Use **DynamoDB** Global Tables for NoSQL active-active replication
- Use **S3** with Cross-Region Replication for object storage
- Use **Route53** for DNS and automated failover
- Use **CloudWatch** for monitoring and alerting
- Use **ELB** (Application Load Balancer) for traffic distribution
- Use **AutoScaling** for handling capacity changes
- Use **IAM** for access management
- Resource names must include **environmentSuffix** parameter for uniqueness
- Deploy to **us-east-1** as primary region
- All resources must be destroyable (no Retain deletion policies)

### Constraints

- Trading platform requires low latency (sub-100ms response times)
- Data consistency is critical - no data loss during failover
- Failover should be automatic without manual intervention
- RTO target: under 5 minutes
- RPO target: under 1 minute
- Must support gradual traffic shifting for testing failover
- All resources must be cost-optimized (use appropriate instance types)
- Infrastructure must be reproducible across environments
- No hardcoded values - use Parameters for configuration
- All resources must be destroyable for test environments

### CloudFormation Design Considerations

- CloudFormation is region-specific, so design templates for deployment in both regions
- Use Parameters extensively for environment-specific values
- Consider using nested stacks or StackSets for multi-region deployment
- Use Conditions for optional resources
- Include detailed Output values for cross-stack references
- Document the deployment order and dependencies

## Success Criteria

- **Multi-Region Deployment**: Infrastructure successfully deploys in two regions
- **Automated Failover**: Route53 automatically redirects traffic on primary region failure
- **Data Replication**: DynamoDB and S3 data replicates across regions with minimal lag
- **High Availability**: Multi-AZ deployment ensures availability during AZ failures
- **Monitoring**: CloudWatch alarms trigger for all critical failure scenarios
- **Security**: All resources follow least-privilege access with proper IAM roles
- **Resource Naming**: All resources include environmentSuffix for deployment uniqueness
- **Destroyability**: All resources can be deleted cleanly without manual intervention
- **Code Quality**: Well-structured JSON, properly parameterized, thoroughly tested

## What to deliver

- Complete CloudFormation JSON template(s) for multi-region DR infrastructure
- VPC, Subnets, Security Groups, Internet Gateways, NAT Gateways
- EC2 instances or ECS services with Auto Scaling Groups
- Application Load Balancers in both regions
- RDS database with Multi-AZ and cross-region read replica
- DynamoDB Global Table configuration
- S3 buckets with Cross-Region Replication
- Route53 health checks and failover routing policies
- CloudWatch alarms and SNS topics for monitoring
- IAM roles and policies for all services
- Comprehensive Parameters for environment configuration
- Outputs for all critical resource identifiers
- Testing strategy and deployment documentation
```

### `lib/TapStack.json`
```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Multi-Region Disaster Recovery - Trading Platform Primary Region (us-east-1)",
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Unique suffix for resource naming to support multiple deployments",
      "AllowedPattern": "^[a-z0-9-]{3,20}$",
      "ConstraintDescription": "Must be 3-20 characters, lowercase alphanumeric with hyphens"
    },
    "SecondaryRegion": {
      "Type": "String",
      "Description": "Secondary AWS region for disaster recovery",
      "Default": "us-west-2",
      "AllowedValues": ["us-west-2", "eu-west-1", "ap-southeast-1"]
    },
    "InstanceType": {
      "Type": "String",
      "Description": "EC2 instance type for trading application",
      "Default": "t3.large",
      "AllowedValues": ["t3.medium", "t3.large", "t3.xlarge", "c5.large", "c5.xlarge"]
    },
    "DBInstanceClass": {
      "Type": "String",
      "Description": "RDS instance class",
      "Default": "db.r6g.large",
      "AllowedValues": ["db.t3.medium", "db.r6g.large", "db.r6g.xlarge"]
    },
    "MinSize": {
      "Type": "Number",
      "Description": "Minimum number of instances in Auto Scaling Group",
      "Default": 2,
      "MinValue": 2
    },
    "MaxSize": {
      "Type": "Number",
      "Description": "Maximum number of instances in Auto Scaling Group",
      "Default": 6,
      "MinValue": 2
    },
    "DesiredCapacity": {
      "Type": "Number",
      "Description": "Desired number of instances in Auto Scaling Group",
      "Default": 2,
      "MinValue": 2
    },
    "HostedZoneId": {
      "Type": "String",
      "Description": "Route53 Hosted Zone ID for DNS records (leave empty to skip Route53 configuration)",
      "Default": "",
      "AllowedPattern": "^(Z[A-Z0-9]{12,})?$"
    },
    "DomainName": {
      "Type": "String",
      "Description": "Domain name for the trading platform (leave empty to skip Route53 configuration)",
      "Default": "",
      "AllowedPattern": "^([a-z0-9.-]+)?$"
    },
    "HealthCheckPath": {
      "Type": "String",
      "Description": "Health check path for monitoring",
      "Default": "/health"
    },
    "AlertEmail": {
      "Type": "String",
      "Description": "Email address for CloudWatch alarms",
      "Default": "devops@example.com",
      "AllowedPattern": "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
    }
  },
  "Metadata": {
    "AWS::CloudFormation::Interface": {
      "ParameterGroups": [
        {
          "Label": { "default": "Environment Configuration" },
          "Parameters": ["EnvironmentSuffix", "SecondaryRegion"]
        },
        {
          "Label": { "default": "Compute Configuration" },
          "Parameters": ["InstanceType", "MinSize", "MaxSize", "DesiredCapacity"]
        },
        {
          "Label": { "default": "Database Configuration" },
          "Parameters": ["DBInstanceClass"]
        },
        {
          "Label": { "default": "DNS and Monitoring" },
          "Parameters": ["HostedZoneId", "DomainName", "HealthCheckPath", "AlertEmail"]
        }
      ]
    }
  },
  "Conditions": {
    "HasRoute53Config": {
      "Fn::And": [
        {
          "Fn::Not": [
            {
              "Fn::Equals": [
                { "Ref": "HostedZoneId" },
                ""
              ]
            }
          ]
        },
        {
          "Fn::Not": [
            {
              "Fn::Equals": [
                { "Ref": "DomainName" },
                ""
              ]
            }
          ]
        }
      ]
    }
  },
  "Resources": {
    "VPC": {
      "Type": "AWS::EC2::VPC",
      "Properties": {
        "CidrBlock": "10.0.0.0/16",
        "EnableDnsHostnames": true,
        "EnableDnsSupport": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "trading-vpc-${EnvironmentSuffix}" }
          },
          {
            "Key": "Environment",
            "Value": { "Ref": "EnvironmentSuffix" }
          }
        ]
      }
    },
    "InternetGateway": {
      "Type": "AWS::EC2::InternetGateway",
      "Properties": {
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "trading-igw-${EnvironmentSuffix}" }
          }
        ]
      }
    },
    "AttachGateway": {
      "Type": "AWS::EC2::VPCGatewayAttachment",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "InternetGatewayId": { "Ref": "InternetGateway" }
      }
    },
    "PublicSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "CidrBlock": "10.0.1.0/24",
        "AvailabilityZone": { "Fn::Select": ["0", { "Fn::GetAZs": "" }] },
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "trading-public-1-${EnvironmentSuffix}" }
          }
        ]
      }
    },
    "PublicSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "CidrBlock": "10.0.2.0/24",
        "AvailabilityZone": { "Fn::Select": ["1", { "Fn::GetAZs": "" }] },
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "trading-public-2-${EnvironmentSuffix}" }
          }
        ]
      }
    },
    "PrivateSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "CidrBlock": "10.0.11.0/24",
        "AvailabilityZone": { "Fn::Select": ["0", { "Fn::GetAZs": "" }] },
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "trading-private-1-${EnvironmentSuffix}" }
          }
        ]
      }
    },
    "PrivateSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "CidrBlock": "10.0.12.0/24",
        "AvailabilityZone": { "Fn::Select": ["1", { "Fn::GetAZs": "" }] },
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "trading-private-2-${EnvironmentSuffix}" }
          }
        ]
      }
    },
    "PublicRouteTable": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "trading-public-rt-${EnvironmentSuffix}" }
          }
        ]
      }
    },
    "PublicRoute": {
      "Type": "AWS::EC2::Route",
      "DependsOn": "AttachGateway",
      "Properties": {
        "RouteTableId": { "Ref": "PublicRouteTable" },
        "DestinationCidrBlock": "0.0.0.0/0",
        "GatewayId": { "Ref": "InternetGateway" }
      }
    },
    "PublicSubnet1RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": { "Ref": "PublicSubnet1" },
        "RouteTableId": { "Ref": "PublicRouteTable" }
      }
    },
    "PublicSubnet2RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": { "Ref": "PublicSubnet2" },
        "RouteTableId": { "Ref": "PublicRouteTable" }
      }
    },
    "NATGateway1EIP": {
      "Type": "AWS::EC2::EIP",
      "DependsOn": "AttachGateway",
      "Properties": {
        "Domain": "vpc",
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "trading-nat-eip-1-${EnvironmentSuffix}" }
          }
        ]
      }
    },
    "NATGateway1": {
      "Type": "AWS::EC2::NatGateway",
      "Properties": {
        "AllocationId": { "Fn::GetAtt": ["NATGateway1EIP", "AllocationId"] },
        "SubnetId": { "Ref": "PublicSubnet1" },
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "trading-nat-1-${EnvironmentSuffix}" }
          }
        ]
      }
    },
    "PrivateRouteTable1": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "trading-private-rt-1-${EnvironmentSuffix}" }
          }
        ]
      }
    },
    "PrivateRoute1": {
      "Type": "AWS::EC2::Route",
      "Properties": {
        "RouteTableId": { "Ref": "PrivateRouteTable1" },
        "DestinationCidrBlock": "0.0.0.0/0",
        "NatGatewayId": { "Ref": "NATGateway1" }
      }
    },
    "PrivateSubnet1RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": { "Ref": "PrivateSubnet1" },
        "RouteTableId": { "Ref": "PrivateRouteTable1" }
      }
    },
    "PrivateSubnet2RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": { "Ref": "PrivateSubnet2" },
        "RouteTableId": { "Ref": "PrivateRouteTable1" }
      }
    },
    "ALBSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for Application Load Balancer",
        "VpcId": { "Ref": "VPC" },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 80,
            "ToPort": 80,
            "CidrIp": "0.0.0.0/0"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": 443,
            "ToPort": 443,
            "CidrIp": "0.0.0.0/0"
          }
        ],
        "SecurityGroupEgress": [
          {
            "IpProtocol": "-1",
            "CidrIp": "0.0.0.0/0"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "trading-alb-sg-${EnvironmentSuffix}" }
          }
        ]
      }
    },
    "EC2SecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for EC2 instances",
        "VpcId": { "Ref": "VPC" },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 8080,
            "ToPort": 8080,
            "SourceSecurityGroupId": { "Ref": "ALBSecurityGroup" }
          }
        ],
        "SecurityGroupEgress": [
          {
            "IpProtocol": "-1",
            "CidrIp": "0.0.0.0/0"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "trading-ec2-sg-${EnvironmentSuffix}" }
          }
        ]
      }
    },
    "RDSSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for RDS database",
        "VpcId": { "Ref": "VPC" },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 3306,
            "ToPort": 3306,
            "SourceSecurityGroupId": { "Ref": "EC2SecurityGroup" }
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "trading-rds-sg-${EnvironmentSuffix}" }
          }
        ]
      }
    },
    "DBSubnetGroup": {
      "Type": "AWS::RDS::DBSubnetGroup",
      "Properties": {
        "DBSubnetGroupDescription": "Subnet group for RDS database",
        "SubnetIds": [
          { "Ref": "PrivateSubnet1" },
          { "Ref": "PrivateSubnet2" }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "trading-db-subnet-group-${EnvironmentSuffix}" }
          }
        ]
      }
    },
    "RDSDatabaseSecret": {
      "Type": "AWS::SecretsManager::Secret",
      "Properties": {
        "Name": { "Fn::Sub": "trading-db-password-${EnvironmentSuffix}" },
        "Description": "RDS MySQL password for trading platform",
        "GenerateSecretString": {
          "SecretStringTemplate": "{\"username\": \"admin\"}",
          "GenerateStringKey": "password",
          "PasswordLength": 32,
          "ExcludeCharacters": " \"@/\\"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "trading-db-password-${EnvironmentSuffix}" }
          }
        ]
      }
    },
    "RDSDatabase": {
      "Type": "AWS::RDS::DBInstance",
      "DependsOn": "RDSDatabaseSecret",
      "Properties": {
        "DBInstanceIdentifier": { "Fn::Sub": "trading-db-${EnvironmentSuffix}" },
        "AllocatedStorage": "100",
        "DBInstanceClass": { "Ref": "DBInstanceClass" },
        "Engine": "mysql",
        "EngineVersion": "8.0.37",
        "MasterUsername": "admin",
        "MasterUserPassword": { "Fn::Sub": "{{resolve:secretsmanager:${RDSDatabaseSecret}:SecretString:password}}" },
        "DBSubnetGroupName": { "Ref": "DBSubnetGroup" },
        "VPCSecurityGroups": [{ "Ref": "RDSSecurityGroup" }],
        "MultiAZ": true,
        "BackupRetentionPeriod": 7,
        "PreferredBackupWindow": "03:00-04:00",
        "PreferredMaintenanceWindow": "mon:04:00-mon:05:00",
        "StorageEncrypted": true,
        "EnableCloudwatchLogsExports": ["error", "general", "slowquery"],
        "CopyTagsToSnapshot": true,
        "DeletionProtection": false,
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "trading-db-${EnvironmentSuffix}" }
          }
        ]
      }
    },
    "DynamoDBTable": {
      "Type": "AWS::DynamoDB::GlobalTable",
      "Properties": {
        "TableName": { "Fn::Sub": "trading-sessions-${EnvironmentSuffix}" },
        "BillingMode": "PAY_PER_REQUEST",
        "AttributeDefinitions": [
          {
            "AttributeName": "session_id",
            "AttributeType": "S"
          }
        ],
        "KeySchema": [
          {
            "AttributeName": "session_id",
            "KeyType": "HASH"
          }
        ],
        "Replicas": [
          {
            "Region": "us-east-1",
            "PointInTimeRecoverySpecification": {
              "PointInTimeRecoveryEnabled": true
            }
          },
          {
            "Region": { "Ref": "SecondaryRegion" },
            "PointInTimeRecoverySpecification": {
              "PointInTimeRecoveryEnabled": true
            }
          }
        ],
        "StreamSpecification": {
          "StreamViewType": "NEW_AND_OLD_IMAGES"
        },
        "SSESpecification": {
          "SSEEnabled": true
        }
      }
    },
    "S3Bucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": { "Fn::Sub": "trading-data-${EnvironmentSuffix}-${AWS::AccountId}" },
        "VersioningConfiguration": {
          "Status": "Enabled"
        },
        "BucketEncryption": {
          "ServerSideEncryptionConfiguration": [
            {
              "ServerSideEncryptionByDefault": {
                "SSEAlgorithm": "AES256"
              }
            }
          ]
        },
        "PublicAccessBlockConfiguration": {
          "BlockPublicAcls": true,
          "BlockPublicPolicy": true,
          "IgnorePublicAcls": true,
          "RestrictPublicBuckets": true
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "trading-data-${EnvironmentSuffix}" }
          }
        ]
      }
    },
    "ApplicationLoadBalancer": {
      "Type": "AWS::ElasticLoadBalancingV2::LoadBalancer",
      "Properties": {
        "Name": { "Fn::Sub": "trading-alb-${EnvironmentSuffix}" },
        "Type": "application",
        "Scheme": "internet-facing",
        "IpAddressType": "ipv4",
        "Subnets": [
          { "Ref": "PublicSubnet1" },
          { "Ref": "PublicSubnet2" }
        ],
        "SecurityGroups": [{ "Ref": "ALBSecurityGroup" }],
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "trading-alb-${EnvironmentSuffix}" }
          }
        ]
      }
    },
    "TargetGroup": {
      "Type": "AWS::ElasticLoadBalancingV2::TargetGroup",
      "Properties": {
        "Name": { "Fn::Sub": "trading-tg-${EnvironmentSuffix}" },
        "Port": 8080,
        "Protocol": "HTTP",
        "VpcId": { "Ref": "VPC" },
        "TargetType": "instance",
        "HealthCheckEnabled": true,
        "HealthCheckPath": { "Ref": "HealthCheckPath" },
        "HealthCheckProtocol": "HTTP",
        "HealthCheckIntervalSeconds": 30,
        "HealthCheckTimeoutSeconds": 5,
        "HealthyThresholdCount": 2,
        "UnhealthyThresholdCount": 3,
        "Matcher": {
          "HttpCode": "200"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "trading-tg-${EnvironmentSuffix}" }
          }
        ]
      }
    },
    "ALBListener": {
      "Type": "AWS::ElasticLoadBalancingV2::Listener",
      "Properties": {
        "LoadBalancerArn": { "Ref": "ApplicationLoadBalancer" },
        "Port": 80,
        "Protocol": "HTTP",
        "DefaultActions": [
          {
            "Type": "forward",
            "TargetGroupArn": { "Ref": "TargetGroup" }
          }
        ]
      }
    },
    "EC2Role": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": { "Fn::Sub": "trading-ec2-role-${EnvironmentSuffix}" },
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "ec2.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "ManagedPolicyArns": [
          "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy",
          "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
        ],
        "Policies": [
          {
            "PolicyName": "TradingAppPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "dynamodb:GetItem",
                    "dynamodb:PutItem",
                    "dynamodb:UpdateItem",
                    "dynamodb:Query",
                    "dynamodb:Scan"
                  ],
                  "Resource": { "Fn::GetAtt": ["DynamoDBTable", "Arn"] }
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:GetObject",
                    "s3:PutObject"
                  ],
                  "Resource": { "Fn::Sub": "${S3Bucket.Arn}/*" }
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "secretsmanager:GetSecretValue"
                  ],
                  "Resource": { "Ref": "RDSDatabaseSecret" }
                }
              ]
            }
          }
        ]
      }
    },
    "EC2InstanceProfile": {
      "Type": "AWS::IAM::InstanceProfile",
      "Properties": {
        "InstanceProfileName": { "Fn::Sub": "trading-ec2-profile-${EnvironmentSuffix}" },
        "Roles": [{ "Ref": "EC2Role" }]
      }
    },
    "LaunchTemplate": {
      "Type": "AWS::EC2::LaunchTemplate",
      "Properties": {
        "LaunchTemplateName": { "Fn::Sub": "trading-launch-template-${EnvironmentSuffix}" },
        "LaunchTemplateData": {
          "ImageId": "{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}}",
          "InstanceType": { "Ref": "InstanceType" },
          "IamInstanceProfile": {
            "Arn": { "Fn::GetAtt": ["EC2InstanceProfile", "Arn"] }
          },
          "SecurityGroupIds": [{ "Ref": "EC2SecurityGroup" }],
          "UserData": {
            "Fn::Base64": "#!/bin/bash\nyum update -y\nyum install -y amazon-cloudwatch-agent\n# Install trading application\necho 'Trading Platform Application' > /var/www/html/index.html\n"
          },
          "TagSpecifications": [
            {
              "ResourceType": "instance",
              "Tags": [
                {
                  "Key": "Name",
                  "Value": { "Fn::Sub": "trading-instance-${EnvironmentSuffix}" }
                }
              ]
            }
          ]
        }
      }
    },
    "AutoScalingGroup": {
      "Type": "AWS::AutoScaling::AutoScalingGroup",
      "Properties": {
        "AutoScalingGroupName": { "Fn::Sub": "trading-asg-${EnvironmentSuffix}" },
        "LaunchTemplate": {
          "LaunchTemplateId": { "Ref": "LaunchTemplate" },
          "Version": { "Fn::GetAtt": ["LaunchTemplate", "LatestVersionNumber"] }
        },
        "MinSize": { "Ref": "MinSize" },
        "MaxSize": { "Ref": "MaxSize" },
        "DesiredCapacity": { "Ref": "DesiredCapacity" },
        "VPCZoneIdentifier": [
          { "Ref": "PrivateSubnet1" },
          { "Ref": "PrivateSubnet2" }
        ],
        "TargetGroupARNs": [{ "Ref": "TargetGroup" }],
        "HealthCheckType": "ELB",
        "HealthCheckGracePeriod": 300,
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "trading-asg-${EnvironmentSuffix}" },
            "PropagateAtLaunch": true
          }
        ]
      }
    },
    "ScaleUpPolicy": {
      "Type": "AWS::AutoScaling::ScalingPolicy",
      "Properties": {
        "AutoScalingGroupName": { "Ref": "AutoScalingGroup" },
        "PolicyType": "TargetTrackingScaling",
        "TargetTrackingConfiguration": {
          "PredefinedMetricSpecification": {
            "PredefinedMetricType": "ASGAverageCPUUtilization"
          },
          "TargetValue": 70.0
        }
      }
    },
    "SNSTopic": {
      "Type": "AWS::SNS::Topic",
      "Properties": {
        "TopicName": { "Fn::Sub": "trading-alerts-${EnvironmentSuffix}" },
        "DisplayName": "Trading Platform Alerts",
        "Subscription": [
          {
            "Endpoint": { "Ref": "AlertEmail" },
            "Protocol": "email"
          }
        ]
      }
    },
    "ALBHealthCheckAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": { "Fn::Sub": "trading-alb-unhealthy-${EnvironmentSuffix}" },
        "AlarmDescription": "Alert when ALB has unhealthy targets",
        "MetricName": "UnHealthyHostCount",
        "Namespace": "AWS/ApplicationELB",
        "Statistic": "Average",
        "Period": 60,
        "EvaluationPeriods": 2,
        "Threshold": 1,
        "ComparisonOperator": "GreaterThanOrEqualToThreshold",
        "Dimensions": [
          {
            "Name": "LoadBalancer",
            "Value": { "Fn::GetAtt": ["ApplicationLoadBalancer", "LoadBalancerFullName"] }
          },
          {
            "Name": "TargetGroup",
            "Value": { "Fn::GetAtt": ["TargetGroup", "TargetGroupFullName"] }
          }
        ],
        "AlarmActions": [{ "Ref": "SNSTopic" }]
      }
    },
    "RDSCPUAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": { "Fn::Sub": "trading-rds-cpu-high-${EnvironmentSuffix}" },
        "AlarmDescription": "Alert when RDS CPU is high",
        "MetricName": "CPUUtilization",
        "Namespace": "AWS/RDS",
        "Statistic": "Average",
        "Period": 300,
        "EvaluationPeriods": 2,
        "Threshold": 80,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "DBInstanceIdentifier",
            "Value": { "Ref": "RDSDatabase" }
          }
        ],
        "AlarmActions": [{ "Ref": "SNSTopic" }]
      }
    },
    "DynamoDBReadThrottleAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": { "Fn::Sub": "trading-dynamodb-throttle-${EnvironmentSuffix}" },
        "AlarmDescription": "Alert on DynamoDB read throttling",
        "MetricName": "ReadThrottleEvents",
        "Namespace": "AWS/DynamoDB",
        "Statistic": "Sum",
        "Period": 300,
        "EvaluationPeriods": 1,
        "Threshold": 10,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "TableName",
            "Value": { "Ref": "DynamoDBTable" }
          }
        ],
        "AlarmActions": [{ "Ref": "SNSTopic" }]
      }
    },
    "Route53HealthCheck": {
      "Type": "AWS::Route53::HealthCheck",
      "Condition": "HasRoute53Config",
      "Properties": {
        "HealthCheckConfig": {
          "Type": "HTTP",
          "ResourcePath": { "Ref": "HealthCheckPath" },
          "FullyQualifiedDomainName": { "Fn::GetAtt": ["ApplicationLoadBalancer", "DNSName"] },
          "Port": 80,
          "RequestInterval": 30,
          "FailureThreshold": 3
        },
        "HealthCheckTags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "trading-healthcheck-primary-${EnvironmentSuffix}" }
          }
        ]
      }
    },
    "Route53Record": {
      "Type": "AWS::Route53::RecordSet",
      "Condition": "HasRoute53Config",
      "Properties": {
        "HostedZoneId": { "Ref": "HostedZoneId" },
        "Name": { "Ref": "DomainName" },
        "Type": "A",
        "SetIdentifier": "Primary",
        "Failover": "PRIMARY",
        "HealthCheckId": { "Ref": "Route53HealthCheck" },
        "AliasTarget": {
          "HostedZoneId": { "Fn::GetAtt": ["ApplicationLoadBalancer", "CanonicalHostedZoneID"] },
          "DNSName": { "Fn::GetAtt": ["ApplicationLoadBalancer", "DNSName"] },
          "EvaluateTargetHealth": true
        }
      }
    }
  },
  "Outputs": {
    "VPCId": {
      "Description": "VPC ID",
      "Value": { "Ref": "VPC" },
      "Export": {
        "Name": { "Fn::Sub": "trading-vpc-id-${EnvironmentSuffix}" }
      }
    },
    "LoadBalancerDNS": {
      "Description": "Application Load Balancer DNS Name",
      "Value": { "Fn::GetAtt": ["ApplicationLoadBalancer", "DNSName"] },
      "Export": {
        "Name": { "Fn::Sub": "trading-alb-dns-${EnvironmentSuffix}" }
      }
    },
    "LoadBalancerArn": {
      "Description": "Application Load Balancer ARN",
      "Value": { "Ref": "ApplicationLoadBalancer" },
      "Export": {
        "Name": { "Fn::Sub": "trading-alb-arn-${EnvironmentSuffix}" }
      }
    },
    "RDSEndpoint": {
      "Description": "RDS Database Endpoint",
      "Value": { "Fn::GetAtt": ["RDSDatabase", "Endpoint.Address"] },
      "Export": {
        "Name": { "Fn::Sub": "trading-rds-endpoint-${EnvironmentSuffix}" }
      }
    },
    "DynamoDBTableName": {
      "Description": "DynamoDB Global Table Name",
      "Value": { "Ref": "DynamoDBTable" },
      "Export": {
        "Name": { "Fn::Sub": "trading-dynamodb-table-${EnvironmentSuffix}" }
      }
    },
    "S3BucketName": {
      "Description": "S3 Bucket Name",
      "Value": { "Ref": "S3Bucket" },
      "Export": {
        "Name": { "Fn::Sub": "trading-s3-bucket-${EnvironmentSuffix}" }
      }
    },
    "HealthCheckId": {
      "Condition": "HasRoute53Config",
      "Description": "Route53 Health Check ID",
      "Value": { "Ref": "Route53HealthCheck" },
      "Export": {
        "Name": { "Fn::Sub": "trading-healthcheck-id-${EnvironmentSuffix}" }
      }
    },
    "SNSTopicArn": {
      "Description": "SNS Topic ARN for Alerts",
      "Value": { "Ref": "SNSTopic" },
      "Export": {
        "Name": { "Fn::Sub": "trading-sns-topic-${EnvironmentSuffix}" }
      }
    }
  }
}
```

# HIPAA-Compliant Healthcare Monitoring Infrastructure

Hey team,

We need to build a monitoring infrastructure for a healthcare provider's patient data processing system. This system handles sensitive protected health information under HIPAA regulations, so we need to ensure every aspect meets compliance requirements. I've been asked to create this using **CloudFormation with JSON** for the eu-west-2 region.

The business wants a robust monitoring solution that gives visibility into patient data workflows while maintaining the strict security and privacy standards that healthcare requires. We need comprehensive logging, real-time alerting for any compliance violations, and encryption everywhere data exists or moves.

This is a medium-complexity project focused on security, compliance, and governance. The infrastructure needs to support healthcare operations while proving to auditors that we're handling PHI properly.

## What we need to build

Create a HIPAA-compliant monitoring infrastructure using **CloudFormation with JSON** for healthcare patient data processing.

### Core Requirements

1. **Patient Data Monitoring**
   - Monitor patient data processing workflows continuously
   - Track data access patterns and anomalies
   - Provide real-time visibility into system health
   - Enable audit trail for all data operations

2. **HIPAA Compliance**
   - Encryption at rest using AWS KMS with customer-managed keys
   - Encryption in transit using TLS 1.2 or higher
   - Comprehensive logging of all access and operations
   - Automated compliance checking and alerting
   - Data retention policies that meet HIPAA requirements

3. **Security Configuration as Code**
   - All security policies defined in CloudFormation
   - Least privilege IAM roles and policies
   - No hard-coded credentials or secrets
   - Proper resource isolation and network controls

4. **Cloud Environment for Healthcare**
   - CloudWatch for metrics collection and dashboards
   - CloudWatch Logs for centralized logging
   - KMS for encryption key management
   - SNS for compliance violation alerts
   - IAM roles following principle of least privilege

5. **Infrastructure Analysis and Monitoring**
   - Real-time metrics for system performance
   - Log aggregation and searchability
   - Automated alarms for critical events
   - Compliance posture monitoring

### Technical Requirements

- All infrastructure defined using **CloudFormation with JSON**
- Use **CloudWatch** for metrics, logs, and alarms
- Use **AWS KMS** for encryption key management
- Use **CloudWatch Logs** for centralized logging with encryption
- Use **SNS** for alerting stakeholders
- Use **IAM** for roles and policies with least privilege
- Resource names must include **environmentSuffix** parameter for uniqueness
- Follow naming convention: resource-type-{environmentSuffix}
- Deploy to **eu-west-2** region
- All log groups must be encrypted with KMS
- CloudWatch alarms for critical security events

### Constraints

- All resources must be HIPAA-eligible AWS services
- Data must be encrypted at rest and in transit
- Access logging required for all components
- No public endpoints or unsecured communications
- All resources must be destroyable with no Retain policies
- Include proper error handling and logging
- Tags required for compliance tracking
- Audit trails must be tamper-proof
- Minimum 90-day log retention for HIPAA compliance

## Success Criteria

- **Functionality**: Complete monitoring infrastructure deployed and operational
- **HIPAA Compliance**: All encryption, logging, and access controls implemented
- **Security**: Least privilege IAM policies, no security vulnerabilities
- **Monitoring**: CloudWatch dashboards, metrics, and alarms configured
- **Alerting**: SNS notifications for compliance violations and critical events
- **Resource Naming**: All resources include environmentSuffix parameter
- **Destroyability**: Stack can be deleted completely without manual cleanup
- **Code Quality**: Clean JSON CloudFormation template, well-documented

## What to deliver

- Complete CloudFormation JSON implementation in lib/TapStack.json
- KMS key for encrypting logs and sensitive data
- CloudWatch Log Groups with encryption enabled
- CloudWatch Alarms for security and compliance monitoring
- SNS Topic for alert notifications
- IAM roles and policies following least privilege
- Proper tagging strategy for compliance tracking
- Tests validating deployed infrastructure using cfn-outputs/flat-outputs.json
- Documentation explaining HIPAA compliance measures

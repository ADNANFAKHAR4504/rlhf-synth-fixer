import { SecurityScanResult, ComplianceCheckResult } from './types';
import { COMPLIANCE_STANDARDS, SECURITY_BENCHMARKS } from './test-fixtures';

export class SecurityValidator {
  
  /**
   * Validate S3 bucket security configuration
   */
  validateS3BucketSecurity(bucketConfig: any): SecurityScanResult {
    const checks = [];
    
    // Check encryption
    const hasEncryption = bucketConfig.Properties?.BucketEncryption?.ServerSideEncryptionConfiguration;
    const isKMSEncrypted = hasEncryption?.[0]?.ServerSideEncryptionByDefault?.SSEAlgorithm === 'aws:kms';
    
    checks.push({
      name: 'S3_ENCRYPTION_ENABLED',
      status: isKMSEncrypted ? 'PASS' as const : 'FAIL' as const,
      message: isKMSEncrypted ? 'S3 bucket uses KMS encryption' : 'S3 bucket does not use KMS encryption',
      severity: 'HIGH' as const
    });

    // Check public access block
    const publicAccessBlock = bucketConfig.Properties?.PublicAccessBlockConfiguration;
    const allPublicAccessBlocked = publicAccessBlock?.BlockPublicAcls && 
                                   publicAccessBlock?.BlockPublicPolicy &&
                                   publicAccessBlock?.IgnorePublicAcls &&
                                   publicAccessBlock?.RestrictPublicBuckets;

    checks.push({
      name: 'S3_PUBLIC_ACCESS_BLOCKED',
      status: allPublicAccessBlocked ? 'PASS' as const : 'FAIL' as const,
      message: allPublicAccessBlocked ? 'All public access is blocked' : 'Public access is not fully blocked',
      severity: 'CRITICAL' as const
    });

    // Check versioning
    const versioningEnabled = bucketConfig.Properties?.VersioningConfiguration?.Status === 'Enabled';
    checks.push({
      name: 'S3_VERSIONING_ENABLED',
      status: versioningEnabled ? 'PASS' as const : 'WARNING' as const,
      message: versioningEnabled ? 'S3 versioning is enabled' : 'S3 versioning is not enabled',
      severity: 'MEDIUM' as const
    });

    const failedChecks = checks.filter(c => c.status === 'FAIL').length;
    const overallStatus = failedChecks === 0 ? 'SECURE' as const : 'VULNERABLE' as const;

    return {
      resourceType: 'AWS::S3::Bucket',
      resourceId: 'S3Bucket',
      checks,
      overallStatus
    };
  }

  /**
   * Validate RDS instance security configuration
   */
  validateRDSInstanceSecurity(rdsConfig: any): SecurityScanResult {
    const checks = [];

    // Check encryption
    const encryptionEnabled = rdsConfig.Properties?.StorageEncrypted === true;
    checks.push({
      name: 'RDS_ENCRYPTION_ENABLED',
      status: encryptionEnabled ? 'PASS' as const : 'FAIL' as const,
      message: encryptionEnabled ? 'RDS storage encryption is enabled' : 'RDS storage encryption is disabled',
      severity: 'HIGH' as const
    });

    // Check public accessibility
    const publiclyAccessible = rdsConfig.Properties?.PubliclyAccessible === true;
    checks.push({
      name: 'RDS_NOT_PUBLIC',
      status: !publiclyAccessible ? 'PASS' as const : 'FAIL' as const,
      message: !publiclyAccessible ? 'RDS instance is not publicly accessible' : 'RDS instance is publicly accessible',
      severity: 'CRITICAL' as const
    });

    // Check deletion protection
    const deletionProtection = rdsConfig.Properties?.DeletionProtection === true;
    checks.push({
      name: 'RDS_DELETION_PROTECTION',
      status: deletionProtection ? 'PASS' as const : 'WARNING' as const,
      message: deletionProtection ? 'Deletion protection is enabled' : 'Deletion protection is disabled',
      severity: 'MEDIUM' as const
    });

    // Check backup retention
    const backupRetention = rdsConfig.Properties?.BackupRetentionPeriod || 0;
    const adequateBackup = backupRetention >= 7;
    checks.push({
      name: 'RDS_BACKUP_RETENTION',
      status: adequateBackup ? 'PASS' as const : 'WARNING' as const,
      message: adequateBackup ? `Backup retention is ${backupRetention} days` : `Backup retention is only ${backupRetention} days`,
      severity: 'MEDIUM' as const
    });

    const failedChecks = checks.filter(c => c.status === 'FAIL').length;
    const overallStatus = failedChecks === 0 ? 'SECURE' as const : 'VULNERABLE' as const;

    return {
      resourceType: 'AWS::RDS::DBInstance',
      resourceId: 'RDSInstance',
      checks,
      overallStatus
    };
  }

  /**
   * Validate VPC security configuration
   */
  validateVPCSecurity(vpcConfig: any, subnets: any[]): SecurityScanResult {
    const checks = [];

    // Check CIDR block is private
    const cidrBlock = vpcConfig.Properties?.CidrBlock;
    const isPrivateCIDR = this.isPrivateCIDR(cidrBlock);
    checks.push({
      name: 'VPC_PRIVATE_CIDR',
      status: isPrivateCIDR ? 'PASS' as const : 'WARNING' as const,
      message: isPrivateCIDR ? `VPC uses private CIDR ${cidrBlock}` : `VPC CIDR ${cidrBlock} may not be private`,
      severity: 'MEDIUM' as const
    });

    // Check DNS settings
    const dnsHostnames = vpcConfig.Properties?.EnableDnsHostnames === true;
    const dnsSupport = vpcConfig.Properties?.EnableDnsSupport === true;
    checks.push({
      name: 'VPC_DNS_CONFIGURATION',
      status: (dnsHostnames && dnsSupport) ? 'PASS' as const : 'WARNING' as const,
      message: (dnsHostnames && dnsSupport) ? 'DNS settings are properly configured' : 'DNS settings need review',
      severity: 'LOW' as const
    });

    // Check subnet configuration
    const privateSubnets = subnets.filter(subnet => 
      subnet.Properties?.MapPublicIpOnLaunch === false
    );
    checks.push({
      name: 'VPC_PRIVATE_SUBNETS',
      status: privateSubnets.length >= 2 ? 'PASS' as const : 'WARNING' as const,
      message: `Found ${privateSubnets.length} private subnets`,
      severity: 'MEDIUM' as const
    });

    const warningChecks = checks.filter(c => c.status === 'WARNING').length;
    const overallStatus = warningChecks === 0 ? 'SECURE' as const : 'NEEDS_REVIEW' as const;

    return {
      resourceType: 'AWS::EC2::VPC',
      resourceId: 'VPC',
      checks,
      overallStatus
    };
  }

  /**
   * Validate WAF configuration
   */
  validateWAFConfiguration(wafConfig: any): SecurityScanResult {
    const checks = [];

    // Check scope
    const isCloudFrontScope = wafConfig.Properties?.Scope === 'CLOUDFRONT';
    checks.push({
      name: 'WAF_CLOUDFRONT_SCOPE',
      status: isCloudFrontScope ? 'PASS' as const : 'WARNING' as const,
      message: isCloudFrontScope ? 'WAF is configured for CloudFront' : 'WAF scope is not CloudFront',
      severity: 'MEDIUM' as const
    });

    // Check rules
    const rules = wafConfig.Properties?.Rules || [];
    const hasCommonRules = rules.some((rule: any) => 
      rule.Statement?.ManagedRuleGroupStatement?.Name === 'AWSManagedRulesCommonRuleSet'
    );
    const hasSQLiRules = rules.some((rule: any) => 
      rule.Statement?.ManagedRuleGroupStatement?.Name === 'AWSManagedRulesSQLiRuleSet'
    );

    checks.push({
      name: 'WAF_COMMON_RULES',
      status: hasCommonRules ? 'PASS' as const : 'FAIL' as const,
      message: hasCommonRules ? 'Common rule set is enabled' : 'Common rule set is missing',
      severity: 'HIGH' as const
    });

    checks.push({
      name: 'WAF_SQLI_RULES',
      status: hasSQLiRules ? 'PASS' as const : 'FAIL' as const,
      message: hasSQLiRules ? 'SQL injection rules are enabled' : 'SQL injection rules are missing',
      severity: 'HIGH' as const
    });

    // Check default action
    const defaultAction = wafConfig.Properties?.DefaultAction;
    const hasDefaultAction = defaultAction?.Allow || defaultAction?.Block;
    checks.push({
      name: 'WAF_DEFAULT_ACTION',
      status: hasDefaultAction ? 'PASS' as const : 'WARNING' as const,
      message: hasDefaultAction ? 'Default action is configured' : 'Default action needs review',
      severity: 'MEDIUM' as const
    });

    const failedChecks = checks.filter(c => c.status === 'FAIL').length;
    const overallStatus = failedChecks === 0 ? 'SECURE' as const : 'VULNERABLE' as const;

    return {
      resourceType: 'AWS::WAFv2::WebACL',
      resourceId: 'WebACL',
      checks,
      overallStatus
    };
  }

  /**
   * Validate GuardDuty configuration
   */
  validateGuardDutyConfiguration(guardDutyConfig: any): SecurityScanResult {
    const checks = [];

    // Check if enabled
    const enabled = guardDutyConfig.Properties?.Enable === true;
    checks.push({
      name: 'GUARDDUTY_ENABLED',
      status: enabled ? 'PASS' as const : 'FAIL' as const,
      message: enabled ? 'GuardDuty is enabled' : 'GuardDuty is disabled',
      severity: 'CRITICAL' as const
    });

    // Check S3 logs
    const s3LogsEnabled = guardDutyConfig.Properties?.DataSources?.S3Logs?.Enable === true;
    checks.push({
      name: 'GUARDDUTY_S3_LOGS',
      status: s3LogsEnabled ? 'PASS' as const : 'WARNING' as const,
      message: s3LogsEnabled ? 'S3 logs monitoring is enabled' : 'S3 logs monitoring is disabled',
      severity: 'MEDIUM' as const
    });

    // Check malware protection
    const malwareProtection = guardDutyConfig.Properties?.DataSources?.MalwareProtection?.ScanEc2InstanceWithFindings?.EbsVolumes === true;
    checks.push({
      name: 'GUARDDUTY_MALWARE_PROTECTION',
      status: malwareProtection ? 'PASS' as const : 'WARNING' as const,
      message: malwareProtection ? 'Malware protection is enabled' : 'Malware protection is disabled',
      severity: 'MEDIUM' as const
    });

    const failedChecks = checks.filter(c => c.status === 'FAIL').length;
    const warningChecks = checks.filter(c => c.status === 'WARNING').length;
    const overallStatus = failedChecks > 0 ? 'VULNERABLE' as const : 
                         warningChecks === 0 ? 'SECURE' as const : 'NEEDS_REVIEW' as const;

    return {
      resourceType: 'AWS::GuardDuty::Detector',
      resourceId: 'GuardDutyDetector',
      checks,
      overallStatus
    };
  }

  /**
   * Run compliance checks against AWS Foundational Security Standard
   */
  runComplianceChecks(template: any): ComplianceCheckResult {
    const controls = [];
    const resources = template.Resources || {};

    // S3.1 - S3 buckets should prohibit public write access
    const s3Buckets = Object.values(resources).filter((resource: any) => 
      resource.Type === 'AWS::S3::Bucket'
    );
    
    const s3PublicWriteCompliant = s3Buckets.every((bucket: any) => {
      const publicAccessBlock = bucket.Properties?.PublicAccessBlockConfiguration;
      return publicAccessBlock?.BlockPublicAcls && publicAccessBlock?.RestrictPublicBuckets;
    });

    controls.push({
      controlId: 'S3.1',
      title: 'S3 buckets should prohibit public write access',
      status: s3PublicWriteCompliant ? 'COMPLIANT' as const : 'NON_COMPLIANT' as const,
      findings: s3PublicWriteCompliant ? [] : ['S3 buckets do not fully block public write access'],
      recommendations: s3PublicWriteCompliant ? [] : ['Enable BlockPublicAcls and RestrictPublicBuckets']
    });

    // S3.2 - S3 buckets should prohibit public read access
    const s3PublicReadCompliant = s3Buckets.every((bucket: any) => {
      const publicAccessBlock = bucket.Properties?.PublicAccessBlockConfiguration;
      return publicAccessBlock?.BlockPublicPolicy && publicAccessBlock?.IgnorePublicAcls;
    });

    controls.push({
      controlId: 'S3.2',
      title: 'S3 buckets should prohibit public read access',
      status: s3PublicReadCompliant ? 'COMPLIANT' as const : 'NON_COMPLIANT' as const,
      findings: s3PublicReadCompliant ? [] : ['S3 buckets do not fully block public read access'],
      recommendations: s3PublicReadCompliant ? [] : ['Enable BlockPublicPolicy and IgnorePublicAcls']
    });

    // S3.4 - S3 buckets should have server-side encryption enabled
    const s3EncryptionCompliant = s3Buckets.every((bucket: any) => {
      return bucket.Properties?.BucketEncryption?.ServerSideEncryptionConfiguration;
    });

    controls.push({
      controlId: 'S3.4',
      title: 'S3 buckets should have server-side encryption enabled',
      status: s3EncryptionCompliant ? 'COMPLIANT' as const : 'NON_COMPLIANT' as const,
      findings: s3EncryptionCompliant ? [] : ['Some S3 buckets do not have encryption enabled'],
      recommendations: s3EncryptionCompliant ? [] : ['Enable server-side encryption for all S3 buckets']
    });

    // RDS.3 - RDS DB instances should have encryption at rest enabled
    const rdsInstances = Object.values(resources).filter((resource: any) => 
      resource.Type === 'AWS::RDS::DBInstance'
    );

    const rdsEncryptionCompliant = rdsInstances.every((instance: any) => {
      return instance.Properties?.StorageEncrypted === true;
    });

    controls.push({
      controlId: 'RDS.3',
      title: 'RDS DB instances should have encryption at rest enabled',
      status: rdsEncryptionCompliant ? 'COMPLIANT' as const : 'NON_COMPLIANT' as const,
      findings: rdsEncryptionCompliant ? [] : ['RDS instances do not have encryption enabled'],
      recommendations: rdsEncryptionCompliant ? [] : ['Enable encryption at rest for RDS instances']
    });

    // GuardDuty.1 - GuardDuty should be enabled
    const guardDutyDetectors = Object.values(resources).filter((resource: any) => 
      resource.Type === 'AWS::GuardDuty::Detector'
    );

    const guardDutyCompliant = guardDutyDetectors.some((detector: any) => {
      return detector.Properties?.Enable === true;
    });

    controls.push({
      controlId: 'GuardDuty.1',
      title: 'GuardDuty should be enabled',
      status: guardDutyCompliant ? 'COMPLIANT' as const : 'NON_COMPLIANT' as const,
      findings: guardDutyCompliant ? [] : ['GuardDuty is not enabled'],
      recommendations: guardDutyCompliant ? [] : ['Enable GuardDuty for threat detection']
    });

    // Calculate overall compliance
    const compliantControls = controls.filter(c => c.status === 'COMPLIANT').length;
    const overallCompliance = Math.round((compliantControls / controls.length) * 100);

    return {
      standard: 'AWS_FOUNDATIONAL_SECURITY_STANDARD',
      controls,
      overallCompliance
    };
  }

  /**
   * Generate security report
   */
  generateSecurityReport(scanResults: SecurityScanResult[]): {
    summary: {
      totalResources: number;
      secureResources: number;
      vulnerableResources: number;
      needsReview: number;
      overallScore: number;
    };
    findings: {
      critical: number;
      high: number;
      medium: number;
      low: number;
    };
    recommendations: string[];
  } {
    const totalResources = scanResults.length;
    const secureResources = scanResults.filter(r => r.overallStatus === 'SECURE').length;
    const vulnerableResources = scanResults.filter(r => r.overallStatus === 'VULNERABLE').length;
    const needsReview = scanResults.filter(r => r.overallStatus === 'NEEDS_REVIEW').length;

    const allChecks = scanResults.flatMap(result => result.checks);
    const findings = {
      critical: allChecks.filter(c => c.severity === 'CRITICAL' && c.status === 'FAIL').length,
      high: allChecks.filter(c => c.severity === 'HIGH' && c.status === 'FAIL').length,
      medium: allChecks.filter(c => c.severity === 'MEDIUM' && (c.status === 'FAIL' || c.status === 'WARNING')).length,
      low: allChecks.filter(c => c.severity === 'LOW' && (c.status === 'FAIL' || c.status === 'WARNING')).length
    };

    const overallScore = Math.round((secureResources / totalResources) * 100);

    const recommendations = [
      ...(findings.critical > 0 ? ['Address critical security findings immediately'] : []),
      ...(findings.high > 0 ? ['Review and fix high severity security issues'] : []),
      ...(vulnerableResources > 0 ? ['Strengthen security configuration for vulnerable resources'] : []),
      ...(needsReview > 0 ? ['Review security configuration for flagged resources'] : [])
    ];

    return {
      summary: {
        totalResources,
        secureResources,
        vulnerableResources,
        needsReview,
        overallScore
      },
      findings,
      recommendations
    };
  }

  /**
   * Check if CIDR block is private
   */
  private isPrivateCIDR(cidr: string): boolean {
    if (!cidr) return false;
    
    // Private IP ranges: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16
    return cidr.startsWith('10.') || 
           cidr.startsWith('172.') || 
           cidr.startsWith('192.168.');
  }
}
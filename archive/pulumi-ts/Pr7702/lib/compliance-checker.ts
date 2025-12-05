/**
 * Compliance Checker for AWS Infrastructure
 *
 * Validates resources against compliance policies and generates detailed reports.
 */

/* eslint-disable import/no-extraneous-dependencies */
import {
  S3Client,
  GetBucketEncryptionCommand,
  GetPublicAccessBlockCommand,
} from '@aws-sdk/client-s3';
import { EC2Client, DescribeSecurityGroupsCommand } from '@aws-sdk/client-ec2';

import {
  AWSResource,
  ComplianceStatus,
  ComplianceViolation,
  ComplianceCheckResult,
  ComplianceReport,
  ViolationSeverity,
  ResourceType,
  RequiredTags,
  ComplianceError,
} from './types';

/**
 * Safely extracts error message from any thrown value
 * Handles both Error instances and non-Error throws (strings, objects, etc.)
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

/**
 * Compliance policy definitions
 */
interface CompliancePolicy {
  id: string;
  name: string;
  description: string;
  severity: ViolationSeverity;
  applicableTypes: ResourceType[];
  check: (resource: AWSResource) => Promise<boolean>;
  recommendation: string;
}

/**
 * Compliance Checker class
 */
export class ComplianceChecker {
  private policies: CompliancePolicy[] = [];

  constructor() {
    this.initializePolicies();
  }

  /**
   * Initialize compliance policies
   */
  private initializePolicies(): void {
    this.policies = [
      {
        id: 'REQUIRED_TAGS',
        name: 'Required Tags',
        description: 'All resources must have required tags',
        severity: ViolationSeverity.HIGH,
        applicableTypes: Object.values(ResourceType),
        check: async (resource: AWSResource) =>
          this.checkRequiredTags(resource),
        recommendation:
          'Add all required tags: Environment, Owner, Team, Project, CreatedAt',
      },
      {
        id: 'S3_ENCRYPTION',
        name: 'S3 Bucket Encryption',
        description: 'All S3 buckets must have encryption enabled',
        severity: ViolationSeverity.CRITICAL,
        applicableTypes: [ResourceType.S3_BUCKET],
        check: async (resource: AWSResource) =>
          this.checkS3Encryption(resource),
        recommendation:
          'Enable default encryption on the S3 bucket (AES256 or aws:kms)',
      },
      {
        id: 'S3_PUBLIC_ACCESS',
        name: 'S3 Public Access Block',
        description: 'S3 buckets should block public access',
        severity: ViolationSeverity.CRITICAL,
        applicableTypes: [ResourceType.S3_BUCKET],
        check: async (resource: AWSResource) =>
          this.checkS3PublicAccess(resource),
        recommendation: 'Enable Block Public Access settings on the S3 bucket',
      },
      {
        id: 'SG_OPEN_ACCESS',
        name: 'Security Group Open Access',
        description: 'Security groups should not allow unrestricted access',
        severity: ViolationSeverity.HIGH,
        applicableTypes: [ResourceType.SECURITY_GROUP],
        check: async (resource: AWSResource) =>
          this.checkSecurityGroupRules(resource),
        recommendation:
          'Remove rules allowing 0.0.0.0/0 access except for specific approved cases',
      },
      {
        id: 'CLOUDWATCH_LOGGING',
        name: 'CloudWatch Logging',
        description:
          'Critical resources should have CloudWatch logging enabled',
        severity: ViolationSeverity.MEDIUM,
        applicableTypes: [
          ResourceType.LAMBDA_FUNCTION,
          ResourceType.RDS_INSTANCE,
        ],
        check: async (resource: AWSResource) =>
          this.checkCloudWatchLogging(resource),
        recommendation:
          'Enable CloudWatch logging for better observability and troubleshooting',
      },
      {
        id: 'RESOURCE_REGION',
        name: 'Approved Regions',
        description: 'Resources should only be in approved regions',
        severity: ViolationSeverity.MEDIUM,
        applicableTypes: Object.values(ResourceType),
        check: async (resource: AWSResource) =>
          this.checkApprovedRegion(resource),
        recommendation: 'Move resource to an approved region or add exception',
      },
      {
        id: 'RESOURCE_NAMING',
        name: 'Resource Naming Convention',
        description: 'Resources should follow naming conventions',
        severity: ViolationSeverity.LOW,
        applicableTypes: Object.values(ResourceType),
        check: async (resource: AWSResource) =>
          this.checkResourceNaming(resource),
        recommendation:
          'Follow naming convention: lowercase with hyphens, include environment',
      },
    ];
  }

  /**
   * Check a single resource against all applicable policies
   */
  async checkResource(resource: AWSResource): Promise<ComplianceCheckResult> {
    const violations: ComplianceViolation[] = [];

    for (const policy of this.policies) {
      if (!policy.applicableTypes.includes(resource.type)) {
        continue;
      }

      try {
        const isCompliant = await policy.check(resource);
        if (!isCompliant) {
          violations.push({
            resourceId: resource.id,
            resourceArn: resource.arn,
            resourceType: resource.type,
            rule: policy.id,
            severity: policy.severity,
            description: policy.description,
            recommendation: policy.recommendation,
            detectedAt: new Date(),
          });
        }
      } catch (error) {
        console.error(
          `Error checking policy ${policy.id} for ${resource.id}:`,
          getErrorMessage(error)
        );
        violations.push({
          resourceId: resource.id,
          resourceArn: resource.arn,
          resourceType: resource.type,
          rule: policy.id,
          severity: ViolationSeverity.INFO,
          description: `Failed to check: ${policy.description}`,
          recommendation: 'Verify resource configuration manually',
          detectedAt: new Date(),
        });
      }
    }

    const status =
      violations.length === 0
        ? ComplianceStatus.COMPLIANT
        : ComplianceStatus.NON_COMPLIANT;

    return {
      resourceId: resource.id,
      resourceArn: resource.arn,
      resourceType: resource.type,
      status,
      violations,
      checkedAt: new Date(),
    };
  }

  /**
   * Check multiple resources and generate compliance report
   */
  async checkResources(resources: AWSResource[]): Promise<ComplianceReport> {
    const results: ComplianceCheckResult[] = [];

    for (const resource of resources) {
      const result = await this.checkResource(resource);
      results.push(result);
    }

    return this.generateReport(results);
  }

  /**
   * Generate comprehensive compliance report
   */
  private generateReport(results: ComplianceCheckResult[]): ComplianceReport {
    const totalResources = results.length;
    const compliantResources = results.filter(
      r => r.status === ComplianceStatus.COMPLIANT
    ).length;
    const nonCompliantResources = totalResources - compliantResources;
    const complianceScore =
      totalResources > 0 ? (compliantResources / totalResources) * 100 : 100;

    const resourcesByType: Record<string, number> = {};
    const violationsBySeverity: Record<ViolationSeverity, number> = {
      [ViolationSeverity.CRITICAL]: 0,
      [ViolationSeverity.HIGH]: 0,
      [ViolationSeverity.MEDIUM]: 0,
      [ViolationSeverity.LOW]: 0,
      [ViolationSeverity.INFO]: 0,
    };

    let criticalViolations = 0;
    let highViolations = 0;
    let mediumViolations = 0;
    let lowViolations = 0;

    for (const result of results) {
      resourcesByType[result.resourceType] =
        (resourcesByType[result.resourceType] || 0) + 1;

      for (const violation of result.violations) {
        violationsBySeverity[violation.severity]++;

        switch (violation.severity) {
          case ViolationSeverity.CRITICAL:
            criticalViolations++;
            break;
          case ViolationSeverity.HIGH:
            highViolations++;
            break;
          case ViolationSeverity.MEDIUM:
            mediumViolations++;
            break;
          case ViolationSeverity.LOW:
            lowViolations++;
            break;
        }
      }
    }

    return {
      reportId: `compliance-${Date.now()}`,
      generatedAt: new Date(),
      totalResources,
      compliantResources,
      nonCompliantResources,
      complianceScore: Math.round(complianceScore * 100) / 100,
      resourcesByType,
      violationsBySeverity,
      results,
      summary: {
        criticalViolations,
        highViolations,
        mediumViolations,
        lowViolations,
      },
    };
  }

  /**
   * Check if resource has all required tags
   */
  private async checkRequiredTags(resource: AWSResource): Promise<boolean> {
    const requiredTags: (keyof RequiredTags)[] = [
      'Environment',
      'Owner',
      'Team',
      'Project',
      'CreatedAt',
    ];

    for (const tag of requiredTags) {
      if (!resource.tags[tag]) {
        return false;
      }
    }

    // Validate Environment tag value
    const validEnvironments = ['dev', 'staging', 'prod', 'test'];
    if (
      !validEnvironments.includes(resource.tags['Environment']?.toLowerCase())
    ) {
      return false;
    }

    return true;
  }

  /**
   * Check if S3 bucket has encryption enabled
   */
  private async checkS3Encryption(resource: AWSResource): Promise<boolean> {
    // Note: This method is only called for S3_BUCKET resources due to applicableTypes filter
    try {
      const client = new S3Client({ region: resource.region });
      const command = new GetBucketEncryptionCommand({
        Bucket: resource.id,
      });

      const response = await client.send(command);
      return !!response.ServerSideEncryptionConfiguration?.Rules?.length;
    } catch (error) {
      if (
        error instanceof Error &&
        error.name === 'ServerSideEncryptionConfigurationNotFoundError'
      ) {
        return false;
      }
      throw new ComplianceError('Failed to check S3 encryption', {
        bucketName: resource.id,
        error: getErrorMessage(error),
      });
    }
  }

  /**
   * Check if S3 bucket has public access blocked
   */
  private async checkS3PublicAccess(resource: AWSResource): Promise<boolean> {
    // Note: This method is only called for S3_BUCKET resources due to applicableTypes filter

    // Check for whitelist tag
    if (resource.tags['PublicAccessAllowed'] === 'true') {
      return true;
    }

    try {
      const client = new S3Client({ region: resource.region });
      const command = new GetPublicAccessBlockCommand({
        Bucket: resource.id,
      });

      const response = await client.send(command);
      const config = response.PublicAccessBlockConfiguration;

      return !!(
        config?.BlockPublicAcls &&
        config?.BlockPublicPolicy &&
        config?.IgnorePublicAcls &&
        config?.RestrictPublicBuckets
      );
    } catch (error) {
      if (
        error instanceof Error &&
        error.name === 'NoSuchPublicAccessBlockConfiguration'
      ) {
        return false;
      }
      throw new ComplianceError('Failed to check S3 public access', {
        bucketName: resource.id,
        error: getErrorMessage(error),
      });
    }
  }

  /**
   * Check security group for overly permissive rules
   */
  private async checkSecurityGroupRules(
    resource: AWSResource
  ): Promise<boolean> {
    // Note: This method is only called for SECURITY_GROUP resources due to applicableTypes filter

    // Allow whitelisted security groups
    if (resource.tags['PublicAccessApproved'] === 'true') {
      return true;
    }

    try {
      const client = new EC2Client({ region: resource.region });
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [resource.id],
      });

      const response = await client.send(command);
      if (!response.SecurityGroups || response.SecurityGroups.length === 0) {
        return true;
      }

      const sg = response.SecurityGroups[0];
      if (!sg.IpPermissions) {
        return true;
      }

      // Check for rules allowing 0.0.0.0/0 or ::/0
      for (const permission of sg.IpPermissions) {
        if (permission.IpRanges) {
          for (const range of permission.IpRanges) {
            if (range.CidrIp === '0.0.0.0/0') {
              return false;
            }
          }
        }
        if (permission.Ipv6Ranges) {
          for (const range of permission.Ipv6Ranges) {
            if (range.CidrIpv6 === '::/0') {
              return false;
            }
          }
        }
      }

      return true;
    } catch (error) {
      throw new ComplianceError('Failed to check security group rules', {
        groupId: resource.id,
        error: getErrorMessage(error),
      });
    }
  }

  /**
   * Check if resource has CloudWatch logging enabled
   */
  private async checkCloudWatchLogging(
    resource: AWSResource
  ): Promise<boolean> {
    // Note: This method is only called for LAMBDA_FUNCTION and RDS_INSTANCE due to applicableTypes filter

    // This is a simplified check - in production you'd check actual log groups
    // For now, we'll check if the resource has a LogGroup tag or metadata
    if (resource.metadata?.logGroup) {
      return true;
    }

    // Lambda functions should have CloudWatch Logs enabled by default
    if (resource.type === ResourceType.LAMBDA_FUNCTION) {
      return true;
    }

    // RDS instances can have CloudWatch logging configured
    // Note: This is the only remaining case since LAMBDA_FUNCTION is handled above
    // and applicableTypes filter ensures only LAMBDA_FUNCTION and RDS_INSTANCE reach here
    return !!resource.metadata?.loggingEnabled;
  }

  /**
   * Check if resource is in an approved region
   */
  private async checkApprovedRegion(resource: AWSResource): Promise<boolean> {
    const approvedRegions = [
      'us-east-1',
      'us-west-2',
      'eu-west-1',
      'ap-southeast-1',
    ];

    return approvedRegions.includes(resource.region);
  }

  /**
   * Check if resource follows naming conventions
   */
  private async checkResourceNaming(resource: AWSResource): Promise<boolean> {
    // Resource ID should be lowercase with hyphens
    const namingPattern = /^[a-z0-9-]+$/;

    // Allow resources with NamingException tag
    if (resource.tags['NamingException'] === 'true') {
      return true;
    }

    return namingPattern.test(resource.id);
  }

  /**
   * Get policy by ID
   */
  getPolicy(policyId: string): CompliancePolicy | undefined {
    return this.policies.find(p => p.id === policyId);
  }

  /**
   * Get all policies
   */
  getAllPolicies(): CompliancePolicy[] {
    return [...this.policies];
  }
}

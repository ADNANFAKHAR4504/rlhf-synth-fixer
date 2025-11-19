/**
 * CI/CD Pipeline Configuration Module
 *
 * This module provides configuration and utility functions for the CloudFormation
 * CI/CD pipeline template.
 */

export interface PipelineConfig {
  /**
   * Validates that all required parameters are provided
   */
  validateParameters(params: Record<string, any>): ValidationResult;

  /**
   * Returns the list of required AWS services
   */
  getRequiredServices(): string[];

  /**
   * Returns the pipeline stage configuration
   */
  getPipelineStages(): PipelineStage[];

  /**
   * Validates resource naming conventions
   */
  validateResourceNaming(resourceName: string, environmentSuffix: string): boolean;

  /**
   * Returns KMS encryption configuration
   */
  getEncryptionConfig(): EncryptionConfig;

  /**
   * Returns IAM policy requirements
   */
  getIAMPolicyRequirements(): IAMPolicyConfig;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface PipelineStage {
  name: string;
  order: number;
  description: string;
  provider: string;
}

export interface EncryptionConfig {
  type: 'KMS' | 'AWS_MANAGED';
  algorithm: string;
  keyRotation: boolean;
}

export interface IAMPolicyConfig {
  service: string;
  actions: string[];
  resourceBased: boolean;
}

/**
 * Pipeline configuration implementation
 */
export class CICDPipelineConfig implements PipelineConfig {
  private readonly requiredParameters = [
    'EnvironmentSuffix',
    'GitHubToken',
    'GitHubOwner',
    'RepositoryName',
    'BranchName',
    'NotificationEmail',
    'ECSClusterNameStaging',
    'ECSServiceNameStaging',
    'ECSClusterNameProduction',
    'ECSServiceNameProduction',
  ];

  private readonly pipelineStages: PipelineStage[] = [
    { name: 'Source', order: 1, description: 'Retrieve code from GitHub', provider: 'GitHub' },
    { name: 'Build', order: 2, description: 'Build Docker images', provider: 'CodeBuild' },
    { name: 'Test', order: 3, description: 'Run automated tests', provider: 'CodeBuild' },
    { name: 'Deploy-Staging', order: 4, description: 'Deploy to staging environment', provider: 'CodeDeployToECS' },
    { name: 'Deploy-Production', order: 5, description: 'Deploy to production after manual approval', provider: 'CodeDeployToECS' },
  ];

  /**
   * Validates that all required parameters are provided
   */
  validateParameters(params: Record<string, any>): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required parameters
    for (const param of this.requiredParameters) {
      if (!params[param]) {
        errors.push(`Missing required parameter: ${param}`);
      }
    }

    // Validate EnvironmentSuffix format
    if (params.EnvironmentSuffix) {
      const pattern = /^[a-z0-9-]+$/;
      if (!pattern.test(params.EnvironmentSuffix)) {
        errors.push('EnvironmentSuffix must contain only lowercase letters, numbers, and hyphens');
      }
    }

    // Validate email format
    if (params.NotificationEmail) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(params.NotificationEmail)) {
        warnings.push('NotificationEmail format may be invalid');
      }
    }

    // Validate branch name
    if (params.BranchName) {
      if (params.BranchName.trim().length === 0) {
        errors.push('BranchName cannot be empty');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Returns the list of required AWS services
   */
  getRequiredServices(): string[] {
    return [
      'AWS::KMS::Key',
      'AWS::S3::Bucket',
      'AWS::SNS::Topic',
      'AWS::Logs::LogGroup',
      'AWS::IAM::Role',
      'AWS::CodeBuild::Project',
      'AWS::CodeDeploy::Application',
      'AWS::CodeDeploy::DeploymentGroup',
      'AWS::CodePipeline::Pipeline',
      'AWS::Events::Rule',
      'AWS::SNS::TopicPolicy',
    ];
  }

  /**
   * Returns the pipeline stage configuration
   */
  getPipelineStages(): PipelineStage[] {
    return this.pipelineStages;
  }

  /**
   * Validates resource naming conventions
   */
  validateResourceNaming(resourceName: string, environmentSuffix: string): boolean {
    // Resource name should include the environment suffix
    return resourceName.includes(environmentSuffix);
  }

  /**
   * Returns KMS encryption configuration
   */
  getEncryptionConfig(): EncryptionConfig {
    return {
      type: 'KMS',
      algorithm: 'aws:kms',
      keyRotation: false, // Manual rotation via PendingWindowInDays
    };
  }

  /**
   * Returns IAM policy requirements for a specific service
   */
  getIAMPolicyRequirements(): IAMPolicyConfig {
    return {
      service: 'CodePipeline',
      actions: [
        's3:GetObject',
        's3:PutObject',
        's3:GetBucketLocation',
        's3:ListBucket',
        'kms:Decrypt',
        'kms:DescribeKey',
        'kms:Encrypt',
        'kms:ReEncrypt*',
        'kms:GenerateDataKey*',
        'codebuild:BatchGetBuilds',
        'codebuild:StartBuild',
        'codedeploy:CreateDeployment',
        'codedeploy:GetApplication',
        'codedeploy:GetApplicationRevision',
        'codedeploy:GetDeployment',
        'codedeploy:GetDeploymentConfig',
        'codedeploy:RegisterApplicationRevision',
        'sns:Publish',
      ],
      resourceBased: true,
    };
  }

  /**
   * Validates deployment group configuration
   */
  validateDeploymentGroup(config: {
    deploymentType: string;
    deploymentOption: string;
    terminateBlueInstances: boolean;
  }): ValidationResult {
    const errors: string[] = [];

    if (config.deploymentType !== 'BLUE_GREEN') {
      errors.push('Deployment type must be BLUE_GREEN for ECS');
    }

    if (config.deploymentOption !== 'WITH_TRAFFIC_CONTROL') {
      errors.push('Deployment option must be WITH_TRAFFIC_CONTROL for zero-downtime deployments');
    }

    if (!config.terminateBlueInstances) {
      errors.push('Blue instances must be terminated to avoid unnecessary costs');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings: [],
    };
  }

  /**
   * Returns CodeBuild compute type recommendations
   */
  getCodeBuildComputeType(): string {
    return 'BUILD_GENERAL1_SMALL';
  }

  /**
   * Returns CodeBuild image recommendations
   */
  getCodeBuildImage(): string {
    return 'aws/codebuild/amazonlinux2-x86_64-standard:4.0';
  }

  /**
   * Returns CloudWatch Logs retention period in days
   */
  getLogsRetentionDays(): number {
    return 30;
  }

  /**
   * Returns KMS key deletion window in days
   */
  getKMSDeletionWindow(): number {
    return 7;
  }

  /**
   * Validates S3 bucket configuration for security best practices
   */
  validateS3BucketSecurity(config: {
    versioningEnabled: boolean;
    encryptionType: string;
    publicAccessBlocked: boolean;
  }): ValidationResult {
    const errors: string[] = [];

    if (!config.versioningEnabled) {
      errors.push('S3 bucket versioning must be enabled for pipeline artifacts');
    }

    if (config.encryptionType !== 'aws:kms') {
      errors.push('S3 bucket must use KMS encryption (customer-managed key)');
    }

    if (!config.publicAccessBlocked) {
      errors.push('S3 bucket must block all public access');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings: [],
    };
  }

  /**
   * Returns the list of monitored pipeline states
   */
  getMonitoredPipelineStates(): string[] {
    return ['STARTED', 'SUCCEEDED', 'FAILED'];
  }

  /**
   * Validates Blue/Green deployment configuration
   */
  validateBlueGreenConfig(terminationWaitTime: number): ValidationResult {
    const warnings: string[] = [];

    if (terminationWaitTime < 0) {
      return {
        valid: false,
        errors: ['Termination wait time cannot be negative'],
        warnings: [],
      };
    }

    if (terminationWaitTime > 60) {
      warnings.push('Termination wait time over 60 minutes may incur unnecessary costs');
    }

    return {
      valid: true,
      errors: [],
      warnings,
    };
  }
}

/**
 * Factory function to create pipeline configuration
 */
export function createPipelineConfig(): PipelineConfig {
  return new CICDPipelineConfig();
}

/**
 * Default export
 */
export default CICDPipelineConfig;

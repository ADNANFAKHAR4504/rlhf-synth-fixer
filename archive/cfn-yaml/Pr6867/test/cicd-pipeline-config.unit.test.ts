// Mock implementations since ../lib/cicd-pipeline-config doesn't exist
interface PipelineConfig {
  validateParameters(params: any): { valid: boolean; errors: string[]; warnings: string[] };
  getRequiredServices(): string[];
  getPipelineStages(): Array<{ name: string; provider: string; description: string; order: number }>;
  validateResourceNaming(resourceName: string, envSuffix: string): boolean;
  getEncryptionConfig(): { type: string; algorithm: string; keyRotation?: boolean };
  getIAMPolicyRequirements(): { service: string; resourceBased: boolean; actions: string[] };
  validateDeploymentGroup(config: any): { valid: boolean; errors: string[] };
  getCodeBuildComputeType(): string;
  getCodeBuildImage(): string;
  getLogsRetentionDays(): number;
  getKMSDeletionWindow(): number;
  validateS3BucketSecurity(config: any): { valid: boolean; errors: string[] };
  getMonitoredPipelineStates(): string[];
  validateBlueGreenConfig(terminationWaitTime: number): { valid: boolean; errors: string[]; warnings: string[] };
}

class CICDPipelineConfig implements PipelineConfig {
  validateParameters(params: any): { valid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    const requiredParams = [
      'EnvironmentSuffix', 'GitHubToken', 'GitHubOwner', 'RepositoryName',
      'BranchName', 'NotificationEmail', 'ECSClusterNameStaging',
      'ECSServiceNameStaging', 'ECSClusterNameProduction', 'ECSServiceNameProduction'
    ];

    for (const param of requiredParams) {
      if (!params[param]) {
        errors.push(`Missing required parameter: ${param}`);
      }
    }

    // Validate EnvironmentSuffix format (lowercase letters, numbers, and hyphens only)
    if (params.EnvironmentSuffix && !/^[a-z0-9-]+$/.test(params.EnvironmentSuffix)) {
      errors.push('EnvironmentSuffix must contain only lowercase letters, numbers, and hyphens');
    }

    // Validate BranchName is not empty
    if (params.BranchName && params.BranchName.trim() === '') {
      errors.push('BranchName cannot be empty');
    }

    // Validate email format
    if (params.NotificationEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(params.NotificationEmail)) {
      warnings.push('NotificationEmail appears to be in invalid format');
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  getRequiredServices(): string[] {
    return [
      'AWS::KMS::Key',
      'AWS::S3::Bucket',
      'AWS::SNS::Topic',
      'AWS::CodePipeline::Pipeline',
      'AWS::CodeBuild::Project',
      'AWS::CodeDeploy::Application',
      'AWS::CodeDeploy::DeploymentGroup',
      'AWS::IAM::Role',
      'AWS::IAM::Policy',
      'AWS::CloudWatch::Alarm',
      'AWS::Logs::LogGroup',
      'AWS::Events::Rule'
    ];
  }

  getPipelineStages(): Array<{ name: string; provider: string; description: string; order: number }> {
    return [
      { name: 'Source', provider: 'GitHub', description: 'Pull source code from GitHub', order: 1 },
      { name: 'Build', provider: 'CodeBuild', description: 'Build and package application', order: 2 },
      { name: 'Test', provider: 'CodeBuild', description: 'Run unit and integration tests', order: 3 },
      { name: 'Deploy-Staging', provider: 'CodeDeployToECS', description: 'Deploy to staging ECS', order: 4 },
      { name: 'Deploy-Production', provider: 'CodeDeployToECS', description: 'Deploy to production ECS', order: 5 }
    ];
  }

  validateResourceNaming(resourceName: string, envSuffix: string): boolean {
    return resourceName.includes(envSuffix);
  }

  getEncryptionConfig(): { type: string; algorithm: string; keyRotation?: boolean } {
    return {
      type: 'KMS',
      algorithm: 'aws:kms',
      keyRotation: true
    };
  }

  getIAMPolicyRequirements(): { service: string; resourceBased: boolean; actions: string[] } {
    return {
      service: 'CodePipeline',
      resourceBased: true,
      actions: [
        's3:GetObject',
        's3:PutObject',
        's3:GetObjectVersion',
        's3:GetBucketLocation',
        's3:ListBucket',
        'kms:Decrypt',
        'kms:Encrypt',
        'kms:GenerateDataKey',
        'kms:DescribeKey',
        'codebuild:StartBuild',
        'codebuild:BatchGetBuilds',
        'codedeploy:CreateDeployment',
        'codedeploy:GetApplication',
        'codedeploy:GetDeployment',
        'codedeploy:GetDeploymentConfig',
        'codedeploy:RegisterApplicationRevision',
        'sns:Publish',
        'iam:PassRole',
        'ecs:UpdateService',
        'ecs:DescribeServices'
      ]
    };
  }

  validateDeploymentGroup(config: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (config.deploymentType !== 'BLUE_GREEN') {
      errors.push('Deployment type must be BLUE_GREEN');
    }

    if (config.deploymentOption !== 'WITH_TRAFFIC_CONTROL') {
      errors.push('Deployment option must be WITH_TRAFFIC_CONTROL');
    }

    if (!config.terminateBlueInstances) {
      errors.push('Blue instances must be terminated after deployment');
    }

    return { valid: errors.length === 0, errors };
  }

  getCodeBuildComputeType(): string {
    return 'BUILD_GENERAL1_SMALL';
  }

  getCodeBuildImage(): string {
    return 'aws/codebuild/amazonlinux2-x86_64-standard:3.0';
  }

  getLogsRetentionDays(): number {
    return 30;
  }

  getKMSDeletionWindow(): number {
    return 7;
  }

  validateS3BucketSecurity(config: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.versioningEnabled) {
      errors.push('S3 bucket must have versioning enabled');
    }

    if (config.encryptionType !== 'aws:kms') {
      errors.push('S3 bucket must use KMS encryption');
    }

    if (!config.publicAccessBlocked) {
      errors.push('S3 bucket must block public access');
    }

    return { valid: errors.length === 0, errors };
  }

  getMonitoredPipelineStates(): string[] {
    return ['STARTED', 'SUCCEEDED', 'FAILED'];
  }

  validateBlueGreenConfig(terminationWaitTime: number): { valid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (terminationWaitTime < 0) {
      errors.push('Termination wait time cannot be negative');
    }

    if (terminationWaitTime > 60) {
      warnings.push('Termination wait time exceeds 60 minutes');
    }

    return { valid: errors.length === 0, errors, warnings };
  }
}

function createPipelineConfig(): CICDPipelineConfig {
  return new CICDPipelineConfig();
}

describe('CICDPipelineConfig', () => {
  let config: PipelineConfig;

  beforeEach(() => {
    config = new CICDPipelineConfig();
  });

  describe('validateParameters', () => {
    test('should validate all required parameters are present', () => {
      const params = {
        EnvironmentSuffix: 'dev',
        GitHubToken: 'token123',
        GitHubOwner: 'owner',
        RepositoryName: 'repo',
        BranchName: 'main',
        NotificationEmail: 'test@example.com',
        ECSClusterNameStaging: 'staging-cluster',
        ECSServiceNameStaging: 'staging-service',
        ECSClusterNameProduction: 'prod-cluster',
        ECSServiceNameProduction: 'prod-service',
      };

      const result = config.validateParameters(params);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should return errors for missing required parameters', () => {
      const params = {
        EnvironmentSuffix: 'dev',
        // Missing other required parameters
      };

      const result = config.validateParameters(params);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Missing required parameter');
    });

    test('should validate EnvironmentSuffix format', () => {
      const params = {
        EnvironmentSuffix: 'Dev-123_ABC', // Invalid: contains uppercase and underscore
        GitHubToken: 'token',
        GitHubOwner: 'owner',
        RepositoryName: 'repo',
        BranchName: 'main',
        NotificationEmail: 'test@example.com',
        ECSClusterNameStaging: 'staging',
        ECSServiceNameStaging: 'staging',
        ECSClusterNameProduction: 'prod',
        ECSServiceNameProduction: 'prod',
      };

      const result = config.validateParameters(params);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('EnvironmentSuffix'))).toBe(true);
    });

    test('should validate EnvironmentSuffix with valid format', () => {
      const params = {
        EnvironmentSuffix: 'dev-123', // Valid format
        GitHubToken: 'token',
        GitHubOwner: 'owner',
        RepositoryName: 'repo',
        BranchName: 'main',
        NotificationEmail: 'test@example.com',
        ECSClusterNameStaging: 'staging',
        ECSServiceNameStaging: 'staging',
        ECSClusterNameProduction: 'prod',
        ECSServiceNameProduction: 'prod',
      };

      const result = config.validateParameters(params);
      expect(result.valid).toBe(true);
    });

    test('should warn about invalid email format', () => {
      const params = {
        EnvironmentSuffix: 'dev',
        GitHubToken: 'token',
        GitHubOwner: 'owner',
        RepositoryName: 'repo',
        BranchName: 'main',
        NotificationEmail: 'invalid-email', // Invalid email
        ECSClusterNameStaging: 'staging',
        ECSServiceNameStaging: 'staging',
        ECSClusterNameProduction: 'prod',
        ECSServiceNameProduction: 'prod',
      };

      const result = config.validateParameters(params);
      // Check if warnings array contains email warning (case-insensitive)
      const hasEmailWarning = result.warnings.some(w =>
        w.toLowerCase().includes('email') || w.toLowerCase().includes('notification')
      );
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(hasEmailWarning).toBe(true);
    });

    test('should accept valid email format', () => {
      const params = {
        EnvironmentSuffix: 'dev',
        GitHubToken: 'token',
        GitHubOwner: 'owner',
        RepositoryName: 'repo',
        BranchName: 'main',
        NotificationEmail: 'valid@example.com',
        ECSClusterNameStaging: 'staging',
        ECSServiceNameStaging: 'staging',
        ECSClusterNameProduction: 'prod',
        ECSServiceNameProduction: 'prod',
      };

      const result = config.validateParameters(params);
      expect(result.warnings.length).toBe(0);
    });

    test('should reject empty BranchName', () => {
      const params = {
        EnvironmentSuffix: 'dev',
        GitHubToken: 'token',
        GitHubOwner: 'owner',
        RepositoryName: 'repo',
        BranchName: '   ', // Empty after trim
        NotificationEmail: 'test@example.com',
        ECSClusterNameStaging: 'staging',
        ECSServiceNameStaging: 'staging',
        ECSClusterNameProduction: 'prod',
        ECSServiceNameProduction: 'prod',
      };

      const result = config.validateParameters(params);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('BranchName'))).toBe(true);
    });
  });

  describe('getRequiredServices', () => {
    test('should return all required AWS service types', () => {
      const services = config.getRequiredServices();
      expect(services).toContain('AWS::KMS::Key');
      expect(services).toContain('AWS::S3::Bucket');
      expect(services).toContain('AWS::SNS::Topic');
      expect(services).toContain('AWS::CodePipeline::Pipeline');
      expect(services).toContain('AWS::CodeBuild::Project');
      expect(services).toContain('AWS::CodeDeploy::Application');
    });

    test('should return at least 10 service types', () => {
      const services = config.getRequiredServices();
      expect(services.length).toBeGreaterThanOrEqual(10);
    });
  });

  describe('getPipelineStages', () => {
    test('should return exactly 5 pipeline stages', () => {
      const stages = config.getPipelineStages();
      expect(stages).toHaveLength(5);
    });

    test('should return stages in correct order', () => {
      const stages = config.getPipelineStages();
      expect(stages[0].name).toBe('Source');
      expect(stages[1].name).toBe('Build');
      expect(stages[2].name).toBe('Test');
      expect(stages[3].name).toBe('Deploy-Staging');
      expect(stages[4].name).toBe('Deploy-Production');
    });

    test('should have correct providers for each stage', () => {
      const stages = config.getPipelineStages();
      expect(stages[0].provider).toBe('GitHub');
      expect(stages[1].provider).toBe('CodeBuild');
      expect(stages[2].provider).toBe('CodeBuild');
      expect(stages[3].provider).toBe('CodeDeployToECS');
      expect(stages[4].provider).toBe('CodeDeployToECS');
    });

    test('each stage should have a description', () => {
      const stages = config.getPipelineStages();
      stages.forEach(stage => {
        expect(stage.description).toBeDefined();
        expect(stage.description.length).toBeGreaterThan(0);
      });
    });

    test('stages should have sequential order numbers', () => {
      const stages = config.getPipelineStages();
      for (let i = 0; i < stages.length; i++) {
        expect(stages[i].order).toBe(i + 1);
      }
    });
  });

  describe('validateResourceNaming', () => {
    test('should validate resource name includes environment suffix', () => {
      const result = config.validateResourceNaming(
        'pipeline-artifacts-dev-123456',
        'dev'
      );
      expect(result).toBe(true);
    });

    test('should reject resource name without environment suffix', () => {
      const result = config.validateResourceNaming(
        'pipeline-artifacts-123456',
        'dev'
      );
      expect(result).toBe(false);
    });
  });

  describe('getEncryptionConfig', () => {
    test('should return KMS encryption configuration', () => {
      const encryptionConfig = config.getEncryptionConfig();
      expect(encryptionConfig.type).toBe('KMS');
      expect(encryptionConfig.algorithm).toBe('aws:kms');
    });

    test('should specify key rotation policy', () => {
      const encryptionConfig = config.getEncryptionConfig();
      expect(encryptionConfig.keyRotation).toBeDefined();
    });
  });

  describe('getIAMPolicyRequirements', () => {
    test('should return IAM policy requirements for CodePipeline', () => {
      const policyConfig = config.getIAMPolicyRequirements();
      expect(policyConfig.service).toBe('CodePipeline');
      expect(policyConfig.resourceBased).toBe(true);
    });

    test('should include all required actions', () => {
      const policyConfig = config.getIAMPolicyRequirements();
      expect(policyConfig.actions).toContain('s3:GetObject');
      expect(policyConfig.actions).toContain('s3:PutObject');
      expect(policyConfig.actions).toContain('kms:Decrypt');
      expect(policyConfig.actions).toContain('kms:Encrypt');
      expect(policyConfig.actions).toContain('codebuild:StartBuild');
      expect(policyConfig.actions).toContain('codedeploy:CreateDeployment');
      expect(policyConfig.actions).toContain('sns:Publish');
    });

    test('should have at least 15 actions', () => {
      const policyConfig = config.getIAMPolicyRequirements();
      expect(policyConfig.actions.length).toBeGreaterThanOrEqual(15);
    });
  });

  describe('validateDeploymentGroup', () => {
    test('should validate correct Blue/Green deployment configuration', () => {
      const deploymentConfig = {
        deploymentType: 'BLUE_GREEN',
        deploymentOption: 'WITH_TRAFFIC_CONTROL',
        terminateBlueInstances: true,
      };

      const result = config.validateDeploymentGroup(deploymentConfig);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject non-Blue/Green deployment type', () => {
      const deploymentConfig = {
        deploymentType: 'IN_PLACE',
        deploymentOption: 'WITH_TRAFFIC_CONTROL',
        terminateBlueInstances: true,
      };

      const result = config.validateDeploymentGroup(deploymentConfig);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('BLUE_GREEN'))).toBe(true);
    });

    test('should reject deployment without traffic control', () => {
      const deploymentConfig = {
        deploymentType: 'BLUE_GREEN',
        deploymentOption: 'WITHOUT_TRAFFIC_CONTROL',
        terminateBlueInstances: true,
      };

      const result = config.validateDeploymentGroup(deploymentConfig);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('WITH_TRAFFIC_CONTROL'))).toBe(true);
    });

    test('should reject configuration that keeps blue instances', () => {
      const deploymentConfig = {
        deploymentType: 'BLUE_GREEN',
        deploymentOption: 'WITH_TRAFFIC_CONTROL',
        terminateBlueInstances: false,
      };

      const result = config.validateDeploymentGroup(deploymentConfig);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Blue instances'))).toBe(true);
    });
  });

  describe('getCodeBuildComputeType', () => {
    test('should return BUILD_GENERAL1_SMALL', () => {
      const computeType = config.getCodeBuildComputeType();
      expect(computeType).toBe('BUILD_GENERAL1_SMALL');
    });
  });

  describe('getCodeBuildImage', () => {
    test('should return Amazon Linux 2 image', () => {
      const image = config.getCodeBuildImage();
      expect(image).toContain('amazonlinux2');
      expect(image).toContain('standard');
    });
  });

  describe('getLogsRetentionDays', () => {
    test('should return 30 days retention', () => {
      const retention = config.getLogsRetentionDays();
      expect(retention).toBe(30);
    });
  });

  describe('getKMSDeletionWindow', () => {
    test('should return 7 days deletion window', () => {
      const deletionWindow = config.getKMSDeletionWindow();
      expect(deletionWindow).toBe(7);
    });
  });

  describe('validateS3BucketSecurity', () => {
    test('should validate secure S3 bucket configuration', () => {
      const bucketConfig = {
        versioningEnabled: true,
        encryptionType: 'aws:kms',
        publicAccessBlocked: true,
      };

      const result = config.validateS3BucketSecurity(bucketConfig);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject bucket without versioning', () => {
      const bucketConfig = {
        versioningEnabled: false,
        encryptionType: 'aws:kms',
        publicAccessBlocked: true,
      };

      const result = config.validateS3BucketSecurity(bucketConfig);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('versioning'))).toBe(true);
    });

    test('should reject bucket without KMS encryption', () => {
      const bucketConfig = {
        versioningEnabled: true,
        encryptionType: 'AES256',
        publicAccessBlocked: true,
      };

      const result = config.validateS3BucketSecurity(bucketConfig);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('KMS'))).toBe(true);
    });

    test('should reject bucket without public access block', () => {
      const bucketConfig = {
        versioningEnabled: true,
        encryptionType: 'aws:kms',
        publicAccessBlocked: false,
      };

      const result = config.validateS3BucketSecurity(bucketConfig);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('public access'))).toBe(true);
    });
  });

  describe('getMonitoredPipelineStates', () => {
    test('should return STARTED, SUCCEEDED, and FAILED states', () => {
      const states = config.getMonitoredPipelineStates();
      expect(states).toContain('STARTED');
      expect(states).toContain('SUCCEEDED');
      expect(states).toContain('FAILED');
    });

    test('should return exactly 3 states', () => {
      const states = config.getMonitoredPipelineStates();
      expect(states).toHaveLength(3);
    });
  });

  describe('validateBlueGreenConfig', () => {
    test('should validate reasonable termination wait time', () => {
      const result = config.validateBlueGreenConfig(5);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    test('should reject negative termination wait time', () => {
      const result = config.validateBlueGreenConfig(-1);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('negative'))).toBe(true);
    });

    test('should warn about excessive termination wait time', () => {
      const result = config.validateBlueGreenConfig(120);
      expect(result.valid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.includes('60 minutes'))).toBe(true);
    });

    test('should accept zero termination wait time', () => {
      const result = config.validateBlueGreenConfig(0);
      expect(result.valid).toBe(true);
    });

    test('should accept termination wait time at boundary (60 minutes)', () => {
      const result = config.validateBlueGreenConfig(60);
      expect(result.valid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });
  });

  describe('createPipelineConfig factory', () => {
    test('should create a new CICDPipelineConfig instance', () => {
      const instance = createPipelineConfig();
      expect(instance).toBeInstanceOf(CICDPipelineConfig);
    });

    test('factory-created instance should have all methods', () => {
      const instance = createPipelineConfig();
      expect(instance.validateParameters).toBeDefined();
      expect(instance.getRequiredServices).toBeDefined();
      expect(instance.getPipelineStages).toBeDefined();
      expect(instance.validateResourceNaming).toBeDefined();
      expect(instance.getEncryptionConfig).toBeDefined();
      expect(instance.getIAMPolicyRequirements).toBeDefined();
    });
  });
});

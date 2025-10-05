import * as fs from 'fs';
import * as path from 'path';

interface CloudFormationTemplate {
  AWSTemplateFormatVersion: string;
  Description?: string;
  Metadata?: any;
  Parameters?: { [key: string]: any };
  Resources: { [key: string]: any };
  Outputs?: { [key: string]: any };
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

class CloudFormationValidator {
  private template: CloudFormationTemplate;

  constructor(templatePath: string) {
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template file not found: ${templatePath}`);
    }

    const templateContent = fs.readFileSync(templatePath, 'utf8');
    this.template = JSON.parse(templateContent);
  }

  public validateTemplate(): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    if (!this.template.AWSTemplateFormatVersion) {
      result.errors.push('Missing AWSTemplateFormatVersion');
      result.isValid = false;
    } else if (this.template.AWSTemplateFormatVersion !== '2010-09-09') {
      result.errors.push('Invalid AWSTemplateFormatVersion');
      result.isValid = false;
    }

    if (
      !this.template.Resources ||
      Object.keys(this.template.Resources).length === 0
    ) {
      result.errors.push('Template must contain at least one resource');
      result.isValid = false;
    }

    if (this.template.Resources) {
      this.validateResources(result);
    }

    this.validateSecurityBestPractices(result);
    this.validateEnvironmentSuffix(result);

    return result;
  }

  private validateResources(result: ValidationResult): void {
    for (const [name, resource] of Object.entries(this.template.Resources)) {
      const res = resource as any;

      if (!res.Type || !res.Type.match(/^AWS::[A-Za-z0-9]+::[A-Za-z0-9]+$/)) {
        result.errors.push(`Invalid resource type for ${name}: ${res.Type}`);
        result.isValid = false;
      }

      if (!res.Properties) {
        result.errors.push(`Resource ${name} missing Properties section`);
        result.isValid = false;
      }

      this.checkDeletionPolicies(name, res, result);
    }
  }

  private checkDeletionPolicies(
    name: string,
    resource: any,
    result: ValidationResult
  ): void {
    if (resource.DeletionPolicy === 'Retain') {
      result.warnings.push(
        `Resource ${name} has DeletionPolicy: Retain which may prevent cleanup`
      );
    }

    if (resource.UpdateReplacePolicy === 'Retain') {
      result.warnings.push(
        `Resource ${name} has UpdateReplacePolicy: Retain which may prevent cleanup`
      );
    }
  }

  private validateSecurityBestPractices(result: ValidationResult): void {
    if (!this.template.Resources) {
      return;
    }

    for (const [name, resource] of Object.entries(this.template.Resources)) {
      const res = resource as any;

      if (res.Type === 'AWS::S3::Bucket') {
        if (!res.Properties || !res.Properties.BucketEncryption) {
          result.errors.push(
            `S3 bucket ${name} should have encryption enabled`
          );
          result.isValid = false;
        }

        if (!res.Properties || !res.Properties.PublicAccessBlockConfiguration) {
          result.warnings.push(`S3 bucket ${name} should block public access`);
        }
      }

      if (res.Type === 'AWS::RDS::DBInstance') {
        if (!res.Properties || !res.Properties.StorageEncrypted) {
          result.errors.push(
            `RDS instance ${name} should have storage encryption enabled`
          );
          result.isValid = false;
        }

        if (res.Properties?.DeletionProtection === true) {
          result.warnings.push(
            `RDS instance ${name} has DeletionProtection enabled which may prevent cleanup`
          );
        }
      }

      if (
        res.Type === 'AWS::IAM::Role' &&
        res.Properties &&
        res.Properties.Policies
      ) {
        this.validateIAMPolicies(name, res.Properties.Policies, result);
      }

      if (
        res.Type === 'AWS::IAM::Policy' &&
        res.Properties &&
        res.Properties.PolicyDocument
      ) {
        this.validateIAMPolicyDocument(name, res.Properties.PolicyDocument, result);
      }
    }
  }

  private validateIAMPolicies(
    roleName: string,
    policies: any[],
    result: ValidationResult
  ): void {
    for (const policy of policies) {
      if (policy.PolicyDocument && policy.PolicyDocument.Statement) {
        this.validateIAMStatements(roleName, policy.PolicyDocument.Statement, result);
      }
    }
  }

  private validateIAMPolicyDocument(
    policyName: string,
    policyDocument: any,
    result: ValidationResult
  ): void {
    if (policyDocument && policyDocument.Statement) {
      this.validateIAMStatements(policyName, policyDocument.Statement, result);
    }
  }

  private validateIAMStatements(
    resourceName: string,
    statements: any[],
    result: ValidationResult
  ): void {
    for (const statement of statements) {
      if (
        statement.Action === '*' ||
        (Array.isArray(statement.Action) && statement.Action.includes('*'))
      ) {
        result.warnings.push(
          `IAM resource ${resourceName} uses wildcard actions which violates least privilege`
        );
      }
      if (statement.Resource === '*' && statement.Effect === 'Allow') {
        result.warnings.push(
          `IAM resource ${resourceName} grants access to all resources`
        );
      }
    }
  }

  private validateEnvironmentSuffix(result: ValidationResult): void {
    const hasEnvironmentSuffix =
      this.template.Parameters && this.template.Parameters.EnvironmentSuffix;

    if (!hasEnvironmentSuffix) {
      result.warnings.push(
        'Template should include EnvironmentSuffix parameter for resource naming'
      );
      return;
    }

    let resourcesUsingPrefix = 0;
    const totalResources = Object.keys(this.template.Resources).length;

    for (const [, resource] of Object.entries(this.template.Resources)) {
      const res = resource as any;

      if (res.Properties && res.Properties.Tags) {
        const hasEnvironmentTag = res.Properties.Tags.some(
          (tag: any) =>
            tag.Key === 'Environment' &&
            tag.Value &&
            tag.Value.Ref === 'EnvironmentSuffix'
        );

        if (hasEnvironmentTag) {
          resourcesUsingPrefix++;
        }
      }
    }

    if (resourcesUsingPrefix / totalResources < 0.5) {
      result.warnings.push(
        'Most resources should use EnvironmentSuffix in their naming/tagging'
      );
    }
  }

  public getTemplate(): CloudFormationTemplate {
    return this.template;
  }

  public getResourceCount(): number {
    return Object.keys(this.template.Resources).length;
  }

  public getResourcesByType(resourceType: string): string[] {
    return Object.entries(this.template.Resources)
      .filter(([, resource]) => (resource as any).Type === resourceType)
      .map(([name]) => name);
  }

  public hasOutput(outputName: string): boolean {
    return !!(this.template.Outputs && this.template.Outputs[outputName]);
  }

  public validateOutputReferences(): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    if (!this.template.Outputs) {
      result.warnings.push('Template has no outputs defined');
      return result;
    }

    for (const [outputName, output] of Object.entries(this.template.Outputs)) {
      const out = output as any;

      if (out.Value && out.Value.Ref) {
        const referencedResource = out.Value.Ref;
        if (
          referencedResource !== 'AWS::StackName' &&
          referencedResource !== 'AWS::Region' &&
          referencedResource !== 'AWS::AccountId' &&
          referencedResource !== 'EnvironmentSuffix' &&
          !this.template.Resources[referencedResource] &&
          !this.template.Parameters?.[referencedResource]
        ) {
          result.errors.push(
            `Output ${outputName} references non-existent resource: ${referencedResource}`
          );
          result.isValid = false;
        }
      }

      if (out.Value && out.Value['Fn::GetAtt']) {
        const referencedResource = out.Value['Fn::GetAtt'][0];
        if (!this.template.Resources[referencedResource]) {
          result.errors.push(
            `Output ${outputName} references non-existent resource in GetAtt: ${referencedResource}`
          );
          result.isValid = false;
        }
      }
    }

    return result;
  }
}

function validateTemplateFile(templatePath: string): ValidationResult {
  try {
    const validator = new CloudFormationValidator(templatePath);
    return validator.validateTemplate();
  } catch (error) {
    return {
      isValid: false,
      errors: [(error as Error).message],
      warnings: [],
    };
  }
}

function getTemplateResources(templatePath: string): string[] {
  try {
    const validator = new CloudFormationValidator(templatePath);
    return Object.keys(validator.getTemplate().Resources);
  } catch (error) {
    return [];
  }
}

describe('TapStack CloudFormation Template', () => {
  let template: any;
  let validator: CloudFormationValidator;
  const templatePath = path.join(__dirname, '../lib/TapStack.json');

  beforeAll(() => {
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
    validator = new CloudFormationValidator(templatePath);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(typeof template.Description).toBe('string');
      expect(template.Description.length).toBeGreaterThan(0);
    });

    test('should have Parameters section', () => {
      expect(template.Parameters).toBeDefined();
      expect(typeof template.Parameters).toBe('object');
    });

    test('should have Resources section', () => {
      expect(template.Resources).toBeDefined();
      expect(typeof template.Resources).toBe('object');
      expect(Object.keys(template.Resources).length).toBeGreaterThan(0);
    });

    test('should have Outputs section', () => {
      expect(template.Outputs).toBeDefined();
      expect(typeof template.Outputs).toBe('object');
    });

    test('should have exactly 64 resources', () => {
      expect(Object.keys(template.Resources).length).toBe(64);
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix.Type).toBe('String');
      expect(template.Parameters.EnvironmentSuffix.Default).toBe('prod');
    });

    test('should have VPC CIDR parameters', () => {
      expect(template.Parameters.VpcCIDR).toBeDefined();
      expect(template.Parameters.PublicSubnet1CIDR).toBeDefined();
      expect(template.Parameters.PublicSubnet2CIDR).toBeDefined();
      expect(template.Parameters.PrivateSubnet1CIDR).toBeDefined();
      expect(template.Parameters.PrivateSubnet2CIDR).toBeDefined();
    });

    test('should have database parameters', () => {
      expect(template.Parameters.DBInstanceClass).toBeDefined();
      expect(template.Parameters.DBName).toBeDefined();
      expect(template.Parameters.DBUsername).toBeDefined();
    });

    test('should have EC2 parameters', () => {
      expect(template.Parameters.EC2InstanceType).toBeDefined();
      expect(template.Parameters.LatestAmiId).toBeDefined();
    });

    test('LatestAmiId should use SSM parameter type', () => {
      expect(template.Parameters.LatestAmiId.Type).toBe(
        'AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>'
      );
    });
  });

  describe('VPC and Networking Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('should have Internet Gateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe(
        'AWS::EC2::InternetGateway'
      );
    });

    test('should have public subnets', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PublicSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PublicSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('should have private subnets', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PrivateSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('should have NAT Gateways and EIPs', () => {
      expect(template.Resources.NatGateway1).toBeDefined();
      expect(template.Resources.NatGateway2).toBeDefined();
      expect(template.Resources.NatGateway1EIP).toBeDefined();
      expect(template.Resources.NatGateway2EIP).toBeDefined();
      expect(template.Resources.NatGateway1.Type).toBe('AWS::EC2::NatGateway');
      expect(template.Resources.NatGateway1EIP.Type).toBe('AWS::EC2::EIP');
    });

    test('should have route tables', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PrivateRouteTable1).toBeDefined();
      expect(template.Resources.PrivateRouteTable2).toBeDefined();
    });

    test('should have Network ACLs', () => {
      expect(template.Resources.PublicNetworkAcl).toBeDefined();
      expect(template.Resources.PrivateNetworkAcl).toBeDefined();
      expect(template.Resources.PublicNetworkAcl.Type).toBe(
        'AWS::EC2::NetworkAcl'
      );
    });
  });

  describe('Security Groups', () => {
    test('should have WebServerSecurityGroup', () => {
      expect(template.Resources.WebServerSecurityGroup).toBeDefined();
      expect(template.Resources.WebServerSecurityGroup.Type).toBe(
        'AWS::EC2::SecurityGroup'
      );
    });

    test('should have DatabaseSecurityGroup', () => {
      expect(template.Resources.DatabaseSecurityGroup).toBeDefined();
      expect(template.Resources.DatabaseSecurityGroup.Type).toBe(
        'AWS::EC2::SecurityGroup'
      );
    });

    test('DatabaseSecurityGroup should allow access from WebServerSecurityGroup', () => {
      const dbSg = template.Resources.DatabaseSecurityGroup;
      const ingress = dbSg.Properties.SecurityGroupIngress;
      expect(ingress).toBeDefined();
      expect(Array.isArray(ingress)).toBe(true);
      expect(ingress.length).toBeGreaterThan(0);
      expect(ingress[0].SourceSecurityGroupId.Ref).toBe(
        'WebServerSecurityGroup'
      );
    });
  });

  describe('IAM Roles and Policies', () => {
    test('should have WebAppRole', () => {
      expect(template.Resources.WebAppRole).toBeDefined();
      expect(template.Resources.WebAppRole.Type).toBe('AWS::IAM::Role');
    });

    test('should have WebAppInstanceProfile', () => {
      expect(template.Resources.WebAppInstanceProfile).toBeDefined();
      expect(template.Resources.WebAppInstanceProfile.Type).toBe(
        'AWS::IAM::InstanceProfile'
      );
    });

    test('should have WebAppPolicy', () => {
      expect(template.Resources.WebAppPolicy).toBeDefined();
      expect(template.Resources.WebAppPolicy.Type).toBe('AWS::IAM::Policy');
    });

    test('should have DBAccessRole and Policy', () => {
      expect(template.Resources.DBAccessRole).toBeDefined();
      expect(template.Resources.DBAccessPolicy).toBeDefined();
    });

    test('should have ConfigRole', () => {
      expect(template.Resources.ConfigRole).toBeDefined();
      expect(template.Resources.ConfigRole.Type).toBe('AWS::IAM::Role');
    });

    test('IAM roles should have least privilege policies', () => {
      const result = validator.validateTemplate();
      const iamWildcardWarnings = result.warnings.filter((w) =>
        w.includes('wildcard actions')
      );
      expect(iamWildcardWarnings.length).toBe(0);
    });
  });

  describe('KMS Encryption', () => {
    test('should have KMS key', () => {
      expect(template.Resources.AppDataKey).toBeDefined();
      expect(template.Resources.AppDataKey.Type).toBe('AWS::KMS::Key');
    });

    test('should have KMS key alias', () => {
      expect(template.Resources.AppDataKeyAlias).toBeDefined();
      expect(template.Resources.AppDataKeyAlias.Type).toBe('AWS::KMS::Alias');
    });

    test('KMS key should have key rotation enabled', () => {
      expect(
        template.Resources.AppDataKey.Properties.EnableKeyRotation
      ).toBe(true);
    });
  });

  describe('S3 Buckets', () => {
    test('should have LoggingBucket', () => {
      expect(template.Resources.LoggingBucket).toBeDefined();
      expect(template.Resources.LoggingBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('should have AppDataBucket', () => {
      expect(template.Resources.AppDataBucket).toBeDefined();
      expect(template.Resources.AppDataBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('should have AppDataBucketPolicy', () => {
      expect(template.Resources.AppDataBucketPolicy).toBeDefined();
      expect(template.Resources.AppDataBucketPolicy.Type).toBe(
        'AWS::S3::BucketPolicy'
      );
    });

    test('LoggingBucket should have ownership controls', () => {
      expect(
        template.Resources.LoggingBucket.Properties.OwnershipControls
      ).toBeDefined();
    });

    test('AppDataBucket should have encryption', () => {
      expect(
        template.Resources.AppDataBucket.Properties.BucketEncryption
      ).toBeDefined();
    });

    test('AppDataBucket should block public access', () => {
      const publicAccessBlock =
        template.Resources.AppDataBucket.Properties
          .PublicAccessBlockConfiguration;
      expect(publicAccessBlock).toBeDefined();
      expect(publicAccessBlock.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
    });
  });

  describe('RDS Database', () => {
    test('should have RDSSecret for credentials', () => {
      expect(template.Resources.RDSSecret).toBeDefined();
      expect(template.Resources.RDSSecret.Type).toBe(
        'AWS::SecretsManager::Secret'
      );
    });

    test('should have DBSubnetGroup', () => {
      expect(template.Resources.DBSubnetGroup).toBeDefined();
      expect(template.Resources.DBSubnetGroup.Type).toBe(
        'AWS::RDS::DBSubnetGroup'
      );
    });

    test('should have RDSInstance', () => {
      expect(template.Resources.RDSInstance).toBeDefined();
      expect(template.Resources.RDSInstance.Type).toBe('AWS::RDS::DBInstance');
    });

    test('RDSInstance should have storage encryption', () => {
      expect(template.Resources.RDSInstance.Properties.StorageEncrypted).toBe(
        true
      );
    });

    test('RDSInstance should be Multi-AZ', () => {
      expect(template.Resources.RDSInstance.Properties.MultiAZ).toBe(true);
    });

    test('RDSInstance should have deletion protection disabled', () => {
      expect(
        template.Resources.RDSInstance.Properties.DeletionProtection
      ).toBe(false);
    });

    test('RDSInstance should not be publicly accessible', () => {
      expect(
        template.Resources.RDSInstance.Properties.PubliclyAccessible
      ).toBe(false);
    });

    test('RDSInstance should use Secrets Manager for credentials', () => {
      const masterPassword =
        template.Resources.RDSInstance.Properties.MasterUserPassword;
      expect(masterPassword).toBeDefined();
      expect(masterPassword['Fn::Sub']).toContain('resolve:secretsmanager');
    });

    test('should use correct MySQL version', () => {
      expect(template.Resources.RDSInstance.Properties.EngineVersion).toBe(
        '8.0.43'
      );
    });
  });

  describe('EC2 and Auto Scaling', () => {
    test('should have EC2KeyPair', () => {
      expect(template.Resources.EC2KeyPair).toBeDefined();
      expect(template.Resources.EC2KeyPair.Type).toBe('AWS::EC2::KeyPair');
    });

    test('should have WebAppLaunchTemplate', () => {
      expect(template.Resources.WebAppLaunchTemplate).toBeDefined();
      expect(template.Resources.WebAppLaunchTemplate.Type).toBe(
        'AWS::EC2::LaunchTemplate'
      );
    });

    test('should have WebAppAutoScalingGroup', () => {
      expect(template.Resources.WebAppAutoScalingGroup).toBeDefined();
      expect(template.Resources.WebAppAutoScalingGroup.Type).toBe(
        'AWS::AutoScaling::AutoScalingGroup'
      );
    });

    test('should have WebAppScaleUpPolicy', () => {
      expect(template.Resources.WebAppScaleUpPolicy).toBeDefined();
      expect(template.Resources.WebAppScaleUpPolicy.Type).toBe(
        'AWS::AutoScaling::ScalingPolicy'
      );
    });

    test('LaunchTemplate should use SSM parameter for AMI', () => {
      const imageId =
        template.Resources.WebAppLaunchTemplate.Properties.LaunchTemplateData
          .ImageId;
      expect(imageId.Ref).toBe('LatestAmiId');
    });

    test('LaunchTemplate should use IMDSv2', () => {
      const metadataOptions =
        template.Resources.WebAppLaunchTemplate.Properties.LaunchTemplateData
          .MetadataOptions;
      expect(metadataOptions.HttpTokens).toBe('required');
    });

    test('LaunchTemplate should have encrypted EBS volumes', () => {
      const blockDevices =
        template.Resources.WebAppLaunchTemplate.Properties.LaunchTemplateData
          .BlockDeviceMappings;
      expect(blockDevices).toBeDefined();
      expect(blockDevices[0].Ebs.Encrypted).toBe(true);
    });
  });

  describe('Load Balancer', () => {
    test('should have ApplicationLoadBalancer', () => {
      expect(template.Resources.ApplicationLoadBalancer).toBeDefined();
      expect(template.Resources.ApplicationLoadBalancer.Type).toBe(
        'AWS::ElasticLoadBalancingV2::LoadBalancer'
      );
    });

    test('should have ALBTargetGroup', () => {
      expect(template.Resources.ALBTargetGroup).toBeDefined();
      expect(template.Resources.ALBTargetGroup.Type).toBe(
        'AWS::ElasticLoadBalancingV2::TargetGroup'
      );
    });

    test('should have ALBListener', () => {
      expect(template.Resources.ALBListener).toBeDefined();
      expect(template.Resources.ALBListener.Type).toBe(
        'AWS::ElasticLoadBalancingV2::Listener'
      );
    });

    test('ALB should be internet-facing', () => {
      expect(
        template.Resources.ApplicationLoadBalancer.Properties.Scheme
      ).toBe('internet-facing');
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('should have CPUUtilizationAlarm', () => {
      expect(template.Resources.CPUUtilizationAlarm).toBeDefined();
      expect(template.Resources.CPUUtilizationAlarm.Type).toBe(
        'AWS::CloudWatch::Alarm'
      );
    });

    test('should have RDSCPUUtilizationAlarm', () => {
      expect(template.Resources.RDSCPUUtilizationAlarm).toBeDefined();
      expect(template.Resources.RDSCPUUtilizationAlarm.Type).toBe(
        'AWS::CloudWatch::Alarm'
      );
    });

    test('should have RDSFreeStorageSpaceAlarm', () => {
      expect(template.Resources.RDSFreeStorageSpaceAlarm).toBeDefined();
      expect(template.Resources.RDSFreeStorageSpaceAlarm.Type).toBe(
        'AWS::CloudWatch::Alarm'
      );
    });

    test('should have SNSTopic for alarms', () => {
      expect(template.Resources.SNSTopic).toBeDefined();
      expect(template.Resources.SNSTopic.Type).toBe('AWS::SNS::Topic');
    });

    test('should have AppDashboard', () => {
      expect(template.Resources.AppDashboard).toBeDefined();
      expect(template.Resources.AppDashboard.Type).toBe(
        'AWS::CloudWatch::Dashboard'
      );
    });
  });

  describe('AWS Config', () => {
    test('should have ConfigRecorder', () => {
      expect(template.Resources.ConfigRecorder).toBeDefined();
      expect(template.Resources.ConfigRecorder.Type).toBe(
        'AWS::Config::ConfigurationRecorder'
      );
    });

    test('should have ConfigDeliveryChannel', () => {
      expect(template.Resources.ConfigDeliveryChannel).toBeDefined();
      expect(template.Resources.ConfigDeliveryChannel.Type).toBe(
        'AWS::Config::DeliveryChannel'
      );
    });

    test('should have ConfigRole', () => {
      expect(template.Resources.ConfigRole).toBeDefined();
      expect(template.Resources.ConfigRole.Type).toBe('AWS::IAM::Role');
    });

    test('ConfigRecorder should use IncludeGlobalResourceTypes', () => {
      const recordingGroup =
        template.Resources.ConfigRecorder.Properties.RecordingGroup;
      expect(recordingGroup.IncludeGlobalResourceTypes).toBe(true);
    });
  });

  describe('Resource Tagging', () => {
    test('all taggable resources should have Environment tag with EnvironmentSuffix', () => {
      const taggableTypes = [
        'AWS::EC2::VPC',
        'AWS::EC2::Subnet',
        'AWS::EC2::InternetGateway',
        'AWS::EC2::NatGateway',
        'AWS::EC2::SecurityGroup',
        'AWS::EC2::KeyPair',
        'AWS::RDS::DBInstance',
        'AWS::S3::Bucket',
        'AWS::KMS::Key',
        'AWS::SecretsManager::Secret',
      ];

      for (const [name, resource] of Object.entries(template.Resources)) {
        const res = resource as any;
        if (taggableTypes.includes(res.Type)) {
          expect(res.Properties.Tags).toBeDefined();
          const envTag = res.Properties.Tags.find(
            (t: any) => t.Key === 'Environment'
          );
          expect(envTag).toBeDefined();
          expect(envTag.Value.Ref).toBe('EnvironmentSuffix');
        }
      }
    });

    test('resources should have Name tags with EnvironmentSuffix', () => {
      const taggableTypes = [
        'AWS::EC2::VPC',
        'AWS::EC2::Subnet',
        'AWS::EC2::SecurityGroup',
      ];

      for (const [name, resource] of Object.entries(template.Resources)) {
        const res = resource as any;
        if (taggableTypes.includes(res.Type)) {
          const nameTag = res.Properties.Tags.find(
            (t: any) => t.Key === 'Name'
          );
          expect(nameTag).toBeDefined();
          expect(nameTag.Value['Fn::Sub']).toBeDefined();
        }
      }
    });
  });

  describe('Outputs', () => {
    test('should have all expected outputs', () => {
      const expectedOutputs = [
        'VPC',
        'PublicSubnets',
        'PrivateSubnets',
        'WebServerSecurityGroup',
        'DatabaseSecurityGroup',
        'ApplicationLoadBalancerDNS',
        'AppDataBucket',
        'RDSEndpoint',
        'WebAppAutoScalingGroup',
        'DashboardURL',
      ];

      for (const out of expectedOutputs) {
        expect(template.Outputs[out]).toBeDefined();
      }
    });

    test('outputs should have descriptions', () => {
      for (const [name, output] of Object.entries(template.Outputs)) {
        expect((output as any).Description).toBeDefined();
      }
    });

    test('outputs should have Export names with EnvironmentSuffix', () => {
      for (const [name, output] of Object.entries(template.Outputs)) {
        const out = output as any;
        if (out.Export) {
          expect(out.Export.Name['Fn::Sub']).toContain('EnvironmentSuffix');
        }
      }
    });

    test('output references should be valid', () => {
      const result = validator.validateOutputReferences();
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});

describe('CloudFormation Validator', () => {
  let validator: CloudFormationValidator;
  const templatePath = path.join(__dirname, '../lib/TapStack.json');

  beforeAll(() => {
    validator = new CloudFormationValidator(templatePath);
  });

  test('should create validator instance successfully', () => {
    expect(validator).toBeDefined();
  });

  test('should throw error for non-existent template file', () => {
    expect(() => {
      new CloudFormationValidator('/non/existent/file.json');
    }).toThrow('Template file not found');
  });

  test('should validate template successfully', () => {
    const result: ValidationResult = validator.validateTemplate();
    expect(result).toBeDefined();
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('should return correct resource count', () => {
    const resourceCount = validator.getResourceCount();
    expect(resourceCount).toBe(64);
  });

  test('should get resources by type', () => {
    const s3Buckets = validator.getResourcesByType('AWS::S3::Bucket');
    expect(s3Buckets).toContain('LoggingBucket');
    expect(s3Buckets).toContain('AppDataBucket');

    const vpcs = validator.getResourcesByType('AWS::EC2::VPC');
    expect(vpcs).toContain('VPC');

    const rdsInstances = validator.getResourcesByType('AWS::RDS::DBInstance');
    expect(rdsInstances).toContain('RDSInstance');
  });

  test('should check for specific outputs', () => {
    expect(validator.hasOutput('VPC')).toBe(true);
    expect(validator.hasOutput('ApplicationLoadBalancerDNS')).toBe(true);
    expect(validator.hasOutput('RDSEndpoint')).toBe(true);
    expect(validator.hasOutput('NonExistentOutput')).toBe(false);
  });

  test('should get template object', () => {
    const templateObj = validator.getTemplate();
    expect(templateObj).toBeDefined();
    expect(templateObj.AWSTemplateFormatVersion).toBe('2010-09-09');
    expect(templateObj.Resources).toBeDefined();
  });
});

describe('Validator Utility Functions', () => {
  const templatePath = path.join(__dirname, '../lib/TapStack.json');

  test('validateTemplateFile should work correctly', () => {
    const result = validateTemplateFile(templatePath);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('validateTemplateFile should handle non-existent file', () => {
    const result = validateTemplateFile('/non/existent/file.json');
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  test('getTemplateResources should return resource list', () => {
    const resources = getTemplateResources(templatePath);
    expect(resources.length).toBe(64);
    expect(resources).toContain('VPC');
    expect(resources).toContain('RDSInstance');
  });
});

describe('Security Best Practices', () => {
  let validator: CloudFormationValidator;
  const templatePath = path.join(__dirname, '../lib/TapStack.json');

  beforeAll(() => {
    validator = new CloudFormationValidator(templatePath);
  });

  test('should validate all security requirements', () => {
    const result = validator.validateTemplate();
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('S3 buckets should have encryption', () => {
    const s3Buckets = validator.getResourcesByType('AWS::S3::Bucket');
    const template = validator.getTemplate();

    for (const bucketName of s3Buckets) {
      const bucket = template.Resources[bucketName];
      if (bucketName === 'AppDataBucket') {
        expect(bucket.Properties.BucketEncryption).toBeDefined();
      }
    }
  });

  test('RDS instances should have encryption', () => {
    const template = validator.getTemplate();
    expect(template.Resources.RDSInstance.Properties.StorageEncrypted).toBe(
      true
    );
    expect(template.Resources.RDSInstance.Properties.KmsKeyId).toBeDefined();
  });

  test('should not have deletion protection enabled', () => {
    const template = validator.getTemplate();
    expect(
      template.Resources.RDSInstance.Properties.DeletionProtection
    ).toBe(false);
  });

  test('should use Secrets Manager for RDS passwords', () => {
    const template = validator.getTemplate();
    const masterPassword =
      template.Resources.RDSInstance.Properties.MasterUserPassword;
    expect(masterPassword['Fn::Sub']).toContain('resolve:secretsmanager');
  });

  test('EC2 instances should use IMDSv2', () => {
    const template = validator.getTemplate();
    const metadataOptions =
      template.Resources.WebAppLaunchTemplate.Properties.LaunchTemplateData
        .MetadataOptions;
    expect(metadataOptions.HttpTokens).toBe('required');
  });

  test('EBS volumes should be encrypted', () => {
    const template = validator.getTemplate();
    const blockDevices =
      template.Resources.WebAppLaunchTemplate.Properties.LaunchTemplateData
        .BlockDeviceMappings;
    expect(blockDevices[0].Ebs.Encrypted).toBe(true);
  });
});

describe('Edge Cases and Error Handling', () => {
  test('should handle template without format version', () => {
    const invalidTemplate = {
      Resources: { Test: { Type: 'AWS::S3::Bucket', Properties: {} } },
    };
    const tempPath = path.join(__dirname, '../temp-no-version.json');
    fs.writeFileSync(tempPath, JSON.stringify(invalidTemplate));

    try {
      const validator = new CloudFormationValidator(tempPath);
      const result = validator.validateTemplate();
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing AWSTemplateFormatVersion');
    } finally {
      fs.unlinkSync(tempPath);
    }
  });

  test('should handle template without resources', () => {
    const invalidTemplate = { AWSTemplateFormatVersion: '2010-09-09' };
    const tempPath = path.join(__dirname, '../temp-no-resources.json');
    fs.writeFileSync(tempPath, JSON.stringify(invalidTemplate));

    try {
      const validator = new CloudFormationValidator(tempPath);
      const result = validator.validateTemplate();
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Template must contain at least one resource'
      );
    } finally {
      fs.unlinkSync(tempPath);
    }
  });

  test('should identify S3 bucket without encryption', () => {
    const template = {
      AWSTemplateFormatVersion: '2010-09-09',
      Resources: {
        Bucket: {
          Type: 'AWS::S3::Bucket',
          Properties: { BucketName: 'test' },
        },
      },
    };
    const tempPath = path.join(__dirname, '../temp-unencrypted-s3.json');
    fs.writeFileSync(tempPath, JSON.stringify(template));

    try {
      const validator = new CloudFormationValidator(tempPath);
      const result = validator.validateTemplate();
      expect(result.isValid).toBe(false);
      expect(
        result.errors.some((e) => e.includes('encryption enabled'))
      ).toBe(true);
    } finally {
      fs.unlinkSync(tempPath);
    }
  });

  test('should identify RDS without encryption', () => {
    const template = {
      AWSTemplateFormatVersion: '2010-09-09',
      Resources: {
        DB: {
          Type: 'AWS::RDS::DBInstance',
          Properties: { Engine: 'mysql', StorageEncrypted: false },
        },
      },
    };
    const tempPath = path.join(__dirname, '../temp-unencrypted-rds.json');
    fs.writeFileSync(tempPath, JSON.stringify(template));

    try {
      const validator = new CloudFormationValidator(tempPath);
      const result = validator.validateTemplate();
      expect(result.isValid).toBe(false);
      expect(
        result.errors.some((e) => e.includes('storage encryption'))
      ).toBe(true);
    } finally {
      fs.unlinkSync(tempPath);
    }
  });
});

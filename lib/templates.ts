import * as fs from 'fs';
import * as path from 'path';
const yamlCfn = require('yaml-cfn');

/**
 * Load and export CloudFormation templates for testing and coverage
 */

export function loadPipelineTemplate(): any {
  const pipelinePath = path.join(__dirname, 'pipeline.yaml');
  const pipelineYaml = fs.readFileSync(pipelinePath, 'utf8');
  return yamlCfn.yamlParse(pipelineYaml);
}

export function loadCrossAccountTemplate(): any {
  const crossAccountPath = path.join(__dirname, 'cross-account-role.yaml');
  const crossAccountYaml = fs.readFileSync(crossAccountPath, 'utf8');
  return yamlCfn.yamlParse(crossAccountYaml);
}

export function validatePipelineTemplate(template: any): boolean {
  // Validate basic template structure
  if (!template.AWSTemplateFormatVersion) return false;
  if (!template.Resources) return false;
  if (!template.Parameters) return false;
  if (!template.Outputs) return false;

  // Validate required parameters
  const requiredParams = ['EnvironmentSuffix', 'StagingAccountId', 'ProductionAccountId',
                          'SourceRepositoryName', 'SourceBranchName', 'ArtifactRetentionDays'];
  for (const param of requiredParams) {
    if (!template.Parameters[param]) return false;
  }

  // Validate required resources
  const requiredResources = ['ArtifactEncryptionKey', 'ArtifactBucket', 'CodePipeline',
                             'CodePipelineServiceRole', 'CodeBuildServiceRole',
                             'UnitTestProject', 'SecurityScanProject',
                             'PipelineNotificationTopic', 'PipelineStateChangeRule'];
  for (const resource of requiredResources) {
    if (!template.Resources[resource]) return false;
  }

  // Validate required outputs
  const requiredOutputs = ['PipelineName', 'ArtifactBucketName', 'KMSKeyId', 'NotificationTopicArn'];
  for (const output of requiredOutputs) {
    if (!template.Outputs[output]) return false;
  }

  return true;
}

export function validateCrossAccountTemplate(template: any): boolean {
  // Validate basic template structure
  if (!template.AWSTemplateFormatVersion) return false;
  if (!template.Resources) return false;
  if (!template.Parameters) return false;
  if (!template.Outputs) return false;

  // Validate required parameters
  const requiredParams = ['EnvironmentSuffix', 'PipelineAccountId', 'ArtifactBucketName', 'KMSKeyArn'];
  for (const param of requiredParams) {
    if (!template.Parameters[param]) return false;
  }

  // Validate required resources
  if (!template.Resources.CrossAccountDeployRole) return false;

  // Validate required outputs
  if (!template.Outputs.CrossAccountRoleArn) return false;

  return true;
}

export function checkEnvironmentSuffixUsage(template: any): { passed: boolean; resources: string[] } {
  const resourcesWithSuffix: string[] = [];
  const resources = template.Resources || {};

  for (const [resourceName, resource] of Object.entries(resources)) {
    const res = resource as any;
    const props = res.Properties || {};

    // Check common name properties
    const nameProps = ['Name', 'RoleName', 'TopicName', 'BucketName', 'AliasName'];
    for (const prop of nameProps) {
      if (props[prop]) {
        const nameValue = props[prop];
        if (typeof nameValue === 'object' && nameValue['Fn::Sub']) {
          const subValue = nameValue['Fn::Sub'];
          if (subValue.includes('${EnvironmentSuffix}')) {
            resourcesWithSuffix.push(resourceName);
            break;
          }
        }
      }
    }
  }

  return {
    passed: resourcesWithSuffix.length > 0,
    resources: resourcesWithSuffix
  };
}

export function checkNoDeletionPolicyRetain(template: any): { passed: boolean; violators: string[] } {
  const violators: string[] = [];
  const resources = template.Resources || {};

  for (const [resourceName, resource] of Object.entries(resources)) {
    const res = resource as any;
    if (res.DeletionPolicy === 'Retain' || res.UpdateReplacePolicy === 'Retain') {
      violators.push(resourceName);
    }
  }

  return {
    passed: violators.length === 0,
    violators
  };
}

export function getResourceCount(template: any): number {
  return Object.keys(template.Resources || {}).length;
}

export function getOutputCount(template: any): number {
  return Object.keys(template.Outputs || {}).length;
}

export function getParameterCount(template: any): number {
  return Object.keys(template.Parameters || {}).length;
}

export function hasKMSEncryption(template: any): boolean {
  const resources = template.Resources || {};
  for (const [_, resource] of Object.entries(resources)) {
    const res = resource as any;
    if (res.Type === 'AWS::KMS::Key') {
      return res.Properties?.EnableKeyRotation === true;
    }
  }
  return false;
}

export function hasS3Versioning(template: any): boolean {
  const resources = template.Resources || {};
  for (const [_, resource] of Object.entries(resources)) {
    const res = resource as any;
    if (res.Type === 'AWS::S3::Bucket') {
      return res.Properties?.VersioningConfiguration?.Status === 'Enabled';
    }
  }
  return false;
}

export function hasPublicAccessBlock(template: any): boolean {
  const resources = template.Resources || {};
  for (const [_, resource] of Object.entries(resources)) {
    const res = resource as any;
    if (res.Type === 'AWS::S3::Bucket') {
      const block = res.Properties?.PublicAccessBlockConfiguration;
      return block?.BlockPublicAcls === true &&
             block?.BlockPublicPolicy === true &&
             block?.IgnorePublicAcls === true &&
             block?.RestrictPublicBuckets === true;
    }
  }
  return false;
}

export function getPipelineStageCount(template: any): number {
  const resources = template.Resources || {};
  for (const [_, resource] of Object.entries(resources)) {
    const res = resource as any;
    if (res.Type === 'AWS::CodePipeline::Pipeline') {
      return res.Properties?.Stages?.length || 0;
    }
  }
  return 0;
}

export function hasManualApprovalStage(template: any): boolean {
  const resources = template.Resources || {};
  for (const [_, resource] of Object.entries(resources)) {
    const res = resource as any;
    if (res.Type === 'AWS::CodePipeline::Pipeline') {
      const stages = res.Properties?.Stages || [];
      return stages.some((stage: any) =>
        stage.Actions?.some((action: any) =>
          action.ActionTypeId?.Provider === 'Manual'
        )
      );
    }
  }
  return false;
}

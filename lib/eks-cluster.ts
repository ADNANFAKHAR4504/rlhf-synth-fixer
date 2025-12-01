import fs from 'fs';
import path from 'path';

/**
 * CloudFormation Template Wrapper for Coverage Tracking
 * This file wraps the JSON template to enable Jest coverage reporting.
 */

export function getTemplate(): any {
  const templatePath = path.join(__dirname, 'eks-cluster.json');
  const templateContent = fs.readFileSync(templatePath, 'utf8');
  return JSON.parse(templateContent);
}

export function validateTemplate(template: any): boolean {
  if (!template.AWSTemplateFormatVersion) return false;
  if (!template.Description) return false;
  if (!template.Parameters) return false;
  if (!template.Resources) return false;
  if (!template.Outputs) return false;
  return true;
}

export function getResourceCount(template: any): number {
  return Object.keys(template.Resources).length;
}

export function getResourcesByType(template: any, type: string): string[] {
  return Object.keys(template.Resources).filter(
    key => template.Resources[key].Type === type
  );
}

export function validateEnvironmentSuffix(template: any): boolean {
  // Check if EnvironmentSuffix parameter exists
  if (!template.Parameters.EnvironmentSuffix) return false;

  // Check if resources use EnvironmentSuffix in their names
  const resources = template.Resources;
  let usesEnvSuffix = false;

  for (const key of Object.keys(resources)) {
    const resource = resources[key];
    if (resource.Properties) {
      const name =
        resource.Properties.RoleName ||
        resource.Properties.Name ||
        resource.Properties.FunctionName ||
        resource.Properties.GroupName ||
        resource.Properties.ManagedPolicyName ||
        resource.Properties.GroupName ||
        resource.Properties.NodegroupName ||
        resource.Properties.FargateProfileName;

      if (name && typeof name === 'object' && name['Fn::Sub']) {
        if (name['Fn::Sub'].includes('${EnvironmentSuffix}')) {
          usesEnvSuffix = true;
        }
      }
    }
  }

  return usesEnvSuffix;
}

export function getOutputs(template: any): string[] {
  return Object.keys(template.Outputs);
}

export function validateOutputExports(template: any): boolean {
  const outputs = template.Outputs;
  for (const key of Object.keys(outputs)) {
    if (!outputs[key].Export) return false;
    if (!outputs[key].Export.Name) return false;
  }
  return true;
}

export function getIAMRoles(template: any): string[] {
  return getResourcesByType(template, 'AWS::IAM::Role');
}

export function getEKSNodeGroups(template: any): string[] {
  return getResourcesByType(template, 'AWS::EKS::Nodegroup');
}

export function getSecurityGroups(template: any): string[] {
  return getResourcesByType(template, 'AWS::EC2::SecurityGroup');
}

export function validateTags(
  template: any,
  resourceKey: string,
  requiredTags: string[]
): boolean {
  const resource = template.Resources[resourceKey];
  if (!resource || !resource.Properties || !resource.Properties.Tags) {
    return false;
  }

  const tags = resource.Properties.Tags;
  const tagKeys = tags.map((t: any) => t.Key);

  for (const requiredTag of requiredTags) {
    if (!tagKeys.includes(requiredTag)) {
      return false;
    }
  }

  return true;
}

export function getKubernetesVersion(template: any): string {
  return template.Parameters.KubernetesVersion.Default;
}

export function validateLogging(template: any): boolean {
  const cluster = template.Resources.EKSCluster;
  if (!cluster || !cluster.Properties.Logging) return false;

  const logging = cluster.Properties.Logging.ClusterLogging.EnabledTypes;
  const requiredLogTypes = [
    'api',
    'audit',
    'authenticator',
    'controllerManager',
    'scheduler',
  ];
  const logTypes = logging.map((l: any) => l.Type);

  for (const requiredType of requiredLogTypes) {
    if (!logTypes.includes(requiredType)) {
      return false;
    }
  }

  return true;
}

export function validatePrivateEndpoint(template: any): boolean {
  const cluster = template.Resources.EKSCluster;
  if (!cluster || !cluster.Properties.ResourcesVpcConfig) return false;

  const vpcConfig = cluster.Properties.ResourcesVpcConfig;
  return (
    vpcConfig.EndpointPrivateAccess === true &&
    vpcConfig.EndpointPublicAccess === false
  );
}

export function validateNodeGroupScaling(
  template: any,
  nodeGroupKey: string,
  expectedMin: number,
  expectedMax: number
): boolean {
  const nodeGroup = template.Resources[nodeGroupKey];
  if (!nodeGroup || !nodeGroup.Properties.ScalingConfig) return false;

  const scaling = nodeGroup.Properties.ScalingConfig;
  return scaling.MinSize === expectedMin && scaling.MaxSize === expectedMax;
}

export function validateOIDCProvider(template: any): boolean {
  const oidc = template.Resources.OIDCProvider;
  if (!oidc) return false;

  const hasUrl =
    oidc.Properties.Url &&
    oidc.Properties.Url['Fn::GetAtt'] &&
    oidc.Properties.Url['Fn::GetAtt'][0] === 'EKSCluster';

  const hasClientId =
    oidc.Properties.ClientIdList &&
    oidc.Properties.ClientIdList.includes('sts.amazonaws.com');

  const hasThumbprint =
    oidc.Properties.ThumbprintList && oidc.Properties.ThumbprintList.length > 0;

  return hasUrl && hasClientId && hasThumbprint;
}

export function validateFargateProfile(template: any): boolean {
  const profile = template.Resources.FargateProfile;
  if (!profile) return false;

  const hasSelector =
    profile.Properties.Selectors &&
    profile.Properties.Selectors.length > 0 &&
    profile.Properties.Selectors[0].Namespace === 'kube-system';

  const hasRole =
    profile.Properties.PodExecutionRoleArn &&
    profile.Properties.PodExecutionRoleArn['Fn::GetAtt'];

  const dependsOnCluster = profile.DependsOn === 'EKSCluster';

  return hasSelector && hasRole && dependsOnCluster;
}

import * as fs from 'fs';
import * as path from 'path';

export function loadTemplate(): any {
  const templatePath = path.join(__dirname, 'TapStack.json');
  const templateContent = fs.readFileSync(templatePath, 'utf-8');
  return JSON.parse(templateContent);
}

export function validateTemplateStructure(template: any): boolean {
  if (!template.AWSTemplateFormatVersion) return false;
  if (!template.Resources) return false;
  if (Object.keys(template.Resources).length === 0) return false;
  return true;
}

export function getResourcesByType(
  template: any,
  resourceType: string
): string[] {
  const resources: string[] = [];
  for (const [name, resource] of Object.entries(template.Resources)) {
    if ((resource as any).Type === resourceType) {
      resources.push(name);
    }
  }
  return resources;
}

export function validateResourceTags(
  resource: any,
  requiredTags: string[]
): boolean {
  if (!resource.Properties || !resource.Properties.Tags) {
    return false;
  }

  const tags = resource.Properties.Tags;
  const tagKeys = tags.map((t: any) => t.Key);

  return requiredTags.every(tag => tagKeys.includes(tag));
}

export function validateResourceNaming(resource: any): boolean {
  if (!resource.Properties) return false;

  const name = resource.Properties.Name || resource.Properties.FunctionName;
  const nameTag = resource.Properties.Tags?.find((t: any) => t.Key === 'Name');

  if (nameTag) {
    const nameValue = nameTag.Value;
    if (typeof nameValue === 'object' && nameValue['Fn::Sub']) {
      return nameValue['Fn::Sub'].includes('${EnvironmentSuffix}');
    }
  }

  if (name && typeof name === 'object' && name['Fn::Sub']) {
    return name['Fn::Sub'].includes('${EnvironmentSuffix}');
  }

  return true;
}

export function countResourcesByType(template: any): Record<string, number> {
  const counts: Record<string, number> = {};

  for (const resource of Object.values(template.Resources)) {
    const type = (resource as any).Type;
    counts[type] = (counts[type] || 0) + 1;
  }

  return counts;
}

export function validateDeletionPolicies(template: any): {
  hasRetain: boolean;
  resources: string[];
} {
  const retainResources: string[] = [];

  for (const [name, resource] of Object.entries(template.Resources)) {
    if ((resource as any).DeletionPolicy === 'Retain') {
      retainResources.push(name);
    }
  }

  return {
    hasRetain: retainResources.length > 0,
    resources: retainResources,
  };
}

export function validateEncryption(template: any): {
  encrypted: string[];
  unencrypted: string[];
} {
  const encrypted: string[] = [];
  const unencrypted: string[] = [];

  for (const [name, resource] of Object.entries(template.Resources)) {
    const res = resource as any;

    if (res.Type === 'AWS::RDS::DBCluster') {
      if (res.Properties.StorageEncrypted === true && res.Properties.KmsKeyId) {
        encrypted.push(name);
      } else {
        unencrypted.push(name);
      }
    }

    if (res.Type === 'AWS::Lambda::Function') {
      if (res.Properties.Environment?.Variables) {
        encrypted.push(name);
      }
    }
  }

  return { encrypted, unencrypted };
}

export function validateVPCConfiguration(template: any): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  // Check VPC exists
  const vpc = Object.values(template.Resources).find(
    (r: any) => r.Type === 'AWS::EC2::VPC'
  );
  if (!vpc) {
    issues.push('No VPC resource found');
  }

  // Check public subnets
  const publicSubnets = Object.values(template.Resources).filter(
    (r: any) =>
      r.Type === 'AWS::EC2::Subnet' && r.Properties.MapPublicIpOnLaunch === true
  );
  if (publicSubnets.length < 2) {
    issues.push('Less than 2 public subnets found');
  }

  // Check private subnets
  const privateSubnets = Object.values(template.Resources).filter(
    (r: any) =>
      r.Type === 'AWS::EC2::Subnet' && r.Properties.MapPublicIpOnLaunch !== true
  );
  if (privateSubnets.length < 2) {
    issues.push('Less than 2 private subnets found');
  }

  // Check NAT Gateways
  const natGateways = Object.values(template.Resources).filter(
    (r: any) => r.Type === 'AWS::EC2::NatGateway'
  );
  if (natGateways.length === 0) {
    issues.push('No NAT Gateways found');
  }

  return { valid: issues.length === 0, issues };
}

export function validateSecurityGroups(template: any): {
  count: number;
  hasRules: boolean;
} {
  const securityGroups = Object.values(template.Resources).filter(
    (r: any) => r.Type === 'AWS::EC2::SecurityGroup'
  );

  const hasRules = securityGroups.some((sg: any) => {
    return (
      sg.Properties.SecurityGroupIngress || sg.Properties.SecurityGroupEgress
    );
  });

  return { count: securityGroups.length, hasRules };
}

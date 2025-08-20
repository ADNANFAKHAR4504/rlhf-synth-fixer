import * as fs from 'fs';
import * as yaml from 'js-yaml';

export interface CloudFormationTemplate {
  AWSTemplateFormatVersion: string;
  Description?: string;
  Metadata?: any;
  Parameters?: Record<string, any>;
  Mappings?: Record<string, any>;
  Conditions?: Record<string, any>;
  Resources: Record<string, any>;
  Outputs?: Record<string, any>;
}

export class TemplateValidator {
  private template: CloudFormationTemplate;

  constructor(templatePath: string) {
    const content = fs.readFileSync(templatePath, 'utf8');
    if (templatePath.endsWith('.yaml') || templatePath.endsWith('.yml')) {
      this.template = yaml.load(content) as CloudFormationTemplate;
    } else {
      this.template = JSON.parse(content) as CloudFormationTemplate;
    }
  }

  getTemplate(): CloudFormationTemplate {
    return this.template;
  }

  validateFormat(): boolean {
    return this.template.AWSTemplateFormatVersion === '2010-09-09';
  }

  hasDescription(): boolean {
    return !!this.template.Description;
  }

  getResourceCount(): number {
    return Object.keys(this.template.Resources).length;
  }

  getParameterCount(): number {
    return this.template.Parameters
      ? Object.keys(this.template.Parameters).length
      : 0;
  }

  getOutputCount(): number {
    return this.template.Outputs
      ? Object.keys(this.template.Outputs).length
      : 0;
  }

  hasResource(logicalId: string): boolean {
    return !!this.template.Resources[logicalId];
  }

  getResourceType(logicalId: string): string | undefined {
    const resource = this.template.Resources[logicalId];
    return resource ? resource.Type : undefined;
  }

  hasParameter(parameterName: string): boolean {
    return !!(
      this.template.Parameters && this.template.Parameters[parameterName]
    );
  }

  hasOutput(outputName: string): boolean {
    return !!(this.template.Outputs && this.template.Outputs[outputName]);
  }

  validateSecurityGroups(): boolean {
    const securityGroups = Object.entries(this.template.Resources).filter(
      ([_, resource]) => resource.Type === 'AWS::EC2::SecurityGroup'
    );

    return securityGroups.every(([_, sg]) => {
      return (
        sg.Properties &&
        sg.Properties.GroupDescription &&
        (sg.Properties.SecurityGroupIngress ||
          sg.Properties.SecurityGroupEgress)
      );
    });
  }

  validateIAMRoles(): boolean {
    const iamRoles = Object.entries(this.template.Resources).filter(
      ([_, resource]) => resource.Type === 'AWS::IAM::Role'
    );

    return iamRoles.every(([_, role]) => {
      return role.Properties && role.Properties.AssumeRolePolicyDocument;
    });
  }

  validateTags(expectedTag: { Key: string; Value: string }): boolean {
    const taggedResources = Object.entries(this.template.Resources).filter(
      ([_, resource]) => resource.Properties && resource.Properties.Tags
    );

    if (taggedResources.length === 0) return false;

    return taggedResources.every(([_, resource]) => {
      const tags = resource.Properties.Tags;
      return tags.some(
        (tag: any) =>
          tag.Key === expectedTag.Key && tag.Value === expectedTag.Value
      );
    });
  }

  validateHighAvailability(): boolean {
    const hasMultiAZDatabase = Object.entries(this.template.Resources)
      .filter(([_, resource]) => resource.Type === 'AWS::RDS::DBInstance')
      .some(([_, db]) => db.Properties && db.Properties.MultiAZ === true);

    const hasMultipleSubnets =
      Object.entries(this.template.Resources).filter(
        ([_, resource]) => resource.Type === 'AWS::EC2::Subnet'
      ).length >= 2;

    return hasMultiAZDatabase && hasMultipleSubnets;
  }

  validateEncryption(): boolean {
    // Check RDS encryption
    const rdsEncrypted = Object.entries(this.template.Resources)
      .filter(([_, resource]) => resource.Type === 'AWS::RDS::DBInstance')
      .every(
        ([_, db]) => db.Properties && db.Properties.StorageEncrypted === true
      );

    // Check S3 encryption
    const s3Encrypted = Object.entries(this.template.Resources)
      .filter(([_, resource]) => resource.Type === 'AWS::S3::Bucket')
      .every(([_, bucket]) => {
        if (!bucket.Properties || !bucket.Properties.BucketEncryption)
          return false;
        const config =
          bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration;
        return config && config[0] && config[0].ServerSideEncryptionByDefault;
      });

    return rdsEncrypted && s3Encrypted;
  }

  validateDeletionPolicies(): boolean {
    // Ensure no critical resources have Retain deletion policy
    const criticalResources = Object.entries(this.template.Resources).filter(
      ([_, resource]) =>
        resource.Type === 'AWS::RDS::DBInstance' ||
        resource.Type === 'AWS::S3::Bucket'
    );

    return criticalResources.every(
      ([_, resource]) => resource.DeletionPolicy !== 'Retain'
    );
  }

  validateAutoScaling(): boolean {
    const asgResources = Object.entries(this.template.Resources).filter(
      ([_, resource]) => resource.Type === 'AWS::AutoScaling::AutoScalingGroup'
    );

    return asgResources.every(([_, asg]) => {
      const props = asg.Properties;
      return (
        props &&
        props.MinSize >= 2 &&
        props.MaxSize >= props.MinSize &&
        props.HealthCheckType === 'ELB'
      );
    });
  }

  validateLoadBalancer(): boolean {
    const albResources = Object.entries(this.template.Resources).filter(
      ([_, resource]) =>
        resource.Type === 'AWS::ElasticLoadBalancingV2::LoadBalancer'
    );

    return albResources.every(([_, alb]) => {
      const props = alb.Properties;
      return (
        props &&
        props.Type === 'application' &&
        props.Scheme &&
        props.Subnets &&
        props.Subnets.length >= 2
      );
    });
  }

  validateCloudWatchAlarms(): boolean {
    const alarms = Object.entries(this.template.Resources).filter(
      ([_, resource]) => resource.Type === 'AWS::CloudWatch::Alarm'
    );

    return (
      alarms.length > 0 &&
      alarms.every(([_, alarm]) => {
        const props = alarm.Properties;
        return (
          props &&
          props.MetricName &&
          props.Threshold !== undefined &&
          props.ComparisonOperator &&
          props.EvaluationPeriods > 0
        );
      })
    );
  }

  getValidationSummary(): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!this.validateFormat()) {
      errors.push('Invalid CloudFormation template format version');
    }

    if (!this.hasDescription()) {
      warnings.push('Template lacks a description');
    }

    if (this.getResourceCount() === 0) {
      errors.push('Template has no resources defined');
    }

    if (!this.validateSecurityGroups()) {
      errors.push('One or more security groups are improperly configured');
    }

    if (!this.validateIAMRoles()) {
      errors.push('One or more IAM roles are missing AssumeRolePolicyDocument');
    }

    if (!this.validateEncryption()) {
      warnings.push('Not all storage resources are encrypted');
    }

    if (!this.validateDeletionPolicies()) {
      errors.push('Critical resources have Retain deletion policy');
    }

    if (!this.validateHighAvailability()) {
      warnings.push('High availability not fully configured');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}

export function validateTemplate(templatePath: string): TemplateValidator {
  return new TemplateValidator(templatePath);
}

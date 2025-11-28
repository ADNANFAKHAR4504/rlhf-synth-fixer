import fs from 'fs';
import path from 'path';

export interface CloudFormationTemplate {
  AWSTemplateFormatVersion: string;
  Description: string;
  Parameters: Record<string, any>;
  Resources: Record<string, any>;
  Outputs: Record<string, any>;
}

export class TemplateValidator {
  private template: CloudFormationTemplate;

  constructor(templatePath: string) {
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    this.template = JSON.parse(templateContent);
  }

  public getTemplate(): CloudFormationTemplate {
    return this.template;
  }

  public validateFormatVersion(): boolean {
    return this.template.AWSTemplateFormatVersion === '2010-09-09';
  }

  public validateDescription(): boolean {
    return typeof this.template.Description === 'string' && this.template.Description.length > 0;
  }

  public getResourceCount(): number {
    return Object.keys(this.template.Resources).length;
  }

  public getParameterCount(): number {
    return Object.keys(this.template.Parameters).length;
  }

  public getOutputCount(): number {
    return Object.keys(this.template.Outputs).length;
  }

  public hasResource(resourceName: string): boolean {
    return resourceName in this.template.Resources;
  }

  public getResource(resourceName: string): any {
    return this.template.Resources[resourceName];
  }

  public getResourceType(resourceName: string): string | null {
    const resource = this.getResource(resourceName);
    return resource ? resource.Type : null;
  }

  public hasParameter(parameterName: string): boolean {
    return parameterName in this.template.Parameters;
  }

  public getParameter(parameterName: string): any {
    return this.template.Parameters[parameterName];
  }

  public hasOutput(outputName: string): boolean {
    return outputName in this.template.Outputs;
  }

  public getOutput(outputName: string): any {
    return this.template.Outputs[outputName];
  }

  public validateResourcesHaveEnvironmentSuffix(): { passed: boolean; missingResources: string[] } {
    const missingResources: string[] = [];

    // Resources that don't support naming or are attachments/associations
    const excludedResources = [
      'AttachGateway',
      'KMSKey',
      'PublicRoute',
      'AuroraDBClusterParameterGroup',
      'PublicSubnet1RouteTableAssociation',
      'PublicSubnet2RouteTableAssociation',
      'PublicSubnet3RouteTableAssociation',
      'PrivateSubnet1RouteTableAssociation',
      'PrivateSubnet2RouteTableAssociation',
      'PrivateSubnet3RouteTableAssociation'
    ];

    for (const [resourceName, resource] of Object.entries(this.template.Resources)) {
      if (excludedResources.includes(resourceName)) {
        continue;
      }

      const resourceStr = JSON.stringify(resource);
      if (!resourceStr.includes('${EnvironmentSuffix}') && !resourceStr.includes('EnvironmentSuffix')) {
        missingResources.push(resourceName);
      }
    }

    return {
      passed: missingResources.length === 0,
      missingResources
    };
  }

  public validateKMSEncryption(): boolean {
    const auroraCluster = this.getResource('AuroraDBCluster');
    const dmsInstance = this.getResource('DMSReplicationInstance');

    if (!auroraCluster || !dmsInstance) {
      return false;
    }

    return auroraCluster.Properties.StorageEncrypted === true &&
           auroraCluster.Properties.KmsKeyId !== undefined &&
           dmsInstance.Properties.KmsKeyId !== undefined;
  }

  public validateSSLRequirement(): boolean {
    const sourceEndpoint = this.getResource('DMSSourceEndpoint');
    const targetEndpoint = this.getResource('DMSTargetEndpoint');
    const paramGroup = this.getResource('AuroraDBClusterParameterGroup');

    if (!sourceEndpoint || !targetEndpoint || !paramGroup) {
      return false;
    }

    return sourceEndpoint.Properties.SslMode === 'require' &&
           targetEndpoint.Properties.SslMode === 'require' &&
           paramGroup.Properties.Parameters['rds.force_ssl'] === '1';
  }

  public validateMultiAZDeployment(): boolean {
    const privateSubnets = ['PrivateSubnet1', 'PrivateSubnet2', 'PrivateSubnet3'];

    for (const subnetName of privateSubnets) {
      if (!this.hasResource(subnetName)) {
        return false;
      }
    }

    const instances = ['AuroraDBInstance1', 'AuroraDBInstance2', 'AuroraDBInstance3'];
    for (const instanceName of instances) {
      if (!this.hasResource(instanceName)) {
        return false;
      }
    }

    return true;
  }

  public validateDeletionPolicies(): boolean {
    const rdsResources = ['AuroraDBCluster', 'AuroraDBInstance1', 'AuroraDBInstance2', 'AuroraDBInstance3'];

    for (const resourceName of rdsResources) {
      const resource = this.getResource(resourceName);
      if (!resource || resource.DeletionPolicy !== 'Snapshot') {
        return false;
      }
    }

    return true;
  }

  public validateCloudWatchAlarmThreshold(): boolean {
    const alarm = this.getResource('DMSReplicationLagAlarm');
    if (!alarm) {
      return false;
    }
    return alarm.Properties.Threshold === 300;
  }

  public validateRoute53WeightedRouting(): boolean {
    const onPremRecord = this.getResource('Route53OnPremRecordSet');
    const auroraRecord = this.getResource('Route53AuroraRecordSet');

    if (!onPremRecord || !auroraRecord) {
      return false;
    }

    return onPremRecord.Properties.Weight === 100 &&
           auroraRecord.Properties.Weight === 0 &&
           onPremRecord.Properties.SetIdentifier === 'OnPremises' &&
           auroraRecord.Properties.SetIdentifier === 'Aurora';
  }

  public validateParameterStore(): boolean {
    const onPremParam = this.getResource('OnPremDBPasswordParameter');
    const auroraParam = this.getResource('AuroraDBPasswordParameter');

    if (!onPremParam || !auroraParam) {
      return false;
    }

    return onPremParam.Type === 'AWS::SSM::Parameter' &&
           onPremParam.Properties.Type === 'SecureString' &&
           auroraParam.Type === 'AWS::SSM::Parameter' &&
           auroraParam.Properties.Type === 'SecureString';
  }

  public validateDMSConfiguration(): boolean {
    const replicationInstance = this.getResource('DMSReplicationInstance');
    const replicationTask = this.getResource('DMSReplicationTask');

    if (!replicationInstance || !replicationTask) {
      return false;
    }

    const taskSettings = JSON.parse(replicationTask.Properties.ReplicationTaskSettings);

    return replicationInstance.Properties.ReplicationInstanceClass === 'dms.t3.medium' &&
           replicationTask.Properties.MigrationType === 'full-load-and-cdc' &&
           taskSettings.ValidationSettings.EnableValidation === true;
  }

  public getAllValidations(): Record<string, boolean> {
    return {
      formatVersion: this.validateFormatVersion(),
      description: this.validateDescription(),
      kmsEncryption: this.validateKMSEncryption(),
      sslRequirement: this.validateSSLRequirement(),
      multiAZ: this.validateMultiAZDeployment(),
      deletionPolicies: this.validateDeletionPolicies(),
      cloudWatchAlarm: this.validateCloudWatchAlarmThreshold(),
      route53Routing: this.validateRoute53WeightedRouting(),
      parameterStore: this.validateParameterStore(),
      dmsConfiguration: this.validateDMSConfiguration()
    };
  }
}

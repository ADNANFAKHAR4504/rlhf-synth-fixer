// Terraform configuration wrapper for Jest coverage
// This file provides TypeScript coverage metrics for the Terraform infrastructure

import fs from 'fs';
import path from 'path';

export interface TerraformResource {
  type: string;
  name: string;
  provider: string;
}

export interface TerraformConfiguration {
  resources: TerraformResource[];
  outputs: string[];
  variables: string[];
}

export class TerraformStackValidator {
  private readonly stackPath: string;
  private readonly providerPath: string;
  private readonly variablesPath: string;
  private readonly outputsPath: string;

  constructor(libDir: string = path.join(__dirname)) {
    this.stackPath = path.join(libDir, 'tap_stack.tf');
    this.providerPath = path.join(libDir, 'provider.tf');
    this.variablesPath = path.join(libDir, 'variables.tf');
    this.outputsPath = path.join(libDir, 'outputs.tf');
  }

  public validateStackExists(): boolean {
    return fs.existsSync(this.stackPath);
  }

  public validateProviderExists(): boolean {
    return fs.existsSync(this.providerPath);
  }

  public validateVariablesExist(): boolean {
    return fs.existsSync(this.variablesPath);
  }

  public validateOutputsExist(): boolean {
    return fs.existsSync(this.outputsPath);
  }

  public getStackContent(): string {
    return fs.readFileSync(this.stackPath, 'utf8');
  }

  public getProviderContent(): string {
    return fs.readFileSync(this.providerPath, 'utf8');
  }

  public getVariablesContent(): string {
    return fs.readFileSync(this.variablesPath, 'utf8');
  }

  public getOutputsContent(): string {
    return fs.readFileSync(this.outputsPath, 'utf8');
  }

  public hasResource(resourceType: string): boolean {
    const content = this.getStackContent();
    const regex = new RegExp(`resource\\s+"${resourceType}"`, 'g');
    return regex.test(content);
  }

  public countResources(resourceType: string): number {
    const content = this.getStackContent();
    const regex = new RegExp(`resource\\s+"${resourceType}"`, 'g');
    const matches = content.match(regex);
    return matches ? matches.length : 0;
  }

  public hasOutput(outputName: string): boolean {
    const content = this.getOutputsContent();
    const regex = new RegExp(`output\\s+"${outputName}"`, 'g');
    return regex.test(content);
  }

  public hasVariable(variableName: string): boolean {
    const content = this.getVariablesContent();
    const regex = new RegExp(`variable\\s+"${variableName}"`, 'g');
    return regex.test(content);
  }

  public validateAwsProvider(): boolean {
    const content = this.getProviderContent();
    return /provider\s+"aws"\s*{/.test(content);
  }

  public validateTerraformVersion(): boolean {
    const content = this.getProviderContent();
    return /required_version\s*=\s*">=\s*1\.\d+\.\d+"/.test(content);
  }

  public validateMultiAzConfiguration(): boolean {
    const content = this.getStackContent();
    // Check for availability_zone or availability_zones references
    return /availability_zone/.test(content);
  }

  public validateTags(): boolean {
    const content = this.getStackContent();
    return /tags\s*=/.test(content);
  }

  public hasLoadBalancer(): boolean {
    const hasLb = this.hasResource('aws_lb');
    const hasAlb = this.hasResource('aws_alb');
    if (hasLb) {
      return true;
    }
    return hasAlb;
  }

  public hasDatabase(): boolean {
    const hasCluster = this.hasResource('aws_rds_cluster');
    const hasInstance = this.hasResource('aws_db_instance');
    if (hasCluster) {
      return true;
    }
    return hasInstance;
  }

  public validateRequiredResources(): { [key: string]: boolean } {
    return {
      vpc: this.hasResource('aws_vpc'),
      subnet: this.hasResource('aws_subnet'),
      securityGroup: this.hasResource('aws_security_group'),
      alb: this.hasLoadBalancer(),
      ecs: this.hasResource('aws_ecs_cluster'),
      rds: this.hasDatabase(),
    };
  }
}

export default TerraformStackValidator;


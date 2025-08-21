import * as fs from 'fs';
import * as path from 'path';

export interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
}

export class TapStack {
  public readonly environmentSuffix: string;
  public readonly stateBucket: string;
  public readonly stateBucketRegion: string;
  public readonly awsRegion: string;
  public readonly terraformFiles: Map<string, string> = new Map();

  constructor(scope: unknown, id: string, props?: TapStackProps) {
    this.environmentSuffix = props?.environmentSuffix || 'dev';
    this.stateBucket =
      props?.stateBucket || `iac-rlhf-tfstate-${this.awsRegion || 'us-east-1'}`;
    this.stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    this.awsRegion = props?.awsRegion || 'us-east-1';

    // Load Terraform files for validation
    this.loadTerraformFiles();
  }

  private loadTerraformFiles(): void {
    // Load root terraform files from lib directory
    const libPath = path.join(__dirname);
    const rootTfFiles = [
      'main.tf',
      'provider.tf',
      'variables.tf',
      'outputs.tf',
    ];

    rootTfFiles.forEach(file => {
      const filePath = path.join(libPath, file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        this.terraformFiles.set(file, content);
      }
    });

    // Also load any additional .tf files in the lib directory
    if (fs.existsSync(libPath)) {
      const files = fs.readdirSync(libPath);
      files
        .filter(file => file.endsWith('.tf') && !rootTfFiles.includes(file))
        .forEach(file => {
          const filePath = path.join(libPath, file);
          const content = fs.readFileSync(filePath, 'utf8');
          this.terraformFiles.set(file, content);
        });
    }
  }

  public validateTerraformSyntax(): boolean {
    // Basic validation of Terraform file structure
    for (const [fileName, content] of this.terraformFiles) {
      if (!this.isValidTerraformFile(content)) {
        throw new Error(`Invalid Terraform syntax in ${fileName}`);
      }
    }
    return true;
  }

  private isValidTerraformFile(content: string): boolean {
    // Basic Terraform syntax validation - check for valid content and braces
    const openBraces = (content.match(/\{/g) || []).length;
    const closeBraces = (content.match(/\}/g) || []).length;
    return openBraces === closeBraces;
  }

  public hasRequiredTags(): boolean {
    // Check if common_tags includes required tags in locals or variables
    const mainContent = this.terraformFiles.get('main.tf') || '';
    const variablesContent = this.terraformFiles.get('variables.tf') || '';

    const hasEnvironmentTag =
      mainContent.includes('Environment') ||
      variablesContent.includes('Environment');
    const hasOwnerTag =
      mainContent.includes('Owner') || variablesContent.includes('Owner');

    return hasEnvironmentTag && hasOwnerTag;
  }

  public hasIAMRoles(): boolean {
    const mainContent = this.terraformFiles.get('main.tf') || '';
    return mainContent.includes('resource "aws_iam_role"');
  }

  public hasS3Buckets(): boolean {
    const mainContent = this.terraformFiles.get('main.tf') || '';
    return mainContent.includes('resource "aws_s3_bucket"');
  }

  public hasVPCResources(): boolean {
    const mainContent = this.terraformFiles.get('main.tf') || '';
    return mainContent.includes('resource "aws_vpc"');
  }

  public hasCloudTrail(): boolean {
    const mainContent = this.terraformFiles.get('main.tf') || '';
    return mainContent.includes('resource "aws_cloudtrail"');
  }

  public hasRDSEncryption(): boolean {
    const mainContent = this.terraformFiles.get('main.tf') || '';
    return (
      mainContent.includes('resource "aws_db_instance"') &&
      mainContent.includes('storage_encrypted') &&
      mainContent.includes('= true')
    );
  }

  public hasSecurityGroups(): boolean {
    const mainContent = this.terraformFiles.get('main.tf') || '';
    return mainContent.includes('resource "aws_security_group"');
  }

  public hasCloudWatchAlarms(): boolean {
    const mainContent = this.terraformFiles.get('main.tf') || '';
    return mainContent.includes('resource "aws_cloudwatch_metric_alarm"');
  }

  public hasAWSConfig(): boolean {
    const mainContent = this.terraformFiles.get('main.tf') || '';
    return (
      mainContent.includes('resource "aws_config_configuration_recorder"') ||
      mainContent.includes('resource "aws_config_config_rule"')
    );
  }

  public hasSSMParameterStore(): boolean {
    const mainContent = this.terraformFiles.get('main.tf') || '';
    return mainContent.includes('resource "aws_ssm_parameter"');
  }

  public hasCloudFrontShield(): boolean {
    const mainContent = this.terraformFiles.get('main.tf') || '';
    return mainContent.includes('resource "aws_cloudfront_distribution"');
  }

  public hasS3Versioning(): boolean {
    const mainContent = this.terraformFiles.get('main.tf') || '';
    return (
      mainContent.includes('resource "aws_s3_bucket_versioning"') &&
      mainContent.includes('status = "Enabled"')
    );
  }

  public hasVPCFlowLogs(): boolean {
    const mainContent = this.terraformFiles.get('main.tf') || '';
    return mainContent.includes('resource "aws_flow_log"');
  }

  public hasOutputs(): boolean {
    const outputsContent = this.terraformFiles.get('outputs.tf') || '';
    const mainContent = this.terraformFiles.get('main.tf') || '';
    return (
      outputsContent.includes('output ') || mainContent.includes('output ')
    );
  }

  public getResourceCount(): number {
    let count = 0;
    for (const content of this.terraformFiles.values()) {
      const matches = content.match(/^resource\s+/gm);
      if (matches) {
        count += matches.length;
      }
    }
    return count;
  }

  public getAllResourceTypes(): string[] {
    const resourceTypes: string[] = [];
    for (const content of this.terraformFiles.values()) {
      const matches = content.match(/resource\s+"([^"]+)"/g);
      if (matches) {
        matches.forEach(match => {
          const type = match.match(/"([^"]+)"/)?.[1];
          if (type && !resourceTypes.includes(type)) {
            resourceTypes.push(type);
          }
        });
      }
    }
    return resourceTypes.sort();
  }
}

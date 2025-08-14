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
      props?.stateBucket || `iac-rlhf-tfstate-${this.awsRegion}`;
    this.stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    this.awsRegion = props?.awsRegion || 'us-east-1';

    // Load Terraform files for validation
    this.loadTerraformFiles();
  }

  private loadTerraformFiles(): void {
    const secureEnvPath = path.join(__dirname, 'secure_env');

    if (fs.existsSync(secureEnvPath)) {
      const files = fs.readdirSync(secureEnvPath);
      files
        .filter(file => file.endsWith('.tf'))
        .forEach(file => {
          const filePath = path.join(secureEnvPath, file);
          const content = fs.readFileSync(filePath, 'utf8');
          this.terraformFiles.set(file, content);
        });
    }

    // Also load root terraform files
    const rootTfFiles = ['main.tf', 'provider.tf'];
    rootTfFiles.forEach(file => {
      const filePath = path.join(__dirname, file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        this.terraformFiles.set(file, content);
      }
    });
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
    // Check if common_tags includes required tags
    const localsContent = this.terraformFiles.get('locals.tf') || '';
    const hasEnvironmentTag =
      localsContent.includes('Environment') &&
      localsContent.includes('Production');
    const hasOwnerTag =
      localsContent.includes('Owner') && localsContent.includes('SecurityTeam');

    return hasEnvironmentTag && hasOwnerTag;
  }

  public hasSecurityGroup(): boolean {
    const securityGroupsContent =
      this.terraformFiles.get('security_groups.tf') || '';
    return securityGroupsContent.includes('resource "aws_security_group"');
  }

  public hasRestrictedPorts(): boolean {
    const securityGroupsContent =
      this.terraformFiles.get('security_groups.tf') || '';
    const hasHttpPort =
      securityGroupsContent.includes('from_port   = 80') &&
      securityGroupsContent.includes('to_port     = 80');
    const hasHttpsPort =
      securityGroupsContent.includes('from_port   = 443') &&
      securityGroupsContent.includes('to_port     = 443');

    return hasHttpPort && hasHttpsPort;
  }

  public hasIAMRole(): boolean {
    const iamContent = this.terraformFiles.get('iam.tf') || '';
    return iamContent.includes('resource "aws_iam_role"');
  }

  public hasEC2Instance(): boolean {
    const ec2Content = this.terraformFiles.get('ec2.tf') || '';
    return ec2Content.includes('resource "aws_instance"');
  }

  public hasEncryptedStorage(): boolean {
    const ec2Content = this.terraformFiles.get('ec2.tf') || '';
    return ec2Content.includes('encrypted             = true');
  }

  public hasOutputs(): boolean {
    const outputsContent = this.terraformFiles.get('outputs.tf') || '';
    return outputsContent.includes('output ');
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

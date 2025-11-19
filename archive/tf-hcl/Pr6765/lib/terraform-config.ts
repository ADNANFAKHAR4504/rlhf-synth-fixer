// Terraform Configuration Helper - TypeScript wrapper for testing coverage
// This module provides programmatic access to Terraform configuration for testing

import * as fs from 'fs';
import * as path from 'path';

export class TerraformConfig {
  private mainTfContent: string;
  private providerTfContent: string;
  private variablesTfContent: string;
  private outputsTfContent: string;

  constructor(libDir: string = __dirname) {
    this.mainTfContent = fs.readFileSync(path.join(libDir, 'main.tf'), 'utf8');
    this.providerTfContent = fs.readFileSync(path.join(libDir, 'provider.tf'), 'utf8');
    this.variablesTfContent = fs.readFileSync(path.join(libDir, 'variables.tf'), 'utf8');
    this.outputsTfContent = fs.readFileSync(path.join(libDir, 'outputs.tf'), 'utf8');
  }

  // Resource validation methods
  hasResource(resourceType: string, resourceName: string): boolean {
    const pattern = new RegExp(`resource\\s+"${resourceType}"\\s+"${resourceName}"\\s*{`, 'g');
    return pattern.test(this.mainTfContent);
  }

  hasVariable(variableName: string): boolean {
    const pattern = new RegExp(`variable\\s+"${variableName}"\\s*{`, 'g');
    return pattern.test(this.variablesTfContent);
  }

  hasOutput(outputName: string): boolean {
    const pattern = new RegExp(`output\\s+"${outputName}"\\s*{`, 'g');
    return pattern.test(this.outputsTfContent);
  }

  usesEnvironmentSuffix(resourceName: string): boolean {
    const pattern = new RegExp(`${resourceName}[^}]*environment_suffix`, 'gs');
    return pattern.test(this.mainTfContent);
  }

  hasProviderConfig(providerName: string): boolean {
    const pattern = new RegExp(`provider\\s+"${providerName}"`, 'g');
    return pattern.test(this.providerTfContent);
  }

  hasDefaultTags(): boolean {
    return this.providerTfContent.includes('default_tags');
  }

  getResourceCount(resourceType: string): number {
    const pattern = new RegExp(`resource\\s+"${resourceType}"`, 'g');
    const matches = this.mainTfContent.match(pattern);
    return matches ? matches.length : 0;
  }

  hasTransitGateway(): boolean {
    return this.hasResource('aws_ec2_transit_gateway', 'main');
  }

  hasTransitGatewayRouteTables(): boolean {
    return (
      this.hasResource('aws_ec2_transit_gateway_route_table', 'hub') &&
      this.hasResource('aws_ec2_transit_gateway_route_table', 'spokes')
    );
  }

  hasHubVPC(): boolean {
    return this.hasResource('aws_vpc', 'hub');
  }

  hasSpokeVPCs(): boolean {
    return this.mainTfContent.includes('resource "aws_vpc" "spokes"');
  }

  hasNATGateway(): boolean {
    return this.hasResource('aws_nat_gateway', 'hub');
  }

  hasInternetGateway(): boolean {
    return this.hasResource('aws_internet_gateway', 'hub');
  }

  hasSecurityGroups(): boolean {
    return (
      this.hasResource('aws_security_group', 'hub') &&
      this.mainTfContent.includes('resource "aws_security_group" "spokes"')
    );
  }

  hasNetworkACLs(): boolean {
    return (
      this.hasResource('aws_network_acl', 'hub') &&
      this.mainTfContent.includes('resource "aws_network_acl" "spokes"')
    );
  }

  securityGroupNamesValid(): boolean {
    // Check that security group names don't start with "sg-"
    const sgNamePattern = /resource\s+"aws_security_group"[\s\S]*?name\s*=\s*"([^"]+)"/g;
    const matches = [...this.mainTfContent.matchAll(sgNamePattern)];

    for (const match of matches) {
      const nameTemplate = match[1];
      // Check if the name template starts with "sg-" (not the variable part)
      if (nameTemplate.startsWith('sg-')) {
        return false;
      }
    }
    return matches.length > 0;
  }

  hasProperDependencies(): boolean {
    // Check for critical dependencies
    const eipDependsOnIGW = /resource\s+"aws_eip"\s+"nat"[\s\S]*?depends_on\s*=\s*\[aws_internet_gateway\.hub\]/.test(
      this.mainTfContent
    );
    const natDependsOnIGW = /resource\s+"aws_nat_gateway"\s+"hub"[\s\S]*?depends_on\s*=\s*\[aws_internet_gateway\.hub\]/.test(
      this.mainTfContent
    );

    return eipDependsOnIGW && natDependsOnIGW;
  }

  hasTransitGatewayAttachments(): boolean {
    const hubAttachment = this.hasResource('aws_ec2_transit_gateway_vpc_attachment', 'hub');
    const spokeAttachments = this.mainTfContent.includes('resource "aws_ec2_transit_gateway_vpc_attachment" "spokes"');
    return hubAttachment && spokeAttachments;
  }

  hasRouteTables(): boolean {
    return (
      this.hasResource('aws_route_table', 'hub_public') &&
      this.hasResource('aws_route_table', 'hub_private') &&
      this.mainTfContent.includes('resource "aws_route_table" "spokes"')
    );
  }

  hasDefaultRouteToNAT(): boolean {
    return /route\s*{[\s\S]*?cidr_block\s*=\s*"0\.0\.0\.0\/0"[\s\S]*?nat_gateway_id/.test(this.mainTfContent);
  }

  hasDefaultRouteToIGW(): boolean {
    return /route\s*{[\s\S]*?cidr_block\s*=\s*"0\.0\.0\.0\/0"[\s\S]*?gateway_id/.test(this.mainTfContent);
  }

  hasRoutesToTransitGateway(): boolean {
    return (
      this.hasResource('aws_route', 'spokes_to_tgw') &&
      this.hasResource('aws_route', 'hub_to_spokes') &&
      this.hasResource('aws_ec2_transit_gateway_route', 'spokes_default')
    );
  }

  hasDNSSupport(): boolean {
    return /dns_support\s*=.*enable/.test(this.mainTfContent) && /enable_dns_support\s*=\s*true/.test(this.mainTfContent);
  }

  hasVPNECMPSupport(): boolean {
    return /vpn_ecmp_support/.test(this.mainTfContent);
  }

  allResourcesUseEnvironmentSuffix(): boolean {
    const nameTagMatches = this.mainTfContent.match(/Name\s*=\s*"[^"]+"/g);
    if (!nameTagMatches) return false;

    const withoutSuffix = nameTagMatches.filter(tag => !tag.includes('environment_suffix'));
    return withoutSuffix.length === 0;
  }

  hasSubnets(): boolean {
    return (
      this.hasResource('aws_subnet', 'hub_public') &&
      this.hasResource('aws_subnet', 'hub_private') &&
      this.mainTfContent.includes('resource "aws_subnet" "spokes_private"')
    );
  }

  hasElasticIP(): boolean {
    return this.hasResource('aws_eip', 'nat');
  }

  disablesDefaultRouteTables(): boolean {
    return (
      /default_route_table_association\s*=\s*"disable"/.test(this.mainTfContent) &&
      /default_route_table_propagation\s*=\s*"disable"/.test(this.mainTfContent)
    );
  }

  hasRequiredOutputs(): boolean {
    const requiredOutputs = [
      'transit_gateway_id',
      'transit_gateway_arn',
      'hub_vpc_id',
      'hub_vpc_cidr',
      'spoke_vpc_ids',
      'spoke_vpc_cidrs',
      'nat_gateway_id',
      'nat_gateway_public_ip',
      'hub_security_group_id',
      'spoke_security_group_ids',
      'hub_route_table_id',
      'spokes_route_table_id',
      'hub_tgw_attachment_id',
      'spoke_tgw_attachment_ids',
    ];

    return requiredOutputs.every(output => this.hasOutput(output));
  }

  hasRequiredVariables(): boolean {
    const requiredVariables = [
      'aws_region',
      'environment_suffix',
      'hub_vpc_cidr',
      'spoke_vpc_cidrs',
      'transit_gateway_asn',
      'enable_dns_support',
      'enable_vpn_ecmp_support',
    ];

    return requiredVariables.every(variable => this.hasVariable(variable));
  }

  hasEnvironmentSuffixValidation(): boolean {
    return this.variablesTfContent.includes('validation');
  }

  usesForEach(resourceName: string): boolean {
    const pattern = new RegExp(`resource\\s+"[^"]+"\s+"${resourceName}"[\\s\\S]*?for_each`, 'g');
    return pattern.test(this.mainTfContent);
  }

  hasAWSRegion(): boolean {
    return this.hasVariable('aws_region');
  }

  providerUsesAWSRegion(): boolean {
    return /region\s*=\s*var\.aws_region/.test(this.providerTfContent);
  }
}

export default TerraformConfig;

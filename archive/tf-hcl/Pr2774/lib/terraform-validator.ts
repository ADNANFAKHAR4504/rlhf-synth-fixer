/**
 * Terraform Configuration Validator
 * Utility functions for validating Terraform configuration files
 */

import fs from 'fs';
import path from 'path';

export class TerraformValidator {
  private stackPath: string;
  private providerPath: string;

  constructor(libPath: string = path.resolve(__dirname)) {
    this.stackPath = path.join(libPath, 'tap_stack.tf');
    this.providerPath = path.join(libPath, 'provider.tf');
  }

  /**
   * Check if required Terraform files exist
   */
  public checkFilesExist(): { stack: boolean; provider: boolean } {
    return {
      stack: fs.existsSync(this.stackPath),
      provider: fs.existsSync(this.providerPath),
    };
  }

  /**
   * Validate provider configuration
   */
  public validateProviderConfig(): {
    hasRequiredProviders: boolean;
    hasAWSProvider: boolean;
    hasCorrectVersion: boolean;
    hasRegion: boolean;
    region?: string;
  } {
    const content = fs.readFileSync(this.providerPath, 'utf8');

    return {
      hasRequiredProviders: /terraform\s*{[\s\S]*required_providers\s*{/.test(
        content
      ),
      hasAWSProvider: /provider\s+"aws"\s*{/.test(content),
      hasCorrectVersion: /version\s*=\s*"~>\s*5\.0"/.test(content),
      hasRegion: /region\s*=\s*"[^"]+"/.test(content),
      region: content.match(/region\s*=\s*"([^"]+)"/)?.[1],
    };
  }

  /**
   * Validate stack configuration
   */
  public validateStackConfig(): {
    hasEnvironmentVariable: boolean;
    hasVPC: boolean;
    hasIGW: boolean;
    hasSubnets: number;
    hasRouteTable: boolean;
    hasRoute: boolean;
    hasAssociations: number;
    outputs: string[];
  } {
    const content = fs.readFileSync(this.stackPath, 'utf8');

    const subnetMatches =
      content.match(/resource\s+"aws_subnet"\s+"[^"]+"/g) || [];
    const associationMatches =
      content.match(/resource\s+"aws_route_table_association"\s+"[^"]+"/g) ||
      [];
    const outputMatches = content.match(/output\s+"([^"]+)"/g) || [];

    return {
      hasEnvironmentVariable: /variable\s+"environment_suffix"\s*{/.test(
        content
      ),
      hasVPC: /resource\s+"aws_vpc"\s+"basic_vpc"\s*{/.test(content),
      hasIGW: /resource\s+"aws_internet_gateway"\s+"basic_igw"\s*{/.test(
        content
      ),
      hasSubnets: subnetMatches.length,
      hasRouteTable: /resource\s+"aws_route_table"\s+"public_rt"\s*{/.test(
        content
      ),
      hasRoute: /resource\s+"aws_route"\s+"public_internet_access"\s*{/.test(
        content
      ),
      hasAssociations: associationMatches.length,
      outputs: outputMatches.map(m => m.replace(/output\s+"([^"]+)"/, '$1')),
    };
  }

  /**
   * Validate environment suffix usage
   */
  public validateEnvironmentSuffix(): {
    allTagsUseVariable: boolean;
    variableHasDefault: boolean;
    resourcesWithSuffix: string[];
  } {
    const content = fs.readFileSync(this.stackPath, 'utf8');

    // Find all Name tags
    const nameTagMatches = content.match(/Name\s*=\s*"[^"]+"/g) || [];
    const allTagsUseVariable = nameTagMatches.every(tag =>
      tag.includes('${var.environment_suffix}')
    );

    // Check variable default
    const variableBlock = content.match(
      /variable\s+"environment_suffix"\s*{[^}]+}/s
    );
    const variableHasDefault = variableBlock
      ? /default\s*=\s*"[^"]+"/.test(variableBlock[0])
      : false;

    // Find resources using the suffix
    const resourcesWithSuffix = nameTagMatches
      .filter(tag => tag.includes('${var.environment_suffix}'))
      .map(tag => {
        const match = tag.match(/"([^-]+)-/);
        return match ? match[1] : '';
      })
      .filter(Boolean);

    return {
      allTagsUseVariable,
      variableHasDefault,
      resourcesWithSuffix,
    };
  }

  /**
   * Validate CIDR configuration
   */
  public validateCIDRConfig(): {
    vpcCIDR: string | null;
    subnetCIDRs: string[];
    validCIDRs: boolean;
  } {
    const content = fs.readFileSync(this.stackPath, 'utf8');

    const vpcCIDRMatch = content.match(
      /resource\s+"aws_vpc"[^}]+cidr_block\s*=\s*"([^"]+)"/s
    );
    const vpcCIDR = vpcCIDRMatch ? vpcCIDRMatch[1] : null;

    const subnetBlocks = content.match(/resource\s+"aws_subnet"[^}]+}/gs) || [];
    const subnetCIDRs = subnetBlocks
      .map(block => {
        const match = block.match(/cidr_block\s*=\s*"([^"]+)"/);
        return match ? match[1] : '';
      })
      .filter(Boolean);

    // Basic validation: all subnet CIDRs should start with VPC network prefix
    const vpcPrefix = vpcCIDR ? vpcCIDR.split('.').slice(0, 2).join('.') : '';
    const validCIDRs = subnetCIDRs.every(cidr => cidr.startsWith(vpcPrefix));

    return {
      vpcCIDR,
      subnetCIDRs,
      validCIDRs,
    };
  }

  /**
   * Validate availability zones
   */
  public validateAvailabilityZones(): {
    zones: string[];
    uniqueZones: boolean;
    matchRegion: boolean;
  } {
    const stackContent = fs.readFileSync(this.stackPath, 'utf8');
    const providerContent = fs.readFileSync(this.providerPath, 'utf8');

    const regionMatch = providerContent.match(/region\s*=\s*"([^"]+)"/);
    const region = regionMatch ? regionMatch[1] : '';

    const subnetBlocks =
      stackContent.match(/resource\s+"aws_subnet"[^}]+}/gs) || [];
    const zones = subnetBlocks
      .map(block => {
        const match = block.match(/availability_zone\s*=\s*"([^"]+)"/);
        return match ? match[1] : '';
      })
      .filter(Boolean);

    const uniqueZones = zones.length === new Set(zones).size;
    const matchRegion = zones.every(zone => zone.startsWith(region));

    return {
      zones,
      uniqueZones,
      matchRegion,
    };
  }

  /**
   * Validate resource dependencies
   */
  public validateDependencies(): {
    igwReferencesVPC: boolean;
    subnetsReferenceVPC: boolean;
    routeTableReferencesVPC: boolean;
    routeReferencesResources: boolean;
    associationsReferenceResources: boolean;
  } {
    const content = fs.readFileSync(this.stackPath, 'utf8');

    // Check IGW references VPC
    const igwBlock = content.match(/resource\s+"aws_internet_gateway"[^}]+}/s);
    const igwReferencesVPC = igwBlock
      ? /vpc_id\s*=\s*aws_vpc\.basic_vpc\.id/.test(igwBlock[0])
      : false;

    // Check subnets reference VPC
    const subnetBlocks = content.match(/resource\s+"aws_subnet"[^}]+}/gs) || [];
    const subnetsReferenceVPC = subnetBlocks.every(block =>
      /vpc_id\s*=\s*aws_vpc\.basic_vpc\.id/.test(block)
    );

    // Check route table references VPC
    const rtBlock = content.match(/resource\s+"aws_route_table"[^}]+}/s);
    const routeTableReferencesVPC = rtBlock
      ? /vpc_id\s*=\s*aws_vpc\.basic_vpc\.id/.test(rtBlock[0])
      : false;

    // Check route references
    const routeBlock = content.match(/resource\s+"aws_route"[^}]+}/s);
    const routeReferencesResources = routeBlock
      ? /route_table_id\s*=\s*aws_route_table\.public_rt\.id/.test(
          routeBlock[0]
        ) &&
        /gateway_id\s*=\s*aws_internet_gateway\.basic_igw\.id/.test(
          routeBlock[0]
        )
      : false;

    // Check associations reference resources
    const associationBlocks =
      content.match(/resource\s+"aws_route_table_association"[^}]+}/gs) || [];
    const associationsReferenceResources = associationBlocks.every(
      block =>
        /subnet_id\s*=\s*aws_subnet\.\w+\.id/.test(block) &&
        /route_table_id\s*=\s*aws_route_table\.public_rt\.id/.test(block)
    );

    return {
      igwReferencesVPC,
      subnetsReferenceVPC,
      routeTableReferencesVPC,
      routeReferencesResources,
      associationsReferenceResources,
    };
  }

  /**
   * Validate outputs
   */
  public validateOutputs(): {
    hasAllRequiredOutputs: boolean;
    outputsWithDescriptions: string[];
    outputsWithValues: string[];
  } {
    const content = fs.readFileSync(this.stackPath, 'utf8');

    const requiredOutputs = [
      'vpc_id',
      'subnet_ids',
      'internet_gateway_id',
      'route_table_id',
    ];
    const outputBlocks = content.match(/output\s+"([^"]+)"\s*{[^}]+}/gs) || [];

    const outputs = outputBlocks
      .map(block => {
        const nameMatch = block.match(/output\s+"([^"]+)"/);
        return nameMatch ? nameMatch[1] : '';
      })
      .filter(Boolean);

    const hasAllRequiredOutputs = requiredOutputs.every(req =>
      outputs.includes(req)
    );

    const outputsWithDescriptions = outputBlocks
      .filter(block => /description\s*=/.test(block))
      .map(block => {
        const match = block.match(/output\s+"([^"]+)"/);
        return match ? match[1] : '';
      })
      .filter(Boolean);

    const outputsWithValues = outputBlocks
      .filter(block => /value\s*=/.test(block))
      .map(block => {
        const match = block.match(/output\s+"([^"]+)"/);
        return match ? match[1] : '';
      })
      .filter(Boolean);

    return {
      hasAllRequiredOutputs,
      outputsWithDescriptions,
      outputsWithValues,
    };
  }

  /**
   * Get comprehensive validation report
   */
  public getValidationReport() {
    const filesExist = this.checkFilesExist();
    const provider = this.validateProviderConfig();
    const stack = this.validateStackConfig();
    const environmentSuffix = this.validateEnvironmentSuffix();
    const cidr = this.validateCIDRConfig();
    const availabilityZones = this.validateAvailabilityZones();
    const dependencies = this.validateDependencies();
    const outputs = this.validateOutputs();

    const isValid =
      filesExist.stack &&
      filesExist.provider &&
      provider.hasRequiredProviders &&
      provider.hasAWSProvider &&
      stack.hasVPC &&
      stack.hasIGW &&
      stack.hasSubnets >= 2 &&
      environmentSuffix.allTagsUseVariable &&
      environmentSuffix.variableHasDefault &&
      cidr.validCIDRs &&
      availabilityZones.uniqueZones &&
      dependencies.igwReferencesVPC &&
      dependencies.subnetsReferenceVPC &&
      outputs.hasAllRequiredOutputs;

    return {
      filesExist,
      provider,
      stack,
      environmentSuffix,
      cidr,
      availabilityZones,
      dependencies,
      outputs,
      isValid,
    };
  }
}

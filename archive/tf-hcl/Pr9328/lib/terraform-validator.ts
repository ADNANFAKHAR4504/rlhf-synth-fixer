// Terraform configuration validator module
// This module provides validation functions for Terraform infrastructure

import fs from 'fs';

interface SecurityGroupRule {
  from_port: number;
  to_port: number;
  protocol: string;
  cidr_blocks: string[];
}

interface SecurityGroupConfig {
  name: string;
  ingress_rules: SecurityGroupRule[];
  egress_rules: SecurityGroupRule[];
}

export class TerraformValidator {
  private config: string;

  constructor(configPath: string) {
    this.config = fs.readFileSync(configPath, 'utf8');
  }

  /**
   * Check if a variable is defined in the configuration
   */
  hasVariable(variableName: string): boolean {
    const variablePattern = new RegExp(`variable\\s+"${variableName}"\\s*{`);
    return variablePattern.test(this.config);
  }

  /**
   * Check if a resource is defined in the configuration
   */
  hasResource(resourceType: string, resourceName: string): boolean {
    const resourcePattern = new RegExp(
      `resource\\s+"${resourceType}"\\s+"${resourceName}"\\s*{`
    );
    return resourcePattern.test(this.config);
  }

  /**
   * Check if an output is defined in the configuration
   */
  hasOutput(outputName: string): boolean {
    const outputPattern = new RegExp(`output\\s+"${outputName}"\\s*{`);
    return outputPattern.test(this.config);
  }

  /**
   * Validate that no security group allows traffic from 0.0.0.0/0
   */
  validateNoPublicAccess(): boolean {
    // Check for any ingress rules with 0.0.0.0/0
    const publicAccessPattern = /cidr_blocks\s*=\s*\[.*"0\.0\.0\.0\/0".*\]/;
    const sgPattern =
      /resource\s+"aws_security_group"[\s\S]*?(?=resource|output|$)/g;

    const securityGroups = this.config.match(sgPattern) || [];

    for (const sg of securityGroups) {
      // Only check ingress rules, not egress
      const ingressRules = sg.match(/ingress\s*{[\s\S]*?}/g) || [];
      for (const rule of ingressRules) {
        if (publicAccessPattern.test(rule)) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Validate that specific CIDR blocks are configured correctly
   */
  validateCidrBlock(variableName: string, expectedCidr: string): boolean {
    const pattern = new RegExp(
      `variable\\s+"${variableName}"[\\s\\S]*?default\\s*=\\s*"${expectedCidr.replace(/\./g, '\\.')}"`,
      'g'
    );
    return pattern.test(this.config);
  }

  /**
   * Check if environment suffix is used in resource naming
   */
  validateEnvironmentSuffixUsage(): boolean {
    const namePatterns = [/Name\s*=\s*".*\$\{var\.environment_suffix\}/g];

    for (const pattern of namePatterns) {
      const matches = this.config.match(pattern);
      if (!matches || matches.length < 5) {
        return false;
      }
    }

    return true;
  }

  /**
   * Validate that EC2 instance has required security configurations
   */
  validateEC2SecurityConfig(): boolean {
    const instancePattern =
      /resource\s+"aws_instance"[\s\S]*?(?=resource|output|$)/;
    const instanceMatch = this.config.match(instancePattern);

    if (!instanceMatch) {
      return false;
    }

    const instanceConfig = instanceMatch[0];

    // Check for encrypted root volume
    if (
      !instanceConfig.includes('encrypted') ||
      !instanceConfig.includes('encrypted             = true')
    ) {
      return false;
    }

    // Check for public IP disabled
    if (
      !instanceConfig.includes('associate_public_ip_address') ||
      !instanceConfig.includes('associate_public_ip_address = false')
    ) {
      return false;
    }

    // Check for delete_on_termination
    if (
      !instanceConfig.includes('delete_on_termination') ||
      !instanceConfig.includes('delete_on_termination = true')
    ) {
      return false;
    }

    return true;
  }

  /**
   * Validate VPC configuration
   */
  validateVPCConfig(): boolean {
    const vpcPattern = /resource\s+"aws_vpc"[\s\S]*?(?=resource|output|$)/;
    const vpcMatch = this.config.match(vpcPattern);

    if (!vpcMatch) {
      return false;
    }

    const vpcConfig = vpcMatch[0];

    // Check for DNS support
    if (
      !vpcConfig.includes('enable_dns_hostnames') ||
      !vpcConfig.includes('enable_dns_support')
    ) {
      return false;
    }

    return true;
  }

  /**
   * Validate that NAT Gateway is configured for private subnet
   */
  validateNATGateway(): boolean {
    return (
      this.hasResource('aws_nat_gateway', 'main') &&
      this.hasResource('aws_eip', 'nat')
    );
  }

  /**
   * Validate subnet configuration
   */
  validateSubnetConfig(): boolean {
    const publicSubnetPattern =
      /resource\s+"aws_subnet"\s+"public"[\s\S]*?(?=resource|output|$)/;
    const publicMatch = this.config.match(publicSubnetPattern);

    if (!publicMatch) {
      return false;
    }

    // Check that public IP is disabled on public subnet
    const publicSubnetConfig = publicMatch[0];
    if (
      !publicSubnetConfig.includes('map_public_ip_on_launch') ||
      !publicSubnetConfig.includes('map_public_ip_on_launch = false')
    ) {
      return false;
    }

    return this.hasResource('aws_subnet', 'private');
  }

  /**
   * Validate that all required outputs are present
   */
  validateOutputs(): boolean {
    const requiredOutputs = [
      'vpc_id',
      'vpc_cidr_block',
      'public_subnet_id',
      'private_subnet_id',
      'http_security_group_id',
      'ssh_security_group_id',
      'internal_security_group_id',
      'web_server_id',
      'web_server_private_ip',
      'allowed_http_cidr',
      'allowed_ssh_cidr',
      'security_summary',
    ];

    for (const output of requiredOutputs) {
      if (!this.hasOutput(output)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Run all validations
   */
  validateAll(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.validateNoPublicAccess()) {
      errors.push('Security groups allow traffic from 0.0.0.0/0');
    }

    if (!this.validateCidrBlock('allowed_http_cidr', '192.168.1.0/24')) {
      errors.push('HTTP CIDR block is not configured correctly');
    }

    if (!this.validateCidrBlock('allowed_ssh_cidr', '203.0.113.0/24')) {
      errors.push('SSH CIDR block is not configured correctly');
    }

    if (!this.validateEnvironmentSuffixUsage()) {
      errors.push(
        'Environment suffix is not used consistently in resource naming'
      );
    }

    if (!this.validateEC2SecurityConfig()) {
      errors.push('EC2 instance security configuration is incomplete');
    }

    if (!this.validateVPCConfig()) {
      errors.push('VPC configuration is incomplete');
    }

    if (!this.validateNATGateway()) {
      errors.push('NAT Gateway is not configured properly');
    }

    if (!this.validateSubnetConfig()) {
      errors.push('Subnet configuration is incomplete');
    }

    if (!this.validateOutputs()) {
      errors.push('Required outputs are missing');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

// Export utility functions for testing
export function parseSecurityGroupRules(config: string): SecurityGroupConfig[] {
  const sgPattern =
    /resource\s+"aws_security_group"\s+"(\w+)"[\s\S]*?(?=resource|output|$)/g;
  const securityGroups: SecurityGroupConfig[] = [];

  let match;
  while ((match = sgPattern.exec(config)) !== null) {
    const name = match[1];
    const sgContent = match[0];

    const ingressRules: SecurityGroupRule[] = [];
    const ingressPattern = /ingress\s*{([\s\S]*?)}/g;

    let ingressMatch;
    while ((ingressMatch = ingressPattern.exec(sgContent)) !== null) {
      const ruleContent = ingressMatch[1];
      const fromPort = parseInt(
        (ruleContent.match(/from_port\s*=\s*(\d+)/) || [])[1] || '0'
      );
      const toPort = parseInt(
        (ruleContent.match(/to_port\s*=\s*(\d+)/) || [])[1] || '0'
      );
      const protocol =
        (ruleContent.match(/protocol\s*=\s*"([^"]+)"/) || [])[1] || 'tcp';
      const cidrMatch = ruleContent.match(/cidr_blocks\s*=\s*\[(.*?)\]/);
      const cidrBlocks = cidrMatch
        ? cidrMatch[1].match(/"[^"]+"/g)?.map(c => c.replace(/"/g, '')) || []
        : [];

      ingressRules.push({
        from_port: fromPort,
        to_port: toPort,
        protocol,
        cidr_blocks: cidrBlocks,
      });
    }

    const egressRules: SecurityGroupRule[] = [];
    const egressPattern = /egress\s*{([\s\S]*?)}/g;

    let egressMatch;
    while ((egressMatch = egressPattern.exec(sgContent)) !== null) {
      const ruleContent = egressMatch[1];
      const fromPort = parseInt(
        (ruleContent.match(/from_port\s*=\s*(\d+)/) || [])[1] || '0'
      );
      const toPort = parseInt(
        (ruleContent.match(/to_port\s*=\s*(\d+)/) || [])[1] || '0'
      );
      const protocol =
        (ruleContent.match(/protocol\s*=\s*"([^"]+)"/) || [])[1] || '-1';
      const cidrMatch = ruleContent.match(/cidr_blocks\s*=\s*\[(.*?)\]/);
      const cidrBlocks = cidrMatch
        ? cidrMatch[1].match(/"[^"]+"/g)?.map(c => c.replace(/"/g, '')) || []
        : [];

      egressRules.push({
        from_port: fromPort,
        to_port: toPort,
        protocol,
        cidr_blocks: cidrBlocks,
      });
    }

    securityGroups.push({
      name,
      ingress_rules: ingressRules,
      egress_rules: egressRules,
    });
  }

  return securityGroups;
}

export function validateResourceTags(
  config: string,
  resourceType: string,
  resourceName: string
): boolean {
  const resourcePattern = new RegExp(
    `resource\\s+"${resourceType}"\\s+"${resourceName}"[\\s\\S]*?(?=resource|output|$)`
  );
  const resourceMatch = config.match(resourcePattern);

  if (!resourceMatch) {
    return false;
  }

  const resourceConfig = resourceMatch[0];
  return (
    resourceConfig.includes('tags') &&
    resourceConfig.includes('Environment') &&
    resourceConfig.includes('ManagedBy')
  );
}

import TerraformInfrastructure from '../lib/terraform-config';

describe('Terraform Infrastructure Configuration Tests', () => {
  let infrastructure: TerraformInfrastructure;

  beforeEach(() => {
    infrastructure = new TerraformInfrastructure();
  });

  describe('Constructor and Initialization', () => {
    test('should initialize with default configuration', () => {
      expect(infrastructure).toBeDefined();
      expect(infrastructure.getConfig()).toBeDefined();
    });

    test('should have all required configuration sections', () => {
      const config = infrastructure.getConfig();
      expect(config.terraform).toBeDefined();
      expect(config.provider).toBeDefined();
      expect(config.variables).toBeDefined();
      expect(config.resources).toBeDefined();
    });
  });

  describe('Terraform Configuration', () => {
    test('should require Terraform version >= 1.0', () => {
      const config = infrastructure.getConfig();
      expect(config.terraform.requiredVersion).toBe('>= 1.0');
    });

    test('should use AWS provider ~> 5.0', () => {
      const config = infrastructure.getConfig();
      expect(config.terraform.requiredProviders.aws.source).toBe('hashicorp/aws');
      expect(config.terraform.requiredProviders.aws.version).toBe('~> 5.0');
    });

    test('should use Random provider ~> 3.0', () => {
      const config = infrastructure.getConfig();
      expect(config.terraform.requiredProviders.random.source).toBe('hashicorp/random');
      expect(config.terraform.requiredProviders.random.version).toBe('~> 3.0');
    });
  });

  describe('Provider Configuration', () => {
    test('should configure AWS provider with us-east-1 region', () => {
      const config = infrastructure.getConfig();
      expect(config.provider.aws.region).toBe('us-east-1');
    });

    test('should have default tags for all resources', () => {
      const config = infrastructure.getConfig();
      const tags = config.provider.aws.defaultTags;
      expect(tags.Environment).toBe('Production');
      expect(tags.Project).toBe('secure-infrastructure');
      expect(tags.ManagedBy).toBe('Terraform');
      expect(tags.EnvironmentSuffix).toBe('default');
    });
  });

  describe('Variables Configuration', () => {
    test('should define all required variables', () => {
      const variables = infrastructure.getConfig().variables;
      expect(variables.region).toBe('us-east-1');
      expect(variables.availabilityZones).toEqual(['us-east-1a', 'us-east-1b']);
      expect(variables.vpcCidr).toBe('10.0.0.0/16');
      expect(variables.publicSubnetCidrs).toEqual(['10.0.1.0/24', '10.0.2.0/24']);
      expect(variables.privateSubnetCidrs).toEqual(['10.0.10.0/24', '10.0.20.0/24']);
      expect(variables.allowedSshCidr).toBe('192.168.1.0/24');
      expect(variables.environment).toBe('Production');
      expect(variables.projectName).toBe('secure-infrastructure');
    });
  });

  describe('VPC Configuration', () => {
    test('should validate VPC configuration', () => {
      expect(infrastructure.validateVPCConfig()).toBe(true);
    });

    test('should have correct VPC settings', () => {
      const vpc = infrastructure.getConfig().resources.vpc;
      expect(vpc.cidrBlock).toBe('10.0.0.0/16');
      expect(vpc.enableDnsHostnames).toBe(true);
      expect(vpc.enableDnsSupport).toBe(true);
      expect(vpc.internetGateway).toBe(true);
      expect(vpc.natGateway).toBe(true);
      expect(vpc.elasticIp).toBe(true);
    });
  });

  describe('Subnet Configuration', () => {
    test('should validate subnet configuration', () => {
      expect(infrastructure.validateSubnetConfig()).toBe(true);
    });

    test('should have 2 public subnets with public IP mapping', () => {
      const subnets = infrastructure.getConfig().resources.subnets;
      expect(subnets.publicSubnets.count).toBe(2);
      expect(subnets.publicSubnets.mapPublicIpOnLaunch).toBe(true);
      expect(subnets.publicSubnets.availabilityZones).toEqual(['us-east-1a', 'us-east-1b']);
    });

    test('should have 2 private subnets', () => {
      const subnets = infrastructure.getConfig().resources.subnets;
      expect(subnets.privateSubnets.count).toBe(2);
      expect(subnets.privateSubnets.availabilityZones).toEqual(['us-east-1a', 'us-east-1b']);
    });

    test('should have route tables for public and private subnets', () => {
      const routeTables = infrastructure.getConfig().resources.subnets.routeTables;
      expect(routeTables.public).toBe(true);
      expect(routeTables.private).toBe(true);
    });
  });

  describe('Security Configuration', () => {
    test('should validate security configuration', () => {
      expect(infrastructure.validateSecurityConfig()).toBe(true);
    });

    test('should restrict SSH to 192.168.1.0/24', () => {
      const security = infrastructure.getConfig().resources.security;
      const sshIngress = security.sshSecurityGroup.ingressRules[0];
      expect(sshIngress.fromPort).toBe(22);
      expect(sshIngress.toPort).toBe(22);
      expect(sshIngress.protocol).toBe('tcp');
      expect(sshIngress.cidrBlocks).toContain('192.168.1.0/24');
    });

    test('should allow all egress traffic', () => {
      const security = infrastructure.getConfig().resources.security;
      const egress = security.sshSecurityGroup.egressRules[0];
      expect(egress.fromPort).toBe(0);
      expect(egress.toPort).toBe(0);
      expect(egress.protocol).toBe('-1');
      expect(egress.cidrBlocks).toContain('0.0.0.0/0');
    });

    test('should have S3 VPC Gateway Endpoint', () => {
      const endpoint = infrastructure.getConfig().resources.security.vpcEndpoints.s3;
      expect(endpoint.type).toBe('Gateway');
      expect(endpoint.serviceName).toBe('com.amazonaws.us-east-1.s3');
      expect(endpoint.routeTableAssociations).toContain('public');
      expect(endpoint.routeTableAssociations).toContain('private');
    });
  });

  describe('S3 Configuration', () => {
    test('should validate S3 configuration', () => {
      expect(infrastructure.validateS3Config()).toBe(true);
    });

    test('should enable versioning', () => {
      const s3 = infrastructure.getConfig().resources.s3;
      expect(s3.bucket.versioning).toBe(true);
    });

    test('should enable AES256 encryption', () => {
      const encryption = infrastructure.getConfig().resources.s3.bucket.encryption;
      expect(encryption.algorithm).toBe('AES256');
      expect(encryption.bucketKeyEnabled).toBe(true);
    });

    test('should block all public access', () => {
      const publicBlock = infrastructure.getConfig().resources.s3.bucket.publicAccessBlock;
      expect(publicBlock.blockPublicAcls).toBe(true);
      expect(publicBlock.blockPublicPolicy).toBe(true);
      expect(publicBlock.ignorePublicAcls).toBe(true);
      expect(publicBlock.restrictPublicBuckets).toBe(true);
    });

    test('should enable force destroy', () => {
      const s3 = infrastructure.getConfig().resources.s3;
      expect(s3.bucket.forceDestroy).toBe(true);
    });

    test('should have security policies', () => {
      const policy = infrastructure.getConfig().resources.s3.bucketPolicy;
      expect(policy.denyInsecureConnections).toBe(true);
      expect(policy.denyUnencryptedUploads).toBe(true);
    });
  });

  describe('Environment Suffix Management', () => {
    test('should set environment suffix', () => {
      infrastructure.setEnvironmentSuffix('test123');
      const config = infrastructure.getConfig();
      expect(config.variables.environmentSuffix).toBe('test123');
      expect(config.provider.aws.defaultTags.EnvironmentSuffix).toBe('test123');
    });

    test('should handle empty environment suffix', () => {
      infrastructure.setEnvironmentSuffix('');
      const config = infrastructure.getConfig();
      expect(config.variables.environmentSuffix).toBe('');
      expect(config.provider.aws.defaultTags.EnvironmentSuffix).toBe('default');
    });

    test('should generate correct name prefix with suffix', () => {
      infrastructure.setEnvironmentSuffix('prod');
      expect(infrastructure.getNamePrefix()).toBe('secure-infrastructure-prod');
    });

    test('should generate correct name prefix without suffix', () => {
      infrastructure.setEnvironmentSuffix('');
      expect(infrastructure.getNamePrefix()).toBe('secure-infrastructure');
    });
  });

  describe('Requirements Validation', () => {
    test('should validate all infrastructure requirements', () => {
      const requirements = infrastructure.validateRequirements();
      expect(requirements.multiAZ).toBe(true);
      expect(requirements.natGateway).toBe(true);
      expect(requirements.s3Encryption).toBe(true);
      expect(requirements.sshRestriction).toBe(true);
      expect(requirements.productionTags).toBe(true);
    });

    test('should be multi-AZ', () => {
      expect(infrastructure.isMultiAZ()).toBe(true);
    });

    test('should validate production tags', () => {
      expect(infrastructure.validateProductionTags()).toBe(true);
    });
  });

  describe('Helper Methods', () => {
    test('should return correct region', () => {
      expect(infrastructure.getRegion()).toBe('us-east-1');
    });

    test('should return allowed SSH CIDR', () => {
      expect(infrastructure.getAllowedSSHCIDR()).toBe('192.168.1.0/24');
    });

    test('should count resources correctly', () => {
      const count = infrastructure.getResourceCount();
      expect(count).toBe(22); // Based on the Terraform plan output
    });

    test('should list all outputs', () => {
      const outputs = infrastructure.getOutputs();
      expect(outputs).toContain('vpc_id');
      expect(outputs).toContain('vpc_cidr');
      expect(outputs).toContain('public_subnet_ids');
      expect(outputs).toContain('private_subnet_ids');
      expect(outputs).toContain('internet_gateway_id');
      expect(outputs).toContain('nat_gateway_id');
      expect(outputs).toContain('nat_gateway_ip');
      expect(outputs).toContain('ssh_security_group_id');
      expect(outputs).toContain('s3_bucket_name');
      expect(outputs).toContain('s3_bucket_arn');
      expect(outputs).toContain('s3_vpc_endpoint_id');
      expect(outputs.length).toBe(11);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle configuration object properly', () => {
      const config = infrastructure.getConfig();
      expect(config).not.toBeNull();
      expect(typeof config).toBe('object');
    });

    test('should maintain configuration integrity', () => {
      const config1 = infrastructure.getConfig();
      const config2 = infrastructure.getConfig();
      expect(config1).toBe(config2); // Should return same reference
    });

    test('should have all validation methods return boolean', () => {
      expect(typeof infrastructure.validateVPCConfig()).toBe('boolean');
      expect(typeof infrastructure.validateSubnetConfig()).toBe('boolean');
      expect(typeof infrastructure.validateSecurityConfig()).toBe('boolean');
      expect(typeof infrastructure.validateS3Config()).toBe('boolean');
      expect(typeof infrastructure.validateProductionTags()).toBe('boolean');
      expect(typeof infrastructure.isMultiAZ()).toBe('boolean');
    });
  });

  describe('Configuration Completeness', () => {
    test('should have all required provider configurations', () => {
      const provider = infrastructure.getConfig().provider;
      expect(provider.aws).toBeDefined();
      expect(provider.aws.region).toBeDefined();
      expect(provider.aws.defaultTags).toBeDefined();
    });

    test('should have all required resource configurations', () => {
      const resources = infrastructure.getConfig().resources;
      expect(resources.vpc).toBeDefined();
      expect(resources.subnets).toBeDefined();
      expect(resources.security).toBeDefined();
      expect(resources.s3).toBeDefined();
    });

    test('should have complete VPC resource configuration', () => {
      const vpc = infrastructure.getConfig().resources.vpc;
      expect(vpc.cidrBlock).toBeDefined();
      expect(vpc.enableDnsHostnames).toBeDefined();
      expect(vpc.enableDnsSupport).toBeDefined();
      expect(vpc.internetGateway).toBeDefined();
      expect(vpc.natGateway).toBeDefined();
      expect(vpc.elasticIp).toBeDefined();
      expect(vpc.tags).toBeDefined();
    });

    test('should have complete S3 resource configuration', () => {
      const s3 = infrastructure.getConfig().resources.s3;
      expect(s3.bucket).toBeDefined();
      expect(s3.bucket.versioning).toBeDefined();
      expect(s3.bucket.encryption).toBeDefined();
      expect(s3.bucket.publicAccessBlock).toBeDefined();
      expect(s3.bucket.forceDestroy).toBeDefined();
      expect(s3.bucketPolicy).toBeDefined();
    });
  });
});
// terraform-infrastructure.test.ts

import { describe, expect, it, beforeEach, jest } from '@jest/globals';

// Mock types for Terraform resources
interface TerraformResource {
  id: string;
  attributes: Record<string, any>;
  dependencies?: string[];
}

interface VPCResource extends TerraformResource {
  attributes: {
    cidr_block: string;
    enable_dns_hostnames: boolean;
    enable_dns_support: boolean;
    tags: Record<string, string>;
  };
}

interface SubnetResource extends TerraformResource {
  attributes: {
    vpc_id: string;
    cidr_block: string;
    availability_zone: string;
    map_public_ip_on_launch: boolean;
    tags: Record<string, string>;
  };
}

interface InternetGatewayResource extends TerraformResource {
  attributes: {
    vpc_id: string;
    tags: Record<string, string>;
  };
}

interface NATGatewayResource extends TerraformResource {
  attributes: {
    allocation_id: string;
    subnet_id: string;
    tags: Record<string, string>;
  };
}

interface ElasticIPResource extends TerraformResource {
  attributes: {
    domain: string;
    tags: Record<string, string>;
  };
}

interface RouteTableResource extends TerraformResource {
  attributes: {
    vpc_id: string;
    tags: Record<string, string>;
  };
}

interface RouteResource extends TerraformResource {
  attributes: {
    route_table_id: string;
    destination_cidr_block: string;
    gateway_id?: string;
    nat_gateway_id?: string;
  };
}

interface SecurityGroupResource extends TerraformResource {
  attributes: {
    name: string;
    description: string;
    vpc_id: string;
    ingress: Array<{
      from_port: number;
      to_port: number;
      protocol: string;
      cidr_blocks?: string[];
      security_groups?: string[];
      description: string;
    }>;
    egress: Array<{
      from_port: number;
      to_port: number;
      protocol: string;
      cidr_blocks: string[];
      description: string;
    }>;
    tags: Record<string, string>;
  };
}

// Terraform configuration simulator class
class TerraformInfrastructure {
  private resources: Map<string, TerraformResource> = new Map();
  private variables: Map<string, any> = new Map();
  private locals: Map<string, any> = new Map();
  private outputs: Map<string, any> = new Map();

  constructor() {
    this.initializeConfiguration();
  }

  private initializeConfiguration(): void {
    // Initialize variables
    this.variables.set('aws_region', 'us-east-1');

    // Initialize locals
    const awsRegion = this.variables.get('aws_region');
    this.locals.set('vpc_cidr', '10.0.0.0/16');
    this.locals.set('availability_zones', [
      `${awsRegion}a`,
      `${awsRegion}b`,
      `${awsRegion}c`
    ]);

    const azs: Record<string, { index: number; az: string }> = {};
    const availabilityZones = this.locals.get('availability_zones');
    availabilityZones.forEach((az: string, idx: number) => {
      azs[az] = { index: idx, az: az };
    });
    this.locals.set('azs', azs);

    this.locals.set('common_tags', {
      Environment: 'Production',
      ManagedBy: 'Terraform',
      CostCenter: 'Web-App-Service'
    });

    // Create resources
    this.createVPC();
    this.createInternetGateway();
    this.createSubnets();
    this.createNATGateways();
    this.createRouteTables();
    this.createSecurityGroups();
    this.createOutputs();
  }

  private createVPC(): void {
    const vpc: VPCResource = {
      id: 'vpc-main',
      attributes: {
        cidr_block: this.locals.get('vpc_cidr'),
        enable_dns_hostnames: true,
        enable_dns_support: true,
        tags: {
          ...this.locals.get('common_tags'),
          Name: 'production-vpc'
        }
      }
    };
    this.resources.set('aws_vpc.main', vpc);
  }

  private createInternetGateway(): void {
    const igw: InternetGatewayResource = {
      id: 'igw-main',
      attributes: {
        vpc_id: 'vpc-main',
        tags: {
          ...this.locals.get('common_tags'),
          Name: 'production-igw'
        }
      },
      dependencies: ['aws_vpc.main']
    };
    this.resources.set('aws_internet_gateway.main', igw);
  }

  private createSubnets(): void {
    const azs = this.locals.get('azs');
    const vpcCidr = this.locals.get('vpc_cidr');

    // Create public subnets
    Object.entries(azs).forEach(([az, azData]: [string, any]) => {
      const publicSubnet: SubnetResource = {
        id: `subnet-public-${az}`,
        attributes: {
          vpc_id: 'vpc-main',
          cidr_block: this.cidrSubnet(vpcCidr, 8, azData.index),
          availability_zone: az,
          map_public_ip_on_launch: true,
          tags: {
            ...this.locals.get('common_tags'),
            Name: `public-subnet-${az}`,
            Type: 'Public'
          }
        },
        dependencies: ['aws_vpc.main']
      };
      this.resources.set(`aws_subnet.public["${az}"]`, publicSubnet);

      // Create private subnets
      const privateSubnet: SubnetResource = {
        id: `subnet-private-${az}`,
        attributes: {
          vpc_id: 'vpc-main',
          cidr_block: this.cidrSubnet(vpcCidr, 8, azData.index + 10),
          availability_zone: az,
          map_public_ip_on_launch: false,
          tags: {
            ...this.locals.get('common_tags'),
            Name: `private-subnet-${az}`,
            Type: 'Private'
          }
        },
        dependencies: ['aws_vpc.main']
      };
      this.resources.set(`aws_subnet.private["${az}"]`, privateSubnet);
    });
  }

  private createNATGateways(): void {
    const azs = this.locals.get('azs');

    Object.keys(azs).forEach((az: string) => {
      // Create Elastic IPs
      const eip: ElasticIPResource = {
        id: `eip-nat-${az}`,
        attributes: {
          domain: 'vpc',
          tags: {
            ...this.locals.get('common_tags'),
            Name: `nat-eip-${az}`
          }
        },
        dependencies: ['aws_internet_gateway.main']
      };
      this.resources.set(`aws_eip.nat["${az}"]`, eip);

      // Create NAT Gateways
      const natGateway: NATGatewayResource = {
        id: `nat-${az}`,
        attributes: {
          allocation_id: `eip-nat-${az}`,
          subnet_id: `subnet-public-${az}`,
          tags: {
            ...this.locals.get('common_tags'),
            Name: `nat-gateway-${az}`
          }
        },
        dependencies: ['aws_internet_gateway.main', `aws_eip.nat["${az}"]`, `aws_subnet.public["${az}"]`]
      };
      this.resources.set(`aws_nat_gateway.main["${az}"]`, natGateway);
    });
  }

  private createRouteTables(): void {
    const azs = this.locals.get('azs');

    // Create public route table
    const publicRouteTable: RouteTableResource = {
      id: 'rtb-public',
      attributes: {
        vpc_id: 'vpc-main',
        tags: {
          ...this.locals.get('common_tags'),
          Name: 'public-route-table',
          Type: 'Public'
        }
      },
      dependencies: ['aws_vpc.main']
    };
    this.resources.set('aws_route_table.public', publicRouteTable);

    // Create public route
    const publicRoute: RouteResource = {
      id: 'route-public-internet',
      attributes: {
        route_table_id: 'rtb-public',
        destination_cidr_block: '0.0.0.0/0',
        gateway_id: 'igw-main'
      },
      dependencies: ['aws_route_table.public', 'aws_internet_gateway.main']
    };
    this.resources.set('aws_route.public_internet', publicRoute);

    // Create private route tables and routes
    Object.keys(azs).forEach((az: string) => {
      const privateRouteTable: RouteTableResource = {
        id: `rtb-private-${az}`,
        attributes: {
          vpc_id: 'vpc-main',
          tags: {
            ...this.locals.get('common_tags'),
            Name: `private-route-table-${az}`,
            Type: 'Private'
          }
        },
        dependencies: ['aws_vpc.main']
      };
      this.resources.set(`aws_route_table.private["${az}"]`, privateRouteTable);

      const privateRoute: RouteResource = {
        id: `route-private-nat-${az}`,
        attributes: {
          route_table_id: `rtb-private-${az}`,
          destination_cidr_block: '0.0.0.0/0',
          nat_gateway_id: `nat-${az}`
        },
        dependencies: [`aws_route_table.private["${az}"]`, `aws_nat_gateway.main["${az}"]`]
      };
      this.resources.set(`aws_route.private_nat["${az}"]`, privateRoute);
    });
  }

  private createSecurityGroups(): void {
    // Web tier security group
    const webTierSG: SecurityGroupResource = {
      id: 'sg-web-tier',
      attributes: {
        name: 'web-tier-sg',
        description: 'Security group for web tier allowing HTTPS traffic',
        vpc_id: 'vpc-main',
        ingress: [{
          from_port: 443,
          to_port: 443,
          protocol: 'tcp',
          cidr_blocks: ['0.0.0.0/0'],
          description: 'Allow HTTPS from anywhere'
        }],
        egress: [{
          from_port: 0,
          to_port: 0,
          protocol: '-1',
          cidr_blocks: ['0.0.0.0/0'],
          description: 'Allow all outbound traffic'
        }],
        tags: {
          ...this.locals.get('common_tags'),
          Name: 'web-tier-sg',
          Tier: 'Web'
        }
      },
      dependencies: ['aws_vpc.main']
    };
    this.resources.set('aws_security_group.web_tier', webTierSG);

    // App tier security group
    const appTierSG: SecurityGroupResource = {
      id: 'sg-app-tier',
      attributes: {
        name: 'app-tier-sg',
        description: 'Security group for app tier allowing traffic from web tier',
        vpc_id: 'vpc-main',
        ingress: [{
          from_port: 8080,
          to_port: 8080,
          protocol: 'tcp',
          security_groups: ['sg-web-tier'],
          description: 'Allow traffic from Web Tier SG on port 8080'
        }],
        egress: [{
          from_port: 0,
          to_port: 0,
          protocol: '-1',
          cidr_blocks: ['0.0.0.0/0'],
          description: 'Allow all outbound traffic'
        }],
        tags: {
          ...this.locals.get('common_tags'),
          Name: 'app-tier-sg',
          Tier: 'Application'
        }
      },
      dependencies: ['aws_vpc.main', 'aws_security_group.web_tier']
    };
    this.resources.set('aws_security_group.app_tier', appTierSG);
  }

  private createOutputs(): void {
    const azs = this.locals.get('azs');
    
    this.outputs.set('vpc_id', 'vpc-main');
    
    const publicSubnetIds: Record<string, string> = {};
    const privateSubnetIds: Record<string, string> = {};
    const natGatewayIds: Record<string, string> = {};
    
    Object.keys(azs).forEach((az: string) => {
      publicSubnetIds[az] = `subnet-public-${az}`;
      privateSubnetIds[az] = `subnet-private-${az}`;
      natGatewayIds[az] = `nat-${az}`;
    });
    
    this.outputs.set('public_subnet_ids', publicSubnetIds);
    this.outputs.set('private_subnet_ids', privateSubnetIds);
    this.outputs.set('nat_gateway_ids', natGatewayIds);
  }

  private cidrSubnet(baseCidr: string, newBits: number, netNum: number): string {
    // Simplified CIDR subnet calculation
    const [baseIp, baseMask] = baseCidr.split('/');
    const newMask = parseInt(baseMask) + newBits;
    const octets = baseIp.split('.').map(o => parseInt(o));
    octets[2] = netNum;
    return `${octets.join('.')}/24`;
  }

  getResource(name: string): TerraformResource | undefined {
    return this.resources.get(name);
  }

  getVariable(name: string): any {
    return this.variables.get(name);
  }

  getLocal(name: string): any {
    return this.locals.get(name);
  }

  getOutput(name: string): any {
    return this.outputs.get(name);
  }

  getAllResources(): Map<string, TerraformResource> {
    return this.resources;
  }

  validateDependencies(): boolean {
    for (const [name, resource] of this.resources) {
      if (resource.dependencies) {
        for (const dep of resource.dependencies) {
          if (!this.resources.has(dep)) {
            return false;
          }
        }
      }
    }
    return true;
  }
}

// Test Suite
describe('Terraform Infrastructure Tests', () => {
  let infrastructure: TerraformInfrastructure;

  beforeEach(() => {
    infrastructure = new TerraformInfrastructure();
  });

  describe('Variables Tests', () => {
    it('should have aws_region variable set to us-east-1', () => {
      const region = infrastructure.getVariable('aws_region');
      expect(region).toBe('us-east-1');
    });
  });

  describe('Locals Tests', () => {
    it('should have VPC CIDR set to 10.0.0.0/16', () => {
      const vpcCidr = infrastructure.getLocal('vpc_cidr');
      expect(vpcCidr).toBe('10.0.0.0/16');
    });

    it('should have three availability zones', () => {
      const azs = infrastructure.getLocal('availability_zones');
      expect(azs).toHaveLength(3);
      expect(azs).toEqual(['us-east-1a', 'us-east-1b', 'us-east-1c']);
    });

    it('should have AZs map with correct structure', () => {
      const azsMap = infrastructure.getLocal('azs');
      expect(Object.keys(azsMap)).toHaveLength(3);
      expect(azsMap['us-east-1a']).toEqual({ index: 0, az: 'us-east-1a' });
      expect(azsMap['us-east-1b']).toEqual({ index: 1, az: 'us-east-1b' });
      expect(azsMap['us-east-1c']).toEqual({ index: 2, az: 'us-east-1c' });
    });

    it('should have common tags defined', () => {
      const tags = infrastructure.getLocal('common_tags');
      expect(tags).toEqual({
        Environment: 'Production',
        ManagedBy: 'Terraform',
        CostCenter: 'Web-App-Service'
      });
    });
  });

  describe('VPC Tests', () => {
    it('should create VPC with correct configuration', () => {
      const vpc = infrastructure.getResource('aws_vpc.main') as VPCResource;
      expect(vpc).toBeDefined();
      expect(vpc.attributes.cidr_block).toBe('10.0.0.0/16');
      expect(vpc.attributes.enable_dns_hostnames).toBe(true);
      expect(vpc.attributes.enable_dns_support).toBe(true);
      expect(vpc.attributes.tags.Name).toBe('production-vpc');
      expect(vpc.attributes.tags.Environment).toBe('Production');
    });
  });

  describe('Internet Gateway Tests', () => {
    it('should create Internet Gateway attached to VPC', () => {
      const igw = infrastructure.getResource('aws_internet_gateway.main') as InternetGatewayResource;
      expect(igw).toBeDefined();
      expect(igw.attributes.vpc_id).toBe('vpc-main');
      expect(igw.attributes.tags.Name).toBe('production-igw');
      expect(igw.dependencies).toContain('aws_vpc.main');
    });
  });

  describe('Subnet Tests', () => {
    const azs = ['us-east-1a', 'us-east-1b', 'us-east-1c'];

    azs.forEach((az, index) => {
      describe(`Availability Zone ${az}`, () => {
        it(`should create public subnet in ${az}`, () => {
          const subnet = infrastructure.getResource(`aws_subnet.public["${az}"]`) as SubnetResource;
          expect(subnet).toBeDefined();
          expect(subnet.attributes.vpc_id).toBe('vpc-main');
          expect(subnet.attributes.availability_zone).toBe(az);
          expect(subnet.attributes.map_public_ip_on_launch).toBe(true);
          expect(subnet.attributes.tags.Name).toBe(`public-subnet-${az}`);
          expect(subnet.attributes.tags.Type).toBe('Public');
        });

        it(`should create private subnet in ${az}`, () => {
          const subnet = infrastructure.getResource(`aws_subnet.private["${az}"]`) as SubnetResource;
          expect(subnet).toBeDefined();
          expect(subnet.attributes.vpc_id).toBe('vpc-main');
          expect(subnet.attributes.availability_zone).toBe(az);
          expect(subnet.attributes.map_public_ip_on_launch).toBe(false);
          expect(subnet.attributes.tags.Name).toBe(`private-subnet-${az}`);
          expect(subnet.attributes.tags.Type).toBe('Private');
        });
      });
    });

    it('should have exactly 6 subnets (3 public, 3 private)', () => {
      const allResources = infrastructure.getAllResources();
      const subnets = Array.from(allResources.entries())
        .filter(([key]) => key.startsWith('aws_subnet.'));
      expect(subnets).toHaveLength(6);
    });
  });

  describe('NAT Gateway Tests', () => {
    const azs = ['us-east-1a', 'us-east-1b', 'us-east-1c'];

    azs.forEach(az => {
      describe(`NAT Gateway for ${az}`, () => {
        it(`should create Elastic IP for NAT in ${az}`, () => {
          const eip = infrastructure.getResource(`aws_eip.nat["${az}"]`) as ElasticIPResource;
          expect(eip).toBeDefined();
          expect(eip.attributes.domain).toBe('vpc');
          expect(eip.attributes.tags.Name).toBe(`nat-eip-${az}`);
          expect(eip.dependencies).toContain('aws_internet_gateway.main');
        });

        it(`should create NAT Gateway in ${az}`, () => {
          const nat = infrastructure.getResource(`aws_nat_gateway.main["${az}"]`) as NATGatewayResource;
          expect(nat).toBeDefined();
          expect(nat.attributes.allocation_id).toBe(`eip-nat-${az}`);
          expect(nat.attributes.subnet_id).toBe(`subnet-public-${az}`);
          expect(nat.attributes.tags.Name).toBe(`nat-gateway-${az}`);
          expect(nat.dependencies).toContain('aws_internet_gateway.main');
        });
      });
    });
  });

  describe('Route Table Tests', () => {
    it('should create public route table', () => {
      const rtb = infrastructure.getResource('aws_route_table.public') as RouteTableResource;
      expect(rtb).toBeDefined();
      expect(rtb.attributes.vpc_id).toBe('vpc-main');
      expect(rtb.attributes.tags.Name).toBe('public-route-table');
      expect(rtb.attributes.tags.Type).toBe('Public');
    });

    it('should create public route to Internet Gateway', () => {
      const route = infrastructure.getResource('aws_route.public_internet') as RouteResource;
      expect(route).toBeDefined();
      expect(route.attributes.route_table_id).toBe('rtb-public');
      expect(route.attributes.destination_cidr_block).toBe('0.0.0.0/0');
      expect(route.attributes.gateway_id).toBe('igw-main');
    });

    const azs = ['us-east-1a', 'us-east-1b', 'us-east-1c'];
    azs.forEach(az => {
      describe(`Private Route Table for ${az}`, () => {
        it(`should create private route table for ${az}`, () => {
          const rtb = infrastructure.getResource(`aws_route_table.private["${az}"]`) as RouteTableResource;
          expect(rtb).toBeDefined();
          expect(rtb.attributes.vpc_id).toBe('vpc-main');
          expect(rtb.attributes.tags.Name).toBe(`private-route-table-${az}`);
          expect(rtb.attributes.tags.Type).toBe('Private');
        });

        it(`should create private route to NAT Gateway in ${az}`, () => {
          const route = infrastructure.getResource(`aws_route.private_nat["${az}"]`) as RouteResource;
          expect(route).toBeDefined();
          expect(route.attributes.route_table_id).toBe(`rtb-private-${az}`);
          expect(route.attributes.destination_cidr_block).toBe('0.0.0.0/0');
          expect(route.attributes.nat_gateway_id).toBe(`nat-${az}`);
        });
      });
    });
  });

  describe('Security Group Tests', () => {
    it('should create web tier security group', () => {
      const sg = infrastructure.getResource('aws_security_group.web_tier') as SecurityGroupResource;
      expect(sg).toBeDefined();
      expect(sg.attributes.name).toBe('web-tier-sg');
      expect(sg.attributes.description).toBe('Security group for web tier allowing HTTPS traffic');
      expect(sg.attributes.vpc_id).toBe('vpc-main');
      expect(sg.attributes.tags.Tier).toBe('Web');
    });

    it('should have correct ingress rules for web tier', () => {
      const sg = infrastructure.getResource('aws_security_group.web_tier') as SecurityGroupResource;
      expect(sg.attributes.ingress).toHaveLength(1);
      expect(sg.attributes.ingress[0]).toMatchObject({
        from_port: 443,
        to_port: 443,
        protocol: 'tcp',
        cidr_blocks: ['0.0.0.0/0'],
        description: 'Allow HTTPS from anywhere'
      });
    });

    it('should create app tier security group', () => {
      const sg = infrastructure.getResource('aws_security_group.app_tier') as SecurityGroupResource;
      expect(sg).toBeDefined();
      expect(sg.attributes.name).toBe('app-tier-sg');
      expect(sg.attributes.description).toBe('Security group for app tier allowing traffic from web tier');
      expect(sg.attributes.vpc_id).toBe('vpc-main');
      expect(sg.attributes.tags.Tier).toBe('Application');
    });

    it('should have correct ingress rules for app tier', () => {
      const sg = infrastructure.getResource('aws_security_group.app_tier') as SecurityGroupResource;
      expect(sg.attributes.ingress).toHaveLength(1);
      expect(sg.attributes.ingress[0]).toMatchObject({
        from_port: 8080,
        to_port: 8080,
        protocol: 'tcp',
        security_groups: ['sg-web-tier'],
        description: 'Allow traffic from Web Tier SG on port 8080'
      });
    });

    it('should have egress rules allowing all outbound traffic', () => {
      const webSG = infrastructure.getResource('aws_security_group.web_tier') as SecurityGroupResource;
      const appSG = infrastructure.getResource('aws_security_group.app_tier') as SecurityGroupResource;
      
      const expectedEgress = {
        from_port: 0,
        to_port: 0,
        protocol: '-1',
        cidr_blocks: ['0.0.0.0/0'],
        description: 'Allow all outbound traffic'
      };
      
      expect(webSG.attributes.egress[0]).toMatchObject(expectedEgress);
      expect(appSG.attributes.egress[0]).toMatchObject(expectedEgress);
    });
  });

  describe('Output Tests', () => {
    it('should output VPC ID', () => {
      const vpcId = infrastructure.getOutput('vpc_id');
      expect(vpcId).toBe('vpc-main');
    });

    it('should output public subnet IDs', () => {
      const subnetIds = infrastructure.getOutput('public_subnet_ids');
      expect(subnetIds).toEqual({
        'us-east-1a': 'subnet-public-us-east-1a',
        'us-east-1b': 'subnet-public-us-east-1b',
        'us-east-1c': 'subnet-public-us-east-1c'
      });
    });

    it('should output private subnet IDs', () => {
      const subnetIds = infrastructure.getOutput('private_subnet_ids');
      expect(subnetIds).toEqual({
        'us-east-1a': 'subnet-private-us-east-1a',
        'us-east-1b': 'subnet-private-us-east-1b',
        'us-east-1c': 'subnet-private-us-east-1c'
      });
    });

    it('should output NAT Gateway IDs', () => {
      const natIds = infrastructure.getOutput('nat_gateway_ids');
      expect(natIds).toEqual({
        'us-east-1a': 'nat-us-east-1a',
        'us-east-1b': 'nat-us-east-1b',
        'us-east-1c': 'nat-us-east-1c'
      });
    });
  });

  describe('Resource Dependency Validation', () => {
    it('should have all dependencies properly defined', () => {
      const isValid = infrastructure.validateDependencies();
      expect(isValid).toBe(true);
    });

    it('should have Internet Gateway depend on VPC', () => {
      const igw = infrastructure.getResource('aws_internet_gateway.main');
      expect(igw?.dependencies).toContain('aws_vpc.main');
    });

    it('should have subnets depend on VPC', () => {
      const publicSubnet = infrastructure.getResource('aws_subnet.public["us-east-1a"]');
      const privateSubnet = infrastructure.getResource('aws_subnet.private["us-east-1a"]');
      expect(publicSubnet?.dependencies).toContain('aws_vpc.main');
      expect(privateSubnet?.dependencies).toContain('aws_vpc.main');
    });

    it('should have NAT Gateways depend on EIPs and subnets', () => {
      const nat = infrastructure.getResource('aws_nat_gateway.main["us-east-1a"]');
      expect(nat?.dependencies).toContain('aws_internet_gateway.main');
      expect(nat?.dependencies).toContain('aws_eip.nat["us-east-1a"]');
      expect(nat?.dependencies).toContain('aws_subnet.public["us-east-1a"]');
    });
  });

  describe('Tag Validation', () => {
    it('should have common tags on all resources', () => {
      const resources = Array.from(infrastructure.getAllResources().values());
      const taggedResources = resources.filter((r: any) => r.attributes.tags);
      
      taggedResources.forEach((resource: any) => {
        expect(resource.attributes.tags.Environment).toBe('Production');
        expect(resource.attributes.tags.ManagedBy).toBe('Terraform');
        expect(resource.attributes.tags.CostCenter).toBe('Web-App-Service');
      });
    });
  });

  describe('Network Configuration Tests', () => {
    it('should have non-overlapping CIDR blocks for subnets', () => {
      const subnets = Array.from(infrastructure.getAllResources().entries())
        .filter(([key]) => key.startsWith('aws_subnet.'))
        .map(([, resource]) => (resource as SubnetResource).attributes.cidr_block);
      
      const uniqueCidrs = new Set(subnets);
      expect(uniqueCidrs.size).toBe(subnets.length);
    });

    it('should have public subnets with auto-assign public IP enabled', () => {
      const azs = ['us-east-1a', 'us-east-1b', 'us-east-1c'];
      azs.forEach(az => {
        const subnet = infrastructure.getResource(`aws_subnet.public["${az}"]`) as SubnetResource;
        expect(subnet.attributes.map_public_ip_on_launch).toBe(true);
      });
    });

    it('should have private subnets with auto-assign public IP disabled', () => {
      const azs = ['us-east-1a', 'us-east-1b', 'us-east-1c'];
      azs.forEach(az => {
        const subnet = infrastructure.getResource(`aws_subnet.private["${az}"]`) as SubnetResource;
        expect(subnet.attributes.map_public_ip_on_launch).toBe(false);
      });
    });
  });

  describe('High Availability Tests', () => {
    it('should deploy resources across three availability zones', () => {
      const azs = infrastructure.getLocal('availability_zones');
      expect(azs).toHaveLength(3);
    });

    it('should have NAT Gateway in each availability zone', () => {
      const natGateways = Array.from(infrastructure.getAllResources().entries())
        .filter(([key]) => key.startsWith('aws_nat_gateway.'));
      expect(natGateways).toHaveLength(3);
    });

    it('should have separate route table for each private subnet', () => {
      const privateRouteTables = Array.from(infrastructure.getAllResources().entries())
        .filter(([key]) => key.startsWith('aws_route_table.private'));
      expect(privateRouteTables).toHaveLength(3);
    });
  });

  describe('Resource Count Tests', () => {
    it('should create exactly 1 VPC', () => {
      const vpcs = Array.from(infrastructure.getAllResources().entries())
        .filter(([key]) => key.startsWith('aws_vpc.'));
      expect(vpcs).toHaveLength(1);
    });

    it('should create exactly 1 Internet Gateway', () => {
      const igws = Array.from(infrastructure.getAllResources().entries())
        .filter(([key]) => key.startsWith('aws_internet_gateway.'));
      expect(igws).toHaveLength(1);
    });

    it('should create exactly 3 Elastic IPs', () => {
      const eips = Array.from(infrastructure.getAllResources().entries())
        .filter(([key]) => key.startsWith('aws_eip.'));
      expect(eips).toHaveLength(3);
    });

    it('should create exactly 3 NAT Gateways', () => {
      const nats = Array.from(infrastructure.getAllResources().entries())
        .filter(([key]) => key.startsWith('aws_nat_gateway.'));
      expect(nats).toHaveLength(3);
    });

    it('should create exactly 4 route tables (1 public + 3 private)', () => {
      const routeTables = Array.from(infrastructure.getAllResources().entries())
        .filter(([key]) => key.startsWith('aws_route_table.'));
      expect(routeTables).toHaveLength(4);
    });

    it('should create exactly 2 security groups', () => {
      const sgs = Array.from(infrastructure.getAllResources().entries())
        .filter(([key]) => key.startsWith('aws_security_group.'));
      expect(sgs).toHaveLength(2);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle resource lookup for non-existent resources', () => {
      const resource = infrastructure.getResource('non_existent_resource');
      expect(resource).toBeUndefined();
    });

    it('should handle variable lookup for non-existent variables', () => {
      const variable = infrastructure.getVariable('non_existent_variable');
      expect(variable).toBeUndefined();
    });

    it('should maintain resource integrity after multiple operations', () => {
      const initialResourceCount = infrastructure.getAllResources().size;
      const vpc1 = infrastructure.getResource('aws_vpc.main');
      const vpc2 = infrastructure.getResource('aws_vpc.main');
      expect(vpc1).toBe(vpc2);
      expect(infrastructure.getAllResources().size).toBe(initialResourceCount);
    });
  });
});

// Export for coverage reporting
export { TerraformInfrastructure };
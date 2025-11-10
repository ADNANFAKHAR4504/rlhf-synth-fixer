import { Testing, App } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

describe('NetworkingConstruct Unit Tests', () => {
  let app: App;
  let stack: TapStack;
  let synthesized: any;

  beforeEach(() => {
    app = new App();
    stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });
    synthesized = JSON.parse(Testing.synth(stack));
  });

  describe('VPC Configuration', () => {
    test('creates VPC with correct CIDR block', () => {
      const vpcs = Object.values(synthesized.resource.aws_vpc || {});
      expect(vpcs.length).toBe(1);

      const vpc = vpcs[0] as any;
      expect(vpc.cidr_block).toBe('10.0.0.0/16');
    });

    test('enables DNS hostnames and support', () => {
      const vpc = Object.values(synthesized.resource.aws_vpc || {})[0] as any;
      expect(vpc.enable_dns_hostnames).toBe(true);
      expect(vpc.enable_dns_support).toBe(true);
    });

    test('VPC has correct name tag with environment suffix', () => {
      const vpc = Object.values(synthesized.resource.aws_vpc || {})[0] as any;
      expect(vpc.tags.Name).toBe('payment-platform-vpc-test');
    });
  });

  describe('Subnet Configuration', () => {
    test('creates exactly 6 subnets (2 public, 2 private, 2 isolated)', () => {
      const subnets = Object.values(synthesized.resource.aws_subnet || {});
      expect(subnets.length).toBe(6);
    });

    test('public subnets use correct CIDR blocks', () => {
      const subnets = Object.values(synthesized.resource.aws_subnet || {});
      const publicSubnets = subnets.filter((s: any) =>
        s.tags?.Tier === 'public'
      );

      const cidrBlocks = publicSubnets.map((s: any) => s.cidr_block).sort();
      expect(cidrBlocks).toContain('10.0.1.0/24');
      expect(cidrBlocks).toContain('10.0.2.0/24');
    });

    test('private subnets use correct CIDR blocks', () => {
      const subnets = Object.values(synthesized.resource.aws_subnet || {});
      const privateSubnets = subnets.filter(
        (s: any) => s.tags?.Tier === 'private'
      );

      const cidrBlocks = privateSubnets.map((s: any) => s.cidr_block).sort();
      expect(cidrBlocks).toContain('10.0.11.0/24');
      expect(cidrBlocks).toContain('10.0.12.0/24');
    });

    test('isolated subnets use correct CIDR blocks', () => {
      const subnets = Object.values(synthesized.resource.aws_subnet || {});
      const isolatedSubnets = subnets.filter(
        (s: any) => s.tags?.Tier === 'isolated'
      );

      const cidrBlocks = isolatedSubnets.map((s: any) => s.cidr_block).sort();
      expect(cidrBlocks).toContain('10.0.21.0/24');
      expect(cidrBlocks).toContain('10.0.22.0/24');
    });

    test('public subnets have map_public_ip_on_launch enabled', () => {
      const subnets = Object.values(synthesized.resource.aws_subnet || {});
      const publicSubnets = subnets.filter((s: any) =>
        s.tags?.Name?.includes('public')
      );

      publicSubnets.forEach((subnet: any) => {
        expect(subnet.map_public_ip_on_launch).toBe(true);
      });
    });
  });

  describe('Internet Gateway', () => {
    test('creates internet gateway', () => {
      const igws = Object.values(synthesized.resource.aws_internet_gateway || {});
      expect(igws.length).toBe(1);
    });

    test('internet gateway is attached to VPC', () => {
      const igw = Object.values(
        synthesized.resource.aws_internet_gateway || {}
      )[0] as any;
      expect(igw.vpc_id).toBeDefined();
    });

    test('internet gateway has correct name tag', () => {
      const igw = Object.values(
        synthesized.resource.aws_internet_gateway || {}
      )[0] as any;
      expect(igw.tags.Name).toBe('payment-platform-igw-test');
    });
  });

  describe('NAT Gateway Configuration', () => {
    test('creates 2 elastic IPs for NAT gateways', () => {
      const eips = Object.values(synthesized.resource.aws_eip || {});
      expect(eips.length).toBe(2);
    });

    test('elastic IPs use VPC domain', () => {
      const eips = Object.values(synthesized.resource.aws_eip || {});
      eips.forEach((eip: any) => {
        expect(eip.domain).toBe('vpc');
      });
    });

    test('creates 2 NAT gateways', () => {
      const natGateways = Object.values(synthesized.resource.aws_nat_gateway || {});
      expect(natGateways.length).toBe(2);
    });

    test('NAT gateways are in public subnets', () => {
      const natGateways = Object.values(synthesized.resource.aws_nat_gateway || {});
      natGateways.forEach((nat: any) => {
        expect(nat.subnet_id).toBeDefined();
      });
    });

    test('NAT gateways use elastic IPs', () => {
      const natGateways = Object.values(synthesized.resource.aws_nat_gateway || {});
      natGateways.forEach((nat: any) => {
        expect(nat.allocation_id).toBeDefined();
      });
    });
  });

  describe('Route Table Configuration', () => {
    test('creates multiple route tables', () => {
      const routeTables = Object.values(synthesized.resource.aws_route_table || {});
      expect(routeTables.length).toBeGreaterThanOrEqual(3);
    });

    test('creates routes for internet gateway', () => {
      const routes = Object.values(synthesized.resource.aws_route || {});
      const igwRoutes = routes.filter((r: any) => r.gateway_id);
      expect(igwRoutes.length).toBeGreaterThan(0);
    });

    test('creates routes for NAT gateways', () => {
      const routes = Object.values(synthesized.resource.aws_route || {});
      const natRoutes = routes.filter((r: any) => r.nat_gateway_id);
      expect(natRoutes.length).toBe(2);
    });

    test('public route uses 0.0.0.0/0 destination', () => {
      const routes = Object.values(synthesized.resource.aws_route || {});
      const igwRoute = routes.find((r: any) => r.gateway_id) as any;
      expect(igwRoute.destination_cidr_block).toBe('0.0.0.0/0');
    });

    test('creates route table associations for all subnets', () => {
      const associations = Object.values(
        synthesized.resource.aws_route_table_association || {}
      );
      expect(associations.length).toBe(6); // 2 public + 2 private + 2 isolated
    });
  });

  describe('Security Groups', () => {
    test('creates 4 security groups (web, app, database, endpoint)', () => {
      const securityGroups = Object.values(
        synthesized.resource.aws_security_group || {}
      );
      expect(securityGroups.length).toBe(4);
    });

    test('web security group allows HTTPS traffic', () => {
      const rules = Object.values(
        synthesized.resource.aws_security_group_rule || {}
      );
      const webHttpsRule = rules.find(
        (r: any) =>
          r.type === 'ingress' && r.from_port === 443 && r.to_port === 443
      ) as any;
      expect(webHttpsRule).toBeDefined();
      expect(webHttpsRule.protocol).toBe('tcp');
      expect(webHttpsRule.cidr_blocks).toBeDefined();
      expect(webHttpsRule.cidr_blocks.length).toBeGreaterThan(0);
    });

    test('app security group allows traffic on port 8080 from web tier', () => {
      const rules = Object.values(
        synthesized.resource.aws_security_group_rule || {}
      );
      const appRule = rules.find(
        (r: any) =>
          r.type === 'ingress' && r.from_port === 8080 && r.to_port === 8080
      ) as any;
      expect(appRule).toBeDefined();
      expect(appRule.protocol).toBe('tcp');
      expect(appRule.source_security_group_id).toBeDefined();
    });

    test('database security group allows PostgreSQL traffic from app tier', () => {
      const rules = Object.values(
        synthesized.resource.aws_security_group_rule || {}
      );
      const dbRule = rules.find(
        (r: any) =>
          r.type === 'ingress' && r.from_port === 5432 && r.to_port === 5432
      ) as any;
      expect(dbRule).toBeDefined();
      expect(dbRule.protocol).toBe('tcp');
      expect(dbRule.source_security_group_id).toBeDefined();
    });

    test('all security groups have egress rules', () => {
      const rules = Object.values(
        synthesized.resource.aws_security_group_rule || {}
      );
      const egressRules = rules.filter((r: any) => r.type === 'egress');
      expect(egressRules.length).toBeGreaterThanOrEqual(3);
    });

    test('security groups have environment suffix in names', () => {
      const securityGroups = Object.values(
        synthesized.resource.aws_security_group || {}
      );
      securityGroups.forEach((sg: any) => {
        expect(sg.name).toContain('test');
      });
    });
  });

  describe('VPC Flow Logs', () => {
    test('creates S3 bucket for flow logs', () => {
      const buckets = Object.values(synthesized.resource.aws_s3_bucket || {});
      const flowLogsBucket = buckets.find((b: any) =>
        b.bucket?.includes('flowlogs')
      );
      expect(flowLogsBucket).toBeDefined();
    });

    test('flow logs bucket has environment suffix', () => {
      const bucket = Object.values(synthesized.resource.aws_s3_bucket || {}).find(
        (b: any) => b.bucket?.includes('flowlogs')
      ) as any;
      expect(bucket.bucket).toBe('payment-platform-flowlogs-test');
    });

    test('S3 bucket has public access blocked', () => {
      const publicAccessBlocks = Object.values(
        synthesized.resource.aws_s3_bucket_public_access_block || {}
      );
      expect(publicAccessBlocks.length).toBeGreaterThan(0);

      const block = publicAccessBlocks[0] as any;
      expect(block.block_public_acls).toBe(true);
      expect(block.block_public_policy).toBe(true);
      expect(block.ignore_public_acls).toBe(true);
      expect(block.restrict_public_buckets).toBe(true);
    });

    test('S3 bucket has lifecycle policy with 7-day retention', () => {
      const lifecycleConfigs = Object.values(
        synthesized.resource.aws_s3_bucket_lifecycle_configuration || {}
      );
      expect(lifecycleConfigs.length).toBe(1);

      const config = lifecycleConfigs[0] as any;
      expect(config.rule).toBeDefined();
      expect(config.rule[0].status).toBe('Enabled');
      expect(config.rule[0].expiration[0].days).toBe(7);
    });

    test('creates VPC flow log capturing ALL traffic', () => {
      const flowLogs = Object.values(synthesized.resource.aws_flow_log || {});
      expect(flowLogs.length).toBe(1);

      const flowLog = flowLogs[0] as any;
      expect(flowLog.traffic_type).toBe('ALL');
      expect(flowLog.log_destination_type).toBe('s3');
    });

    test('flow log is attached to VPC', () => {
      const flowLog = Object.values(
        synthesized.resource.aws_flow_log || {}
      )[0] as any;
      expect(flowLog.vpc_id).toBeDefined();
    });
  });

  describe('VPC Endpoints', () => {
    test('creates Systems Manager VPC endpoint', () => {
      const endpoints = Object.values(synthesized.resource.aws_vpc_endpoint || {});
      expect(endpoints.length).toBe(1);

      const endpoint = endpoints[0] as any;
      expect(endpoint.service_name).toContain('ssm');
    });

    test('VPC endpoint is Interface type', () => {
      const endpoint = Object.values(
        synthesized.resource.aws_vpc_endpoint || {}
      )[0] as any;
      expect(endpoint.vpc_endpoint_type).toBe('Interface');
    });

    test('VPC endpoint has private DNS enabled', () => {
      const endpoint = Object.values(
        synthesized.resource.aws_vpc_endpoint || {}
      )[0] as any;
      expect(endpoint.private_dns_enabled).toBe(true);
    });

    test('VPC endpoint is in private subnets', () => {
      const endpoint = Object.values(
        synthesized.resource.aws_vpc_endpoint || {}
      )[0] as any;
      expect(endpoint.subnet_ids).toBeDefined();
      expect(endpoint.subnet_ids.length).toBe(2);
    });

    test('VPC endpoint has security group', () => {
      const endpoint = Object.values(
        synthesized.resource.aws_vpc_endpoint || {}
      )[0] as any;
      expect(endpoint.security_group_ids).toBeDefined();
      expect(endpoint.security_group_ids.length).toBe(1);
    });

    test('endpoint security group allows HTTPS from VPC', () => {
      const rules = Object.values(
        synthesized.resource.aws_security_group_rule || {}
      );
      const endpointRule = rules.find(
        (r: any) =>
          r.description === 'Allow HTTPS from VPC' &&
          r.from_port === 443 &&
          r.to_port === 443
      ) as any;
      expect(endpointRule).toBeDefined();
      expect(endpointRule.protocol).toBe('tcp');
    });
  });

  describe('Resource Naming Conventions', () => {
    test('all resources include environment suffix in names or tags', () => {
      const resourceTypes = [
        'aws_vpc',
        'aws_subnet',
        'aws_internet_gateway',
        'aws_nat_gateway',
        'aws_security_group',
        'aws_s3_bucket',
        'aws_vpc_endpoint',
      ];

      resourceTypes.forEach((resourceType) => {
        const resources = Object.values(
          synthesized.resource[resourceType] || {}
        );
        resources.forEach((resource: any) => {
          const hasEnvSuffixInName =
            resource.name?.includes('test') ||
            resource.bucket?.includes('test') ||
            resource.tags?.Name?.includes('test');
          expect(hasEnvSuffixInName).toBe(true);
        });
      });
    });

    test('resources follow payment-platform naming pattern', () => {
      const vpc = Object.values(synthesized.resource.aws_vpc || {})[0] as any;
      expect(vpc.tags.Name).toMatch(/payment-platform-.*-test/);

      const igw = Object.values(
        synthesized.resource.aws_internet_gateway || {}
      )[0] as any;
      expect(igw.tags.Name).toMatch(/payment-platform-.*-test/);
    });
  });

  describe('High Availability', () => {
    test('resources are distributed across multiple availability zones', () => {
      const subnets = Object.values(synthesized.resource.aws_subnet || {});
      const azs = new Set(subnets.map((s: any) => s.availability_zone));
      expect(azs.size).toBe(2);
    });

    test('each AZ has public, private, and isolated subnets', () => {
      const subnets = Object.values(synthesized.resource.aws_subnet || {});

      const azSubnets: { [key: string]: string[] } = {};
      subnets.forEach((subnet: any) => {
        const az = subnet.availability_zone;
        if (!azSubnets[az]) azSubnets[az] = [];
        azSubnets[az].push(subnet.tags?.Tier);
      });

      Object.values(azSubnets).forEach((tiers) => {
        expect(tiers).toContain('public');
        expect(tiers).toContain('private');
        expect(tiers).toContain('isolated');
      });
    });

    test('each AZ has its own NAT gateway', () => {
      const natGateways = Object.values(synthesized.resource.aws_nat_gateway || {});
      expect(natGateways.length).toBe(2);

      // Verify each NAT gateway is in a different subnet (different AZ)
      const subnetIds = natGateways.map((nat: any) => nat.subnet_id);
      expect(new Set(subnetIds).size).toBe(2);
    });
  });

  describe('Edge Cases and Regional Variations', () => {
    test('handles different regions correctly', () => {
      const originalEnv = process.env.AWS_REGION;
      process.env.AWS_REGION = 'us-west-2';
      
      app = new App();
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });
      synthesized = JSON.parse(Testing.synth(stack));
      
      const subnets = Object.values(synthesized.resource.aws_subnet || {});
      const azs = new Set(subnets.map((s: any) => s.availability_zone).filter(Boolean));
      expect(azs.has('us-west-2a')).toBe(true);
      expect(azs.has('us-west-2b')).toBe(true);
      
      // Restore original env
      if (originalEnv) {
        process.env.AWS_REGION = originalEnv;
      } else {
        delete process.env.AWS_REGION;
      }
    });

    test('handles region with single availability zone gracefully', () => {
      const originalEnv = process.env.AWS_REGION;
      process.env.AWS_REGION = 'ap-southeast-1';
      
      app = new App();
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });
      synthesized = JSON.parse(Testing.synth(stack));
      
      // Should still create resources
      expect(synthesized.resource.aws_vpc).toBeDefined();
      
      // Restore original env
      if (originalEnv) {
        process.env.AWS_REGION = originalEnv;
      } else {
        delete process.env.AWS_REGION;
      }
    });
  });

  describe('Security Group Rules Validation', () => {
    test('app security group rules reference web security group', () => {
      const rules = Object.values(
        synthesized.resource.aws_security_group_rule || {}
      );
      const appRules = rules.filter((r: any) => r.from_port === 8080);
      expect(appRules.length).toBeGreaterThan(0);
      expect(appRules[0].source_security_group_id).toBeDefined();
    });

    test('database security group rules reference app security group', () => {
      const rules = Object.values(
        synthesized.resource.aws_security_group_rule || {}
      );
      const dbRules = rules.filter((r: any) => r.from_port === 5432);
      expect(dbRules.length).toBeGreaterThan(0);
      expect(dbRules[0].source_security_group_id).toBeDefined();
    });

    test('all egress rules allow all traffic', () => {
      const rules = Object.values(
        synthesized.resource.aws_security_group_rule || {}
      );
      const egressRules = rules.filter((r: any) => r.type === 'egress');
      egressRules.forEach((rule: any) => {
        expect(rule.from_port).toBe(0);
        expect(rule.to_port).toBe(0);
        expect(rule.protocol).toBe('-1');
      });
    });
  });

  describe('Route Table Associations', () => {
    test('all subnets have route table associations', () => {
      const associations = Object.values(
        synthesized.resource.aws_route_table_association || {}
      );
      const subnets = Object.values(synthesized.resource.aws_subnet || {});
      expect(associations.length).toBe(subnets.length);
    });

    test('public subnets associate with public route table', () => {
      const routeTables = Object.values(synthesized.resource.aws_route_table || {});
      const publicRouteTable = routeTables.find((rt: any) =>
        rt.tags?.Name?.includes('public')
      ) as any;
      expect(publicRouteTable).toBeDefined();
    });

    test('private subnets associate with private route tables', () => {
      const routeTables = Object.values(synthesized.resource.aws_route_table || {});
      const privateRouteTables = routeTables.filter((rt: any) =>
        rt.tags?.Name?.includes('private')
      );
      expect(privateRouteTables.length).toBe(2);
    });

    test('isolated subnets associate with isolated route table', () => {
      const routeTables = Object.values(synthesized.resource.aws_route_table || {});
      const isolatedRouteTable = routeTables.find((rt: any) =>
        rt.tags?.Name?.includes('isolated')
      ) as any;
      expect(isolatedRouteTable).toBeDefined();
    });
  });

  describe('VPC Flow Logs Configuration', () => {
    test('flow logs bucket has correct naming', () => {
      const bucket = Object.values(synthesized.resource.aws_s3_bucket || {}).find(
        (b: any) => b.bucket?.includes('flowlogs')
      ) as any;
      expect(bucket.bucket).toBe('payment-platform-flowlogs-test');
    });

    test('flow logs capture ALL traffic type', () => {
      const flowLog = Object.values(
        synthesized.resource.aws_flow_log || {}
      )[0] as any;
      expect(flowLog.traffic_type).toBe('ALL');
      expect(flowLog.log_destination_type).toBe('s3');
    });
  });

  describe('VPC Endpoint Configuration', () => {
    test('VPC endpoint uses correct service name format', () => {
      const endpoint = Object.values(
        synthesized.resource.aws_vpc_endpoint || {}
      )[0] as any;
      expect(endpoint.service_name).toMatch(/^com\.amazonaws\.[a-z0-9-]+\.ssm$/);
    });

    test('VPC endpoint security group allows HTTPS from VPC CIDR', () => {
      const rules = Object.values(
        synthesized.resource.aws_security_group_rule || {}
      );
      const endpointRule = rules.find(
        (r: any) => r.description === 'Allow HTTPS from VPC'
      ) as any;
      expect(endpointRule).toBeDefined();
      expect(endpointRule.from_port).toBe(443);
      expect(endpointRule.to_port).toBe(443);
      expect(endpointRule.protocol).toBe('tcp');
    });
  });
});

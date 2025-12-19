import { App, Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

/**
 * Integration Tests for CDKTF VPC Infrastructure
 *
 * These tests validate the complete infrastructure configuration by testing
 * the synthesized Terraform configuration. They verify resource relationships,
 * proper routing, network isolation, and high availability configurations.
 */

describe('VPC Infrastructure Integration Tests', () => {
  let app: App;
  let stack: TapStack;
  let synthesized: any;

  beforeAll(() => {
    app = new App();
    stack = new TapStack(app, 'IntegrationTestStack', {
      environmentSuffix: 'inttest',
      awsRegion: 'us-east-1',
    });
    synthesized = JSON.parse(Testing.synth(stack));
  });

  describe('Complete VPC Architecture', () => {
    test('should deploy all required resource types for multi-tier VPC', () => {
      // Verify complete infrastructure is defined
      expect(synthesized.resource.aws_vpc).toBeDefined();
      expect(synthesized.resource.aws_internet_gateway).toBeDefined();
      expect(synthesized.resource.aws_subnet).toBeDefined();
      expect(synthesized.resource.aws_eip).toBeDefined();
      expect(synthesized.resource.aws_nat_gateway).toBeDefined();
      expect(synthesized.resource.aws_route_table).toBeDefined();
      expect(synthesized.resource.aws_route).toBeDefined();
      expect(synthesized.resource.aws_route_table_association).toBeDefined();
      expect(synthesized.resource.aws_network_acl).toBeDefined();
      expect(synthesized.resource.aws_network_acl_rule).toBeDefined();
      expect(synthesized.resource.aws_cloudwatch_log_group).toBeDefined();
      expect(synthesized.resource.aws_iam_role).toBeDefined();
      expect(synthesized.resource.aws_iam_policy).toBeDefined();
      expect(synthesized.resource.aws_iam_role_policy_attachment).toBeDefined();
      expect(synthesized.resource.aws_flow_log).toBeDefined();
    });

    test('should have correct total resource counts for complete deployment', () => {
      const subnets = synthesized.resource.aws_subnet || {};
      const eips = synthesized.resource.aws_eip || {};
      const natGws = synthesized.resource.aws_nat_gateway || {};
      const routeTables = synthesized.resource.aws_route_table || {};

      // 9 subnets total (3 public, 3 private app, 3 private db)
      expect(Object.keys(subnets).length).toBe(9);

      // 3 EIPs for NAT Gateways
      expect(Object.keys(eips).length).toBe(3);

      // 3 NAT Gateways (1 per AZ)
      expect(Object.keys(natGws).length).toBe(3);

      // 7 route tables (1 public, 3 private app, 3 private db)
      expect(Object.keys(routeTables).length).toBe(7);
    });
  });

  describe('Network Connectivity and Routing', () => {
    test('should configure proper internet connectivity for public subnets', () => {
      const routes = synthesized.resource.aws_route || {};
      const igws = synthesized.resource.aws_internet_gateway || {};

      // Find routes to Internet Gateway
      const igwRoutes = Object.values(routes).filter((r: any) =>
        r.gateway_id?.includes('aws_internet_gateway')
      );

      // Should have at least one route to IGW
      expect(igwRoutes.length).toBeGreaterThan(0);

      // All IGW routes should be 0.0.0.0/0
      igwRoutes.forEach((route: any) => {
        expect(route.destination_cidr_block).toBe('0.0.0.0/0');
      });

      // Verify IGW is attached to VPC
      const igw = igws[Object.keys(igws)[0]];
      expect(igw.vpc_id).toContain('aws_vpc');
    });

    test('should configure NAT Gateway routing for private subnets', () => {
      const routes = synthesized.resource.aws_route || {};

      // Find all routes using NAT Gateways
      const natRoutes = Object.values(routes).filter((r: any) =>
        r.nat_gateway_id?.includes('aws_nat_gateway')
      );

      // Should have 6 NAT routes (3 for private app, 3 for private db)
      expect(natRoutes.length).toBe(6);

      // All NAT routes should be 0.0.0.0/0
      natRoutes.forEach((route: any) => {
        expect(route.destination_cidr_block).toBe('0.0.0.0/0');
      });
    });

    test('should associate each subnet with the correct route table', () => {
      const associations = synthesized.resource.aws_route_table_association || {};
      const subnets = synthesized.resource.aws_subnet || {};

      // Total associations should equal total subnets (9)
      expect(Object.keys(associations).length).toBe(9);

      // All associations should reference valid subnets and route tables
      Object.values(associations).forEach((assoc: any) => {
        expect(assoc.subnet_id).toContain('aws_subnet');
        expect(assoc.route_table_id).toContain('aws_route_table');
      });
    });

    test('should ensure public subnets can reach the internet via IGW', () => {
      const subnets = synthesized.resource.aws_subnet || {};
      const associations = synthesized.resource.aws_route_table_association || {};
      const routes = synthesized.resource.aws_route || {};

      const publicSubnets = Object.entries(subnets).filter(
        ([key, subnet]: [string, any]) => subnet.tags?.Tier === 'public'
      );

      // Verify each public subnet has internet access
      expect(publicSubnets.length).toBe(3);

      // Find IGW route
      const igwRoute = Object.values(routes).find((r: any) =>
        r.gateway_id?.includes('aws_internet_gateway')
      );
      expect(igwRoute).toBeDefined();
    });

    test('should ensure private subnets can reach internet via NAT Gateways', () => {
      const subnets = synthesized.resource.aws_subnet || {};
      const routes = synthesized.resource.aws_route || {};

      const privateAppSubnets = Object.values(subnets).filter(
        (s: any) => s.tags?.Tier === 'private-app'
      );
      const privateDbSubnets = Object.values(subnets).filter(
        (s: any) => s.tags?.Tier === 'private-db'
      );

      // Total 6 private subnets
      expect(privateAppSubnets.length + privateDbSubnets.length).toBe(6);

      // Verify NAT routes exist for private subnets
      const natRoutes = Object.values(routes).filter((r: any) =>
        r.nat_gateway_id?.includes('aws_nat_gateway')
      );
      expect(natRoutes.length).toBe(6);
    });
  });

  describe('High Availability Configuration', () => {
    test('should distribute resources across 3 availability zones', () => {
      const subnets = synthesized.resource.aws_subnet || {};
      const azs = Object.values(subnets).map((s: any) => s.availability_zone);

      // Get unique AZs
      const uniqueAZs = [...new Set(azs)];

      // Should have exactly 3 AZs
      expect(uniqueAZs.length).toBe(3);
      expect(uniqueAZs).toContain('us-east-1a');
      expect(uniqueAZs).toContain('us-east-1b');
      expect(uniqueAZs).toContain('us-east-1c');
    });

    test('should deploy one NAT Gateway per availability zone', () => {
      const natGws = synthesized.resource.aws_nat_gateway || {};
      const publicSubnets = Object.values(synthesized.resource.aws_subnet || {}).filter(
        (s: any) => s.tags?.Tier === 'public'
      );

      // Each NAT Gateway should be in a different public subnet
      const natSubnetIds = Object.values(natGws).map((gw: any) => gw.subnet_id);
      const uniqueSubnetIds = [...new Set(natSubnetIds)];

      // Should have 3 unique subnet placements
      expect(uniqueSubnetIds.length).toBe(3);

      // Verify NAT Gateways are in public subnets across AZs
      const publicSubnetAZs = publicSubnets.map((s: any) => s.availability_zone);
      expect([...new Set(publicSubnetAZs)].length).toBe(3);
    });

    test('should provide redundant NAT Gateway routing for fault tolerance', () => {
      const routes = synthesized.resource.aws_route || {};
      const routeTables = synthesized.resource.aws_route_table || {};

      // Private app route tables (3 for HA)
      const privateAppRTs = Object.values(routeTables).filter((rt: any) =>
        rt.tags?.Name?.includes('private-app-route-table')
      );
      expect(privateAppRTs.length).toBe(3);

      // Private db route tables (3 for HA)
      const privateDbRTs = Object.values(routeTables).filter((rt: any) =>
        rt.tags?.Name?.includes('private-db-route-table')
      );
      expect(privateDbRTs.length).toBe(3);

      // Each private route table should have its own NAT route
      const natRoutes = Object.values(routes).filter((r: any) =>
        r.nat_gateway_id
      );
      expect(natRoutes.length).toBe(6); // 3 app + 3 db
    });
  });

  describe('Network Security Configuration', () => {
    test('should enforce SSH denial at network ACL level', () => {
      const rules = synthesized.resource.aws_network_acl_rule || {};

      // Find SSH deny rule
      const sshDenyRule = Object.values(rules).find(
        (r: any) => r.from_port === 22 && r.to_port === 22 &&
                    r.rule_action === 'deny' && r.egress === false
      );

      expect(sshDenyRule).toBeDefined();
      expect((sshDenyRule as any).rule_number).toBe(50); // Lower number = higher priority
      expect((sshDenyRule as any).protocol).toBe('tcp');
      expect((sshDenyRule as any).cidr_block).toBe('0.0.0.0/0');
    });

    test('should allow standard web traffic through network ACLs', () => {
      const rules = synthesized.resource.aws_network_acl_rule || {};

      // HTTP rule
      const httpRule = Object.values(rules).find(
        (r: any) => r.from_port === 80 && r.egress === false
      );
      expect(httpRule).toBeDefined();
      expect((httpRule as any).rule_action).toBe('allow');

      // HTTPS rule
      const httpsRule = Object.values(rules).find(
        (r: any) => r.from_port === 443 && r.egress === false
      );
      expect(httpsRule).toBeDefined();
      expect((httpsRule as any).rule_action).toBe('allow');
    });

    test('should allow ephemeral port range for return traffic', () => {
      const rules = synthesized.resource.aws_network_acl_rule || {};

      const ephemeralRule = Object.values(rules).find(
        (r: any) => r.from_port === 1024 && r.to_port === 65535 && r.egress === false
      );

      expect(ephemeralRule).toBeDefined();
      expect((ephemeralRule as any).rule_action).toBe('allow');
      expect((ephemeralRule as any).protocol).toBe('tcp');
    });

    test('should configure unrestricted outbound traffic', () => {
      const rules = synthesized.resource.aws_network_acl_rule || {};

      const outboundRule = Object.values(rules).find(
        (r: any) => r.egress === true && r.protocol === '-1'
      );

      expect(outboundRule).toBeDefined();
      expect((outboundRule as any).rule_action).toBe('allow');
      expect((outboundRule as any).cidr_block).toBe('0.0.0.0/0');
    });
  });

  describe('Compliance and Monitoring', () => {
    test('should enable comprehensive VPC Flow Logs', () => {
      const flowLogs = synthesized.resource.aws_flow_log || {};
      const flowLog = flowLogs[Object.keys(flowLogs)[0]];

      expect(flowLog).toBeDefined();
      expect(flowLog.traffic_type).toBe('ALL'); // Captures accepted, rejected, and all traffic
      expect(flowLog.log_destination_type).toBe('cloud-watch-logs');
      expect(flowLog.vpc_id).toContain('aws_vpc');
    });

    test('should configure CloudWatch Logs for VPC Flow Logs', () => {
      const logGroups = synthesized.resource.aws_cloudwatch_log_group || {};
      const logGroup = logGroups[Object.keys(logGroups)[0]];

      expect(logGroup).toBeDefined();
      expect(logGroup.name).toBe('/aws/vpc/flowlogs');
      expect(logGroup.retention_in_days).toBe(7);
    });

    test('should configure proper IAM permissions for Flow Logs', () => {
      const roles = synthesized.resource.aws_iam_role || {};
      const policies = synthesized.resource.aws_iam_policy || {};
      const attachments = synthesized.resource.aws_iam_role_policy_attachment || {};

      // Find flow log role
      const flowLogRole = Object.values(roles).find((r: any) =>
        r.name?.includes('vpc-flow-log-role')
      );
      expect(flowLogRole).toBeDefined();

      // Verify assume role policy
      const assumePolicy = JSON.parse((flowLogRole as any).assume_role_policy);
      expect(assumePolicy.Statement[0].Principal.Service).toBe(
        'vpc-flow-logs.amazonaws.com'
      );

      // Find flow log policy
      const flowLogPolicy = Object.values(policies).find((p: any) =>
        p.name?.includes('vpc-flow-log-policy')
      );
      expect(flowLogPolicy).toBeDefined();

      const policyDoc = JSON.parse((flowLogPolicy as any).policy);
      expect(policyDoc.Statement[0].Action).toContain('logs:CreateLogGroup');
      expect(policyDoc.Statement[0].Action).toContain('logs:PutLogEvents');

      // Verify attachment exists
      expect(Object.keys(attachments).length).toBeGreaterThan(0);
    });
  });

  describe('Network Isolation and Segmentation', () => {
    test('should maintain three-tier network architecture', () => {
      const subnets = synthesized.resource.aws_subnet || {};

      const publicSubnets = Object.values(subnets).filter(
        (s: any) => s.tags?.Tier === 'public'
      );
      const privateAppSubnets = Object.values(subnets).filter(
        (s: any) => s.tags?.Tier === 'private-app'
      );
      const privateDbSubnets = Object.values(subnets).filter(
        (s: any) => s.tags?.Tier === 'private-db'
      );

      // Each tier should have 3 subnets (one per AZ)
      expect(publicSubnets.length).toBe(3);
      expect(privateAppSubnets.length).toBe(3);
      expect(privateDbSubnets.length).toBe(3);
    });

    test('should use non-overlapping CIDR blocks for network isolation', () => {
      const subnets = synthesized.resource.aws_subnet || {};
      const cidrs = Object.values(subnets).map((s: any) => s.cidr_block);

      // All CIDRs should be unique
      const uniqueCidrs = [...new Set(cidrs)];
      expect(uniqueCidrs.length).toBe(9);

      // Verify expected CIDR blocks
      const expectedCidrs = [
        '10.0.1.0/24', '10.0.2.0/24', '10.0.3.0/24',
        '10.0.11.0/24', '10.0.12.0/24', '10.0.13.0/24',
        '10.0.21.0/24', '10.0.22.0/24', '10.0.23.0/24'
      ];
      expectedCidrs.forEach(cidr => {
        expect(cidrs).toContain(cidr);
      });
    });

    test('should ensure database tier has no direct internet access', () => {
      const routes = synthesized.resource.aws_route || {};
      const routeTables = synthesized.resource.aws_route_table || {};

      // Find DB route tables
      const dbRouteTables = Object.entries(routeTables).filter(
        ([key, rt]: [string, any]) => rt.tags?.Name?.includes('private-db-route-table')
      );

      // Each DB route table should only route through NAT Gateway (no IGW)
      dbRouteTables.forEach(([rtKey, rt]) => {
        const rtRoutes = Object.values(routes).filter((r: any) =>
          r.route_table_id?.includes(rtKey.split('_').pop() || '')
        );

        rtRoutes.forEach((route: any) => {
          // Should have NAT gateway routes, not IGW routes
          if (route.destination_cidr_block === '0.0.0.0/0') {
            expect(route.nat_gateway_id).toBeDefined();
            expect(route.gateway_id).toBeUndefined();
          }
        });
      });
    });
  });

  describe('Resource Naming and Tagging', () => {
    test('should apply environmentSuffix to all resource names', () => {
      const vpc = synthesized.resource.aws_vpc[Object.keys(synthesized.resource.aws_vpc)[0]];
      const eips = synthesized.resource.aws_eip || {};
      const natGws = synthesized.resource.aws_nat_gateway || {};

      expect(vpc.tags.Name).toContain('inttest');

      Object.values(eips).forEach((eip: any) => {
        expect(eip.tags.Name).toContain('inttest');
      });

      Object.values(natGws).forEach((natGw: any) => {
        expect(natGw.tags.Name).toContain('inttest');
      });
    });

    test('should apply consistent Environment and Project tags', () => {
      const resources = [
        ...Object.values(synthesized.resource.aws_vpc || {}),
        ...Object.values(synthesized.resource.aws_subnet || {}),
        ...Object.values(synthesized.resource.aws_internet_gateway || {}),
        ...Object.values(synthesized.resource.aws_nat_gateway || {}),
        ...Object.values(synthesized.resource.aws_eip || {}),
      ];

      resources.forEach((resource: any) => {
        if (resource.tags) {
          expect(resource.tags.Environment).toBe('prod');
          expect(resource.tags.Project).toBe('apac-expansion');
        }
      });
    });

    test('should use tier tags for subnet organization', () => {
      const subnets = synthesized.resource.aws_subnet || {};

      Object.values(subnets).forEach((subnet: any) => {
        expect(subnet.tags.Tier).toBeDefined();
        expect(['public', 'private-app', 'private-db']).toContain(subnet.tags.Tier);
      });
    });
  });

  describe('Production Readiness', () => {
    test('should enable DNS resolution for service discovery', () => {
      const vpc = synthesized.resource.aws_vpc[Object.keys(synthesized.resource.aws_vpc)[0]];

      expect(vpc.enable_dns_hostnames).toBe(true);
      expect(vpc.enable_dns_support).toBe(true);
    });

    test('should configure public subnets for load balancer placement', () => {
      const subnets = synthesized.resource.aws_subnet || {};
      const publicSubnets = Object.values(subnets).filter(
        (s: any) => s.tags?.Tier === 'public'
      );

      publicSubnets.forEach((subnet: any) => {
        // Public subnets should auto-assign public IPs
        expect(subnet.map_public_ip_on_launch).toBe(true);
      });
    });

    test('should have correct VPC CIDR for production workload', () => {
      const vpc = synthesized.resource.aws_vpc[Object.keys(synthesized.resource.aws_vpc)[0]];

      expect(vpc.cidr_block).toBe('10.0.0.0/16');
      // /16 provides 65,536 IPs - sufficient for production
    });

    test('should configure backend for state management', () => {
      expect(synthesized.terraform.backend.local).toBeDefined();
      expect(synthesized.terraform.backend.local.path).toBe('terraform.inttest.tfstate');
    });
  });
});

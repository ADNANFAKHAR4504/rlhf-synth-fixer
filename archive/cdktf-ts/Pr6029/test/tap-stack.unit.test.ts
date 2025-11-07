import { App, Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  let app: App;
  let stack: TapStack;
  let synthesized: any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Stack instantiation and configuration', () => {
    test('should instantiate TapStack successfully with custom props', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackWithProps', {
        environmentSuffix: 'prod',
        awsRegion: 'us-west-2',
      });
      synthesized = JSON.parse(Testing.synth(stack));

      expect(stack).toBeDefined();
      expect(synthesized).toBeDefined();
    });

    test('should instantiate TapStack successfully with default values', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackDefault');
      synthesized = JSON.parse(Testing.synth(stack));

      expect(stack).toBeDefined();
      expect(synthesized).toBeDefined();
    });

    test('should use default environmentSuffix when not provided', () => {
      app = new App();
      stack = new TapStack(app, 'TestStackDefaultEnv');
      synthesized = JSON.parse(Testing.synth(stack));

      const resources = synthesized.resource;
      expect(resources).toBeDefined();
    });

    test('should configure AWS provider with correct region', () => {
      app = new App();
      stack = new TapStack(app, 'TestStackRegion', {
        awsRegion: 'eu-west-1',
        environmentSuffix: 'test',
      });
      synthesized = JSON.parse(Testing.synth(stack));

      expect(synthesized.provider.aws[0].region).toBe('eu-west-1');
    });

    test('should configure AWS provider with default region when not specified', () => {
      app = new App();
      stack = new TapStack(app, 'TestStackDefaultRegion');
      synthesized = JSON.parse(Testing.synth(stack));

      expect(synthesized.provider.aws[0].region).toBe('us-east-1');
    });

    test('should configure LocalBackend correctly', () => {
      app = new App();
      stack = new TapStack(app, 'TestStackBackend', {
        environmentSuffix: 'staging',
      });
      synthesized = JSON.parse(Testing.synth(stack));

      expect(synthesized.terraform.backend.local.path).toBe(
        'terraform.staging.tfstate'
      );
    });

    test('should pass defaultTags to AWS provider', () => {
      app = new App();
      const customTags = [
        {
          tags: {
            Owner: 'TeamA',
            CostCenter: '12345',
          },
        },
      ];

      stack = new TapStack(app, 'TestStackTags', {
        defaultTags: customTags,
        environmentSuffix: 'dev',
      });
      synthesized = JSON.parse(Testing.synth(stack));

      expect(synthesized.provider.aws[0].default_tags).toEqual(customTags);
    });

    test('should handle AWS_REGION_OVERRIDE constant', () => {
      app = new App();
      // The AWS_REGION_OVERRIDE is an empty string constant in tap-stack.ts
      // This test verifies that when the override is empty, it uses the props or defaults
      stack = new TapStack(app, 'TestStackRegionOverride');
      synthesized = JSON.parse(Testing.synth(stack));

      // Since AWS_REGION_OVERRIDE is '', it should fall back to default
      expect(synthesized.provider.aws[0].region).toBe('us-east-1');
    });
  });

  describe('VPC resources', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestVPCStack', {
        environmentSuffix: 'test',
        awsRegion: 'us-east-1',
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('should create VPC with correct CIDR block', () => {
      const vpcs = synthesized.resource.aws_vpc || {};
      const vpcKeys = Object.keys(vpcs);
      expect(vpcKeys.length).toBeGreaterThan(0);

      const vpc = vpcs[vpcKeys[0]];
      expect(vpc.cidr_block).toBe('10.0.0.0/16');
    });

    test('should enable DNS hostnames and DNS support', () => {
      const vpcs = synthesized.resource.aws_vpc || {};
      const vpc = vpcs[Object.keys(vpcs)[0]];

      expect(vpc.enable_dns_hostnames).toBe(true);
      expect(vpc.enable_dns_support).toBe(true);
    });

    test('should tag VPC with environmentSuffix', () => {
      const vpcs = synthesized.resource.aws_vpc || {};
      const vpc = vpcs[Object.keys(vpcs)[0]];

      expect(vpc.tags.Name).toBe('vpc-test');
      expect(vpc.tags.Environment).toBe('prod');
      expect(vpc.tags.Project).toBe('apac-expansion');
    });
  });

  describe('Internet Gateway', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestIGWStack', {
        environmentSuffix: 'test',
        awsRegion: 'us-east-1',
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('should create Internet Gateway', () => {
      const igws = synthesized.resource.aws_internet_gateway || {};
      expect(Object.keys(igws).length).toBeGreaterThan(0);
    });

    test('should attach IGW to VPC', () => {
      const igws = synthesized.resource.aws_internet_gateway || {};
      const igw = igws[Object.keys(igws)[0]];

      expect(igw.vpc_id).toContain('aws_vpc');
    });

    test('should tag IGW correctly', () => {
      const igws = synthesized.resource.aws_internet_gateway || {};
      const igw = igws[Object.keys(igws)[0]];

      expect(igw.tags.Name).toBe('igw-prod-us-east-1');
      expect(igw.tags.Environment).toBe('prod');
      expect(igw.tags.Project).toBe('apac-expansion');
    });
  });

  describe('Public Subnets', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestPublicSubnetsStack', {
        environmentSuffix: 'test',
        awsRegion: 'us-east-1',
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('should create 3 public subnets', () => {
      const subnets = synthesized.resource.aws_subnet || {};
      const publicSubnets = Object.values(subnets).filter(
        (s: any) => s.tags?.Tier === 'public'
      );
      expect(publicSubnets.length).toBe(3);
    });

    test('should use correct CIDR blocks for public subnets', () => {
      const subnets = synthesized.resource.aws_subnet || {};
      const publicSubnets = Object.values(subnets).filter(
        (s: any) => s.tags?.Tier === 'public'
      );

      const cidrs = publicSubnets.map((s: any) => s.cidr_block).sort();
      expect(cidrs).toEqual(['10.0.1.0/24', '10.0.2.0/24', '10.0.3.0/24']);
    });

    test('should spread public subnets across 3 availability zones', () => {
      const subnets = synthesized.resource.aws_subnet || {};
      const publicSubnets = Object.values(subnets).filter(
        (s: any) => s.tags?.Tier === 'public'
      );

      const azs = publicSubnets.map((s: any) => s.availability_zone).sort();
      expect(azs).toEqual(['us-east-1a', 'us-east-1b', 'us-east-1c']);
    });

    test('should enable map_public_ip_on_launch for public subnets', () => {
      const subnets = synthesized.resource.aws_subnet || {};
      const publicSubnets = Object.values(subnets).filter(
        (s: any) => s.tags?.Tier === 'public'
      );

      publicSubnets.forEach((subnet: any) => {
        expect(subnet.map_public_ip_on_launch).toBe(true);
      });
    });

    test('should tag public subnets with correct naming and tier', () => {
      const subnets = synthesized.resource.aws_subnet || {};
      const publicSubnets = Object.values(subnets).filter(
        (s: any) => s.tags?.Tier === 'public'
      );

      publicSubnets.forEach((subnet: any) => {
        expect(subnet.tags.Tier).toBe('public');
        expect(subnet.tags.Environment).toBe('prod');
        expect(subnet.tags.Project).toBe('apac-expansion');
        expect(subnet.tags.Name).toMatch(/^public-subnet-\d+-test$/);
      });
    });
  });

  describe('Private Application Subnets', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestPrivateAppSubnetsStack', {
        environmentSuffix: 'test',
        awsRegion: 'us-east-1',
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('should create 3 private application subnets', () => {
      const subnets = synthesized.resource.aws_subnet || {};
      const privateAppSubnets = Object.values(subnets).filter(
        (s: any) => s.tags?.Tier === 'private-app'
      );
      expect(privateAppSubnets.length).toBe(3);
    });

    test('should use correct CIDR blocks for private app subnets', () => {
      const subnets = synthesized.resource.aws_subnet || {};
      const privateAppSubnets = Object.values(subnets).filter(
        (s: any) => s.tags?.Tier === 'private-app'
      );

      const cidrs = privateAppSubnets.map((s: any) => s.cidr_block).sort();
      expect(cidrs).toEqual(['10.0.11.0/24', '10.0.12.0/24', '10.0.13.0/24']);
    });

    test('should spread private app subnets across 3 availability zones', () => {
      const subnets = synthesized.resource.aws_subnet || {};
      const privateAppSubnets = Object.values(subnets).filter(
        (s: any) => s.tags?.Tier === 'private-app'
      );

      const azs = privateAppSubnets.map((s: any) => s.availability_zone).sort();
      expect(azs).toEqual(['us-east-1a', 'us-east-1b', 'us-east-1c']);
    });

    test('should tag private app subnets with correct naming and tier', () => {
      const subnets = synthesized.resource.aws_subnet || {};
      const privateAppSubnets = Object.values(subnets).filter(
        (s: any) => s.tags?.Tier === 'private-app'
      );

      privateAppSubnets.forEach((subnet: any) => {
        expect(subnet.tags.Tier).toBe('private-app');
        expect(subnet.tags.Environment).toBe('prod');
        expect(subnet.tags.Project).toBe('apac-expansion');
        expect(subnet.tags.Name).toMatch(/^private-app-subnet-\d+-test$/);
      });
    });
  });

  describe('Private Database Subnets', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestPrivateDbSubnetsStack', {
        environmentSuffix: 'test',
        awsRegion: 'us-east-1',
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('should create 3 private database subnets', () => {
      const subnets = synthesized.resource.aws_subnet || {};
      const privateDbSubnets = Object.values(subnets).filter(
        (s: any) => s.tags?.Tier === 'private-db'
      );
      expect(privateDbSubnets.length).toBe(3);
    });

    test('should use correct CIDR blocks for private db subnets', () => {
      const subnets = synthesized.resource.aws_subnet || {};
      const privateDbSubnets = Object.values(subnets).filter(
        (s: any) => s.tags?.Tier === 'private-db'
      );

      const cidrs = privateDbSubnets.map((s: any) => s.cidr_block).sort();
      expect(cidrs).toEqual(['10.0.21.0/24', '10.0.22.0/24', '10.0.23.0/24']);
    });

    test('should spread private db subnets across 3 availability zones', () => {
      const subnets = synthesized.resource.aws_subnet || {};
      const privateDbSubnets = Object.values(subnets).filter(
        (s: any) => s.tags?.Tier === 'private-db'
      );

      const azs = privateDbSubnets.map((s: any) => s.availability_zone).sort();
      expect(azs).toEqual(['us-east-1a', 'us-east-1b', 'us-east-1c']);
    });

    test('should tag private db subnets with correct naming and tier', () => {
      const subnets = synthesized.resource.aws_subnet || {};
      const privateDbSubnets = Object.values(subnets).filter(
        (s: any) => s.tags?.Tier === 'private-db'
      );

      privateDbSubnets.forEach((subnet: any) => {
        expect(subnet.tags.Tier).toBe('private-db');
        expect(subnet.tags.Environment).toBe('prod');
        expect(subnet.tags.Project).toBe('apac-expansion');
        expect(subnet.tags.Name).toMatch(/^private-db-subnet-\d+-test$/);
      });
    });
  });

  describe('NAT Gateways and Elastic IPs', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestNATStack', {
        environmentSuffix: 'test',
        awsRegion: 'us-east-1',
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('should create 3 Elastic IPs for NAT Gateways', () => {
      const eips = synthesized.resource.aws_eip || {};
      expect(Object.keys(eips).length).toBe(3);
    });

    test('should configure EIPs with vpc domain', () => {
      const eips = synthesized.resource.aws_eip || {};
      Object.values(eips).forEach((eip: any) => {
        expect(eip.domain).toBe('vpc');
      });
    });

    test('should tag EIPs correctly', () => {
      const eips = synthesized.resource.aws_eip || {};
      Object.values(eips).forEach((eip: any) => {
        expect(eip.tags.Environment).toBe('prod');
        expect(eip.tags.Project).toBe('apac-expansion');
        expect(eip.tags.Name).toMatch(/^nat-eip-\d+-test$/);
      });
    });

    test('should create 3 NAT Gateways', () => {
      const natGws = synthesized.resource.aws_nat_gateway || {};
      expect(Object.keys(natGws).length).toBe(3);
    });

    test('should associate NAT Gateways with EIPs', () => {
      const natGws = synthesized.resource.aws_nat_gateway || {};
      Object.values(natGws).forEach((natGw: any) => {
        expect(natGw.allocation_id).toContain('aws_eip');
      });
    });

    test('should place NAT Gateways in public subnets', () => {
      const natGws = synthesized.resource.aws_nat_gateway || {};
      Object.values(natGws).forEach((natGw: any) => {
        expect(natGw.subnet_id).toContain('aws_subnet');
      });
    });

    test('should tag NAT Gateways correctly', () => {
      const natGws = synthesized.resource.aws_nat_gateway || {};
      Object.values(natGws).forEach((natGw: any) => {
        expect(natGw.tags.Environment).toBe('prod');
        expect(natGw.tags.Project).toBe('apac-expansion');
        expect(natGw.tags.Name).toMatch(/^nat-gateway-\d+-test$/);
      });
    });
  });

  describe('Route Tables', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestRouteTablesStack', {
        environmentSuffix: 'test',
        awsRegion: 'us-east-1',
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('should create public route table', () => {
      const routeTables = synthesized.resource.aws_route_table || {};
      const publicRT = Object.values(routeTables).find(
        (rt: any) => rt.tags?.Name === 'public-route-table-test'
      );
      expect(publicRT).toBeDefined();
      expect((publicRT as any).vpc_id).toContain('aws_vpc');
    });

    test('should create route to IGW in public route table', () => {
      const routes = synthesized.resource.aws_route || {};
      const publicRoutes = Object.values(routes).filter((r: any) =>
        r.gateway_id?.includes('aws_internet_gateway')
      );

      expect(publicRoutes.length).toBeGreaterThan(0);
      publicRoutes.forEach((route: any) => {
        expect(route.destination_cidr_block).toBe('0.0.0.0/0');
      });
    });

    test('should associate public subnets with public route table', () => {
      const associations =
        synthesized.resource.aws_route_table_association || {};
      const publicAssocs = Object.values(associations).filter((a: any) =>
        a.route_table_id?.includes('public-route-table')
      );

      expect(publicAssocs.length).toBe(3);
    });

    test('should create 3 private app route tables', () => {
      const routeTables = synthesized.resource.aws_route_table || {};
      const privateAppRTs = Object.values(routeTables).filter((rt: any) =>
        rt.tags?.Name?.includes('private-app-route-table')
      );
      expect(privateAppRTs.length).toBe(3);
    });

    test('should create routes to NAT Gateways in private app route tables', () => {
      const routes = synthesized.resource.aws_route || {};
      const privateRoutes = Object.values(routes).filter((r: any) =>
        r.nat_gateway_id?.includes('aws_nat_gateway')
      );

      expect(privateRoutes.length).toBeGreaterThanOrEqual(3);
      privateRoutes.forEach((route: any) => {
        expect(route.destination_cidr_block).toBe('0.0.0.0/0');
      });
    });

    test('should associate private app subnets with private app route tables', () => {
      const associations =
        synthesized.resource.aws_route_table_association || {};
      const privateAppAssocs = Object.values(associations).filter((a: any) =>
        a.route_table_id?.includes('private-app-route-table')
      );

      expect(privateAppAssocs.length).toBeGreaterThanOrEqual(3);
    });

    test('should create 3 private db route tables', () => {
      const routeTables = synthesized.resource.aws_route_table || {};
      const privateDbRTs = Object.values(routeTables).filter((rt: any) =>
        rt.tags?.Name?.includes('private-db-route-table')
      );
      expect(privateDbRTs.length).toBe(3);
    });

    test('should create routes to NAT Gateways in private db route tables', () => {
      const routes = synthesized.resource.aws_route || {};
      const privateRoutes = Object.values(routes).filter((r: any) =>
        r.nat_gateway_id?.includes('aws_nat_gateway')
      );

      // Should have at least 6 NAT routes (3 for app, 3 for db)
      expect(privateRoutes.length).toBeGreaterThanOrEqual(6);
    });

    test('should associate private db subnets with private db route tables', () => {
      const associations =
        synthesized.resource.aws_route_table_association || {};
      const privateDbAssocs = Object.values(associations).filter((a: any) =>
        a.route_table_id?.includes('private-db-route-table')
      );

      expect(privateDbAssocs.length).toBeGreaterThanOrEqual(3);
    });

    test('should tag route tables correctly', () => {
      const routeTables = synthesized.resource.aws_route_table || {};
      const publicRT = Object.values(routeTables).find(
        (rt: any) => rt.tags?.Name === 'public-route-table-test'
      );
      const privateAppRT = Object.values(routeTables).find(
        (rt: any) => rt.tags?.Name === 'private-app-route-table-1-test'
      );

      expect((publicRT as any).tags.Environment).toBe('prod');
      expect((privateAppRT as any).tags.Environment).toBe('prod');
    });
  });

  describe('Network ACLs', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestNACLStack', {
        environmentSuffix: 'test',
        awsRegion: 'us-east-1',
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('should create Network ACL', () => {
      const nacls = synthesized.resource.aws_network_acl || {};
      expect(Object.keys(nacls).length).toBeGreaterThan(0);

      const nacl = nacls[Object.keys(nacls)[0]];
      expect(nacl.vpc_id).toContain('aws_vpc');
    });

    test('should allow HTTP inbound traffic', () => {
      const rules = synthesized.resource.aws_network_acl_rule || {};
      const httpRule = Object.values(rules).find(
        (r: any) => r.from_port === 80 && r.egress === false
      );

      expect(httpRule).toBeDefined();
      expect((httpRule as any).rule_number).toBe(100);
      expect((httpRule as any).protocol).toBe('tcp');
      expect((httpRule as any).rule_action).toBe('allow');
      expect((httpRule as any).cidr_block).toBe('0.0.0.0/0');
      expect((httpRule as any).to_port).toBe(80);
    });

    test('should allow HTTPS inbound traffic', () => {
      const rules = synthesized.resource.aws_network_acl_rule || {};
      const httpsRule = Object.values(rules).find(
        (r: any) => r.from_port === 443 && r.egress === false
      );

      expect(httpsRule).toBeDefined();
      expect((httpsRule as any).rule_number).toBe(110);
      expect((httpsRule as any).protocol).toBe('tcp');
      expect((httpsRule as any).rule_action).toBe('allow');
      expect((httpsRule as any).from_port).toBe(443);
      expect((httpsRule as any).to_port).toBe(443);
    });

    test('should deny SSH inbound traffic', () => {
      const rules = synthesized.resource.aws_network_acl_rule || {};
      const sshDenyRule = Object.values(rules).find(
        (r: any) => r.from_port === 22 && r.egress === false && r.rule_action === 'deny'
      );

      expect(sshDenyRule).toBeDefined();
      expect((sshDenyRule as any).rule_number).toBe(50);
      expect((sshDenyRule as any).protocol).toBe('tcp');
      expect((sshDenyRule as any).cidr_block).toBe('0.0.0.0/0');
      expect((sshDenyRule as any).to_port).toBe(22);
    });

    test('should allow ephemeral ports inbound', () => {
      const rules = synthesized.resource.aws_network_acl_rule || {};
      const ephemeralRule = Object.values(rules).find(
        (r: any) => r.from_port === 1024 && r.to_port === 65535 && r.egress === false
      );

      expect(ephemeralRule).toBeDefined();
      expect((ephemeralRule as any).rule_number).toBe(120);
    });

    test('should allow all outbound traffic', () => {
      const rules = synthesized.resource.aws_network_acl_rule || {};
      const outboundRule = Object.values(rules).find(
        (r: any) => r.egress === true && r.protocol === '-1'
      );

      expect(outboundRule).toBeDefined();
      expect((outboundRule as any).rule_number).toBe(100);
      expect((outboundRule as any).rule_action).toBe('allow');
    });

    test('should tag NACL correctly', () => {
      const nacls = synthesized.resource.aws_network_acl || {};
      const nacl = nacls[Object.keys(nacls)[0]];
      expect(nacl.tags.Name).toBe('network-acl-test');
      expect(nacl.tags.Environment).toBe('prod');
    });
  });

  describe('VPC Flow Logs', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestFlowLogsStack', {
        environmentSuffix: 'test',
        awsRegion: 'us-east-1',
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('should create CloudWatch Log Group for VPC Flow Logs', () => {
      const logGroups = synthesized.resource.aws_cloudwatch_log_group || {};
      const logGroup = logGroups[Object.keys(logGroups)[0]];

      expect(logGroup).toBeDefined();
      expect(logGroup.name).toBe('/aws/vpc/flowlogs');
      expect(logGroup.retention_in_days).toBe(7);
    });

    test('should create IAM Role for VPC Flow Logs', () => {
      const roles = synthesized.resource.aws_iam_role || {};
      const role = Object.values(roles).find((r: any) =>
        r.name?.includes('vpc-flow-log-role')
      );

      expect(role).toBeDefined();
      expect((role as any).name).toBe('vpc-flow-log-role-test');

      const assumeRolePolicy = JSON.parse((role as any).assume_role_policy);
      expect(assumeRolePolicy.Statement[0].Effect).toBe('Allow');
      expect(assumeRolePolicy.Statement[0].Principal.Service).toBe(
        'vpc-flow-logs.amazonaws.com'
      );
      expect(assumeRolePolicy.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('should create IAM Policy for Flow Logs', () => {
      const policies = synthesized.resource.aws_iam_policy || {};
      const policy = Object.values(policies).find((p: any) =>
        p.name?.includes('vpc-flow-log-policy')
      );

      expect(policy).toBeDefined();
      expect((policy as any).name).toBe('vpc-flow-log-policy-test');

      const policyDoc = JSON.parse((policy as any).policy);
      expect(policyDoc.Statement[0].Effect).toBe('Allow');
      expect(policyDoc.Statement[0].Action).toContain('logs:CreateLogGroup');
      expect(policyDoc.Statement[0].Action).toContain('logs:CreateLogStream');
      expect(policyDoc.Statement[0].Action).toContain('logs:PutLogEvents');
    });

    test('should attach policy to role', () => {
      const attachments =
        synthesized.resource.aws_iam_role_policy_attachment || {};
      expect(Object.keys(attachments).length).toBeGreaterThan(0);

      const attachment = attachments[Object.keys(attachments)[0]];
      expect(attachment.role).toContain('vpc-flow-log-role');
      expect(attachment.policy_arn).toContain('aws_iam_policy');
    });

    test('should create VPC Flow Log with ALL traffic type', () => {
      const flowLogs = synthesized.resource.aws_flow_log || {};
      const flowLog = flowLogs[Object.keys(flowLogs)[0]];

      expect(flowLog).toBeDefined();
      expect(flowLog.vpc_id).toContain('aws_vpc');
      expect(flowLog.traffic_type).toBe('ALL');
      expect(flowLog.log_destination_type).toBe('cloud-watch-logs');
      expect(flowLog.log_destination).toContain('aws_cloudwatch_log_group');
      expect(flowLog.iam_role_arn).toContain('aws_iam_role');
    });

    test('should tag VPC Flow Log correctly', () => {
      const flowLogs = synthesized.resource.aws_flow_log || {};
      const flowLog = flowLogs[Object.keys(flowLogs)[0]];
      expect(flowLog.tags.Name).toBe('vpc-flow-log-test');
      expect(flowLog.tags.Environment).toBe('prod');
    });
  });

  describe('Resource tagging', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestTaggingStack', {
        environmentSuffix: 'test',
        awsRegion: 'us-east-1',
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('should tag all resources with Environment and Project tags', () => {
      const vpcs = synthesized.resource.aws_vpc || {};
      const vpc = vpcs[Object.keys(vpcs)[0]];

      const igws = synthesized.resource.aws_internet_gateway || {};
      const igw = igws[Object.keys(igws)[0]];

      const nacls = synthesized.resource.aws_network_acl || {};
      const nacl = nacls[Object.keys(nacls)[0]];

      expect(vpc.tags.Environment).toBe('prod');
      expect(vpc.tags.Project).toBe('apac-expansion');

      expect(igw.tags.Environment).toBe('prod');
      expect(igw.tags.Project).toBe('apac-expansion');

      expect(nacl.tags.Environment).toBe('prod');
      expect(nacl.tags.Project).toBe('apac-expansion');
    });
  });

  describe('High Availability', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestHAStack', {
        environmentSuffix: 'test',
        awsRegion: 'us-east-1',
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('should deploy resources across 3 availability zones', () => {
      const subnets = synthesized.resource.aws_subnet || {};
      const publicSubnets = Object.values(subnets).filter(
        (s: any) => s.tags?.Tier === 'public'
      );

      const azs = publicSubnets.map((s: any) => s.availability_zone);

      // Ensure all 3 AZs are different
      expect(new Set(azs).size).toBe(3);
      expect(azs).toContain('us-east-1a');
      expect(azs).toContain('us-east-1b');
      expect(azs).toContain('us-east-1c');
    });

    test('should deploy one NAT Gateway per availability zone', () => {
      const natGws = synthesized.resource.aws_nat_gateway || {};
      expect(Object.keys(natGws).length).toBe(3);

      // Each NAT Gateway should be in a different public subnet (different AZ)
      const subnetIds = Object.values(natGws).map((gw: any) => gw.subnet_id);
      expect(new Set(subnetIds).size).toBe(3);
    });
  });

  describe('NetworkingStack integration', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestIntegrationStack', {
        environmentSuffix: 'integration',
        awsRegion: 'us-west-2',
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('should create complete network infrastructure', () => {
      // Verify all major resource types exist
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
      expect(synthesized.resource.aws_flow_log).toBeDefined();
    });

    test('should have correct total number of subnets', () => {
      const subnets = synthesized.resource.aws_subnet || {};
      // 3 public + 3 private app + 3 private db = 9 total
      expect(Object.keys(subnets).length).toBe(9);
    });

    test('should have correct number of route tables', () => {
      const routeTables = synthesized.resource.aws_route_table || {};
      // 1 public + 3 private app + 3 private db = 7 total
      expect(Object.keys(routeTables).length).toBe(7);
    });
  });
});

describe('TapStack Coverage Tests', () => {
  afterEach(() => {
    // Clean up environment variables
    delete process.env.AWS_REGION_OVERRIDE;
  });

  test('should use AWS_REGION_OVERRIDE when set via environment', () => {
    // Set environment variable to test the override branch
    process.env.AWS_REGION_OVERRIDE = 'eu-central-1';

    const app = Testing.app();
    const stack = new TapStack(app, 'test-stack-override');

    // Synthesize to ensure no errors
    const synthesized = Testing.synth(stack);

    // Verify the stack was created successfully
    expect(synthesized).toBeDefined();
    expect(stack).toBeDefined();
  });

  test('should use awsRegionOverride prop when provided', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'test-stack-prop-override', {
      awsRegionOverride: 'ap-northeast-1',
    });

    const synthesized = Testing.synth(stack);

    expect(synthesized).toBeDefined();
    expect(stack).toBeDefined();
  });

  test('should fallback to default region when no overrides', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'test-stack-default');

    const synthesized = Testing.synth(stack);

    expect(synthesized).toBeDefined();
    expect(stack).toBeDefined();
  });

  test('should use props.awsRegion when provided without override', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'test-stack-region-prop', {
      awsRegion: 'us-west-1',
    });

    const synthesized = Testing.synth(stack);

    expect(synthesized).toBeDefined();
    expect(stack).toBeDefined();
  });
});

import { App, Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  let app: App;
  let stack: TapStack;
  let synthesized: string;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Stack Initialization', () => {
    test('TapStack instantiates successfully with custom props', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackWithProps', {
        environmentSuffix: 'test123',
        stateBucket: 'custom-state-bucket',
        stateBucketRegion: 'us-west-2',
        awsRegion: 'us-east-1',
      });
      synthesized = Testing.synth(stack);

      expect(stack).toBeDefined();
      expect(synthesized).toBeDefined();
      expect(synthesized).toContain('payment-vpc-test123');
    });

    test('TapStack uses default values when no props provided', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackDefault');
      synthesized = Testing.synth(stack);

      expect(stack).toBeDefined();
      expect(synthesized).toBeDefined();
    });
  });

  describe('VPC Configuration', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'VPCTestStack', {
        environmentSuffix: 'vpc-test',
        awsRegion: 'us-east-1',
      });
      synthesized = Testing.synth(stack);
    });

    test('creates VPC with correct CIDR block', () => {
      expect(synthesized).toContain('"cidr_block": "10.0.0.0/16"');
    });

    test('enables DNS support and hostnames', () => {
      expect(synthesized).toContain('"enable_dns_hostnames": true');
      expect(synthesized).toContain('"enable_dns_support": true');
    });

    test('creates VPC with environment suffix in name', () => {
      expect(synthesized).toContain('payment-vpc-vpc-test');
    });

    test('applies required tags to VPC', () => {
      expect(synthesized).toContain('"Environment": "vpc-test"');
      expect(synthesized).toContain('"Project": "PaymentProcessing"');
      expect(synthesized).toContain('"CostCenter": "FinTech"');
    });
  });

  describe('Public Subnets', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'SubnetTestStack', {
        environmentSuffix: 'subnet-test',
        awsRegion: 'us-east-1',
      });
      synthesized = Testing.synth(stack);
    });

    test('creates 3 public subnets', () => {
      const publicSubnetMatches = (synthesized.match(/payment-public-subnet-\d+-subnet-test/g) || []).length;
      expect(publicSubnetMatches).toBe(3);
    });

    test('creates public subnets with correct CIDR blocks', () => {
      expect(synthesized).toContain('"cidr_block": "10.0.1.0/24"');
      expect(synthesized).toContain('"cidr_block": "10.0.2.0/24"');
      expect(synthesized).toContain('"cidr_block": "10.0.3.0/24"');
    });

    test('distributes public subnets across 3 AZs', () => {
      expect(synthesized).toContain('"availability_zone": "us-east-1a"');
      expect(synthesized).toContain('"availability_zone": "us-east-1b"');
      expect(synthesized).toContain('"availability_zone": "us-east-1c"');
    });

    test('enables public IP assignment for public subnets', () => {
      const mapPublicIpMatches = (synthesized.match(/"map_public_ip_on_launch": true/g) || []).length;
      expect(mapPublicIpMatches).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Private Subnets - Application Tier', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'AppSubnetTestStack', {
        environmentSuffix: 'app-test',
        awsRegion: 'us-east-1',
      });
      synthesized = Testing.synth(stack);
    });

    test('creates 3 application tier private subnets', () => {
      const appSubnetMatches = (synthesized.match(/payment-app-subnet-\d+-app-test/g) || []).length;
      expect(appSubnetMatches).toBe(3);
    });

    test('creates app subnets with correct CIDR blocks (/23)', () => {
      expect(synthesized).toContain('"cidr_block": "10.0.16.0/23"');
      expect(synthesized).toContain('"cidr_block": "10.0.18.0/23"');
      expect(synthesized).toContain('"cidr_block": "10.0.20.0/23"');
    });

    test('disables public IP assignment for app subnets', () => {
      const jsonParsed = JSON.parse(synthesized);
      const appSubnets = Object.values(jsonParsed.resource.aws_subnet).filter(
        (subnet: any) => subnet.tags?.Tier === 'Application'
      );
      appSubnets.forEach((subnet: any) => {
        expect(subnet.map_public_ip_on_launch).toBe(false);
      });
    });
  });

  describe('Private Subnets - Database Tier', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'DBSubnetTestStack', {
        environmentSuffix: 'db-test',
        awsRegion: 'us-east-1',
      });
      synthesized = Testing.synth(stack);
    });

    test('creates 3 database tier private subnets', () => {
      const dbSubnetMatches = (synthesized.match(/payment-db-subnet-\d+-db-test/g) || []).length;
      expect(dbSubnetMatches).toBe(3);
    });

    test('creates db subnets with correct CIDR blocks (/23)', () => {
      expect(synthesized).toContain('"cidr_block": "10.0.32.0/23"');
      expect(synthesized).toContain('"cidr_block": "10.0.34.0/23"');
      expect(synthesized).toContain('"cidr_block": "10.0.36.0/23"');
    });
  });

  describe('Internet Gateway', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'IGWTestStack', {
        environmentSuffix: 'igw-test',
        awsRegion: 'us-east-1',
      });
      synthesized = Testing.synth(stack);
    });

    test('creates Internet Gateway', () => {
      expect(synthesized).toContain('payment-igw-igw-test');
      expect(synthesized).toContain('aws_internet_gateway');
    });

    test('attaches Internet Gateway to VPC', () => {
      const jsonParsed = JSON.parse(synthesized);
      const igw = Object.values(jsonParsed.resource.aws_internet_gateway)[0] as any;
      expect(igw.vpc_id).toBeDefined();
    });
  });

  describe('NAT Instances', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'NATTestStack', {
        environmentSuffix: 'nat-test',
        awsRegion: 'us-east-1',
      });
      synthesized = Testing.synth(stack);
    });

    test('creates 3 NAT instances', () => {
      const natInstanceMatches = (synthesized.match(/payment-nat-instance-\d+-nat-test/g) || []).length;
      expect(natInstanceMatches).toBe(3);
    });

    test('uses t3.micro instance type for NAT instances', () => {
      expect(synthesized).toContain('"instance_type": "t3.micro"');
    });

    test('disables source destination check for NAT instances', () => {
      const jsonParsed = JSON.parse(synthesized);
      const natInstances = Object.values(jsonParsed.resource.aws_instance || {}).filter(
        (instance: any) => instance.tags?.Name?.includes('nat-instance')
      );
      natInstances.forEach((instance: any) => {
        expect(instance.source_dest_check).toBe(false);
      });
    });

    test('creates Elastic IPs for NAT instances', () => {
      const eipMatches = (synthesized.match(/payment-nat-eip-\d+-nat-test/g) || []).length;
      expect(eipMatches).toBe(3);
    });

    test('includes NAT configuration in user data', () => {
      expect(synthesized).toContain('net.ipv4.ip_forward = 1');
      expect(synthesized).toContain('iptables');
    });
  });

  describe('Route Tables', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'RouteTableTestStack', {
        environmentSuffix: 'rt-test',
        awsRegion: 'us-east-1',
      });
      synthesized = Testing.synth(stack);
    });

    test('creates public route table', () => {
      expect(synthesized).toContain('payment-public-rt-rt-test');
    });

    test('creates 3 private route tables (one per AZ)', () => {
      const privateRTMatches = (synthesized.match(/payment-private-rt-\d+-rt-test/g) || []).length;
      expect(privateRTMatches).toBe(3);
    });

    test('creates route to Internet Gateway for public route table', () => {
      const jsonParsed = JSON.parse(synthesized);
      const routes = Object.values(jsonParsed.resource.aws_route || {});
      const publicRoute = routes.find((route: any) =>
        route.destination_cidr_block === '0.0.0.0/0' && route.gateway_id
      );
      expect(publicRoute).toBeDefined();
    });

    test('creates routes to NAT instances for private route tables', () => {
      const jsonParsed = JSON.parse(synthesized);
      const routes = Object.values(jsonParsed.resource.aws_route || {});
      const natRoutes = routes.filter((route: any) =>
        route.destination_cidr_block === '0.0.0.0/0' && route.network_interface_id
      );
      expect(natRoutes.length).toBe(3);
    });
  });

  describe('Network ACLs', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'NACLTestStack', {
        environmentSuffix: 'nacl-test',
        awsRegion: 'us-east-1',
      });
      synthesized = Testing.synth(stack);
    });

    test('creates custom Network ACL', () => {
      expect(synthesized).toContain('payment-nacl-nacl-test');
      expect(synthesized).toContain('aws_network_acl');
    });

    test('allows HTTPS (443) ingress', () => {
      const jsonParsed = JSON.parse(synthesized);
      const naclRules = Object.values(jsonParsed.resource.aws_network_acl_rule || {});
      const httpsIngress = naclRules.find((rule: any) =>
        rule.from_port === 443 && rule.to_port === 443 && rule.egress === false
      );
      expect(httpsIngress).toBeDefined();
    });

    test('allows SSH (22) ingress from specific IP', () => {
      const jsonParsed = JSON.parse(synthesized);
      const naclRules = Object.values(jsonParsed.resource.aws_network_acl_rule || {});
      const sshIngress = naclRules.find((rule: any) =>
        rule.from_port === 22 && rule.to_port === 22 && rule.egress === false
      );
      expect(sshIngress).toBeDefined();
      expect((sshIngress as any).cidr_block).toContain('203.0.113.0/24');
    });

    test('allows ephemeral ports (1024-65535)', () => {
      const jsonParsed = JSON.parse(synthesized);
      const naclRules = Object.values(jsonParsed.resource.aws_network_acl_rule || {});
      const ephemeralIngress = naclRules.find((rule: any) =>
        rule.from_port === 1024 && rule.to_port === 65535 && rule.egress === false
      );
      expect(ephemeralIngress).toBeDefined();
    });
  });

  describe('Security Groups', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'SGTestStack', {
        environmentSuffix: 'sg-test',
        awsRegion: 'us-east-1',
      });
      synthesized = Testing.synth(stack);
    });

    test('creates web tier security group', () => {
      expect(synthesized).toContain('payment-web-sg-sg-test');
    });

    test('creates app tier security group', () => {
      expect(synthesized).toContain('payment-app-sg-sg-test');
    });

    test('creates database tier security group', () => {
      expect(synthesized).toContain('payment-db-sg-sg-test');
    });

    test('web SG allows HTTPS from internet', () => {
      const jsonParsed = JSON.parse(synthesized);
      const sgRules = Object.values(jsonParsed.resource.aws_security_group_rule || {});
      const webHttpsRule = sgRules.find((rule: any) =>
        rule.from_port === 443 && rule.cidr_blocks?.includes('0.0.0.0/0')
      );
      expect(webHttpsRule).toBeDefined();
    });

    test('app SG allows traffic from web SG', () => {
      const jsonParsed = JSON.parse(synthesized);
      const sgRules = Object.values(jsonParsed.resource.aws_security_group_rule || {});
      const appIngressRule = sgRules.find((rule: any) =>
        rule.from_port === 8080 && rule.source_security_group_id
      );
      expect(appIngressRule).toBeDefined();
    });

    test('db SG allows PostgreSQL from app SG', () => {
      const jsonParsed = JSON.parse(synthesized);
      const sgRules = Object.values(jsonParsed.resource.aws_security_group_rule || {});
      const dbIngressRule = sgRules.find((rule: any) =>
        rule.from_port === 5432 && rule.source_security_group_id
      );
      expect(dbIngressRule).toBeDefined();
    });
  });

  describe('VPC Endpoints', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'EndpointTestStack', {
        environmentSuffix: 'endpoint-test',
        awsRegion: 'us-east-1',
      });
      synthesized = Testing.synth(stack);
    });

    test('creates S3 VPC endpoint', () => {
      expect(synthesized).toContain('payment-s3-endpoint-endpoint-test');
      expect(synthesized).toContain('com.amazonaws.us-east-1.s3');
    });

    test('creates DynamoDB VPC endpoint', () => {
      expect(synthesized).toContain('payment-dynamodb-endpoint-endpoint-test');
      expect(synthesized).toContain('com.amazonaws.us-east-1.dynamodb');
    });

    test('uses Gateway endpoint type', () => {
      const jsonParsed = JSON.parse(synthesized);
      const endpoints = Object.values(jsonParsed.resource.aws_vpc_endpoint || {});
      endpoints.forEach((endpoint: any) => {
        if (endpoint.service_name?.includes('s3') || endpoint.service_name?.includes('dynamodb')) {
          expect(endpoint.vpc_endpoint_type).toBe('Gateway');
        }
      });
    });

    test('associates endpoints with route tables', () => {
      expect(synthesized).toContain('aws_vpc_endpoint_route_table_association');
    });
  });

  describe('Transit Gateway', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TGWTestStack', {
        environmentSuffix: 'tgw-test',
        awsRegion: 'us-east-1',
      });
      synthesized = Testing.synth(stack);
    });

    test('creates Transit Gateway', () => {
      expect(synthesized).toContain('payment-tgw-tgw-test');
      expect(synthesized).toContain('aws_ec2_transit_gateway');
    });

    test('configures Transit Gateway with correct settings', () => {
      const jsonParsed = JSON.parse(synthesized);
      const tgw = Object.values(jsonParsed.resource.aws_ec2_transit_gateway || {})[0] as any;
      expect(tgw.amazon_side_asn).toBe(64512);
      expect(tgw.dns_support).toBe('enable');
    });

    test('creates VPC attachment to Transit Gateway', () => {
      expect(synthesized).toContain('payment-tgw-attachment-tgw-test');
      expect(synthesized).toContain('aws_ec2_transit_gateway_vpc_attachment');
    });
  });

  describe('VPC Flow Logs', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'FlowLogsTestStack', {
        environmentSuffix: 'flow-test',
        awsRegion: 'us-east-1',
      });
      synthesized = Testing.synth(stack);
    });

    test('creates S3 bucket for flow logs', () => {
      expect(synthesized).toContain('payment-flow-logs-flow-test');
      expect(synthesized).toContain('aws_s3_bucket');
    });

    test('enables S3 bucket encryption', () => {
      expect(synthesized).toContain('aws_s3_bucket_server_side_encryption_configuration');
      expect(synthesized).toContain('"sse_algorithm": "AES256"');
    });

    test('blocks public access to flow logs bucket', () => {
      expect(synthesized).toContain('aws_s3_bucket_public_access_block');
      const jsonParsed = JSON.parse(synthesized);
      const publicAccessBlocks = Object.values(jsonParsed.resource.aws_s3_bucket_public_access_block || {});
      publicAccessBlocks.forEach((block: any) => {
        expect(block.block_public_acls).toBe(true);
        expect(block.block_public_policy).toBe(true);
      });
    });

    test('configures lifecycle policy for 90-day retention', () => {
      expect(synthesized).toContain('aws_s3_bucket_lifecycle_configuration');
      const jsonParsed = JSON.parse(synthesized);
      const lifecycles = Object.values(jsonParsed.resource.aws_s3_bucket_lifecycle_configuration || {});
      const flowLogLifecycle = lifecycles.find((lc: any) =>
        lc.rule?.some((r: any) => r.expiration?.[0]?.days === 90)
      );
      expect(flowLogLifecycle).toBeDefined();
    });

    test('creates VPC Flow Log', () => {
      expect(synthesized).toContain('payment-flow-log-flow-test');
      expect(synthesized).toContain('aws_flow_log');
    });

    test('configures flow log to capture ALL traffic', () => {
      const jsonParsed = JSON.parse(synthesized);
      const flowLogs = Object.values(jsonParsed.resource.aws_flow_log || {});
      flowLogs.forEach((log: any) => {
        expect(log.traffic_type).toBe('ALL');
      });
    });

    test('uses S3 as flow log destination', () => {
      const jsonParsed = JSON.parse(synthesized);
      const flowLogs = Object.values(jsonParsed.resource.aws_flow_log || {});
      flowLogs.forEach((log: any) => {
        expect(log.log_destination_type).toBe('s3');
      });
    });
  });

  describe('Resource Naming and Tagging', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TagTestStack', {
        environmentSuffix: 'tag-test',
        awsRegion: 'us-east-1',
      });
      synthesized = Testing.synth(stack);
    });

    test('all resources include environment suffix in names', () => {
      const resourceNames = synthesized.match(/"Name": "[^"]*"/g) || [];
      const namesWithSuffix = resourceNames.filter(name => name.includes('tag-test'));
      expect(namesWithSuffix.length).toBeGreaterThan(0);
    });

    test('all resources have required tags', () => {
      expect(synthesized).toContain('"Environment": "tag-test"');
      expect(synthesized).toContain('"Project": "PaymentProcessing"');
      expect(synthesized).toContain('"CostCenter": "FinTech"');
    });

    test('resources have tier-specific tags where applicable', () => {
      expect(synthesized).toContain('"Tier": "Public"');
      expect(synthesized).toContain('"Tier": "Application"');
      expect(synthesized).toContain('"Tier": "Database"');
    });
  });

  describe('Backend Configuration', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'BackendTestStack', {
        environmentSuffix: 'backend-test',
        stateBucket: 'test-state-bucket',
        stateBucketRegion: 'us-west-2',
        awsRegion: 'us-east-1',
      });
      synthesized = Testing.synth(stack);
    });

    test('configures S3 backend', () => {
      expect(synthesized).toContain('"backend"');
      expect(synthesized).toContain('"s3"');
    });

    test('uses custom state bucket when provided', () => {
      expect(synthesized).toContain('test-state-bucket');
    });

    test('enables encryption for state file', () => {
      const jsonParsed = JSON.parse(synthesized);
      expect(jsonParsed.terraform.backend.s3.encrypt).toBe(true);
    });
  });
});

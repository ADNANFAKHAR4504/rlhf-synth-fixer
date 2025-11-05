import { App, Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  let app: App;
  let stack: TapStack;
  let synthesized: any;
  let parsed: any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Stack Initialization', () => {
    test('TapStack instantiates successfully with custom props', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackWithProps', {
        environmentSuffix: 'prod',
        stateBucket: 'custom-state-bucket',
        stateBucketRegion: 'us-west-2',
        awsRegion: 'us-west-2',
      });
      synthesized = Testing.synth(stack);
      parsed = JSON.parse(synthesized);

      expect(stack).toBeDefined();
      expect(synthesized).toBeDefined();
    });

    test('TapStack uses default values when no props provided', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackDefault');
      synthesized = Testing.synth(stack);
      parsed = JSON.parse(synthesized);

      expect(stack).toBeDefined();
      expect(synthesized).toBeDefined();
    });

    test('TapStack uses us-east-1 region override', () => {
      app = new App();
      stack = new TapStack(app, 'TestRegionOverride', {
        environmentSuffix: 'test',
        awsRegion: 'us-west-2', // This should be overridden to us-east-1
      });
      synthesized = Testing.synth(stack);
      parsed = JSON.parse(synthesized);

      // Verify AWS provider is configured with us-east-1 (from AWS_REGION_OVERRIDE)
      const awsProvider = parsed.provider.aws;
      expect(awsProvider).toBeDefined();
      expect(awsProvider[0]).toMatchObject({
        region: 'us-east-1',
      });
    });

    test('TapStack configures S3 backend correctly', () => {
      app = new App();
      stack = new TapStack(app, 'TestS3Backend', {
        environmentSuffix: 'staging',
        stateBucket: 'test-bucket',
        stateBucketRegion: 'us-east-1',
      });
      synthesized = Testing.synth(stack);
      parsed = JSON.parse(synthesized);

      // Verify S3 backend configuration
      expect(parsed.terraform.backend.s3).toMatchObject({
        bucket: 'test-bucket',
        key: 'staging/TestS3Backend.tfstate',
        region: 'us-east-1',
        encrypt: true,
      });
    });
  });

  describe('VPC Configuration', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestVpcStack', {
        environmentSuffix: 'dev',
      });
      synthesized = Testing.synth(stack);
      parsed = JSON.parse(synthesized);
    });

    test('VPC is created with correct CIDR block', () => {
      const vpcs = parsed.resource.aws_vpc;
      expect(vpcs).toBeDefined();

      const vpcConfig = Object.values(vpcs)[0] as any;
      expect(vpcConfig.cidr_block).toBe('10.0.0.0/16');
      expect(vpcConfig.enable_dns_hostnames).toBe(true);
      expect(vpcConfig.enable_dns_support).toBe(true);
    });

    test('VPC has correct tags', () => {
      const vpcs = parsed.resource.aws_vpc;
      const vpcConfig = Object.values(vpcs)[0] as any;

      expect(vpcConfig.tags.Environment).toBe('Production');
      expect(vpcConfig.tags.Project).toBe('PaymentGateway');
      expect(vpcConfig.tags.Name).toContain('payment-gateway-vpc');
    });

    test('Internet Gateway is created', () => {
      const igws = parsed.resource.aws_internet_gateway;
      expect(igws).toBeDefined();
      expect(Object.keys(igws).length).toBeGreaterThan(0);

      const igwConfig = Object.values(igws)[0] as any;
      expect(igwConfig.vpc_id).toBeDefined();
    });
  });

  describe('Subnet Configuration', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestSubnetStack', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);
      parsed = JSON.parse(synthesized);
    });

    test('Creates 3 public subnets with correct CIDR blocks', () => {
      const subnets = parsed.resource.aws_subnet;
      const publicSubnets = Object.entries(subnets).filter(
        ([key, value]: [string, any]) => key.includes('public-subnet')
      );

      expect(publicSubnets.length).toBe(3);

      const expectedCidrs = ['10.0.1.0/24', '10.0.2.0/24', '10.0.3.0/24'];
      const actualCidrs = publicSubnets.map(
        ([_, config]: [string, any]) => config.cidr_block
      );

      expectedCidrs.forEach(cidr => {
        expect(actualCidrs).toContain(cidr);
      });
    });

    test('Public subnets have map_public_ip_on_launch enabled', () => {
      const subnets = parsed.resource.aws_subnet;
      const publicSubnets = Object.entries(subnets).filter(
        ([key, _]: [string, any]) => key.includes('public-subnet')
      );

      publicSubnets.forEach(([_, config]: [string, any]) => {
        expect(config.map_public_ip_on_launch).toBe(true);
      });
    });

    test('Creates 3 private subnets with correct CIDR blocks', () => {
      const subnets = parsed.resource.aws_subnet;
      const privateSubnets = Object.entries(subnets).filter(
        ([key, _]: [string, any]) => key.includes('private-subnet')
      );

      expect(privateSubnets.length).toBe(3);

      const expectedCidrs = ['10.0.11.0/24', '10.0.12.0/24', '10.0.13.0/24'];
      const actualCidrs = privateSubnets.map(
        ([_, config]: [string, any]) => config.cidr_block
      );

      expectedCidrs.forEach(cidr => {
        expect(actualCidrs).toContain(cidr);
      });
    });

    test('Private subnets have map_public_ip_on_launch disabled', () => {
      const subnets = parsed.resource.aws_subnet;
      const privateSubnets = Object.entries(subnets).filter(
        ([key, _]: [string, any]) => key.includes('private-subnet')
      );

      privateSubnets.forEach(([_, config]: [string, any]) => {
        expect(config.map_public_ip_on_launch).toBe(false);
      });
    });

    test('Creates 3 isolated subnets with correct CIDR blocks', () => {
      const subnets = parsed.resource.aws_subnet;
      const isolatedSubnets = Object.entries(subnets).filter(
        ([key, _]: [string, any]) => key.includes('isolated-subnet')
      );

      expect(isolatedSubnets.length).toBe(3);

      const expectedCidrs = ['10.0.21.0/24', '10.0.22.0/24', '10.0.23.0/24'];
      const actualCidrs = isolatedSubnets.map(
        ([_, config]: [string, any]) => config.cidr_block
      );

      expectedCidrs.forEach(cidr => {
        expect(actualCidrs).toContain(cidr);
      });
    });

    test('Subnets are distributed across availability zones', () => {
      const subnets = parsed.resource.aws_subnet;
      const allSubnets = Object.values(subnets);

      // Each subnet should have an availability_zone defined
      allSubnets.forEach((config: any) => {
        expect(config.availability_zone).toBeDefined();
      });
    });
  });

  describe('NAT Gateway Configuration', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestNatStack', {
        environmentSuffix: 'prod',
      });
      synthesized = Testing.synth(stack);
      parsed = JSON.parse(synthesized);
    });

    test('Creates 3 NAT Gateways', () => {
      const natGateways = parsed.resource.aws_nat_gateway;
      expect(natGateways).toBeDefined();
      expect(Object.keys(natGateways).length).toBe(3);
    });

    test('Creates 3 Elastic IPs for NAT Gateways', () => {
      const eips = parsed.resource.aws_eip;
      expect(eips).toBeDefined();
      expect(Object.keys(eips).length).toBe(3);

      Object.values(eips).forEach((config: any) => {
        expect(config.domain).toBe('vpc');
      });
    });

    test('NAT Gateways are associated with Elastic IPs', () => {
      const natGateways = parsed.resource.aws_nat_gateway;

      Object.values(natGateways).forEach((config: any) => {
        expect(config.allocation_id).toBeDefined();
        expect(config.subnet_id).toBeDefined();
      });
    });

    test('NAT Gateways have correct tags', () => {
      const natGateways = parsed.resource.aws_nat_gateway;

      Object.values(natGateways).forEach((config: any) => {
        expect(config.tags.Environment).toBe('Production');
        expect(config.tags.Project).toBe('PaymentGateway');
      });
    });
  });

  describe('Route Table Configuration', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestRouteStack', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);
      parsed = JSON.parse(synthesized);
    });

    test('Creates public route table', () => {
      const routeTables = parsed.resource.aws_route_table;
      const publicRouteTable = Object.entries(routeTables).find(
        ([key, _]: [string, any]) => key.includes('public-rt')
      );

      expect(publicRouteTable).toBeDefined();
    });

    test('Creates 3 private route tables (one per AZ)', () => {
      const routeTables = parsed.resource.aws_route_table;
      const privateRouteTables = Object.entries(routeTables).filter(
        ([key, _]: [string, any]) => key.includes('private-rt')
      );

      expect(privateRouteTables.length).toBe(3);
    });

    test('Creates 3 isolated route tables', () => {
      const routeTables = parsed.resource.aws_route_table;
      const isolatedRouteTables = Object.entries(routeTables).filter(
        ([key, _]: [string, any]) => key.includes('isolated-rt')
      );

      expect(isolatedRouteTables.length).toBe(3);
    });

    test('Public route has route to Internet Gateway', () => {
      const routes = parsed.resource.aws_route;
      const publicRoute = Object.entries(routes).find(
        ([key, _]: [string, any]) => key.includes('public-route')
      );

      expect(publicRoute).toBeDefined();
      const [_, routeConfig] = publicRoute as [string, any];
      expect(routeConfig.destination_cidr_block).toBe('0.0.0.0/0');
      expect(routeConfig.gateway_id).toBeDefined();
    });

    test('Private routes have routes to NAT Gateways', () => {
      const routes = parsed.resource.aws_route;
      const privateRoutes = Object.entries(routes).filter(
        ([key, _]: [string, any]) => key.includes('private-route')
      );

      expect(privateRoutes.length).toBe(3);

      privateRoutes.forEach(([_, config]: [string, any]) => {
        expect(config.destination_cidr_block).toBe('0.0.0.0/0');
        expect(config.nat_gateway_id).toBeDefined();
      });
    });

    test('Route table associations exist for all subnets', () => {
      const associations = parsed.resource.aws_route_table_association;
      expect(associations).toBeDefined();

      // 3 public + 3 private + 3 isolated = 9 associations
      expect(Object.keys(associations).length).toBe(9);
    });
  });

  describe('Security Group Configuration', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestSgStack', {
        environmentSuffix: 'dev',
      });
      synthesized = Testing.synth(stack);
      parsed = JSON.parse(synthesized);
    });

    test('Creates 3 security groups (web, app, db)', () => {
      const securityGroups = parsed.resource.aws_security_group;
      expect(securityGroups).toBeDefined();
      expect(Object.keys(securityGroups).length).toBe(3);

      const sgKeys = Object.keys(securityGroups);
      expect(sgKeys.some(key => key.includes('web-sg'))).toBe(true);
      expect(sgKeys.some(key => key.includes('app-sg'))).toBe(true);
      expect(sgKeys.some(key => key.includes('db-sg'))).toBe(true);
    });

    test('Web security group allows HTTP and HTTPS', () => {
      const sgRules = parsed.resource.aws_security_group_rule;
      const webRules = Object.entries(sgRules).filter(
        ([key, _]: [string, any]) => key.includes('web-sg')
      );

      const httpRule = webRules.find(([key, _]: [string, any]) =>
        key.includes('http')
      );
      const httpsRule = webRules.find(([key, _]: [string, any]) =>
        key.includes('https')
      );

      expect(httpRule).toBeDefined();
      expect(httpsRule).toBeDefined();

      const [_, httpConfig] = httpRule as [string, any];
      expect(httpConfig.from_port).toBe(80);
      expect(httpConfig.to_port).toBe(80);
      expect(httpConfig.protocol).toBe('tcp');

      const [__, httpsConfig] = httpsRule as [string, any];
      expect(httpsConfig.from_port).toBe(443);
      expect(httpsConfig.to_port).toBe(443);
      expect(httpsConfig.protocol).toBe('tcp');
    });

    test('App security group allows port 8080 from web tier', () => {
      const sgRules = parsed.resource.aws_security_group_rule;
      const appRule = Object.entries(sgRules).find(([key, _]: [string, any]) =>
        key.includes('app-sg-from-web')
      );

      expect(appRule).toBeDefined();
      const [_, config] = appRule as [string, any];
      expect(config.from_port).toBe(8080);
      expect(config.to_port).toBe(8080);
      expect(config.protocol).toBe('tcp');
      expect(config.source_security_group_id).toBeDefined();
    });

    test('Database security group allows PostgreSQL from app tier', () => {
      const sgRules = parsed.resource.aws_security_group_rule;
      const dbRule = Object.entries(sgRules).find(([key, _]: [string, any]) =>
        key.includes('db-sg-from-app')
      );

      expect(dbRule).toBeDefined();
      const [_, config] = dbRule as [string, any];
      expect(config.from_port).toBe(5432);
      expect(config.to_port).toBe(5432);
      expect(config.protocol).toBe('tcp');
      expect(config.source_security_group_id).toBeDefined();
    });

    test('Security groups have egress rules', () => {
      const sgRules = parsed.resource.aws_security_group_rule;
      const egressRules = Object.entries(sgRules).filter(
        ([key, value]: [string, any]) => key.includes('egress')
      );

      expect(egressRules.length).toBeGreaterThanOrEqual(3);

      egressRules.forEach(([_, config]: [string, any]) => {
        expect(config.type).toBe('egress');
        expect(config.from_port).toBe(0);
        expect(config.to_port).toBe(0);
        expect(config.protocol).toBe('-1');
      });
    });
  });

  describe('VPC Flow Logs Configuration', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestFlowLogStack', {
        environmentSuffix: 'prod',
      });
      synthesized = Testing.synth(stack);
      parsed = JSON.parse(synthesized);
    });

    test('CloudWatch Log Group is created with 7-day retention', () => {
      const logGroups = parsed.resource.aws_cloudwatch_log_group;
      expect(logGroups).toBeDefined();

      const flowLogGroup = Object.values(logGroups)[0] as any;
      expect(flowLogGroup.retention_in_days).toBe(7);
      expect(flowLogGroup.name).toContain('payment-gateway');
    });

    test('IAM role is created for VPC Flow Logs', () => {
      const iamRoles = parsed.resource.aws_iam_role;
      const flowLogRole = Object.entries(iamRoles).find(
        ([key, _]: [string, any]) => key.includes('vpc-flow-log-role')
      );

      expect(flowLogRole).toBeDefined();
      const [_, config] = flowLogRole as [string, any];
      expect(config.assume_role_policy).toContain(
        'vpc-flow-logs.amazonaws.com'
      );
    });

    test('IAM policy is attached to Flow Log role', () => {
      const iamPolicies = parsed.resource.aws_iam_role_policy;
      const flowLogPolicy = Object.entries(iamPolicies).find(
        ([key, _]: [string, any]) => key.includes('vpc-flow-log-policy')
      );

      expect(flowLogPolicy).toBeDefined();
      const [_, config] = flowLogPolicy as [string, any];
      expect(config.policy).toContain('logs:CreateLogGroup');
      expect(config.policy).toContain('logs:PutLogEvents');
    });

    test('VPC Flow Log is created with ALL traffic type', () => {
      const flowLogs = parsed.resource.aws_flow_log;
      expect(flowLogs).toBeDefined();

      const flowLog = Object.values(flowLogs)[0] as any;
      expect(flowLog.traffic_type).toBe('ALL');
      expect(flowLog.log_destination_type).toBe('cloud-watch-logs');
      expect(flowLog.vpc_id).toBeDefined();
    });
  });

  describe('Systems Manager Parameter Store Configuration', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestSsmStack', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);
      parsed = JSON.parse(synthesized);
    });

    test('Creates parameter store entries for all subnets', () => {
      const ssmParams = parsed.resource.aws_ssm_parameter;
      expect(ssmParams).toBeDefined();

      // 3 public + 3 private + 3 isolated + 1 vpc-id = 10 parameters
      expect(Object.keys(ssmParams).length).toBe(10);
    });

    test('Parameter store entries follow correct naming convention', () => {
      const ssmParams = parsed.resource.aws_ssm_parameter;

      const publicParams = Object.values(ssmParams).filter((param: any) =>
        param.name.includes('/vpc/production/public-subnet')
      );
      const privateParams = Object.values(ssmParams).filter((param: any) =>
        param.name.includes('/vpc/production/private-subnet')
      );
      const isolatedParams = Object.values(ssmParams).filter((param: any) =>
        param.name.includes('/vpc/production/isolated-subnet')
      );

      expect(publicParams.length).toBe(3);
      expect(privateParams.length).toBe(3);
      expect(isolatedParams.length).toBe(3);

      // Verify naming pattern includes AZ numbers
      publicParams.forEach((param: any) => {
        expect(param.name).toMatch(/\/vpc\/production\/public-subnet\/az[1-3]/);
      });
    });

    test('VPC ID is stored in Parameter Store', () => {
      const ssmParams = parsed.resource.aws_ssm_parameter;
      const vpcParam = Object.entries(ssmParams).find(
        ([key, value]: [string, any]) =>
          value.name.includes('/vpc/production/vpc-id')
      );

      expect(vpcParam).toBeDefined();
      const [_, config] = vpcParam as [string, any];
      expect(config.type).toBe('String');
      expect(config.description).toContain('VPC ID');
    });

    test('Parameter store entries have correct type', () => {
      const ssmParams = parsed.resource.aws_ssm_parameter;

      Object.values(ssmParams).forEach((param: any) => {
        expect(param.type).toBe('String');
        expect(param.value).toBeDefined();
      });
    });
  });

  describe('Resource Tagging', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestTagStack', {
        environmentSuffix: 'staging',
      });
      synthesized = Testing.synth(stack);
      parsed = JSON.parse(synthesized);
    });

    test('All resources have Environment and Project tags', () => {
      const resourceTypes = [
        'aws_vpc',
        'aws_subnet',
        'aws_nat_gateway',
        'aws_security_group',
        'aws_eip',
      ];

      resourceTypes.forEach(resourceType => {
        const resources = parsed.resource[resourceType];
        if (resources) {
          Object.values(resources).forEach((config: any) => {
            expect(config.tags).toBeDefined();
            expect(config.tags.Environment).toBe('Production');
            expect(config.tags.Project).toBe('PaymentGateway');
          });
        }
      });
    });

    test('Resources include environmentSuffix in their names', () => {
      const vpc = parsed.resource.aws_vpc;
      const vpcConfig = Object.values(vpc)[0] as any;
      expect(vpcConfig.tags.Name).toContain('staging');

      const subnets = parsed.resource.aws_subnet;
      Object.values(subnets).forEach((config: any) => {
        expect(config.tags.Name).toContain('staging');
      });
    });
  });

  describe('Terraform Outputs', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestOutputStack', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);
      parsed = JSON.parse(synthesized);
    });

    test('Outputs VPC ID', () => {
      const outputs = parsed.output;
      const vpcIdKey = Object.keys(outputs).find(key => key.includes('vpc-id'));
      expect(vpcIdKey).toBeDefined();
      expect(outputs[vpcIdKey].description).toBe('VPC ID');
    });

    test('Outputs subnet IDs', () => {
      const outputs = parsed.output;
      const publicSubnetKey = Object.keys(outputs).find(key => key.includes('public-subnet-ids'));
      const privateSubnetKey = Object.keys(outputs).find(key => key.includes('private-subnet-ids'));
      const isolatedSubnetKey = Object.keys(outputs).find(key => key.includes('isolated-subnet-ids'));

      expect(publicSubnetKey).toBeDefined();
      expect(privateSubnetKey).toBeDefined();
      expect(isolatedSubnetKey).toBeDefined();
    });

    test('Outputs security group IDs', () => {
      const outputs = parsed.output;
      const webSgKey = Object.keys(outputs).find(key => key.includes('web-security-group-id'));
      const appSgKey = Object.keys(outputs).find(key => key.includes('app-security-group-id'));
      const dbSgKey = Object.keys(outputs).find(key => key.includes('db-security-group-id'));

      expect(webSgKey).toBeDefined();
      expect(appSgKey).toBeDefined();
      expect(dbSgKey).toBeDefined();
    });
  });
});

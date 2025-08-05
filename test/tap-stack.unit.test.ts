import { App, Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  let app: App;
  let stack: TapStack;
  let synthesized: string;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  describe('Stack Instantiation', () => {
    test('TapStack instantiates successfully via props', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackWithProps', {
        environmentSuffix: 'prod',
        stateBucket: 'custom-state-bucket',
        stateBucketRegion: 'us-west-2',
        awsRegion: 'us-west-2',
      });
      synthesized = Testing.synth(stack);

      // Verify that TapStack instantiates without errors via props
      expect(stack).toBeDefined();
      expect(synthesized).toBeDefined();
      expect(synthesized.length).toBeGreaterThan(0);
    });

    test('TapStack uses default values when no props provided', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackDefault');
      synthesized = Testing.synth(stack);

      // Verify that TapStack instantiates without errors when
      // no props are provided
      expect(stack).toBeDefined();
      expect(synthesized).toBeDefined();
      expect(synthesized.length).toBeGreaterThan(0);
    });

    test('TapStack handles different environment suffixes correctly', () => {
      const environments = ['dev', 'staging', 'prod'];
      
      environments.forEach(env => {
        app = new App();
        stack = new TapStack(app, `TestTapStack${env}`, {
          environmentSuffix: env,
        });
        synthesized = Testing.synth(stack);

        expect(stack).toBeDefined();
        expect(synthesized).toBeDefined();
        expect(synthesized).toContain(env);
      });
    });
  });

  describe('Network Configuration Validation', () => {
    test('Dev environment should have correct CIDR configuration', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackDev', {
        environmentSuffix: 'dev',
      });
      synthesized = Testing.synth(stack);
      const template = JSON.parse(synthesized);

      const vpc = Object.values(template.resource.aws_vpc)[0] as any;
      expect(vpc.cidr_block).toBe('10.0.0.0/16');
    });

    test('Staging environment should have correct CIDR configuration', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackStaging', {
        environmentSuffix: 'staging',
      });
      synthesized = Testing.synth(stack);
      const template = JSON.parse(synthesized);

      const vpc = Object.values(template.resource.aws_vpc)[0] as any;
      expect(vpc.cidr_block).toBe('172.16.0.0/16');
    });

    test('Production environment should have correct CIDR configuration', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackProd', {
        environmentSuffix: 'prod',
      });
      synthesized = Testing.synth(stack);
      const template = JSON.parse(synthesized);

      const vpc = Object.values(template.resource.aws_vpc)[0] as any;
      expect(vpc.cidr_block).toBe('192.168.0.0/16');
    });
  });

  describe('Resource Count Validation', () => {
    test('Dev environment should have correct NAT Gateway count', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackDev', {
        environmentSuffix: 'dev',
      });
      synthesized = Testing.synth(stack);
      const template = JSON.parse(synthesized);

      const natGateways = Object.keys(template.resource.aws_nat_gateway);
      expect(natGateways).toHaveLength(1); // Dev should have 1 NAT Gateway
    });

    test('Staging environment should have correct NAT Gateway count', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackStaging', {
        environmentSuffix: 'staging',
      });
      synthesized = Testing.synth(stack);
      const template = JSON.parse(synthesized);

      const natGateways = Object.keys(template.resource.aws_nat_gateway);
      expect(natGateways).toHaveLength(2); // Staging should have 2 NAT Gateways
    });

    test('Production environment should have correct NAT Gateway count', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackProd', {
        environmentSuffix: 'prod',
      });
      synthesized = Testing.synth(stack);
      const template = JSON.parse(synthesized);

      const natGateways = Object.keys(template.resource.aws_nat_gateway);
      expect(natGateways).toHaveLength(3); // Prod should have 3 NAT Gateways
    });

    test('All environments should have required core resources', () => {
      const environments = ['dev', 'staging', 'prod'];
      
      environments.forEach(env => {
        app = new App();
        stack = new TapStack(app, `TestTapStack${env}`, {
          environmentSuffix: env,
        });
        synthesized = Testing.synth(stack);
        const template = JSON.parse(synthesized);

        // Verify core resources exist
        expect(template.resource.aws_vpc).toBeDefined();
        expect(template.resource.aws_internet_gateway).toBeDefined();
        expect(template.resource.aws_subnet).toBeDefined();
        expect(template.resource.aws_route_table).toBeDefined();
        expect(template.resource.aws_security_group).toBeDefined();
        expect(template.resource.aws_network_acl).toBeDefined();
        expect(template.resource.aws_vpc_endpoint).toBeDefined();
        expect(template.resource.aws_flow_log).toBeDefined();
        
        // Verify resource counts
        expect(Object.keys(template.resource.aws_vpc)).toHaveLength(1);
        expect(Object.keys(template.resource.aws_internet_gateway)).toHaveLength(1);
        expect(Object.keys(template.resource.aws_security_group)).toHaveLength(2); // Web and DB
        expect(Object.keys(template.resource.aws_vpc_endpoint)).toHaveLength(2); // S3 and DynamoDB
      });
    });
  });

  describe('Resource Naming and Tagging', () => {
    test('Resources should have correct naming patterns', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackDev', {
        environmentSuffix: 'dev',
      });
      synthesized = Testing.synth(stack);
      const template = JSON.parse(synthesized);

      // Check VPC naming
      const vpc = Object.values(template.resource.aws_vpc)[0] as any;
      expect(vpc.tags.Name).toBe('dev-vpc');

      // Check Internet Gateway naming
      const igw = Object.values(template.resource.aws_internet_gateway)[0] as any;
      expect(igw.tags.Name).toBe('dev-igw');

      // Check security group naming
      const securityGroups = Object.values(template.resource.aws_security_group);
      const webSg = securityGroups.find((sg: any) => sg.name === 'dev-web-sg');
      const dbSg = securityGroups.find((sg: any) => sg.name === 'dev-database-sg');
      expect(webSg).toBeDefined();
      expect(dbSg).toBeDefined();
    });

    test('Resources should have correct environment tags', () => {
      const environments = ['dev', 'staging', 'prod'];
      
      environments.forEach(env => {
        app = new App();
        stack = new TapStack(app, `TestTapStack${env}`, {
          environmentSuffix: env,
        });
        synthesized = Testing.synth(stack);
        const template = JSON.parse(synthesized);

        // Check VPC tags
        const vpc = Object.values(template.resource.aws_vpc)[0] as any;
        expect(vpc.tags.Environment).toBe(env);
        expect(vpc.tags.Type).toBe('vpc');

        // Check subnet tags
        const subnets = Object.values(template.resource.aws_subnet);
        subnets.forEach((subnet: any) => {
          expect(subnet.tags.Environment).toBe(env);
          expect(subnet.tags.Type).toMatch(/subnet/);
        });
      });
    });
  });

  describe('Output Validation', () => {
    test('Stack should generate required outputs', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackDev', {
        environmentSuffix: 'dev',
      });
      synthesized = Testing.synth(stack);
      const template = JSON.parse(synthesized);

      expect(template.output).toBeDefined();
      expect(template.output['dev-vpc-id']).toBeDefined();
      expect(template.output['dev-vpc-cidr']).toBeDefined();
      expect(template.output['dev-public-subnet-ids']).toBeDefined();
      expect(template.output['dev-private-subnet-ids']).toBeDefined();
      expect(template.output['dev-nat-gateway-ids']).toBeDefined();
    });

    test('Output descriptions should be meaningful', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackDev', {
        environmentSuffix: 'dev',
      });
      synthesized = Testing.synth(stack);
      const template = JSON.parse(synthesized);

      expect(template.output['dev-vpc-id'].description).toBe('VPC ID');
      expect(template.output['dev-vpc-cidr'].description).toBe('VPC CIDR block');
      expect(template.output['dev-public-subnet-ids'].description).toBe('Public subnet IDs');
      expect(template.output['dev-private-subnet-ids'].description).toBe('Private subnet IDs');
      expect(template.output['dev-nat-gateway-ids'].description).toBe('NAT Gateway IDs');
    });
  });

  describe('Security Configuration Validation', () => {
    test('Security groups should have correct ingress rules', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackDev', {
        environmentSuffix: 'dev',
      });
      synthesized = Testing.synth(stack);
      const template = JSON.parse(synthesized);

      const securityGroups = Object.values(template.resource.aws_security_group);
      
      // Web security group should allow HTTP and HTTPS
      const webSg = securityGroups.find((sg: any) => sg.name === 'dev-web-sg') as any;
      expect(webSg.ingress).toHaveLength(2);
      expect(webSg.ingress.some((rule: any) => rule.from_port === 80 && rule.to_port === 80)).toBe(true);
      expect(webSg.ingress.some((rule: any) => rule.from_port === 443 && rule.to_port === 443)).toBe(true);

      // Database security group should allow MySQL port
      const dbSg = securityGroups.find((sg: any) => sg.name === 'dev-database-sg') as any;
      expect(dbSg.ingress).toHaveLength(1);
      expect(dbSg.ingress[0].from_port).toBe(3306);
      expect(dbSg.ingress[0].to_port).toBe(3306);
    });

    test('Network ACLs should have correct rules', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackDev', {
        environmentSuffix: 'dev',
      });
      synthesized = Testing.synth(stack);
      const template = JSON.parse(synthesized);

      const networkAclRules = Object.values(template.resource.aws_network_acl_rule);
      expect(networkAclRules).toHaveLength(3); // HTTP ingress, HTTPS ingress, All egress

      // Check for HTTP rule
      const httpRule = networkAclRules.find((rule: any) => rule.from_port === 80) as any;
      expect(httpRule).toBeDefined();
      expect(httpRule.rule_action).toBe('allow');

      // Check for HTTPS rule
      const httpsRule = networkAclRules.find((rule: any) => rule.from_port === 443) as any;
      expect(httpsRule).toBeDefined();
      expect(httpsRule.rule_action).toBe('allow');
    });
  });

  describe('Monitoring Configuration', () => {
    test('VPC Flow Logs should be properly configured', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackDev', {
        environmentSuffix: 'dev',
      });
      synthesized = Testing.synth(stack);
      const template = JSON.parse(synthesized);

      const flowLogs = Object.values(template.resource.aws_flow_log);
      const logGroups = Object.values(template.resource.aws_cloudwatch_log_group);
      const iamRoles = Object.values(template.resource.aws_iam_role);

      expect(flowLogs).toHaveLength(1);
      expect(logGroups).toHaveLength(1);
      expect(iamRoles).toHaveLength(1);

      const flowLog = flowLogs[0] as any;
      expect(flowLog.traffic_type).toBe('ALL');
      expect(flowLog.tags.Name).toBe('dev-vpc-flow-logs');

      const logGroup = logGroups[0] as any;
      expect(logGroup.name).toBe('/aws/vpc/flowlogs/dev');
      expect(logGroup.retention_in_days).toBe(14);
    });
  });
});

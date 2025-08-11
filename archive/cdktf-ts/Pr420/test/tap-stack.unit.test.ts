import { App, Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  let app: App;
  let stack: TapStack;
  let synthesized: string;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Stack Instantiation', () => {
    test('should instantiate successfully with custom props', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackWithProps', {
        environmentSuffix: 'prod',
        stateBucket: 'custom-state-bucket',
        stateBucketRegion: 'us-west-2',
        awsRegion: 'us-west-2',
        keyName: 'test-key',
      });
      synthesized = Testing.synth(stack);

      expect(stack).toBeDefined();
      expect(synthesized).toBeDefined();
    });

    test('should use default values when no props provided', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackDefault', {});
      synthesized = Testing.synth(stack);

      expect(stack).toBeDefined();
      expect(synthesized).toBeDefined();
    });
  });

  describe('Infrastructure Components', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestStack', {
        awsRegion: 'us-west-2',
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);
    });

    test('should create VPC with correct CIDR block', () => {
      const synthesizedJson = JSON.parse(synthesized);
      const vpcResource = synthesizedJson.resource.aws_vpc['dev-vpc'];
      
      expect(vpcResource).toBeDefined();
      expect(vpcResource.cidr_block).toBe('10.0.0.0/16');
      expect(vpcResource.tags.Environment).toBe('Development');
    });

    test('should create two public subnets in different AZs', () => {
      const synthesizedJson = JSON.parse(synthesized);
      const subnet1 = synthesizedJson.resource.aws_subnet['dev-subnet-public-1'];
      const subnet2 = synthesizedJson.resource.aws_subnet['dev-subnet-public-2'];
      
      expect(subnet1).toBeDefined();
      expect(subnet2).toBeDefined();
      expect(subnet1.cidr_block).toBe('10.0.1.0/24');
      expect(subnet2.cidr_block).toBe('10.0.2.0/24');
      expect(subnet1.availability_zone).toBe('us-west-2a');
      expect(subnet2.availability_zone).toBe('us-west-2b');
      expect(subnet1.map_public_ip_on_launch).toBe(true);
      expect(subnet2.map_public_ip_on_launch).toBe(true);
    });

    test('should create Internet Gateway attached to VPC', () => {
      const synthesizedJson = JSON.parse(synthesized);
      const igw = synthesizedJson.resource.aws_internet_gateway['dev-igw'];
      
      expect(igw).toBeDefined();
      expect(igw.vpc_id).toMatch(/\$\{aws_vpc\.dev-vpc\.id\}/);
      expect(igw.tags.Environment).toBe('Development');
    });

    test('should create route table with public route', () => {
      const synthesizedJson = JSON.parse(synthesized);
      const routeTable = synthesizedJson.resource.aws_route_table['dev-route-table-public'];
      const route = synthesizedJson.resource.aws_route['dev-route-public'];
      
      expect(routeTable).toBeDefined();
      expect(route).toBeDefined();
      expect(route.destination_cidr_block).toBe('0.0.0.0/0');
      expect(route.gateway_id).toMatch(/\$\{aws_internet_gateway\.dev-igw\.id\}/);
    });

    test('should create Network ACL with HTTP and HTTPS rules', () => {
      const synthesizedJson = JSON.parse(synthesized);
      const nacl = synthesizedJson.resource.aws_network_acl['dev-nacl'];
      const httpRule = synthesizedJson.resource.aws_network_acl_rule['dev-nacl-rule-inbound-http'];
      const httpsRule = synthesizedJson.resource.aws_network_acl_rule['dev-nacl-rule-inbound-https'];
      
      expect(nacl).toBeDefined();
      expect(httpRule).toBeDefined();
      expect(httpsRule).toBeDefined();
      expect(httpRule.from_port).toBe(80);
      expect(httpRule.to_port).toBe(80);
      expect(httpsRule.from_port).toBe(443);
      expect(httpsRule.to_port).toBe(443);
      expect(httpRule.rule_action).toBe('allow');
      expect(httpsRule.rule_action).toBe('allow');
    });

    test('should create Security Group with SSH, HTTP, and HTTPS ingress', () => {
      const synthesizedJson = JSON.parse(synthesized);
      const sg = synthesizedJson.resource.aws_security_group['dev-sg'];
      
      expect(sg).toBeDefined();
      expect(sg.ingress).toHaveLength(3);
      
      const sshRule = sg.ingress.find((rule: any) => rule.from_port === 22);
      const httpRule = sg.ingress.find((rule: any) => rule.from_port === 80);
      const httpsRule = sg.ingress.find((rule: any) => rule.from_port === 443);
      
      expect(sshRule).toBeDefined();
      expect(httpRule).toBeDefined();
      expect(httpsRule).toBeDefined();
      expect(sshRule.cidr_blocks).toContain('0.0.0.0/0');
    });

    test('should create EC2 instances with monitoring enabled', () => {
      const synthesizedJson = JSON.parse(synthesized);
      const instance1 = synthesizedJson.resource.aws_instance['dev-instance-1'];
      const instance2 = synthesizedJson.resource.aws_instance['dev-instance-2'];
      
      expect(instance1).toBeDefined();
      expect(instance2).toBeDefined();
      expect(instance1.instance_type).toBe('t2.micro');
      expect(instance2.instance_type).toBe('t2.micro');
      expect(instance1.monitoring).toBe(true);
      expect(instance2.monitoring).toBe(true);
      expect(instance1.tags.Environment).toBe('Development');
      expect(instance2.tags.Environment).toBe('Development');
    });

    test('should create Elastic IPs for both instances', () => {
      const synthesizedJson = JSON.parse(synthesized);
      const eip1 = synthesizedJson.resource.aws_eip['dev-eip-1'];
      const eip2 = synthesizedJson.resource.aws_eip['dev-eip-2'];
      
      expect(eip1).toBeDefined();
      expect(eip2).toBeDefined();
      expect(eip1.instance).toMatch(/\$\{aws_instance\.dev-instance-1\.id\}/);
      expect(eip2.instance).toMatch(/\$\{aws_instance\.dev-instance-2\.id\}/);
      expect(eip1.tags.Environment).toBe('Development');
      expect(eip2.tags.Environment).toBe('Development');
    });

    test('should use AMI data source for latest Amazon Linux 2', () => {
      const synthesizedJson = JSON.parse(synthesized);
      const amiData = synthesizedJson.data.aws_ami.ami;
      
      expect(amiData).toBeDefined();
      expect(amiData.most_recent).toBe(true);
      expect(amiData.owners).toContain('amazon');
      expect(amiData.filter[0].name).toBe('name');
      expect(amiData.filter[0].values).toContain('amzn2-ami-hvm-*-x86_64-gp2');
    });

    test('should configure S3 backend for remote state', () => {
      const synthesizedJson = JSON.parse(synthesized);
      const backend = synthesizedJson.terraform.backend.s3;
      
      expect(backend).toBeDefined();
      expect(backend.bucket).toBe('iac-rlhf-tf-states');
      expect(backend.key).toBe('test/TestStack.tfstate');
      expect(backend.region).toBe('us-east-1');
      expect(backend.encrypt).toBe(true);
    });
  });

  describe('Naming Convention', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestStack', { environmentSuffix: 'test' });
      synthesized = Testing.synth(stack);
    });

    test('should follow dev-resourcetype-name naming convention', () => {
      const synthesizedJson = JSON.parse(synthesized);
      
      expect(synthesizedJson.resource.aws_vpc['dev-vpc']).toBeDefined();
      expect(synthesizedJson.resource.aws_subnet['dev-subnet-public-1']).toBeDefined();
      expect(synthesizedJson.resource.aws_subnet['dev-subnet-public-2']).toBeDefined();
      expect(synthesizedJson.resource.aws_internet_gateway['dev-igw']).toBeDefined();
      expect(synthesizedJson.resource.aws_route_table['dev-route-table-public']).toBeDefined();
      expect(synthesizedJson.resource.aws_security_group['dev-sg']).toBeDefined();
      expect(synthesizedJson.resource.aws_instance['dev-instance-1']).toBeDefined();
      expect(synthesizedJson.resource.aws_instance['dev-instance-2']).toBeDefined();
    });
  });

  describe('Environment Tags', () => {
    test('should tag all resources with Environment = Development', () => {
      app = new App();
      stack = new TapStack(app, 'TestStack', {});
      synthesized = Testing.synth(stack);
      const synthesizedJson = JSON.parse(synthesized);
      
      const resourcesWithTags = [
        synthesizedJson.resource.aws_vpc['dev-vpc'],
        synthesizedJson.resource.aws_subnet['dev-subnet-public-1'],
        synthesizedJson.resource.aws_subnet['dev-subnet-public-2'],
        synthesizedJson.resource.aws_internet_gateway['dev-igw'],
        synthesizedJson.resource.aws_route_table['dev-route-table-public'],
        synthesizedJson.resource.aws_network_acl['dev-nacl'],
        synthesizedJson.resource.aws_security_group['dev-sg'],
        synthesizedJson.resource.aws_instance['dev-instance-1'],
        synthesizedJson.resource.aws_instance['dev-instance-2'],
        synthesizedJson.resource.aws_eip['dev-eip-1'],
        synthesizedJson.resource.aws_eip['dev-eip-2'],
      ];
      
      resourcesWithTags.forEach(resource => {
        expect(resource.tags.Environment).toBe('Development');
      });
    });
  });
});
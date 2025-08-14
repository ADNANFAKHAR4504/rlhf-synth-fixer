import * as fs from 'fs';
import * as path from 'path';
import * as hcl from 'hcl2-parser';

// Test configuration
const TAP_STACK_PATH = path.join(__dirname, '../lib/tap_stack.tf');
const REQUIRED_VARIABLES = ['aws_region', 'project_name', 'env', 'domain_name', 'hosted_zone_id'];
const REQUIRED_OUTPUTS = [
  'vpc_id', 'vpc_cidr', 'public_subnet_ids', 'private_subnet_ids',
  'alb_dns_name', 'target_group_arn', 'asg_name', 'alb_sg_id', 'ec2_sg_id',
  'acm_certificate_arn'
];

describe('TAP Stack Terraform Configuration', () => {
  let tfConfig: any;

  beforeAll(async () => {
    const fileContent = fs.readFileSync(TAP_STACK_PATH, 'utf8');
    tfConfig = await hcl.parseToObject(fileContent);
  });

  test('Configuration file exists', () => {
    expect(fs.existsSync(TAP_STACK_PATH)).toBeTruthy();
  });

  describe('Variable Validation', () => {
    test('All required variables are defined', () => {
      const definedVariables = Object.keys(tfConfig.variable || {});
      REQUIRED_VARIABLES.forEach(varName => {
        expect(definedVariables).toContain(varName);
      });
    });

    test('Variables have descriptions and defaults', () => {
      Object.entries(tfConfig.variable || {}).forEach(([name, config]: [string, any]) => {
        expect(config.description).toBeDefined();
        expect(config.description.length).toBeGreaterThan(0);
        expect(config.default).toBeDefined();
      });
    });
  });

  describe('Resource Validation', () => {
    test('VPC is configured correctly', () => {
      const vpc = tfConfig.resource?.aws_vpc?.main;
      expect(vpc).toBeDefined();
      expect(vpc.cidr_block).toBe('10.0.0.0/16');
      expect(vpc.enable_dns_support).toBe(true);
      expect(vpc.enable_dns_hostnames).toBe(true);
    });

    test('Subnets are properly configured', () => {
      const publicSubnets = tfConfig.resource?.aws_subnet?.public || [];
      const privateSubnets = tfConfig.resource?.aws_subnet?.private || [];
      
      expect(publicSubnets.length).toBeGreaterThanOrEqual(2);
      expect(privateSubnets.length).toBeGreaterThanOrEqual(2);
      
      // Check public subnet configuration
      Object.values(publicSubnets).forEach((subnet: any) => {
        expect(subnet.map_public_ip_on_launch).toBe(true);
        expect(subnet.tags?.Tier).toBe('public');
      });
      
      // Check private subnet configuration
      Object.values(privateSubnets).forEach((subnet: any) => {
        expect(subnet.map_public_ip_on_launch).toBeUndefined();
        expect(subnet.tags?.Tier).toBe('private');
      });
    });

    test('NAT Gateway and routing are configured', () => {
      expect(tfConfig.resource?.aws_nat_gateway?.main).toBeDefined();
      expect(tfConfig.resource?.aws_route_table?.public).toBeDefined();
      expect(tfConfig.resource?.aws_route_table?.private).toBeDefined();
    });
  });

  describe('Security Group Validation', () => {
    test('ALB Security Group has correct rules', () => {
      const albSg = tfConfig.resource?.aws_security_group?.alb;
      expect(albSg).toBeDefined();
      
      const ingressRules = albSg.ingress || [];
      expect(ingressRules.some((r: any) => r.from_port === 80 && r.cidr_blocks?.includes('0.0.0.0/0'))).toBeTruthy();
      expect(ingressRules.some((r: any) => r.from_port === 443 && r.cidr_blocks?.includes('0.0.0.0/0'))).toBeTruthy();
      
      expect(albSg.egress?.[0]?.from_port).toBe(0);
      expect(albSg.egress?.[0]?.to_port).toBe(0);
      expect(albSg.egress?.[0]?.protocol).toBe('-1');
    });

    test('EC2 Security Group has correct rules', () => {
      const ec2Sg = tfConfig.resource?.aws_security_group?.ec2;
      expect(ec2Sg).toBeDefined();
      
      expect(ec2Sg.ingress?.[0]?.from_port).toBe(80);
      expect(ec2Sg.ingress?.[0]?.security_groups).toBeDefined();
      
      expect(ec2Sg.egress?.[0]?.from_port).toBe(0);
      expect(ec2Sg.egress?.[0]?.to_port).toBe(0);
      expect(ec2Sg.egress?.[0]?.protocol).toBe('-1');
    });
  });

  describe('ALB Configuration', () => {
    test('ALB is properly configured', () => {
      const alb = tfConfig.resource?.aws_lb?.main;
      expect(alb).toBeDefined();
      expect(alb.internal).toBe(false);
      expect(alb.load_balancer_type).toBe('application');
      expect(alb.subnets?.length).toBeGreaterThanOrEqual(2);
    });

    test('Listeners are correctly configured', () => {
      const httpListener = tfConfig.resource?.aws_lb_listener?.http;
      const httpsListener = tfConfig.resource?.aws_lb_listener?.https;
      
      expect(httpListener.port).toBe(80);
      expect(httpListener.default_action?.type).toBe('redirect');
      
      expect(httpsListener.port).toBe(443);
      expect(httpsListener.ssl_policy).toBeDefined();
      expect(httpsListener.certificate_arn).toBeDefined();
    });
  });

  describe('Auto Scaling Validation', () => {
    test('Launch Template is properly configured', () => {
      const lt = tfConfig.resource?.aws_launch_template?.main;
      expect(lt).toBeDefined();
      expect(lt.instance_type).toBe('t3.micro');
      expect(lt.monitoring?.enabled).toBe(true);
      expect(lt.user_data).toBeDefined();
    });

    test('ASG is properly configured', () => {
      const asg = tfConfig.resource?.aws_autoscaling_group?.main;
      expect(asg).toBeDefined();
      expect(asg.desired_capacity).toBe(2);
      expect(asg.min_size).toBe(2);
      expect(asg.max_size).toBe(4);
      expect(asg.vpc_zone_identifier?.length).toBeGreaterThanOrEqual(2);
    });

    test('Scaling policies exist', () => {
      expect(tfConfig.resource?.aws_autoscaling_policy?.scale_out).toBeDefined();
      expect(tfConfig.resource?.aws_autoscaling_policy?.scale_in).toBeDefined();
    });
  });

  describe('Output Validation', () => {
    test('All required outputs are defined', () => {
      const definedOutputs = Object.keys(tfConfig.output || {});
      REQUIRED_OUTPUTS.forEach(outputName => {
        expect(definedOutputs).toContain(outputName);
      });
    });

    test('Outputs have descriptions', () => {
      Object.values(tfConfig.output || {}).forEach((output: any) => {
        expect(output.description).toBeDefined();
        expect(output.description.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Tagging Standards', () => {
    test('Common tags are applied to all resources', () => {
      const resourcesWithTags = Object.entries(tfConfig.resource || {})
        .flatMap(([type, resources]: [string, any]) => 
          Object.entries(resources).map(([name, config]: [string, any]) => ({ type, name, config }))
        )
        .filter(({ config }) => config.tags);
      
      resourcesWithTags.forEach(({ type, name, config }) => {
        expect(config.tags?.Project).toBeDefined();
        expect(config.tags?.Environment).toBeDefined();
        expect(config.tags?.ManagedBy).toBe('Terraform');
      });
    });
  });
});
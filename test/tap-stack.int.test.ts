import { App, Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

describe('AWS Multi-Environment Network Infrastructure Integration Tests', () => {
  
  // Helper function to create a stack for testing
  const createStack = (environment: string) => {
    const app = new App();
    const stack = new TapStack(app, `TestTapStack${environment.charAt(0).toUpperCase() + environment.slice(1)}`, { 
      environmentSuffix: environment 
    });
    return { app, stack, synthesized: Testing.synth(stack), template: JSON.parse(Testing.synth(stack)) };
  };

  describe('Multi-Environment VPC Configuration', () => {
    test('Dev environment should have correct VPC CIDR and subnet counts', () => {
      const { template } = createStack('dev');
      
      // Verify VPC CIDR for dev environment
      const vpc = Object.values(template.resource.aws_vpc)[0] as any;
      expect(vpc.cidr_block).toBe('10.0.0.0/16');
      expect(vpc.enable_dns_hostnames).toBe(true);
      expect(vpc.enable_dns_support).toBe(true);
      expect(vpc.tags.Name).toBe('dev-vpc');
      expect(vpc.tags.Environment).toBe('dev');

      // Verify public subnet count (2 for dev)
      const publicSubnets = Object.keys(template.resource.aws_subnet).filter(key => 
        key.includes('public-subnet')
      );
      expect(publicSubnets).toHaveLength(2);

      // Verify private subnet count (4 for dev)
      const privateSubnets = Object.keys(template.resource.aws_subnet).filter(key => 
        key.includes('private-subnet')
      );
      expect(privateSubnets).toHaveLength(4);

      // Verify single NAT Gateway for dev (cost optimization)
      const natGateways = Object.keys(template.resource.aws_nat_gateway);
      expect(natGateways).toHaveLength(1);
    });

    test('Staging environment should have correct VPC CIDR and subnet counts', () => {
      const { template } = createStack('staging');
      
      // Verify VPC CIDR for staging environment
      const vpc = Object.values(template.resource.aws_vpc)[0] as any;
      expect(vpc.cidr_block).toBe('172.16.0.0/16');
      expect(vpc.tags.Name).toBe('staging-vpc');
      expect(vpc.tags.Environment).toBe('staging');

      // Verify public subnet count (2 for staging)
      const publicSubnets = Object.keys(template.resource.aws_subnet).filter(key => 
        key.includes('public-subnet')
      );
      expect(publicSubnets).toHaveLength(2);

      // Verify private subnet count (4 for staging)
      const privateSubnets = Object.keys(template.resource.aws_subnet).filter(key => 
        key.includes('private-subnet')
      );
      expect(privateSubnets).toHaveLength(4);

      // Verify dual NAT Gateways for staging (improved availability)
      const natGateways = Object.keys(template.resource.aws_nat_gateway);
      expect(natGateways).toHaveLength(2);
    });

    test('Production environment should have correct VPC CIDR and subnet counts', () => {
      const { template } = createStack('prod');
      
      // Verify VPC CIDR for production environment
      const vpc = Object.values(template.resource.aws_vpc)[0] as any;
      expect(vpc.cidr_block).toBe('192.168.0.0/16');
      expect(vpc.tags.Name).toBe('prod-vpc');
      expect(vpc.tags.Environment).toBe('prod');

      // Verify public subnet count (3 for prod)
      const publicSubnets = Object.keys(template.resource.aws_subnet).filter(key => 
        key.includes('public-subnet')
      );
      expect(publicSubnets).toHaveLength(3);

      // Verify private subnet count (6 for prod)
      const privateSubnets = Object.keys(template.resource.aws_subnet).filter(key => 
        key.includes('private-subnet')
      );
      expect(privateSubnets).toHaveLength(6);

      // Verify NAT Gateway per AZ for prod (high availability)
      const natGateways = Object.keys(template.resource.aws_nat_gateway);
      expect(natGateways).toHaveLength(3);
    });
  });

  describe('Network Infrastructure Components', () => {
    test('Internet Gateway should be properly configured', () => {
      const { template } = createStack('dev');
      
      const igw = Object.values(template.resource.aws_internet_gateway)[0] as any;
      expect(igw.vpc_id).toBeDefined();
      expect(igw.tags.Name).toBe('dev-igw');
      expect(igw.tags.Type).toBe('internet-gateway');
    });

    test('Public subnets should have proper configuration', () => {
      const { template } = createStack('dev');
      
      const publicSubnets = Object.values(template.resource.aws_subnet).filter((subnet: any) => 
        subnet.tags?.Tier === 'public'
      );

      publicSubnets.forEach((subnet: any, index: number) => {
        expect(subnet.vpc_id).toBeDefined();
        expect(subnet.map_public_ip_on_launch).toBe(true);
        expect(subnet.availability_zone).toBeDefined();
        expect(subnet.tags.Name).toBe(`dev-public-subnet-${index + 1}`);
        expect(subnet.tags.Type).toBe('public-subnet');
        expect(subnet.tags.Tier).toBe('public');
      });
    });

    test('Private subnets should have proper configuration', () => {
      const { template } = createStack('dev');
      
      const privateSubnets = Object.values(template.resource.aws_subnet).filter((subnet: any) => 
        subnet.tags?.Tier === 'private'
      );

      privateSubnets.forEach((subnet: any, index: number) => {
        expect(subnet.vpc_id).toBeDefined();
        expect(subnet.map_public_ip_on_launch).toBeUndefined(); // Should not be set for private subnets
        expect(subnet.availability_zone).toBeDefined();
        expect(subnet.tags.Name).toBe(`dev-private-subnet-${index + 1}`);
        expect(subnet.tags.Type).toBe('private-subnet');
        expect(subnet.tags.Tier).toBe('private');
      });
    });

    test('NAT Gateways should be properly configured with Elastic IPs', () => {
      const { template } = createStack('dev');
      
      const natGateways = Object.values(template.resource.aws_nat_gateway);
      const eips = Object.values(template.resource.aws_eip);

      expect(natGateways).toHaveLength(1); // Dev environment has 1 NAT Gateway
      expect(eips).toHaveLength(1); // Should have 1 EIP for 1 NAT Gateway

      natGateways.forEach((natGw: any, index: number) => {
        expect(natGw.allocation_id).toBeDefined();
        expect(natGw.subnet_id).toBeDefined();
        expect(natGw.tags.Name).toBe(`dev-nat-gateway-${index + 1}`);
        expect(natGw.tags.Type).toBe('nat-gateway');
      });

      eips.forEach((eip: any, index: number) => {
        expect(eip.domain).toBe('vpc');
        expect(eip.tags.Name).toBe(`dev-nat-eip-${index + 1}`);
        expect(eip.tags.Type).toBe('elastic-ip');
      });
    });
  });

  describe('Security Configuration', () => {
    test('Security Groups should be properly configured', () => {
      const { template } = createStack('dev');
      
      const securityGroups = Object.values(template.resource.aws_security_group);
      expect(securityGroups).toHaveLength(2); // Web and Database security groups

      // Check web security group
      const webSg = securityGroups.find((sg: any) => sg.name === 'dev-web-sg') as any;
      expect(webSg).toBeDefined();
      expect(webSg.description).toBe('Security group for web tier');
      expect(webSg.ingress).toHaveLength(2); // HTTP and HTTPS
      expect(webSg.ingress[0].from_port).toBe(80);
      expect(webSg.ingress[0].to_port).toBe(80);
      expect(webSg.ingress[0].protocol).toBe('tcp');
      expect(webSg.ingress[1].from_port).toBe(443);
      expect(webSg.ingress[1].to_port).toBe(443);
      expect(webSg.tags.Tier).toBe('web');

      // Check database security group
      const dbSg = securityGroups.find((sg: any) => sg.name === 'dev-database-sg') as any;
      expect(dbSg).toBeDefined();
      expect(dbSg.description).toBe('Security group for database tier');
      expect(dbSg.ingress).toHaveLength(1); // MySQL port
      expect(dbSg.ingress[0].from_port).toBe(3306);
      expect(dbSg.ingress[0].to_port).toBe(3306);
      expect(dbSg.tags.Tier).toBe('database');
    });

    test('Network ACLs should be configured with proper rules', () => {
      const { template } = createStack('dev');
      
      const networkAcls = Object.values(template.resource.aws_network_acl);
      const networkAclRules = Object.values(template.resource.aws_network_acl_rule);

      expect(networkAcls).toHaveLength(1);
      expect(networkAclRules).toHaveLength(3); // HTTP ingress, HTTPS ingress, All egress

      const httpRule = networkAclRules.find((rule: any) => rule.from_port === 80) as any;
      expect(httpRule).toBeDefined();
      expect(httpRule.rule_number).toBe(100);
      expect(httpRule.protocol).toBe('tcp');
      expect(httpRule.rule_action).toBe('allow');

      const httpsRule = networkAclRules.find((rule: any) => rule.from_port === 443) as any;
      expect(httpsRule).toBeDefined();
      expect(httpsRule.rule_number).toBe(110);
      expect(httpsRule.protocol).toBe('tcp');
      expect(httpsRule.rule_action).toBe('allow');

      const egressRule = networkAclRules.find((rule: any) => rule.egress === true) as any;
      expect(egressRule).toBeDefined();
      expect(egressRule.protocol).toBe('-1');
      expect(egressRule.rule_action).toBe('allow');
    });
  });

  describe('VPC Endpoints and Monitoring', () => {
    test('VPC Endpoints should be configured for AWS services', () => {
      const { template } = createStack('dev');
      
      const vpcEndpoints = Object.values(template.resource.aws_vpc_endpoint);
      expect(vpcEndpoints).toHaveLength(2); // S3 and DynamoDB

      const s3Endpoint = vpcEndpoints.find((endpoint: any) => 
        endpoint.service_name.includes('s3')
      ) as any;
      expect(s3Endpoint).toBeDefined();
      expect(s3Endpoint.vpc_endpoint_type).toBe('Gateway');
      expect(s3Endpoint.tags.Name).toBe('dev-s3-endpoint');

      const dynamoEndpoint = vpcEndpoints.find((endpoint: any) => 
        endpoint.service_name.includes('dynamodb')
      ) as any;
      expect(dynamoEndpoint).toBeDefined();
      expect(dynamoEndpoint.vpc_endpoint_type).toBe('Gateway');
      expect(dynamoEndpoint.tags.Name).toBe('dev-dynamodb-endpoint');
    });

    test('VPC Flow Logs should be configured with CloudWatch integration', () => {
      const { template } = createStack('dev');
      
      const flowLogs = Object.values(template.resource.aws_flow_log);
      const logGroups = Object.values(template.resource.aws_cloudwatch_log_group);
      const iamRoles = Object.values(template.resource.aws_iam_role);

      expect(flowLogs).toHaveLength(1);
      expect(logGroups).toHaveLength(1);
      expect(iamRoles).toHaveLength(1);

      const flowLog = flowLogs[0] as any;
      expect(flowLog.vpc_id).toBeDefined();
      expect(flowLog.traffic_type).toBe('ALL');
      expect(flowLog.tags.Name).toBe('dev-vpc-flow-logs');

      const logGroup = logGroups[0] as any;
      expect(logGroup.name).toBe('/aws/vpc/flowlogs/dev');
      expect(logGroup.retention_in_days).toBe(14);

      const iamRole = iamRoles[0] as any;
      expect(iamRole.name).toBe('dev-vpc-flow-logs-role');
    });
  });

  describe('Route Tables and Associations', () => {
    test('Route tables should be properly configured for public and private subnets', () => {
      const { template } = createStack('dev');
      
      const routeTables = Object.values(template.resource.aws_route_table);
      const routes = Object.values(template.resource.aws_route);
      const routeAssociations = Object.values(template.resource.aws_route_table_association);

      // Dev environment should have 1 public + 1 private route table
      expect(routeTables).toHaveLength(2);
      expect(routes).toHaveLength(2); // 1 public route to IGW, 1 private route to NAT
      expect(routeAssociations).toHaveLength(6); // 2 public + 4 private subnets

      const publicRoute = routes.find((route: any) => route.gateway_id) as any;
      expect(publicRoute).toBeDefined();
      expect(publicRoute.destination_cidr_block).toBe('0.0.0.0/0');

      const privateRoute = routes.find((route: any) => route.nat_gateway_id) as any;
      expect(privateRoute).toBeDefined();
      expect(privateRoute.destination_cidr_block).toBe('0.0.0.0/0');
    });
  });

  describe('Resource Tagging Strategy', () => {
    test('All resources should have proper tags for management', () => {
      const { template } = createStack('dev');
      
      // Check VPC tags
      const vpc = Object.values(template.resource.aws_vpc)[0] as any;
      expect(vpc.tags.Name).toBe('dev-vpc');
      expect(vpc.tags.Environment).toBe('dev');
      expect(vpc.tags.Type).toBe('vpc');

      // Check subnet tags
      const subnets = Object.values(template.resource.aws_subnet);
      subnets.forEach((subnet: any) => {
        expect(subnet.tags.Environment).toBe('dev');
        expect(subnet.tags.Type).toMatch(/subnet/);
        expect(subnet.tags.Tier).toMatch(/public|private/);
      });

      // Check security group tags
      const securityGroups = Object.values(template.resource.aws_security_group);
      securityGroups.forEach((sg: any) => {
        expect(sg.tags.Environment).toBe('dev');
        expect(sg.tags.Type).toBe('security-group');
        expect(sg.tags.Tier).toMatch(/web|database/);
      });
    });
  });

  describe('High Availability Requirements', () => {
    test('Production environment should demonstrate high availability configuration', () => {
      const { template } = createStack('prod');
      
      // Production should have 3 NAT Gateways (one per AZ)
      const natGateways = Object.keys(template.resource.aws_nat_gateway);
      expect(natGateways).toHaveLength(3);

      // Production should have 3 public subnets across AZs
      const publicSubnets = Object.values(template.resource.aws_subnet).filter((subnet: any) => 
        subnet.tags?.Tier === 'public'
      );
      expect(publicSubnets).toHaveLength(3);

      // Production should have 6 private subnets across AZs
      const privateSubnets = Object.values(template.resource.aws_subnet).filter((subnet: any) => 
        subnet.tags?.Tier === 'private'
      );
      expect(privateSubnets).toHaveLength(6);

      // Verify proper distribution across availability zones
      publicSubnets.forEach((subnet: any) => {
        expect(subnet.availability_zone).toBeDefined();
      });
    });
  });

  describe('Infrastructure Outputs', () => {
    test('Stack should produce necessary outputs for integration', () => {
      const { template } = createStack('dev');
      
      const outputs = template.output;
      expect(outputs).toBeDefined();
      
      expect(outputs['dev-vpc-id']).toBeDefined();
      expect(outputs['dev-vpc-id'].description).toBe('VPC ID');
      
      expect(outputs['dev-vpc-cidr']).toBeDefined();
      expect(outputs['dev-vpc-cidr'].description).toBe('VPC CIDR block');
      
      expect(outputs['dev-public-subnet-ids']).toBeDefined();
      expect(outputs['dev-public-subnet-ids'].description).toBe('Public subnet IDs');
      
      expect(outputs['dev-private-subnet-ids']).toBeDefined();
      expect(outputs['dev-private-subnet-ids'].description).toBe('Private subnet IDs');
      
      expect(outputs['dev-nat-gateway-ids']).toBeDefined();
      expect(outputs['dev-nat-gateway-ids'].description).toBe('NAT Gateway IDs');
    });
  });
});
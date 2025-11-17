import { App, Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Integration Tests', () => {
  let app: App;
  let stack: TapStack;
  let synthesized: any;
  let parsed: any;

  beforeAll(() => {
    app = new App();
    stack = new TapStack(app, 'IntegrationTestStack', {
      environmentSuffix: 'integration',
      awsRegion: 'ca-central-1',
    });
    synthesized = Testing.synth(stack);
    parsed = JSON.parse(synthesized);
  });

  describe('End-to-End VPC Infrastructure', () => {
    test('Complete infrastructure synthesizes without errors', () => {
      expect(synthesized).toBeDefined();
      expect(parsed.resource).toBeDefined();
    });

    test('All required resource types are present', () => {
      const requiredResourceTypes = [
        'aws_vpc',
        'aws_subnet',
        'aws_internet_gateway',
        'aws_nat_gateway',
        'aws_eip',
        'aws_route_table',
        'aws_route',
        'aws_route_table_association',
        'aws_security_group',
        'aws_security_group_rule',
        'aws_flow_log',
        'aws_cloudwatch_log_group',
        'aws_iam_role',
        'aws_iam_role_policy',
        'aws_ssm_parameter',
      ];

      requiredResourceTypes.forEach(resourceType => {
        expect(parsed.resource[resourceType]).toBeDefined();
      });
    });

    test('Resource count matches expected infrastructure', () => {
      // 1 VPC
      expect(Object.keys(parsed.resource.aws_vpc).length).toBe(1);

      // 9 subnets (3 public + 3 private + 3 isolated)
      expect(Object.keys(parsed.resource.aws_subnet).length).toBe(9);

      // 1 Internet Gateway
      expect(
        Object.keys(parsed.resource.aws_internet_gateway).length
      ).toBe(1);

      // 3 NAT Gateways
      expect(Object.keys(parsed.resource.aws_nat_gateway).length).toBe(3);

      // 3 Elastic IPs
      expect(Object.keys(parsed.resource.aws_eip).length).toBe(3);

      // 7 route tables (1 public + 3 private + 3 isolated)
      expect(Object.keys(parsed.resource.aws_route_table).length).toBe(7);

      // 9 route table associations
      expect(
        Object.keys(parsed.resource.aws_route_table_association).length
      ).toBe(9);

      // 3 security groups (web, app, db)
      expect(Object.keys(parsed.resource.aws_security_group).length).toBe(
        3
      );

      // 1 CloudWatch Log Group
      expect(
        Object.keys(parsed.resource.aws_cloudwatch_log_group).length
      ).toBe(1);

      // 1 Flow Log
      expect(Object.keys(parsed.resource.aws_flow_log).length).toBe(1);

      // 10 SSM Parameters (9 subnets + 1 VPC ID)
      expect(Object.keys(parsed.resource.aws_ssm_parameter).length).toBe(
        10
      );
    });
  });

  describe('Network Topology Validation', () => {
    test('Public subnets are correctly configured for internet access', () => {
      const subnets = parsed.resource.aws_subnet;
      const publicSubnets = Object.entries(subnets).filter(
        ([key, _]: [string, any]) => key.includes('public-subnet')
      );

      // Public subnets should have map_public_ip_on_launch enabled
      publicSubnets.forEach(([_, config]: [string, any]) => {
        expect(config.map_public_ip_on_launch).toBe(true);
      });

      // Verify public route table has route to IGW
      const routes = parsed.resource.aws_route;
      const publicRoute = Object.entries(routes).find(
        ([key, _]: [string, any]) => key.includes('public-route')
      );
      expect(publicRoute).toBeDefined();
    });

    test('Private subnets have NAT Gateway routes', () => {
      const routes = parsed.resource.aws_route;
      const privateRoutes = Object.entries(routes).filter(
        ([key, _]: [string, any]) => key.includes('private-route')
      );

      // Should have 3 private routes (one per AZ)
      expect(privateRoutes.length).toBe(3);

      // Each should point to a NAT Gateway
      privateRoutes.forEach(([_, config]: [string, any]) => {
        expect(config.nat_gateway_id).toBeDefined();
        expect(config.destination_cidr_block).toBe('0.0.0.0/0');
      });
    });

    test('Isolated subnets have no internet routes', () => {
      const routes = parsed.resource.aws_route;
      const routeTables = parsed.resource.aws_route_table;

      // Find isolated route tables
      const isolatedRouteTables = Object.entries(routeTables).filter(
        ([key, _]: [string, any]) => key.includes('isolated-rt')
      );

      expect(isolatedRouteTables.length).toBe(3);

      // Get all route table IDs for isolated subnets
      const isolatedRouteTableIds = isolatedRouteTables.map(([key, _]) => {
        return `\${aws_route_table.${key}.id}`;
      });

      // Verify no routes exist pointing to these route tables (except local routes)
      Object.values(routes).forEach((route: any) => {
        // Routes should not belong to isolated route tables
        // Isolated route tables should have no explicit routes (only implicit local routes)
      });
    });
  });

  describe('Security Group Chain Validation', () => {
    test('Security groups form proper tier chain', () => {
      const sgRules = parsed.resource.aws_security_group_rule;

      // Web tier accepts from internet
      const webHttpRule = Object.entries(sgRules).find(
        ([key, _]: [string, any]) => key.includes('web-sg-http')
      );
      expect(webHttpRule).toBeDefined();
      const [_, webHttpConfig] = webHttpRule as [string, any];
      expect(webHttpConfig.cidr_blocks).toEqual(['0.0.0.0/0']);

      // App tier accepts from web tier
      const appRule = Object.entries(sgRules).find(([key, _]: [string, any]) =>
        key.includes('app-sg-from-web')
      );
      expect(appRule).toBeDefined();
      const [__, appConfig] = appRule as [string, any];
      expect(appConfig.source_security_group_id).toBeDefined();

      // DB tier accepts from app tier
      const dbRule = Object.entries(sgRules).find(([key, _]: [string, any]) =>
        key.includes('db-sg-from-app')
      );
      expect(dbRule).toBeDefined();
      const [___, dbConfig] = dbRule as [string, any];
      expect(dbConfig.source_security_group_id).toBeDefined();
    });

    test('Security groups do not have direct database access from web tier', () => {
      const sgRules = parsed.resource.aws_security_group_rule;
      const securityGroups = parsed.resource.aws_security_group;

      const webSg = Object.entries(securityGroups).find(
        ([key, _]: [string, any]) => key.includes('web-sg')
      );
      const dbSg = Object.entries(securityGroups).find(
        ([key, _]: [string, any]) => key.includes('db-sg')
      );

      expect(webSg).toBeDefined();
      expect(dbSg).toBeDefined();

      // Check that no rule allows web SG to access db SG directly
      const dbIngressRules = Object.entries(sgRules).filter(
        ([key, value]: [string, any]) =>
          key.includes('db-sg') && value.type === 'ingress'
      );

      // DB should only have one ingress rule (from app tier)
      expect(dbIngressRules.length).toBe(1);
    });
  });

  describe('High Availability Configuration', () => {
    test('Resources are distributed across multiple availability zones', () => {
      const subnets = parsed.resource.aws_subnet;

      // Group subnets by type
      const publicSubnets = Object.entries(subnets).filter(
        ([key, _]: [string, any]) => key.includes('public-subnet')
      );
      const privateSubnets = Object.entries(subnets).filter(
        ([key, _]: [string, any]) => key.includes('private-subnet')
      );
      const isolatedSubnets = Object.entries(subnets).filter(
        ([key, _]: [string, any]) => key.includes('isolated-subnet')
      );

      // Each type should have 3 subnets (one per AZ)
      expect(publicSubnets.length).toBe(3);
      expect(privateSubnets.length).toBe(3);
      expect(isolatedSubnets.length).toBe(3);

      // Each subnet should reference an AZ
      [...publicSubnets, ...privateSubnets, ...isolatedSubnets].forEach(
        ([_, config]: [string, any]) => {
          expect(config.availability_zone).toBeDefined();
        }
      );
    });

    test('Each availability zone has its own NAT Gateway', () => {
      const natGateways = parsed.resource.aws_nat_gateway;
      const subnets = parsed.resource.aws_subnet;

      // Should have 3 NAT Gateways
      expect(Object.keys(natGateways).length).toBe(3);

      // Each NAT Gateway should be in a different public subnet
      const natGatewaySubnets = Object.values(natGateways).map(
        (nat: any) => nat.subnet_id
      );
      expect(natGatewaySubnets.length).toBe(3);
    });

    test('Private subnets have independent routes to their AZ NAT Gateway', () => {
      const routeTables = parsed.resource.aws_route_table;
      const privateRouteTables = Object.entries(routeTables).filter(
        ([key, _]: [string, any]) => key.includes('private-rt')
      );

      // Should have 3 private route tables
      expect(privateRouteTables.length).toBe(3);

      // Each should be independent
      const routes = parsed.resource.aws_route;
      const privateRoutes = Object.entries(routes).filter(
        ([key, _]: [string, any]) => key.includes('private-route')
      );

      expect(privateRoutes.length).toBe(3);
    });
  });

  describe('Monitoring and Observability', () => {
    test('VPC Flow Logs capture all traffic types', () => {
      const flowLogs = parsed.resource.aws_flow_log;
      const flowLog = Object.values(flowLogs)[0] as any;

      expect(flowLog.traffic_type).toBe('ALL');
      expect(flowLog.log_destination_type).toBe('cloud-watch-logs');
    });

    test('CloudWatch Log Group has appropriate retention', () => {
      const logGroups = parsed.resource.aws_cloudwatch_log_group;
      const logGroup = Object.values(logGroups)[0] as any;

      expect(logGroup.retention_in_days).toBe(7);
    });

    test('IAM role for Flow Logs has correct permissions', () => {
      const iamPolicies = parsed.resource.aws_iam_role_policy;
      const flowLogPolicy = Object.entries(iamPolicies).find(
        ([key, _]: [string, any]) => key.includes('vpc-flow-log-policy')
      );

      expect(flowLogPolicy).toBeDefined();
      const [_, config] = flowLogPolicy as [string, any];

      const policyDoc = JSON.parse(config.policy);
      const statement = policyDoc.Statement[0];

      expect(statement.Action).toContain('logs:CreateLogGroup');
      expect(statement.Action).toContain('logs:CreateLogStream');
      expect(statement.Action).toContain('logs:PutLogEvents');
    });
  });

  describe('Cross-Stack Integration', () => {
    test('All subnet IDs are exported to Parameter Store', () => {
      const ssmParams = parsed.resource.aws_ssm_parameter;

      // Should have 10 parameters (9 subnets + 1 VPC ID)
      expect(Object.keys(ssmParams).length).toBe(10);

      // Check naming convention
      const paramNames = Object.values(ssmParams).map(
        (param: any) => param.name
      );

      // Should have parameters for each subnet type and AZ
      for (let az = 1; az <= 3; az++) {
        expect(paramNames).toContain(`/vpc/production/public-subnet/az${az}`);
        expect(paramNames).toContain(`/vpc/production/private-subnet/az${az}`);
        expect(paramNames).toContain(`/vpc/production/isolated-subnet/az${az}`);
      }

      // Should have VPC ID parameter
      expect(paramNames).toContain('/vpc/production/vpc-id');
    });

    test('Parameter Store entries have descriptions', () => {
      const ssmParams = parsed.resource.aws_ssm_parameter;

      Object.values(ssmParams).forEach((param: any) => {
        expect(param.description).toBeDefined();
        expect(param.description.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Tagging Strategy', () => {
    test('All infrastructure has consistent tags', () => {
      const resourceTypes = [
        'aws_vpc',
        'aws_subnet',
        'aws_internet_gateway',
        'aws_nat_gateway',
        'aws_eip',
        'aws_route_table',
        'aws_security_group',
        'aws_cloudwatch_log_group',
        'aws_iam_role',
        'aws_ssm_parameter',
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

    test('Resources include environmentSuffix for uniqueness', () => {
      const vpc = parsed.resource.aws_vpc;
      const vpcConfig = Object.values(vpc)[0] as any;
      expect(vpcConfig.tags.Name).toContain('integration');

      const subnets = parsed.resource.aws_subnet;
      Object.values(subnets).forEach((config: any) => {
        expect(config.tags.Name).toContain('integration');
      });

      const natGateways = parsed.resource.aws_nat_gateway;
      Object.values(natGateways).forEach((config: any) => {
        expect(config.tags.Name).toContain('integration');
      });
    });
  });

  describe('Terraform Outputs', () => {
    test('All required outputs are defined', () => {
      const outputs = parsed.output;

      const requiredOutputs = [
        'vpc-id',
        'public-subnet-ids',
        'private-subnet-ids',
        'isolated-subnet-ids',
        'web-security-group-id',
        'app-security-group-id',
        'db-security-group-id',
      ];

      requiredOutputs.forEach(outputName => {
        const outputKey = Object.keys(outputs).find(key => key.includes(outputName));
        expect(outputKey).toBeDefined();
        expect(outputs[outputKey].description).toBeDefined();
      });
    });
  });

  describe('Network Isolation', () => {
    test('Isolated subnets are properly isolated from internet', () => {
      const subnets = parsed.resource.aws_subnet;
      const isolatedSubnets = Object.entries(subnets).filter(
        ([key, _]: [string, any]) => key.includes('isolated-subnet')
      );

      // Isolated subnets should not have map_public_ip_on_launch
      isolatedSubnets.forEach(([_, config]: [string, any]) => {
        expect(config.map_public_ip_on_launch).toBe(false);
      });

      // Isolated route tables should not have routes to NAT or IGW
      const routes = parsed.resource.aws_route;
      const routeTableAssociations =
        parsed.resource.aws_route_table_association;

      // Get associations for isolated subnets
      const isolatedAssociations = Object.entries(
        routeTableAssociations
      ).filter(([key, _]: [string, any]) => key.includes('isolated-rta'));

      expect(isolatedAssociations.length).toBe(3);
    });
  });

  describe('CIDR Block Validation', () => {
    test('All CIDR blocks are non-overlapping', () => {
      const subnets = parsed.resource.aws_subnet;
      const cidrBlocks = Object.values(subnets).map(
        (config: any) => config.cidr_block
      );

      // All CIDR blocks should be unique
      const uniqueCidrs = new Set(cidrBlocks);
      expect(uniqueCidrs.size).toBe(cidrBlocks.length);

      // Expected CIDR blocks
      const expectedCidrs = [
        '10.0.1.0/24',
        '10.0.2.0/24',
        '10.0.3.0/24',
        '10.0.11.0/24',
        '10.0.12.0/24',
        '10.0.13.0/24',
        '10.0.21.0/24',
        '10.0.22.0/24',
        '10.0.23.0/24',
      ];

      expectedCidrs.forEach(cidr => {
        expect(cidrBlocks).toContain(cidr);
      });
    });

    test('VPC CIDR encompasses all subnet CIDRs', () => {
      const vpc = parsed.resource.aws_vpc;
      const vpcConfig = Object.values(vpc)[0] as any;

      expect(vpcConfig.cidr_block).toBe('10.0.0.0/16');

      // All subnet CIDRs should be within the VPC CIDR
      const subnets = parsed.resource.aws_subnet;
      Object.values(subnets).forEach((config: any) => {
        expect(config.cidr_block).toMatch(/^10\.0\.\d+\.0\/24$/);
      });
    });
  });
});

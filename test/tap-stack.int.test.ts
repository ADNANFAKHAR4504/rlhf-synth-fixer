// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
import * as yaml from 'js-yaml';
import path from 'path';

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('Turn Around Prompt API Integration Tests', () => {
  describe('Write Integration TESTS', () => {
    test('Template should be ready for deployment', async () => {
      // This is a placeholder - replace with actual integration test
      expect(true).toBe(true);
    });
  });
});

describe('TapStack.yml Integration Tests', () => {
  let template: any;

  beforeAll(() => {
    // Reading YAML template directly
    const templatePath = path.join(__dirname, '../lib/TapStack.yml');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = yaml.load(templateContent);
  });

  test('All resources are defined', () => {
    const resources = template.Resources;
    expect(Object.keys(resources).length).toBeGreaterThan(0);
  });

  test('Dependencies are correctly defined', () => {
    const vpcGatewayAttachment = template.Resources.VPCGatewayAttachment;
    const publicRoute = template.Resources.PublicRoute;

    expect(vpcGatewayAttachment).toBeDefined();
    expect(vpcGatewayAttachment.DependsOn).toBe('InternetGateway');

    expect(publicRoute).toBeDefined();
    expect(publicRoute.DependsOn).toBe('VPCGatewayAttachment');
  });

  test('Subnets are associated with correct route tables', () => {
    const publicSubnet1Association =
      template.Resources.PublicSubnet1RouteTableAssociation;
    const privateSubnet1Association =
      template.Resources.PrivateSubnet1RouteTableAssociation;

    expect(publicSubnet1Association).toBeDefined();
    expect(publicSubnet1Association.Properties.RouteTableId).toEqual({
      Ref: 'PublicRouteTable',
    });

    expect(privateSubnet1Association).toBeDefined();
    expect(privateSubnet1Association.Properties.RouteTableId).toEqual({
      Ref: 'PrivateRouteTable',
    });
  });

  test('Security group properly restricts SSH access', () => {
    const securityGroup = template.Resources.PublicSecurityGroup;
    expect(securityGroup).toBeDefined();

    const sshRule = securityGroup.Properties.SecurityGroupIngress.find(
      (rule: any) => rule.FromPort === 22
    );
    expect(sshRule).toBeDefined();
    expect(sshRule.CidrIp).not.toBe('0.0.0.0/0'); // Should not allow global SSH access
    expect(sshRule.CidrIp).toBe('10.0.0.0/8'); // Should be restricted
  });
});

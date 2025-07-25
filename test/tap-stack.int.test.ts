// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
import path from 'path';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('Turn Around Prompt API Integration Tests', () => {
  describe('Write Integration TESTS', () => {
    test('Dont forget!', async () => {
      expect(false).toBe(true);
    });
  });
});

describe('TapStack.yml Integration Tests', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
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
    expect(publicSubnet1Association.Properties.RouteTableId).toBe(
      '!Ref PublicRouteTable'
    );

    expect(privateSubnet1Association).toBeDefined();
    expect(privateSubnet1Association.Properties.RouteTableId).toBe(
      '!Ref PrivateRouteTable'
    );
  });
});

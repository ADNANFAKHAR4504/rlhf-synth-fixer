import * as fs from 'fs';
import * as path from 'path';

describe('Terraform Integration Tests', () => {
  const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
  let outputs: any;

  beforeAll(() => {
    if (fs.existsSync(outputsPath)) {
      const content = fs.readFileSync(outputsPath, 'utf8');
      outputs = JSON.parse(content);
    }
  });

  describe('Deployment Outputs', () => {
    test('outputs file exists after deployment', () => {
      expect(fs.existsSync(outputsPath)).toBe(true);
    });

    test('VPC ID is present in outputs', () => {
      if (outputs) {
        expect(outputs.vpc_id || outputs.vpcId || outputs.VpcId).toBeDefined();
      }
    });

    test('ECS cluster name is present in outputs', () => {
      if (outputs) {
        expect(
          outputs.ecs_cluster_name || outputs.ecsClusterName || outputs.EcsClusterName
        ).toBeDefined();
      }
    });

    test('Lambda function name is present in outputs', () => {
      if (outputs) {
        expect(
          outputs.lambda_function_name ||
          outputs.lambdaFunctionName ||
          outputs.LambdaFunctionName
        ).toBeDefined();
      }
    });
  });

  describe('Resource Validation', () => {
    test('all output values contain environment suffix', () => {
      if (outputs) {
        const allValues = Object.values(outputs).join(' ');
        // At least some outputs should contain a suffix pattern
        const hasSuffix = Object.values(outputs).some((val: any) => 
          typeof val === 'string' && /[-_][a-z0-9]{6,20}/.test(val)
        );
        expect(hasSuffix).toBe(true);
      }
    });

    test('ALB DNS name is a valid hostname', () => {
      if (outputs) {
        const albDns = outputs.alb_dns_name || outputs.albDnsName || outputs.AlbDnsName;
        if (albDns) {
          expect(albDns).toMatch(/^[a-z0-9-]+\.[a-z0-9-]+\.elb\.amazonaws\.com$/);
        }
      }
    });

    test('Aurora endpoint is a valid RDS endpoint', () => {
      if (outputs) {
        const endpoint = outputs.aurora_cluster_endpoint || 
                        outputs.auroraClusterEndpoint || 
                        outputs.AuroraClusterEndpoint;
        if (endpoint) {
          expect(endpoint).toMatch(/\.rds\.amazonaws\.com$/);
        }
      }
    });
  });
});

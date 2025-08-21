import * as fs from 'fs';
import * as path from 'path';

describe('Terraform High Availability Web App E2E Deployment Outputs', () => {
  let outputs: Record<string, any>;
  beforeAll(() => {
    // Load outputs from artifact or file
    const outPath = path.join(__dirname, '../cfn-outputs.json');
    outputs = JSON.parse(fs.readFileSync(outPath, 'utf8'));
  });

  it('should include all expected output keys', () => {
    const expectedKeys = [
      'autoscaling_group_name',
      'availability_zones',
      'elb_security_group_id',
      'load_balancer_dns_name',
      'load_balancer_zone_id',
      'private_subnet_ids',
      'public_subnet_ids',
      'sns_topic_arn',
      'vpc_id',
      'web_servers_security_group_id',
    ];
    expectedKeys.forEach(key => {
      expect(outputs).toHaveProperty(key);
      expect(outputs[key]).toBeDefined();
      expect(outputs[key]).toHaveProperty('value');
    });
  });

  it('should have valid formats for IDs and ARNs', () => {
    expect(outputs['vpc_id'].value).toMatch(/^vpc-[a-z0-9]+$/);
    expect(outputs['elb_security_group_id'].value).toMatch(/^sg-[a-z0-9]+$/);
    expect(outputs['web_servers_security_group_id'].value).toMatch(/^sg-[a-z0-9]+$/);
    expect(outputs['sns_topic_arn'].value).toMatch(/^arn:aws:sns:us-east-1:/);
    (outputs['public_subnet_ids'].value as string[]).forEach(id => {
      expect(id).toMatch(/^subnet-[a-z0-9]+$/);
    });
    (outputs['private_subnet_ids'].value as string[]).forEach(id => {
      expect(id).toMatch(/^subnet-[a-z0-9]+$/);
    });
  });

  it('should have correct values for environment and region', () => {
    expect(outputs['autoscaling_group_name'].value).toContain('-dev');
    expect(outputs['load_balancer_dns_name'].value).toMatch(/\.us-east-1\.elb\.amazonaws\.com$/);
    expect(outputs['availability_zones'].value).toEqual(
      expect.arrayContaining(['us-east-1a', 'us-east-1b'])
    );
  });

  it('should expose a reachable DNS for the load balancer', () => {
    expect(outputs['load_balancer_dns_name'].value).toMatch(/^ha-web-app-alb-dev-[a-z0-9\-]+\.us-east-1\.elb\.amazonaws\.com$/);
  });

  // Additional E2E checks can be added here as needed.
});
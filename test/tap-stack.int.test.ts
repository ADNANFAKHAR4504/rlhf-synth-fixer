import { App, Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Integration Tests', () => {
  let app: App;
  let stack: TapStack;
  let synth: any;

  beforeAll(() => {
    app = new App();
    stack = new TapStack(app, 'IntegrationTestStack');
    synth = Testing.synth(stack);
  });

  test('Synth contains all key outputs from VPC and S3', () => {
    const outputKeys = Object.keys(synth.output);

    expect(outputKeys).toEqual(
      expect.arrayContaining([
        'vpc_id',
        'public_subnet_ids',
        'private_subnet_ids',
        'database_subnet_ids',
        'internet_gateway_id',
        'nat_gateway_ids',
        'bucket_id',
        'bucket_arn',
        'bucket_domain_name',
        'access_logs_bucket_id',
      ])
    );
  });

  test('VPC ID output is a Terraform reference', () => {
    const vpcId = synth.output['vpc_id'].value;
    expect(typeof vpcId).toBe('string');
    expect(vpcId).toMatch(/\${.*}/); // interpolation reference
  });

  test('S3 bucket domain name output contains expected value', () => {
    const domainName = synth.output['bucket_domain_name'].value;
    expect(typeof domainName).toBe('string');
    expect(domainName).toContain('amazonaws.com');
  });

  // Add more output or resource validation as needed
});

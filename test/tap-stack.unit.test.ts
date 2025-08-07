import { App, Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

// Helper: flatten CDKTF synthesized "resource" map into a list of { type, ... }
function getSynthResources(stack: any) {
  const synth = Testing.fullSynth(stack);
  const resourceBlock = synth.resource || {};
  const resources: Array<{ type: string }> = [];
  Object.entries(resourceBlock).forEach(([type, instances]) => {
    Object.keys(instances).forEach(() => {
      resources.push({ type });
    });
  });
  // Debug print for CI: all unique resource types found
  // (You can comment out in production for clean logs)
  // Only prints once per test file (not every test)
  if (resources.length > 0) {
    console.log(
      'Synthesized resource types:',
      Array.from(new Set(resources.map(r => r.type))).sort()
    );
  } else {
    console.log('No resources found in synth!');
  }
  return resources;
}

describe('TapStack (CDKTF Unit Test)', () => {
  let app: App;
  let stack: TapStack;

  beforeAll(() => {
    // Ensure ENV matches deploy for consistent synth
    process.env.AWS_REGION = 'us-west-2';
    process.env.ENVIRONMENT = 'dev';
  });

  beforeEach(() => {
    app = new App();
    stack = new TapStack(app, 'TestStack');
  });

  it('should synth without errors and define the stack', () => {
    expect(stack).toBeDefined();
  });

  it('should synthesize the expected AWS resources', () => {
    const resources = getSynthResources(stack);

    // Helper to match any 'aws_*' type, even if aliased or module'd
    function containsType(keyword: string) {
      return resources.some(r => r.type && r.type.includes(keyword));
    }

    // Print all types found (CI log)
    console.log(
      'All resource types in synth:',
      Array.from(new Set(resources.map(r => r.type))).join(', ')
    );

    expect(containsType('aws_vpc')).toBeTruthy();
    expect(
      resources.filter(r => r.type && r.type.includes('aws_subnet')).length
    ).toBeGreaterThanOrEqual(9);
    expect(containsType('aws_internet_gateway')).toBeTruthy();
    expect(containsType('aws_nat_gateway')).toBeTruthy();
    expect(containsType('aws_flow_log')).toBeTruthy();

    expect(containsType('aws_iam_role')).toBeTruthy();
    expect(containsType('aws_iam_instance_profile')).toBeTruthy();

    expect(containsType('aws_instance')).toBeTruthy();
    expect(containsType('aws_security_group')).toBeTruthy();

    expect(
      resources.filter(r => r.type && r.type.includes('aws_s3_bucket')).length
    ).toBeGreaterThanOrEqual(2);
    expect(
      containsType('aws_s3_bucket_server_side_encryption_configuration')
    ).toBeTruthy();
    expect(containsType('aws_s3_bucket_logging')).toBeTruthy();

    expect(containsType('aws_cloudwatch_dashboard')).toBeTruthy();
    expect(containsType('aws_cloudwatch_metric_alarm')).toBeTruthy();
    expect(containsType('aws_sns_topic')).toBeTruthy();
    expect(containsType('aws_cloudwatch_log_group')).toBeTruthy();
  });
});

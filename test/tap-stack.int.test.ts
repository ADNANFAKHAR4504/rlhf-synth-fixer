// test/tap-stack.int.test.ts

import { App, Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Integration Tests', () => {
  let app: App;
  let stack: TapStack;
  let synthesized: any;

  beforeEach(() => {
    app = new App();
    stack = new TapStack(app, 'TestTapStackInt', {
      awsRegion: 'us-west-2',
      vpcCidr: '10.100.0.0/16',
      allowedIngressCidrBlocks: ['1.2.3.4/32'],
      tags: { Project: 'TestProject', Environment: 'test' },
    });
    synthesized = JSON.parse(Testing.synth(stack));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('Launch Template references the correct Security Group ID', () => {
    // Objective: Verify that the Launch Template is correctly associated with the Security Group.
    const ltResource =
      synthesized.resource.aws_launch_template['launch-template'];

    expect(ltResource).toBeDefined();
    // Corrected the expected string to match the synthesized output exactly
    expect(ltResource.vpc_security_group_ids[0]).toBe(
      `\${aws_security_group.web-sg.id}`
    );
  });

  test('Auto Scaling Group is associated with the private subnets', () => {
    // Objective: Ensure the ASG's VPC zone identifiers correctly reference the private subnets.
    const asgResource = synthesized.resource.aws_autoscaling_group['web-asg'];
    const privateSubnetLogicalIds = Object.keys(
      synthesized.resource.aws_subnet
    ).filter(key => key.startsWith('private-subnet'));

    expect(asgResource.vpc_zone_identifier).toHaveLength(3);
    expect(asgResource.vpc_zone_identifier).toEqual(
      expect.arrayContaining(
        privateSubnetLogicalIds.map(id => `\${aws_subnet.${id}.id}`)
      )
    );
  });

  test('Internet Gateway is attached to the VPC', () => {
    // Objective: Verify the Internet Gateway's VPC ID matches the main VPC's ID.
    const igwResource = synthesized.resource.aws_internet_gateway['igw'];

    expect(igwResource).toBeDefined();
    // Corrected the expected string to match the synthesized output exactly
    expect(igwResource.vpc_id).toBe(`\${aws_vpc.vpc.id}`);
  });

  test('Public subnets are associated with the public route table', () => {
    // Objective: Check that route table associations exist for all public subnets.
    const publicSubnetLogicalIds = Object.keys(
      synthesized.resource.aws_subnet
    ).filter(key => key.startsWith('public-subnet'));
    const rtaResources = Object.values(
      synthesized.resource.aws_route_table_association
    ) as any;

    const associatedSubnetIds = rtaResources.map((rta: any) => rta.subnet_id);

    publicSubnetLogicalIds.forEach(subnetId => {
      expect(associatedSubnetIds).toContain(`\${aws_subnet.${subnetId}.id}`);
    });
  });

  test('IAM policy for S3 references a specific bucket ARN pattern', () => {
    // Objective: Confirm that the IAM policy's resource ARN correctly uses the S3 bucket ARN.
    const s3PolicyResource = synthesized.resource.aws_iam_policy['s3-policy'];
    expect(s3PolicyResource).toBeDefined();

    const policy = JSON.parse(s3PolicyResource.policy);
    expect(policy.Statement[0].Resource[0]).toBe(
      'arn:aws:s3:::my-tap-bucket-*'
    );
  });
});

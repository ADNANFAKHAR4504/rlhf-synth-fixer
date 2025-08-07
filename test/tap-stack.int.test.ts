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

    expect(asgResource).toBeDefined();
    expect(asgResource.vpc_zone_identifier.length).toBe(
      privateSubnetLogicalIds.length
    );
    privateSubnetLogicalIds.forEach(subnetId => {
      expect(asgResource.vpc_zone_identifier).toContain(
        `\${aws_subnet.${subnetId}.id}`
      );
    });
  });

  test('Internet Gateway is attached to the VPC', () => {
    // Objective: Verify the Internet Gateway's VPC ID matches the main VPC's ID.
    const igwResource = synthesized.resource.aws_internet_gateway['igw'];

    expect(igwResource).toBeDefined();
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
    // Fixed: Expect the synthesized token, not a hardcoded string
    expect(policy.Statement[0].Resource).toEqual([
      '${aws_s3_bucket.s3-bucket.arn}',
      '${aws_s3_bucket.s3-bucket.arn}/*',
    ]);
  });

  test('S3 bucket is configured with KMS server-side encryption', () => {
    // Objective: Verify that the S3 bucket has the server-side encryption configuration and references the KMS key.
    const s3BucketResource = synthesized.resource.aws_s3_bucket['s3-bucket'];
    expect(s3BucketResource).toBeDefined();
    expect(s3BucketResource.server_side_encryption_configuration).toBeDefined();
    // Fixed: The assertion was updated to match the corrected JSON structure.
    const encryptionConfig =
      s3BucketResource.server_side_encryption_configuration;
    expect(
      encryptionConfig.rule.apply_server_side_encryption_by_default
        .kms_master_key_id
    ).toBe('${aws_kms_key.s3-kms-key.arn}');
    expect(
      encryptionConfig.rule.apply_server_side_encryption_by_default
        .sse_algorithm
    ).toBe('aws:kms');
  });

  test('CloudWatch alarm for ASG CPU utilization is created', () => {
    // Objective: Verify that the CloudWatch alarm for ASG CPU utilization is created with the correct properties.
    const asgCpuAlarmResource =
      synthesized.resource.aws_cloudwatch_metric_alarm['asg-cpu-alarm'];
    expect(asgCpuAlarmResource).toBeDefined();
    expect(asgCpuAlarmResource.metric_name).toBe('CPUUtilization');
    expect(asgCpuAlarmResource.namespace).toBe('AWS/EC2');
    expect(asgCpuAlarmResource.threshold).toBe(80);
    expect(asgCpuAlarmResource.dimensions.AutoScalingGroupName).toBe(
      '${aws_autoscaling_group.web-asg.name}'
    );
  });

  test('CloudWatch alarms for NAT Gateway port allocation errors are created', () => {
    // Objective: Verify that a CloudWatch alarm is created for each NAT Gateway to monitor port allocation errors.
    const natGatewayAlarmResources = Object.values(
      synthesized.resource.aws_cloudwatch_metric_alarm
    ).filter((resource: any) =>
      resource.alarm_name.includes('nat-gateway-error-alarm')
    );
    const natGatewayResources = Object.values(
      synthesized.resource.aws_nat_gateway
    );

    expect(natGatewayAlarmResources.length).toBe(natGatewayResources.length);
    natGatewayAlarmResources.forEach((alarm: any) => {
      expect(alarm.metric_name).toBe('ErrorPortAllocation');
      expect(alarm.namespace).toBe('AWS/NATGateway');
      expect(alarm.threshold).toBe(1);
    });
  });

  test('CloudWatch dashboard is created with the correct widgets', () => {
    // Objective: Verify that a CloudWatch dashboard is created and contains the expected widgets.
    const dashboardResource =
      synthesized.resource.aws_cloudwatch_dashboard['dashboard'];
    expect(dashboardResource).toBeDefined();
    const dashboardBody = JSON.parse(dashboardResource.dashboard_body);
    expect(dashboardBody.widgets.length).toBe(4); // 1 for CPU + 3 for NAT Gateways
    expect(dashboardBody.widgets[0].properties.title).toBe(
      'ASG CPU Utilization'
    );
    expect(dashboardBody.widgets[1].properties.title).toContain(
      'NAT Gateway 0 Port Allocation Errors'
    );
  });
});

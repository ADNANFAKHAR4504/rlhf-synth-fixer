import { App, Testing, Fn } from 'cdktf';
import { TapStack } from '../lib/tap-stack'; // Adjust path if necessary
import { DataAwsAvailabilityZones } from '@cdktf/provider-aws/lib/data-aws-availability-zones';
import { DataAwsAmi } from '@cdktf/provider-aws/lib/data-aws-ami';

// IMPORTANT: We are intentionally NOT mocking concrete AWS resources (like Vpc, InternetGateway, Subnet,
// NatGateway, Eip, RouteTable, RouteTableAssociation, SecurityGroup, SecurityGroupRule, IamRole, IamPolicy,
// IamRolePolicyAttachment, IamInstanceProfile, Instance) in integration tests.
// This allows CDKTF's Testing.synth() to process them as real constructs
// and generate the actual Terraform JSON, which we then assert against.
// Only mock data sources that fetch external, non-deterministic data.

// Mock DataAwsAvailabilityZones to return predictable AZs for testing
jest.mock('@cdktf/provider-aws/lib/data-aws-availability-zones', () => ({
  DataAwsAvailabilityZones: jest
    .fn()
    .mockImplementation((scope, id, config) => ({
      names: ['us-east-1a', 'us-east-1b', 'us-east-1c'], // Provide exactly 3 AZs
      get id() {
        return `mock-data-aws-availability-zones-id-${id}`;
      }, // Keep getter
      get stringified() {
        return JSON.stringify(this.names);
      },
    })),
}));

// Mock DataAwsAmi to return a predictable AMI ID
jest.mock('@cdktf/provider-aws/lib/data-aws-ami', () => ({
  DataAwsAmi: jest.fn().mockImplementation((scope, id, config) => ({
    get id() {
      return `ami-mocked12345`;
    }, // Keep getter
  })),
}));

describe('TapStack Integration Tests', () => {
  let app: App;
  let stack: TapStack;
  let synthesized: any; // Using 'any' for easier JSON property access

  // beforeEach hook to set up a new App and synthesize the stack for each test
  beforeEach(() => {
    app = new App();
    // Synthesize the stack with default properties for most tests
    // To test the constructs, we need to ensure they are instantiated.
    // For these integration tests, we assume a default full stack setup.
    stack = new TapStack(app, 'TestTapStackInt', {
      createMyStack: true, // This will ensure MyStack is created, which in turn implies other constructs are used
    });
    synthesized = JSON.parse(Testing.synth(stack));

    // Optional: Log synthesized output for debugging
    // console.log(JSON.stringify(synthesized, null, 2));
  });

  // afterEach hook to clean up mocks (though not strictly necessary for simple synthesis tests)
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('synthesizes to valid Terraform JSON', () => {
    // Objective: Ensure the synthesized output is a valid JSON object with core Terraform properties.
    expect(typeof synthesized).toBe('object');
    expect(synthesized).toHaveProperty('provider');
    expect(synthesized).toHaveProperty('terraform');
  });

  test('AWS provider is configured with default region and default tags by default', () => {
    // Objective: Verify that the AWS provider uses 'us-east-1' as the default region
    // and that defaultTags are now always present with the required values.
    expect(synthesized.provider.aws[0].region).toBe('us-east-1');
    // The default_tags will now always contain the required tags
    expect(synthesized.provider.aws[0].default_tags).toEqual([
      {
        tags: {
          Environment: 'Dev',
          Owner: 'Akshat Jain',
          Project: 'MyProject',
        },
      },
    ]);
  });

  test('AWS provider is configured with specified region and default tags', () => {
    // Objective: Verify that the AWS provider's region and default tags are correctly set
    // when provided via props, merging with the required default tags.
    const customTags = {
      Project: 'CustomProject',
      Environment: 'test',
      Owner: 'TestUser',
    };
    const customStack = new TapStack(app, 'TestCustomProvider', {
      awsRegion: 'us-west-2',
      defaultTags: customTags,
    });
    const customSynthesized = JSON.parse(Testing.synth(customStack));

    expect(customSynthesized.provider.aws[0].region).toBe('us-west-2');
    // CDKTF wraps default_tags in an array, so we access the first element
    // The expected tags should be a merge of requiredDefaultTags and customTags
    expect(customSynthesized.provider.aws[0].default_tags[0].tags).toEqual({
      Project: 'CustomProject', // Overridden by customTags
      Environment: 'test', // Overridden by customTags
      Owner: 'TestUser', // Overridden by customTags
    });
  });

  test('S3 backend is configured with default bucket, key, region, and encryption', () => {
    // Objective: Verify that the S3 backend is configured with default properties.
    expect(synthesized.terraform.backend.s3.bucket).toBe('iac-rlhf-tf-states');
    expect(synthesized.terraform.backend.s3.key).toBe(
      'dev/TestTapStackInt.tfstate'
    );
    expect(synthesized.terraform.backend.s3.region).toBe('us-east-1');
    expect(synthesized.terraform.backend.s3.encrypt).toBe(true);
  });

  test('S3 backend uses custom properties when provided', () => {
    // Objective: Verify that the S3 backend uses custom properties when provided via props.
    const customBackendStack = new TapStack(app, 'TestCustomBackend', {
      stateBucket: 'my-custom-state-bucket',
      stateBucketRegion: 'us-west-2',
      environmentSuffix: 'prod',
    });
    const customBackendSynthesized = JSON.parse(
      Testing.synth(customBackendStack)
    );

    expect(customBackendSynthesized.terraform.backend.s3.bucket).toBe(
      'my-custom-state-bucket'
    );
    expect(customBackendSynthesized.terraform.backend.s3.key).toBe(
      'prod/TestCustomBackend.tfstate'
    );
    expect(customBackendSynthesized.terraform.backend.s3.region).toBe(
      'us-west-2'
    );
  });

  test('S3 backend has use_lockfile override set to true', () => {
    // Objective: Verify that the use_lockfile override is always set to true.
    expect(synthesized.terraform.backend.s3.use_lockfile).toBe(true);
  });

  test('MyStack is NOT instantiated by default', () => {
    // Objective: Confirm that MyStack is NOT instantiated when `createMyStack` is false or undefined.
    // Note: For this specific test, we need a stack without createMyStack: true.
    const noMyStackStack = new TapStack(app, 'TestNoMyStackInt', {
      createMyStack: false,
    }); // Explicitly set to false
    const noMyStackSynthesized = JSON.parse(Testing.synth(noMyStackStack));
    if (noMyStackSynthesized.resource) {
      expect(noMyStackSynthesized.resource).not.toHaveProperty('aws_s3_bucket');
    } else {
      expect(noMyStackSynthesized.resource).toBeUndefined(); // If no resources at all, this is also valid
    }
  });

  test('MyStack IS instantiated when createMyStack prop is true', () => {
    // Objective: Confirm that MyStack is instantiated when `createMyStack` is true.
    // This test already implicitly relies on the full stack synthesis in beforeEach.
    const s3BucketResources = synthesized.resource.aws_s3_bucket;
    expect(s3BucketResources).toBeDefined();
    const s3ResourceNames = Object.keys(s3BucketResources);
    expect(s3ResourceNames.length).toBe(1); // Ensure only one S3 bucket
    const s3ResourceName = s3ResourceNames[0];

    const s3BucketResource = s3BucketResources[s3ResourceName];
    expect(s3BucketResource).toBeDefined();
    // The bucket name will be 'test-my-example-bucket' because environmentSuffix defaults to 'dev'
    // in TapStack, and then 'test' in the test case where it's explicitly set.
    // For the beforeEach setup, it's 'dev-my-example-bucket'
    expect(s3BucketResource.bucket).toBe('dev-my-example-bucket');
    expect(s3BucketResource.acl).toBe('private');
    expect(s3BucketResource.force_destroy).toBe(true);
    // Assert the updated tags for MyStack's S3 bucket
    expect(s3BucketResource.tags.Project).toBe('MyProject');
    expect(s3BucketResource.tags.Environment).toBe('dev'); // Default environment suffix
    expect(s3BucketResource.tags.Owner).toBe('Akshat Jain');
  });

  test('MyStack S3 bucket resource is created with correct properties when instantiated', () => {
    // Objective: Dig deeper into the synthesized output to ensure the S3 bucket
    // within MyStack has the expected properties.
    // This test already implicitly relies on the full stack synthesis in beforeEach.
    const s3BucketResources = synthesized.resource.aws_s3_bucket;
    const s3ResourceNames = Object.keys(s3BucketResources);
    expect(s3ResourceNames.length).toBe(1); // Ensure only one S3 bucket
    const s3ResourceName = s3ResourceNames[0];

    const s3BucketResource = s3BucketResources[s3ResourceName];
    expect(s3BucketResource).toBeDefined();
    expect(s3BucketResource.bucket).toBe('dev-my-example-bucket'); // Default environment suffix
    expect(s3BucketResource.acl).toBe('private');
    expect(s3BucketResource.force_destroy).toBe(true);
    expect(s3BucketResource.tags.Project).toBe('MyProject');
    expect(s3BucketResource.tags.Environment).toBe('dev'); // Default environment suffix
    expect(s3BucketResource.tags.Owner).toBe('Akshat Jain');
  });

  // --- New Tests for NetworkingConstruct Integration ---
  test('NetworkingConstruct provisions VPC with correct CIDR and tags', () => {
    // Check for VPC resource
    const vpcResources = synthesized.resource.aws_vpc;
    expect(vpcResources).toBeDefined();
    const vpcName = Object.keys(vpcResources).find(key =>
      key.includes('networking_vpc')
    ) as string; // Cast to string
    const vpc = vpcResources[vpcName];
    expect(vpc.cidr_block).toBe('10.0.0.0/16'); // Default VPC CIDR from main.ts
    expect(vpc.tags.Name).toMatch(/networking-vpc/);
    expect(vpc.tags.Project).toBe('MyProject'); // This tag should be present due to defaultTags on provider
    expect(vpc.tags.Environment).toBe('Dev');
    expect(vpc.tags.Owner).toBe('Akshat Jain');
  });

  test('NetworkingConstruct provisions 3 public and 3 private subnets', () => {
    const subnetResources = synthesized.resource.aws_subnet;
    expect(subnetResources).toBeDefined();

    const publicSubnets = Object.values(subnetResources).filter(
      (s: any) => s.map_public_ip_on_launch === true
    );
    const privateSubnets = Object.values(subnetResources).filter(
      (s: any) =>
        s.map_public_ip_on_launch === false ||
        s.map_public_ip_on_launch === undefined // Undefined means false
    );

    expect(publicSubnets.length).toBe(3);
    expect(privateSubnets.length).toBe(3);

    // Verify public subnets have public IP mapping enabled and correct tags
    publicSubnets.forEach((s: any) => {
      expect(s.map_public_ip_on_launch).toBe(true);
      expect(s.tags.Project).toBe('MyProject');
      expect(s.tags.Environment).toBe('Dev');
    });

    // Verify private subnets have public IP mapping disabled and correct tags
    privateSubnets.forEach((s: any) => {
      expect(s.map_public_ip_on_launch).toBeUndefined(); // map_public_ip_on_launch defaults to false if not set
      expect(s.tags.Project).toBe('MyProject');
      expect(s.tags.Environment).toBe('Dev');
    });
  });

  test('NetworkingConstruct provisions Internet Gateway and NAT Gateway', () => {
    // Check for Internet Gateway
    expect(synthesized.resource.aws_internet_gateway).toBeDefined();
    const igwName = Object.keys(synthesized.resource.aws_internet_gateway)[0];
    const igw = synthesized.resource.aws_internet_gateway[igwName];
    expect(igw.vpc_id).toBeDefined();
    expect(igw.tags.Project).toBe('MyProject');
    expect(igw.tags.Environment).toBe('Dev');

    // Check for NAT Gateway and its EIP
    expect(synthesized.resource.aws_nat_gateway).toBeDefined();
    const natGatewayName = Object.keys(synthesized.resource.aws_nat_gateway)[0];
    const natGateway = synthesized.resource.aws_nat_gateway[natGatewayName];
    expect(natGateway.allocation_id).toBeDefined();
    expect(natGateway.subnet_id).toBeDefined();
    expect(natGateway.tags.Project).toBe('MyProject');
    expect(natGateway.tags.Environment).toBe('Dev');

    expect(synthesized.resource.aws_eip).toBeDefined(); // EIP for NAT Gateway
    const eipName = Object.keys(synthesized.resource.aws_eip).find(key =>
      key.includes('nat_eip')
    ) as string; // Cast to string
    const eip = synthesized.resource.aws_eip[eipName];
    expect(eip.tags.Project).toBe('MyProject');
    expect(eip.tags.Environment).toBe('Dev');
  });

  test('NetworkingConstruct configures route tables and associations correctly', () => {
    const routeTableResources = synthesized.resource.aws_route_table;
    const routeTableAssociationResources =
      synthesized.resource.aws_route_table_association;
    const routeResources = synthesized.resource.aws_route; // Explicit route resources

    expect(routeTableResources).toBeDefined();
    expect(routeTableAssociationResources).toBeDefined();
    expect(routeResources).toBeDefined();

    // Expecting 6 route tables (3 public, 3 private)
    expect(Object.keys(routeTableResources).length).toBe(6);
    // Expecting 6 route table associations (3 public, 3 private)
    expect(Object.keys(routeTableAssociationResources).length).toBe(6);
    // Expecting 6 route entries (3 public, 3 private)
    expect(Object.keys(routeResources).length).toBe(6);

    // Check tags on route tables and associations
    Object.values(routeTableResources).forEach((rt: any) => {
      expect(rt.tags.Project).toBe('MyProject');
      expect(rt.tags.Environment).toBe('Dev');
    });
    Object.values(routeTableAssociationResources).forEach((rta: any) => {
      expect(rta.route_table_id).toBeDefined();
      expect(rta.subnet_id).toBeDefined();
    });

    // Verify routes are correctly associated with gateways
    const publicRoutes = Object.values(routeResources).filter(
      (r: any) => r.gateway_id
    );
    const privateRoutes = Object.values(routeResources).filter(
      (r: any) => r.nat_gateway_id
    );

    expect(publicRoutes.length).toBe(3); // 3 public routes pointing to IGW
    expect(privateRoutes.length).toBe(3); // 3 private routes pointing to NAT GW

    publicRoutes.forEach((r: any) => {
      expect(r.destination_cidr_block).toBe('0.0.0.0/0'); // Changed from cidr_block
      expect(r.gateway_id).toMatch(/\$\{aws_internet_gateway\..*\.id\}/);
    });

    privateRoutes.forEach((r: any) => {
      expect(r.destination_cidr_block).toBe('0.0.0.0/0'); // Changed from cidr_block
      expect(r.nat_gateway_id).toMatch(/\$\{aws_nat_gateway\..*\.id\}/);
    });
  });

  test('SecurityConstruct provisions web security group with correct ingress rules', () => {
    const sgResources = synthesized.resource.aws_security_group;
    expect(sgResources).toBeDefined();
    const webSgName = Object.keys(sgResources).find(key =>
      key.includes('security_web_sg')
    ) as string; // Cast to string
    const webSg = sgResources[webSgName];
    expect(webSg).toBeDefined();
    expect(webSg.description).toBe(
      'Allow HTTP and SSH ingress from specific IP range'
    );
    expect(webSg.vpc_id).toBeDefined(); // Should be linked to a VPC
    expect(webSg.tags.Project).toBe('MyProject');
    expect(webSg.tags.Environment).toBe('Dev');

    // SecurityGroupRule resources are top-level in the synthesized output
    const sgRuleResources = synthesized.resource.aws_security_group_rule;
    expect(sgRuleResources).toBeDefined();

    // Construct the expected security_group_id string dynamically
    // This is the most robust way to match the Terraform reference
    const expectedSgIdRef = `\${aws_security_group.${webSgName}.id}`;

    // Find HTTP ingress rule
    const httpRule = Object.values(sgRuleResources).find(
      (rule: any) =>
        rule.type === 'ingress' &&
        rule.from_port === 80 &&
        rule.to_port === 80 &&
        rule.protocol === 'tcp' &&
        rule.cidr_blocks &&
        rule.cidr_blocks.includes('203.0.113.0/24') &&
        rule.security_group_id === expectedSgIdRef // Direct comparison to the expected reference string
    ) as any; // Cast to any
    expect(httpRule).toBeDefined();
    expect(httpRule.cidr_blocks).toEqual(['203.0.113.0/24']);

    // Find SSH ingress rule
    const sshRule = Object.values(sgRuleResources).find(
      (rule: any) =>
        rule.type === 'ingress' &&
        rule.from_port === 22 &&
        rule.to_port === 22 &&
        rule.protocol === 'tcp' &&
        rule.cidr_blocks &&
        rule.cidr_blocks.includes('203.0.113.0/24') &&
        rule.security_group_id === expectedSgIdRef // Direct comparison to the expected reference string
    ) as any; // Cast to any
    expect(sshRule).toBeDefined();
    expect(sshRule.cidr_blocks).toEqual(['203.0.113.0/24']);
  });

  test('SecurityConstruct provisions web security group with correct egress rules', () => {
    const sgResources = synthesized.resource.aws_security_group;
    const webSgName = Object.keys(sgResources).find(key =>
      key.includes('security_web_sg')
    ) as string; // Cast to string
    const webSg = sgResources[webSgName];

    expect(webSg.egress).toBeDefined();
    expect(webSg.egress.length).toBe(1); // Expecting only one egress rule
    const egressRule = webSg.egress[0];
    expect(egressRule.from_port).toBe(0);
    expect(egressRule.to_port).toBe(0);
    expect(egressRule.protocol).toBe('-1'); // All protocols
    expect(egressRule.cidr_blocks).toEqual(['0.0.0.0/0']); // All outbound traffic
  });

  test('IamConstruct provisions EC2 IAM role and instance profile', () => {
    const iamRoleResources = synthesized.resource.aws_iam_role;
    expect(iamRoleResources).toBeDefined();
    const ec2RoleName = Object.keys(iamRoleResources).find(key =>
      key.includes('iam_ec2_role')
    ) as string; // Cast to string
    const ec2Role = iamRoleResources[ec2RoleName];
    expect(ec2Role).toBeDefined();
    expect(ec2Role.assume_role_policy).toBeDefined();
    expect(
      JSON.parse(ec2Role.assume_role_policy).Statement[0].Principal.Service
    ).toBe('ec2.amazonaws.com');
    expect(ec2Role.tags.Project).toBe('MyProject');
    expect(ec2Role.tags.Environment).toBe('Dev');

    const iamInstanceProfileResources =
      synthesized.resource.aws_iam_instance_profile;
    expect(iamInstanceProfileResources).toBeDefined();
    const instanceProfileName = Object.keys(iamInstanceProfileResources).find(
      key => key.includes('iam_ec2_instance_profile')
    ) as string; // Cast to string
    const instanceProfile = iamInstanceProfileResources[instanceProfileName];
    expect(instanceProfile).toBeDefined();
    // Assert that the role property is a Terraform reference to the IAM role
    expect(instanceProfile.role).toMatch(/\$\{aws_iam_role\..*\.name\}/);
    expect(instanceProfile.tags.Project).toBe('MyProject');
    expect(instanceProfile.tags.Environment).toBe('Dev');
  });

  test('IamConstruct provisions S3 read-only policy and attaches it to EC2 role', () => {
    const iamPolicyResources = synthesized.resource.aws_iam_policy;
    expect(iamPolicyResources).toBeDefined();
    const s3PolicyName = Object.keys(iamPolicyResources).find(key =>
      key.includes('iam_s3_read_only_policy')
    ) as string; // Cast to string
    const s3Policy = iamPolicyResources[s3PolicyName];
    expect(s3Policy).toBeDefined();
    expect(s3Policy.description).toBe(
      'Allows EC2 instances to read from S3 buckets'
    );
    expect(JSON.parse(s3Policy.policy).Statement[0].Action).toEqual([
      's3:GetObject',
      's3:ListBucket',
    ]);
    expect(JSON.parse(s3Policy.policy).Statement[0].Resource).toEqual([
      'arn:aws:s3:::*',
      'arn:aws:s3:::*/*',
    ]);
    expect(s3Policy.tags.Project).toBe('MyProject');
    expect(s3Policy.tags.Environment).toBe('Dev');

    const iamRolePolicyAttachmentResources =
      synthesized.resource.aws_iam_role_policy_attachment;
    expect(iamRolePolicyAttachmentResources).toBeDefined();
    const attachmentName = Object.keys(iamRolePolicyAttachmentResources).find(
      key =>
        // The role property in the attachment will be a Terraform reference string
        (iamRolePolicyAttachmentResources[key].role as string).includes(
          'iam_ec2_role'
        )
    ) as string; // Cast to string
    const attachment = iamRolePolicyAttachmentResources[attachmentName];
    expect(attachment).toBeDefined();
    // Assert that the policy_arn property is a Terraform reference to the IAM policy
    expect(attachment.policy_arn).toMatch(/\$\{aws_iam_policy\..*\.arn\}/);
  });
});

import { Template } from 'aws-cdk-lib/assertions';
import * as fs from 'fs';
import * as path from 'path';

let template: Template;

beforeAll(() => {
  const templatePath = path.join(__dirname, '../lib/TapStack.json');
  const templateContent = fs.readFileSync(templatePath, 'utf8');
  const parsedTemplate = JSON.parse(templateContent);
  template = Template.fromJSON(parsedTemplate);
});

describe('Production Infrastructure Integration Tests', () => {
  const getResourceByType = (type: string) => {
    return Object.entries(template.toJSON().Resources).filter(([, res]) => {
      return typeof res === 'object' && res !== null && (res as any).Type === type;
    }) as [string, any][];
  };

  test('Public subnets have MapPublicIpOnLaunch enabled', () => {
    const subnets = getResourceByType('AWS::EC2::Subnet');
    const publicSubnets = subnets.filter(([logicalId]) => logicalId.includes('PublicSubnet'));
    publicSubnets.forEach(([, subnet]) => {
      expect(subnet.Properties.MapPublicIpOnLaunch).toBe(true);
    });
  });

  test('Private subnets do not have MapPublicIpOnLaunch', () => {
    const subnets = getResourceByType('AWS::EC2::Subnet');
    const privateSubnets = subnets.filter(([logicalId]) => logicalId.includes('PrivateSubnet'));
    privateSubnets.forEach(([, subnet]) => {
      expect(subnet.Properties.MapPublicIpOnLaunch).toBeUndefined();
    });
  });

  test('Each subnet is tagged with Environment', () => {
    const subnets = getResourceByType('AWS::EC2::Subnet');
    subnets.forEach(([, subnet]) => {
      const envTag = subnet.Properties.Tags.find((tag: any) => tag.Key === 'Environment');
      expect(envTag).toBeDefined();
    });
  });

  test('All route tables are associated with correct number of subnets', () => {
    const associations = getResourceByType('AWS::EC2::SubnetRouteTableAssociation');
    const routeTableRefs = associations.map(([, assoc]) => assoc.Properties.RouteTableId.Ref);
    const grouped = routeTableRefs.reduce((acc, ref) => {
      acc[ref] = (acc[ref] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    expect(grouped.PublicRouteTable).toBe(2);
    expect(grouped.PrivateRouteTable).toBe(2);
  });

  test('PublicRoute routes internet traffic to Internet Gateway', () => {
    const routes = getResourceByType('AWS::EC2::Route');
    const publicRoute = routes.find(([, r]) => r.Properties.RouteTableId.Ref === 'PublicRouteTable');
    expect(publicRoute?.[1]?.Properties?.DestinationCidrBlock).toBe('0.0.0.0/0');
    expect(publicRoute?.[1]?.Properties?.GatewayId.Ref).toBe('InternetGateway');
  });

  test('PrivateRoute routes traffic through NAT Gateway', () => {
    const routes = getResourceByType('AWS::EC2::Route');
    const privateRoute = routes.find(([, r]) => r.Properties.RouteTableId.Ref === 'PrivateRouteTable');
    expect(privateRoute?.[1]?.Properties?.DestinationCidrBlock).toBe('0.0.0.0/0');
    expect(privateRoute?.[1]?.Properties?.NatGatewayId.Ref).toBe('NatGateway');
  });

  test('IAM Instance Profile is associated with correct role', () => {
  const instanceProfiles = getResourceByType('AWS::IAM::InstanceProfile');
  expect(instanceProfiles.length).toBeGreaterThan(0);
  instanceProfiles.forEach(([, profile]) => {
    expect(profile.Properties.Roles).toContainEqual({ Ref: 'EC2S3AccessRole' }); // updated to match template
  });
});

  test('CloudTrail logging is enabled across all regions', () => {
    const trails = getResourceByType('AWS::CloudTrail::Trail');
    expect(trails.length).toBeGreaterThan(0);
    trails.forEach(([, trail]) => {
      expect(trail.Properties.IsMultiRegionTrail).toBe(true);
      expect(trail.Properties.IsLogging).toBe(true);
      expect(trail.Properties.EnableLogFileValidation).toBe(true);
    });
  });

  test('All S3 Buckets have proper encryption and ACL disabled', () => {
  const buckets = getResourceByType('AWS::S3::Bucket');
  buckets.forEach(([, bucket]) => {
    const enc = bucket.Properties.BucketEncryption?.ServerSideEncryptionConfiguration?.[0]?.ServerSideEncryptionByDefault?.SSEAlgorithm;
    expect(enc).toMatch(/AES256|aws:kms/); // Accept either encryption method

    const pubBlock = bucket.Properties.PublicAccessBlockConfiguration;
    expect(pubBlock.BlockPublicAcls).toBe(true);
    expect(pubBlock.IgnorePublicAcls).toBe(true);
    expect(pubBlock.BlockPublicPolicy).toBe(true);
    expect(pubBlock.RestrictPublicBuckets).toBe(true);
  });
});


  test('Each S3 Bucket has OwnershipControls set to BucketOwnerEnforced', () => {
    const buckets = getResourceByType('AWS::S3::Bucket');
    buckets.forEach(([, bucket]) => {
      const rules = bucket.Properties.OwnershipControls?.Rules || [];
      expect(rules.find((r: any) => r.ObjectOwnership === 'BucketOwnerEnforced')).toBeDefined();
    });
  });
  test('AppData and CloudTrail bucket policies explicitly deny unencrypted (non-SSL) requests', () => {
  const policies = getResourceByType('AWS::S3::BucketPolicy');
  const expectedPolicies = ['AppDataBucketPolicy', 'CloudTrailBucketPolicy'];

  expectedPolicies.forEach((logicalId) => {
    const policy = policies.find(([id]) => id === logicalId)?.[1];
    expect(policy).toBeDefined();

    const statements = policy?.Properties?.PolicyDocument?.Statement || [];

    const denyInsecure = statements.find((stmt: any) => {
      const transportCondition = stmt?.Condition?.Bool?.['aws:SecureTransport'];
      return (
        stmt.Effect === 'Deny' &&
        stmt.Principal === '*' &&
        (stmt.Action === 's3:*' || (Array.isArray(stmt.Action) && stmt.Action.includes('s3:*'))) &&
        (transportCondition === false || transportCondition === 'false')
      );
    });

    if (!denyInsecure) {
      console.error(`❌ Missing aws:SecureTransport deny condition in: ${logicalId}`);
      console.dir(statements, { depth: null });
    }

    expect(denyInsecure).toBeDefined();
  });
});




  test('CloudTrail bucket policy includes GetBucketAcl and PutObject permissions for cloudtrail.amazonaws.com', () => {
    const policies = getResourceByType('AWS::S3::BucketPolicy');
    const cloudTrailPolicy = policies.find(([id]) => id === 'CloudTrailBucketPolicy')?.[1];

    expect(cloudTrailPolicy).toBeDefined();
    const statements = cloudTrailPolicy?.Properties?.PolicyDocument?.Statement || [];

    const getAcl = statements.find((s: any) => s.Action === 's3:GetBucketAcl' && s.Principal?.Service === 'cloudtrail.amazonaws.com');
    const putObject = statements.find((s: any) => s.Action === 's3:PutObject' && s.Principal?.Service === 'cloudtrail.amazonaws.com');

    expect(getAcl).toBeDefined();
    expect(putObject).toBeDefined();
  });
  test('All taggable resources must have "Owner" tag using Ref or TeamA', () => {
  const resources = template.toJSON().Resources;

  const taggableTypes = [
    'AWS::EC2::VPC',
    'AWS::EC2::Subnet',
    'AWS::EC2::InternetGateway',
    'AWS::EC2::NatGateway',
    'AWS::EC2::RouteTable',
    'AWS::EC2::SecurityGroup',
    'AWS::S3::Bucket',
    'AWS::IAM::Role',
    'AWS::CloudTrail::Trail'
  ];

  Object.entries(resources).forEach(([logicalId, res]: [string, any]) => {
    if (taggableTypes.includes(res.Type)) {
      const tags = res?.Properties?.Tags;
      expect(tags).toBeDefined();

      const ownerTag = tags.find((t: any) =>
        t.Key === 'Owner' && (
          t.Value === 'TeamA' || t.Value?.Ref === 'Owner'
        )
      );

      if (!ownerTag) {
        console.error(`❌ Missing dynamic Owner tag on: ${logicalId}`);
      }

      expect(ownerTag).toBeDefined();
    }
  });
});



});

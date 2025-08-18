import AWS from 'aws-sdk';
import fs from 'fs';

// Load CloudFormation outputs
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

const ec2 = new AWS.EC2();
const s3 = new AWS.S3();
const kms = new AWS.KMS();
const elbv2 = new AWS.ELBv2();
const cloudtrail = new AWS.CloudTrail();
const iam = new AWS.IAM();
const autoscaling = new AWS.AutoScaling();
const configservice = new AWS.ConfigService();
const lambda = new AWS.Lambda();

// Enhanced validation functions with comprehensive checks
async function validateVpcComprehensive(vpcId: string) {
  const res = await ec2.describeVpcs({ VpcIds: [vpcId] }).promise();
  if (!res.Vpcs || res.Vpcs.length === 0) throw new Error('VPC not found');

  const vpc = res.Vpcs[0];
  expect(vpc.VpcId).toBe(vpcId);
  expect(vpc.CidrBlock).toBe('10.0.0.0/16');
  expect(vpc.EnableDnsSupport).toBe(true);
  expect(vpc.EnableDnsHostnames).toBe(true);
  expect(vpc.State).toBe('available');

  // Validate tags
  const nameTag = vpc.Tags?.find((tag: any) => tag.Key === 'Name');
  expect(nameTag?.Value).toBe('prod-vpc');
  const envTag = vpc.Tags?.find((tag: any) => tag.Key === 'Environment');
  expect(envTag?.Value).toBe('Production');
}

async function validateSubnetComprehensive(
  subnetId: string,
  vpcId: string,
  isPublic: boolean
) {
  const res = await ec2.describeSubnets({ SubnetIds: [subnetId] }).promise();
  if (!res.Subnets || res.Subnets.length === 0)
    throw new Error('Subnet not found');

  const subnet = res.Subnets[0];
  expect(subnet.SubnetId).toBe(subnetId);
  expect(subnet.VpcId).toBe(vpcId);
  expect(subnet.State).toBe('available');
  expect(subnet.MapPublicIpOnLaunch).toBe(isPublic);

  // Validate CIDR ranges
  const expectedCidrs = isPublic
    ? ['10.0.0.0/24', '10.0.1.0/24']
    : ['10.0.2.0/24', '10.0.3.0/24'];
  expect(expectedCidrs).toContain(subnet.CidrBlock);

  // Validate tags
  const nameTag = subnet.Tags?.find((tag: any) => tag.Key === 'Name');
  expect(nameTag?.Value).toMatch(
    isPublic ? /prod-public-subnet/ : /prod-private-subnet/
  );
}

async function validateSecurityGroupComprehensive(sgId: string, vpcId: string) {
  const res = await ec2.describeSecurityGroups({ GroupIds: [sgId] }).promise();
  if (!res.SecurityGroups || res.SecurityGroups.length === 0)
    throw new Error('Security group not found');

  const sg = res.SecurityGroups[0];
  expect(sg.GroupId).toBe(sgId);
  expect(sg.VpcId).toBe(vpcId);
  expect(sg.Description).toBe('Production Security Group');

  // Validate ingress rules
  const ingressRules = sg.IpPermissions || [];
  expect(ingressRules.length).toBeGreaterThan(0);

  const sshRule = ingressRules.find(
    (rule: any) => rule.FromPort === 22 && rule.ToPort === 22
  );
  expect(sshRule).toBeDefined();
  expect(sshRule?.IpRanges?.[0]?.CidrIp).toBe('0.0.0.0/0');

  const httpRule = ingressRules.find(
    (rule: any) => rule.FromPort === 80 && rule.ToPort === 80
  );
  expect(httpRule).toBeDefined();

  const httpsRule = ingressRules.find(
    (rule: any) => rule.FromPort === 443 && rule.ToPort === 443
  );
  expect(httpsRule).toBeDefined();

  // Validate egress rules
  const egressRules = sg.IpPermissionsEgress || [];
  expect(egressRules.length).toBeGreaterThan(0);
  const allTrafficRule = egressRules.find(
    (rule: any) => rule.IpProtocol === '-1'
  );
  expect(allTrafficRule).toBeDefined();
}

async function validateS3BucketComprehensive(bucketName: string) {
  // Check existence and accessibility
  try {
    await s3.headBucket({ Bucket: bucketName }).promise();
  } catch (err) {
    throw new Error(
      `S3 bucket "${bucketName}" does not exist or is not accessible: ${err}`
    );
  }

  // Validate versioning
  const versioning = await s3
    .getBucketVersioning({ Bucket: bucketName })
    .promise();
  expect(versioning.Status).toBe('Enabled');

  // Validate encryption
  const encryption = await s3
    .getBucketEncryption({ Bucket: bucketName })
    .promise();
  expect(encryption.ServerSideEncryptionConfiguration).toBeDefined();
  const rules = encryption.ServerSideEncryptionConfiguration?.Rules;
  expect(rules?.length).toBeGreaterThan(0);
  const algo = rules?.[0].ApplyServerSideEncryptionByDefault?.SSEAlgorithm;
  expect(algo).toBe('aws:kms');

  // Validate bucket policy
  try {
    const policy = await s3.getBucketPolicy({ Bucket: bucketName }).promise();
    const policyDoc = JSON.parse(policy.Policy || '{}');
    expect(policyDoc.Statement).toBeDefined();
    expect(policyDoc.Statement.length).toBeGreaterThan(0);
  } catch (err) {
    // Bucket policy might not exist, which is acceptable
  }

  // Validate tags
  const tagging = await s3.getBucketTagging({ Bucket: bucketName }).promise();
  const envTag = tagging.TagSet?.find(tag => tag.Key === 'Environment');
  expect(envTag?.Value).toBe('Production');
}

async function validateKmsKeyComprehensive(keyId: string) {
  const res = await kms.describeKey({ KeyId: keyId }).promise();
  if (!res.KeyMetadata) throw new Error('KMS KeyMetadata not found');

  const key = res.KeyMetadata;
  expect(key.KeyId).toBeDefined();
  expect(key.Enabled).toBe(true);
  expect(key.KeyUsage).toBe('ENCRYPT_DECRYPT');
  expect(key.KeyState).toBe('Enabled');

  // Validate key policy
  const policy = await kms
    .getKeyPolicy({ KeyId: keyId, PolicyName: 'default' })
    .promise();
  const policyDoc = JSON.parse(policy.Policy || '{}');
  expect(policyDoc.Statement).toBeDefined();

  // Check for CloudTrail permissions
  const cloudTrailStatement = policyDoc.Statement?.find(
    (stmt: any) => stmt.Principal?.Service === 'cloudtrail.amazonaws.com'
  );
  expect(cloudTrailStatement).toBeDefined();
}

async function validateAlbComprehensive(albDns: string) {
  const res = await elbv2.describeLoadBalancers({}).promise();
  if (!res.LoadBalancers || res.LoadBalancers.length === 0)
    throw new Error('No load balancers found');

  const alb = res.LoadBalancers.find((lb: any) => lb.DNSName === albDns);
  if (!alb) throw new Error('ALB not found');

  expect(alb.Scheme).toBe('internet-facing');
  expect(alb.Type).toBe('application');
  expect(alb.State.Code).toBe('active');

  // Validate listeners
  const listeners = await elbv2
    .describeListeners({ LoadBalancerArn: alb.LoadBalancerArn })
    .promise();
  expect(listeners.Listeners?.length).toBeGreaterThan(0);

  // Check for HTTP listener
  const httpListener = listeners.Listeners?.find(
    listener => listener.Port === 80
  );
  expect(httpListener).toBeDefined();

  // Check for HTTPS listener if certificate is provided
  const httpsListener = listeners.Listeners?.find(
    listener => listener.Port === 443
  );
  if (outputs.CertificateArn) {
    expect(httpsListener).toBeDefined();
    expect(httpsListener?.Certificates?.length).toBeGreaterThan(0);
  }

  // Validate target groups
  const targetGroups = await elbv2.describeTargetGroups({}).promise();
  const prodTargetGroup = targetGroups.TargetGroups?.find(
    tg => tg.TargetGroupName === 'prod-tg'
  );
  expect(prodTargetGroup).toBeDefined();
  expect(prodTargetGroup?.Port).toBe(80);
  expect(prodTargetGroup?.Protocol).toBe('HTTP');
  expect(prodTargetGroup?.TargetType).toBe('instance');
}

async function validateCloudTrailComprehensive(
  trailName: string,
  bucketName: string,
  kmsKeyId: string
) {
  const res = await cloudtrail
    .describeTrails({ trailNameList: [trailName] })
    .promise();
  if (!res.trailList || res.trailList.length === 0)
    throw new Error('CloudTrail not found');

  const trail = res.trailList[0];
  expect(trail.Name).toBe(trailName);
  expect(trail.S3BucketName).toBe(bucketName);
  expect(trail.KmsKeyId).toBe(kmsKeyId);
  expect(trail.IsMultiRegionTrail).toBe(true);
  expect(trail.IncludeGlobalServiceEvents).toBe(true);
  expect(trail.LogFileValidationEnabled).toBe(true);

  // Validate trail status
  const status = await cloudtrail.getTrailStatus({ Name: trailName }).promise();
  expect(status.IsLogging).toBe(true);

  // Validate event selectors
  const eventSelectors = await cloudtrail
    .getEventSelectors({ TrailName: trailName })
    .promise();
  expect(eventSelectors.EventSelectors?.length).toBeGreaterThan(0);
}

async function validateIamRoleComprehensive(
  roleName: string,
  expectedPolicies?: string[]
) {
  const res = await iam.getRole({ RoleName: roleName }).promise();
  if (!res.Role) throw new Error('IAM Role not found');

  const role = res.Role;
  expect(role.RoleName).toBe(roleName);
  expect(role.Arn).toBeDefined();

  // Validate assume role policy
  const assumeRolePolicy = JSON.parse(role.AssumeRolePolicyDocument || '{}');
  expect(assumeRolePolicy.Statement).toBeDefined();

  // Validate attached policies
  const attachedPolicies = await iam
    .listAttachedRolePolicies({ RoleName: roleName })
    .promise();
  if (expectedPolicies) {
    const policyNames =
      attachedPolicies.AttachedPolicies?.map(p => p.PolicyName) || [];
    expectedPolicies.forEach(policy => {
      expect(policyNames).toContain(policy);
    });
  }

  // Validate inline policies
  const inlinePolicies = await iam
    .listRolePolicies({ RoleName: roleName })
    .promise();
  expect(inlinePolicies.PolicyNames).toBeDefined();
}

async function validateAsgComprehensive(asgName: string) {
  const res = await autoscaling
    .describeAutoScalingGroups({ AutoScalingGroupNames: [asgName] })
    .promise();
  if (!res.AutoScalingGroups || res.AutoScalingGroups.length === 0)
    throw new Error('ASG not found');

  const asg = res.AutoScalingGroups[0];
  expect(asg.AutoScalingGroupName).toBe(asgName);
  expect(asg.MinSize).toBe(2);
  expect(asg.MaxSize).toBe(4);
  expect(asg.DesiredCapacity).toBe(2);
  expect(asg.HealthCheckType).toBeDefined();

  // Validate launch template
  expect(asg.LaunchTemplate).toBeDefined();
  // Note: The launch template name in the template is 'prod-ec2-lt'
  expect(asg.LaunchTemplate?.LaunchTemplateId).toBeDefined();

  // Validate VPC zone identifier (subnets)
  expect(asg.VPCZoneIdentifier).toBeDefined();
  const subnetIds = asg.VPCZoneIdentifier?.split(',') || [];
  expect(subnetIds.length).toBeGreaterThan(0);

  // Validate tags
  const nameTag = asg.Tags?.find(tag => tag.Key === 'Name');
  expect(nameTag?.Value).toBe('prod-asg');
  expect(nameTag?.PropagateAtLaunch).toBe(true);
}

async function validateLaunchTemplateComprehensive(ltName: string) {
  const res = await ec2
    .describeLaunchTemplates({ LaunchTemplateNames: [ltName] })
    .promise();
  if (!res.LaunchTemplates || res.LaunchTemplates.length === 0)
    throw new Error('Launch template not found');

  const lt = res.LaunchTemplates[0];
  expect(lt.LaunchTemplateName).toBe(ltName);

  // Get launch template data
  const data = await ec2
    .describeLaunchTemplateVersions({
      LaunchTemplateName: ltName,
      Versions: [lt.LatestVersionNumber?.toString() || '1'],
    })
    .promise();

  const version = data.LaunchTemplateVersions?.[0];
  expect(version).toBeDefined();
  expect(version?.LaunchTemplateData?.InstanceType).toBe('t3.micro');
  expect(version?.LaunchTemplateData?.SecurityGroupIds).toBeDefined();
  expect(version?.LaunchTemplateData?.IamInstanceProfile).toBeDefined();
}

async function validateConfigRecorderComprehensive(name: string) {
  const res = await configservice
    .describeConfigurationRecorders({ ConfigurationRecorderNames: [name] })
    .promise();
  if (!res.ConfigurationRecorders || res.ConfigurationRecorders.length === 0)
    throw new Error('Config recorder not found');

  const recorder = res.ConfigurationRecorders[0];
  expect(recorder.Name).toBe(name);
  expect(recorder.RoleARN).toBeDefined();
  expect(recorder.RecordingGroup?.AllSupported).toBe(true);
  expect(recorder.RecordingGroup?.IncludeGlobalResourceTypes).toBe(true);

  // Validate delivery channel
  const deliveryChannels = await configservice
    .describeDeliveryChannels({})
    .promise();
  const deliveryChannel = deliveryChannels.DeliveryChannels?.find(
    dc => dc.Name === 'prod-config-delivery'
  );
  expect(deliveryChannel).toBeDefined();
  expect(deliveryChannel?.S3BucketName).toBeDefined();
  expect(
    deliveryChannel?.ConfigSnapshotDeliveryProperties?.DeliveryFrequency
  ).toBe('TwentyFour_Hours');
}

async function validateNatGatewayComprehensive(natGatewayId: string) {
  const res = await ec2
    .describeNatGateways({ NatGatewayIds: [natGatewayId] })
    .promise();
  if (!res.NatGateways || res.NatGateways.length === 0)
    throw new Error('NAT Gateway not found');

  const nat = res.NatGateways[0];
  expect(nat.NatGatewayId).toBe(natGatewayId);
  expect(nat.State).toBe('available');
  expect(nat.SubnetId).toBeDefined();
  expect(nat.NatGatewayAddresses).toBeDefined();
  expect(nat.NatGatewayAddresses?.length).toBeGreaterThan(0);

  // Validate tags
  const nameTag = nat.Tags?.find(tag => tag.Key === 'Name');
  expect(nameTag?.Value).toMatch(/prod-nat-gw/);
}

async function validateRouteTableComprehensive(
  routeTableId: string,
  isPublic: boolean
) {
  const res = await ec2
    .describeRouteTables({ RouteTableIds: [routeTableId] })
    .promise();
  if (!res.RouteTables || res.RouteTables.length === 0)
    throw new Error('Route table not found');

  const rt = res.RouteTables[0];
  expect(rt.RouteTableId).toBe(routeTableId);
  expect(rt.VpcId).toBe(outputs.VPCId);

  // Validate routes
  const routes = rt.Routes || [];
  if (isPublic) {
    // Public route table should have internet gateway route
    const igwRoute = routes.find(
      route => route.GatewayId && route.DestinationCidrBlock === '0.0.0.0/0'
    );
    expect(igwRoute).toBeDefined();
  } else {
    // Private route table should have NAT gateway route
    const natRoute = routes.find(
      route => route.NatGatewayId && route.DestinationCidrBlock === '0.0.0.0/0'
    );
    expect(natRoute).toBeDefined();
  }

  // Validate associations
  const associations = rt.Associations || [];
  expect(associations.length).toBeGreaterThan(0);
}

async function validateLambdaComprehensive(functionName: string) {
  const res = await lambda
    .getFunction({ FunctionName: functionName })
    .promise();
  if (!res.Configuration)
    throw new Error('Lambda function configuration not found');

  const func = res.Configuration;
  expect(func.FunctionName).toBe(functionName);
  expect(func.Runtime).toBe('python3.9');
  expect(func.Handler).toBe('index.handler');
  expect(func.Timeout).toBe(300);
  expect(func.Role).toBeDefined();

  // Validate environment variables if any
  if (func.Environment) {
    expect(func.Environment.Variables).toBeDefined();
  }
}

async function validateNetworkConnectivity() {
  // Test that private subnets can reach internet through NAT gateways
  if (outputs.PrivateSubnets && outputs.NatGW1Id && outputs.NatGW2Id) {
    const privateSubnets = outputs.PrivateSubnets.split(',');

    // Check route tables for private subnets
    for (const subnetId of privateSubnets) {
      const subnetRes = await ec2
        .describeSubnets({ SubnetIds: [subnetId] })
        .promise();
      const subnet = subnetRes.Subnets?.[0];
      if (subnet) {
        const routeTableRes = await ec2
          .describeRouteTables({
            Filters: [{ Name: 'association.subnet-id', Values: [subnetId] }],
          })
          .promise();
        const routeTable = routeTableRes.RouteTables?.[0];
        expect(routeTable).toBeDefined();

        const natRoute = routeTable?.Routes?.find(
          route =>
            route.NatGatewayId && route.DestinationCidrBlock === '0.0.0.0/0'
        );
        expect(natRoute).toBeDefined();
      }
    }
  }
}

async function validateSecurityCompliance() {
  // Check that CloudTrail is enabled and logging
  if (outputs.ProdCloudTrailName) {
    const status = await cloudtrail
      .getTrailStatus({ Name: outputs.ProdCloudTrailName })
      .promise();
    expect(status.IsLogging).toBe(true);
  }

  // Check that AWS Config is recording
  if (outputs.ConfigRecorderName) {
    const status = await configservice.getStatus({}).promise();
    expect(status.ConfigurationRecordersStatus?.length).toBeGreaterThan(0);
  }

  // Validate S3 bucket encryption
  if (outputs.ProdTrailBucketName) {
    const encryption = await s3
      .getBucketEncryption({ Bucket: outputs.ProdTrailBucketName })
      .promise();
    expect(encryption.ServerSideEncryptionConfiguration).toBeDefined();
  }
}

describe('TapStack Comprehensive Integration Tests', () => {
  describe('VPC and Networking', () => {
    if (outputs.VPCId && outputs.VPCId !== 'AWS::NoValue') {
      test('VPC exists with correct configuration and tags', async () => {
        await validateVpcComprehensive(outputs.VPCId as string);
      });
    }

    if (outputs.PublicSubnets && outputs.PublicSubnets !== 'AWS::NoValue') {
      outputs.PublicSubnets.split(',').forEach((subnetId: string) => {
        test(`Public Subnet ${subnetId} exists with correct configuration`, async () => {
          await validateSubnetComprehensive(
            subnetId,
            outputs.VPCId as string,
            true
          );
        });
      });
    }

    if (outputs.PrivateSubnets && outputs.PrivateSubnets !== 'AWS::NoValue') {
      outputs.PrivateSubnets.split(',').forEach((subnetId: string) => {
        test(`Private Subnet ${subnetId} exists with correct configuration`, async () => {
          await validateSubnetComprehensive(
            subnetId,
            outputs.VPCId as string,
            false
          );
        });
      });
    }

    if (
      outputs.PublicRouteTableId &&
      outputs.PublicRouteTableId !== 'AWS::NoValue'
    ) {
      test('Public Route Table exists with internet gateway route', async () => {
        await validateRouteTableComprehensive(
          outputs.PublicRouteTableId as string,
          true
        );
      });
    }

    if (
      outputs.PrivateRouteTableAId &&
      outputs.PrivateRouteTableAId !== 'AWS::NoValue'
    ) {
      test('Private Route Table A exists with NAT gateway route', async () => {
        await validateRouteTableComprehensive(
          outputs.PrivateRouteTableAId as string,
          false
        );
      });
    }

    if (
      outputs.PrivateRouteTableBId &&
      outputs.PrivateRouteTableBId !== 'AWS::NoValue'
    ) {
      test('Private Route Table B exists with NAT gateway route', async () => {
        await validateRouteTableComprehensive(
          outputs.PrivateRouteTableBId as string,
          false
        );
      });
    }

    if (outputs.NatGW1Id && outputs.NatGW1Id !== 'AWS::NoValue') {
      test('NAT Gateway 1 exists and is available', async () => {
        await validateNatGatewayComprehensive(outputs.NatGW1Id as string);
      });
    }

    if (outputs.NatGW2Id && outputs.NatGW2Id !== 'AWS::NoValue') {
      test('NAT Gateway 2 exists and is available', async () => {
        await validateNatGatewayComprehensive(outputs.NatGW2Id as string);
      });
    }
  });

  describe('Security and IAM', () => {
    if (
      outputs.ProdSecurityGroupId &&
      outputs.VPCId &&
      outputs.ProdSecurityGroupId !== 'AWS::NoValue'
    ) {
      test('Security Group exists with correct rules and VPC association', async () => {
        await validateSecurityGroupComprehensive(
          outputs.ProdSecurityGroupId as string,
          outputs.VPCId as string
        );
      });
    }

    if (outputs.EC2RoleName && outputs.EC2RoleName !== 'AWS::NoValue') {
      test('EC2 IAM Role exists with correct policies', async () => {
        await validateIamRoleComprehensive(outputs.EC2RoleName as string, [
          'AmazonS3ReadOnlyAccess',
          'CloudWatchAgentServerPolicy',
        ]);
      });
    }

    if (
      outputs.EC2InstanceProfileName &&
      outputs.EC2InstanceProfileName !== 'AWS::NoValue'
    ) {
      test('EC2 Instance Profile exists and is properly configured', async () => {
        await validateInstanceProfile(outputs.EC2InstanceProfileName as string);
      });
    }

    if (outputs.ConfigRoleName && outputs.ConfigRoleName !== 'AWS::NoValue') {
      test('Config IAM Role exists with correct permissions', async () => {
        await validateIamRoleComprehensive(outputs.ConfigRoleName as string);
      });
    }
  });

  describe('Storage and Encryption', () => {
    if (
      outputs.ProdTrailBucketName &&
      outputs.ProdTrailBucketName !== 'AWS::NoValue'
    ) {
      test('S3 Bucket exists with versioning, encryption, and proper configuration', async () => {
        await validateS3BucketComprehensive(
          outputs.ProdTrailBucketName as string
        );
      });
    }

    if (
      outputs.CloudTrailKMSKeyId &&
      outputs.CloudTrailKMSKeyId !== 'AWS::NoValue'
    ) {
      test('KMS Key exists with correct policy and CloudTrail permissions', async () => {
        await validateKmsKeyComprehensive(outputs.CloudTrailKMSKeyId as string);
      });
    }
  });

  describe('Load Balancing and Auto Scaling', () => {
    if (outputs.ALBEndpoint && outputs.ALBEndpoint !== 'AWS::NoValue') {
      test('ALB exists with correct configuration, listeners, and target groups', async () => {
        await validateAlbComprehensive(outputs.ALBEndpoint as string);
      });
    }

    if (outputs.ProdASGName && outputs.ProdASGName !== 'AWS::NoValue') {
      test('Auto Scaling Group exists with correct configuration and launch template', async () => {
        await validateAsgComprehensive(outputs.ProdASGName as string);
      });
    }

    if (
      outputs.ProdLaunchTemplateName &&
      outputs.ProdLaunchTemplateName !== 'AWS::NoValue'
    ) {
      test('Launch Template exists with correct configuration', async () => {
        await validateLaunchTemplateComprehensive(
          outputs.ProdLaunchTemplateName as string
        );
      });
    }
  });

  describe('Monitoring and Logging', () => {
    if (
      outputs.ProdCloudTrailName &&
      outputs.CloudTrailKMSKeyId &&
      outputs.ProdTrailBucketName &&
      outputs.ProdCloudTrailName !== 'AWS::NoValue' &&
      outputs.CloudTrailKMSKeyId !== 'AWS::NoValue' &&
      outputs.ProdTrailBucketName !== 'AWS::NoValue'
    ) {
      test('CloudTrail exists with comprehensive logging configuration', async () => {
        await validateCloudTrailComprehensive(
          outputs.ProdCloudTrailName as string,
          outputs.ProdTrailBucketName as string,
          outputs.CloudTrailKMSKeyId as string
        );
      });
    }

    if (
      outputs.ConfigRecorderName &&
      outputs.ConfigRecorderName !== 'AWS::NoValue'
    ) {
      test('AWS Config Recorder exists with proper delivery channel configuration', async () => {
        await validateConfigRecorderComprehensive(
          outputs.ConfigRecorderName as string
        );
      });
    }
  });

  describe('Lambda Functions', () => {
    if (
      outputs.S3BucketCleanupFunctionName &&
      outputs.S3BucketCleanupFunctionName !== 'AWS::NoValue'
    ) {
      test('S3BucketCleanup Lambda exists with correct configuration', async () => {
        await validateLambdaComprehensive(
          outputs.S3BucketCleanupFunctionName as string
        );
      });
    }
  });

  describe('Network Connectivity and Security Compliance', () => {
    test('Private subnets have proper NAT gateway connectivity', async () => {
      await validateNetworkConnectivity();
    });

    test('Security compliance requirements are met', async () => {
      await validateSecurityCompliance();
    });
  });

  describe('End-to-End Functionality', () => {
    test('ALB health checks are passing', async () => {
      if (outputs.ALBEndpoint && outputs.ALBEndpoint !== 'AWS::NoValue') {
        const targetGroups = await elbv2.describeTargetGroups({}).promise();
        const prodTargetGroup = targetGroups.TargetGroups?.find(
          (tg: any) => tg.TargetGroupName === 'prod-tg'
        );

        if (prodTargetGroup) {
          const healthStatus = await elbv2
            .describeTargetHealth({
              TargetGroupArn: prodTargetGroup.TargetGroupArn,
            })
            .promise();

          // At least one target should be healthy
          const healthyTargets = healthStatus.TargetHealthDescriptions?.filter(
            (target: any) => target.TargetHealth?.State === 'healthy'
          );
          expect(healthyTargets?.length).toBeGreaterThan(0);
        }
      }
    });

    test('Auto Scaling Group has desired number of instances', async () => {
      if (outputs.ProdASGName && outputs.ProdASGName !== 'AWS::NoValue') {
        const asgRes = await autoscaling
          .describeAutoScalingGroups({
            AutoScalingGroupNames: [outputs.ProdASGName],
          })
          .promise();

        const asg = asgRes.AutoScalingGroups?.[0];
        expect(asg?.Instances?.length).toBe(asg?.DesiredCapacity);

        // All instances should be in service
        const inServiceInstances = asg?.Instances?.filter(
          (instance: any) => instance.LifecycleState === 'InService'
        );
        expect(inServiceInstances?.length).toBe(asg?.DesiredCapacity);
      }
    });
  });
});

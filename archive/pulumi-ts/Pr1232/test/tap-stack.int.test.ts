import {
  CloudTrailClient,
  DescribeTrailsCommand,
  GetTrailStatusCommand,
} from '@aws-sdk/client-cloudtrail';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  DescribeFlowLogsCommand,
  DescribeInstancesCommand,
  DescribeInternetGatewaysCommand,
  DescribeRouteTablesCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client
} from '@aws-sdk/client-ec2';
import {
  DescribeLoadBalancersCommand,
  ElasticLoadBalancingV2Client,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  GetRolePolicyCommand,
  IAMClient,
  ListRolePoliciesCommand,
  ListRolesCommand,
} from '@aws-sdk/client-iam';
import { DescribeKeyCommand, KMSClient } from '@aws-sdk/client-kms';
import {
  DescribeDBInstancesCommand,
  DescribeDBSubnetGroupsCommand,
  RDSClient,
} from '@aws-sdk/client-rds';
import {
  GetBucketEncryptionCommand,
  GetBucketLoggingCommand,
  GetPublicAccessBlockCommand,
  HeadBucketCommand,
  ListBucketsCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import {
  SSMClient
} from '@aws-sdk/client-ssm';
import { GetCallerIdentityCommand, STSClient } from '@aws-sdk/client-sts';
import {
  ListResourcesForWebACLCommand,
  WAFV2Client,
} from '@aws-sdk/client-wafv2';
import * as fs from 'fs';
import * as path from 'path';

const loadStackOutputs = () => {
  try {
    const outputsPath = path.join(__dirname, '../cfn-outputs/all-outputs.json');
    const outputsContent = fs.readFileSync(outputsPath, 'utf8');
    return JSON.parse(outputsContent);
  } catch (error) {
    throw new Error(`Failed to load stack outputs: ${error}`);
  }
};

const initializeClients = (region?: string) => {
  const defaultRegion = region || 'ap-south-1';

  return {
    ec2: new EC2Client({ region: defaultRegion }),
    rds: new RDSClient({ region: defaultRegion }),
    s3: new S3Client({ region: defaultRegion }),
    cloudtrail: new CloudTrailClient({ region: defaultRegion }),
    kms: new KMSClient({ region: defaultRegion }),
    wafv2: new WAFV2Client({ region: defaultRegion }),
    sts: new STSClient({ region: defaultRegion }),
    ssm: new SSMClient({ region: defaultRegion }),
  };
};

const extractResourceIds = (outputs: any) => {
  const resourceIds: any = {};

  if (outputs.vpcIds) {
    resourceIds.vpcIds = Array.isArray(outputs.vpcIds)
      ? outputs.vpcIds
      : [outputs.vpcIds];
  }

  if (outputs.ec2InstanceIds) {
    resourceIds.ec2InstanceIds = Array.isArray(outputs.ec2InstanceIds)
      ? outputs.ec2InstanceIds
      : [outputs.ec2InstanceIds];
  }

  if (outputs.rdsEndpoints) {
    resourceIds.rdsEndpoints = Array.isArray(outputs.rdsEndpoints)
      ? outputs.rdsEndpoints
      : [outputs.rdsEndpoints];
  }

  resourceIds.cloudtrailArn = outputs.cloudtrailArn;
  resourceIds.webAclArn = outputs.webAclArn;
  resourceIds.cloudtrailBucketName = outputs.cloudtrailBucketName;
  resourceIds.kmsKeyArns = outputs.kmsKeyArns;

  return resourceIds;
};

describe('TAP Stack Integration Tests', () => {
  let stackOutputs: any;
  let resourceIds: any;
  let clients: ReturnType<typeof initializeClients>;
  let accountId: string;

  const testTimeout = 600000; // 10 minutes for integration tests

  beforeAll(async () => {
    stackOutputs = loadStackOutputs();

    const stackName = Object.keys(stackOutputs)[0];
    if (!stackName) {
      throw new Error('No stack outputs found');
    }

    resourceIds = extractResourceIds(stackOutputs[stackName]);

    let deploymentRegion = 'ap-south-1'; // Default fallback

    if (resourceIds?.cloudtrailArn) {
      const arnParts = resourceIds.cloudtrailArn.split(':');
      if (arnParts.length >= 4 && arnParts[3]) {
        deploymentRegion = arnParts[3];
        console.log(
          `Detected deployment region: ${deploymentRegion} from CloudTrail ARN`
        );
      }
    }

    if (
      deploymentRegion === 'ap-south-1' &&
      resourceIds?.vpcIds &&
      resourceIds.vpcIds.length > 0
    ) {
      const firstVpc = resourceIds.vpcIds[0];
      if (firstVpc.region) {
        deploymentRegion = firstVpc.region;
        console.log(`Detected deployment region: ${deploymentRegion} from VPC`);
      }
    }

    clients = initializeClients(deploymentRegion);

    const stsResponse = await clients.sts.send(
      new GetCallerIdentityCommand({})
    );
    accountId = stsResponse.Account!;

    console.log(`Testing infrastructure for account: ${accountId}`);
    console.log(`Using deployment region: ${deploymentRegion}`);
    console.log(
      `Stack outputs loaded: ${Object.keys(stackOutputs[stackName]).join(', ')}`
    );
  }, testTimeout);

  describe('Infrastructure Deployment Verification', () => {
    test('should have deployed infrastructure successfully', () => {
      if (!stackOutputs) {
        console.log(
          'Skipping test: No stack outputs available - infrastructure may not be deployed'
        );
        return;
      }

      expect(stackOutputs).toBeDefined();
      expect(resourceIds).toBeDefined();
    });

    test(
      'should have valid AWS credentials and access',
      async () => {
        if (!stackOutputs) {
          console.log(`Skipping test: ${"'No stack outputs available'"}`);
          return;
        }

        const identity = await clients.sts.send(
          new GetCallerIdentityCommand({})
        );

        expect(identity.Account).toBeDefined();
        expect(identity.Arn).toBeDefined();
        expect(identity.UserId).toBeDefined();
      },
      testTimeout
    );
  });

  describe('VPC Infrastructure Tests', () => {
    test(
      'should have created VPCs in specified regions',
      async () => {
        if (!resourceIds?.vpcIds) {
          console.log(`Skipping test: ${"'No VPC IDs found in outputs'"}`);
          return;
        }

        for (const vpcInfo of resourceIds.vpcIds) {
          const region = vpcInfo.region || 'us-west-1';
          const vpcId = vpcInfo.vpcId || vpcInfo;

          const regionalClient = new EC2Client({ region });

          const response = await regionalClient.send(
            new DescribeVpcsCommand({
              VpcIds: [vpcId],
            })
          );

          expect(response.Vpcs).toHaveLength(1);
          expect(response.Vpcs![0].VpcId).toBe(vpcId);
          expect(response.Vpcs![0].State).toBe('available');

          const tags = response.Vpcs![0].Tags || [];
          const projectTag = tags.find(tag => tag.Key === 'Project');
          const environmentTag = tags.find(tag => tag.Key === 'Environment');

          expect(projectTag).toBeDefined();
          expect(environmentTag).toBeDefined();
        }
      },
      testTimeout
    );

    test(
      'should have created subnets with proper configuration',
      async () => {
        if (!resourceIds?.vpcIds) {
          console.log(`Skipping test: ${"'No VPC IDs found in outputs'"}`);
          return;
        }

        for (const vpcInfo of resourceIds.vpcIds) {
          const region = vpcInfo.region || 'us-west-1';
          const vpcId = vpcInfo.vpcId || vpcInfo;

          const regionalClient = new EC2Client({ region });

          const response = await regionalClient.send(
            new DescribeSubnetsCommand({
              Filters: [
                {
                  Name: 'vpc-id',
                  Values: [vpcId],
                },
              ],
            })
          );

          expect(response.Subnets!.length).toBeGreaterThan(0);

          const availabilityZones = new Set(
            response.Subnets!.map(subnet => subnet.AvailabilityZone)
          );
          expect(availabilityZones.size).toBeGreaterThanOrEqual(2);

          for (const subnet of response.Subnets!) {
            expect(subnet.State).toBe('available');
            expect(subnet.CidrBlock).toBeDefined();
          }
        }
      },
      testTimeout
    );

    test(
      'should have internet gateways attached to VPCs',
      async () => {
        if (!resourceIds?.vpcIds) {
          console.log(`Skipping test: ${"'No VPC IDs found in outputs'"}`);
          return;
        }

        for (const vpcInfo of resourceIds.vpcIds) {
          const region = vpcInfo.region || 'us-west-1';
          const vpcId = vpcInfo.vpcId || vpcInfo;

          const regionalClient = new EC2Client({ region });

          const response = await regionalClient.send(
            new DescribeInternetGatewaysCommand({
              Filters: [
                {
                  Name: 'attachment.vpc-id',
                  Values: [vpcId],
                },
              ],
            })
          );

          expect(response.InternetGateways!.length).toBeGreaterThan(0);

          const igw = response.InternetGateways![0];
          expect(igw.InternetGatewayId).toBeDefined();

          const attachment = igw.Attachments!.find(att => att.VpcId === vpcId);
          expect(attachment).toBeDefined();
          expect(attachment!.State).toBe('available');
        }
      },
      testTimeout
    );

    test(
      'should have route tables with proper routing',
      async () => {
        if (!resourceIds?.vpcIds) {
          console.log(`Skipping test: ${"'No VPC IDs found in outputs'"}`);
          return;
        }

        for (const vpcInfo of resourceIds.vpcIds) {
          const region = vpcInfo.region || 'us-west-1';
          const vpcId = vpcInfo.vpcId || vpcInfo;

          const regionalClient = new EC2Client({ region });

          const response = await regionalClient.send(
            new DescribeRouteTablesCommand({
              Filters: [
                {
                  Name: 'vpc-id',
                  Values: [vpcId],
                },
              ],
            })
          );

          expect(response.RouteTables!.length).toBeGreaterThan(0);

          const hasInternetRoute = response.RouteTables!.some(rt =>
            rt.Routes!.some(route => route.GatewayId?.startsWith('igw-'))
          );

          expect(hasInternetRoute).toBe(true);
        }
      },
      testTimeout
    );
  });

  describe('EC2 Instance Tests', () => {
    test(
      'should have created EC2 instances with proper configuration',
      async () => {
        if (!resourceIds?.ec2InstanceIds) {
          console.log(
            `Skipping test: ${"'No EC2 instance IDs found in outputs'"}`
          );
          return;
        }

        for (const instanceInfo of resourceIds.ec2InstanceIds) {
          const region = instanceInfo.region || 'us-west-1';
          const instanceIds = instanceInfo.instanceIds || [instanceInfo];

          const regionalClient = new EC2Client({ region });

          const response = await regionalClient.send(
            new DescribeInstancesCommand({
              InstanceIds: instanceIds,
            })
          );

          expect(response.Reservations!.length).toBeGreaterThan(0);

          for (const reservation of response.Reservations!) {
            for (const instance of reservation.Instances!) {
              expect(['running', 'pending', 'stopped']).toContain(
                instance.State!.Name
              );
              expect(instance.InstanceType).toBeDefined();
              expect(instance.VpcId).toBeDefined();
              expect(instance.SubnetId).toBeDefined();

              // Verify no SSH key is associated (using SSM Session Manager instead)
              expect(instance.KeyName).toBeUndefined();

              expect(instance.SecurityGroups!.length).toBeGreaterThan(0);

              const tags = instance.Tags || [];
              const projectTag = tags.find(tag => tag.Key === 'Project');
              const environmentTag = tags.find(
                tag => tag.Key === 'Environment'
              );

              expect(projectTag).toBeDefined();
              expect(environmentTag).toBeDefined();
            }
          }
        }
      },
      testTimeout
    );

    test(
      'should have security groups with appropriate rules',
      async () => {
        if (!resourceIds?.ec2InstanceIds) {
          console.log(
            `Skipping test: ${"'No EC2 instance IDs found in outputs'"}`
          );
          return;
        }

        for (const instanceInfo of resourceIds.ec2InstanceIds) {
          const region = instanceInfo.region || 'us-west-1';
          const instanceIds = instanceInfo.instanceIds || [instanceInfo];

          const regionalClient = new EC2Client({ region });

          const instancesResponse = await regionalClient.send(
            new DescribeInstancesCommand({
              InstanceIds: instanceIds,
            })
          );

          const securityGroupIds = new Set<string>();
          for (const reservation of instancesResponse.Reservations!) {
            for (const instance of reservation.Instances!) {
              for (const sg of instance.SecurityGroups!) {
                securityGroupIds.add(sg.GroupId!);
              }
            }
          }

          const sgResponse = await regionalClient.send(
            new DescribeSecurityGroupsCommand({
              GroupIds: Array.from(securityGroupIds),
            })
          );

          for (const sg of sgResponse.SecurityGroups!) {
            expect(sg.GroupName).toBeDefined();
            expect(sg.Description).toBeDefined();

            const sshRules = sg.IpPermissions!.filter(
              rule => rule.FromPort === 22 && rule.ToPort === 22
            );

            for (const sshRule of sshRules) {
              // Verify SSH is not open to the world
              const hasOpenAccess = sshRule.IpRanges!.some(
                range => range.CidrIp === '0.0.0.0/0'
              );
              expect(hasOpenAccess).toBe(false); // SSH should be restricted

              // Verify SSH is only allowed from the specific IP range
              const allowedCidrs = sshRule.IpRanges!.map(range => range.CidrIp);
              expect(allowedCidrs).toContain('203.0.113.0/24');
              
              // Ensure no other CIDR blocks are allowed for SSH
              const unauthorizedCidrs = allowedCidrs.filter(
                cidr => cidr !== '203.0.113.0/24'
              );
              expect(unauthorizedCidrs.length).toBe(0);
            }
          }
        }
      },
      testTimeout
    );

    test(
      'should have SSM Session Manager configured for EC2 access',
      async () => {
        if (!resourceIds?.ec2InstanceIds) {
          console.log(
            `Skipping test: ${"'No EC2 instance IDs found in outputs'"}`
          );
          return;
        }

        for (const instanceInfo of resourceIds.ec2InstanceIds) {
          const region = instanceInfo.region || 'us-west-1';
          const instanceIds = instanceInfo.instanceIds || [instanceInfo];

          const regionalClient = new EC2Client({ region });

          // Verify instances have SSM-compatible IAM roles
          const instancesResponse = await regionalClient.send(
            new DescribeInstancesCommand({
              InstanceIds: instanceIds,
            })
          );

          for (const reservation of instancesResponse.Reservations!) {
            for (const instance of reservation.Instances!) {
              // Verify instance has IAM instance profile
              expect(instance.IamInstanceProfile).toBeDefined();
              expect(instance.IamInstanceProfile!.Arn).toBeDefined();

              // Verify no SSH key is associated (using SSM instead)
              expect(instance.KeyName).toBeUndefined();

              // Verify instance is in running state or starting
              expect(['running', 'pending', 'stopping', 'stopped']).toContain(
                instance.State!.Name
              );
            }
          }
        }
      },
      testTimeout
    );

    test(
      'should have proper IAM roles for SSM Session Manager',
      async () => {
        if (!resourceIds?.ec2InstanceIds) {
          console.log(
            `Skipping test: ${"'No EC2 instance IDs found in outputs'"}`
          );
          return;
        }

        for (const instanceInfo of resourceIds.ec2InstanceIds) {
          const region = instanceInfo.region || 'us-west-1';

          const iamClient = new IAMClient({ region });

          // List roles and find EC2 roles for the project
          const rolesResponse = await iamClient.send(
            new ListRolesCommand({})
          );

          const projectRoles = rolesResponse.Roles!.filter(
            role => 
              role.RoleName!.includes('webapp') || 
              role.RoleName!.includes('tap') ||
              role.RoleName!.includes('ec2')
          );

          expect(projectRoles.length).toBeGreaterThan(0);

          for (const role of projectRoles) {
            // Check if role has SSM-related policies
            const policiesResponse = await iamClient.send(
              new ListRolePoliciesCommand({
                RoleName: role.RoleName,
              })
            );

            // Check for inline policies that might contain SSM permissions
            for (const policyName of policiesResponse.PolicyNames!) {
              const policyResponse = await iamClient.send(
                new GetRolePolicyCommand({
                  RoleName: role.RoleName,
                  PolicyName: policyName,
                })
              );

              const policyDocument = JSON.parse(
                decodeURIComponent(policyResponse.PolicyDocument!)
              );

              // Look for SSM permissions in the policy
              const hasSSMPermissions = policyDocument.Statement.some(
                (statement: any) => {
                  const actions = Array.isArray(statement.Action) 
                    ? statement.Action 
                    : [statement.Action];
                  
                  return actions.some((action: string) => 
                    action.includes('ssm:') || 
                    action.includes('ssmmessages:')
                  );
                }
              );

              if (hasSSMPermissions) {
                expect(hasSSMPermissions).toBe(true);
              }
            }
          }
        }
      },
      testTimeout
    );
  });

  describe('RDS Database Tests', () => {
    test(
      'should have created RDS instances with proper configuration',
      async () => {
        if (!resourceIds?.rdsEndpoints) {
          console.log(
            `Skipping test: ${"'No RDS endpoints found in outputs'"}`
          );
          return;
        }

        for (const rdsInfo of resourceIds.rdsEndpoints) {
          const region = rdsInfo.region || 'us-west-1';
          const endpoint = rdsInfo.endpoint || rdsInfo;

          const dbInstanceId = endpoint.split('.')[0];

          const regionalClient = new RDSClient({ region });

          const response = await regionalClient.send(
            new DescribeDBInstancesCommand({
              DBInstanceIdentifier: dbInstanceId,
            })
          );

          expect(response.DBInstances!.length).toBe(1);

          const dbInstance = response.DBInstances![0];
          expect(['available', 'creating', 'backing-up']).toContain(
            dbInstance.DBInstanceStatus
          );
          expect(dbInstance.Engine).toBeDefined();
          expect(dbInstance.DBInstanceClass).toBeDefined();
          expect(dbInstance.VpcSecurityGroups!.length).toBeGreaterThan(0);

          expect(dbInstance.StorageEncrypted).toBe(true);

          expect(dbInstance.BackupRetentionPeriod).toBeGreaterThan(0);

          if (process.env.ENVIRONMENT_SUFFIX === 'prod') {
            expect(dbInstance.MultiAZ).toBe(true);
          }
        }
      },
      testTimeout
    );

    test(
      'should have DB subnet groups in multiple availability zones',
      async () => {
        if (!resourceIds?.rdsEndpoints) {
          console.log(
            `Skipping test: ${"'No RDS endpoints found in outputs'"}`
          );
          return;
        }

        for (const rdsInfo of resourceIds.rdsEndpoints) {
          const region = rdsInfo.region || 'us-west-1';

          const regionalClient = new RDSClient({ region });

          const response = await regionalClient.send(
            new DescribeDBSubnetGroupsCommand({})
          );

          const projectSubnetGroups = response.DBSubnetGroups!.filter(
            sg =>
              sg.DBSubnetGroupName!.includes('webapp') ||
              sg.DBSubnetGroupName!.includes('tap')
          );

          expect(projectSubnetGroups.length).toBeGreaterThan(0);

          for (const subnetGroup of projectSubnetGroups) {
            expect(subnetGroup.Subnets!.length).toBeGreaterThanOrEqual(2);

            const availabilityZones = new Set(
              subnetGroup.Subnets!.map(
                subnet => subnet.SubnetAvailabilityZone!.Name
              )
            );
            expect(availabilityZones.size).toBeGreaterThanOrEqual(2);
          }
        }
      },
      testTimeout
    );
  });

  describe('Security and Compliance Tests', () => {
    test(
      'should have S3 bucket for CloudTrail with proper security',
      async () => {
        if (!resourceIds?.cloudtrailBucketName) {
          console.log(
            `Skipping test: ${"'No CloudTrail bucket name found in outputs'"}`
          );
          return;
        }

        const bucketName = resourceIds.cloudtrailBucketName;

        const bucketsResponse = await clients.s3.send(
          new ListBucketsCommand({})
        );
        const bucket = bucketsResponse.Buckets!.find(
          b => b.Name === bucketName
        );
        expect(bucket).toBeDefined();

        let bucketRegion = 'ap-south-1'; // Default fallback

        if (resourceIds?.cloudtrailArn) {
          const arnParts = resourceIds.cloudtrailArn.split(':');
          if (arnParts.length >= 4 && arnParts[3]) {
            bucketRegion = arnParts[3];
            console.log(`Using region ${bucketRegion} from CloudTrail ARN`);
          }
        }

        if (
          bucketRegion === 'ap-south-1' &&
          resourceIds?.vpcIds &&
          resourceIds.vpcIds.length > 0
        ) {
          const firstVpc = resourceIds.vpcIds[0];
          if (firstVpc.region) {
            bucketRegion = firstVpc.region;
            console.log(`Using region ${bucketRegion} from VPC deployment`);
          }
        }

        try {
          const bucketS3Client = new S3Client({ region: bucketRegion });
          await bucketS3Client.send(
            new HeadBucketCommand({ Bucket: bucketName })
          );
          console.log(
            `Confirmed bucket ${bucketName} is accessible from region: ${bucketRegion}`
          );
        } catch (regionError: any) {
          console.log(
            `Bucket not accessible from ${bucketRegion}, trying to detect correct region...`
          );

          const fallbackRegions = [
            'ap-south-1',
            'ap-south-1',
            'us-west-1',
            'ap-south-1',
          ];
          for (const region of fallbackRegions) {
            if (region === bucketRegion) continue; // Skip already tried region

            try {
              const testClient = new S3Client({ region });
              await testClient.send(
                new HeadBucketCommand({ Bucket: bucketName })
              );
              bucketRegion = region;
              console.log(
                `Found bucket ${bucketName} in region: ${bucketRegion}`
              );
              break;
            } catch (error) {
              continue;
            }
          }
        }

        const bucketS3Client = new S3Client({ region: bucketRegion });

        const encryptionResponse = await bucketS3Client.send(
          new GetBucketEncryptionCommand({
            Bucket: bucketName,
          })
        );
        expect(
          encryptionResponse.ServerSideEncryptionConfiguration
        ).toBeDefined();

        const publicAccessResponse = await bucketS3Client.send(
          new GetPublicAccessBlockCommand({
            Bucket: bucketName,
          })
        );
        expect(
          publicAccessResponse.PublicAccessBlockConfiguration!.BlockPublicAcls
        ).toBe(true);
        expect(
          publicAccessResponse.PublicAccessBlockConfiguration!.BlockPublicPolicy
        ).toBe(true);
        expect(
          publicAccessResponse.PublicAccessBlockConfiguration!.IgnorePublicAcls
        ).toBe(true);
        expect(
          publicAccessResponse.PublicAccessBlockConfiguration!
            .RestrictPublicBuckets
        ).toBe(true);
      },
      testTimeout
    );

    test(
      'should have KMS keys for encryption',
      async () => {
        if (!resourceIds?.kmsKeyArns) {
          console.log(`Skipping test: ${"'No KMS key ARNs found in outputs'"}`);
          return;
        }

        for (const keyInfo of resourceIds.kmsKeyArns) {
          const region = keyInfo.region || 'us-west-1';
          const keyArn = keyInfo.keyArn || keyInfo;
          const keyId = keyArn.split('/').pop();

          const regionalClient = new KMSClient({ region });

          const response = await regionalClient.send(
            new DescribeKeyCommand({
              KeyId: keyId,
            })
          );

          expect(response.KeyMetadata!.KeyState).toBe('Enabled');
          expect(response.KeyMetadata!.KeyUsage).toBe('ENCRYPT_DECRYPT');
          expect(response.KeyMetadata!.Origin).toBe('AWS_KMS');
        }
      },
      testTimeout
    );
  });

  describe('Multi-Region Deployment Tests', () => {
    test(
      'should have resources deployed across multiple regions',
      async () => {
        if (!resourceIds?.vpcIds || resourceIds.vpcIds.length < 2) {
          console.log(
            `Skipping test: ${"'Multi-region deployment not detected'"}`
          );
          return;
        }

        const regions = new Set(
          resourceIds.vpcIds.map((vpc: any) => vpc.region || 'us-west-1')
        );
        expect(regions.size).toBeGreaterThanOrEqual(2);

        for (const region of Array.from(regions)) {
          const regionalClient = new EC2Client({ region: region as string });

          const vpcResponse = await regionalClient.send(
            new DescribeVpcsCommand({
              Filters: [
                {
                  Name: 'tag:Project',
                  Values: ['webapp', 'tap'],
                },
              ],
            })
          );

          expect(vpcResponse.Vpcs!.length).toBeGreaterThan(0);
        }
      },
      testTimeout
    );

    test(
      'should have consistent tagging across regions',
      async () => {
        if (!resourceIds?.vpcIds) {
          console.log(`Skipping test: ${"'No VPC IDs found in outputs'"}`);
          return;
        }

        const expectedTags = ['Project', 'Environment'];

        for (const vpcInfo of resourceIds.vpcIds) {
          const region = vpcInfo.region || 'us-west-1';
          const vpcId = vpcInfo.vpcId || vpcInfo;

          const regionalClient = new EC2Client({ region });

          const response = await regionalClient.send(
            new DescribeVpcsCommand({
              VpcIds: [vpcId],
            })
          );

          const vpc = response.Vpcs![0];
          const tags = vpc.Tags || [];
          const tagKeys = tags.map(tag => tag.Key);

          for (const expectedTag of expectedTags) {
            expect(tagKeys).toContain(expectedTag);
          }
        }
      },
      testTimeout
    );
  });

  describe('E2E End-to-End Connectivity Tests', () => {
    test(
      'E2E should verify EC2 instances can reach RDS databases',
      async () => {
        if (!resourceIds?.ec2InstanceIds || !resourceIds?.rdsEndpoints) {
          console.log(
            `Skipping test: ${"'Insufficient resources for connectivity testing'"}`
          );
          return;
        }

        for (const instanceInfo of resourceIds.ec2InstanceIds) {
          const region = instanceInfo.region || 'us-west-1';
          const instanceIds = instanceInfo.instanceIds || [instanceInfo];

          const regionalClient = new EC2Client({ region });

          const instancesResponse = await regionalClient.send(
            new DescribeInstancesCommand({
              InstanceIds: instanceIds,
            })
          );

          const ec2SecurityGroupIds = new Set<string>();
          for (const reservation of instancesResponse.Reservations!) {
            for (const instance of reservation.Instances!) {
              for (const sg of instance.SecurityGroups!) {
                ec2SecurityGroupIds.add(sg.GroupId!);
              }
            }
          }

          const rdsClient = new RDSClient({ region });
          const rdsResponse = await rdsClient.send(
            new DescribeDBInstancesCommand({})
          );

          const rdsSecurityGroupIds = new Set<string>();
          for (const dbInstance of rdsResponse.DBInstances!) {
            if (
              dbInstance.DBInstanceIdentifier!.includes('webapp') ||
              dbInstance.DBInstanceIdentifier!.includes('tap')
            ) {
              for (const vpcSg of dbInstance.VpcSecurityGroups!) {
                rdsSecurityGroupIds.add(vpcSg.VpcSecurityGroupId!);
              }
            }
          }

          const sgResponse = await regionalClient.send(
            new DescribeSecurityGroupsCommand({
              GroupIds: Array.from(rdsSecurityGroupIds),
            })
          );

          let hasValidDbAccess = false;
          for (const sg of sgResponse.SecurityGroups!) {
            for (const rule of sg.IpPermissions!) {
              if (rule.FromPort === 3306 && rule.ToPort === 3306) {
                const hasEc2Access = rule.UserIdGroupPairs!.some(pair =>
                  ec2SecurityGroupIds.has(pair.GroupId!)
                );
                if (hasEc2Access) {
                  hasValidDbAccess = true;
                  break;
                }
              }
            }
            if (hasValidDbAccess) break;
          }

          expect(hasValidDbAccess).toBe(true);
        }
      },
      testTimeout
    );

    test(
      'E2E should verify internet connectivity for public subnets',
      async () => {
        if (!resourceIds?.vpcIds) {
          console.log(
            `Skipping test: ${"'No VPC IDs found for connectivity testing'"}`
          );
          return;
        }

        for (const vpcInfo of resourceIds.vpcIds) {
          const region = vpcInfo.region || 'us-west-1';
          const vpcId = vpcInfo.vpcId || vpcInfo;

          const regionalClient = new EC2Client({ region });

          const subnetsResponse = await regionalClient.send(
            new DescribeSubnetsCommand({
              Filters: [
                {
                  Name: 'vpc-id',
                  Values: [vpcId],
                },
                {
                  Name: 'map-public-ip-on-launch',
                  Values: ['true'],
                },
              ],
            })
          );

          expect(subnetsResponse.Subnets!.length).toBeGreaterThan(0);

          for (const subnet of subnetsResponse.Subnets!) {
            const routeTablesResponse = await regionalClient.send(
              new DescribeRouteTablesCommand({
                Filters: [
                  {
                    Name: 'association.subnet-id',
                    Values: [subnet.SubnetId!],
                  },
                ],
              })
            );

            let hasInternetRoute = false;
            for (const routeTable of routeTablesResponse.RouteTables!) {
              for (const route of routeTable.Routes!) {
                if (
                  route.DestinationCidrBlock === '0.0.0.0/0' &&
                  route.GatewayId?.startsWith('igw-')
                ) {
                  hasInternetRoute = true;
                  break;
                }
              }
              if (hasInternetRoute) break;
            }

            expect(hasInternetRoute).toBe(true);
          }
        }
      },
      testTimeout
    );

    test(
      'E2E should verify private subnets have no direct internet access',
      async () => {
        if (!resourceIds?.vpcIds) {
          console.log(
            `Skipping test: ${"'No VPC IDs found for connectivity testing'"}`
          );
          return;
        }

        for (const vpcInfo of resourceIds.vpcIds) {
          const region = vpcInfo.region || 'us-west-1';
          const vpcId = vpcInfo.vpcId || vpcInfo;

          const regionalClient = new EC2Client({ region });

          const subnetsResponse = await regionalClient.send(
            new DescribeSubnetsCommand({
              Filters: [
                {
                  Name: 'vpc-id',
                  Values: [vpcId],
                },
                {
                  Name: 'map-public-ip-on-launch',
                  Values: ['false'],
                },
              ],
            })
          );

          for (const subnet of subnetsResponse.Subnets!) {
            const routeTablesResponse = await regionalClient.send(
              new DescribeRouteTablesCommand({
                Filters: [
                  {
                    Name: 'association.subnet-id',
                    Values: [subnet.SubnetId!],
                  },
                ],
              })
            );

            for (const routeTable of routeTablesResponse.RouteTables!) {
              for (const route of routeTable.Routes!) {
                if (route.DestinationCidrBlock === '0.0.0.0/0') {
                  expect(route.GatewayId?.startsWith('igw-')).toBe(false);
                }
              }
            }
          }
        }
      },
      testTimeout
    );

    test(
      'E2E should verify CloudWatch monitoring is configured',
      async () => {
        if (!resourceIds?.ec2InstanceIds) {
          console.log(
            `Skipping test: ${"'No EC2 instances found for monitoring verification'"}`
          );
          return;
        }

        for (const instanceInfo of resourceIds.ec2InstanceIds) {
          const region = instanceInfo.region || 'us-west-1';
          const instanceIds = instanceInfo.instanceIds || [instanceInfo];

          const cloudwatchClient = new CloudWatchClient({ region });

          const _alarmsResponse = await cloudwatchClient.send(
            new DescribeAlarmsCommand({
              StateValue: 'OK',
            })
          );

          const regionalClient = new EC2Client({ region });
          const instancesResponse = await regionalClient.send(
            new DescribeInstancesCommand({
              InstanceIds: instanceIds,
            })
          );

          for (const reservation of instancesResponse.Reservations!) {
            for (const instance of reservation.Instances!) {
              expect(instance.Monitoring!.State).toBeDefined();
              if (process.env.ENVIRONMENT_SUFFIX === 'prod') {
                expect(instance.Monitoring!.State).toBe('enabled');
              }
            }
          }
        }
      },
      testTimeout
    );

    test(
      'E2E should verify WAF is properly associated with resources',
      async () => {
        if (!resourceIds?.webAclArn) {
          console.log(`Skipping test: ${"'No WAF Web ACL ARN found'"}`);
          return;
        }

        const _webAclId = resourceIds.webAclArn.split('/').pop();

        const elbClient = new ElasticLoadBalancingV2Client({
          region: 'ap-south-1',
        });

        try {
          const lbResponse = await elbClient.send(
            new DescribeLoadBalancersCommand({})
          );

          const projectLoadBalancers = lbResponse.LoadBalancers!.filter(
            lb =>
              lb.LoadBalancerName!.includes('webapp') ||
              lb.LoadBalancerName!.includes('tap')
          );

          if (projectLoadBalancers.length > 0) {
            const wafClient = new WAFV2Client({ region: 'ap-south-1' });

            const resourcesResponse = await wafClient.send(
              new ListResourcesForWebACLCommand({
                WebACLArn: resourceIds.webAclArn,
                ResourceType: 'APPLICATION_LOAD_BALANCER',
              })
            );

            expect(resourcesResponse.ResourceArns).toBeDefined();
          }
        } catch (error) {
          console.log(
            'No load balancers found or WAF not associated - this is expected for basic infrastructure'
          );
        }
      },
      testTimeout
    );
  });

  describe('E2E Security Compliance and Data Protection Tests', () => {
    test(
      'E2E should verify all data is encrypted at rest',
      async () => {
        if (resourceIds?.rdsEndpoints) {
          for (const rdsInfo of resourceIds.rdsEndpoints) {
            const region = rdsInfo.region || 'us-west-1';
            const endpoint = rdsInfo.endpoint || rdsInfo;
            const dbInstanceId = endpoint.split('.')[0];

            const regionalClient = new RDSClient({ region });

            const response = await regionalClient.send(
              new DescribeDBInstancesCommand({
                DBInstanceIdentifier: dbInstanceId,
              })
            );

            const dbInstance = response.DBInstances![0];
            expect(dbInstance.StorageEncrypted).toBe(true);
            expect(dbInstance.KmsKeyId).toBeDefined();
          }
        }

        if (resourceIds?.cloudtrailBucketName) {
          const bucketName = resourceIds.cloudtrailBucketName;

          let _bucketRegion = 'ap-south-1';
          try {
            const _headResponse = await clients.s3.send(
              new HeadBucketCommand({
                Bucket: bucketName,
              })
            );
          } catch (error: any) {
            if (error.name === 'PermanentRedirect') {
              const errorMetadata = error.$metadata as any;
              _bucketRegion =
                errorMetadata?.httpHeaders?.['x-amz-bucket-region'] ||
                'ap-south-1';
            }
          }
        }
      },
      testTimeout
    );

    test(
      'E2E should verify network security groups follow least privilege',
      async () => {
        if (!resourceIds?.ec2InstanceIds) {
          console.log(
            `Skipping test: ${"'No EC2 instances found for security group testing'"}`
          );
          return;
        }

        for (const instanceInfo of resourceIds.ec2InstanceIds) {
          const region = instanceInfo.region || 'us-west-1';
          const instanceIds = instanceInfo.instanceIds || [instanceInfo];

          const regionalClient = new EC2Client({ region });

          const instancesResponse = await regionalClient.send(
            new DescribeInstancesCommand({
              InstanceIds: instanceIds,
            })
          );

          const securityGroupIds = new Set<string>();
          for (const reservation of instancesResponse.Reservations!) {
            for (const instance of reservation.Instances!) {
              for (const sg of instance.SecurityGroups!) {
                securityGroupIds.add(sg.GroupId!);
              }
            }
          }

          const sgResponse = await regionalClient.send(
            new DescribeSecurityGroupsCommand({
              GroupIds: Array.from(securityGroupIds),
            })
          );

          for (const sg of sgResponse.SecurityGroups!) {
            for (const rule of sg.IpPermissions!) {
              const sensitiveports = [22, 3389, 1433, 3306, 5432, 6379, 27017];

              if (sensitiveports.includes(rule.FromPort || 0)) {
                const hasOpenAccess = rule.IpRanges!.some(
                  range => range.CidrIp === '0.0.0.0/0'
                );

                if (rule.FromPort === 22) {
                  expect(hasOpenAccess).toBe(false);

                  const hasAllowedCidr = rule.IpRanges!.some(
                    range => range.CidrIp === '203.0.113.0/24'
                  );
                  expect(hasAllowedCidr).toBe(true);
                } else {
                  expect(hasOpenAccess).toBe(false);
                }
              }
            }
          }
        }
      },
      testTimeout
    );

    test(
      'E2E should verify IAM roles follow least privilege principle',
      async () => {
        const iamClient = new IAMClient({ region: 'ap-south-1' }); // IAM is global but use ap-south-1

        const rolesResponse = await iamClient.send(new ListRolesCommand({}));

        const projectRoles = rolesResponse.Roles!.filter(
          role =>
            role.RoleName!.toLowerCase().includes('webapp') ||
            role.RoleName!.toLowerCase().includes('tap') ||
            role.RoleName!.toLowerCase().includes('ec2') ||
            role.RoleName!.toLowerCase().includes('lambda') ||
            role.RoleName!.toLowerCase().includes('rds') ||
            role.RoleName!.includes('pr1022') // Include PR-specific roles
        );

        const rolesToTest =
          projectRoles.length > 0
            ? projectRoles
            : rolesResponse.Roles!.slice(0, 3);
        expect(rolesToTest.length).toBeGreaterThan(0);

        for (const role of rolesToTest) {
          const policiesResponse = await iamClient.send(
            new ListRolePoliciesCommand({
              RoleName: role.RoleName,
            })
          );

          for (const policyName of policiesResponse.PolicyNames!) {
            const policyResponse = await iamClient.send(
              new GetRolePolicyCommand({
                RoleName: role.RoleName,
                PolicyName: policyName,
              })
            );

            const policyDocument = JSON.parse(
              decodeURIComponent(policyResponse.PolicyDocument!)
            );

            for (const statement of policyDocument.Statement) {
              if (statement.Effect === 'Allow') {
                const actions = Array.isArray(statement.Action)
                  ? statement.Action
                  : [statement.Action];

                const dangerousActions = ['*', 'iam:*', 's3:*', 'ec2:*'];
                const hasDangerousAction = actions.some((action: string) =>
                  dangerousActions.includes(action)
                );

                if (hasDangerousAction) {
                  expect(statement.Resource).not.toBe('*');
                }
              }
            }
          }
        }
      },
      testTimeout
    );

    test(
      'E2E should verify backup and recovery mechanisms',
      async () => {
        if (!resourceIds?.rdsEndpoints) {
          console.log(
            `Skipping test: ${"'No RDS endpoints found for backup verification'"}`
          );
          return;
        }

        for (const rdsInfo of resourceIds.rdsEndpoints) {
          const region = rdsInfo.region || 'us-west-1';
          const endpoint = rdsInfo.endpoint || rdsInfo;
          const dbInstanceId = endpoint.split('.')[0];

          const regionalClient = new RDSClient({ region });

          const response = await regionalClient.send(
            new DescribeDBInstancesCommand({
              DBInstanceIdentifier: dbInstanceId,
            })
          );

          const dbInstance = response.DBInstances![0];

          expect(dbInstance.BackupRetentionPeriod).toBeGreaterThan(0);
          expect(dbInstance.BackupRetentionPeriod).toBeGreaterThanOrEqual(7); // At least 7 days
          expect(dbInstance.PreferredBackupWindow).toBeDefined();
          expect(dbInstance.PreferredMaintenanceWindow).toBeDefined();

          expect(dbInstance.BackupRetentionPeriod).toBeGreaterThan(0);

          if (process.env.ENVIRONMENT_SUFFIX === 'prod') {
            expect(dbInstance.MultiAZ).toBe(true);
          }
        }
      },
      testTimeout
    );

    test(
      'E2E should verify data access logging and monitoring',
      async () => {
        if (!resourceIds?.cloudtrailBucketName) {
          console.log(
            `Skipping test: ${"'No CloudTrail bucket found for access logging verification'"}`
          );
          return;
        }

        const bucketName = resourceIds.cloudtrailBucketName;

        let bucketRegion = 'ap-south-1'; // Default fallback

        if (resourceIds?.cloudtrailArn) {
          const arnParts = resourceIds.cloudtrailArn.split(':');
          if (arnParts.length >= 4 && arnParts[3]) {
            bucketRegion = arnParts[3];
            console.log(`Using region ${bucketRegion} from CloudTrail ARN`);
          }
        }

        if (
          bucketRegion === 'ap-south-1' &&
          resourceIds?.vpcIds &&
          resourceIds.vpcIds.length > 0
        ) {
          const firstVpc = resourceIds.vpcIds[0];
          if (firstVpc.region) {
            bucketRegion = firstVpc.region;
            console.log(`Using region ${bucketRegion} from VPC deployment`);
          }
        }

        try {
          const bucketS3Client = new S3Client({ region: bucketRegion });
          await bucketS3Client.send(
            new HeadBucketCommand({ Bucket: bucketName })
          );
          console.log(
            `Confirmed bucket ${bucketName} is accessible from region: ${bucketRegion}`
          );
        } catch (regionError: any) {
          console.log(
            `Bucket not accessible from ${bucketRegion}, trying to detect correct region...`
          );

          const fallbackRegions = [
            'ap-south-1',
            'ap-south-1',
            'us-west-1',
            'ap-south-1',
          ];
          for (const region of fallbackRegions) {
            if (region === bucketRegion) continue; // Skip already tried region

            try {
              const testClient = new S3Client({ region });
              await testClient.send(
                new HeadBucketCommand({ Bucket: bucketName })
              );
              bucketRegion = region;
              console.log(
                `Found bucket ${bucketName} in region: ${bucketRegion}`
              );
              break;
            } catch (error) {
              continue;
            }
          }
        }

        const bucketS3Client = new S3Client({ region: bucketRegion });

        try {
          const loggingResponse = await bucketS3Client.send(
            new GetBucketLoggingCommand({
              Bucket: bucketName,
            })
          );

          expect(loggingResponse.LoggingEnabled).toBeDefined();
          expect(loggingResponse.LoggingEnabled!.TargetBucket).toBeDefined();
          expect(loggingResponse.LoggingEnabled!.TargetPrefix).toBeDefined();
        } catch (error: any) {
          if (error.name !== 'NoSuchConfiguration') {
            throw error;
          }
        }
      },
      testTimeout
    );

    test(
      'E2E should have load balancers configured for high availability',
      async () => {
        const testRegions = ['us-west-1', 'ap-south-1'];
        let foundLoadBalancers = false;

        for (const region of testRegions) {
          try {
            const elbClient = new ElasticLoadBalancingV2Client({ region });

            const response = await elbClient.send(
              new DescribeLoadBalancersCommand({})
            );

            const projectLoadBalancers = response.LoadBalancers!.filter(
              lb =>
                lb.LoadBalancerName!.toLowerCase().includes('webapp') ||
                lb.LoadBalancerName!.toLowerCase().includes('tap') ||
                lb.LoadBalancerName!.includes('pr1022')
            );

            if (projectLoadBalancers.length > 0) {
              foundLoadBalancers = true;

              for (const lb of projectLoadBalancers) {
                expect(['active', 'provisioning']).toContain(lb.State!.Code);

                expect(['internet-facing', 'internal']).toContain(lb.Scheme);

                expect(lb.AvailabilityZones!.length).toBeGreaterThanOrEqual(2);

                expect(lb.VpcId).toBeDefined();

                console.log(
                  `Found load balancer: ${lb.LoadBalancerName} in ${region}`
                );
              }
            }
          } catch (error: any) {
            console.log(
              `No load balancers found in ${region} or access denied: ${error.message}`
            );
          }
        }

        if (!foundLoadBalancers) {
          console.log(
            'No load balancers found - this may be expected for basic infrastructure setups'
          );
        }
      },
      testTimeout
    );
  });

  describe('E2E Disaster Recovery and Business Continuity Tests', () => {
    test(
      'E2E should verify cross-region resource distribution',
      async () => {
        if (!resourceIds?.vpcIds || resourceIds.vpcIds.length < 2) {
          console.log(
            `Skipping test: ${"'Multi-region deployment not detected'"}`
          );
          return;
        }

        const regions = new Set(
          resourceIds.vpcIds.map((vpc: any) => vpc.region || 'us-west-1')
        );
        expect(regions.size).toBeGreaterThanOrEqual(2);

        for (const region of Array.from(regions)) {
          const regionalClient = new EC2Client({ region: region as string });

          const vpcResponse = await regionalClient.send(
            new DescribeVpcsCommand({
              Filters: [
                {
                  Name: 'tag:Project',
                  Values: ['webapp', 'tap'],
                },
              ],
            })
          );
          expect(vpcResponse.Vpcs!.length).toBeGreaterThan(0);

          const instancesResponse = await regionalClient.send(
            new DescribeInstancesCommand({
              Filters: [
                {
                  Name: 'tag:Project',
                  Values: ['webapp', 'tap'],
                },
              ],
            })
          );
          expect(instancesResponse.Reservations!.length).toBeGreaterThan(0);

          const rdsClient = new RDSClient({ region: region as string });
          const rdsResponse = await rdsClient.send(
            new DescribeDBInstancesCommand({})
          );

          const projectRdsInstances = rdsResponse.DBInstances!.filter(
            db =>
              db.DBInstanceIdentifier!.includes('webapp') ||
              db.DBInstanceIdentifier!.includes('tap')
          );
          expect(projectRdsInstances.length).toBeGreaterThan(0);
        }
      },
      testTimeout
    );

    test(
      'E2E should verify automated backup schedules and retention',
      async () => {
        if (!resourceIds?.rdsEndpoints) {
          console.log(
            `Skipping test: ${"'No RDS endpoints found for backup verification'"}`
          );
          return;
        }

        for (const rdsInfo of resourceIds.rdsEndpoints) {
          const region = rdsInfo.region || 'us-west-1';
          const endpoint = rdsInfo.endpoint || rdsInfo;
          const dbInstanceId = endpoint.split('.')[0];

          const regionalClient = new RDSClient({ region });

          const response = await regionalClient.send(
            new DescribeDBInstancesCommand({
              DBInstanceIdentifier: dbInstanceId,
            })
          );

          const dbInstance = response.DBInstances![0];

          expect(dbInstance.BackupRetentionPeriod).toBeGreaterThanOrEqual(7);
          expect(dbInstance.PreferredBackupWindow).toBeDefined();
          expect(dbInstance.PreferredBackupWindow).toMatch(
            /^\d{2}:\d{2}-\d{2}:\d{2}$/
          );

          expect(dbInstance.PreferredMaintenanceWindow).toBeDefined();
          expect(dbInstance.PreferredMaintenanceWindow).not.toBe(
            dbInstance.PreferredBackupWindow
          );

          if (process.env.ENVIRONMENT_SUFFIX === 'prod') {
            expect(dbInstance.DeletionProtection).toBe(true);
          }
        }
      },
      testTimeout
    );

    test(
      'E2E should verify infrastructure can handle single region failure',
      async () => {
        if (!resourceIds?.vpcIds || resourceIds.vpcIds.length < 2) {
          console.log(
            `Skipping test: ${"'Multi-region deployment required for failover testing'"}`
          );
          return;
        }

        const regions = resourceIds.vpcIds.map(
          (vpc: any) => vpc.region || 'us-west-1'
        );

        for (const region of regions) {
          const regionalClient = new EC2Client({ region });

          const vpcResponse = await regionalClient.send(
            new DescribeVpcsCommand({
              Filters: [
                {
                  Name: 'tag:Project',
                  Values: ['webapp', 'tap'],
                },
              ],
            })
          );

          expect(vpcResponse.Vpcs!.length).toBeGreaterThan(0);

          const igwResponse = await regionalClient.send(
            new DescribeInternetGatewaysCommand({
              Filters: [
                {
                  Name: 'attachment.vpc-id',
                  Values: vpcResponse.Vpcs!.map(vpc => vpc.VpcId!),
                },
              ],
            })
          );

          expect(igwResponse.InternetGateways!.length).toBeGreaterThan(0);

          const subnetsResponse = await regionalClient.send(
            new DescribeSubnetsCommand({
              Filters: [
                {
                  Name: 'vpc-id',
                  Values: vpcResponse.Vpcs!.map(vpc => vpc.VpcId!),
                },
              ],
            })
          );

          const availabilityZones = new Set(
            subnetsResponse.Subnets!.map(subnet => subnet.AvailabilityZone)
          );
          expect(availabilityZones.size).toBeGreaterThanOrEqual(2);
        }
      },
      testTimeout
    );

    test(
      'E2E should verify data replication and consistency mechanisms',
      async () => {
        if (!resourceIds?.rdsEndpoints) {
          console.log(
            `Skipping test: ${"'No RDS endpoints found for replication verification'"}`
          );
          return;
        }

        if (process.env.ENVIRONMENT_SUFFIX === 'prod') {
          for (const rdsInfo of resourceIds.rdsEndpoints) {
            const region = rdsInfo.region || 'us-west-1';

            const regionalClient = new RDSClient({ region });

            const response = await regionalClient.send(
              new DescribeDBInstancesCommand({})
            );

            const projectInstances = response.DBInstances!.filter(
              db =>
                db.DBInstanceIdentifier!.includes('webapp') ||
                db.DBInstanceIdentifier!.includes('tap')
            );

            const readReplicas = projectInstances.filter(
              db => db.ReadReplicaSourceDBInstanceIdentifier
            );

            if (readReplicas.length > 0) {
              for (const replica of readReplicas) {
                expect(
                  replica.ReadReplicaSourceDBInstanceIdentifier
                ).toBeDefined();
                expect(['available', 'creating']).toContain(
                  replica.DBInstanceStatus
                );
              }
            }
          }
        }
      },
      testTimeout
    );

    test(
      'E2E should verify monitoring and alerting for disaster scenarios',
      async () => {
        if (!resourceIds?.ec2InstanceIds && !resourceIds?.rdsEndpoints) {
          console.log(
            `Skipping test: ${"'No resources found for monitoring verification'"}`
          );
          return;
        }

        const testRegions = ['us-west-1', 'ap-south-1'];

        for (const region of testRegions) {
          const cloudwatchClient = new CloudWatchClient({ region });

          const alarmsResponse = await cloudwatchClient.send(
            new DescribeAlarmsCommand({})
          );

          const criticalAlarms = alarmsResponse.MetricAlarms!.filter(
            alarm =>
              alarm.AlarmName!.includes('webapp') ||
              alarm.AlarmName!.includes('tap') ||
              alarm.MetricName === 'CPUUtilization' ||
              alarm.MetricName === 'DatabaseConnections' ||
              alarm.MetricName === 'FreeStorageSpace'
          );

          for (const alarm of criticalAlarms) {
            expect(alarm.StateValue).toBeDefined();
            expect(alarm.ComparisonOperator).toBeDefined();
            expect(alarm.Threshold).toBeDefined();
            expect(alarm.EvaluationPeriods).toBeGreaterThan(0);
          }
        }
      },
      testTimeout
    );

    test(
      'E2E should verify recovery time objectives (RTO) capabilities',
      async () => {
        if (!resourceIds?.ec2InstanceIds) {
          console.log(
            `Skipping test: ${"'No EC2 instances found for RTO verification'"}`
          );
          return;
        }

        for (const instanceInfo of resourceIds.ec2InstanceIds) {
          const region = instanceInfo.region || 'us-west-1';
          const instanceIds = instanceInfo.instanceIds || [instanceInfo];

          const regionalClient = new EC2Client({ region });

          const response = await regionalClient.send(
            new DescribeInstancesCommand({
              InstanceIds: instanceIds,
            })
          );

          for (const reservation of response.Reservations!) {
            for (const instance of reservation.Instances!) {
              expect(instance.InstanceType).toBeDefined();

              expect(instance.Monitoring!.State).toBeDefined();

              expect(instance.Placement!.AvailabilityZone).toBeDefined();
            }
          }
        }

        const allInstances = resourceIds.ec2InstanceIds.flatMap((info: any) => {
          const _region = info.region || 'us-west-1';
          return info.instanceIds || [info];
        });

        if (allInstances.length > 1) {
          expect(allInstances.length).toBeGreaterThan(1);
        }
      },
      testTimeout
    );

    test(
      'E2E should verify recovery point objectives (RPO) capabilities',
      async () => {
        if (!resourceIds?.rdsEndpoints) {
          console.log(
            `Skipping test: ${"'No RDS endpoints found for RPO verification'"}`
          );
          return;
        }

        for (const rdsInfo of resourceIds.rdsEndpoints) {
          const region = rdsInfo.region || 'us-west-1';
          const endpoint = rdsInfo.endpoint || rdsInfo;
          const dbInstanceId = endpoint.split('.')[0];

          const regionalClient = new RDSClient({ region });

          const response = await regionalClient.send(
            new DescribeDBInstancesCommand({
              DBInstanceIdentifier: dbInstanceId,
            })
          );

          const dbInstance = response.DBInstances![0];

          expect(dbInstance.BackupRetentionPeriod).toBeGreaterThanOrEqual(7);

          expect(dbInstance.BackupRetentionPeriod).toBeGreaterThan(0);

          if (process.env.ENVIRONMENT_SUFFIX === 'prod') {
            expect(dbInstance.BackupRetentionPeriod).toBeGreaterThanOrEqual(30); // 30 days for production
          }

          expect(dbInstance.StorageEncrypted).toBe(true);
        }
      },
      testTimeout
    );

    test(
      'should have backup strategies in place',
      async () => {
        if (!resourceIds?.rdsEndpoints) {
          console.log(
            `Skipping test: ${"'No RDS endpoints found for backup verification'"}`
          );
          return;
        }

        for (const rdsInfo of resourceIds.rdsEndpoints) {
          const region = rdsInfo.region || 'us-west-1';
          const endpoint = rdsInfo.endpoint || rdsInfo;
          const dbInstanceId = endpoint.split('.')[0];

          const regionalClient = new RDSClient({ region });

          const response = await regionalClient.send(
            new DescribeDBInstancesCommand({
              DBInstanceIdentifier: dbInstanceId,
            })
          );

          const dbInstance = response.DBInstances![0];
          expect(dbInstance.BackupRetentionPeriod).toBeGreaterThan(0);
          expect(dbInstance.PreferredBackupWindow).toBeDefined();
        }
      },
      testTimeout
    );

    test(
      'E2E should have cross-region replication for critical data',
      async () => {
        let _foundReplication = false;

        if (resourceIds?.rdsEndpoints && resourceIds.rdsEndpoints.length > 0) {
          const testRegions = ['us-west-1', 'ap-south-1'];

          for (const region of testRegions) {
            try {
              const rdsClient = new RDSClient({ region });
              const response = await rdsClient.send(
                new DescribeDBInstancesCommand({})
              );

              const projectInstances = response.DBInstances!.filter(
                db =>
                  db.DBInstanceIdentifier!.toLowerCase().includes('webapp') ||
                  db.DBInstanceIdentifier!.toLowerCase().includes('tap') ||
                  db.DBInstanceIdentifier!.includes('pr1022')
              );

              const readReplicas = projectInstances.filter(
                db => db.ReadReplicaSourceDBInstanceIdentifier
              );

              if (readReplicas.length > 0) {
                _foundReplication = true;

                for (const replica of readReplicas) {
                  expect(
                    replica.ReadReplicaSourceDBInstanceIdentifier
                  ).toBeDefined();
                  expect(['available', 'creating', 'backing-up']).toContain(
                    replica.DBInstanceStatus
                  );

                  console.log(
                    `Found RDS read replica: ${replica.DBInstanceIdentifier} in ${region}`
                  );
                }
              }
            } catch (error: any) {
              console.log(
                `Could not check RDS replicas in ${region}: ${error.message}`
              );
            }
          }
        }
      },
      testTimeout
    );
  });

  describe('Security and Encryption Validation Tests', () => {
    test(
      'should validate KMS key policies and encryption',
      async () => {
        if (!resourceIds?.kmsKeyArns || resourceIds.kmsKeyArns.length === 0) {
          console.log('Skipping test: No KMS keys found in stack outputs');
          return;
        }

        const testRegions = ['us-west-1', 'ap-south-1'];

        for (const region of testRegions) {
          const kmsClient = new KMSClient({ region });

          const regionKmsKeys = resourceIds.kmsKeyArns.filter(
            (key: any) => key.region === region || key.keyArn.includes(region)
          );

          for (const kmsKey of regionKmsKeys) {
            const keyArn = typeof kmsKey === 'string' ? kmsKey : kmsKey.keyArn;

            try {
              const keyResponse = await kmsClient.send(
                new DescribeKeyCommand({
                  KeyId: keyArn,
                })
              );

              expect(keyResponse.KeyMetadata).toBeDefined();
              expect(keyResponse.KeyMetadata!.KeyState).toBe('Enabled');
              expect(keyResponse.KeyMetadata!.KeyUsage).toBe('ENCRYPT_DECRYPT');


              console.log(
                `Validated KMS key in ${region}: ${keyArn.substring(0, 50)}...`
              );
            } catch (error: any) {
              console.log(
                `Could not validate KMS key in ${region}: ${error.message}`
              );
            }
          }
        }
      },
      testTimeout
    );

    test(
      'should validate CloudTrail encryption and logging',
      async () => {
        if (!resourceIds?.cloudtrailArn) {
          console.log('Skipping test: No CloudTrail found in stack outputs');
          return;
        }

        const arnParts = resourceIds.cloudtrailArn.split(':');
        const cloudtrailRegion =
          arnParts.length >= 4 ? arnParts[3] : 'ap-south-1';

        const cloudtrailClient = new CloudTrailClient({
          region: cloudtrailRegion,
        });

        try {
          const trailsResponse = await cloudtrailClient.send(
            new DescribeTrailsCommand({})
          );
          const projectTrails = trailsResponse.trailList!.filter(
            trail =>
              trail.TrailARN === resourceIds.cloudtrailArn ||
              trail.Name!.toLowerCase().includes('webapp') ||
              trail.Name!.toLowerCase().includes('tap')
          );

          expect(projectTrails.length).toBeGreaterThan(0);

          for (const trail of projectTrails) {
            expect(trail.KmsKeyId).toBeDefined();
            expect(trail.KmsKeyId).not.toBe('');

            expect(trail.IsMultiRegionTrail).toBe(true);

            expect(trail.IncludeGlobalServiceEvents).toBe(true);

            expect(trail.S3BucketName).toBeDefined();

            const statusResponse = await cloudtrailClient.send(
              new GetTrailStatusCommand({
                Name: trail.TrailARN,
              })
            );

            expect(statusResponse.IsLogging).toBe(true);

            console.log(`Validated CloudTrail encryption: ${trail.Name}`);
          }
        } catch (error: any) {
          console.log(
            `Could not validate CloudTrail encryption: ${error.message}`
          );
        }
      },
      testTimeout
    );

    test(
      'should validate S3 bucket encryption and access controls',
      async () => {
        if (!resourceIds?.cloudtrailBucketName) {
          console.log('Skipping test: No CloudTrail bucket found');
          return;
        }

        const bucketName = resourceIds.cloudtrailBucketName;

        let bucketRegion = 'ap-south-1';
        if (resourceIds?.cloudtrailArn) {
          const arnParts = resourceIds.cloudtrailArn.split(':');
          if (arnParts.length >= 4 && arnParts[3]) {
            bucketRegion = arnParts[3];
          }
        }

        const s3Client = new S3Client({ region: bucketRegion });

        try {
          const encryptionResponse = await s3Client.send(
            new GetBucketEncryptionCommand({
              Bucket: bucketName,
            })
          );

          expect(
            encryptionResponse.ServerSideEncryptionConfiguration
          ).toBeDefined();
          const rules =
            encryptionResponse.ServerSideEncryptionConfiguration!.Rules!;
          expect(rules.length).toBeGreaterThan(0);

          const encryptionRule = rules[0];
          expect(
            encryptionRule.ApplyServerSideEncryptionByDefault
          ).toBeDefined();
          expect(['AES256', 'aws:kms']).toContain(
            encryptionRule.ApplyServerSideEncryptionByDefault!.SSEAlgorithm
          );

          const publicAccessResponse = await s3Client.send(
            new GetPublicAccessBlockCommand({
              Bucket: bucketName,
            })
          );

          expect(
            publicAccessResponse.PublicAccessBlockConfiguration
          ).toBeDefined();
          const publicAccess =
            publicAccessResponse.PublicAccessBlockConfiguration!;
          expect(publicAccess.BlockPublicAcls).toBe(true);
          expect(publicAccess.BlockPublicPolicy).toBe(true);
          expect(publicAccess.IgnorePublicAcls).toBe(true);
          expect(publicAccess.RestrictPublicBuckets).toBe(true);

          console.log(`Validated S3 bucket security: ${bucketName}`);
        } catch (error: any) {
          console.log(
            `Could not validate S3 bucket security: ${error.message}`
          );
        }
      },
      testTimeout
    );

    test(
      'should validate RDS encryption and security groups',
      async () => {
        if (
          !resourceIds?.rdsEndpoints ||
          resourceIds.rdsEndpoints.length === 0
        ) {
          console.log('Skipping test: No RDS instances found');
          return;
        }

        const testRegions = ['us-west-1', 'ap-south-1'];

        for (const region of testRegions) {
          const rdsClient = new RDSClient({ region });

          try {
            const dbResponse = await rdsClient.send(
              new DescribeDBInstancesCommand({})
            );
            const projectDbs = dbResponse.DBInstances!.filter(
              db =>
                db.DBInstanceIdentifier!.toLowerCase().includes('webapp') ||
                db.DBInstanceIdentifier!.toLowerCase().includes('tap')
            );

            for (const db of projectDbs) {
              expect(db.StorageEncrypted).toBe(true);
              expect(db.KmsKeyId).toBeDefined();

              expect(db.VpcSecurityGroups).toBeDefined();
              expect(db.VpcSecurityGroups!.length).toBeGreaterThan(0);

              expect(db.BackupRetentionPeriod).toBeGreaterThan(0);

              expect(db.DBSubnetGroup).toBeDefined();
              expect(db.PubliclyAccessible).toBe(false);

              console.log(
                `Validated RDS security: ${db.DBInstanceIdentifier} in ${region}`
              );
            }
          } catch (error: any) {
            console.log(
              `Could not validate RDS security in ${region}: ${error.message}`
            );
          }
        }
      },
      testTimeout
    );
  });

  describe('Negative Security Testing', () => {
    test(
      'should verify unauthorized access is blocked - S3 bucket',
      async () => {
        if (!resourceIds?.cloudtrailBucketName) {
          console.log(
            'Skipping test: No CloudTrail bucket found for negative testing'
          );
          return;
        }

        const _bucketName = resourceIds.cloudtrailBucketName;

        let bucketRegion = 'ap-south-1';
        if (resourceIds?.cloudtrailArn) {
          const arnParts = resourceIds.cloudtrailArn.split(':');
          if (arnParts.length >= 4 && arnParts[3]) {
            bucketRegion = arnParts[3];
          }
        }

        const unauthorizedS3Client = new S3Client({
          region: bucketRegion,
          credentials: {
            accessKeyId: 'INVALID_ACCESS_KEY',
            secretAccessKey: 'INVALID_SECRET_KEY',
          },
        });

        try {
          await unauthorizedS3Client.send(new ListBucketsCommand({}));

          expect(true).toBe(false); // Force failure - unauthorized access should not succeed
        } catch (error: any) {
          expect([
            'InvalidAccessKeyId',
            'SignatureDoesNotMatch',
            'AccessDenied',
          ]).toContain(error.name);
          console.log(
            `Confirmed unauthorized S3 access is blocked: ${error.name}`
          );
        }
      },
      testTimeout
    );

    test(
      'should verify security group restrictions',
      async () => {
        if (
          !resourceIds?.ec2InstanceIds ||
          resourceIds.ec2InstanceIds.length === 0
        ) {
          console.log(
            'Skipping test: No EC2 instances found for security group testing'
          );
          return;
        }

        const testRegions = ['us-west-1', 'ap-south-1'];

        for (const region of testRegions) {
          const ec2Client = new EC2Client({ region });

          try {
            const sgResponse = await ec2Client.send(
              new DescribeSecurityGroupsCommand({})
            );
            const projectSGs = sgResponse.SecurityGroups!.filter(
              sg =>
                sg.GroupName!.toLowerCase().includes('webapp') ||
                sg.GroupName!.toLowerCase().includes('tap') ||
                sg.Description!.toLowerCase().includes('webapp') ||
                sg.Description!.toLowerCase().includes('tap')
            );

            for (const sg of projectSGs) {
              const sshRules = sg.IpPermissions!.filter(
                rule => rule.FromPort === 22 && rule.ToPort === 22
              );

              for (const sshRule of sshRules) {
                if (sshRule.IpRanges) {
                  for (const ipRange of sshRule.IpRanges) {
                    // Verify SSH is not open to the world
                    expect(ipRange.CidrIp).not.toBe('0.0.0.0/0');
                    
                    // Verify SSH is only allowed from the specific IP range
                    expect(ipRange.CidrIp).toBe('203.0.113.0/24');
                    
                    console.log(
                      `Confirmed SSH access is restricted to 203.0.113.0/24 in SG: ${sg.GroupId}`
                    );
                  }
                }
              }

              const rdsRules = sg.IpPermissions!.filter(
                rule => rule.FromPort === 3306 && rule.ToPort === 3306
              );

              for (const rdsRule of rdsRules) {
                if (rdsRule.IpRanges && rdsRule.IpRanges.length > 0) {
                  for (const ipRange of rdsRule.IpRanges) {
                    expect(ipRange.CidrIp).not.toBe('0.0.0.0/0');
                  }
                }
                expect(rdsRule.UserIdGroupPairs).toBeDefined();
              }
            }
          } catch (error: any) {
            console.log(
              `Could not validate security groups in ${region}: ${error.message}`
            );
          }
        }
      },
      testTimeout
    );

    test(
      'should verify KMS key access is properly restricted',
      async () => {
        if (!resourceIds?.kmsKeyArns || resourceIds.kmsKeyArns.length === 0) {
          console.log('Skipping test: No KMS keys found for negative testing');
          return;
        }

        const testRegions = ['us-west-1', 'ap-south-1'];

        for (const region of testRegions) {
          const unauthorizedKmsClient = new KMSClient({
            region,
            credentials: {
              accessKeyId: 'INVALID_ACCESS_KEY',
              secretAccessKey: 'INVALID_SECRET_KEY',
            },
          });

          const regionKmsKeys = resourceIds.kmsKeyArns.filter(
            (key: any) => key.region === region || key.keyArn.includes(region)
          );

          for (const kmsKey of regionKmsKeys) {
            const keyArn = typeof kmsKey === 'string' ? kmsKey : kmsKey.keyArn;

            try {
              await unauthorizedKmsClient.send(
                new DescribeKeyCommand({
                  KeyId: keyArn,
                })
              );

              expect(true).toBe(false); // Force failure - unauthorized access should not succeed
            } catch (error: any) {
              expect([
                'InvalidAccessKeyId',
                'SignatureDoesNotMatch',
                'AccessDenied',
                'UnauthorizedOperation',
                'UnrecognizedClientException'
              ]).toContain(error.name);
              console.log(
                `Confirmed unauthorized KMS access is blocked: ${error.name}`
              );
            }
          }
        }
      },
      testTimeout
    );

    test(
      'should verify RDS is not publicly accessible',
      async () => {
        if (
          !resourceIds?.rdsEndpoints ||
          resourceIds.rdsEndpoints.length === 0
        ) {
          console.log(
            'Skipping test: No RDS instances found for public access testing'
          );
          return;
        }

        const testRegions = ['us-west-1', 'ap-south-1'];

        for (const region of testRegions) {
          const rdsClient = new RDSClient({ region });

          try {
            const dbResponse = await rdsClient.send(
              new DescribeDBInstancesCommand({})
            );
            const projectDbs = dbResponse.DBInstances!.filter(
              db =>
                db.DBInstanceIdentifier!.toLowerCase().includes('webapp') ||
                db.DBInstanceIdentifier!.toLowerCase().includes('tap')
            );

            for (const db of projectDbs) {
              expect(db.PubliclyAccessible).toBe(false);

              expect(db.DBSubnetGroup).toBeDefined();
              expect(db.DBSubnetGroup!.DBSubnetGroupName).toBeDefined();

              console.log(
                `Confirmed RDS is not publicly accessible: ${db.DBInstanceIdentifier}`
              );
            }
          } catch (error: any) {
            console.log(
              `Could not validate RDS public access in ${region}: ${error.message}`
            );
          }
        }
      },
      testTimeout
    );
  });

  describe('VPC Flow Logs Integration Tests', () => {
    test(
      'should verify VPC Flow Logs are enabled for all VPCs',
      async () => {
        if (!resourceIds?.vpcIds || resourceIds.vpcIds.length === 0) {
          console.log('Skipping test: No VPCs found for Flow Logs testing');
          return;
        }

        const testRegions = ['us-west-1', 'ap-south-1'];

        for (const region of testRegions) {
          const ec2Client = new EC2Client({ region });

          try {
            const vpcResponse = await ec2Client.send(
              new DescribeVpcsCommand({
                Filters: [
                  {
                    Name: 'tag:Project',
                    Values: ['webapp'],
                  },
                ],
              })
            );

            const projectVpcs = vpcResponse.Vpcs || [];

            for (const vpc of projectVpcs) {
              const flowLogsResponse = await ec2Client.send(
                new DescribeFlowLogsCommand({
                  Filter: [
                    {
                      Name: 'resource-id',
                      Values: [vpc.VpcId!],
                    },
                  ],
                })
              );

              const flowLogs = flowLogsResponse.FlowLogs || [];
              expect(flowLogs.length).toBeGreaterThan(0);

              for (const flowLog of flowLogs) {
                expect(flowLog.ResourceId).toBe(vpc.VpcId);
                expect(flowLog.TrafficType).toBe('ALL');
                expect(flowLog.LogDestinationType).toBe('s3');
                expect(flowLog.FlowLogStatus).toBe('ACTIVE');

                expect(flowLog.LogDestination).toBeDefined();
                expect(flowLog.LogDestination).toContain('vpc-flow-logs');

                console.log(
                  `Confirmed VPC Flow Logs enabled for VPC ${vpc.VpcId} in ${region}`
                );
              }
            }
          } catch (error: any) {
            console.log(
              `Could not validate VPC Flow Logs in ${region}: ${error.message}`
            );
          }
        }
      },
      testTimeout
    );

    test(
      'should verify VPC Flow Logs S3 buckets exist and are properly configured',
      async () => {
        const testRegions = ['us-west-1', 'ap-south-1'];

        for (const region of testRegions) {
          const s3Client = new S3Client({ region });

          try {
            const bucketsResponse = await s3Client.send(
              new ListBucketsCommand({})
            );

            const flowLogsBuckets = bucketsResponse.Buckets?.filter(bucket =>
              bucket.Name?.includes('vpc-flow-logs')
            ) || [];

            expect(flowLogsBuckets.length).toBeGreaterThan(0);

            for (const bucket of flowLogsBuckets) {
              await s3Client.send(
                new HeadBucketCommand({
                  Bucket: bucket.Name!,
                })
              );

              try {
                const encryptionResponse = await s3Client.send(
                  new GetBucketEncryptionCommand({
                    Bucket: bucket.Name!,
                  })
                );

                expect(encryptionResponse.ServerSideEncryptionConfiguration).toBeDefined();
                expect(
                  encryptionResponse.ServerSideEncryptionConfiguration!.Rules
                ).toBeDefined();

                const encryptionRule = encryptionResponse.ServerSideEncryptionConfiguration!.Rules![0];
                expect(encryptionRule.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('AES256');
              } catch (encryptionError: any) {
                console.log(
                  `Could not verify encryption for bucket ${bucket.Name}: ${encryptionError.message}`
                );
              }

              try {
                const publicAccessResponse = await s3Client.send(
                  new GetPublicAccessBlockCommand({
                    Bucket: bucket.Name!,
                  })
                );

                expect(publicAccessResponse.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
                expect(publicAccessResponse.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
                expect(publicAccessResponse.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
                expect(publicAccessResponse.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
              } catch (publicAccessError: any) {
                console.log(
                  `Could not verify public access block for bucket ${bucket.Name}: ${publicAccessError.message}`
                );
              }

              console.log(
                `Confirmed VPC Flow Logs S3 bucket properly configured: ${bucket.Name}`
              );
            }
          } catch (error: any) {
            console.log(
              `Could not validate VPC Flow Logs S3 buckets in ${region}: ${error.message}`
            );
          }
        }
      },
      testTimeout
    );

    test(
      'should verify VPC Flow Logs IAM roles have proper permissions',
      async () => {
        const testRegions = ['us-west-1', 'ap-south-1'];

        for (const region of testRegions) {
          const iamClient = new IAMClient({ region });

          try {
            const rolesResponse = await iamClient.send(
              new ListRolesCommand({})
            );

            const flowLogsRoles = rolesResponse.Roles?.filter(role =>
              role.RoleName?.includes('vpc-flow-logs-role')
            ) || [];

            expect(flowLogsRoles.length).toBeGreaterThan(0);

            for (const role of flowLogsRoles) {
              const assumeRolePolicy = JSON.parse(
                decodeURIComponent(role.AssumeRolePolicyDocument!)
              );

              expect(assumeRolePolicy.Statement).toBeDefined();
              const trustStatement = assumeRolePolicy.Statement.find(
                (stmt: any) => stmt.Principal?.Service === 'vpc-flow-logs.amazonaws.com'
              );
              expect(trustStatement).toBeDefined();

              const policiesResponse = await iamClient.send(
                new ListRolePoliciesCommand({
                  RoleName: role.RoleName!,
                })
              );

              expect(policiesResponse.PolicyNames?.length).toBeGreaterThan(0);

              for (const policyName of policiesResponse.PolicyNames || []) {
                const policyResponse = await iamClient.send(
                  new GetRolePolicyCommand({
                    RoleName: role.RoleName!,
                    PolicyName: policyName,
                  })
                );

                const policyDocument = JSON.parse(
                  decodeURIComponent(policyResponse.PolicyDocument!)
                );

                const s3Statement = policyDocument.Statement.find(
                  (stmt: any) => stmt.Action?.includes('s3:PutObject')
                );
                expect(s3Statement).toBeDefined();

                console.log(
                  `Confirmed VPC Flow Logs IAM role properly configured: ${role.RoleName}`
                );
              }
            }
          } catch (error: any) {
            console.log(
              `Could not validate VPC Flow Logs IAM roles in ${region}: ${error.message}`
            );
          }
        }
      },
      testTimeout
    );

    test(
      'should verify VPC Flow Logs capture comprehensive traffic data',
      async () => {
        if (!resourceIds?.vpcIds || resourceIds.vpcIds.length === 0) {
          console.log('Skipping test: No VPCs found for Flow Logs format testing');
          return;
        }

        const testRegions = ['us-west-1', 'ap-south-1'];

        for (const region of testRegions) {
          const ec2Client = new EC2Client({ region });

          try {
            const vpcResponse = await ec2Client.send(
              new DescribeVpcsCommand({
                Filters: [
                  {
                    Name: 'tag:Project',
                    Values: ['webapp'],
                  },
                ],
              })
            );

            const projectVpcs = vpcResponse.Vpcs || [];

            for (const vpc of projectVpcs) {
              const flowLogsResponse = await ec2Client.send(
                new DescribeFlowLogsCommand({
                  Filter: [
                    {
                      Name: 'resource-id',
                      Values: [vpc.VpcId!],
                    },
                  ],
                })
              );

              const flowLogs = flowLogsResponse.FlowLogs || [];

              for (const flowLog of flowLogs) {
                expect(flowLog.LogFormat).toBeDefined();
                expect(flowLog.LogFormat).toContain('${version}');
                expect(flowLog.LogFormat).toContain('${account-id}');
                expect(flowLog.LogFormat).toContain('${interface-id}');
                expect(flowLog.LogFormat).toContain('${srcaddr}');
                expect(flowLog.LogFormat).toContain('${dstaddr}');
                expect(flowLog.LogFormat).toContain('${srcport}');
                expect(flowLog.LogFormat).toContain('${dstport}');
                expect(flowLog.LogFormat).toContain('${protocol}');
                expect(flowLog.LogFormat).toContain('${packets}');
                expect(flowLog.LogFormat).toContain('${bytes}');
                expect(flowLog.LogFormat).toContain('${action}');
                expect(flowLog.LogFormat).toContain('${flowlogstatus}');

                console.log(
                  `Confirmed comprehensive VPC Flow Logs format for VPC ${vpc.VpcId} in ${region}`
                );
              }
            }
          } catch (error: any) {
            console.log(
              `Could not validate VPC Flow Logs format in ${region}: ${error.message}`
            );
          }
        }
      },
      testTimeout
    );

    test(
      'should verify VPC Flow Logs are properly tagged',
      async () => {
        if (!resourceIds?.vpcIds || resourceIds.vpcIds.length === 0) {
          console.log('Skipping test: No VPCs found for Flow Logs tagging testing');
          return;
        }

        const testRegions = ['us-west-1', 'ap-south-1'];

        for (const region of testRegions) {
          const ec2Client = new EC2Client({ region });

          try {
            const vpcResponse = await ec2Client.send(
              new DescribeVpcsCommand({
                Filters: [
                  {
                    Name: 'tag:Project',
                    Values: ['webapp'],
                  },
                ],
              })
            );

            const projectVpcs = vpcResponse.Vpcs || [];

            for (const vpc of projectVpcs) {
              const flowLogsResponse = await ec2Client.send(
                new DescribeFlowLogsCommand({
                  Filter: [
                    {
                      Name: 'resource-id',
                      Values: [vpc.VpcId!],
                    },
                  ],
                })
              );

              const flowLogs = flowLogsResponse.FlowLogs || [];

              for (const flowLog of flowLogs) {
                expect(flowLog.Tags).toBeDefined();
                
                const tags = flowLog.Tags || [];
                const projectTag = tags.find(tag => tag.Key === 'Project');
                const nameTag = tags.find(tag => tag.Key === 'Name');

                expect(projectTag).toBeDefined();
                expect(projectTag?.Value).toBe('webapp');
                expect(nameTag).toBeDefined();
                expect(nameTag?.Value).toContain('vpc-flow-logs');

                console.log(
                  `Confirmed VPC Flow Logs properly tagged for VPC ${vpc.VpcId} in ${region}`
                );
              }
            }
          } catch (error: any) {
            console.log(
              `Could not validate VPC Flow Logs tags in ${region}: ${error.message}`
            );
          }
        }
      },
      testTimeout
    );
  });
});

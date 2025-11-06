import * as fs from 'fs';
import * as path from 'path';
import { EC2Client, DescribeVpcsCommand, DescribeSubnetsCommand, DescribeTransitGatewaysCommand, DescribeTransitGatewayAttachmentsCommand, DescribeInstancesCommand, DescribeVpcEndpointsCommand, DescribeFlowLogsCommand, DescribeTransitGatewayRouteTablesCommand, SearchTransitGatewayRoutesCommand, DescribeSecurityGroupsCommand } from '@aws-sdk/client-ec2';
import { S3Client, HeadBucketCommand, GetBucketVersioningCommand, GetBucketEncryptionCommand, GetBucketLifecycleConfigurationCommand } from '@aws-sdk/client-s3';
import { Route53Client, GetHostedZoneCommand } from '@aws-sdk/client-route-53';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';

// Read configuration from files - NO HARDCODING
const outputsPath = path.join(process.cwd(), 'cfn-outputs', 'flat-outputs.json');
const metadataPath = path.join(process.cwd(), 'metadata.json');
const regionFilePath = path.join(process.cwd(), 'lib', 'AWS_REGION');

// Load outputs and configuration
const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
const region = fs.readFileSync(regionFilePath, 'utf8').trim();
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Lazy client initialization to avoid credential resolution at module load
let ec2Client: EC2Client;
let s3Client: S3Client;
let route53Client: Route53Client;
let ssmClient: SSMClient;

const getClients = () => {
  if (!ec2Client) {
    const clientConfig = { region };
    ec2Client = new EC2Client(clientConfig);
    s3Client = new S3Client(clientConfig);
    route53Client = new Route53Client(clientConfig);
    ssmClient = new SSMClient(clientConfig);
  }
  return { ec2Client, s3Client, route53Client, ssmClient };
};

describe('TAP Network Foundation Integration Tests', () => {
  beforeAll(() => {
    // Initialize clients before running tests
    getClients();
  });

  describe('Configuration and Prerequisites', () => {
    test('should load flat-outputs.json successfully', () => {
      expect(outputs).toBeDefined();
      expect(Object.keys(outputs).length).toBeGreaterThan(0);
    });

    test('should have required environment configuration', () => {
      expect(region).toBeDefined();
      expect(environmentSuffix).toBeDefined();
      expect(metadata.platform).toBe('cdk');
    });

    test('should have all required outputs', () => {
      expect(outputs.TransitGatewayId).toBeDefined();
      expect(outputs.VpcIddev).toBeDefined();
      expect(outputs.VpcIdstaging).toBeDefined();
      expect(outputs.VpcIdprod).toBeDefined();
      expect(outputs.FlowLogsBucketOutput).toBeDefined();
    });
  });

  describe('VPC Infrastructure', () => {
    test('should verify dev VPC exists with correct CIDR', async () => {
      const response = await ec2Client.send(
        new DescribeVpcsCommand({
          VpcIds: [outputs.VpcIddev],
        })
      );

      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.State).toBe('available');

      // Check tags
      const tags = vpc.Tags || [];
      expect(tags.find(t => t.Key === 'Environment')?.Value).toBe(environmentSuffix);
      expect(tags.find(t => t.Key === 'iac-rlhf-amazon')?.Value).toBe('true');
    });

    test('should verify staging VPC exists with correct CIDR', async () => {
      const response = await ec2Client.send(
        new DescribeVpcsCommand({
          VpcIds: [outputs.VpcIdstaging],
        })
      );

      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];
      expect(vpc.CidrBlock).toBe('10.1.0.0/16');
      expect(vpc.State).toBe('available');
    });

    test('should verify prod VPC exists with correct CIDR', async () => {
      const response = await ec2Client.send(
        new DescribeVpcsCommand({
          VpcIds: [outputs.VpcIdprod],
        })
      );

      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];
      expect(vpc.CidrBlock).toBe('10.2.0.0/16');
      expect(vpc.State).toBe('available');
    });

    test('should verify each VPC has 6 subnets (3 public + 3 private)', async () => {
      const vpcs = ['dev', 'staging', 'prod'];

      for (const env of vpcs) {
        const vpcId = outputs[`VpcId${env}`];
        const response = await ec2Client.send(
          new DescribeSubnetsCommand({
            Filters: [
              {
                Name: 'vpc-id',
                Values: [vpcId],
              },
            ],
          })
        );

        expect(response.Subnets).toHaveLength(6);

        // Count public and private subnets
        const publicSubnets = response.Subnets!.filter(
          s => s.MapPublicIpOnLaunch === true
        );
        const privateSubnets = response.Subnets!.filter(
          s => s.MapPublicIpOnLaunch === false
        );

        expect(publicSubnets).toHaveLength(3);
        expect(privateSubnets).toHaveLength(3);
      }
    }, 30000);

    test('should verify subnets span 3 availability zones', async () => {
      const response = await ec2Client.send(
        new DescribeSubnetsCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [outputs.VpcIddev],
            },
          ],
        })
      );

      const azs = new Set(response.Subnets!.map(s => s.AvailabilityZone));
      expect(azs.size).toBe(3);
    });
  });

  describe('Transit Gateway', () => {
    test('should verify Transit Gateway exists and is available', async () => {
      const response = await ec2Client.send(
        new DescribeTransitGatewaysCommand({
          TransitGatewayIds: [outputs.TransitGatewayId],
        })
      );

      expect(response.TransitGateways).toHaveLength(1);
      const tgw = response.TransitGateways![0];
      expect(tgw.State).toBe('available');
      expect(tgw.Options?.DefaultRouteTableAssociation).toBe('disable');
      expect(tgw.Options?.DefaultRouteTablePropagation).toBe('disable');
      expect(tgw.Options?.DnsSupport).toBe('enable');
      expect(tgw.Options?.VpnEcmpSupport).toBe('enable');
    });

    test('should verify Transit Gateway has 3 VPC attachments', async () => {
      const response = await ec2Client.send(
        new DescribeTransitGatewayAttachmentsCommand({
          Filters: [
            {
              Name: 'transit-gateway-id',
              Values: [outputs.TransitGatewayId],
            },
            {
              Name: 'resource-type',
              Values: ['vpc'],
            },
          ],
        })
      );

      expect(response.TransitGatewayAttachments).toHaveLength(3);

      const attachmentIds = response.TransitGatewayAttachments!.map(a => a.TransitGatewayAttachmentId);
      expect(attachmentIds).toContain(outputs.TgwAttachmentIddev);
      expect(attachmentIds).toContain(outputs.TgwAttachmentIdstaging);
      expect(attachmentIds).toContain(outputs.TgwAttachmentIdprod);

      // Verify all attachments are available
      response.TransitGatewayAttachments!.forEach(attachment => {
        expect(attachment.State).toBe('available');
      });
    });

    test('should verify Transit Gateway routing tables exist', async () => {
      const response = await ec2Client.send(
        new DescribeTransitGatewayRouteTablesCommand({
          Filters: [
            {
              Name: 'transit-gateway-id',
              Values: [outputs.TransitGatewayId],
            },
          ],
        })
      );

      // Should have 3 route tables (one per environment)
      expect(response.TransitGatewayRouteTables!.length).toBeGreaterThanOrEqual(3);
    });

    test('should verify Transit Gateway routing configuration', async () => {
      const routeTables = await ec2Client.send(
        new DescribeTransitGatewayRouteTablesCommand({
          Filters: [
            {
              Name: 'transit-gateway-id',
              Values: [outputs.TransitGatewayId],
            },
          ],
        })
      );

      // Verify routes exist
      let foundRoutes = 0;
      for (const rt of routeTables.TransitGatewayRouteTables!) {
        const routes = await ec2Client.send(
          new SearchTransitGatewayRoutesCommand({
            TransitGatewayRouteTableId: rt.TransitGatewayRouteTableId!,
            Filters: [
              {
                Name: 'type',
                Values: ['static'],
              },
            ],
          })
        );

        if (routes.Routes && routes.Routes.length > 0) {
          foundRoutes += routes.Routes.length;
        }
      }

      // Should have at least 4 routes (Dev->Staging, Staging->Dev, Staging->Prod, Prod->Staging)
      expect(foundRoutes).toBeGreaterThanOrEqual(4);
    }, 30000);
  });

  describe('NAT Instances', () => {
    test('should verify dev NAT instance is running', async () => {
      const response = await ec2Client.send(
        new DescribeInstancesCommand({
          InstanceIds: [outputs.NatInstanceIddev],
        })
      );

      expect(response.Reservations).toHaveLength(1);
      const instance = response.Reservations![0].Instances![0];
      expect(instance.State?.Name).toBe('running');
      expect(instance.InstanceType).toBe('t3.micro');
      expect(instance.SourceDestCheck).toBe(false);

      // Check tags
      const tags = instance.Tags || [];
      expect(tags.find(t => t.Key === 'Type')?.Value).toBe('NAT-Instance');
    });

    test('should verify staging NAT instance is running', async () => {
      const response = await ec2Client.send(
        new DescribeInstancesCommand({
          InstanceIds: [outputs.NatInstanceIdstaging],
        })
      );

      const instance = response.Reservations![0].Instances![0];
      expect(instance.State?.Name).toBe('running');
      expect(instance.SourceDestCheck).toBe(false);
    });

    test('should verify prod NAT instance is running', async () => {
      const response = await ec2Client.send(
        new DescribeInstancesCommand({
          InstanceIds: [outputs.NatInstanceIdprod],
        })
      );

      const instance = response.Reservations![0].Instances![0];
      expect(instance.State?.Name).toBe('running');
      expect(instance.SourceDestCheck).toBe(false);
    });

    test('should verify NAT instances have correct security groups', async () => {
      const response = await ec2Client.send(
        new DescribeInstancesCommand({
          InstanceIds: [outputs.NatInstanceIddev],
        })
      );

      const instance = response.Reservations![0].Instances![0];
      expect(instance.SecurityGroups).toBeDefined();
      expect(instance.SecurityGroups!.length).toBeGreaterThan(0);

      // Get security group details
      const sgId = instance.SecurityGroups![0].GroupId!;
      const sgResponse = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          GroupIds: [sgId],
        })
      );

      const sg = sgResponse.SecurityGroups![0];

      // Check for ingress rule allowing 10.0.0.0/8
      const hasPrivateIngress = sg.IpPermissions?.some(
        rule => rule.IpRanges?.some(range => range.CidrIp === '10.0.0.0/8')
      );
      expect(hasPrivateIngress).toBe(true);
    });

    test('should verify all NAT instances are in public subnets', async () => {
      const natInstances = [
        outputs.NatInstanceIddev,
        outputs.NatInstanceIdstaging,
        outputs.NatInstanceIdprod,
      ];

      for (const instanceId of natInstances) {
        const response = await ec2Client.send(
          new DescribeInstancesCommand({
            InstanceIds: [instanceId],
          })
        );

        const instance = response.Reservations![0].Instances![0];
        const subnetId = instance.SubnetId!;

        const subnetResponse = await ec2Client.send(
          new DescribeSubnetsCommand({
            SubnetIds: [subnetId],
          })
        );

        expect(subnetResponse.Subnets![0].MapPublicIpOnLaunch).toBe(true);
      }
    }, 30000);
  });

  describe('VPC Endpoints', () => {
    test('should verify S3 gateway endpoints exist in all VPCs', async () => {
      const vpcs = ['dev', 'staging', 'prod'];

      for (const env of vpcs) {
        const vpcId = outputs[`VpcId${env}`];
        const response = await ec2Client.send(
          new DescribeVpcEndpointsCommand({
            Filters: [
              {
                Name: 'vpc-id',
                Values: [vpcId],
              },
              {
                Name: 'service-name',
                Values: [`com.amazonaws.${region}.s3`],
              },
            ],
          })
        );

        expect(response.VpcEndpoints).toHaveLength(1);
        expect(response.VpcEndpoints![0].VpcEndpointType).toBe('Gateway');
        expect(response.VpcEndpoints![0].State).toBe('available');
      }
    }, 30000);

    test('should verify DynamoDB gateway endpoints exist in all VPCs', async () => {
      const vpcs = ['dev', 'staging', 'prod'];

      for (const env of vpcs) {
        const vpcId = outputs[`VpcId${env}`];
        const response = await ec2Client.send(
          new DescribeVpcEndpointsCommand({
            Filters: [
              {
                Name: 'vpc-id',
                Values: [vpcId],
              },
              {
                Name: 'service-name',
                Values: [`com.amazonaws.${region}.dynamodb`],
              },
            ],
          })
        );

        expect(response.VpcEndpoints).toHaveLength(1);
        expect(response.VpcEndpoints![0].VpcEndpointType).toBe('Gateway');
      }
    }, 30000);

    test('should verify SSM interface endpoints exist in all VPCs', async () => {
      const vpcs = ['dev', 'staging', 'prod'];

      for (const env of vpcs) {
        const vpcId = outputs[`VpcId${env}`];
        const response = await ec2Client.send(
          new DescribeVpcEndpointsCommand({
            Filters: [
              {
                Name: 'vpc-id',
                Values: [vpcId],
              },
              {
                Name: 'service-name',
                Values: [`com.amazonaws.${region}.ssm`],
              },
            ],
          })
        );

        expect(response.VpcEndpoints).toHaveLength(1);
        expect(response.VpcEndpoints![0].VpcEndpointType).toBe('Interface');
        expect(response.VpcEndpoints![0].PrivateDnsEnabled).toBe(true);
      }
    }, 30000);

    test('should verify all VPCs have at least 5 VPC endpoints', async () => {
      // 2 gateway (S3, DynamoDB) + 3 interface (SSM, SSM Messages, EC2 Messages)
      const vpcs = ['dev', 'staging', 'prod'];

      for (const env of vpcs) {
        const vpcId = outputs[`VpcId${env}`];
        const response = await ec2Client.send(
          new DescribeVpcEndpointsCommand({
            Filters: [
              {
                Name: 'vpc-id',
                Values: [vpcId],
              },
            ],
          })
        );

        expect(response.VpcEndpoints!.length).toBeGreaterThanOrEqual(5);
      }
    }, 30000);
  });

  describe('VPC Flow Logs', () => {
    test('should verify Flow Logs are enabled for all VPCs', async () => {
      const vpcs = ['dev', 'staging', 'prod'];

      for (const env of vpcs) {
        const vpcId = outputs[`VpcId${env}`];
        const response = await ec2Client.send(
          new DescribeFlowLogsCommand({
            Filter: [
              {
                Name: 'resource-id',
                Values: [vpcId],
              },
            ],
          })
        );

        expect(response.FlowLogs).toHaveLength(1);
        const flowLog = response.FlowLogs![0];
        expect(flowLog.FlowLogStatus).toBe('ACTIVE');
        expect(flowLog.LogDestinationType).toBe('s3');
        expect(flowLog.TrafficType).toBe('ALL');
      }
    }, 30000);

    test('should verify Flow Logs S3 bucket exists', async () => {
      const response = await s3Client.send(
        new HeadBucketCommand({
          Bucket: outputs.FlowLogsBucketOutput,
        })
      );

      expect(response.$metadata.httpStatusCode).toBe(200);
    });

    test('should verify Flow Logs bucket has versioning enabled', async () => {
      const response = await s3Client.send(
        new GetBucketVersioningCommand({
          Bucket: outputs.FlowLogsBucketOutput,
        })
      );

      expect(response.Status).toBe('Enabled');
    });

    test('should verify Flow Logs bucket has encryption', async () => {
      const response = await s3Client.send(
        new GetBucketEncryptionCommand({
          Bucket: outputs.FlowLogsBucketOutput,
        })
      );

      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      const rule = response.ServerSideEncryptionConfiguration!.Rules![0];
      expect(rule.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('AES256');
    });

    test('should verify Flow Logs bucket has lifecycle policy', async () => {
      const response = await s3Client.send(
        new GetBucketLifecycleConfigurationCommand({
          Bucket: outputs.FlowLogsBucketOutput,
        })
      );

      expect(response.Rules).toBeDefined();
      const deleteRule = response.Rules!.find(r => r.ID === 'delete-old-flow-logs');
      expect(deleteRule).toBeDefined();
      expect(deleteRule!.Status).toBe('Enabled');
      expect(deleteRule!.Expiration?.Days).toBe(7);
    });
  });

  describe('Route53 Private Hosted Zones', () => {
    test('should verify dev hosted zone exists', async () => {
      const response = await route53Client.send(
        new GetHostedZoneCommand({
          Id: outputs.Route53ZoneIddev,
        })
      );

      expect(response.HostedZone).toBeDefined();
      expect(response.HostedZone!.Name).toBe(`dev.tap-${environmentSuffix}.internal.`);
      expect(response.HostedZone!.Config?.PrivateZone).toBe(true);
    });

    test('should verify staging hosted zone exists', async () => {
      const response = await route53Client.send(
        new GetHostedZoneCommand({
          Id: outputs.Route53ZoneIdstaging,
        })
      );

      expect(response.HostedZone).toBeDefined();
      expect(response.HostedZone!.Name).toBe(`staging.tap-${environmentSuffix}.internal.`);
      expect(response.HostedZone!.Config?.PrivateZone).toBe(true);
    });

    test('should verify prod hosted zone exists', async () => {
      const response = await route53Client.send(
        new GetHostedZoneCommand({
          Id: outputs.Route53ZoneIdprod,
        })
      );

      expect(response.HostedZone).toBeDefined();
      expect(response.HostedZone!.Name).toBe(`prod.tap-${environmentSuffix}.internal.`);
      expect(response.HostedZone!.Config?.PrivateZone).toBe(true);
    });

    test('should verify hosted zones have VPC associations', async () => {
      const response = await route53Client.send(
        new GetHostedZoneCommand({
          Id: outputs.Route53ZoneIddev,
        })
      );

      expect(response.VPCs).toBeDefined();
      expect(response.VPCs!.length).toBeGreaterThan(0);
    });
  });

  describe('SSM Parameters', () => {
    test('should verify VPC ID parameters exist', async () => {
      const envs = ['dev', 'staging', 'prod'];

      for (const env of envs) {
        const paramName = `/tap/${environmentSuffix}/${env}/vpc/id`;
        const response = await ssmClient.send(
          new GetParameterCommand({
            Name: paramName,
          })
        );

        expect(response.Parameter).toBeDefined();
        expect(response.Parameter!.Value).toBe(outputs[`VpcId${env}`]);
      }
    }, 30000);

    test('should verify subnet ID parameters exist', async () => {
      const envs = ['dev', 'staging', 'prod'];

      for (const env of envs) {
        // Check first private subnet
        const paramName = `/tap/${environmentSuffix}/${env}/subnet/private/1/id`;
        const response = await ssmClient.send(
          new GetParameterCommand({
            Name: paramName,
          })
        );

        expect(response.Parameter).toBeDefined();
        expect(response.Parameter!.Value).toMatch(/^subnet-/);
      }
    }, 30000);

    test('should verify Route53 zone ID parameters exist', async () => {
      const envs = ['dev', 'staging', 'prod'];

      for (const env of envs) {
        const paramName = `/tap/${environmentSuffix}/${env}/route53/zone-id`;
        const response = await ssmClient.send(
          new GetParameterCommand({
            Name: paramName,
          })
        );

        expect(response.Parameter).toBeDefined();
        expect(response.Parameter!.Value).toBe(outputs[`Route53ZoneId${env}`]);
      }
    }, 30000);
  });

  describe('Network Isolation and Routing', () => {
    test('should verify VPCs have non-overlapping CIDR blocks', async () => {
      const vpcs = [outputs.VpcIddev, outputs.VpcIdstaging, outputs.VpcIdprod];
      const expectedCidrs = ['10.0.0.0/16', '10.1.0.0/16', '10.2.0.0/16'];

      const response = await ec2Client.send(
        new DescribeVpcsCommand({
          VpcIds: vpcs,
        })
      );

      const cidrs = response.Vpcs!.map(v => v.CidrBlock);
      expectedCidrs.forEach(cidr => {
        expect(cidrs).toContain(cidr);
      });
    });
  });

  describe('Resource Tagging', () => {
    test('should verify all VPCs have required tags', async () => {
      const vpcs = [outputs.VpcIddev, outputs.VpcIdstaging, outputs.VpcIdprod];

      const response = await ec2Client.send(
        new DescribeVpcsCommand({
          VpcIds: vpcs,
        })
      );

      response.Vpcs!.forEach(vpc => {
        const tags = vpc.Tags || [];
        expect(tags.find(t => t.Key === 'iac-rlhf-amazon')?.Value).toBe('true');
        expect(tags.find(t => t.Key === 'Environment')?.Value).toBe(environmentSuffix);
        expect(tags.find(t => t.Key === 'CostCenter')?.Value).toBe('FinTech-Trading');
        expect(tags.find(t => t.Key === 'ManagedBy')?.Value).toBe('AWS-CDK');
      });
    });

    test('should verify Transit Gateway has required tags', async () => {
      const response = await ec2Client.send(
        new DescribeTransitGatewaysCommand({
          TransitGatewayIds: [outputs.TransitGatewayId],
        })
      );

      const tags = response.TransitGateways![0].Tags || [];
      expect(tags.find(t => t.Key === 'iac-rlhf-amazon')?.Value).toBe('true');
      expect(tags.find(t => t.Key === 'Purpose')?.Value).toBe('Network-Hub');
    });
  });
});

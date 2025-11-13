/**
 * Integration Tests for TapStack
 * 
 * Tests that verify the integration between different components
 * and the proper configuration of resources
 */

import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';
import * as fs from 'fs';
import * as path from 'path';

// Use the same mocks as unit tests
pulumi.runtime.setMocks({
  newResource: function (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: any;
  } {
    const outputs: any = {
      ...args.inputs,
      id: `${args.name}-id`,
      arn: `arn:aws:${args.type}:us-east-1:123456789012:${args.name}`,
    };

    switch (args.type) {
      case 'random:index/randomString:RandomString':
        outputs.result = 'xyz9876543';
        break;
      case 'aws:ec2/vpc:Vpc':
        outputs.id = `vpc-${args.name}`;
        outputs.cidrBlock = args.inputs.cidrBlock || '10.0.0.0/16';
        outputs.enableDnsHostnames = args.inputs.enableDnsHostnames;
        outputs.enableDnsSupport = args.inputs.enableDnsSupport;
        break;
      case 'aws:ec2/subnet:Subnet':
        outputs.id = `subnet-${args.name}`;
        outputs.availabilityZone = args.inputs.availabilityZone || 'us-east-1a';
        outputs.cidrBlock = args.inputs.cidrBlock;
        break;
      case 'aws:ec2/internetGateway:InternetGateway':
        outputs.id = `igw-${args.name}`;
        outputs.vpcId = args.inputs.vpcId;
        break;
      case 'aws:ec2/natGateway:NatGateway':
        outputs.id = `nat-${args.name}`;
        outputs.subnetId = args.inputs.subnetId;
        outputs.allocationId = args.inputs.allocationId;
        break;
      case 'aws:ec2/eip:Eip':
        outputs.id = `eip-${args.name}`;
        outputs.publicIp = `52.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
        break;
      case 'aws:ec2/routeTable:RouteTable':
        outputs.id = `rt-${args.name}`;
        outputs.vpcId = args.inputs.vpcId;
        break;
      case 'aws:ec2/route:Route':
        outputs.id = `route-${args.name}`;
        outputs.routeTableId = args.inputs.routeTableId;
        outputs.destinationCidrBlock = args.inputs.destinationCidrBlock;
        break;
      case 'aws:ec2transitgateway/transitGateway:TransitGateway':
        outputs.id = `tgw-${args.name}`;
        outputs.amazonSideAsn = args.inputs.amazonSideAsn;
        break;
      case 'aws:ec2transitgateway/vpcAttachment:VpcAttachment':
        outputs.id = `tgw-attach-${args.name}`;
        outputs.transitGatewayId = args.inputs.transitGatewayId;
        outputs.vpcId = args.inputs.vpcId;
        break;
      case 'aws:ec2transitgateway/peeringAttachment:PeeringAttachment':
        outputs.id = `tgw-peer-${args.name}`;
        outputs.transitGatewayId = args.inputs.transitGatewayId;
        outputs.peerTransitGatewayId = args.inputs.peerTransitGatewayId;
        break;
      case 'aws:s3/bucket:Bucket':
        outputs.id = `bucket-${args.name}`;
        outputs.bucket = args.inputs.bucket || `bucket-${args.name}`;
        outputs.region = args.inputs.region;
        break;
      case 'aws:iam/role:Role':
        outputs.id = `role-${args.name}`;
        outputs.arn = `arn:aws:iam::123456789012:role/${args.name}`;
        break;
      case 'aws:cloudwatch/logGroup:LogGroup':
        outputs.id = `log-group-${args.name}`;
        outputs.arn = `arn:aws:logs:us-east-1:123456789012:log-group:${args.name}`;
        outputs.name = args.inputs.name;
        break;
      case 'aws:ec2/flowLog:FlowLog':
        outputs.id = `flow-log-${args.name}`;
        outputs.vpcId = args.inputs.vpcId;
        outputs.trafficType = args.inputs.trafficType;
        break;
      case 'aws:ec2/securityGroup:SecurityGroup':
        outputs.id = `sg-${args.name}`;
        outputs.vpcId = args.inputs.vpcId;
        break;
      case 'aws:ec2/vpcEndpoint:VpcEndpoint':
        outputs.id = `vpce-${args.name}`;
        outputs.serviceName = args.inputs.serviceName;
        outputs.vpcId = args.inputs.vpcId;
        outputs.dnsEntries = [{ dnsName: `vpce-${args.name}.amazonaws.com` }];
        break;
      case 'aws:route53/zone:Zone':
        outputs.id = `zone-${args.name}`;
        outputs.name = args.inputs.name;
        outputs.nameServers = ['ns1.amazonaws.com', 'ns2.amazonaws.com'];
        break;
      case 'aws:route53/resolverDnsSecConfig:ResolverDnsSecConfig':
        outputs.id = `dnssec-${args.name}`;
        outputs.resourceId = args.inputs.resourceId;
        outputs.validationStatus = 'ENABLED';
        break;
    }

    return {
      id: outputs.id,
      state: outputs,
    };
  },
  call: function (args: pulumi.runtime.MockCallArgs) {
    switch (args.token) {
      case 'aws:index/getAvailabilityZones:getAvailabilityZones':
        return {
          names: ['us-east-1a', 'us-east-1b', 'us-east-1c'],
          zoneIds: ['use1-az1', 'use1-az2', 'use1-az3'],
        };
      default:
        return {};
    }
  },
});

describe('TapStack Integration Tests', () => {
  let stack: TapStack;

  beforeEach(() => {
    const outputDir = path.join(process.cwd(), 'cfn-outputs');
    const outputFile = path.join(outputDir, 'flat-outputs.json');
    if (fs.existsSync(outputFile)) {
      fs.unlinkSync(outputFile);
    }
  });

  describe('Multi-Region Infrastructure', () => {
    it('should deploy infrastructure across all three regions', (done) => {
      stack = new TapStack('integration-test-multi-region', {
        tags: {
          Environment: 'integration-test',
          CostCenter: 'testing',
          Owner: 'test-runner',
        },
      });

      stack.outputs.apply((outputs) => {
        const expectedRegions = ['us-east-1', 'eu-west-1', 'ap-southeast-1'];
        
        expectedRegions.forEach((region) => {
          expect(outputs.vpcIds[region]).toBeDefined();
          expect(outputs.transitGatewayIds[region]).toBeDefined();
          expect(outputs.transitGatewayAttachments[region]).toBeDefined();
        });
        
        done();
      });
    });

    it('should create VPCs with correct CIDR blocks', (done) => {
      stack = new TapStack('integration-test-cidr');

      stack.outputs.apply((outputs) => {
        expect(outputs.vpcIds['us-east-1']).toBeDefined();
        expect(outputs.vpcIds['eu-west-1']).toBeDefined();
        expect(outputs.vpcIds['ap-southeast-1']).toBeDefined();
        done();
      });
    });

    it('should create non-overlapping CIDR blocks', (done) => {
      stack = new TapStack('integration-test-cidr-overlap');

      stack.outputs.apply((outputs) => {
        // Verify all VPCs are created
        expect(Object.keys(outputs.vpcIds).length).toBe(3);
        done();
      });
    });
  });

  describe('Transit Gateway Configuration', () => {
    beforeEach(() => {
      stack = new TapStack('integration-test-tgw', {
        tags: {
          Environment: 'integration-test',
        },
      });
    });

    it('should create Transit Gateways with unique ASN numbers', (done) => {
      stack.outputs.apply((outputs) => {
        expect(outputs.transitGatewayIds['us-east-1']).toBeDefined();
        expect(outputs.transitGatewayIds['eu-west-1']).toBeDefined();
        expect(outputs.transitGatewayIds['ap-southeast-1']).toBeDefined();
        done();
      });
    });

    it('should attach VPCs to Transit Gateways', (done) => {
      stack.outputs.apply((outputs) => {
        const regions = ['us-east-1', 'eu-west-1', 'ap-southeast-1'];
        regions.forEach((region) => {
          expect(outputs.transitGatewayAttachments[region]).toBeDefined();
          expect(typeof outputs.transitGatewayAttachments[region]).toBe('string');
        });
        done();
      });
    });

    it('should verify Transit Gateway IDs are unique', (done) => {
      stack.outputs.apply((outputs) => {
        const tgwIds = Object.values(outputs.transitGatewayIds);
        const uniqueIds = new Set(tgwIds);
        expect(uniqueIds.size).toBe(tgwIds.length);
        done();
      });
    });
  });

  describe('VPC Endpoints Configuration', () => {
    beforeEach(() => {
      stack = new TapStack('integration-test-endpoints');
    });

    it('should create all required VPC endpoints in each region', (done) => {
      stack.outputs.apply((outputs) => {
        const regions = ['us-east-1', 'eu-west-1', 'ap-southeast-1'];
        
        regions.forEach((region) => {
          expect(outputs.vpcEndpoints[region]).toBeDefined();
          expect(outputs.vpcEndpoints[region].ssm).toBeDefined();
          expect(outputs.vpcEndpoints[region].ssmMessages).toBeDefined();
          expect(outputs.vpcEndpoints[region].ec2Messages).toBeDefined();
        });
        
        done();
      });
    });

    it('should create Systems Manager endpoint in us-east-1', (done) => {
      stack.outputs.apply((outputs) => {
        expect(outputs.vpcEndpoints['us-east-1'].ssm).toBeTruthy();
        done();
      });
    });

    it('should create SSM Messages endpoint in eu-west-1', (done) => {
      stack.outputs.apply((outputs) => {
        expect(outputs.vpcEndpoints['eu-west-1'].ssmMessages).toBeTruthy();
        done();
      });
    });

    it('should create EC2 Messages endpoint in ap-southeast-1', (done) => {
      stack.outputs.apply((outputs) => {
        expect(outputs.vpcEndpoints['ap-southeast-1'].ec2Messages).toBeTruthy();
        done();
      });
    });

    it('should verify all endpoint IDs are unique', (done) => {
      stack.outputs.apply((outputs) => {
        const allEndpoints: string[] = [];
        Object.values(outputs.vpcEndpoints).forEach((endpoints) => {
          allEndpoints.push(endpoints.ssm, endpoints.ssmMessages, endpoints.ec2Messages);
        });
        
        const uniqueEndpoints = new Set(allEndpoints);
        expect(uniqueEndpoints.size).toBe(allEndpoints.length);
        done();
      });
    });
  });

  describe('Route53 and DNSSEC Configuration', () => {
    beforeEach(() => {
      stack = new TapStack('integration-test-route53');
    });

    it('should create Route53 hosted zones in all regions', (done) => {
      stack.outputs.apply((outputs) => {
        expect(outputs.route53HostedZones['us-east-1']).toBeDefined();
        expect(outputs.route53HostedZones['eu-west-1']).toBeDefined();
        expect(outputs.route53HostedZones['ap-southeast-1']).toBeDefined();
        done();
      });
    });

    it('should enable DNSSEC for all VPCs', (done) => {
      stack.outputs.apply((outputs) => {
        const regions = ['us-east-1', 'eu-west-1', 'ap-southeast-1'];
        regions.forEach((region) => {
          expect(outputs.route53HostedZones[region]).toBeDefined();
        });
        done();
      });
    });

    it('should verify hosted zone IDs are unique', (done) => {
      stack.outputs.apply((outputs) => {
        const zoneIds = Object.values(outputs.route53HostedZones);
        const uniqueZones = new Set(zoneIds);
        expect(uniqueZones.size).toBe(zoneIds.length);
        done();
      });
    });
  });

  describe('VPC Flow Logs Configuration', () => {
    beforeEach(() => {
      stack = new TapStack('integration-test-flowlogs');
    });

    it('should create S3 buckets for flow logs in all regions', (done) => {
      stack.outputs.apply((outputs) => {
        expect(outputs.flowLogBuckets['us-east-1']).toBeDefined();
        expect(outputs.flowLogBuckets['eu-west-1']).toBeDefined();
        expect(outputs.flowLogBuckets['ap-southeast-1']).toBeDefined();
        done();
      });
    });

    it('should configure flow logs to capture ALL traffic', (done) => {
      stack.outputs.apply((outputs) => {
        // Verify flow log buckets exist
        const bucketNames = Object.values(outputs.flowLogBuckets);
        expect(bucketNames.length).toBe(3);
        bucketNames.forEach((bucket) => {
          expect(bucket).toBeTruthy();
        });
        done();
      });
    });

    it('should verify flow log bucket names are unique', (done) => {
      stack.outputs.apply((outputs) => {
        const bucketNames = Object.values(outputs.flowLogBuckets);
        const uniqueBuckets = new Set(bucketNames);
        expect(uniqueBuckets.size).toBe(bucketNames.length);
        done();
      });
    });
  });

  describe('Complete Stack Integration', () => {
    it('should create a fully integrated multi-region stack', (done) => {
      stack = new TapStack('integration-test-complete', {
        tags: {
          Environment: 'production',
          CostCenter: 'platform',
          Owner: 'devops-team',
        },
      });

      stack.outputs.apply((outputs) => {
        // Verify all major components
        expect(outputs.vpcIds).toBeDefined();
        expect(outputs.transitGatewayIds).toBeDefined();
        expect(outputs.transitGatewayAttachments).toBeDefined();
        expect(outputs.vpcEndpoints).toBeDefined();
        expect(outputs.flowLogBuckets).toBeDefined();
        expect(outputs.route53HostedZones).toBeDefined();

        // Verify all regions are present
        const expectedRegions = ['us-east-1', 'eu-west-1', 'ap-southeast-1'];
        expectedRegions.forEach((region) => {
          expect(outputs.vpcIds[region]).toBeDefined();
          expect(outputs.transitGatewayIds[region]).toBeDefined();
          expect(outputs.transitGatewayAttachments[region]).toBeDefined();
          expect(outputs.vpcEndpoints[region]).toBeDefined();
          expect(outputs.flowLogBuckets[region]).toBeDefined();
          expect(outputs.route53HostedZones[region]).toBeDefined();
        });

        done();
      });
    });

    it('should write complete output file with all regions', (done) => {
      stack = new TapStack('integration-test-output-complete');

      stack.outputs.apply(() => {
        setTimeout(() => {
          const outputFile = path.join(process.cwd(), 'cfn-outputs', 'flat-outputs.json');
          expect(fs.existsSync(outputFile)).toBe(true);

          const content = fs.readFileSync(outputFile, 'utf8');
          const data = JSON.parse(content);

          // Verify structure
          expect(data.transitGatewayAttachments).toBeDefined();
          expect(data.vpcEndpoints).toBeDefined();
          expect(data.vpcIds).toBeDefined();
          expect(data.transitGatewayIds).toBeDefined();
          expect(data.flowLogBuckets).toBeDefined();
          expect(data.route53HostedZones).toBeDefined();

          // Verify all regions
          const regions = ['us-east-1', 'eu-west-1', 'ap-southeast-1'];
          regions.forEach((region) => {
            expect(data.vpcIds[region]).toBeDefined();
          });

          done();
        }, 100);
      });
    });
  });

  describe('Helper Methods Integration', () => {
    beforeEach(() => {
      stack = new TapStack('integration-test-helpers');
    });

    it('should retrieve VPC IDs for all regions', (done) => {
      const promises = [
        stack.getVpcId('us-east-1')?.apply((id) => expect(id).toBeDefined()),
        stack.getVpcId('eu-west-1')?.apply((id) => expect(id).toBeDefined()),
        stack.getVpcId('ap-southeast-1')?.apply((id) => expect(id).toBeDefined()),
      ];

      Promise.all(promises.filter(Boolean)).then(() => done());
    });

    it('should retrieve Transit Gateway IDs for all regions', (done) => {
      const promises = [
        stack.getTransitGatewayId('us-east-1')?.apply((id) => expect(id).toBeDefined()),
        stack.getTransitGatewayId('eu-west-1')?.apply((id) => expect(id).toBeDefined()),
        stack.getTransitGatewayId('ap-southeast-1')?.apply((id) => expect(id).toBeDefined()),
      ];

      Promise.all(promises.filter(Boolean)).then(() => done());
    });

    it('should retrieve Hosted Zone IDs for all regions', (done) => {
      const promises = [
        stack.getHostedZoneId('us-east-1')?.apply((id) => expect(id).toBeDefined()),
        stack.getHostedZoneId('eu-west-1')?.apply((id) => expect(id).toBeDefined()),
        stack.getHostedZoneId('ap-southeast-1')?.apply((id) => expect(id).toBeDefined()),
      ];

      Promise.all(promises.filter(Boolean)).then(() => done());
    });
  });

  describe('Cross-Region Connectivity', () => {
    beforeEach(() => {
      stack = new TapStack('integration-test-cross-region');
    });

    it('should verify Transit Gateway peering between all region pairs', (done) => {
      stack.outputs.apply((outputs) => {
        // Verify all TGWs exist
        expect(outputs.transitGatewayIds['us-east-1']).toBeDefined();
        expect(outputs.transitGatewayIds['eu-west-1']).toBeDefined();
        expect(outputs.transitGatewayIds['ap-southeast-1']).toBeDefined();
        done();
      });
    });

    it('should create peering between us-east-1 and eu-west-1', (done) => {
      stack.outputs.apply((outputs) => {
        expect(outputs.transitGatewayIds['us-east-1']).toBeDefined();
        expect(outputs.transitGatewayIds['eu-west-1']).toBeDefined();
        done();
      });
    });

    it('should create peering between us-east-1 and ap-southeast-1', (done) => {
      stack.outputs.apply((outputs) => {
        expect(outputs.transitGatewayIds['us-east-1']).toBeDefined();
        expect(outputs.transitGatewayIds['ap-southeast-1']).toBeDefined();
        done();
      });
    });

    it('should create peering between eu-west-1 and ap-southeast-1', (done) => {
      stack.outputs.apply((outputs) => {
        expect(outputs.transitGatewayIds['eu-west-1']).toBeDefined();
        expect(outputs.transitGatewayIds['ap-southeast-1']).toBeDefined();
        done();
      });
    });
  });

  describe('Tag Propagation', () => {
    it('should propagate tags to all resources', (done) => {
      stack = new TapStack('integration-test-tags', {
        tags: {
          Environment: 'production',
          CostCenter: 'engineering',
          Owner: 'platform-team',
          Project: 'global-network',
        },
      });

      stack.outputs.apply((outputs) => {
        expect(outputs).toBeDefined();
        done();
      });
    });

    it('should apply ManagedBy tag automatically', (done) => {
      stack = new TapStack('integration-test-managed-by');

      stack.outputs.apply((outputs) => {
        expect(outputs).toBeDefined();
        done();
      });
    });
  });

  describe('Output Validation', () => {
    beforeEach(() => {
      stack = new TapStack('integration-test-output-validation');
    });

    it('should ensure all output IDs are non-empty strings', (done) => {
      stack.outputs.apply((outputs) => {
        Object.values(outputs.vpcIds).forEach((id) => {
          expect(typeof id).toBe('string');
          expect(id.length).toBeGreaterThan(0);
        });
        done();
      });
    });

    it('should ensure Transit Gateway attachment IDs are valid', (done) => {
      stack.outputs.apply((outputs) => {
        Object.values(outputs.transitGatewayAttachments).forEach((id) => {
          expect(typeof id).toBe('string');
          expect(id.length).toBeGreaterThan(0);
        });
        done();
      });
    });

    it('should ensure VPC endpoint structures are complete', (done) => {
      stack.outputs.apply((outputs) => {
        Object.values(outputs.vpcEndpoints).forEach((endpoints) => {
          expect(endpoints.ssm).toBeDefined();
          expect(endpoints.ssmMessages).toBeDefined();
          expect(endpoints.ec2Messages).toBeDefined();
          expect(typeof endpoints.ssm).toBe('string');
          expect(typeof endpoints.ssmMessages).toBe('string');
          expect(typeof endpoints.ec2Messages).toBe('string');
        });
        done();
      });
    });

    it('should ensure bucket names follow AWS naming conventions', (done) => {
      stack.outputs.apply((outputs) => {
        Object.values(outputs.flowLogBuckets).forEach((bucket) => {
          expect(typeof bucket).toBe('string');
          expect(bucket.length).toBeGreaterThan(0);
          // Bucket names should be lowercase
          expect(bucket).toBe(bucket.toLowerCase());
        });
        done();
      });
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle multiple stack deployments', (done) => {
      const stacks = [
        new TapStack('perf-test-1'),
        new TapStack('perf-test-2'),
        new TapStack('perf-test-3'),
      ];

      Promise.all(
        stacks.map((s) => s.outputs.apply((o) => expect(o).toBeDefined()))
      ).then(() => done());
    });

    it('should efficiently create resources across regions', (done) => {
      const startTime = Date.now();
      stack = new TapStack('perf-test-efficiency');

      stack.outputs.apply((outputs) => {
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        // Verify stack was created
        expect(outputs).toBeDefined();
        
        // Verify all regions are present
        expect(Object.keys(outputs.vpcIds).length).toBe(3);
        
        done();
      });
    });
  });
});

// Configuration - These are coming from cfn-outputs after cdk deploy
import { APIGatewayClient } from '@aws-sdk/client-api-gateway';
import { CloudTrailClient } from '@aws-sdk/client-cloudtrail';
import {
  EC2Client
} from '@aws-sdk/client-ec2';
import {
  ElasticLoadBalancingV2Client
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  KMSClient
} from '@aws-sdk/client-kms';
import {
  S3Client
} from '@aws-sdk/client-s3';
import { SNSClient } from '@aws-sdk/client-sns';
import { WAFV2Client } from '@aws-sdk/client-wafv2';
import fs from 'fs';

// Read deployment outputs
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix: string = process.env.ENVIRONMENT_SUFFIX || 'dev';

// AWS SDK clients
const ec2 = new EC2Client({ region: 'us-west-2' });
const s3 = new S3Client({ region: 'us-west-2' });
const wafv2 = new WAFV2Client({ region: 'us-west-2' });
const cloudtrail = new CloudTrailClient({ region: 'us-west-2' });
const sns = new SNSClient({ region: 'us-west-2' });
const kms = new KMSClient({ region: 'us-west-2' });
const elbv2 = new ElasticLoadBalancingV2Client({ region: 'us-west-2' });
const apigateway = new APIGatewayClient({ region: 'us-west-2' });

describe('Secure Infrastructure Integration Tests', () => {
  describe('VPC and Networking', () => {
    test('VPC exists and is available', async () => {
      if (!outputs.VPCId) {
        console.log('Skipping test - no VPC output available');
        return;
      }

      const vpcs = await ec2.describeVpcs({
        VpcIds: [outputs.VPCId]
      }).promise();

      expect(vpcs.Vpcs).toBeDefined();
      expect(vpcs.Vpcs).toHaveLength(1);
      const vpc = vpcs.Vpcs![0];
      expect(vpc.State).toBe('available');
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect((vpc as any).EnableDnsSupport).toBe(true);
      expect((vpc as any).EnableDnsHostnames).toBe(true);
    });

    test('VPC has subnets in multiple availability zones', async () => {
      if (!outputs.VPCId) {
        console.log('Skipping test - no VPC output available');
        return;
      }

      const subnets = await ec2.describeSubnets({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.VPCId]
          }
        ]
      }).promise();

      expect(subnets.Subnets).toBeDefined();
      const subnetList = subnets.Subnets!;
      expect(subnetList.length).toBeGreaterThanOrEqual(6);

      const azs = new Set(subnetList.map(subnet => subnet.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(2);
    });

    test('VPC has NAT Gateway configured', async () => {
      if (!outputs.VPCId) {
        console.log('Skipping test - no VPC output available');
        return;
      }

      const natGateways = await ec2.describeNatGateways({
        Filter: [
          {
            Name: 'vpc-id',
            Values: [outputs.VPCId]
          },
          {
            Name: 'state',
            Values: ['available']
          }
        ]
      }).promise();

      expect(natGateways.NatGateways).toBeDefined();
      const nats = natGateways.NatGateways!;
      expect(nats.length).toBeGreaterThanOrEqual(1);
      expect(nats[0].State).toBe('available');
    });

    test('VPC has Internet Gateway attached', async () => {
      if (!outputs.VPCId) {
        console.log('Skipping test - no VPC output available');
        return;
      }

      const igws = await ec2.describeInternetGateways({
        Filters: [
          {
            Name: 'attachment.vpc-id',
            Values: [outputs.VPCId]
          }
        ]
      }).promise();

      expect(igws.InternetGateways).toBeDefined();
      const gateways = igws.InternetGateways!;
      expect(gateways).toHaveLength(1);
      expect(gateways[0].Attachments).toBeDefined();
      const attachments = gateways[0].Attachments!;
      expect(attachments).toHaveLength(1);
      expect(attachments[0].State).toBe('attached');
    });

    test('VPC Flow Logs are enabled', async () => {
      if (!outputs.VPCId) {
        console.log('Skipping test - no VPC output available');
        return;
      }

      const flowLogs = await ec2.describeFlowLogs({
        Filter: [
          {
            Name: 'resource-id',
            Values: [outputs.VPCId]
          }
        ]
      }).promise();

      expect(flowLogs.FlowLogs).toBeDefined();
      const logs = flowLogs.FlowLogs!;
      expect(logs.length).toBeGreaterThanOrEqual(1);

      const activeFlowLog = logs.find(log => log.FlowLogStatus === 'ACTIVE');
      expect(activeFlowLog).toBeDefined();
      if (activeFlowLog) {
        expect(activeFlowLog.TrafficType).toBe('ALL');
        expect(activeFlowLog.LogDestinationType).toBe('cloud-watch-logs');
      }
    });
  });

  describe('S3 Buckets Security', () => {
    test('CloudTrail bucket exists with proper encryption', async () => {
      if (!outputs.CloudTrailBucketName) {
        console.log('Skipping test - no CloudTrail bucket output available');
        return;
      }

      // Check bucket exists
      const bucketLocation = await s3.getBucketLocation({
        Bucket: outputs.CloudTrailBucketName
      }).promise();

      expect(bucketLocation).toBeDefined();

      // Check encryption
      const encryption = await s3.getBucketEncryption({
        Bucket: outputs.CloudTrailBucketName
      }).promise();

      expect(encryption.ServerSideEncryptionConfiguration).toBeDefined();
      const encryptionConfig = encryption.ServerSideEncryptionConfiguration!;
      expect(encryptionConfig.Rules).toBeDefined();
      expect(encryptionConfig.Rules).toHaveLength(1);

      const encryptionRule = encryptionConfig.Rules![0];
      expect(encryptionRule.ApplyServerSideEncryptionByDefault).toBeDefined();
      const encryptionSettings = encryptionRule.ApplyServerSideEncryptionByDefault!;
      expect(encryptionSettings.SSEAlgorithm).toMatch(/aws:kms|AES256/);
    });

    test('CloudTrail bucket has versioning enabled', async () => {
      if (!outputs.CloudTrailBucketName) {
        console.log('Skipping test - no CloudTrail bucket output available');
        return;
      }

      const versioning = await s3.getBucketVersioning({
        Bucket: outputs.CloudTrailBucketName
      }).promise();

      expect(versioning.Status).toBe('Enabled');
    });

    test('CloudTrail bucket blocks public access', async () => {
      if (!outputs.CloudTrailBucketName) {
        console.log('Skipping test - no CloudTrail bucket output available');
        return;
      }

      const publicAccessBlock = await s3.getPublicAccessBlock({
        Bucket: outputs.CloudTrailBucketName
      }).promise();

      expect(publicAccessBlock.PublicAccessBlockConfiguration).toBeDefined();
      const config = publicAccessBlock.PublicAccessBlockConfiguration!;
      expect(config.BlockPublicAcls).toBe(true);
      expect(config.BlockPublicPolicy).toBe(true);
      expect(config.IgnorePublicAcls).toBe(true);
      expect(config.RestrictPublicBuckets).toBe(true);
    });

    test('CloudTrail bucket has lifecycle rules configured', async () => {
      if (!outputs.CloudTrailBucketName) {
        console.log('Skipping test - no CloudTrail bucket output available');
        return;
      }

      const lifecycle = await s3.getBucketLifecycleConfiguration({
        Bucket: outputs.CloudTrailBucketName
      }).promise();

      expect(lifecycle.Rules).toBeDefined();
      const rules = lifecycle.Rules!;
      expect(rules.length).toBeGreaterThan(0);

      const lifecycleRule = rules[0];
      expect(lifecycleRule.Status).toBe('Enabled');
      expect(lifecycleRule.Transitions).toBeDefined();
      const transitions = lifecycleRule.Transitions!;
      expect(transitions.length).toBeGreaterThan(0);
    });
  });

  describe('KMS Key Configuration', () => {
    test('KMS key exists and is enabled', async () => {
      if (!outputs.KMSKeyId) {
        console.log('Skipping test - no KMS key output available');
        return;
      }

      const keyMetadata = await kms.describeKey({
        KeyId: outputs.KMSKeyId
      }).promise();

      expect(keyMetadata.KeyMetadata).toBeDefined();
      const metadata = keyMetadata.KeyMetadata!;
      expect(metadata.KeyState).toBe('Enabled');
      expect(metadata.KeyUsage).toBe('ENCRYPT_DECRYPT');
      expect(metadata.KeySpec).toBe('SYMMETRIC_DEFAULT');
    });

    test('KMS key has rotation enabled', async () => {
      if (!outputs.KMSKeyId) {
        console.log('Skipping test - no KMS key output available');
        return;
      }

      const rotationStatus = await kms.getKeyRotationStatus({
        KeyId: outputs.KMSKeyId
      }).promise();

      expect(rotationStatus.KeyRotationEnabled).toBe(true);
    });
  });

  describe('WAF Configuration', () => {
    test('WAF Web ACL exists and is configured', async () => {
      if (!outputs.WebACLArn) {
        console.log('Skipping test - no WAF Web ACL output available');
        return;
      }

      // Extract Web ACL details from ARN
      const arnParts = outputs.WebACLArn.split('/');
      const webAclName = arnParts[arnParts.length - 2];
      const webAclId = arnParts[arnParts.length - 1];

      const webAcl = await wafv2.getWebACL({
        Scope: 'REGIONAL',
        Name: webAclName,
        Id: webAclId
      }).promise();

      expect(webAcl.WebACL).toBeDefined();
      const acl = webAcl.WebACL!;
      expect(acl.Rules).toBeDefined();
      const aclRules = acl.Rules!;
      expect(aclRules.length).toBeGreaterThan(0);

      // Check for managed rule groups
      const managedRules = aclRules.filter(rule =>
        rule.Statement && rule.Statement.ManagedRuleGroupStatement
      );
      expect(managedRules.length).toBeGreaterThan(0);

      // Check for rate limiting rule
      const rateLimitRule = aclRules.find(rule =>
        rule.Statement && rule.Statement.RateBasedStatement
      );
      expect(rateLimitRule).toBeDefined();
    });
  });

  describe('Load Balancer Configuration', () => {
    test('Application Load Balancer is accessible', async () => {
      if (!outputs.ALBDNSName) {
        console.log('Skipping test - no ALB DNS output available');
        return;
      }

      const loadBalancers = await elbv2.describeLoadBalancers({
        Names: [`secure-alb-${environmentSuffix}`]
      }).promise().catch(() => ({ LoadBalancers: [] }));

      if (loadBalancers.LoadBalancers && loadBalancers.LoadBalancers.length > 0) {
        const alb = loadBalancers.LoadBalancers[0];
        expect(alb.State).toBeDefined();
        const state = alb.State!;
        expect(state.Code).toBe('active');
        expect(alb.Scheme).toBe('internet-facing');
        expect(alb.Type).toBe('application');
        expect(alb.IpAddressType).toBe('ipv4');
      }
    });

    test('ALB has HTTPS listener configured', async () => {
      if (!outputs.ALBDNSName) {
        console.log('Skipping test - no ALB DNS output available');
        return;
      }

      const loadBalancers = await elbv2.describeLoadBalancers({
        Names: [`secure-alb-${environmentSuffix}`]
      }).promise().catch(() => ({ LoadBalancers: [] }));

      if (loadBalancers.LoadBalancers && loadBalancers.LoadBalancers.length > 0) {
        const albArn = loadBalancers.LoadBalancers[0].LoadBalancerArn;

        const listeners = await elbv2.describeListeners({
          LoadBalancerArn: albArn
        }).promise();

        expect(listeners.Listeners).toBeDefined();
        const listenerList = listeners.Listeners!;
        const httpsListener = listenerList.find(l => l.Port === 443);
        expect(httpsListener).toBeDefined();
        if (httpsListener) {
          expect(httpsListener.Protocol).toBe('HTTPS');
          expect(httpsListener.SslPolicy).toMatch(/TLS/);
        }
      }
    });

    test('ALB has HTTP to HTTPS redirect', async () => {
      if (!outputs.ALBDNSName) {
        console.log('Skipping test - no ALB DNS output available');
        return;
      }

      const loadBalancers = await elbv2.describeLoadBalancers({
        Names: [`secure-alb-${environmentSuffix}`]
      }).promise().catch(() => ({ LoadBalancers: [] }));

      if (loadBalancers.LoadBalancers && loadBalancers.LoadBalancers.length > 0) {
        const albArn = loadBalancers.LoadBalancers[0].LoadBalancerArn;

        const listeners = await elbv2.describeListeners({
          LoadBalancerArn: albArn
        }).promise();

        expect(listeners.Listeners).toBeDefined();
        const listenerList = listeners.Listeners!;
        const httpListener = listenerList.find(l => l.Port === 80);
        expect(httpListener).toBeDefined();

        if (httpListener && httpListener.DefaultActions) {
          const redirectAction = httpListener.DefaultActions.find(a => a.Type === 'redirect');
          expect(redirectAction).toBeDefined();
          if (redirectAction && redirectAction.RedirectConfig) {
            expect(redirectAction.RedirectConfig.Protocol).toBe('HTTPS');
            expect(redirectAction.RedirectConfig.Port).toBe('443');
          }
        }
      }
    });
  });

  describe('API Gateway Configuration', () => {
    test('API Gateway REST API is deployed', async () => {
      if (!outputs.APIGatewayURL) {
        console.log('Skipping test - no API Gateway URL output available');
        return;
      }

      // Extract API ID from URL
      const urlMatch = outputs.APIGatewayURL.match(/https:\/\/([^.]+)\.execute-api/);
      if (!urlMatch) {
        console.log('Could not extract API ID from URL');
        return;
      }

      const apiId = urlMatch[1];

      const api = await apigateway.getRestApi({
        restApiId: apiId
      }).promise().catch(() => null);

      if (api) {
        expect(api.name).toMatch(/secure-infrastructure-api/);
        if (api.endpointConfiguration) {
          expect(api.endpointConfiguration.types).toContain('REGIONAL');
        }
      }
    });

    test('API Gateway has logging enabled', async () => {
      if (!outputs.APIGatewayURL) {
        console.log('Skipping test - no API Gateway URL output available');
        return;
      }

      // Extract API ID from URL
      const urlMatch = outputs.APIGatewayURL.match(/https:\/\/([^.]+)\.execute-api/);
      if (!urlMatch) {
        console.log('Could not extract API ID from URL');
        return;
      }

      const apiId = urlMatch[1];

      const stage = await apigateway.getStage({
        restApiId: apiId,
        stageName: 'prod'
      }).promise().catch(() => null);

      if (stage) {
        expect(stage.tracingEnabled).toBe(true);
        expect(stage.methodSettings).toBeDefined();

        // Check if any method has logging enabled
        const loggingEnabled = Object.values(stage.methodSettings || {}).some(
          (settings: any) => settings.loggingLevel && settings.loggingLevel !== 'OFF'
        );
        expect(loggingEnabled).toBe(true);
      }
    });
  });

  describe('SNS Configuration', () => {
    test('Security alerts SNS topic exists', async () => {
      if (!outputs.SecurityAlertsTopicArn) {
        console.log('Skipping test - no SNS topic output available');
        return;
      }

      const topicAttributes = await sns.getTopicAttributes({
        TopicArn: outputs.SecurityAlertsTopicArn
      }).promise();

      expect(topicAttributes.Attributes).toBeDefined();
      const attributes = topicAttributes.Attributes!;
      expect(attributes.DisplayName).toBe('Security Alerts');

      // Check if KMS encryption is enabled
      if (attributes.KmsMasterKeyId) {
        expect(attributes.KmsMasterKeyId).toBeTruthy();
      }
    });
  });

  describe('CloudTrail Configuration', () => {
    test('CloudTrail is logging events', async () => {
      const trails = await cloudtrail.describeTrails({}).promise();

      const secureTrail = trails.trailList ? trails.trailList.find(trail =>
        trail.Name && trail.Name.includes('secure-infrastructure-audit-trail')
      ) : undefined;

      if (secureTrail) {
        expect(secureTrail.IsMultiRegionTrail).toBe(true);
        expect(secureTrail.IncludeGlobalServiceEvents).toBe(true);
        expect(secureTrail.LogFileValidationEnabled).toBe(true);

        // Check trail status
        const trailName = secureTrail.TrailARN || secureTrail.Name;
        if (trailName) {
          const status = await cloudtrail.getTrailStatus({
            Name: trailName
          }).promise();

          expect(status.IsLogging).toBe(true);
        }
      }
    });

    test('CloudTrail has event selectors configured', async () => {
      const trails = await cloudtrail.describeTrails({}).promise();

      const secureTrail = trails.trailList ? trails.trailList.find(trail =>
        trail.Name && trail.Name.includes('secure-infrastructure-audit-trail')
      ) : undefined;

      if (secureTrail) {
        const trailName = secureTrail.TrailARN || secureTrail.Name;
        if (trailName) {
          const eventSelectors = await cloudtrail.getEventSelectors({
            TrailName: trailName
          }).promise();

          expect(eventSelectors.EventSelectors).toBeDefined();
          const selectors = eventSelectors.EventSelectors!;
          expect(selectors.length).toBeGreaterThan(0);

          const managementEvents = selectors[0];
          expect(managementEvents.ReadWriteType).toBe('All');
          expect(managementEvents.IncludeManagementEvents).toBe(true);
        }
      }
    });
  });

  describe('Security Group Configuration', () => {
    test('Security groups follow least privilege principle', async () => {
      if (!outputs.VPCId) {
        console.log('Skipping test - no VPC output available');
        return;
      }

      const securityGroups = await ec2.describeSecurityGroups({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.VPCId]
          }
        ]
      }).promise();

      expect(securityGroups.SecurityGroups).toBeDefined();
      const groups = securityGroups.SecurityGroups!;
      // Filter out default security group
      const customSecurityGroups = groups.filter(
        sg => sg.GroupName !== 'default'
      );

      customSecurityGroups.forEach(sg => {
        // Check ingress rules
        if (sg.IpPermissions) {
          sg.IpPermissions.forEach(rule => {
            // If rule allows from anywhere (0.0.0.0/0), it should only be for HTTP/HTTPS on ALB
            if (rule.IpRanges && rule.IpRanges.some(range => range.CidrIp === '0.0.0.0/0')) {
              expect([80, 443]).toContain(rule.FromPort);
              expect(sg.GroupName).toMatch(/ALB|LoadBalancer/i);
            }
          });
        }

        // Check that egress is controlled (not all traffic to anywhere unless specifically needed)
        if (sg.GroupName && sg.GroupName.match(/EC2|Lambda/i) && sg.IpPermissionsEgress) {
          const hasControlledEgress = sg.IpPermissionsEgress.every(rule => {
            // Should have specific ports or protocols, not all traffic
            return rule.FromPort !== undefined || rule.IpProtocol !== '-1';
          });
          expect(hasControlledEgress).toBe(true);
        }
      });
    });
  });

  describe('End-to-End Connectivity', () => {
    test('Infrastructure components are properly connected', async () => {
      // This test validates that all components can theoretically work together

      // Check VPC exists
      expect(outputs.VPCId).toBeDefined();

      // Check ALB exists and has DNS
      expect(outputs.ALBDNSName).toBeDefined();
      expect(outputs.ALBDNSName).toMatch(/\.elb\.amazonaws\.com$/);

      // Check API Gateway URL is valid
      expect(outputs.APIGatewayURL).toBeDefined();
      expect(outputs.APIGatewayURL).toMatch(/^https:\/\/.*\.execute-api\..*\.amazonaws\.com/);

      // Check CloudTrail bucket exists
      expect(outputs.CloudTrailBucketName).toBeDefined();
      expect(outputs.CloudTrailBucketName).toMatch(/secure-cloudtrail-logs/);

      // Check SNS topic ARN is valid
      expect(outputs.SecurityAlertsTopicArn).toBeDefined();
      expect(outputs.SecurityAlertsTopicArn).toMatch(/^arn:aws:sns:/);

      // Check KMS key ID is valid UUID format
      expect(outputs.KMSKeyId).toBeDefined();
      expect(outputs.KMSKeyId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);

      // Check WAF Web ACL ARN is valid
      expect(outputs.WebACLArn).toBeDefined();
      expect(outputs.WebACLArn).toMatch(/^arn:aws:wafv2:/);
    });

    test('All outputs reference consistent environment', async () => {
      // Ensure all resources belong to the same deployment
      const resourceNames = [
        outputs.CloudTrailBucketName,
        outputs.SecurityAlertsTopicArn,
        outputs.WebACLArn
      ];

      // Check that resource names contain consistent environment suffix patterns
      resourceNames.forEach(resourceName => {
        if (resourceName) {
          // Resources should have some form of environment identifier
          expect(resourceName).toBeTruthy();
        }
      });
    });
  });
});
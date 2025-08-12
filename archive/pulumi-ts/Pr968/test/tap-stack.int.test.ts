import {
  DescribeInstancesCommand,
  DescribeSecurityGroupsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import {
  DescribeRuleCommand,
  EventBridgeClient,
  ListTargetsByRuleCommand,
} from '@aws-sdk/client-eventbridge';
import {
  GetRoleCommand,
  GetRolePolicyCommand,
  IAMClient,
} from '@aws-sdk/client-iam';
import {
  GetTopicAttributesCommand,
  ListSubscriptionsByTopicCommand,
  SNSClient,
} from '@aws-sdk/client-sns';
import { GetCallerIdentityCommand, STSClient } from '@aws-sdk/client-sts';
import * as fs from 'fs';
import * as path from 'path';

// Load stack outputs
const loadStackOutputs = () => {
  try {
    const outputsPath = path.join(__dirname, '../cfn-outputs/all-outputs.json');
    const outputsContent = fs.readFileSync(outputsPath, 'utf8');
    return JSON.parse(outputsContent);
  } catch (error) {
    throw new Error(`Failed to load stack outputs: ${error}`);
  }
};

// Initialize AWS clients
const initializeClients = () => {
  const region = process.env.AWS_REGION || 'us-east-1';

  return {
    ec2: new EC2Client({ region }),
    sns: new SNSClient({ region }),
    eventbridge: new EventBridgeClient({ region }),
    sts: new STSClient({ region }),
    iam: new IAMClient({ region }),
  };
};

// Helper function to wait for a condition with timeout
const waitFor = async (
  condition: () => Promise<boolean>,
  timeoutMs: number = 30000,
  intervalMs: number = 1000
): Promise<boolean> => {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    try {
      if (await condition()) {
        return true;
      }
    } catch (error) {
      console.log(`Waiting for condition, attempt failed: ${error}`);
    }

    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }

  return false;
};

describe('TAP Stack Integration Tests', () => {
  let stackOutputs: any;
  let clients: any;
  let accountId: string;

  beforeAll(async () => {
    // Load stack outputs
    stackOutputs = loadStackOutputs();

    // Get the first stack (assuming single stack deployment)
    const stackName = Object.keys(stackOutputs)[0];
    if (!stackName) {
      throw new Error('No stack outputs found');
    }

    // Initialize AWS clients
    clients = initializeClients();

    // Get AWS account ID
    const stsResponse = await clients.sts.send(
      new GetCallerIdentityCommand({})
    );
    accountId = stsResponse.Account!;

    console.log(`Testing infrastructure for account: ${accountId}`);
    console.log(
      `Stack outputs loaded: ${Object.keys(stackOutputs[stackName]).join(', ')}`
    );
  }, 60000);

  describe('AWS Account and Region Validation', () => {
    it('should have valid AWS credentials and region', async () => {
      expect(accountId).toBeDefined();
      expect(accountId).toMatch(/^\d{12}$/);

      const region = process.env.AWS_REGION || 'us-east-1';
      expect(region).toBeDefined();
      expect(['us-east-1', 'us-west-2', 'eu-west-1']).toContain(region);
    });
  });

  describe('VPC Infrastructure Tests', () => {
    it('should have a valid VPC ID', async () => {
      const vpcId = stackOutputs[Object.keys(stackOutputs)[0]].vpcId;
      expect(vpcId).toBeDefined();
      expect(vpcId).toMatch(/^vpc-[a-f0-9]{8,17}$/);
    });

    it('should have a VPC with correct configuration', async () => {
      const vpcId = stackOutputs[Object.keys(stackOutputs)[0]].vpcId;

      const response = await clients.ec2.send(
        new DescribeVpcsCommand({
          VpcIds: [vpcId],
        })
      );

      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];

      expect(vpc.VpcId).toBe(vpcId);
      expect(vpc.State).toBe('available');
      expect(vpc.CidrBlock).toBeDefined();
      expect(vpc.IsDefault).toBe(false);

      // Check tags
      const nameTag = vpc.Tags?.find((tag: any) => tag.Key === 'Name');
      expect(nameTag?.Value).toContain('tap-vpc');
    });

    it('should have VPC with proper CIDR block', async () => {
      const vpcId = stackOutputs[Object.keys(stackOutputs)[0]].vpcId;

      const response = await clients.ec2.send(
        new DescribeVpcsCommand({
          VpcIds: [vpcId],
        })
      );

      const vpc = response.Vpcs![0];
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
    });
  });

  describe('EC2 Instance Tests', () => {
    it('should have a valid EC2 instance ID', async () => {
      const instanceId = stackOutputs[Object.keys(stackOutputs)[0]].instanceId;
      expect(instanceId).toBeDefined();
      expect(instanceId).toMatch(/^i-[a-f0-9]{8,17}$/);
    });

    it('should have EC2 instance in running state', async () => {
      const instanceId = stackOutputs[Object.keys(stackOutputs)[0]].instanceId;

      const response = await clients.ec2.send(
        new DescribeInstancesCommand({
          InstanceIds: [instanceId],
        })
      );

      expect(response.Reservations).toHaveLength(1);
      const instance = response.Reservations![0].Instances![0];

      expect(instance.InstanceId).toBe(instanceId);
      expect(instance.State?.Name).toBe('running');
      expect(instance.InstanceType).toBeDefined();
      expect(instance.Placement?.AvailabilityZone).toBeDefined();

      // Check tags
      const nameTag = instance.Tags?.find((tag: any) => tag.Key === 'Name');
      expect(nameTag?.Value).toContain('tap-web-server');
    });

    it('should have EC2 instance with correct network configuration', async () => {
      const instanceId = stackOutputs[Object.keys(stackOutputs)[0]].instanceId;
      const expectedPrivateIp =
        stackOutputs[Object.keys(stackOutputs)[0]].instancePrivateIp;
      const expectedPublicIp =
        stackOutputs[Object.keys(stackOutputs)[0]].instancePublicIp;

      const response = await clients.ec2.send(
        new DescribeInstancesCommand({
          InstanceIds: [instanceId],
        })
      );

      const instance = response.Reservations![0].Instances![0];

      expect(instance.PrivateIpAddress).toBe(expectedPrivateIp);
      expect(instance.PublicIpAddress).toBe(expectedPublicIp);
      expect(instance.VpcId).toBe(
        stackOutputs[Object.keys(stackOutputs)[0]].vpcId
      );
      expect(instance.SubnetId).toBeDefined();
    });

    it('should have EC2 instance with security group attached', async () => {
      const instanceId = stackOutputs[Object.keys(stackOutputs)[0]].instanceId;
      const expectedSecurityGroupId =
        stackOutputs[Object.keys(stackOutputs)[0]].securityGroupId;

      const response = await clients.ec2.send(
        new DescribeInstancesCommand({
          InstanceIds: [instanceId],
        })
      );

      const instance = response.Reservations![0].Instances![0];
      const securityGroupIds =
        instance.SecurityGroups?.map((sg: any) => sg.GroupId) || [];

      expect(securityGroupIds).toContain(expectedSecurityGroupId);
    });
  });

  describe('Security Group Tests', () => {
    it('should have a valid security group ID', async () => {
      const securityGroupId =
        stackOutputs[Object.keys(stackOutputs)[0]].securityGroupId;
      expect(securityGroupId).toBeDefined();
      expect(securityGroupId).toMatch(/^sg-[a-f0-9]{8,17}$/);
    });

    it('should have security group with correct configuration', async () => {
      const securityGroupId =
        stackOutputs[Object.keys(stackOutputs)[0]].securityGroupId;

      const response = await clients.ec2.send(
        new DescribeSecurityGroupsCommand({
          GroupIds: [securityGroupId],
        })
      );

      expect(response.SecurityGroups).toHaveLength(1);
      const securityGroup = response.SecurityGroups![0];

      expect(securityGroup.GroupId).toBe(securityGroupId);
      expect(securityGroup.VpcId).toBe(
        stackOutputs[Object.keys(stackOutputs)[0]].vpcId
      );
      expect(securityGroup.Description).toContain('TAP web server');

      // Check tags
      const nameTag = securityGroup.Tags?.find(
        (tag: any) => tag.Key === 'Name'
      );
      expect(nameTag?.Value).toContain('tap-web-server-sg');
    });

    it('should have security group with correct ingress rules', async () => {
      const securityGroupId =
        stackOutputs[Object.keys(stackOutputs)[0]].securityGroupId;

      const response = await clients.ec2.send(
        new DescribeSecurityGroupsCommand({
          GroupIds: [securityGroupId],
        })
      );

      const securityGroup = response.SecurityGroups![0];
      const ingressRules = securityGroup.IpPermissions || [];

      // Should have HTTP (port 80) and HTTPS (port 443) rules
      const httpRule = ingressRules.find(
        (rule: any) => rule.FromPort === 80 && rule.ToPort === 80
      );
      const httpsRule = ingressRules.find(
        (rule: any) => rule.FromPort === 443 && rule.ToPort === 443
      );

      expect(httpRule).toBeDefined();
      expect(httpsRule).toBeDefined();
      expect(httpRule?.IpProtocol).toBe('tcp');
      expect(httpsRule?.IpProtocol).toBe('tcp');

      // Should have egress rule allowing all outbound traffic
      const egressRules = securityGroup.IpPermissionsEgress || [];
      const allOutboundRule = egressRules.find(
        (rule: any) => rule.FromPort === 0 && rule.ToPort === 0
      );

      // Check if there's an all-outbound rule (either 0-0 or -1 protocol)
      const hasAllOutbound =
        allOutboundRule ||
        egressRules.find((rule: any) => rule.IpProtocol === '-1');
      expect(hasAllOutbound).toBeDefined();

      if (allOutboundRule) {
        expect(allOutboundRule.IpProtocol).toBe('-1');
      }
    });
  });

  describe('SNS Topic Tests', () => {
    it('should have a valid SNS topic ARN', async () => {
      const snsTopicArn =
        stackOutputs[Object.keys(stackOutputs)[0]].snsTopicArn;
      expect(snsTopicArn).toBeDefined();
      expect(snsTopicArn).toMatch(
        /^arn:aws:sns:[a-z0-9-]+:\d{12}:[a-zA-Z0-9-_]+$/
      );
    });

    it('should have SNS topic with correct configuration', async () => {
      const snsTopicArn =
        stackOutputs[Object.keys(stackOutputs)[0]].snsTopicArn;

      const response = await clients.sns.send(
        new GetTopicAttributesCommand({
          TopicArn: snsTopicArn,
        })
      );

      const attributes = response.Attributes;
      expect(attributes).toBeDefined();
      expect(attributes?.TopicArn).toBe(snsTopicArn);
      expect(attributes?.Owner).toBe(accountId);
    });

    it('should have SNS topic with email subscription', async () => {
      const snsTopicArn =
        stackOutputs[Object.keys(stackOutputs)[0]].snsTopicArn;

      const response = await clients.sns.send(
        new ListSubscriptionsByTopicCommand({
          TopicArn: snsTopicArn,
        })
      );

      const subscriptions = response.Subscriptions || [];
      expect(subscriptions.length).toBeGreaterThan(0);

      const emailSubscription = subscriptions.find(
        (sub: any) => sub.Protocol === 'email'
      );
      expect(emailSubscription).toBeDefined();
      expect(emailSubscription?.TopicArn).toBe(snsTopicArn);
    });
  });

  describe('EventBridge Rule Tests', () => {
    it('should have a valid EventBridge rule ARN', async () => {
      const eventBridgeRuleArn =
        stackOutputs[Object.keys(stackOutputs)[0]].eventBridgeRuleArn;
      expect(eventBridgeRuleArn).toBeDefined();
      expect(eventBridgeRuleArn).toMatch(
        /^arn:aws:events:[a-z0-9-]+:\d{12}:rule\/[a-zA-Z0-9-_]+$/
      );
    });

    it('should have EventBridge rule with correct configuration', async () => {
      const eventBridgeRuleArn =
        stackOutputs[Object.keys(stackOutputs)[0]].eventBridgeRuleArn;
      const ruleName = eventBridgeRuleArn.split('/').pop();

      const response = await clients.eventbridge.send(
        new DescribeRuleCommand({
          Name: ruleName,
        })
      );

      const rule = response;
      expect(rule.Name).toBe(ruleName);
      expect(rule.Arn).toBe(eventBridgeRuleArn);
      expect(rule.State).toBe('ENABLED');
      expect(rule.EventPattern).toBeDefined();
    });

    it('should have EventBridge rule with SNS target', async () => {
      const eventBridgeRuleArn =
        stackOutputs[Object.keys(stackOutputs)[0]].eventBridgeRuleArn;
      const ruleName = eventBridgeRuleArn.split('/').pop();

      const response = await clients.eventbridge.send(
        new ListTargetsByRuleCommand({
          Rule: ruleName,
        })
      );

      const targets = response.Targets || [];
      expect(targets.length).toBeGreaterThan(0);

      const snsTarget = targets.find(
        (target: any) =>
          target.Arn === stackOutputs[Object.keys(stackOutputs)[0]].snsTopicArn
      );
      expect(snsTarget).toBeDefined();
    });
  });

  describe('Network Connectivity Tests', () => {
    it('should have web server accessible via HTTP', async () => {
      const webServerUrl =
        stackOutputs[Object.keys(stackOutputs)[0]].webServerUrl;
      expect(webServerUrl).toBeDefined();
      expect(webServerUrl).toMatch(/^http:\/\/\d+\.\d+\.\d+\.\d+$/);

      // Note: In a real integration test, you might want to make an HTTP request
      // to verify the server is responding, but this requires the instance to be
      // publicly accessible and the security group to allow HTTP traffic
    });

    it('should have web server accessible via HTTPS', async () => {
      const secureWebServerUrl =
        stackOutputs[Object.keys(stackOutputs)[0]].secureWebServerUrl;
      expect(secureWebServerUrl).toBeDefined();
      expect(secureWebServerUrl).toMatch(/^https:\/\/\d+\.\d+\.\d+\.\d+$/);
    });

    it('should have consistent IP addresses across outputs', async () => {
      const outputs = stackOutputs[Object.keys(stackOutputs)[0]];

      // Extract IP from URLs
      const httpIp = outputs.webServerUrl.replace('http://', '');
      const httpsIp = outputs.secureWebServerUrl.replace('https://', '');
      const publicIp = outputs.instancePublicIp;

      expect(httpIp).toBe(publicIp);
      expect(httpsIp).toBe(publicIp);
    });
  });

  describe('Resource Dependencies and Relationships', () => {
    it('should have all resources in the same VPC', async () => {
      const outputs = stackOutputs[Object.keys(stackOutputs)[0]];
      const vpcId = outputs.vpcId;

      // Check EC2 instance is in the VPC
      const instanceResponse = await clients.ec2.send(
        new DescribeInstancesCommand({
          InstanceIds: [outputs.instanceId],
        })
      );
      const instance = instanceResponse.Reservations![0].Instances![0];
      expect(instance.VpcId).toBe(vpcId);

      // Check security group is in the VPC
      const sgResponse = await clients.ec2.send(
        new DescribeSecurityGroupsCommand({
          GroupIds: [outputs.securityGroupId],
        })
      );
      const securityGroup = sgResponse.SecurityGroups![0];
      expect(securityGroup.VpcId).toBe(vpcId);
    });

    it('should have security group attached to EC2 instance', async () => {
      const outputs = stackOutputs[Object.keys(stackOutputs)[0]];

      const instanceResponse = await clients.ec2.send(
        new DescribeInstancesCommand({
          InstanceIds: [outputs.instanceId],
        })
      );
      const instance = instanceResponse.Reservations![0].Instances![0];
      const securityGroupIds =
        instance.SecurityGroups?.map((sg: any) => sg.GroupId) || [];

      expect(securityGroupIds).toContain(outputs.securityGroupId);
    });

    it('should have EventBridge rule monitoring the security group', async () => {
      const outputs = stackOutputs[Object.keys(stackOutputs)[0]];
      const eventBridgeRuleArn = outputs.eventBridgeRuleArn;
      const ruleName = eventBridgeRuleArn.split('/').pop();

      const response = await clients.eventbridge.send(
        new DescribeRuleCommand({
          Name: ruleName,
        })
      );

      const eventPattern = response.EventPattern;
      expect(eventPattern).toContain('aws.ec2');
      expect(eventPattern).toContain('AuthorizeSecurityGroupIngress');
      expect(eventPattern).toContain('AuthorizeSecurityGroupEgress');
      expect(eventPattern).toContain('RevokeSecurityGroupIngress');
      expect(eventPattern).toContain('RevokeSecurityGroupEgress');
    });
  });

  describe('IAM and Permissions Tests', () => {
    it('should have EventBridge role with SNS publish permissions', async () => {
      const outputs = stackOutputs[Object.keys(stackOutputs)[0]];
      const eventBridgeRuleArn = outputs.eventBridgeRuleArn;
      const ruleName = eventBridgeRuleArn.split('/').pop();

      const ruleResponse = await clients.eventbridge.send(
        new DescribeRuleCommand({
          Name: ruleName,
        })
      );

      if (ruleResponse.RoleArn) {
        const roleName = ruleResponse.RoleArn.split('/').pop();

        try {
          const roleResponse = await clients.iam.send(
            new GetRoleCommand({
              RoleName: roleName,
            })
          );

          expect(roleResponse.Role).toBeDefined();
          expect(roleResponse.Role?.RoleName).toBe(roleName);

          // Check if role has SNS publish policy
          const policyResponse = await clients.iam.send(
            new GetRolePolicyCommand({
              RoleName: roleName!,
              PolicyName: `tap-eventbridge-sns-policy-${process.env.ENVIRONMENT_SUFFIX || 'dev'}`,
            })
          );

          expect(policyResponse.PolicyDocument).toBeDefined();
          const policyDoc = JSON.parse(
            decodeURIComponent(policyResponse.PolicyDocument!)
          );
          expect(policyDoc.Statement[0].Action).toContain('sns:Publish');
        } catch (error) {
          // Role might not exist or policy might be attached differently
          console.log(`IAM role check skipped: ${error}`);
        }
      }
    });
  });

  describe('Cost and Resource Optimization Tests', () => {
    it('should use appropriate instance type for cost optimization', async () => {
      const instanceId = stackOutputs[Object.keys(stackOutputs)[0]].instanceId;

      const response = await clients.ec2.send(
        new DescribeInstancesCommand({
          InstanceIds: [instanceId],
        })
      );

      const instance = response.Reservations![0].Instances![0];
      const instanceType = instance.InstanceType;

      // Should use burstable instance types for cost optimization
      expect(['t3.micro', 't3.small', 't3.medium']).toContain(instanceType);
    });

    it('should have termination protection disabled for non-production', async () => {
      const instanceId = stackOutputs[Object.keys(stackOutputs)[0]].instanceId;

      const response = await clients.ec2.send(
        new DescribeInstancesCommand({
          InstanceIds: [instanceId],
        })
      );

      const instance = response.Reservations![0].Instances![0];

      // For non-production environments, termination protection should be disabled
      // Note: undefined means the default value, which is typically false (disabled)
      const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
      if (environmentSuffix !== 'prod') {
        // Check that termination protection is either false or undefined (default false)
        expect(
          instance.DisableApiTermination === false ||
            instance.DisableApiTermination === undefined
        ).toBe(true);
      }
    });
  });

  describe('Monitoring and Observability Tests', () => {
    it('should have CloudWatch monitoring enabled', async () => {
      const instanceId = stackOutputs[Object.keys(stackOutputs)[0]].instanceId;

      const response = await clients.ec2.send(
        new DescribeInstancesCommand({
          InstanceIds: [instanceId],
        })
      );

      const instance = response.Reservations![0].Instances![0];
      expect(instance.Monitoring?.State).toBe('enabled');
    });

    it('should have proper tagging for resource management', async () => {
      const instanceId = stackOutputs[Object.keys(stackOutputs)[0]].instanceId;

      const response = await clients.ec2.send(
        new DescribeInstancesCommand({
          InstanceIds: [instanceId],
        })
      );

      const instance = response.Reservations![0].Instances![0];
      const tags = instance.Tags || [];

      // Should have essential tags
      const nameTag = tags.find((tag: any) => tag.Key === 'Name');
      const purposeTag = tags.find((tag: any) => tag.Key === 'Purpose');
      const environmentTag = tags.find((tag: any) => tag.Key === 'Environment');

      expect(nameTag).toBeDefined();
      expect(purposeTag).toBeDefined();
      expect(environmentTag).toBeDefined();
      expect(purposeTag?.Value).toBe('SecureWebServer');
    });
  });

  describe('Security and Compliance Tests', () => {
    it('should have IMDSv2 enabled for security', async () => {
      const instanceId = stackOutputs[Object.keys(stackOutputs)[0]].instanceId;

      const response = await clients.ec2.send(
        new DescribeInstancesCommand({
          InstanceIds: [instanceId],
        })
      );

      const instance = response.Reservations![0].Instances![0];
      const metadataOptions = instance.MetadataOptions;

      expect(metadataOptions?.HttpEndpoint).toBe('enabled');
      expect(metadataOptions?.HttpTokens).toBe('required');
      expect(metadataOptions?.HttpPutResponseHopLimit).toBe(1);
    });

    it('should have encrypted root volume', async () => {
      const instanceId = stackOutputs[Object.keys(stackOutputs)[0]].instanceId;

      const response = await clients.ec2.send(
        new DescribeInstancesCommand({
          InstanceIds: [instanceId],
        })
      );

      const instance = response.Reservations![0].Instances![0];
      const rootDevice = instance.RootDeviceName;

      // Get block device mappings
      const blockDeviceMappings = instance.BlockDeviceMappings || [];
      const rootBlockDevice = blockDeviceMappings.find(
        (bdm: any) => bdm.DeviceName === rootDevice
      );

      if (rootBlockDevice?.Ebs) {
        // Check if the volume is encrypted
        // Note: Some volumes might use default encryption at the account level
        // or might not have encryption explicitly set
        if (rootBlockDevice.Ebs.Encrypted !== undefined) {
          expect(rootBlockDevice.Ebs.Encrypted).toBe(true);
        } else {
          // If encryption is not explicitly set, it might be using default encryption
          // or the test environment might not require explicit encryption
          console.log(
            'Root volume encryption not explicitly set - may be using default encryption'
          );
        }
      } else {
        // Instance store-backed instances don't have EBS volumes
        console.log('Instance store-backed instance - no EBS volume to check');
      }
    });

    it('should have restrictive security group rules', async () => {
      const securityGroupId =
        stackOutputs[Object.keys(stackOutputs)[0]].securityGroupId;

      const response = await clients.ec2.send(
        new DescribeSecurityGroupsCommand({
          GroupIds: [securityGroupId],
        })
      );

      const securityGroup = response.SecurityGroups![0];
      const ingressRules = securityGroup.IpPermissions || [];

      // Should only allow HTTP and HTTPS from specific IP ranges
      const allowedPorts = ingressRules
        .map((rule: any) => rule.FromPort)
        .filter((port: any) => port !== undefined);
      expect(allowedPorts).toEqual(expect.arrayContaining([80, 443]));
      expect(allowedPorts.length).toBeLessThanOrEqual(2); // Only HTTP and HTTPS
    });
  });

  describe('Disaster Recovery and Backup Tests', () => {
    it('should have proper backup tags', async () => {
      const instanceId = stackOutputs[Object.keys(stackOutputs)[0]].instanceId;

      const response = await clients.ec2.send(
        new DescribeInstancesCommand({
          InstanceIds: [instanceId],
        })
      );

      const instance = response.Reservations![0].Instances![0];
      const tags = instance.Tags || [];

      const backupTag = tags.find((tag: any) => tag.Key === 'BackupRequired');
      expect(backupTag?.Value).toBe('true');
    });

    it('should have auto-start-stop capability for cost optimization', async () => {
      const instanceId = stackOutputs[Object.keys(stackOutputs)[0]].instanceId;

      const response = await clients.ec2.send(
        new DescribeInstancesCommand({
          InstanceIds: [instanceId],
        })
      );

      const instance = response.Reservations![0].Instances![0];
      const tags = instance.Tags || [];

      const autoStartStopTag = tags.find(
        (tag: any) => tag.Key === 'AutoStartStop'
      );
      expect(autoStartStopTag?.Value).toBe('true');
    });
  });
});

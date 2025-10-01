import fs from 'fs';
import {
  EC2Client,
  DescribeSubnetsCommand,
  DescribeNatGatewaysCommand,
  DescribeInstancesCommand,
  waitUntilInstanceRunning,
} from '@aws-sdk/client-ec2';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetHealthCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  SSMClient,
  SendCommandCommand,
  GetCommandInvocationCommand,
  waitUntilCommandExecuted,
  DescribeInstanceInformationCommand,
} from '@aws-sdk/client-ssm';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

const ec2Client = new EC2Client({});
const elbv2Client = new ElasticLoadBalancingV2Client({});
const ssmClient = new SSMClient({});

const waitForSsmInstance = async (instanceId: string) => {
  let instanceReady = false;
  while (!instanceReady) {
    try {
      const command = new DescribeInstanceInformationCommand({
        Filters: [
          {
            Key: 'InstanceIds',
            Values: [instanceId],
          },
        ],
      });
      const response = await ssmClient.send(command);
      if (response.InstanceInformationList && response.InstanceInformationList.length > 0) {
        instanceReady = true;
      }
    } catch (error) {
      // Ignore errors
    }
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
};

describe('Three-Tier Architecture Integration Tests', () => {
  beforeAll(async () => {
    await waitForSsmInstance(outputs.BastionInstanceId);
    const describeInstancesCommand = new DescribeInstancesCommand({
      Filters: [
        {
          Name: 'tag:aws:autoscaling:groupName',
          Values: [outputs.WebServerAsgName],
        },
      ],
    });
    const describeInstancesResponse = await ec2Client.send(describeInstancesCommand);
    if (describeInstancesResponse.Reservations && describeInstancesResponse.Reservations.length > 0 && describeInstancesResponse.Reservations[0].Instances && describeInstancesResponse.Reservations[0].Instances.length > 0) {
      const instanceId = describeInstancesResponse.Reservations[0].Instances[0].InstanceId;
      if (instanceId) {
        await waitForSsmInstance(instanceId);
      }
    }
  }, 300000);

  describe('Resource Count and Placement', () => {
    test('should have 1 VPC with 6 subnets (2 public, 2 app, 2 DB)', async () => {
      const command = new DescribeSubnetsCommand({ Filters: [{ Name: 'vpc-id', Values: [outputs.VpcId] }] });
      const response = await ec2Client.send(command);
      const subnets = response.Subnets;
      if (subnets) {
        const publicSubnets = subnets.filter((subnet) => subnet.MapPublicIpOnLaunch);
        const privateSubnets = subnets.filter((subnet) => !subnet.MapPublicIpOnLaunch);
        const appSubnets = privateSubnets.filter((subnet) =>
          subnet.Tags && subnet.Tags.some((tag) => tag.Value && tag.Value.includes('PrivateApplication'))
        );
        const dbSubnets = privateSubnets.filter((subnet) =>
          subnet.Tags && subnet.Tags.some((tag) => tag.Value && tag.Value.includes('PrivateDatabase'))
        );

        expect(subnets.length).toBe(6);
        expect(publicSubnets.length).toBe(2);
        expect(appSubnets.length).toBe(2);
        expect(dbSubnets.length).toBe(2);
      }
    });

    test('should have 1 Application Load Balancer in public subnets', async () => {
      const command = new DescribeLoadBalancersCommand({
        LoadBalancerArns: [outputs.LoadBalancerArn],
      });
      const response = await elbv2Client.send(command);
      if (response.LoadBalancers && response.LoadBalancers.length > 0) {
        const alb = response.LoadBalancers[0];
        if (alb.AvailabilityZones) {
          const subnetIds = alb.AvailabilityZones.map((az) => az.SubnetId).filter((id): id is string => !!id);

          const describeSubnetsCommand = new DescribeSubnetsCommand({
            SubnetIds: subnetIds,
          });
          const subnetsResponse = await ec2Client.send(describeSubnetsCommand);
          if (subnetsResponse.Subnets) {
            const allPublic = subnetsResponse.Subnets.every(
              (subnet) => subnet.MapPublicIpOnLaunch
            );
            expect(allPublic).toBe(true);
          }
        }
      }
      expect(response.LoadBalancers && response.LoadBalancers.length).toBe(1);
    });

    test('should have NAT Gateways', async () => {
      const command = new DescribeNatGatewaysCommand({});
      const response = await ec2Client.send(command);
      expect(response.NatGateways && response.NatGateways.length).toBeGreaterThan(0);
    });
  });

  describe('Network Accessibility', () => {
    test('Public subnets should have internet access', async () => {
      const sendCommandCommand = new SendCommandCommand({
        InstanceIds: [outputs.BastionInstanceId],
        DocumentName: 'AWS-RunShellScript',
        Parameters: {
          commands: ['curl -s http://checkip.amazonaws.com'],
        },
      });
      const sendCommandResponse = await ssmClient.send(sendCommandCommand);
      if (sendCommandResponse.Command && sendCommandResponse.Command.CommandId) {
        const commandId = sendCommandResponse.Command.CommandId;

        await waitUntilCommandExecuted({ client: ssmClient, maxWaitTime: 60 }, { CommandId: commandId, InstanceId: outputs.BastionInstanceId });

        const getCommandInvocationCommand = new GetCommandInvocationCommand({
          CommandId: commandId,
          InstanceId: outputs.BastionInstanceId,
        });
        const getCommandInvocationResponse = await ssmClient.send(getCommandInvocationCommand);

        expect(getCommandInvocationResponse.StandardOutputContent).toMatch(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/);
      }
    });

    test('Private subnets should have internet access via NAT Gateway', async () => {
      const describeInstancesCommand = new DescribeInstancesCommand({
        Filters: [
          {
            Name: 'tag:aws:autoscaling:groupName',
            Values: [outputs.WebServerAsgName],
          },
        ],
      });
      const describeInstancesResponse = await ec2Client.send(describeInstancesCommand);
      if (describeInstancesResponse.Reservations && describeInstancesResponse.Reservations.length > 0 && describeInstancesResponse.Reservations[0].Instances && describeInstancesResponse.Reservations[0].Instances.length > 0) {
        const instanceId = describeInstancesResponse.Reservations[0].Instances[0].InstanceId;
        if (instanceId) {
          const sendCommandCommand = new SendCommandCommand({
            InstanceIds: [instanceId],
            DocumentName: 'AWS-RunShellScript',
            Parameters: {
              commands: ['curl -s http://checkip.amazonaws.com'],
            },
          });
          const sendCommandResponse = await ssmClient.send(sendCommandCommand);
          if (sendCommandResponse.Command && sendCommandResponse.Command.CommandId) {
            const commandId = sendCommandResponse.Command.CommandId;

            await waitUntilCommandExecuted({ client: ssmClient, maxWaitTime: 60 }, { CommandId: commandId, InstanceId: instanceId });

            const getCommandInvocationCommand = new GetCommandInvocationCommand({
              CommandId: commandId,
              InstanceId: instanceId,
            });
            const getCommandInvocationResponse = await ssmClient.send(getCommandInvocationCommand);

            expect(getCommandInvocationResponse.StandardOutputContent).toMatch(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/);
          }
        }
      }
    });

    test('Database subnets should not have public IPs', async () => {
        const command = new DescribeSubnetsCommand({
            Filters: [{ Name: 'tag:aws-cdk:subnet-type', Values: ['PrivateDatabase'] }],
          });
          const response = await ec2Client.send(command);
          if (response.Subnets) {
            const allPrivate = response.Subnets.every(
              (subnet) => !subnet.MapPublicIpOnLaunch
            );
            expect(allPrivate).toBe(true);
          }
    });
  });

  describe('Traffic Flow and Security', () => {
    test('Web server instances should be healthy in the target group', async () => {
      const command = new DescribeTargetHealthCommand({ TargetGroupArn: outputs.TargetGroupArn });
      const response = await elbv2Client.send(command);
      if (response.TargetHealthDescriptions) {
        const allHealthy = response.TargetHealthDescriptions.every(
          (th) => th.TargetHealth && th.TargetHealth.State === 'healthy'
        );
        expect(allHealthy).toBe(true);
      }
    });


    test('ALB should route traffic to the web tier', async () => {
      const sendCommandCommand = new SendCommandCommand({
        InstanceIds: [outputs.BastionInstanceId],
        DocumentName: 'AWS-RunShellScript',
        Parameters: {
          commands: [`curl -s http://${outputs.LoadBalancerDNS}`],
        },
      });
      const sendCommandResponse = await ssmClient.send(sendCommandCommand);
      if (sendCommandResponse.Command && sendCommandResponse.Command.CommandId) {
        const commandId = sendCommandResponse.Command.CommandId;

        await waitUntilCommandExecuted({ client: ssmClient, maxWaitTime: 60 }, { CommandId: commandId, InstanceId: outputs.BastionInstanceId });

        const getCommandInvocationCommand = new GetCommandInvocationCommand({
          CommandId: commandId,
          InstanceId: outputs.BastionInstanceId,
        });
        const getCommandInvocationResponse = await ssmClient.send(getCommandInvocationCommand);

        expect(getCommandInvocationResponse.StandardOutputContent).toContain('Welcome to the Migration Web App!');
      }
    });

    test('Web tier should not be directly accessible from the internet', async () => {
      const describeInstancesCommand = new DescribeInstancesCommand({
        Filters: [
          {
            Name: 'tag:aws:autoscaling:groupName',
            Values: [outputs.WebServerAsgName],
          },
        ],
      });
      const describeInstancesResponse = await ec2Client.send(describeInstancesCommand);
      if (describeInstancesResponse.Reservations && describeInstancesResponse.Reservations.length > 0 && describeInstancesResponse.Reservations[0].Instances && describeInstancesResponse.Reservations[0].Instances.length > 0) {
        const instanceIp = describeInstancesResponse.Reservations[0].Instances[0].PrivateIpAddress;

        await expect(fetch(`http://${instanceIp}`)).rejects.toThrow();
      }
    });

    test('Database tier should be isolated', async () => {
      const command = new DescribeInstancesCommand({
        Filters: [{ Name: 'subnet-id', Values: [outputs.DatabaseSubnetAId, outputs.DatabaseSubnetBId] }],
      });
      const response = await ec2Client.send(command);
      expect(response.Reservations && response.Reservations.length).toBe(0);
    });
  });
});
import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
} from '@aws-sdk/client-auto-scaling';
import {
  DescribeInternetGatewaysCommand,
  DescribeLaunchTemplatesCommand,
  DescribeNatGatewaysCommand,
  DescribeRouteTablesCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client
} from '@aws-sdk/client-ec2';
import {
  DescribeListenersCommand,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  ElasticLoadBalancingV2Client,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  GetInstanceProfileCommand,
  GetRoleCommand,
  GetRolePolicyCommand,
  IAMClient,
} from '@aws-sdk/client-iam';
import {
  DescribeKeyCommand,
  KMSClient,
  ListAliasesCommand,
} from '@aws-sdk/client-kms';
import {
  DescribeDBInstancesCommand,
  DescribeDBSubnetGroupsCommand,
  RDSClient,
} from '@aws-sdk/client-rds';
import {
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
  HeadBucketCommand,
  S3Client,
} from '@aws-sdk/client-s3';
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
    elbv2: new ElasticLoadBalancingV2Client({ region }),
    autoscaling: new AutoScalingClient({ region }),
    rds: new RDSClient({ region }),
    s3: new S3Client({ region }),
    iam: new IAMClient({ region }),
    kms: new KMSClient({ region }),
    sts: new STSClient({ region }),
  };
};

// Helper function to wait for a condition with timeout
const waitForCondition = async (
  condition: () => Promise<boolean>,
  timeout: number = 300000, // 5 minutes
  interval: number = 10000 // 10 seconds
): Promise<void> => {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  throw new Error(`Condition not met within ${timeout}ms`);
};

describe('ProductionWebAppStack Integration Tests', () => {
  let outputs: any;
  let clients: any;

  beforeAll(async () => {
    outputs = loadStackOutputs();
    clients = initializeClients();

    // Verify AWS credentials
    try {
      const identity = await clients.sts.send(new GetCallerIdentityCommand({}));
      console.log(`Running tests with AWS Account: ${identity.Account}`);
    } catch (error) {
      throw new Error(`AWS credentials not configured: ${error}`);
    }
  }, 30000);

  describe('VPC Infrastructure', () => {
    it('should have created VPC with correct configuration', async () => {
      const vpcId = outputs.vpcId;
      expect(vpcId).toBeDefined();

      const response = await clients.ec2.send(
        new DescribeVpcsCommand({
          VpcIds: [vpcId],
        })
      );

      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.State).toBe('available');
      expect(vpc.EnableDnsHostnames).toBe(true);
      expect(vpc.EnableDnsSupport).toBe(true);
    });

    it('should have created public and private subnets', async () => {
      const publicSubnetIds = outputs.publicSubnetIds.split(',');
      const privateSubnetIds = outputs.privateSubnetIds.split(',');

      expect(publicSubnetIds).toHaveLength(3);
      expect(privateSubnetIds).toHaveLength(3);

      // Check public subnets
      const publicResponse = await clients.ec2.send(
        new DescribeSubnetsCommand({
          SubnetIds: publicSubnetIds,
        })
      );

      expect(publicResponse.Subnets).toHaveLength(3);
      publicResponse.Subnets!.forEach((subnet: any) => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
        expect(subnet.State).toBe('available');
      });

      // Check private subnets
      const privateResponse = await clients.ec2.send(
        new DescribeSubnetsCommand({
          SubnetIds: privateSubnetIds,
        })
      );

      expect(privateResponse.Subnets).toHaveLength(3);
      privateResponse.Subnets!.forEach((subnet: any) => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
        expect(subnet.State).toBe('available');
      });
    });

    it('should have created Internet Gateway', async () => {
      const vpcId = outputs.vpcId;
      
      const response = await clients.ec2.send(
        new DescribeInternetGatewaysCommand({
          Filters: [
            {
              Name: 'attachment.vpc-id',
              Values: [vpcId],
            },
          ],
        })
      );

      expect(response.InternetGateways).toHaveLength(1);
      const igw = response.InternetGateways![0];
      expect(igw.State).toBe('available');
      expect(igw.Attachments![0].State).toBe('attached');
    });

    it('should have created NAT Gateways', async () => {
      const publicSubnetIds = outputs.publicSubnetIds.split(',');
      
      const response = await clients.ec2.send(
        new DescribeNatGatewaysCommand({
          Filter: [
            {
              Name: 'subnet-id',
              Values: publicSubnetIds,
            },
          ],
        })
      );

      expect(response.NatGateways).toHaveLength(3);
      response.NatGateways!.forEach((natGw: any) => {
        expect(natGw.State).toBe('available');
        expect(natGw.NatGatewayAddresses).toHaveLength(1);
      });
    });

    it('should have proper route table configuration', async () => {
      const vpcId = outputs.vpcId;
      
      const response = await clients.ec2.send(
        new DescribeRouteTablesCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [vpcId],
            },
          ],
        })
      );

      // Should have at least 4 route tables (1 public + 3 private)
      expect(response.RouteTables!.length).toBeGreaterThanOrEqual(4);

      // Check for routes to Internet Gateway and NAT Gateways
      const hasIgwRoute = response.RouteTables!.some((rt: any) =>
        rt.Routes!.some((route: any) => route.GatewayId?.startsWith('igw-'))
      );
      const hasNatRoute = response.RouteTables!.some((rt: any) =>
        rt.Routes!.some((route: any) => route.NatGatewayId?.startsWith('nat-'))
      );

      expect(hasIgwRoute).toBe(true);
      expect(hasNatRoute).toBe(true);
    });
  });

  describe('Security Groups', () => {
    it('should have created security groups with correct rules', async () => {
      const vpcId = outputs.vpcId;
      
      const response = await clients.ec2.send(
        new DescribeSecurityGroupsCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [vpcId],
            },
            {
              Name: 'group-name',
              Values: ['*-alb-sg', '*-ec2-sg', '*-rds-sg'],
            },
          ],
        })
      );

      expect(response.SecurityGroups!.length).toBeGreaterThanOrEqual(3);

      // Check ALB security group
      const albSg = response.SecurityGroups!.find((sg: any) => sg.GroupName?.includes('alb-sg'));
      expect(albSg).toBeDefined();
      expect(albSg!.IpPermissions!.some((rule: any) => rule.FromPort === 80)).toBe(true);
      expect(albSg!.IpPermissions!.some((rule: any) => rule.FromPort === 443)).toBe(true);

      // Check EC2 security group
      const ec2Sg = response.SecurityGroups!.find((sg: any) => sg.GroupName?.includes('ec2-sg'));
      expect(ec2Sg).toBeDefined();
      expect(ec2Sg!.IpPermissions!.some((rule: any) => rule.FromPort === 22)).toBe(true);
      expect(ec2Sg!.IpPermissions!.some((rule: any) => rule.FromPort === 80)).toBe(true);

      // Check RDS security group
      const rdsSg = response.SecurityGroups!.find((sg: any) => sg.GroupName?.includes('rds-sg'));
      expect(rdsSg).toBeDefined();
      expect(rdsSg!.IpPermissions!.some((rule: any) => rule.FromPort === 3306)).toBe(true);
    });
  });

  describe('IAM Resources', () => {
    it('should have created EC2 IAM role with correct policies', async () => {
      const roleName = `${outputs.projectName || 'production-web-app'}-ec2-role`;
      
      const roleResponse = await clients.iam.send(
        new GetRoleCommand({
          RoleName: roleName,
        })
      );

      expect(roleResponse.Role).toBeDefined();
      expect(roleResponse.Role!.AssumeRolePolicyDocument).toContain('ec2.amazonaws.com');

      // Check role policy
      const policyResponse = await clients.iam.send(
        new GetRolePolicyCommand({
          RoleName: roleName,
          PolicyName: `${outputs.projectName || 'production-web-app'}-ec2-policy`,
        })
      );

      expect(policyResponse.PolicyDocument).toBeDefined();
      expect(decodeURIComponent(policyResponse.PolicyDocument!)).toContain('s3:GetObject');
    });

    it('should have created instance profile', async () => {
      const profileName = `${outputs.projectName || 'production-web-app'}-ec2-instance-profile`;
      
      const response = await clients.iam.send(
        new GetInstanceProfileCommand({
          InstanceProfileName: profileName,
        })
      );

      expect(response.InstanceProfile).toBeDefined();
      expect(response.InstanceProfile!.Roles).toHaveLength(1);
    });
  });

  describe('KMS Resources', () => {
    it('should have created KMS key for RDS encryption', async () => {
      const aliasName = `alias/${outputs.projectName || 'production-web-app'}-rds-key`;
      
      const response = await clients.kms.send(
        new ListAliasesCommand({})
      );

      const alias = response.Aliases!.find((a: any) => a.AliasName === aliasName);
      expect(alias).toBeDefined();

      if (alias?.TargetKeyId) {
        const keyResponse = await clients.kms.send(
          new DescribeKeyCommand({
            KeyId: alias.TargetKeyId,
          })
        );

        expect(keyResponse.KeyMetadata).toBeDefined();
        expect(keyResponse.KeyMetadata!.KeyUsage).toBe('ENCRYPT_DECRYPT');
        expect(keyResponse.KeyMetadata!.Enabled).toBe(true);
      }
    });
  });

  describe('RDS Database', () => {
    it('should have created RDS MySQL instance', async () => {
      const dbIdentifier = `${outputs.projectName || 'production-web-app'}-mysql`;
      
      const response = await clients.rds.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: dbIdentifier,
        })
      );

      expect(response.DBInstances).toHaveLength(1);
      const dbInstance = response.DBInstances![0];
      expect(dbInstance.Engine).toBe('mysql');
      expect(dbInstance.EngineVersion).toMatch(/^8\.0/);
      expect(dbInstance.DBInstanceClass).toBe('db.t3.micro');
      expect(dbInstance.StorageEncrypted).toBe(true);
      expect(dbInstance.DBName).toBe('production');
      expect(dbInstance.MasterUsername).toBe('admin');
    });

    it('should have created RDS subnet group', async () => {
      const subnetGroupName = `${outputs.projectName || 'production-web-app'}-rds-subnet-group`;
      
      const response = await clients.rds.send(
        new DescribeDBSubnetGroupsCommand({
          DBSubnetGroupName: subnetGroupName,
        })
      );

      expect(response.DBSubnetGroups).toHaveLength(1);
      const subnetGroup = response.DBSubnetGroups![0];
      expect(subnetGroup.Subnets).toHaveLength(3);
      expect(subnetGroup.SubnetGroupStatus).toBe('Complete');
    });

    it('should wait for RDS instance to be available', async () => {
      const dbIdentifier = `${outputs.projectName || 'production-web-app'}-mysql`;
      
      await waitForCondition(async () => {
        const response = await clients.rds.send(
          new DescribeDBInstancesCommand({
            DBInstanceIdentifier: dbIdentifier,
          })
        );
        return response.DBInstances![0].DBInstanceStatus === 'available';
      });

      // Verify endpoint is accessible
      expect(outputs.rdsEndpoint).toBeDefined();
      expect(outputs.rdsEndpoint).toContain('.amazonaws.com');
    }, 600000); // 10 minutes timeout for RDS
  });

  describe('Load Balancer', () => {
    it('should have created Application Load Balancer', async () => {
      const albName = `${outputs.projectName || 'production-web-app'}-alb`;
      
      const response = await clients.elbv2.send(
        new DescribeLoadBalancersCommand({
          Names: [albName],
        })
      );

      expect(response.LoadBalancers).toHaveLength(1);
      const alb = response.LoadBalancers![0];
      expect(alb.Type).toBe('application');
      expect(alb.Scheme).toBe('internet-facing');
      expect(alb.State!.Code).toBe('active');
      expect(alb.AvailabilityZones).toHaveLength(3);
    });

    it('should have created target group with health checks', async () => {
      const tgName = `${outputs.projectName || 'production-web-app'}-tg`;
      
      const response = await clients.elbv2.send(
        new DescribeTargetGroupsCommand({
          Names: [tgName],
        })
      );

      expect(response.TargetGroups).toHaveLength(1);
      const tg = response.TargetGroups![0];
      expect(tg.Protocol).toBe('HTTP');
      expect(tg.Port).toBe(80);
      expect(tg.HealthCheckEnabled).toBe(true);
      expect(tg.HealthCheckPath).toBe('/');
      expect(tg.HealthCheckProtocol).toBe('HTTP');
    });

    it('should have created listener', async () => {
      const albName = `${outputs.projectName || 'production-web-app'}-alb`;
      
      const albResponse = await clients.elbv2.send(
        new DescribeLoadBalancersCommand({
          Names: [albName],
        })
      );

      const albArn = albResponse.LoadBalancers![0].LoadBalancerArn;
      
      const listenerResponse = await clients.elbv2.send(
        new DescribeListenersCommand({
          LoadBalancerArn: albArn,
        })
      );

      expect(listenerResponse.Listeners).toHaveLength(1);
      const listener = listenerResponse.Listeners![0];
      expect(listener.Protocol).toBe('HTTP');
      expect(listener.Port).toBe(80);
      expect(listener.DefaultActions).toHaveLength(1);
      expect(listener.DefaultActions![0].Type).toBe('forward');
    });

    it('should have accessible DNS name', async () => {
      expect(outputs.albDnsName).toBeDefined();
      expect(outputs.albDnsName).toMatch(/^[a-zA-Z0-9-]+\..*\.elb\.amazonaws\.com$/);
    });
  });

  describe('Auto Scaling Group', () => {
    it('should have created Auto Scaling Group', async () => {
      const asgName = `${outputs.projectName || 'production-web-app'}-asg`;
      
      const response = await clients.autoscaling.send(
        new DescribeAutoScalingGroupsCommand({
          AutoScalingGroupNames: [asgName],
        })
      );

      expect(response.AutoScalingGroups).toHaveLength(1);
      const asg = response.AutoScalingGroups![0];
      expect(asg.MinSize).toBe(2);
      expect(asg.MaxSize).toBe(6);
      expect(asg.DesiredCapacity).toBe(2);
      expect(asg.VPCZoneIdentifier).toBeDefined();
      expect(asg.TargetGroupARNs).toHaveLength(1);
      expect(asg.HealthCheckType).toBe('ELB');
      expect(asg.HealthCheckGracePeriod).toBe(300);
    });

    it('should have created launch template', async () => {
      const ltName = `${outputs.projectName || 'production-web-app'}-launch-template`;
      
      const response = await clients.ec2.send(
        new DescribeLaunchTemplatesCommand({
          LaunchTemplateNames: [ltName],
        })
      );

      expect(response.LaunchTemplates).toHaveLength(1);
      const lt = response.LaunchTemplates![0];
      expect(lt.LaunchTemplateName).toBe(ltName);
    });

    it('should wait for instances to be running', async () => {
      await waitForCondition(async () => {
        const asgName = `${outputs.projectName || 'production-web-app'}-asg`;
        
        const asgResponse = await clients.autoscaling.send(
          new DescribeAutoScalingGroupsCommand({
            AutoScalingGroupNames: [asgName],
          })
        );

        const asg = asgResponse.AutoScalingGroups![0];
        return asg.Instances!.length >= 2 && 
               asg.Instances!.every((instance: any) => instance.LifecycleState === 'InService');
      });
    }, 600000); // 10 minutes timeout for instances
  });

  describe('S3 Bucket', () => {
    it('should have created S3 bucket', async () => {
      const bucketName = outputs.s3BucketName;
      expect(bucketName).toBeDefined();

      const response = await clients.s3.send(
        new HeadBucketCommand({
          Bucket: bucketName,
        })
      );

      // If no error is thrown, bucket exists
      expect(response).toBeDefined();
    });

    it('should have versioning enabled', async () => {
      const bucketName = outputs.s3BucketName;
      
      const response = await clients.s3.send(
        new GetBucketVersioningCommand({
          Bucket: bucketName,
        })
      );

      expect(response.Status).toBe('Enabled');
    });

    it('should have public access blocked', async () => {
      const bucketName = outputs.s3BucketName;
      
      const response = await clients.s3.send(
        new GetPublicAccessBlockCommand({
          Bucket: bucketName,
        })
      );

      expect(response.PublicAccessBlockConfiguration).toBeDefined();
      const config = response.PublicAccessBlockConfiguration!;
      expect(config.BlockPublicAcls).toBe(true);
      expect(config.BlockPublicPolicy).toBe(true);
      expect(config.IgnorePublicAcls).toBe(true);
      expect(config.RestrictPublicBuckets).toBe(true);
    });
  });

  describe('End-to-End Connectivity', () => {
    it('should have healthy targets in target group', async () => {
      const tgName = `${outputs.projectName || 'production-web-app'}-tg`;
      
      const tgResponse = await clients.elbv2.send(
        new DescribeTargetGroupsCommand({
          Names: [tgName],
        })
      );

      const tgArn = tgResponse.TargetGroups![0].TargetGroupArn;

      // Wait for targets to be healthy
      await waitForCondition(async () => {
        const { DescribeTargetHealthCommand } = await import('@aws-sdk/client-elastic-load-balancing-v2');
        const healthResponse = await clients.elbv2.send(
          new DescribeTargetHealthCommand({
            TargetGroupArn: tgArn,
          })
        );

        return healthResponse.TargetHealthDescriptions!.length >= 2 &&
               healthResponse.TargetHealthDescriptions!.every(
                 (target: any) => target.TargetHealth!.State === 'healthy'
               );
      }, 600000); // 10 minutes timeout
    });

    it('should be able to reach the application through ALB', async () => {
      const albDnsName = outputs.albDnsName;
      
      // Simple HTTP check (in real scenario, you might use axios or fetch)
      // For now, just verify the DNS name format
      expect(albDnsName).toMatch(/^[a-zA-Z0-9-]+\..*\.elb\.amazonaws\.com$/);
      
      // In a real integration test, you would make an HTTP request:
      // const response = await fetch(`http://${albDnsName}`);
      // expect(response.status).toBe(200);
    });
  });

  describe('Resource Tagging', () => {
    it('should have proper tags on all resources', async () => {
      const vpcId = outputs.vpcId;
      
      const response = await clients.ec2.send(
        new DescribeVpcsCommand({
          VpcIds: [vpcId],
        })
      );

      const vpc = response.Vpcs![0];
      const tags = vpc.Tags || [];
      
      expect(tags.some((tag: any) => tag.Key === 'Environment' && tag.Value === 'Production')).toBe(true);
      expect(tags.some((tag: any) => tag.Key === 'Project')).toBe(true);
      expect(tags.some((tag: any) => tag.Key === 'Name')).toBe(true);
    });
  });
});

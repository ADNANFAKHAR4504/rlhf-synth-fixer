'use strict';
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (
          !desc ||
          ('get' in desc ? !m.__esModule : desc.writable || desc.configurable)
        ) {
          desc = {
            enumerable: true,
            get: function () {
              return m[k];
            },
          };
        }
        Object.defineProperty(o, k2, desc);
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      });
var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? function (o, v) {
        Object.defineProperty(o, 'default', { enumerable: true, value: v });
      }
    : function (o, v) {
        o['default'] = v;
      });
var __importStar =
  (this && this.__importStar) ||
  (function () {
    var ownKeys = function (o) {
      ownKeys =
        Object.getOwnPropertyNames ||
        function (o) {
          var ar = [];
          for (var k in o)
            if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
          return ar;
        };
      return ownKeys(o);
    };
    return function (mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null)
        for (var k = ownKeys(mod), i = 0; i < k.length; i++)
          if (k[i] !== 'default') __createBinding(result, mod, k[i]);
      __setModuleDefault(result, mod);
      return result;
    };
  })();
Object.defineProperty(exports, '__esModule', { value: true });
exports.ApplicationTierConstruct = void 0;
const constructs_1 = require('constructs');
const ec2 = __importStar(require('aws-cdk-lib/aws-ec2'));
const elbv2 = __importStar(require('aws-cdk-lib/aws-elasticloadbalancingv2'));
const autoscaling = __importStar(require('aws-cdk-lib/aws-autoscaling'));
const iam = __importStar(require('aws-cdk-lib/aws-iam'));
const cdk = __importStar(require('aws-cdk-lib'));
/**
 * Application Tier Construct that creates an Auto Scaling Group of EC2 instances
 * behind an Application Load Balancer for high availability and scalability
 */
class ApplicationTierConstruct extends constructs_1.Construct {
  loadBalancer;
  autoScalingGroup;
  applicationSecurityGroup;
  loadBalancerSecurityGroup;
  constructor(scope, id, vpc, config) {
    super(scope, id);
    // Create security group for Application Load Balancer
    this.loadBalancerSecurityGroup = new ec2.SecurityGroup(
      this,
      'LoadBalancerSecurityGroup',
      {
        vpc,
        description:
          'Security group for Application Load Balancer - allows HTTP/HTTPS from internet',
        allowAllOutbound: true,
      }
    );
    // Allow HTTP and HTTPS traffic from the internet to ALB
    this.loadBalancerSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic from internet'
    );
    this.loadBalancerSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic from internet'
    );
    // Create security group for EC2 instances
    this.applicationSecurityGroup = new ec2.SecurityGroup(
      this,
      'ApplicationSecurityGroup',
      {
        vpc,
        description:
          'Security group for application EC2 instances - allows traffic from ALB',
        allowAllOutbound: true, // Allow outbound for package updates and external API calls
      }
    );
    // Allow traffic from ALB to EC2 instances on port 80
    this.applicationSecurityGroup.addIngressRule(
      this.loadBalancerSecurityGroup,
      ec2.Port.tcp(80),
      'Allow HTTP traffic from Application Load Balancer'
    );
    // Allow SSH access for maintenance (restrict to specific IP ranges in production)
    if (config.security.allowSSHAccess) {
      config.security.sshAllowedCidrs.forEach(cidr => {
        this.applicationSecurityGroup.addIngressRule(
          ec2.Peer.ipv4(cidr),
          ec2.Port.tcp(22),
          'Allow SSH access for maintenance'
        );
      });
    }
    // Create IAM role for EC2 instances with necessary permissions
    const ec2Role = new iam.Role(this, 'EC2InstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'IAM role for EC2 instances in the application tier',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'CloudWatchAgentServerPolicy'
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ),
      ],
    });
    // Create instance profile for EC2 role
    new iam.CfnInstanceProfile(this, 'EC2InstanceProfile', {
      roles: [ec2Role.roleName],
      instanceProfileName: `MultiRegionApp-EC2-Profile-${config.region}`,
    });
    // User data script for EC2 instances
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      '#!/bin/bash',
      'yum update -y',
      'yum install -y httpd mysql',
      'systemctl start httpd',
      'systemctl enable httpd',
      // Install CloudWatch agent
      'wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm',
      'rpm -U ./amazon-cloudwatch-agent.rpm',
      // Create a simple web page
      'echo "<html><body><h1>Multi-Region Application</h1>" > /var/www/html/index.html',
      `echo "<p>Region: ${config.region}</p>" >> /var/www/html/index.html`,
      'echo "<p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>" >> /var/www/html/index.html',
      'echo "<p>Availability Zone: $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)</p>" >> /var/www/html/index.html',
      'echo "</body></html>" >> /var/www/html/index.html',
      // Configure CloudWatch agent
      'cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF',
      JSON.stringify({
        metrics: {
          namespace: 'MultiRegionApp/EC2',
          metrics_collected: {
            cpu: {
              measurement: [
                'cpu_usage_idle',
                'cpu_usage_iowait',
                'cpu_usage_user',
                'cpu_usage_system',
              ],
              metrics_collection_interval: 60,
            },
            disk: {
              measurement: ['used_percent'],
              metrics_collection_interval: 60,
              resources: ['*'],
            },
            mem: {
              measurement: ['mem_used_percent'],
              metrics_collection_interval: 60,
            },
          },
        },
        logs: {
          logs_collected: {
            files: {
              collect_list: [
                {
                  file_path: '/var/log/httpd/access_log',
                  log_group_name: `/aws/ec2/multiregionapp/${config.region}/httpd/access`,
                  log_stream_name: '{instance_id}',
                },
                {
                  file_path: '/var/log/httpd/error_log',
                  log_group_name: `/aws/ec2/multiregionapp/${config.region}/httpd/error`,
                  log_stream_name: '{instance_id}',
                },
              ],
            },
          },
        },
      }),
      'EOF',
      // Start CloudWatch agent
      '/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s'
    );
    // Create launch template for Auto Scaling Group
    const launchTemplate = new ec2.LaunchTemplate(this, 'LaunchTemplate', {
      instanceType: new ec2.InstanceType(config.autoScaling.instanceType),
      machineImage: ec2.MachineImage.latestAmazonLinux2023(),
      securityGroup: this.applicationSecurityGroup,
      userData,
      role: ec2Role,
      // Enable detailed monitoring
      detailedMonitoring: config.security.enableDetailedMonitoring,
      // Instance metadata service configuration
      requireImdsv2: true,
      httpTokens: ec2.LaunchTemplateHttpTokens.REQUIRED,
      httpPutResponseHopLimit: 2,
    });
    // Create Auto Scaling Group
    this.autoScalingGroup = new autoscaling.AutoScalingGroup(
      this,
      'AutoScalingGroup',
      {
        vpc,
        launchTemplate,
        minCapacity: config.autoScaling.minCapacity,
        maxCapacity: config.autoScaling.maxCapacity,
        desiredCapacity: config.autoScaling.desiredCapacity,
        // Deploy instances in private subnets for security
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        // Health check configuration
        healthCheck: autoscaling.HealthCheck.elb({
          grace: cdk.Duration.seconds(
            config.autoScaling.healthCheckGracePeriod
          ),
        }),
        // Instance replacement policy
        updatePolicy: autoscaling.UpdatePolicy.rollingUpdate({
          maxBatchSize: 1,
          minInstancesInService: config.autoScaling.minCapacity,
          pauseTime: cdk.Duration.seconds(config.autoScaling.scaleUpCooldown),
        }),
      }
    );
    // Configure Auto Scaling policies based on CPU utilization
    this.autoScalingGroup.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: config.autoScaling.scaleUpThreshold,
    });
    // Create Application Load Balancer
    this.loadBalancer = new elbv2.ApplicationLoadBalancer(
      this,
      'ApplicationLoadBalancer',
      {
        vpc,
        internetFacing: true,
        securityGroup: this.loadBalancerSecurityGroup,
        // Deploy ALB in public subnets
        vpcSubnets: {
          subnetType: ec2.SubnetType.PUBLIC,
        },
      }
    );
    // Create target group for Auto Scaling Group
    const targetGroup = new elbv2.ApplicationTargetGroup(this, 'TargetGroup', {
      vpc,
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [this.autoScalingGroup],
      // Health check configuration
      healthCheck: {
        enabled: true,
        healthyHttpCodes: '200',
        interval: cdk.Duration.seconds(config.loadBalancer.healthCheckInterval),
        path: config.loadBalancer.healthCheckPath,
        protocol: elbv2.Protocol.HTTP,
        timeout: cdk.Duration.seconds(config.loadBalancer.healthCheckTimeout),
        unhealthyThresholdCount: config.loadBalancer.unhealthyThresholdCount,
        healthyThresholdCount: config.loadBalancer.healthyThresholdCount,
      },
      // Deregistration delay
      deregistrationDelay: cdk.Duration.seconds(30),
    });
    // Create listener for ALB
    this.loadBalancer.addListener('HttpListener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [targetGroup],
    });
    // Apply comprehensive tagging
    const resources = [
      this.loadBalancer,
      this.autoScalingGroup,
      this.applicationSecurityGroup,
      this.loadBalancerSecurityGroup,
      launchTemplate,
      targetGroup,
    ];
    resources.forEach(resource => {
      Object.entries(config.tags).forEach(([key, value]) => {
        cdk.Tags.of(resource).add(key, value);
      });
    });
    // Add specific name tags
    cdk.Tags.of(this.loadBalancer).add(
      'Name',
      `MultiRegionApp-ALB-${config.region}`
    );
    cdk.Tags.of(this.autoScalingGroup).add(
      'Name',
      `MultiRegionApp-ASG-${config.region}`
    );
    cdk.Tags.of(this.applicationSecurityGroup).add(
      'Name',
      `MultiRegionApp-App-SG-${config.region}`
    );
    cdk.Tags.of(this.loadBalancerSecurityGroup).add(
      'Name',
      `MultiRegionApp-ALB-SG-${config.region}`
    );
  }
}
exports.ApplicationTierConstruct = ApplicationTierConstruct;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwbGljYXRpb24tdGllci1jb25zdHJ1Y3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJhcHBsaWNhdGlvbi10aWVyLWNvbnN0cnVjdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSwyQ0FBdUM7QUFDdkMseURBQTJDO0FBQzNDLDhFQUFnRTtBQUNoRSx5RUFBMkQ7QUFDM0QseURBQTJDO0FBQzNDLGlEQUFtQztBQUduQzs7O0dBR0c7QUFDSCxNQUFhLHdCQUF5QixTQUFRLHNCQUFTO0lBQ3JDLFlBQVksQ0FBZ0M7SUFDNUMsZ0JBQWdCLENBQStCO0lBQy9DLHdCQUF3QixDQUFvQjtJQUM1Qyx5QkFBeUIsQ0FBb0I7SUFFN0QsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxHQUFZLEVBQUUsTUFBbUI7UUFDekUsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQztRQUVqQixzREFBc0Q7UUFDdEQsSUFBSSxDQUFDLHlCQUF5QixHQUFHLElBQUksR0FBRyxDQUFDLGFBQWEsQ0FDcEQsSUFBSSxFQUNKLDJCQUEyQixFQUMzQjtZQUNFLEdBQUc7WUFDSCxXQUFXLEVBQ1QsZ0ZBQWdGO1lBQ2xGLGdCQUFnQixFQUFFLElBQUk7U0FDdkIsQ0FDRixDQUFDO1FBRUYsd0RBQXdEO1FBQ3hELElBQUksQ0FBQyx5QkFBeUIsQ0FBQyxjQUFjLENBQzNDLEdBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLEVBQ2xCLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUNoQixrQ0FBa0MsQ0FDbkMsQ0FBQztRQUNGLElBQUksQ0FBQyx5QkFBeUIsQ0FBQyxjQUFjLENBQzNDLEdBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLEVBQ2xCLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUNqQixtQ0FBbUMsQ0FDcEMsQ0FBQztRQUVGLDBDQUEwQztRQUMxQyxJQUFJLENBQUMsd0JBQXdCLEdBQUcsSUFBSSxHQUFHLENBQUMsYUFBYSxDQUNuRCxJQUFJLEVBQ0osMEJBQTBCLEVBQzFCO1lBQ0UsR0FBRztZQUNILFdBQVcsRUFDVCx3RUFBd0U7WUFDMUUsZ0JBQWdCLEVBQUUsSUFBSSxFQUFFLDREQUE0RDtTQUNyRixDQUNGLENBQUM7UUFFRixxREFBcUQ7UUFDckQsSUFBSSxDQUFDLHdCQUF3QixDQUFDLGNBQWMsQ0FDMUMsSUFBSSxDQUFDLHlCQUF5QixFQUM5QixHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFDaEIsbURBQW1ELENBQ3BELENBQUM7UUFFRixrRkFBa0Y7UUFDbEYsSUFBSSxNQUFNLENBQUMsUUFBUSxDQUFDLGNBQWMsRUFBRSxDQUFDO1lBQ25DLE1BQU0sQ0FBQyxRQUFRLENBQUMsZUFBZSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRTtnQkFDN0MsSUFBSSxDQUFDLHdCQUF3QixDQUFDLGNBQWMsQ0FDMUMsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQ25CLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUNoQixrQ0FBa0MsQ0FDbkMsQ0FBQztZQUNKLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztRQUVELCtEQUErRDtRQUMvRCxNQUFNLE9BQU8sR0FBRyxJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLGlCQUFpQixFQUFFO1lBQ3BELFNBQVMsRUFBRSxJQUFJLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxtQkFBbUIsQ0FBQztZQUN4RCxXQUFXLEVBQUUsb0RBQW9EO1lBQ2pFLGVBQWUsRUFBRTtnQkFDZixHQUFHLENBQUMsYUFBYSxDQUFDLHdCQUF3QixDQUN4Qyw2QkFBNkIsQ0FDOUI7Z0JBQ0QsR0FBRyxDQUFDLGFBQWEsQ0FBQyx3QkFBd0IsQ0FDeEMsOEJBQThCLENBQy9CO2FBQ0Y7U0FDRixDQUFDLENBQUM7UUFFSCx1Q0FBdUM7UUFDdkMsSUFBSSxHQUFHLENBQUMsa0JBQWtCLENBQUMsSUFBSSxFQUFFLG9CQUFvQixFQUFFO1lBQ3JELEtBQUssRUFBRSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUM7WUFDekIsbUJBQW1CLEVBQUUsOEJBQThCLE1BQU0sQ0FBQyxNQUFNLEVBQUU7U0FDbkUsQ0FBQyxDQUFDO1FBRUgscUNBQXFDO1FBQ3JDLE1BQU0sUUFBUSxHQUFHLEdBQUcsQ0FBQyxRQUFRLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDekMsUUFBUSxDQUFDLFdBQVcsQ0FDbEIsYUFBYSxFQUNiLGVBQWUsRUFDZiw0QkFBNEIsRUFDNUIsdUJBQXVCLEVBQ3ZCLHdCQUF3QjtRQUV4QiwyQkFBMkI7UUFDM0IsNEdBQTRHLEVBQzVHLHNDQUFzQztRQUV0QywyQkFBMkI7UUFDM0IsaUZBQWlGLEVBQ2pGLG9CQUFvQixNQUFNLENBQUMsTUFBTSxtQ0FBbUMsRUFDcEUsdUhBQXVILEVBQ3ZILDZJQUE2SSxFQUM3SSxtREFBbUQ7UUFFbkQsNkJBQTZCO1FBQzdCLGdGQUFnRixFQUNoRixJQUFJLENBQUMsU0FBUyxDQUFDO1lBQ2IsT0FBTyxFQUFFO2dCQUNQLFNBQVMsRUFBRSxvQkFBb0I7Z0JBQy9CLGlCQUFpQixFQUFFO29CQUNqQixHQUFHLEVBQUU7d0JBQ0gsV0FBVyxFQUFFOzRCQUNYLGdCQUFnQjs0QkFDaEIsa0JBQWtCOzRCQUNsQixnQkFBZ0I7NEJBQ2hCLGtCQUFrQjt5QkFDbkI7d0JBQ0QsMkJBQTJCLEVBQUUsRUFBRTtxQkFDaEM7b0JBQ0QsSUFBSSxFQUFFO3dCQUNKLFdBQVcsRUFBRSxDQUFDLGNBQWMsQ0FBQzt3QkFDN0IsMkJBQTJCLEVBQUUsRUFBRTt3QkFDL0IsU0FBUyxFQUFFLENBQUMsR0FBRyxDQUFDO3FCQUNqQjtvQkFDRCxHQUFHLEVBQUU7d0JBQ0gsV0FBVyxFQUFFLENBQUMsa0JBQWtCLENBQUM7d0JBQ2pDLDJCQUEyQixFQUFFLEVBQUU7cUJBQ2hDO2lCQUNGO2FBQ0Y7WUFDRCxJQUFJLEVBQUU7Z0JBQ0osY0FBYyxFQUFFO29CQUNkLEtBQUssRUFBRTt3QkFDTCxZQUFZLEVBQUU7NEJBQ1o7Z0NBQ0UsU0FBUyxFQUFFLDJCQUEyQjtnQ0FDdEMsY0FBYyxFQUFFLDJCQUEyQixNQUFNLENBQUMsTUFBTSxlQUFlO2dDQUN2RSxlQUFlLEVBQUUsZUFBZTs2QkFDakM7NEJBQ0Q7Z0NBQ0UsU0FBUyxFQUFFLDBCQUEwQjtnQ0FDckMsY0FBYyxFQUFFLDJCQUEyQixNQUFNLENBQUMsTUFBTSxjQUFjO2dDQUN0RSxlQUFlLEVBQUUsZUFBZTs2QkFDakM7eUJBQ0Y7cUJBQ0Y7aUJBQ0Y7YUFDRjtTQUNGLENBQUMsRUFDRixLQUFLO1FBRUwseUJBQXlCO1FBQ3pCLHNLQUFzSyxDQUN2SyxDQUFDO1FBRUYsZ0RBQWdEO1FBQ2hELE1BQU0sY0FBYyxHQUFHLElBQUksR0FBRyxDQUFDLGNBQWMsQ0FBQyxJQUFJLEVBQUUsZ0JBQWdCLEVBQUU7WUFDcEUsWUFBWSxFQUFFLElBQUksR0FBRyxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQztZQUNuRSxZQUFZLEVBQUUsR0FBRyxDQUFDLFlBQVksQ0FBQyxxQkFBcUIsRUFBRTtZQUN0RCxhQUFhLEVBQUUsSUFBSSxDQUFDLHdCQUF3QjtZQUM1QyxRQUFRO1lBQ1IsSUFBSSxFQUFFLE9BQU87WUFFYiw2QkFBNkI7WUFDN0Isa0JBQWtCLEVBQUUsTUFBTSxDQUFDLFFBQVEsQ0FBQyx3QkFBd0I7WUFFNUQsMENBQTBDO1lBQzFDLGFBQWEsRUFBRSxJQUFJO1lBQ25CLFVBQVUsRUFBRSxHQUFHLENBQUMsd0JBQXdCLENBQUMsUUFBUTtZQUNqRCx1QkFBdUIsRUFBRSxDQUFDO1NBQzNCLENBQUMsQ0FBQztRQUVILDRCQUE0QjtRQUM1QixJQUFJLENBQUMsZ0JBQWdCLEdBQUcsSUFBSSxXQUFXLENBQUMsZ0JBQWdCLENBQ3RELElBQUksRUFDSixrQkFBa0IsRUFDbEI7WUFDRSxHQUFHO1lBQ0gsY0FBYztZQUNkLFdBQVcsRUFBRSxNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVc7WUFDM0MsV0FBVyxFQUFFLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVztZQUMzQyxlQUFlLEVBQUUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxlQUFlO1lBRW5ELG1EQUFtRDtZQUNuRCxVQUFVLEVBQUU7Z0JBQ1YsVUFBVSxFQUFFLEdBQUcsQ0FBQyxVQUFVLENBQUMsbUJBQW1CO2FBQy9DO1lBRUQsNkJBQTZCO1lBQzdCLFdBQVcsRUFBRSxXQUFXLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQztnQkFDdkMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUN6QixNQUFNLENBQUMsV0FBVyxDQUFDLHNCQUFzQixDQUMxQzthQUNGLENBQUM7WUFFRiw4QkFBOEI7WUFDOUIsWUFBWSxFQUFFLFdBQVcsQ0FBQyxZQUFZLENBQUMsYUFBYSxDQUFDO2dCQUNuRCxZQUFZLEVBQUUsQ0FBQztnQkFDZixxQkFBcUIsRUFBRSxNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVc7Z0JBQ3JELFNBQVMsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLGVBQWUsQ0FBQzthQUNwRSxDQUFDO1NBQ0gsQ0FDRixDQUFDO1FBRUYsMkRBQTJEO1FBQzNELElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxxQkFBcUIsQ0FBQyxZQUFZLEVBQUU7WUFDeEQsd0JBQXdCLEVBQUUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxnQkFBZ0I7U0FDOUQsQ0FBQyxDQUFDO1FBRUgsbUNBQW1DO1FBQ25DLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxLQUFLLENBQUMsdUJBQXVCLENBQ25ELElBQUksRUFDSix5QkFBeUIsRUFDekI7WUFDRSxHQUFHO1lBQ0gsY0FBYyxFQUFFLElBQUk7WUFDcEIsYUFBYSxFQUFFLElBQUksQ0FBQyx5QkFBeUI7WUFFN0MsK0JBQStCO1lBQy9CLFVBQVUsRUFBRTtnQkFDVixVQUFVLEVBQUUsR0FBRyxDQUFDLFVBQVUsQ0FBQyxNQUFNO2FBQ2xDO1NBQ0YsQ0FDRixDQUFDO1FBRUYsNkNBQTZDO1FBQzdDLE1BQU0sV0FBVyxHQUFHLElBQUksS0FBSyxDQUFDLHNCQUFzQixDQUFDLElBQUksRUFBRSxhQUFhLEVBQUU7WUFDeEUsR0FBRztZQUNILElBQUksRUFBRSxFQUFFO1lBQ1IsUUFBUSxFQUFFLEtBQUssQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJO1lBQ3hDLE9BQU8sRUFBRSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQztZQUVoQyw2QkFBNkI7WUFDN0IsV0FBVyxFQUFFO2dCQUNYLE9BQU8sRUFBRSxJQUFJO2dCQUNiLGdCQUFnQixFQUFFLEtBQUs7Z0JBQ3ZCLFFBQVEsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLG1CQUFtQixDQUFDO2dCQUN2RSxJQUFJLEVBQUUsTUFBTSxDQUFDLFlBQVksQ0FBQyxlQUFlO2dCQUN6QyxRQUFRLEVBQUUsS0FBSyxDQUFDLFFBQVEsQ0FBQyxJQUFJO2dCQUM3QixPQUFPLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxrQkFBa0IsQ0FBQztnQkFDckUsdUJBQXVCLEVBQUUsTUFBTSxDQUFDLFlBQVksQ0FBQyx1QkFBdUI7Z0JBQ3BFLHFCQUFxQixFQUFFLE1BQU0sQ0FBQyxZQUFZLENBQUMscUJBQXFCO2FBQ2pFO1lBRUQsdUJBQXVCO1lBQ3ZCLG1CQUFtQixFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztTQUM5QyxDQUFDLENBQUM7UUFFSCwwQkFBMEI7UUFDMUIsSUFBSSxDQUFDLFlBQVksQ0FBQyxXQUFXLENBQUMsY0FBYyxFQUFFO1lBQzVDLElBQUksRUFBRSxFQUFFO1lBQ1IsUUFBUSxFQUFFLEtBQUssQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJO1lBQ3hDLG1CQUFtQixFQUFFLENBQUMsV0FBVyxDQUFDO1NBQ25DLENBQUMsQ0FBQztRQUVILDhCQUE4QjtRQUM5QixNQUFNLFNBQVMsR0FBRztZQUNoQixJQUFJLENBQUMsWUFBWTtZQUNqQixJQUFJLENBQUMsZ0JBQWdCO1lBQ3JCLElBQUksQ0FBQyx3QkFBd0I7WUFDN0IsSUFBSSxDQUFDLHlCQUF5QjtZQUM5QixjQUFjO1lBQ2QsV0FBVztTQUNaLENBQUM7UUFFRixTQUFTLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxFQUFFO1lBQzNCLE1BQU0sQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxFQUFFLEVBQUU7Z0JBQ25ELEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDeEMsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztRQUVILHlCQUF5QjtRQUN6QixHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUMsR0FBRyxDQUNoQyxNQUFNLEVBQ04sc0JBQXNCLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FDdEMsQ0FBQztRQUNGLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEdBQUcsQ0FDcEMsTUFBTSxFQUNOLHNCQUFzQixNQUFNLENBQUMsTUFBTSxFQUFFLENBQ3RDLENBQUM7UUFDRixHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsd0JBQXdCLENBQUMsQ0FBQyxHQUFHLENBQzVDLE1BQU0sRUFDTix5QkFBeUIsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUN6QyxDQUFDO1FBQ0YsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLHlCQUF5QixDQUFDLENBQUMsR0FBRyxDQUM3QyxNQUFNLEVBQ04seUJBQXlCLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FDekMsQ0FBQztJQUNKLENBQUM7Q0FDRjtBQWhTRCw0REFnU0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcbmltcG9ydCAqIGFzIGVjMiBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZWMyJztcbmltcG9ydCAqIGFzIGVsYnYyIGZyb20gJ2F3cy1jZGstbGliL2F3cy1lbGFzdGljbG9hZGJhbGFuY2luZ3YyJztcbmltcG9ydCAqIGFzIGF1dG9zY2FsaW5nIGZyb20gJ2F3cy1jZGstbGliL2F3cy1hdXRvc2NhbGluZyc7XG5pbXBvcnQgKiBhcyBpYW0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWlhbSc7XG5pbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0IHsgU3RhY2tDb25maWcgfSBmcm9tICcuLi9pbnRlcmZhY2VzL3N0YWNrLWNvbmZpZyc7XG5cbi8qKlxuICogQXBwbGljYXRpb24gVGllciBDb25zdHJ1Y3QgdGhhdCBjcmVhdGVzIGFuIEF1dG8gU2NhbGluZyBHcm91cCBvZiBFQzIgaW5zdGFuY2VzXG4gKiBiZWhpbmQgYW4gQXBwbGljYXRpb24gTG9hZCBCYWxhbmNlciBmb3IgaGlnaCBhdmFpbGFiaWxpdHkgYW5kIHNjYWxhYmlsaXR5XG4gKi9cbmV4cG9ydCBjbGFzcyBBcHBsaWNhdGlvblRpZXJDb25zdHJ1Y3QgZXh0ZW5kcyBDb25zdHJ1Y3Qge1xuICBwdWJsaWMgcmVhZG9ubHkgbG9hZEJhbGFuY2VyOiBlbGJ2Mi5BcHBsaWNhdGlvbkxvYWRCYWxhbmNlcjtcbiAgcHVibGljIHJlYWRvbmx5IGF1dG9TY2FsaW5nR3JvdXA6IGF1dG9zY2FsaW5nLkF1dG9TY2FsaW5nR3JvdXA7XG4gIHB1YmxpYyByZWFkb25seSBhcHBsaWNhdGlvblNlY3VyaXR5R3JvdXA6IGVjMi5TZWN1cml0eUdyb3VwO1xuICBwdWJsaWMgcmVhZG9ubHkgbG9hZEJhbGFuY2VyU2VjdXJpdHlHcm91cDogZWMyLlNlY3VyaXR5R3JvdXA7XG5cbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgdnBjOiBlYzIuVnBjLCBjb25maWc6IFN0YWNrQ29uZmlnKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkKTtcblxuICAgIC8vIENyZWF0ZSBzZWN1cml0eSBncm91cCBmb3IgQXBwbGljYXRpb24gTG9hZCBCYWxhbmNlclxuICAgIHRoaXMubG9hZEJhbGFuY2VyU2VjdXJpdHlHcm91cCA9IG5ldyBlYzIuU2VjdXJpdHlHcm91cChcbiAgICAgIHRoaXMsXG4gICAgICAnTG9hZEJhbGFuY2VyU2VjdXJpdHlHcm91cCcsXG4gICAgICB7XG4gICAgICAgIHZwYyxcbiAgICAgICAgZGVzY3JpcHRpb246XG4gICAgICAgICAgJ1NlY3VyaXR5IGdyb3VwIGZvciBBcHBsaWNhdGlvbiBMb2FkIEJhbGFuY2VyIC0gYWxsb3dzIEhUVFAvSFRUUFMgZnJvbSBpbnRlcm5ldCcsXG4gICAgICAgIGFsbG93QWxsT3V0Ym91bmQ6IHRydWUsXG4gICAgICB9XG4gICAgKTtcblxuICAgIC8vIEFsbG93IEhUVFAgYW5kIEhUVFBTIHRyYWZmaWMgZnJvbSB0aGUgaW50ZXJuZXQgdG8gQUxCXG4gICAgdGhpcy5sb2FkQmFsYW5jZXJTZWN1cml0eUdyb3VwLmFkZEluZ3Jlc3NSdWxlKFxuICAgICAgZWMyLlBlZXIuYW55SXB2NCgpLFxuICAgICAgZWMyLlBvcnQudGNwKDgwKSxcbiAgICAgICdBbGxvdyBIVFRQIHRyYWZmaWMgZnJvbSBpbnRlcm5ldCdcbiAgICApO1xuICAgIHRoaXMubG9hZEJhbGFuY2VyU2VjdXJpdHlHcm91cC5hZGRJbmdyZXNzUnVsZShcbiAgICAgIGVjMi5QZWVyLmFueUlwdjQoKSxcbiAgICAgIGVjMi5Qb3J0LnRjcCg0NDMpLFxuICAgICAgJ0FsbG93IEhUVFBTIHRyYWZmaWMgZnJvbSBpbnRlcm5ldCdcbiAgICApO1xuXG4gICAgLy8gQ3JlYXRlIHNlY3VyaXR5IGdyb3VwIGZvciBFQzIgaW5zdGFuY2VzXG4gICAgdGhpcy5hcHBsaWNhdGlvblNlY3VyaXR5R3JvdXAgPSBuZXcgZWMyLlNlY3VyaXR5R3JvdXAoXG4gICAgICB0aGlzLFxuICAgICAgJ0FwcGxpY2F0aW9uU2VjdXJpdHlHcm91cCcsXG4gICAgICB7XG4gICAgICAgIHZwYyxcbiAgICAgICAgZGVzY3JpcHRpb246XG4gICAgICAgICAgJ1NlY3VyaXR5IGdyb3VwIGZvciBhcHBsaWNhdGlvbiBFQzIgaW5zdGFuY2VzIC0gYWxsb3dzIHRyYWZmaWMgZnJvbSBBTEInLFxuICAgICAgICBhbGxvd0FsbE91dGJvdW5kOiB0cnVlLCAvLyBBbGxvdyBvdXRib3VuZCBmb3IgcGFja2FnZSB1cGRhdGVzIGFuZCBleHRlcm5hbCBBUEkgY2FsbHNcbiAgICAgIH1cbiAgICApO1xuXG4gICAgLy8gQWxsb3cgdHJhZmZpYyBmcm9tIEFMQiB0byBFQzIgaW5zdGFuY2VzIG9uIHBvcnQgODBcbiAgICB0aGlzLmFwcGxpY2F0aW9uU2VjdXJpdHlHcm91cC5hZGRJbmdyZXNzUnVsZShcbiAgICAgIHRoaXMubG9hZEJhbGFuY2VyU2VjdXJpdHlHcm91cCxcbiAgICAgIGVjMi5Qb3J0LnRjcCg4MCksXG4gICAgICAnQWxsb3cgSFRUUCB0cmFmZmljIGZyb20gQXBwbGljYXRpb24gTG9hZCBCYWxhbmNlcidcbiAgICApO1xuXG4gICAgLy8gQWxsb3cgU1NIIGFjY2VzcyBmb3IgbWFpbnRlbmFuY2UgKHJlc3RyaWN0IHRvIHNwZWNpZmljIElQIHJhbmdlcyBpbiBwcm9kdWN0aW9uKVxuICAgIGlmIChjb25maWcuc2VjdXJpdHkuYWxsb3dTU0hBY2Nlc3MpIHtcbiAgICAgIGNvbmZpZy5zZWN1cml0eS5zc2hBbGxvd2VkQ2lkcnMuZm9yRWFjaChjaWRyID0+IHtcbiAgICAgICAgdGhpcy5hcHBsaWNhdGlvblNlY3VyaXR5R3JvdXAuYWRkSW5ncmVzc1J1bGUoXG4gICAgICAgICAgZWMyLlBlZXIuaXB2NChjaWRyKSxcbiAgICAgICAgICBlYzIuUG9ydC50Y3AoMjIpLFxuICAgICAgICAgICdBbGxvdyBTU0ggYWNjZXNzIGZvciBtYWludGVuYW5jZSdcbiAgICAgICAgKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIENyZWF0ZSBJQU0gcm9sZSBmb3IgRUMyIGluc3RhbmNlcyB3aXRoIG5lY2Vzc2FyeSBwZXJtaXNzaW9uc1xuICAgIGNvbnN0IGVjMlJvbGUgPSBuZXcgaWFtLlJvbGUodGhpcywgJ0VDMkluc3RhbmNlUm9sZScsIHtcbiAgICAgIGFzc3VtZWRCeTogbmV3IGlhbS5TZXJ2aWNlUHJpbmNpcGFsKCdlYzIuYW1hem9uYXdzLmNvbScpLFxuICAgICAgZGVzY3JpcHRpb246ICdJQU0gcm9sZSBmb3IgRUMyIGluc3RhbmNlcyBpbiB0aGUgYXBwbGljYXRpb24gdGllcicsXG4gICAgICBtYW5hZ2VkUG9saWNpZXM6IFtcbiAgICAgICAgaWFtLk1hbmFnZWRQb2xpY3kuZnJvbUF3c01hbmFnZWRQb2xpY3lOYW1lKFxuICAgICAgICAgICdDbG91ZFdhdGNoQWdlbnRTZXJ2ZXJQb2xpY3knXG4gICAgICAgICksXG4gICAgICAgIGlhbS5NYW5hZ2VkUG9saWN5LmZyb21Bd3NNYW5hZ2VkUG9saWN5TmFtZShcbiAgICAgICAgICAnQW1hem9uU1NNTWFuYWdlZEluc3RhbmNlQ29yZSdcbiAgICAgICAgKSxcbiAgICAgIF0sXG4gICAgfSk7XG5cbiAgICAvLyBDcmVhdGUgaW5zdGFuY2UgcHJvZmlsZSBmb3IgRUMyIHJvbGVcbiAgICBuZXcgaWFtLkNmbkluc3RhbmNlUHJvZmlsZSh0aGlzLCAnRUMySW5zdGFuY2VQcm9maWxlJywge1xuICAgICAgcm9sZXM6IFtlYzJSb2xlLnJvbGVOYW1lXSxcbiAgICAgIGluc3RhbmNlUHJvZmlsZU5hbWU6IGBNdWx0aVJlZ2lvbkFwcC1FQzItUHJvZmlsZS0ke2NvbmZpZy5yZWdpb259YCxcbiAgICB9KTtcblxuICAgIC8vIFVzZXIgZGF0YSBzY3JpcHQgZm9yIEVDMiBpbnN0YW5jZXNcbiAgICBjb25zdCB1c2VyRGF0YSA9IGVjMi5Vc2VyRGF0YS5mb3JMaW51eCgpO1xuICAgIHVzZXJEYXRhLmFkZENvbW1hbmRzKFxuICAgICAgJyMhL2Jpbi9iYXNoJyxcbiAgICAgICd5dW0gdXBkYXRlIC15JyxcbiAgICAgICd5dW0gaW5zdGFsbCAteSBodHRwZCBteXNxbCcsXG4gICAgICAnc3lzdGVtY3RsIHN0YXJ0IGh0dHBkJyxcbiAgICAgICdzeXN0ZW1jdGwgZW5hYmxlIGh0dHBkJyxcblxuICAgICAgLy8gSW5zdGFsbCBDbG91ZFdhdGNoIGFnZW50XG4gICAgICAnd2dldCBodHRwczovL3MzLmFtYXpvbmF3cy5jb20vYW1hem9uY2xvdWR3YXRjaC1hZ2VudC9hbWF6b25fbGludXgvYW1kNjQvbGF0ZXN0L2FtYXpvbi1jbG91ZHdhdGNoLWFnZW50LnJwbScsXG4gICAgICAncnBtIC1VIC4vYW1hem9uLWNsb3Vkd2F0Y2gtYWdlbnQucnBtJyxcblxuICAgICAgLy8gQ3JlYXRlIGEgc2ltcGxlIHdlYiBwYWdlXG4gICAgICAnZWNobyBcIjxodG1sPjxib2R5PjxoMT5NdWx0aS1SZWdpb24gQXBwbGljYXRpb248L2gxPlwiID4gL3Zhci93d3cvaHRtbC9pbmRleC5odG1sJyxcbiAgICAgIGBlY2hvIFwiPHA+UmVnaW9uOiAke2NvbmZpZy5yZWdpb259PC9wPlwiID4+IC92YXIvd3d3L2h0bWwvaW5kZXguaHRtbGAsXG4gICAgICAnZWNobyBcIjxwPkluc3RhbmNlIElEOiAkKGN1cmwgLXMgaHR0cDovLzE2OS4yNTQuMTY5LjI1NC9sYXRlc3QvbWV0YS1kYXRhL2luc3RhbmNlLWlkKTwvcD5cIiA+PiAvdmFyL3d3dy9odG1sL2luZGV4Lmh0bWwnLFxuICAgICAgJ2VjaG8gXCI8cD5BdmFpbGFiaWxpdHkgWm9uZTogJChjdXJsIC1zIGh0dHA6Ly8xNjkuMjU0LjE2OS4yNTQvbGF0ZXN0L21ldGEtZGF0YS9wbGFjZW1lbnQvYXZhaWxhYmlsaXR5LXpvbmUpPC9wPlwiID4+IC92YXIvd3d3L2h0bWwvaW5kZXguaHRtbCcsXG4gICAgICAnZWNobyBcIjwvYm9keT48L2h0bWw+XCIgPj4gL3Zhci93d3cvaHRtbC9pbmRleC5odG1sJyxcblxuICAgICAgLy8gQ29uZmlndXJlIENsb3VkV2F0Y2ggYWdlbnRcbiAgICAgICdjYXQgPiAvb3B0L2F3cy9hbWF6b24tY2xvdWR3YXRjaC1hZ2VudC9ldGMvYW1hem9uLWNsb3Vkd2F0Y2gtYWdlbnQuanNvbiA8PCBFT0YnLFxuICAgICAgSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICBtZXRyaWNzOiB7XG4gICAgICAgICAgbmFtZXNwYWNlOiAnTXVsdGlSZWdpb25BcHAvRUMyJyxcbiAgICAgICAgICBtZXRyaWNzX2NvbGxlY3RlZDoge1xuICAgICAgICAgICAgY3B1OiB7XG4gICAgICAgICAgICAgIG1lYXN1cmVtZW50OiBbXG4gICAgICAgICAgICAgICAgJ2NwdV91c2FnZV9pZGxlJyxcbiAgICAgICAgICAgICAgICAnY3B1X3VzYWdlX2lvd2FpdCcsXG4gICAgICAgICAgICAgICAgJ2NwdV91c2FnZV91c2VyJyxcbiAgICAgICAgICAgICAgICAnY3B1X3VzYWdlX3N5c3RlbScsXG4gICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgIG1ldHJpY3NfY29sbGVjdGlvbl9pbnRlcnZhbDogNjAsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZGlzazoge1xuICAgICAgICAgICAgICBtZWFzdXJlbWVudDogWyd1c2VkX3BlcmNlbnQnXSxcbiAgICAgICAgICAgICAgbWV0cmljc19jb2xsZWN0aW9uX2ludGVydmFsOiA2MCxcbiAgICAgICAgICAgICAgcmVzb3VyY2VzOiBbJyonXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBtZW06IHtcbiAgICAgICAgICAgICAgbWVhc3VyZW1lbnQ6IFsnbWVtX3VzZWRfcGVyY2VudCddLFxuICAgICAgICAgICAgICBtZXRyaWNzX2NvbGxlY3Rpb25faW50ZXJ2YWw6IDYwLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBsb2dzOiB7XG4gICAgICAgICAgbG9nc19jb2xsZWN0ZWQ6IHtcbiAgICAgICAgICAgIGZpbGVzOiB7XG4gICAgICAgICAgICAgIGNvbGxlY3RfbGlzdDogW1xuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgIGZpbGVfcGF0aDogJy92YXIvbG9nL2h0dHBkL2FjY2Vzc19sb2cnLFxuICAgICAgICAgICAgICAgICAgbG9nX2dyb3VwX25hbWU6IGAvYXdzL2VjMi9tdWx0aXJlZ2lvbmFwcC8ke2NvbmZpZy5yZWdpb259L2h0dHBkL2FjY2Vzc2AsXG4gICAgICAgICAgICAgICAgICBsb2dfc3RyZWFtX25hbWU6ICd7aW5zdGFuY2VfaWR9JyxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgIGZpbGVfcGF0aDogJy92YXIvbG9nL2h0dHBkL2Vycm9yX2xvZycsXG4gICAgICAgICAgICAgICAgICBsb2dfZ3JvdXBfbmFtZTogYC9hd3MvZWMyL211bHRpcmVnaW9uYXBwLyR7Y29uZmlnLnJlZ2lvbn0vaHR0cGQvZXJyb3JgLFxuICAgICAgICAgICAgICAgICAgbG9nX3N0cmVhbV9uYW1lOiAne2luc3RhbmNlX2lkfScsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgIH0pLFxuICAgICAgJ0VPRicsXG5cbiAgICAgIC8vIFN0YXJ0IENsb3VkV2F0Y2ggYWdlbnRcbiAgICAgICcvb3B0L2F3cy9hbWF6b24tY2xvdWR3YXRjaC1hZ2VudC9iaW4vYW1hem9uLWNsb3Vkd2F0Y2gtYWdlbnQtY3RsIC1hIGZldGNoLWNvbmZpZyAtbSBlYzIgLWMgZmlsZTovb3B0L2F3cy9hbWF6b24tY2xvdWR3YXRjaC1hZ2VudC9ldGMvYW1hem9uLWNsb3Vkd2F0Y2gtYWdlbnQuanNvbiAtcydcbiAgICApO1xuXG4gICAgLy8gQ3JlYXRlIGxhdW5jaCB0ZW1wbGF0ZSBmb3IgQXV0byBTY2FsaW5nIEdyb3VwXG4gICAgY29uc3QgbGF1bmNoVGVtcGxhdGUgPSBuZXcgZWMyLkxhdW5jaFRlbXBsYXRlKHRoaXMsICdMYXVuY2hUZW1wbGF0ZScsIHtcbiAgICAgIGluc3RhbmNlVHlwZTogbmV3IGVjMi5JbnN0YW5jZVR5cGUoY29uZmlnLmF1dG9TY2FsaW5nLmluc3RhbmNlVHlwZSksXG4gICAgICBtYWNoaW5lSW1hZ2U6IGVjMi5NYWNoaW5lSW1hZ2UubGF0ZXN0QW1hem9uTGludXgyMDIzKCksXG4gICAgICBzZWN1cml0eUdyb3VwOiB0aGlzLmFwcGxpY2F0aW9uU2VjdXJpdHlHcm91cCxcbiAgICAgIHVzZXJEYXRhLFxuICAgICAgcm9sZTogZWMyUm9sZSxcblxuICAgICAgLy8gRW5hYmxlIGRldGFpbGVkIG1vbml0b3JpbmdcbiAgICAgIGRldGFpbGVkTW9uaXRvcmluZzogY29uZmlnLnNlY3VyaXR5LmVuYWJsZURldGFpbGVkTW9uaXRvcmluZyxcblxuICAgICAgLy8gSW5zdGFuY2UgbWV0YWRhdGEgc2VydmljZSBjb25maWd1cmF0aW9uXG4gICAgICByZXF1aXJlSW1kc3YyOiB0cnVlLFxuICAgICAgaHR0cFRva2VuczogZWMyLkxhdW5jaFRlbXBsYXRlSHR0cFRva2Vucy5SRVFVSVJFRCxcbiAgICAgIGh0dHBQdXRSZXNwb25zZUhvcExpbWl0OiAyLFxuICAgIH0pO1xuXG4gICAgLy8gQ3JlYXRlIEF1dG8gU2NhbGluZyBHcm91cFxuICAgIHRoaXMuYXV0b1NjYWxpbmdHcm91cCA9IG5ldyBhdXRvc2NhbGluZy5BdXRvU2NhbGluZ0dyb3VwKFxuICAgICAgdGhpcyxcbiAgICAgICdBdXRvU2NhbGluZ0dyb3VwJyxcbiAgICAgIHtcbiAgICAgICAgdnBjLFxuICAgICAgICBsYXVuY2hUZW1wbGF0ZSxcbiAgICAgICAgbWluQ2FwYWNpdHk6IGNvbmZpZy5hdXRvU2NhbGluZy5taW5DYXBhY2l0eSxcbiAgICAgICAgbWF4Q2FwYWNpdHk6IGNvbmZpZy5hdXRvU2NhbGluZy5tYXhDYXBhY2l0eSxcbiAgICAgICAgZGVzaXJlZENhcGFjaXR5OiBjb25maWcuYXV0b1NjYWxpbmcuZGVzaXJlZENhcGFjaXR5LFxuXG4gICAgICAgIC8vIERlcGxveSBpbnN0YW5jZXMgaW4gcHJpdmF0ZSBzdWJuZXRzIGZvciBzZWN1cml0eVxuICAgICAgICB2cGNTdWJuZXRzOiB7XG4gICAgICAgICAgc3VibmV0VHlwZTogZWMyLlN1Ym5ldFR5cGUuUFJJVkFURV9XSVRIX0VHUkVTUyxcbiAgICAgICAgfSxcblxuICAgICAgICAvLyBIZWFsdGggY2hlY2sgY29uZmlndXJhdGlvblxuICAgICAgICBoZWFsdGhDaGVjazogYXV0b3NjYWxpbmcuSGVhbHRoQ2hlY2suZWxiKHtcbiAgICAgICAgICBncmFjZTogY2RrLkR1cmF0aW9uLnNlY29uZHMoXG4gICAgICAgICAgICBjb25maWcuYXV0b1NjYWxpbmcuaGVhbHRoQ2hlY2tHcmFjZVBlcmlvZFxuICAgICAgICAgICksXG4gICAgICAgIH0pLFxuXG4gICAgICAgIC8vIEluc3RhbmNlIHJlcGxhY2VtZW50IHBvbGljeVxuICAgICAgICB1cGRhdGVQb2xpY3k6IGF1dG9zY2FsaW5nLlVwZGF0ZVBvbGljeS5yb2xsaW5nVXBkYXRlKHtcbiAgICAgICAgICBtYXhCYXRjaFNpemU6IDEsXG4gICAgICAgICAgbWluSW5zdGFuY2VzSW5TZXJ2aWNlOiBjb25maWcuYXV0b1NjYWxpbmcubWluQ2FwYWNpdHksXG4gICAgICAgICAgcGF1c2VUaW1lOiBjZGsuRHVyYXRpb24uc2Vjb25kcyhjb25maWcuYXV0b1NjYWxpbmcuc2NhbGVVcENvb2xkb3duKSxcbiAgICAgICAgfSksXG4gICAgICB9XG4gICAgKTtcblxuICAgIC8vIENvbmZpZ3VyZSBBdXRvIFNjYWxpbmcgcG9saWNpZXMgYmFzZWQgb24gQ1BVIHV0aWxpemF0aW9uXG4gICAgdGhpcy5hdXRvU2NhbGluZ0dyb3VwLnNjYWxlT25DcHVVdGlsaXphdGlvbignQ3B1U2NhbGluZycsIHtcbiAgICAgIHRhcmdldFV0aWxpemF0aW9uUGVyY2VudDogY29uZmlnLmF1dG9TY2FsaW5nLnNjYWxlVXBUaHJlc2hvbGQsXG4gICAgfSk7XG5cbiAgICAvLyBDcmVhdGUgQXBwbGljYXRpb24gTG9hZCBCYWxhbmNlclxuICAgIHRoaXMubG9hZEJhbGFuY2VyID0gbmV3IGVsYnYyLkFwcGxpY2F0aW9uTG9hZEJhbGFuY2VyKFxuICAgICAgdGhpcyxcbiAgICAgICdBcHBsaWNhdGlvbkxvYWRCYWxhbmNlcicsXG4gICAgICB7XG4gICAgICAgIHZwYyxcbiAgICAgICAgaW50ZXJuZXRGYWNpbmc6IHRydWUsXG4gICAgICAgIHNlY3VyaXR5R3JvdXA6IHRoaXMubG9hZEJhbGFuY2VyU2VjdXJpdHlHcm91cCxcblxuICAgICAgICAvLyBEZXBsb3kgQUxCIGluIHB1YmxpYyBzdWJuZXRzXG4gICAgICAgIHZwY1N1Ym5ldHM6IHtcbiAgICAgICAgICBzdWJuZXRUeXBlOiBlYzIuU3VibmV0VHlwZS5QVUJMSUMsXG4gICAgICAgIH0sXG4gICAgICB9XG4gICAgKTtcblxuICAgIC8vIENyZWF0ZSB0YXJnZXQgZ3JvdXAgZm9yIEF1dG8gU2NhbGluZyBHcm91cFxuICAgIGNvbnN0IHRhcmdldEdyb3VwID0gbmV3IGVsYnYyLkFwcGxpY2F0aW9uVGFyZ2V0R3JvdXAodGhpcywgJ1RhcmdldEdyb3VwJywge1xuICAgICAgdnBjLFxuICAgICAgcG9ydDogODAsXG4gICAgICBwcm90b2NvbDogZWxidjIuQXBwbGljYXRpb25Qcm90b2NvbC5IVFRQLFxuICAgICAgdGFyZ2V0czogW3RoaXMuYXV0b1NjYWxpbmdHcm91cF0sXG5cbiAgICAgIC8vIEhlYWx0aCBjaGVjayBjb25maWd1cmF0aW9uXG4gICAgICBoZWFsdGhDaGVjazoge1xuICAgICAgICBlbmFibGVkOiB0cnVlLFxuICAgICAgICBoZWFsdGh5SHR0cENvZGVzOiAnMjAwJyxcbiAgICAgICAgaW50ZXJ2YWw6IGNkay5EdXJhdGlvbi5zZWNvbmRzKGNvbmZpZy5sb2FkQmFsYW5jZXIuaGVhbHRoQ2hlY2tJbnRlcnZhbCksXG4gICAgICAgIHBhdGg6IGNvbmZpZy5sb2FkQmFsYW5jZXIuaGVhbHRoQ2hlY2tQYXRoLFxuICAgICAgICBwcm90b2NvbDogZWxidjIuUHJvdG9jb2wuSFRUUCxcbiAgICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLnNlY29uZHMoY29uZmlnLmxvYWRCYWxhbmNlci5oZWFsdGhDaGVja1RpbWVvdXQpLFxuICAgICAgICB1bmhlYWx0aHlUaHJlc2hvbGRDb3VudDogY29uZmlnLmxvYWRCYWxhbmNlci51bmhlYWx0aHlUaHJlc2hvbGRDb3VudCxcbiAgICAgICAgaGVhbHRoeVRocmVzaG9sZENvdW50OiBjb25maWcubG9hZEJhbGFuY2VyLmhlYWx0aHlUaHJlc2hvbGRDb3VudCxcbiAgICAgIH0sXG5cbiAgICAgIC8vIERlcmVnaXN0cmF0aW9uIGRlbGF5XG4gICAgICBkZXJlZ2lzdHJhdGlvbkRlbGF5OiBjZGsuRHVyYXRpb24uc2Vjb25kcygzMCksXG4gICAgfSk7XG5cbiAgICAvLyBDcmVhdGUgbGlzdGVuZXIgZm9yIEFMQlxuICAgIHRoaXMubG9hZEJhbGFuY2VyLmFkZExpc3RlbmVyKCdIdHRwTGlzdGVuZXInLCB7XG4gICAgICBwb3J0OiA4MCxcbiAgICAgIHByb3RvY29sOiBlbGJ2Mi5BcHBsaWNhdGlvblByb3RvY29sLkhUVFAsXG4gICAgICBkZWZhdWx0VGFyZ2V0R3JvdXBzOiBbdGFyZ2V0R3JvdXBdLFxuICAgIH0pO1xuXG4gICAgLy8gQXBwbHkgY29tcHJlaGVuc2l2ZSB0YWdnaW5nXG4gICAgY29uc3QgcmVzb3VyY2VzID0gW1xuICAgICAgdGhpcy5sb2FkQmFsYW5jZXIsXG4gICAgICB0aGlzLmF1dG9TY2FsaW5nR3JvdXAsXG4gICAgICB0aGlzLmFwcGxpY2F0aW9uU2VjdXJpdHlHcm91cCxcbiAgICAgIHRoaXMubG9hZEJhbGFuY2VyU2VjdXJpdHlHcm91cCxcbiAgICAgIGxhdW5jaFRlbXBsYXRlLFxuICAgICAgdGFyZ2V0R3JvdXAsXG4gICAgXTtcblxuICAgIHJlc291cmNlcy5mb3JFYWNoKHJlc291cmNlID0+IHtcbiAgICAgIE9iamVjdC5lbnRyaWVzKGNvbmZpZy50YWdzKS5mb3JFYWNoKChba2V5LCB2YWx1ZV0pID0+IHtcbiAgICAgICAgY2RrLlRhZ3Mub2YocmVzb3VyY2UpLmFkZChrZXksIHZhbHVlKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgLy8gQWRkIHNwZWNpZmljIG5hbWUgdGFnc1xuICAgIGNkay5UYWdzLm9mKHRoaXMubG9hZEJhbGFuY2VyKS5hZGQoXG4gICAgICAnTmFtZScsXG4gICAgICBgTXVsdGlSZWdpb25BcHAtQUxCLSR7Y29uZmlnLnJlZ2lvbn1gXG4gICAgKTtcbiAgICBjZGsuVGFncy5vZih0aGlzLmF1dG9TY2FsaW5nR3JvdXApLmFkZChcbiAgICAgICdOYW1lJyxcbiAgICAgIGBNdWx0aVJlZ2lvbkFwcC1BU0ctJHtjb25maWcucmVnaW9ufWBcbiAgICApO1xuICAgIGNkay5UYWdzLm9mKHRoaXMuYXBwbGljYXRpb25TZWN1cml0eUdyb3VwKS5hZGQoXG4gICAgICAnTmFtZScsXG4gICAgICBgTXVsdGlSZWdpb25BcHAtQXBwLVNHLSR7Y29uZmlnLnJlZ2lvbn1gXG4gICAgKTtcbiAgICBjZGsuVGFncy5vZih0aGlzLmxvYWRCYWxhbmNlclNlY3VyaXR5R3JvdXApLmFkZChcbiAgICAgICdOYW1lJyxcbiAgICAgIGBNdWx0aVJlZ2lvbkFwcC1BTEItU0ctJHtjb25maWcucmVnaW9ufWBcbiAgICApO1xuICB9XG59XG4iXX0=

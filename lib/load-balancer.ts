import * as aws from '@pulumi/aws';
import { commonTags, primaryRegion } from './config';
import { primaryAlbSecurityGroup } from './security-groups';
import { primaryPublicSubnet1, primaryPublicSubnet2, primaryVpc } from './vpc';

const primaryProvider = new aws.Provider('primary-provider', {
  region: primaryRegion,
});

// Application Load Balancer
export const applicationLoadBalancer = new aws.lb.LoadBalancer(
  'app-load-balancer',
  {
    name: 'app-load-balancer',
    loadBalancerType: 'application',
    subnets: [primaryPublicSubnet1.id, primaryPublicSubnet2.id],
    securityGroups: [primaryAlbSecurityGroup.id],
    enableDeletionProtection: false, // Set to true in production
    tags: {
      ...commonTags,
      Name: 'Application Load Balancer',
    },
  },
  { provider: primaryProvider }
);

// Target Group
export const targetGroup = new aws.lb.TargetGroup(
  'app-target-group',
  {
    name: 'app-target-group',
    port: 8080,
    protocol: 'HTTP',
    vpcId: primaryVpc.id,
    healthCheck: {
      enabled: true,
      healthyThreshold: 2,
      interval: 30,
      matcher: '200',
      path: '/health',
      port: 'traffic-port',
      protocol: 'HTTP',
      timeout: 5,
      unhealthyThreshold: 2,
    },
    tags: {
      ...commonTags,
      Name: 'App Target Group',
    },
  },
  { provider: primaryProvider }
);

// ALB Listener
export const albListener = new aws.lb.Listener(
  'app-listener',
  {
    loadBalancerArn: applicationLoadBalancer.arn,
    port: 80,
    protocol: 'HTTP',
    defaultActions: [
      {
        type: 'forward',
        targetGroupArn: targetGroup.arn,
      },
    ],
  },
  { provider: primaryProvider }
);

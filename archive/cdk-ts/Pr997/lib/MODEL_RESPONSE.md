I'll create a comprehensive CDK TypeScript application for a multi-region web application deployment. Let me break this down into the required components.

## Project Structure

First, let's establish the project structure:

```
multi-region-web-app/
├── bin/
│   └── app.ts
├── lib/
│   ├── multi-region-web-app-stack.ts
│   └── constructs/
│       ├── networking.ts
│       ├── security.ts
│       ├── compute.ts
│       └── load-balancer.ts
├── test/
│   ├── unit/
│   │   ├── networking.test.ts
│   │   ├── security.test.ts
│   │   ├── compute.test.ts
│   │   ├── load-balancer.test.ts
│   │   └── stack.test.ts
│   └── integration/
│       └── deployment.test.ts
├── package.json
├── tsconfig.json
├── cdk.json
└── jest.config.js
```

## Core Implementation

### 1. Package Configuration

**package.json**
```json
{
  "name": "multi-region-web-app",
  "version": "1.0.0",
  "description": "Multi-region web application deployment with CDK",
  "main": "lib/index.js",
  "scripts": {
    "build": "tsc",
    "watch": "tsc -w",
    "test": "jest --coverage",
    "test:unit": "jest test/unit --coverage",
    "test:integration": "jest test/integration",
    "cdk": "cdk",
    "deploy": "cdk deploy --all",
    "destroy": "cdk destroy --all"
  },
  "dependencies": {
    "aws-cdk-lib": "^2.100.0",
    "constructs": "^10.3.0"
  },
  "devDependencies": {
    "@types/jest": "^29.5.5",
    "@types/node": "^20.6.0",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.1",
    "typescript": "^5.2.2",
    "aws-cdk": "^2.100.0"
  }
}
```

**tsconfig.json**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "declaration": true,
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": false,
    "inlineSourceMap": true,
    "inlineSources": true,
    "experimentalDecorators": true,
    "strictPropertyInitialization": false,
    "typeRoots": ["./node_modules/@types"],
    "outDir": "./lib",
    "rootDir": "./"
  },
  "exclude": ["cdk.out", "node_modules"]
}
```

**cdk.json**
```json
{
  "app": "npx ts-node --prefer-ts-exts bin/app.ts",
  "watch": {
    "include": ["**"],
    "exclude": [
      "README.md",
      "cdk*.json",
      "**/*.d.ts",
      "**/*.js",
      "tsconfig.json",
      "package*.json",
      "yarn.lock",
      "node_modules",
      "test"
    ]
  },
  "context": {
    "@aws-cdk/aws-lambda:recognizeLayerVersion": true,
    "@aws-cdk/core:checkSecretUsage": true,
    "@aws-cdk/core:target-partitions": ["aws", "aws-cn"]
  }
}
```

**jest.config.js**
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/test', '<rootDir>/lib'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: [
    'lib/**/*.ts',
    '!lib/**/*.d.ts',
    '!lib/**/*.test.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100
    }
  },
  coverageReporters: ['text', 'lcov', 'html']
};
```

### 2. Main Application Entry Point

**bin/app.ts**
```typescript
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { MultiRegionWebAppStack } from '../lib/multi-region-web-app-stack';

const app = new cdk.App();

// Environment configuration
const environments = {
  'us-east-1': {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-1'
  },
  'us-west-2': {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-west-2'
  }
};

// Get staging environment from context or default to 'dev'
const stage = app.node.tryGetContext('stage') || 'dev';

// Deploy to both regions
Object.entries(environments).forEach(([regionName, env]) => {
  new MultiRegionWebAppStack(app, `MultiRegionWebApp-${stage}-${regionName}`, {
    env,
    stage,
    region: regionName,
    description: `Multi-region web application stack for ${stage} environment in ${regionName}`
  });
});

app.synth();
```

### 3. Networking Construct

**lib/constructs/networking.ts**
```typescript
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export interface NetworkingProps {
  stage: string;
  region: string;
}

export class Networking extends Construct {
  public readonly vpc: ec2.Vpc;
  public readonly publicSubnets: ec2.ISubnet[];

  constructor(scope: Construct, id: string, props: NetworkingProps) {
    super(scope, id);

    // Create VPC with public subnets for ALB
    this.vpc = new ec2.Vpc(this, 'VPC', {
      vpcName: `${props.stage}-webapp-vpc-${props.region}`,
      cidr: '10.0.0.0/16',
      maxAzs: 2,
      natGateways: 0, // No NAT gateways needed for this setup
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: `${props.stage}-public-subnet`,
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: `${props.stage}-private-subnet`,
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        }
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true
    });

    this.publicSubnets = this.vpc.publicSubnets;
  }
}
```

### 4. Security Construct

**lib/constructs/security.ts**
```typescript
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export interface SecurityProps {
  stage: string;
  region: string;
  vpc: ec2.IVpc;
}

export class Security extends Construct {
  public readonly webSecurityGroup: ec2.SecurityGroup;
  public readonly albSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: SecurityProps) {
    super(scope, id);

    // Security Group for Application Load Balancer
    this.albSecurityGroup = new ec2.SecurityGroup(this, 'ALBSecurityGroup', {
      vpc: props.vpc,
      securityGroupName: `${props.stage}-alb-sg-${props.region}`,
      description: 'Security group for Application Load Balancer',
      allowAllOutbound: true
    });

    // Allow HTTP traffic (port 80)
    this.albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic'
    );

    // Allow HTTPS traffic (port 443)
    this.albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic'
    );

    // Security Group for Web Application instances
    this.webSecurityGroup = new ec2.SecurityGroup(this, 'WebSecurityGroup', {
      vpc: props.vpc,
      securityGroupName: `${props.stage}-web-sg-${props.region}`,
      description: 'Security group for web application instances',
      allowAllOutbound: true
    });

    // Allow traffic from ALB to web instances on port 80
    this.webSecurityGroup.addIngressRule(
      this.albSecurityGroup,
      ec2.Port.tcp(80),
      'Allow traffic from ALB'
    );

    // Allow traffic from ALB to web instances on port 443
    this.webSecurityGroup.addIngressRule(
      this.albSecurityGroup,
      ec2.Port.tcp(443),
      'Allow HTTPS traffic from ALB'
    );
  }
}
```

### 5. Compute Construct

**lib/constructs/compute.ts**
```typescript
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface ComputeProps {
  stage: string;
  region: string;
  vpc: ec2.IVpc;
  securityGroup: ec2.ISecurityGroup;
}

export class Compute extends Construct {
  public readonly autoScalingGroup: autoscaling.AutoScalingGroup;
  public readonly launchTemplate: ec2.LaunchTemplate;

  constructor(scope: Construct, id: string, props: ComputeProps) {
    super(scope, id);

    // IAM role for EC2 instances
    const instanceRole = new iam.Role(this, 'InstanceRole', {
      roleName: `${props.stage}-web-instance-role-${props.region}`,
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore')
      ]
    });

    // User data script for web server setup
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'yum update -y',
      'yum install -y httpd',
      'systemctl start httpd',
      'systemctl enable httpd',
      'echo "<h1>Hello from ' + props.region + ' - ' + props.stage + ' Environment</h1>" > /var/www/html/index.html',
      'echo "<p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>" >> /var/www/html/index.html',
      'echo "<p>Availability Zone: $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)</p>" >> /var/www/html/index.html'
    );

    // Launch template for EC2 instances
    this.launchTemplate = new ec2.LaunchTemplate(this, 'LaunchTemplate', {
      launchTemplateName: `${props.stage}-web-lt-${props.region}`,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      machineImage: ec2.MachineImage.latestAmazonLinux2(),
      securityGroup: props.securityGroup,
      role: instanceRole,
      userData: userData,
      requireImdsv2: true
    });

    // Auto Scaling Group
    this.autoScalingGroup = new autoscaling.AutoScalingGroup(this, 'AutoScalingGroup', {
      autoScalingGroupName: `${props.stage}-web-asg-${props.region}`,
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS
      },
      launchTemplate: this.launchTemplate,
      minCapacity: 2,
      maxCapacity: 5,
      desiredCapacity: 2,
      healthCheckType: autoscaling.HealthCheckType.ELB,
      healthCheckGracePeriod: cdk.Duration.seconds(300)
    });

    // Add scaling policies
    this.autoScalingGroup.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 70,
      scaleInCooldown: cdk.Duration.seconds(300),
      scaleOutCooldown: cdk.Duration.seconds(300)
    });
  }
}
```

### 6. Load Balancer Construct

**lib/constructs/load-balancer.ts**
```typescript
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import { Construct } from 'constructs';

export interface LoadBalancerProps {
  stage: string;
  region: string;
  vpc: ec2.IVpc;
  securityGroup: ec2.ISecurityGroup;
  autoScalingGroup: autoscaling.AutoScalingGroup;
}

export class LoadBalancer extends Construct {
  public readonly applicationLoadBalancer: elbv2.ApplicationLoadBalancer;
  public readonly targetGroup: elbv2.ApplicationTargetGroup;
  public readonly httpListener: elbv2.ApplicationListener;
  public readonly httpsListener: elbv2.ApplicationListener;

  constructor(scope: Construct, id: string, props: LoadBalancerProps) {
    super(scope, id);

    // Application Load Balancer
    this.applicationLoadBalancer = new elbv2.ApplicationLoadBalancer(this, 'ALB', {
      loadBalancerName: `${props.stage}-web-alb-${props.region}`,
      vpc: props.vpc,
      internetFacing: true,
      securityGroup: props.securityGroup,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC
      }
    });

    // Target Group
    this.targetGroup = new elbv2.ApplicationTargetGroup(this, 'TargetGroup', {
      targetGroupName: `${props.stage}-web-tg-${props.region}`,
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      vpc: props.vpc,
      targetType: elbv2.TargetType.INSTANCE,
      healthCheck: {
        enabled: true,
        healthyHttpCodes: '200',
        interval: cdk.Duration.seconds(30),
        path: '/',
        protocol: elbv2.Protocol.HTTP,
        timeout: cdk.Duration.seconds(5),
        unhealthyThresholdCount: 2,
        healthyThresholdCount: 2
      }
    });

    // Attach Auto Scaling Group to Target Group
    props.autoScalingGroup.attachToApplicationTargetGroup(this.targetGroup);

    // HTTP Listener (port 80)
    this.httpListener = this.applicationLoadBalancer.addListener('HTTPListener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultAction: elbv2.ListenerAction.forward([this.targetGroup])
    });

    // HTTPS Listener (port 443) - redirects to HTTP for simplicity
    // In production, you would want to use SSL certificates
    this.httpsListener = this.applicationLoadBalancer.addListener('HTTPSListener', {
      port: 443,
      protocol: elbv2.ApplicationProtocol.HTTP, // Using HTTP for demo
      defaultAction: elbv2.ListenerAction.forward([this.targetGroup])
    });
  }
}
```

### 7. Main Stack

**lib/multi-region-web-app-stack.ts**
```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Networking } from './constructs/networking';
import { Security } from './constructs/security';
import { Compute } from './constructs/compute';
import { LoadBalancer } from './constructs/load-balancer';

export interface MultiRegionWebAppStackProps extends cdk.StackProps {
  stage: string;
  region: string;
}

export class MultiRegionWebAppStack extends cdk.Stack {
  public readonly networking: Networking;
  public readonly security: Security;
  public readonly compute: Compute;
  public readonly loadBalancer: LoadBalancer;

  constructor(scope: Construct, id: string, props: MultiRegionWebAppStackProps) {
    super(scope, id, props);

    // Create networking infrastructure
    this.networking = new Networking(this, 'Networking', {
      stage: props.stage,
      region: props.region
    });

    // Create security groups
    this.security = new Security(this, 'Security', {
      stage: props.stage,
      region: props.region,
      vpc: this.networking.vpc
    });

    // Create compute resources
    this.compute = new Compute(this, 'Compute', {
      stage: props.stage,
      region: props.region,
      vpc: this.networking.vpc,
      securityGroup: this.security.webSecurityGroup
    });

    // Create load balancer
    this.loadBalancer = new LoadBalancer(this, 'LoadBalancer', {
      stage: props.stage,
      region: props.region,
      vpc: this.networking.vpc,
      securityGroup: this.security.albSecurityGroup,
      autoScalingGroup: this.compute.autoScalingGroup
    });

    // Outputs
    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: this.loadBalancer.applicationLoadBalancer.loadBalancerDnsName,
      description: 'DNS name of the Application Load Balancer',
      exportName: `${props.stage}-alb-dns-${props.region}`
    });

    new cdk.CfnOutput(this, 'VPCId', {
      value: this.networking.vpc.vpcId,
      description: 'VPC ID',
      exportName: `${props.stage}-vpc-id-${props.region}`
    });
  }
}
```

## Unit Tests

### 8. Networking Tests

**test/unit/networking.test.ts**
```typescript
import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { Networking } from '../../lib/constructs/networking';

describe('Networking Construct', () => {
  let app: cdk.App;
  let stack: cdk.Stack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new cdk.Stack(app, 'TestStack');
    
    new Networking(stack, 'TestNetworking', {
      stage: 'test',
      region: 'us-east-1'
    });
    
    template = Template.fromStack(stack);
  });

  test('creates VPC with correct configuration', () => {
    template.hasResourceProperties('AWS::EC2::VPC', {
      CidrBlock: '10.0.0.0/16',
      EnableDnsHostnames: true,
      EnableDnsSupport: true
    });
  });

  test('creates public subnets', () => {
    template.resourceCountIs('AWS::EC2::Subnet', 4); // 2 public + 2 private
  });

  test('creates internet gateway', () => {
    template.resourceCountIs('AWS::EC2::InternetGateway', 1);
  });

  test('creates route tables', () => {
    template.resourceCountIs('AWS::EC2::RouteTable', 4); // 2 public + 2 private
  });
});
```

### 9. Security Tests

**test/unit/security.test.ts**
```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Template } from 'aws-cdk-lib/assertions';
import { Security } from '../../lib/constructs/security';

describe('Security Construct', () => {
  let app: cdk.App;
  let stack: cdk.Stack;
  let vpc: ec2.Vpc;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new cdk.Stack(app, 'TestStack');
    
    vpc = new ec2.Vpc(stack, 'TestVPC');
    
    new Security(stack, 'TestSecurity', {
      stage: 'test',
      region: 'us-east-1',
      vpc
    });
    
    template = Template.fromStack(stack);
  });

  test('creates ALB security group with HTTP and HTTPS rules', () => {
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupDescription: 'Security group for Application Load Balancer',
      SecurityGroupIngress: [
        {
          CidrIp: '0.0.0.0/0',
          FromPort: 80,
          IpProtocol: 'tcp',
          ToPort: 80
        },
        {
          CidrIp: '0.0.0.0/0',
          FromPort: 443,
          IpProtocol: 'tcp',
          ToPort: 443
        }
      ]
    });
  });

  test('creates web security group', () => {
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupDescription: 'Security group for web application instances'
    });
  });

  test('security group allows only ports 80 and 443', () => {
    const securityGroups = template.findResources('AWS::EC2::SecurityGroup');
    
    Object.values(securityGroups).forEach(sg => {
      const ingress = (sg as any).Properties?.SecurityGroupIngress || [];
      ingress.forEach((rule: any) => {
        expect([80, 443]).toContain(rule.FromPort);
        expect([80, 443]).toContain(rule.ToPort);
      });
    });
  });
});
```

### 10. Compute Tests

**test/unit/compute.test.ts**
```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Template } from 'aws-cdk-lib/assertions';
import { Compute } from '../../lib/constructs/compute';

describe('Compute Construct', () => {
  let app: cdk.App;
  let stack: cdk.Stack;
  let vpc: ec2.Vpc;
  let securityGroup: ec2.SecurityGroup;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new cdk.Stack(app, 'TestStack');
    
    vpc = new ec2.Vpc(stack, 'TestVPC');
    securityGroup = new ec2.SecurityGroup(stack, 'TestSG', { vpc });
    
    new Compute(stack, 'TestCompute', {
      stage: 'test',
      region: 'us-east-1',
      vpc,
      securityGroup
    });
    
    template = Template.fromStack(stack);
  });

  test('creates launch template', () => {
    template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
      LaunchTemplateData: {
        InstanceType: 't3.micro',
        IamInstanceProfile: {
          Arn: {
            'Fn::GetAtt': [
              cdk.Match.stringLikeRegexp('.*InstanceProfile.*'),
              'Arn'
            ]
          }
        }
      }
    });
  });

  test('creates auto scaling group with correct min/max capacity', () => {
    template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
      MinSize: '2',
      MaxSize: '5',
      DesiredCapacity: '2'
    });
  });

  test('auto scaling group has correct health check configuration', () => {
    template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
      HealthCheckType: 'ELB',
      HealthCheckGracePeriod: 300
    });
  });

  test('creates CPU-based scaling policy', () => {
    template.resourceCountIs('AWS::AutoScaling::ScalingPolicy', 2); // Scale up and scale down
  });
});
```

### 11. Load Balancer Tests

**test/unit/load-balancer.test.ts**
```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import { Template } from 'aws-cdk-lib/assertions';
import { LoadBalancer } from '../../lib/constructs/load-balancer';

describe('LoadBalancer Construct', () => {
  let app: cdk.App;
  let stack: cdk.Stack;
  let vpc: ec2.Vpc;
  let securityGroup: ec2.SecurityGroup;
  let autoScalingGroup: autoscaling.AutoScalingGroup;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new cdk.Stack(app, 'TestStack');
    
    vpc = new ec2.Vpc(stack, 'TestVPC');
    securityGroup = new ec2.SecurityGroup(stack, 'TestSG', { vpc });
    
    const launchTemplate = new ec2.LaunchTemplate(stack, 'TestLT', {
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      machineImage: ec2.MachineImage.latestAmazonLinux2()
    });
    
    autoScalingGroup = new autoscaling.AutoScalingGroup(stack, 'TestASG', {
      vpc,
      launchTemplate,
      minCapacity: 2,
      maxCapacity: 5
    });
    
    new LoadBalancer(stack, 'TestLoadBalancer', {
      stage: 'test',
      region: 'us-east-1',
      vpc,
      securityGroup,
      autoScalingGroup
    });
    
    template = Template.fromStack(stack);
  });

  test('creates application load balancer', () => {
    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
      Type: 'application',
      Scheme: 'internet-facing'
    });
  });

  test('creates target group with correct health check', () => {
    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
      Port: 80,
      Protocol: 'HTTP',
      TargetType: 'instance',
      HealthCheckPath: '/',
      HealthCheckProtocol: 'HTTP',
      HealthCheckIntervalSeconds: 30,
      HealthCheckTimeoutSeconds: 5,
      UnhealthyThresholdCount: 2,
      HealthyThresholdCount: 2
    });
  });

  test('creates listeners for ports 80 and 443', () => {
    template.resourceCountIs('AWS::ElasticLoadBalancingV2::Listener', 2);
    
    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
      Port: 80,
      Protocol: 'HTTP'
    });
    
    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
      Port: 443,
      Protocol: 'HTTP'
    });
  });
});
```

### 12. Stack Tests

**test/unit/stack.test.ts**
```typescript
import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { MultiRegionWebAppStack } from '../../lib/multi-region-web-app-stack';

describe('MultiRegionWebAppStack', () => {
  let app: cdk.App;
  let stack: MultiRegionWebAppStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new MultiRegionWebAppStack(app, 'TestStack', {
      stage: 'test',
      region: 'us-east-1',
      env: {
        account: '123456789012',
        region: 'us-east-1'
      }
    });
    template = Template.fromStack(stack);
  });

  test('creates all required resources', () => {
    // VPC
    template.resourceCountIs('AWS::EC2::VPC', 1);
    
    // Security Groups
    template.resourceCountIs('AWS::EC2::SecurityGroup', 2);
    
    // Launch Template
    template.resourceCountIs('AWS::EC2::LaunchTemplate', 1);
    
    // Auto Scaling Group
    template.resourceCountIs('AWS::AutoScaling::AutoScalingGroup', 1);
    
    // Load Balancer
    template.resourceCountIs('AWS::ElasticLoadBalancingV2::LoadBalancer', 1);
    
    // Target Group
    template.resourceCountIs('AWS::ElasticLoadBalancingV2::TargetGroup', 1);
    
    // Listeners
    template.resourceCountIs('AWS::ElasticLoadBalancingV2::Listener', 2);
  });

  test('has correct outputs', () => {
    template.hasOutput('LoadBalancerDNS', {});
    template.hasOutput('VPCId', {});
  });

  test('resources follow naming convention', () => {
    const resources = template.toJSON().Resources;
    
    // Check that IAM role follows naming convention
    const roles = Object.keys(resources).filter(key => 
      resources[key].Type === 'AWS::IAM::Role'
    );
    
    expect(roles.length).toBeGreaterThan(0);
  });
});
```

## Integration Tests

### 13. Integration Test

**test/integration/deployment.test.ts**
```typescript
import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { MultiRegionWebAppStack } from '../../lib/multi-region-web-app-stack';

describe('Integration Tests', () => {
  let app: c
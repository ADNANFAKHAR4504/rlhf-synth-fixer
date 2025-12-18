import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface TargetGroupArgs {
  name: string;
  port: number;
  protocol: 'HTTP' | 'HTTPS' | 'TCP' | 'TLS' | 'UDP' | 'TCP_UDP' | 'GENEVE';
  vpcId: pulumi.Input<string>;
  targetType?: 'instance' | 'ip' | 'lambda' | 'alb';
  protocolVersion?: string;
  healthCheck?: {
    enabled?: boolean;
    healthyThreshold?: number;
    interval?: number;
    matcher?: string;
    path?: string;
    port?: string;
    protocol?: string;
    timeout?: number;
    unhealthyThreshold?: number;
  };
  stickiness?: {
    enabled?: boolean;
    type: 'lb_cookie' | 'app_cookie' | 'source_ip';
    cookieDuration?: number;
    cookieName?: string;
  };
  tags?: Record<string, string>;
}

export interface TargetGroupResult {
  targetGroup: aws.lb.TargetGroup;
  targetGroupArn: pulumi.Output<string>;
  targetGroupName: pulumi.Output<string>;
}

export interface TargetGroupAttachmentArgs {
  targetGroupArn: pulumi.Input<string>;
  targetId: pulumi.Input<string>;
  port?: number;
  availabilityZone?: string;
}

export interface ApplicationTargetGroupArgs {
  name: string;
  port: number;
  vpcId: pulumi.Input<string>;
  healthCheckPath?: string;
  healthCheckMatcher?: string;
  tags?: Record<string, string>;
}

export interface NetworkTargetGroupArgs {
  name: string;
  port: number;
  protocol: 'TCP' | 'UDP' | 'TCP_UDP';
  vpcId: pulumi.Input<string>;
  preserveClientIp?: boolean;
  tags?: Record<string, string>;
}

export class TargetGroupComponent extends pulumi.ComponentResource {
  public readonly targetGroup: aws.lb.TargetGroup;
  public readonly targetGroupArn: pulumi.Output<string>;
  public readonly targetGroupName: pulumi.Output<string>;

  constructor(
    name: string,
    args: TargetGroupArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('aws:lb:TargetGroupComponent', name, {}, opts);

    const defaultTags = {
      Name: args.name,
      Environment: pulumi.getStack(),
      ManagedBy: 'Pulumi',
      Project: 'AWS-Nova-Model-Breaking',
      ...args.tags,
    };

    this.targetGroup = new aws.lb.TargetGroup(
      `${name}-tg`,
      {
        name: args.name,
        port: args.port,
        protocol: args.protocol,
        vpcId: args.vpcId,
        targetType: args.targetType || 'instance',
        protocolVersion: args.protocolVersion,
        healthCheck: args.healthCheck,
        stickiness: args.stickiness,
        tags: defaultTags,
      },
      { parent: this, provider: opts?.provider }
    );

    this.targetGroupArn = this.targetGroup.arn;
    this.targetGroupName = this.targetGroup.name;

    this.registerOutputs({
      targetGroup: this.targetGroup,
      targetGroupArn: this.targetGroupArn,
      targetGroupName: this.targetGroupName,
    });
  }
}

export class TargetGroupAttachmentComponent extends pulumi.ComponentResource {
  public readonly attachment: aws.lb.TargetGroupAttachment;

  constructor(
    name: string,
    args: TargetGroupAttachmentArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('aws:lb:TargetGroupAttachmentComponent', name, {}, opts);

    this.attachment = new aws.lb.TargetGroupAttachment(
      `${name}-attachment`,
      {
        targetGroupArn: args.targetGroupArn,
        targetId: args.targetId,
        port: args.port,
        availabilityZone: args.availabilityZone,
      },
      { parent: this, provider: opts?.provider }
    );

    this.registerOutputs({
      attachment: this.attachment,
    });
  }
}

export class ApplicationTargetGroupComponent extends pulumi.ComponentResource {
  public readonly targetGroup: aws.lb.TargetGroup;
  public readonly targetGroupArn: pulumi.Output<string>;
  public readonly targetGroupName: pulumi.Output<string>;

  constructor(
    name: string,
    args: ApplicationTargetGroupArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('aws:lb:ApplicationTargetGroupComponent', name, {}, opts);

    const targetGroupComponent = new TargetGroupComponent(
      name,
      {
        name: args.name,
        port: args.port,
        protocol: 'HTTP',
        vpcId: args.vpcId,
        targetType: 'instance',
        healthCheck: {
          enabled: true,
          healthyThreshold: 2,
          interval: 30,
          matcher: args.healthCheckMatcher || '200',
          path: args.healthCheckPath || '/health',
          port: 'traffic-port',
          protocol: 'HTTP',
          timeout: 5,
          unhealthyThreshold: 2,
        },
        stickiness: {
          enabled: false,
          type: 'lb_cookie',
          cookieDuration: 86400,
        },
        tags: args.tags,
      },
      { parent: this, provider: opts?.provider }
    );

    this.targetGroup = targetGroupComponent.targetGroup;
    this.targetGroupArn = targetGroupComponent.targetGroupArn;
    this.targetGroupName = targetGroupComponent.targetGroupName;

    this.registerOutputs({
      targetGroup: this.targetGroup,
      targetGroupArn: this.targetGroupArn,
      targetGroupName: this.targetGroupName,
    });
  }
}

export class NetworkTargetGroupComponent extends pulumi.ComponentResource {
  public readonly targetGroup: aws.lb.TargetGroup;
  public readonly targetGroupArn: pulumi.Output<string>;
  public readonly targetGroupName: pulumi.Output<string>;

  constructor(
    name: string,
    args: NetworkTargetGroupArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('aws:lb:NetworkTargetGroupComponent', name, {}, opts);

    const targetGroupComponent = new TargetGroupComponent(
      name,
      {
        name: args.name,
        port: args.port,
        protocol: args.protocol,
        vpcId: args.vpcId,
        targetType: 'instance',
        healthCheck: {
          enabled: true,
          healthyThreshold: 3,
          interval: 30,
          port: 'traffic-port',
          protocol: args.protocol === 'UDP' ? 'HTTP' : args.protocol,
          timeout: 6,
          unhealthyThreshold: 3,
        },
        tags: args.tags,
      },
      { parent: this, provider: opts?.provider }
    );

    this.targetGroup = targetGroupComponent.targetGroup;
    this.targetGroupArn = targetGroupComponent.targetGroupArn;
    this.targetGroupName = targetGroupComponent.targetGroupName;

    this.registerOutputs({
      targetGroup: this.targetGroup,
      targetGroupArn: this.targetGroupArn,
      targetGroupName: this.targetGroupName,
    });
  }
}

export function createTargetGroup(
  name: string,
  args: TargetGroupArgs,
  opts?: pulumi.ComponentResourceOptions
): TargetGroupResult {
  const targetGroupComponent = new TargetGroupComponent(name, args, opts);
  return {
    targetGroup: targetGroupComponent.targetGroup,
    targetGroupArn: targetGroupComponent.targetGroupArn,
    targetGroupName: targetGroupComponent.targetGroupName,
  };
}

export function createTargetGroupAttachment(
  name: string,
  args: TargetGroupAttachmentArgs,
  opts?: pulumi.ComponentResourceOptions
): aws.lb.TargetGroupAttachment {
  const attachmentComponent = new TargetGroupAttachmentComponent(
    name,
    args,
    opts
  );
  return attachmentComponent.attachment;
}

export function createApplicationTargetGroup(
  name: string,
  args: ApplicationTargetGroupArgs,
  opts?: pulumi.ComponentResourceOptions
): TargetGroupResult {
  const appTargetGroupComponent = new ApplicationTargetGroupComponent(
    name,
    args,
    opts
  );
  return {
    targetGroup: appTargetGroupComponent.targetGroup,
    targetGroupArn: appTargetGroupComponent.targetGroupArn,
    targetGroupName: appTargetGroupComponent.targetGroupName,
  };
}

export function createNetworkTargetGroup(
  name: string,
  args: NetworkTargetGroupArgs,
  opts?: pulumi.ComponentResourceOptions
): TargetGroupResult {
  const networkTargetGroupComponent = new NetworkTargetGroupComponent(
    name,
    args,
    opts
  );
  return {
    targetGroup: networkTargetGroupComponent.targetGroup,
    targetGroupArn: networkTargetGroupComponent.targetGroupArn,
    targetGroupName: networkTargetGroupComponent.targetGroupName,
  };
}

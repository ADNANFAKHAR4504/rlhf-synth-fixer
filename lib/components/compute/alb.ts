import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface AlbArgs {
  name: string;
  loadBalancerType?: 'application' | 'network' | 'gateway';
  internal?: boolean; // Changed from scheme to internal boolean
  subnetIds: pulumi.Input<string>[];
  securityGroupIds?: pulumi.Input<string>[];
  enableDeletionProtection?: boolean;
  enableHttp2?: boolean;
  enableWafFailOpen?: boolean;
  idleTimeout?: number;
  tags?: Record<string, string>;
  accessLogs?: {
    bucket: pulumi.Input<string>;
    prefix?: string;
    enabled?: boolean;
  };
}

export interface AlbResult {
  loadBalancer: aws.lb.LoadBalancer;
  loadBalancerId: pulumi.Output<string>;
  loadBalancerArn: pulumi.Output<string>;
  dnsName: pulumi.Output<string>;
  zoneId: pulumi.Output<string>;
}

export interface AlbListenerArgs {
  name: string;
  loadBalancerArn: pulumi.Input<string>;
  port: number;
  protocol: 'HTTP' | 'HTTPS' | 'TCP' | 'TLS' | 'UDP' | 'TCP_UDP' | 'GENEVE';
  certificateArn?: pulumi.Input<string>;
  sslPolicy?: string;
  defaultActions: Array<{
    type:
      | 'forward'
      | 'redirect'
      | 'fixed-response'
      | 'authenticate-cognito'
      | 'authenticate-oidc';
    targetGroupArn?: pulumi.Input<string>;
    redirect?: {
      protocol?: string;
      port?: string;
      host?: string;
      path?: string;
      query?: string;
      statusCode: 'HTTP_301' | 'HTTP_302';
    };
    fixedResponse?: {
      contentType: string;
      messageBody?: string;
      statusCode: string;
    };
  }>;
  tags?: Record<string, string>;
}

export interface AlbListenerResult {
  listener: aws.lb.Listener;
  listenerArn: pulumi.Output<string>;
}

export interface HttpsAlbArgs {
  name: string;
  subnetIds: pulumi.Input<string>[];
  securityGroupIds: pulumi.Input<string>[];
  certificateArn: pulumi.Input<string>;
  targetGroupArn?: pulumi.Input<string>;
  tags?: Record<string, string>;
  accessLogs?: {
    bucket: pulumi.Input<string>;
    prefix?: string;
    enabled?: boolean;
  };
}

export interface HttpsAlbResult {
  loadBalancer: aws.lb.LoadBalancer;
  httpsListener: aws.lb.Listener;
  httpListener: aws.lb.Listener; // For redirect to HTTPS
  loadBalancerId: pulumi.Output<string>;
  loadBalancerArn: pulumi.Output<string>;
  dnsName: pulumi.Output<string>;
  zoneId: pulumi.Output<string>;
}

// NEW: HTTP-only ALB interfaces
export interface HttpAlbArgs {
  name: string;
  subnetIds: pulumi.Input<string>[];
  securityGroupIds: pulumi.Input<string>[];
  targetGroupArn?: pulumi.Input<string>;
  tags?: Record<string, string>;
  accessLogs?: {
    bucket: pulumi.Input<string>;
    prefix?: string;
    enabled?: boolean;
  };
}

export interface HttpAlbResult {
  loadBalancer: aws.lb.LoadBalancer;
  httpListener: aws.lb.Listener;
  loadBalancerId: pulumi.Output<string>;
  loadBalancerArn: pulumi.Output<string>;
  dnsName: pulumi.Output<string>;
  zoneId: pulumi.Output<string>;
}

export class AlbComponent extends pulumi.ComponentResource {
  public readonly loadBalancer: aws.lb.LoadBalancer;
  public readonly loadBalancerId: pulumi.Output<string>;
  public readonly loadBalancerArn: pulumi.Output<string>;
  public readonly dnsName: pulumi.Output<string>;
  public readonly zoneId: pulumi.Output<string>;

  constructor(
    name: string,
    args: AlbArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('aws:lb:AlbComponent', name, {}, opts);

    const defaultTags = {
      Name: args.name,
      Environment: pulumi.getStack(),
      ManagedBy: 'Pulumi',
      Project: 'AWS-Nova-Model-Breaking',
      ...args.tags,
    };

    this.loadBalancer = new aws.lb.LoadBalancer(
      `${name}-alb`,
      {
        name: args.name,
        loadBalancerType: args.loadBalancerType || 'application',
        internal: args.internal ?? false, // Changed from scheme to internal
        subnets: args.subnetIds,
        securityGroups: args.securityGroupIds,
        enableDeletionProtection: args.enableDeletionProtection ?? true,
        enableHttp2: args.enableHttp2 ?? true,
        enableWafFailOpen: args.enableWafFailOpen ?? false,
        idleTimeout: args.idleTimeout || 60,
        accessLogs: args.accessLogs,
        tags: defaultTags,
      },
      { parent: this, provider: opts?.provider }
    );

    this.loadBalancerId = this.loadBalancer.id;
    this.loadBalancerArn = this.loadBalancer.arn;
    this.dnsName = this.loadBalancer.dnsName;
    this.zoneId = this.loadBalancer.zoneId;

    this.registerOutputs({
      loadBalancer: this.loadBalancer,
      loadBalancerId: this.loadBalancerId,
      loadBalancerArn: this.loadBalancerArn,
      dnsName: this.dnsName,
      zoneId: this.zoneId,
    });
  }
}

export class AlbListenerComponent extends pulumi.ComponentResource {
  public readonly listener: aws.lb.Listener;
  public readonly listenerArn: pulumi.Output<string>;

  constructor(
    name: string,
    args: AlbListenerArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('aws:lb:AlbListenerComponent', name, {}, opts);

    const defaultTags = {
      Name: args.name,
      Environment: pulumi.getStack(),
      ManagedBy: 'Pulumi',
      Project: 'AWS-Nova-Model-Breaking',
      ...args.tags,
    };

    // Convert defaultActions to the format expected by aws.lb.Listener
    const defaultActions = args.defaultActions.map(action => {
      const baseAction: aws.types.input.lb.ListenerDefaultAction = {
        type: action.type,
      };

      switch (action.type) {
        case 'forward':
          baseAction.targetGroupArn = action.targetGroupArn;
          break;
        case 'redirect':
          baseAction.redirect = action.redirect;
          break;
        case 'fixed-response':
          baseAction.fixedResponse = action.fixedResponse;
          break;
      }

      return baseAction;
    });

    this.listener = new aws.lb.Listener(
      `${name}-listener`,
      {
        loadBalancerArn: args.loadBalancerArn,
        port: args.port,
        protocol: args.protocol,
        certificateArn: args.certificateArn,
        sslPolicy:
          args.sslPolicy ||
          (args.protocol === 'HTTPS'
            ? 'ELBSecurityPolicy-TLS-1-2-2017-01'
            : undefined),
        defaultActions: defaultActions,
        tags: defaultTags,
      },
      { parent: this, provider: opts?.provider }
    );

    this.listenerArn = this.listener.arn;

    this.registerOutputs({
      listener: this.listener,
      listenerArn: this.listenerArn,
    });
  }
}

export class HttpsAlbComponent extends pulumi.ComponentResource {
  public readonly loadBalancer: aws.lb.LoadBalancer;
  public readonly httpsListener: aws.lb.Listener;
  public readonly httpListener: aws.lb.Listener;
  public readonly loadBalancerId: pulumi.Output<string>;
  public readonly loadBalancerArn: pulumi.Output<string>;
  public readonly dnsName: pulumi.Output<string>;
  public readonly zoneId: pulumi.Output<string>;

  constructor(
    name: string,
    args: HttpsAlbArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('aws:lb:HttpsAlbComponent', name, {}, opts);

    // Create ALB
    const albComponent = new AlbComponent(
      name,
      {
        name: args.name,
        loadBalancerType: 'application',
        internal: false, // Changed from scheme: "internet-facing"
        subnetIds: args.subnetIds,
        securityGroupIds: args.securityGroupIds,
        enableDeletionProtection: true,
        enableHttp2: true,
        accessLogs: args.accessLogs,
        tags: args.tags,
      },
      { parent: this, provider: opts?.provider }
    );

    this.loadBalancer = albComponent.loadBalancer;
    this.loadBalancerId = albComponent.loadBalancerId;
    this.loadBalancerArn = albComponent.loadBalancerArn;
    this.dnsName = albComponent.dnsName;
    this.zoneId = albComponent.zoneId;

    // Create HTTPS listener
    const httpsListenerComponent = new AlbListenerComponent(
      `${name}-https`,
      {
        name: `${args.name}-https`,
        loadBalancerArn: this.loadBalancerArn,
        port: 443,
        protocol: 'HTTPS',
        certificateArn: args.certificateArn,
        sslPolicy: 'ELBSecurityPolicy-TLS-1-2-2017-01',
        defaultActions: args.targetGroupArn
          ? [
              {
                type: 'forward',
                targetGroupArn: args.targetGroupArn,
              },
            ]
          : [
              {
                type: 'fixed-response',
                fixedResponse: {
                  contentType: 'text/plain',
                  messageBody: 'Service Temporarily Unavailable',
                  statusCode: '503',
                },
              },
            ],
        tags: args.tags,
      },
      { parent: this, provider: opts?.provider }
    );

    this.httpsListener = httpsListenerComponent.listener;

    // Create HTTP listener for redirect to HTTPS
    const httpListenerComponent = new AlbListenerComponent(
      `${name}-http`,
      {
        name: `${args.name}-http`,
        loadBalancerArn: this.loadBalancerArn,
        port: 80,
        protocol: 'HTTP',
        defaultActions: [
          {
            type: 'redirect',
            redirect: {
              protocol: 'HTTPS',
              port: '443',
              statusCode: 'HTTP_301',
            },
          },
        ],
        tags: args.tags,
      },
      { parent: this, provider: opts?.provider }
    );

    this.httpListener = httpListenerComponent.listener;

    this.registerOutputs({
      loadBalancer: this.loadBalancer,
      httpsListener: this.httpsListener,
      httpListener: this.httpListener,
      loadBalancerId: this.loadBalancerId,
      loadBalancerArn: this.loadBalancerArn,
      dnsName: this.dnsName,
      zoneId: this.zoneId,
    });
  }
}

// NEW: HTTP-only ALB Component
export class HttpAlbComponent extends pulumi.ComponentResource {
  public readonly loadBalancer: aws.lb.LoadBalancer;
  public readonly httpListener: aws.lb.Listener;
  public readonly loadBalancerId: pulumi.Output<string>;
  public readonly loadBalancerArn: pulumi.Output<string>;
  public readonly dnsName: pulumi.Output<string>;
  public readonly zoneId: pulumi.Output<string>;

  constructor(
    name: string,
    args: HttpAlbArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('aws:lb:HttpAlbComponent', name, {}, opts);

    // Create ALB
    const albComponent = new AlbComponent(
      name,
      {
        name: args.name,
        loadBalancerType: 'application',
        internal: false,
        subnetIds: args.subnetIds,
        securityGroupIds: args.securityGroupIds,
        enableDeletionProtection: true,
        enableHttp2: true,
        accessLogs: args.accessLogs,
        tags: args.tags,
      },
      { parent: this, provider: opts?.provider }
    );

    this.loadBalancer = albComponent.loadBalancer;
    this.loadBalancerId = albComponent.loadBalancerId;
    this.loadBalancerArn = albComponent.loadBalancerArn;
    this.dnsName = albComponent.dnsName;
    this.zoneId = albComponent.zoneId;

    // Create HTTP listener only
    const httpListenerComponent = new AlbListenerComponent(
      `${name}-http`,
      {
        name: `${args.name}-http`,
        loadBalancerArn: this.loadBalancerArn,
        port: 80,
        protocol: 'HTTP',
        defaultActions: args.targetGroupArn
          ? [
              {
                type: 'forward',
                targetGroupArn: args.targetGroupArn,
              },
            ]
          : [
              {
                type: 'fixed-response',
                fixedResponse: {
                  contentType: 'text/plain',
                  messageBody: 'Service Available via HTTP',
                  statusCode: '200',
                },
              },
            ],
        tags: args.tags,
      },
      { parent: this, provider: opts?.provider }
    );

    this.httpListener = httpListenerComponent.listener;

    this.registerOutputs({
      loadBalancer: this.loadBalancer,
      httpListener: this.httpListener,
      loadBalancerId: this.loadBalancerId,
      loadBalancerArn: this.loadBalancerArn,
      dnsName: this.dnsName,
      zoneId: this.zoneId,
    });
  }
}

export function createAlb(name: string, args: AlbArgs): AlbResult {
  const albComponent = new AlbComponent(name, args);
  return {
    loadBalancer: albComponent.loadBalancer,
    loadBalancerId: albComponent.loadBalancerId,
    loadBalancerArn: albComponent.loadBalancerArn,
    dnsName: albComponent.dnsName,
    zoneId: albComponent.zoneId,
  };
}

export function createAlbListener(
  name: string,
  args: AlbListenerArgs
): AlbListenerResult {
  const listenerComponent = new AlbListenerComponent(name, args);
  return {
    listener: listenerComponent.listener,
    listenerArn: listenerComponent.listenerArn,
  };
}

export function createHttpsAlb(
  name: string,
  args: HttpsAlbArgs,
  opts?: pulumi.ComponentResourceOptions
): HttpsAlbResult {
  const httpsAlbComponent = new HttpsAlbComponent(name, args, opts);
  return {
    loadBalancer: httpsAlbComponent.loadBalancer,
    httpsListener: httpsAlbComponent.httpsListener,
    httpListener: httpsAlbComponent.httpListener,
    loadBalancerId: httpsAlbComponent.loadBalancerId,
    loadBalancerArn: httpsAlbComponent.loadBalancerArn,
    dnsName: httpsAlbComponent.dnsName,
    zoneId: httpsAlbComponent.zoneId,
  };
}

// NEW: HTTP-only ALB function
export function createHttpAlb(
  name: string,
  args: HttpAlbArgs,
  opts?: pulumi.ComponentResourceOptions
): HttpAlbResult {
  const httpAlbComponent = new HttpAlbComponent(name, args, opts);
  return {
    loadBalancer: httpAlbComponent.loadBalancer,
    httpListener: httpAlbComponent.httpListener,
    loadBalancerId: httpAlbComponent.loadBalancerId,
    loadBalancerArn: httpAlbComponent.loadBalancerArn,
    dnsName: httpAlbComponent.dnsName,
    zoneId: httpAlbComponent.zoneId,
  };
}

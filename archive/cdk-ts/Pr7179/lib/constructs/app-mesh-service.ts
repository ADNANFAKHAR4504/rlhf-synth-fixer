import * as cdk from 'aws-cdk-lib';
import * as appmesh from 'aws-cdk-lib/aws-appmesh';
import { Construct } from 'constructs';

export interface AppMeshServiceConstructProps {
  mesh: appmesh.Mesh;
  serviceName: string;
  port: number;
  healthCheckPath: string;
}

export class AppMeshServiceConstruct extends Construct {
  public readonly virtualNode: appmesh.VirtualNode;
  public readonly virtualRouter: appmesh.VirtualRouter;
  public readonly virtualService: appmesh.VirtualService;

  constructor(
    scope: Construct,
    id: string,
    props: AppMeshServiceConstructProps
  ) {
    super(scope, id);

    this.virtualNode = new appmesh.VirtualNode(this, 'VirtualNode', {
      virtualNodeName: `${props.serviceName}-vn`,
      mesh: props.mesh,
      serviceDiscovery: appmesh.ServiceDiscovery.dns(
        `${props.serviceName}.local`
      ),
      listeners: [
        appmesh.VirtualNodeListener.http({
          port: props.port,
          healthCheck: appmesh.HealthCheck.http({
            path: props.healthCheckPath,
            interval: cdk.Duration.seconds(30),
            timeout: cdk.Duration.seconds(5),
            unhealthyThreshold: 3,
            healthyThreshold: 2,
          }),
          timeout: {
            idle: cdk.Duration.seconds(10),
            perRequest: cdk.Duration.seconds(15),
          },
        }),
      ],
      accessLog: appmesh.AccessLog.fromFilePath('/dev/stdout'),
    });

    this.virtualRouter = new appmesh.VirtualRouter(this, 'VirtualRouter', {
      virtualRouterName: `${props.serviceName}-vr`,
      mesh: props.mesh,
      listeners: [appmesh.VirtualRouterListener.http(props.port)],
    });

    this.virtualRouter.addRoute('Route', {
      routeName: `${props.serviceName}-route`,
      routeSpec: appmesh.RouteSpec.http({
        weightedTargets: [
          {
            virtualNode: this.virtualNode,
            weight: 100,
          },
        ],
        timeout: {
          idle: cdk.Duration.seconds(10),
          perRequest: cdk.Duration.seconds(15),
        },
      }),
    });

    this.virtualService = new appmesh.VirtualService(this, 'VirtualService', {
      virtualServiceName: `${props.serviceName}.local`,
      virtualServiceProvider: appmesh.VirtualServiceProvider.virtualRouter(
        this.virtualRouter
      ),
    });
  }
}

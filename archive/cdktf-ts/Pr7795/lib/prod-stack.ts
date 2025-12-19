import { Construct } from 'constructs';
import {
  BaseEnvironmentStack,
  BaseEnvironmentStackProps,
} from './base-environment-stack';

export class ProdStack extends BaseEnvironmentStack {
  constructor(scope: Construct, id: string, props: BaseEnvironmentStackProps) {
    super(scope, id, props);
  }

  protected getAuroraInstanceCount(): number {
    return 3; // Three instances for production (high availability)
  }

  protected getEcsCpu(): string {
    return '1024'; // 1 vCPU
  }

  protected getEcsMemory(): string {
    return '2048'; // 2 GB
  }

  protected getImageTag(): string {
    return 'prod-latest';
  }

  protected getAlarmThresholds() {
    return {
      cpuUtilization: 70,
      memoryUtilization: 70,
      targetResponseTime: 1,
      unhealthyHostCount: 0,
      databaseConnections: 200,
    };
  }
}

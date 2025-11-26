export type ServiceProtocol = 'http' | 'https';

export interface ServiceConfig {
  name: string;
  namespace: string;
  port: number;
  environmentSuffix: string;
  protocol?: ServiceProtocol;
}

const SERVICE_DOMAIN = 'svc.cluster.local';

export function buildServiceHostname(config: ServiceConfig): string {
  if (!config.name.trim()) {
    throw new Error('Service name must not be empty');
  }
  if (!config.namespace.trim()) {
    throw new Error('Namespace must not be empty');
  }
  if (config.port <= 0 || config.port > 65535) {
    throw new Error('Port must be between 1 and 65535');
  }

  return `${config.name}-${config.environmentSuffix}.${config.namespace}.${SERVICE_DOMAIN}`;
}

export function buildServiceUrl(config: ServiceConfig): string {
  const protocol: ServiceProtocol = config.protocol ?? 'http';
  const hostname = buildServiceHostname(config);
  return `${protocol}://${hostname}:${config.port}`;
}

export interface DeploymentSummary {
  name: string;
  desired: number;
  available: number;
}

export function summarizeDeployment(summary: DeploymentSummary): string {
  const { name, desired, available } = summary;
  if (desired < 0 || available < 0) {
    throw new Error('Replica counts must not be negative');
  }
  const status = available >= desired ? 'healthy' : 'degraded';
  return `${name}: ${available}/${desired} replicas available (${status})`;
}

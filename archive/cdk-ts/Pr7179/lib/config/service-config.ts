export interface ServiceConfig {
  name: string;
  image: string;
  cpu: number;
  memory: number;
  port: number;
  path: string;
  priority: number;
  healthCheckPath: string;
  environment?: { [key: string]: string };
  optional?: boolean;
}

export const SERVICES: ServiceConfig[] = [
  {
    name: 'payment-api',
    image: 'payment-api:latest',
    cpu: 512,
    memory: 1024,
    port: 8080,
    path: '/payments',
    priority: 10,
    healthCheckPath: '/payments/health',
    environment: {
      SERVICE_NAME: 'payment-api',
      LOG_LEVEL: 'info',
    },
  },
  {
    name: 'fraud-detector',
    image: 'fraud-detector:latest',
    cpu: 512,
    memory: 1024,
    port: 8081,
    path: '/fraud',
    priority: 20,
    healthCheckPath: '/fraud/health',
    environment: {
      SERVICE_NAME: 'fraud-detector',
      LOG_LEVEL: 'info',
    },
  },
  {
    name: 'transaction-api',
    image: 'transaction-api:latest',
    cpu: 512,
    memory: 1024,
    port: 8082,
    path: '/transactions',
    priority: 30,
    healthCheckPath: '/transactions/health',
    environment: {
      SERVICE_NAME: 'transaction-api',
      LOG_LEVEL: 'info',
    },
    optional: true,
  },
];

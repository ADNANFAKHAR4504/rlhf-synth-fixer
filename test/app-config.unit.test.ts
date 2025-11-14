import {
  buildServiceHostname,
  buildServiceUrl,
  summarizeDeployment,
} from "../lib/app-config";

const baseConfig = {
  name: "payments-backend-svc",
  namespace: "payments-prod",
  port: 8080,
  environmentSuffix: "prod",
} as const;

describe("app-config service utilities", () => {
  test("buildServiceHostname generates fully-qualified cluster domain", () => {
    const hostname = buildServiceHostname(baseConfig);
    expect(hostname).toBe("payments-backend-svc-prod.payments-prod.svc.cluster.local");
  });

  test("buildServiceHostname validates required fields", () => {
    expect(() =>
      buildServiceHostname({ ...baseConfig, name: "   " }),
    ).toThrow("Service name must not be empty");

    expect(() =>
      buildServiceHostname({ ...baseConfig, namespace: "" }),
    ).toThrow("Namespace must not be empty");

    expect(() =>
      buildServiceHostname({ ...baseConfig, port: 70000 }),
    ).toThrow("Port must be between 1 and 65535");
  });

  test("buildServiceUrl defaults to http and supports https", () => {
    expect(buildServiceUrl(baseConfig)).toBe(
      "http://payments-backend-svc-prod.payments-prod.svc.cluster.local:8080",
    );

    expect(
      buildServiceUrl({
        ...baseConfig,
        protocol: "https",
      }),
    ).toBe("https://payments-backend-svc-prod.payments-prod.svc.cluster.local:8080");
  });

  test("summarizeDeployment reports availability status", () => {
    expect(
      summarizeDeployment({ name: "frontend", desired: 2, available: 2 }),
    ).toBe("frontend: 2/2 replicas available (healthy)");

    expect(
      summarizeDeployment({ name: "backend", desired: 3, available: 2 }),
    ).toBe("backend: 2/3 replicas available (degraded)");

    expect(() =>
      summarizeDeployment({ name: "metrics", desired: -1, available: 0 }),
    ).toThrow("Replica counts must not be negative");
  });
});


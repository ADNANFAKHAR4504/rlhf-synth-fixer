# Prompt

A gaming company needs a single CI/CD pipeline file using Google Cloud Build that deploys a global multiplayer backend system. The system architecture includes GKE Autopilot clusters for game servers, Cloud Memorystore for session storage, Cloud Firestore for player profiles, and Cloud CDN for static assets. The pipeline must perform full validation, build, test, security scanning, performance checks, regional deployment, global canary rollout, monitoring configuration, compliance checks, and rollback preparation.

Requirements:

1. Pre-flight validation
   - Validate global HTTP(S) Load Balancer configuration.
   - Validate Cloud CDN cache configuration.
   - Validate Cloud Armor WAF rules.
   - Validate that GKE Autopilot clusters exist in all configured regions.

2. Code validation
   - Golangci-lint for Go-based game server.
   - ESLint for the Node.js matchmaking service.
   - Hadolint for all Dockerfiles.

3. Terraform validation steps
   - Validate infrastructure for GKE Autopilot, Memorystore, Firestore, Cloud CDN, and global load balancing.
   - Include tfsec security scanning.

4. Dependency scanning
   - Use Nancy to inspect Go dependencies.
   - Use npm audit for Node.js dependencies.

5. Build steps
   - Build three Docker services using Kaniko with caching: game-server, matchmaking-service, and stats-aggregator.
   - Build static React lobby UI and upload optimized build to Cloud Storage under a versioned asset path.

6. Unit and integration testing
   - Run Go tests with race detection and benchmarks.
   - Run Node.js tests using Jest.
   - Run performance testing with a custom tool simulating 10,000 players, validating tick rate stability at 60 Hz, matchmaking throughput of 50k RPM, and packet loss scenarios.
   - Integration testing on a test cluster using Agones to validate allocation, readiness, shutdown, and matchmaking.

7. Security scanning
   - Container scanning with Trivy and Grype.
   - SAST scanning using Gosec for Go and Semgrep for Node.js.
   - DDoS and WAF rules testing via Cloud Armor evaluation.

8. Chaos testing
   - Inject latency, packet loss, and pod failures across all regions using a chaos testing tool.

9. Terraform apply
   - Apply infrastructure using Terraform workspaces based on dev, staging, or prod.
   - Regions:
     - dev: us-central1 only
     - staging: 3 regions (us-central1, us-east1, us-west1)
     - prod: 8 regions (us-central1, us-east1, us-west1, europe-west1, europe-west4, asia-northeast1, asia-southeast1, australia-southeast1)

10. Multi-region deployment
    - Deploy to GKE Autopilot clusters using Helm, one step per region, in parallel.
    - Deploy Agones fleets, PodDisruptionBudgets, and autoscaling rules.

11. Platform configuration steps
    - Configure Memorystore per region.
    - Configure Firestore database, indexes, TTL rules, and security rules.
    - Configure Cloud CDN and upload static assets.
    - Configure Global Load Balancer including backend mappings, health checks, session affinity, and Cloud Armor integration.

12. Canary rollout
    - Route 5 percent of traffic to the new version globally using backend service weights.
    - Wait and validate metrics before continuing.

13. Smoke testing and SLO validation
    - Validate matchmaking, connection flow, CDN asset availability.
    - Validate SLOs: p50 < 50 ms, p95 < 150 ms, p99 < 300 ms, tick rate minimum 55 Hz, matchmaking p95 < 5 s.

14. Player migration testing
    - Simulate failures and verify cross-region failover and reconnection flows.

15. Blue-green deployment
    - Promote the new version globally.
    - Keep the old version running as hot standby for one hour.

16. Monitoring and alerting
    - Configure dashboards, metrics, SLIs, SLOs, latency/error monitoring, and dispatch alerts to a webhook.

17. Compliance
    - Validate COPPA and GDPR requirements.

18. Rollback
    - Prepare rollback scripts capable of undoing deployments, database migrations, and CDN cache issues.

The pipeline must:
- Be fully contained in a single CI/CD file using Google Cloud Build.
- Use external bash scripts placed under a scripts directory for any logic that exceeds a handful of lines.
- Reference typical tools: gcloud, kubectl, helm, gsutil, Trivy, Grype, Gosec, Semgrep, Nancy, and others.
- Support dynamic substitutions including _ARTIFACT_REGISTRY, _ENVIRONMENT, _CDN_BUCKET, _GKE_REGIONS, _MEMORYSTORE_TIER, _FIRESTORE_MODE, and _PLAYER_COUNT_TARGET.
- Include N1_HIGHCPU_32 machine type and a dedicated worker pool.
- Enable logging to Cloud Logging only.
- Produce the final global deployment of the multiplayer game backend across all regions.

Produce output as one cloudbuild YAML file named ci-cd.yml plus all referenced scripts in a scripts directory. 

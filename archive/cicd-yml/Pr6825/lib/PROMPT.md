Hey, we’re building the end-to-end Azure DevOps pipeline for a greenfield 5G core network management platform that has to meet full carrier-grade reliability (99.999% uptime, strict 3GPP/ETSI compliance, and regulatory requirements for lawful intercept and emergency services). The architecture is heavily cloud-native: Go-based virtualized network functions (AMF, SMF, UPF, AUSF, UDM) running on Azure Arc-enabled AKS clusters spread across 16 edge locations and 3 central regions, React management dashboard, gRPC/protobuf APIs, Cosmos DB with strong consistency for subscriber data, Event Hubs Premium for real-time signaling, Service Bus for inter-VNF messaging, Istio service mesh, and ExpressRoute/Private Link for connectivity.
We need a single, multi-stage azure-pipelines.yml (triggered on main for the production path and nightly for full validation) that implements the complete lifecycle with zero trust, zero downtime, and phased rollouts. Here’s exactly how the pipeline must flow:
Start with a comprehensive Validation stage (ubuntu-latest) that runs in parallel jobs:

validateCode → golangci-lint on all Go VNFs, ESLint on the React dashboard, protobuf schema validation for gRPC contracts
validateInfrastructure → az bicep lint on every network function template, Azure Policy dry-run simulation focused on network security, explicit NSG rule checks for N2/N4/N6 5G protocols
validateCompliance → automated checks against 3GPP Release 16/17 procedures and ETSI NFV MANO standards, plus verification that subscriber data paths are encrypted at rest and in transit
scanDependencies → Go module auditing, npm audit, and verification that all container images are signed

Only when validation passes do we enter the Build stage (ubuntu-latest, with Go module caching using go.sum):

Compile the five VNFs with Go 1.21, produce minimal distroless images, tag them as $(acrName).azurecr.io/5g-core/vnf:$(Build.BuildId) and push to ACR
Build and validate Helm charts for each VNF (helm lint + kubeval), publish as artifacts
Compile custom Kubernetes operators for VNF lifecycle management and run kubebuilder tests
Generate Terraform plans for Azure Arc-enabled AKS clusters (multi-region, zone-redundant), Cosmos DB, Event Hubs Premium, ExpressRoute gateways, etc.

Next is a heavy Test stage with escalating resource pools:

Unit tests in Go with -race and >90% coverage
Network simulation tests (call flows, registration, PDU session, handover) on Standard_D8s_v3
Full integration tests deploying a test 5G core to a dedicated AKS cluster, simulating UEs and gNodeBs (Standard_D16s_v3)
Performance tests targeting >1000 sessions/sec, >10 Gbps per UPF, 100k simulated subscribers (Standard_D32s_v3)
Chaos engineering with Chaos Mesh – pod kills, network partitions, latency injection – to prove stateless recovery and service-mesh failover

A parallel Security stage (runs alongside Test, must also pass):

Trivy container scanning (block on HIGH/CRITICAL), generate and publish SBOMs, sign images with Notary v2
TruffleHog + Gitleaks secret scanning (fail on any finding)
Network policy validation, mTLS enforcement checks, micro-segmentation verification
Confirm subscriber data encryption, audit logging for lawful intercept, and Azure Dedicated HSM integration

Once Test and Security are green, we begin progressive deployment using Azure Arc and Flux v2 GitOps:
DeployEdgeDev → provision two dev edge clusters (edge-eastus, edge-westus) via Azure Arc, install Istio, deploy VNFs with node affinity, run N1/N2/N4 interface connectivity tests (environment: dev-edge)
EdgeIntegration → full end-to-end call flows across locations, roaming, network slicing, KPI validation (<500 ms registration, <50 ms handover interruption, >1 Gbps per UE), resilience tests with cluster failure simulation
CanaryEdgeStaging (manual approval gate) → roll out to four staging edge sites with Istio traffic shifting (10% canary), run monitor-canary.sh for 2 hours, auto-rollback if session success rate drops below 99.9%
CoreNetworkStaging → deploy central 5G core to eastus + westeurope (zone-redundant), blue-green deployment of core VNFs using Istio VirtualServices, zero-downtime cutover via blue-green-switch.sh after synthetic traffic validation (environment: staging-core, manual approval)
CarrierValidation → 24-hour stability/soak tests, interconnect with partner SS7/Diameter networks, GSMA compliance, lawful intercept, emergency services, pen-testing, DDoS protection validation
ProductionApprovals → three separate manual approvals: Network Ops (NOC), Security team, and CTO sign-off (168 h timeout allowed)
RollingProdDeployment (the crown jewel):

Provision full production infra across 16 edge locations + 3 central regions with ExpressRoute and Private Link
PhaseOneEdge → 25% of edge sites (4 locations), live traffic validation for 4 hours
PhaseTwoCentral → active-active core VNFs in production regions
PhaseThreeEdge → expand to 50% edge sites
PhaseFourComplete → 100% rollout with Traffic Manager and Private DNS updates

PostProduction → smoke tests across all sites, configure Network Watcher, Connection Monitor, Azure Monitor workbooks with 5G-specific KPIs, alerts, HPA + cluster autoscaler
Finally, a manually triggered Rollback stage that uses Flux rollback, coordinated session draining, and on-call notification.
All scripts longer than 5 lines must be externalized (deploy-arc-clusters.sh, deploy-vnf.sh, test-call-flows.sh, test-network-simulation.sh, monitor-canary.sh, blue-green-switch.sh, rollback-vnf.sh, configure-monitoring.sh, test-resilience.sh, etc.). Use managed identity for all Azure auth, reference variables azureSubscription, acrName, edgeLocations (array), centralRegions, cosmosAccountName, eventHubsNamespace, and arcClusters map where needed.
Please generate a complete, production-ready azure-pipelines.yml that implements this exact multi-stage workflow with all dependencies, pools, environments, approvals, canary logic, blue-green switching, phased rollouts, and automated safeguards described above — battle-tested, readable, and fully aligned with telco carrier-grade standards.

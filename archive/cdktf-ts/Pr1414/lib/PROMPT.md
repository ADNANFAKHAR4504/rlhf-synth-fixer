Need CDKTF (TypeScript) code that sets up AWS infra across 3 regions: eu-central-1, us-west-2, us-east-2. Must be modular, production-ready, and able to handle HA database + caching workloads.

Main points:

- Make a VPC in each of the three regions
- Peer them so all three VPCs can talk to each other (full mesh peering)
- Networking should be built for high availability
- In each region, deploy:
  - RDS instance (highly available)
  - ElastiCache Redis cluster (also highly available)
- Tag everything with Environment (prod/staging/dev) and Owner

Code structure:

- MultiRegionNetworkingConstruct - VPCs + peering
- RdsConstruct - RDS setup per region
- ElastiCacheConstruct - Redis setup per region
- Root stack ties it all together

Each construct should take config options (CIDR blocks, regions, etc.), not hardcode stuff. Keep it clean and reusable.  
Use @cdktf/provider-aws and assume AWS creds from CLI or env vars.

Should work with:
cdktf synth  
cdktf plan  
cdktf deploy

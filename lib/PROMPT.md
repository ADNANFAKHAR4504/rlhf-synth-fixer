# Gaming Database Infrastructure Requirements

## Project Overview

We need a robust da## Deliverables

Provide a complete CDKTF TypeScript implementation that includes:

1. **Main Stack File** (`lib/tap-stack.ts`) - Complete gaming database implementation
2. **Configuration Interface** - TypeScript interface for stack configuration
3. **Dynamic Naming** - Prevent resource conflicts across deployments
4. **Error Handling** - Proper validation and error management
5. **Documentation** - Inline comments explaining DynamoDB limitations and usage patterns

The implementation should be production-ready and deployable with standard CDKTF commands:

````bash
npm install
cdktf get
cdktf deploy
```mobile gaming platform that handles player profiles, game sessions, and leaderboard data. The system must support high-throughput gaming workloads with real-time data access patterns.

## Technical Requirements

### Infrastructure Platform

- Use CDKTF (Terraform CDK) with TypeScript
- Deploy to AWS with provider version 5.0 or higher
- Target region: us-west-2
- Stack name must be: `gaming-database-stack`

### Database Requirements

Create a DynamoDB table with the following specifications:

**Basic Configuration:**

- Table name: `GamePlayerProfiles`
- Billing mode: Pay-per-request (on-demand)
- Enable point-in-time recovery
- Enable DynamoDB Streams with NEW_AND_OLD_IMAGES view type
- Use AWS managed encryption (do not specify custom KMS keys)

**Primary Keys:**

- Partition key: `playerId` (String) - uniquely identifies each player
- Sort key: `timestamp` (Number) - allows time-based queries for player activity

**Required Attributes:**
Define these attributes for use in indexes:

- `playerId` (String) - primary partition key
- `timestamp` (Number) - primary sort key
- `gameMode` (String) - type of game (competitive, casual, tournament)
- `score` (Number) - player's score in that session
- `playerLevel` (Number) - player's current level

### Index Requirements

**Global Secondary Index: `score-index`**

- Partition key: `gameMode` (String) - enables leaderboard queries per game mode
- Sort key: `score` (Number) - allows sorting by high scores
- Projection: ALL attributes

**Local Secondary Index: `level-index`**

- Uses same partition key as table (`playerId`)
- Sort key: `playerLevel` (Number) - enables level progression queries
- Projection: ALL attributes

### Auto Scaling Configuration

**Important:** DynamoDB on-demand tables do not support auto scaling. However, create Application Auto Scaling resources for the GSI that can be enabled when switching to provisioned billing mode.

Create auto scaling for both read and write capacity with these settings:

- Minimum capacity: 5 units
- Maximum capacity: 100 units
- Target utilization: 70%
- Guard creation behind a boolean flag (`enableGsiAutoscaling`, default: false)
- Include warning comments about billing mode requirements

### Resource Tagging

All AWS resources must include these tags:

- `Environment`: `production`
- `Team`: `gaming-platform`
- `ManagedBy`: `CDKTF`

### Gaming Use Cases

The database design should support these common gaming queries:

1. **Player Profile Lookup:** Find player data by playerId
2. **Game Session History:** Query player's recent sessions using timestamp
3. **Leaderboards:** Query top scores by gameMode using the GSI
4. **Level Progression:** Track player advancement using the LSI

### Implementation Notes

- Use dynamic resource naming to prevent deployment conflicts
- Provide configurable environment and region settings
- Export both `GamingDatabaseStack` class and `TapStack` alias for compatibility
- Include comprehensive test coverage for all configurations

⚠️ Important: DynamoDB on-demand tables don’t apply auto scaling. Still define the autoscaling resources for the GSI and guard their creation behind a boolean variable (e.g., enableGsiAutoscaling, default false). Include comments explaining that enabling it requires switching the table billing mode to PROVISIONED (DynamoDB limitation). When enabled, wire policies to the GSI correctly.

## Project Structure & Quality

- Stack name must be `gaming-database-stack`
- Use cdktf constructs and the Terraform AWS provider types
- Ensure **ALL** index projection types are set to `ALL`
- Explicitly set PITR and SSE on the table
- Enable DynamoDB Streams with `NEW_AND_OLD_IMAGES`
- Apply required tags to every AWS resource

## Output Format

Return only the full CDKTF TypeScript app code (multiple files allowed), ready to run:

```bash
npm install
cdktf get
cdktf deploy
````

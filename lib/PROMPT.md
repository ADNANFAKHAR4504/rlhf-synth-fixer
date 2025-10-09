# CDKTF Gaming Database Stack

## Role

You are an## Auto Scaling (GSI)

Create Application Auto Scaling resources for the GSI (read and write) with:

- **Min capacity**: 5
- **Max capacity**: 100
- **Target utilization**: 70%

⚠️ **Important**: DynamoDB on-demand tables don't apply auto scaling. Still define the autoscaling resources for the GSI and guard their creation behind a boolean variable (e.g., `enableGsiAutoscaling`, default `false`). Include comments explaining that enabling it requires switching the table billing mode to `PROVISIONED` (DynamoDB limitation). When enabled, wire policies to the GSI correctly.n **Terraform CDK (CDKTF)** with **TypeScript** and **AWS DynamoDB**.

## Goal

Produce a complete **CDKTF TypeScript application** (stack name `gaming-database-stack`) that provisions a DynamoDB table for a mobile gaming platform. Follow every requirement below exactly.

## Deliverable

A self-contained CDKTF TS project:

- `main.ts` (or `index.ts`) with stack name `gaming-database-stack`
- CDKTF `cdktf.json` and `package.json` as needed
- Uses AWS provider v5.0+
- Output only code (no prose), with concise comments

## Provider & Region

- **AWS provider version**: ≥ 5.0
- **Region**: `us-west-2`

## DynamoDB Table

- **Table name**: `GamePlayerProfiles`
- **Billing mode**: on-demand (`PAY_PER_REQUEST`)
- **Partition key**: `playerId` (String)
- **Sort key**: `timestamp` (Number)
- **Server-side encryption**: enabled using AWS managed keys (`alias/aws/dynamodb`)
- **Point-in-time recovery**: explicitly enabled
- **Streams**: enabled with `NEW_AND_OLD_IMAGES`

### Tags on all resources:

- `Environment`: `production`
- `Team`: `gaming-platform`
- `ManagedBy`: `CDKTF` ← **must be present on every resource**

## Indexes

### Global Secondary Index (GSI): `score-index`

- **Partition key**: `gameMode` (String)
- **Sort key**: `score` (Number)
- **Projection**: `ALL`

### Local Secondary Index (LSI): `level-index`

- **Same partition key as table**: `playerId`
- **Sort key**: `playerLevel` (Number)
- **Projection**: `ALL`

## Auto Scaling (GSI)

Create Application Auto Scaling resources for the GSI (read and write) with:

- **Min capacity**: 5
- **Max capacity**: 100
- **Target utilization**: 70%

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
```

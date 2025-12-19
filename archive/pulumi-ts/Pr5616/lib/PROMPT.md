Hey team,

We've got a performance and cost problem with our DynamoDB infrastructure that's causing us headaches. Our data analytics platform is running three DynamoDB tables for real-time event processing, and right now we're paying way too much for provisioned capacity that we're not fully using. Plus, we're missing basic monitoring and have inconsistent tagging across resources which makes it hard to track costs and troubleshoot issues.

The business has asked us to refactor this infrastructure to use on-demand billing instead, which should save us a significant amount on our AWS bill. At the same time, we need to add proper monitoring with CloudWatch alarms, implement consistent tagging across all resources, and beef up our security with proper IAM roles.

We have three core tables: events, sessions, and users. The events table is our busiest and needs contributor insights to help us identify hot partition keys. The sessions table needs a new global secondary index so we can query by userId and timestamp. And the users table is critical enough that we need point-in-time recovery enabled with a 35-day backup window.

## What we need to build

Create a complete DynamoDB infrastructure optimization solution using **Pulumi with TypeScript** that refactors our existing tables for better performance and cost efficiency.

### Core Requirements

1. **DynamoDB Table Optimization**
   - Refactor three existing tables: events, sessions, and users
   - Convert all tables from provisioned to on-demand billing mode
   - Must preserve existing table names to avoid breaking downstream applications
   - Add table-level encryption using AWS managed keys for all tables

2. **Monitoring and Observability**
   - Configure contributor insights on the events table only (cost constraint)
   - Set up CloudWatch alarms for UserErrors metric on all three tables
   - Set up CloudWatch alarms for SystemErrors metric on all three tables
   - UserErrors alarms must trigger when errors exceed 5 per minute
   - All alarms should be properly named and tagged

3. **Data Protection and Resilience**
   - Enable point-in-time recovery for the users table only
   - Backup window must be set to 35 days for users table
   - Enable DynamoDB Streams on events table with NEW_AND_OLD_IMAGES view type
   - Streams retention period must be exactly 24 hours

4. **Index Configuration**
   - Create global secondary index on sessions table
   - GSI partition key: userId
   - GSI sort key: timestamp
   - Must project ALL attributes in the GSI

5. **Security and Access Control**
   - Implement IAM roles with least-privilege access
   - Create separate read and write roles for each table
   - Follow naming convention: dynamodb-{tableName}-{read|write}-role
   - Roles should only have permissions for their specific table

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Deploy to **ap-southeast-2** region
- Use **DynamoDB** for data storage
- Use **CloudWatch** for monitoring and alarms
- Use **IAM** for access control
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: {resource-type}-{tableName}-{environmentSuffix}
- All resources must be tagged with mandatory tags: Environment, Team, CostCenter
- Use Pulumi's apply() method for any computed values in tags
- All resources must be destroyable (no Retain policies)

### Constraints

- Table names must be preserved: events, sessions, users
- CloudWatch alarms trigger threshold: 5 errors per minute for UserErrors
- Global secondary index must project ALL attributes
- IAM role naming: dynamodb-{tableName}-{read|write}-role
- DynamoDB Streams retention: exactly 24 hours
- Contributor insights: events table only (cost constraint)
- Point-in-time recovery: users table only with 35-day backup window
- All resources require three tags: Environment, Team, CostCenter
- Use AWS managed keys for encryption (not custom KMS keys)

## Success Criteria

- **Functionality**: All three tables converted to on-demand billing successfully
- **Performance**: Contributor insights enabled on events table for hot key detection
- **Monitoring**: CloudWatch alarms operational for both error types on all tables
- **Security**: IAM roles follow least-privilege principle with proper naming
- **Resilience**: Point-in-time recovery active on users table, streams on events table
- **Cost Efficiency**: On-demand billing reduces costs, no unnecessary features enabled
- **Resource Naming**: All resources include environmentSuffix parameter
- **Tagging**: Consistent tags applied across all resources
- **Code Quality**: TypeScript code, well-structured, properly documented

## What to deliver

- Complete Pulumi TypeScript implementation in tap-stack.ts
- Three DynamoDB tables: events, sessions, users with on-demand billing
- Global secondary index on sessions table (userId + timestamp)
- CloudWatch alarms for UserErrors and SystemErrors on all tables
- IAM read and write roles for each table (6 roles total)
- Point-in-time recovery on users table only
- DynamoDB Streams on events table only
- Contributor insights on events table only
- Stack outputs: tableNames, tableArns, streamArns
- All resources properly tagged and using environmentSuffix

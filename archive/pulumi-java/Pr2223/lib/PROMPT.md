## Migrating Our AWS Setup to Pulumi Java

Hey, we've got this AWS infrastructure that's been set up by hand, and we need to move it over to Pulumi using Java. The goal is to make everything much smoother and automated.

The environment is a bit complex, with separate AWS accounts for development, testing, staging, and production. Each of these accounts has its own VPCs, security groups, and key management systems.

Here’s what the Pulumi Java code needs to do:

- **Tagging Policy:** Make sure every single AWS resource we define in Pulumi gets our mandatory tags. That means `Project: 'CloudMigration'` on everything, and `Environment:` should be set to either `'development'`, `'testing'`, `'staging'`, or `'production'`, depending on which account we're deploying to.
- **Custom Migration Logic:** We'll need to use **Pulumi Java custom resources** for any migration tasks that the standard Pulumi resources don't directly handle. For example, if we have secrets managed somewhere else and need to bring them into AWS Secrets Manager, we'll need a custom bit of code for that.
- **Flexible Design:** The whole template needs to be built in a way that's **modular and reusable**. We want to be able to use it consistently across all those different environments: development, testing, staging, and production.
- **Testing First:** Before we roll anything out, we need to thoroughly test the template in a sandbox environment.

When you're writing the code, please follow our naming conventions for resources, and make them unique. Adding a bit of randomness to the names helps with this. Also, it's really important that there are no linting errors and that the code meets all our security standards.

What we need back is the Pulumi Java code that can deploy this infrastructure consistently across all our environments. It should pass all the tests, including checking the tags and making sure any custom migration bits work correctly.

my directory looks like this
└── src
└── main
└── java
└── app
└── Main.java
├── integration
│   ├── java
│   │   └── app
│   │   └── MainIntegrationTest.java
└── unit
├── java
│   └── app
│   └── MainTest.java

I dont need pom.xml

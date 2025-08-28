Hey,

I need you to build out the AWS CDK stack for the Nova project's new multi-region architecture. We're moving to a high-availability model, and the goal is to ensure the application can survive a full regional outage.

Please write the entire stack in a single Java file named `tap_stack.java`.

Here are the detailed requirements for the stack:

1.  **Multi-Region Deployment:** The stack must deploy our web application infrastructure into two primary regions: `us-west-2` (as the primary) and `eu-central-1` (as the failover).

2.  **Database:** This is the most critical piece. Implement a multi-region Amazon RDS (PostgreSQL) setup. The primary DB instance should be in `us-west-2`, with a read replica in `eu-central-1`. The configuration must support a clean, automated failover process.

3.  **DNS Routing:** Use Amazon Route 53 to manage traffic. Configure a latency-based routing policy that directs users to the nearest healthy region. It should automatically fail over traffic to the available region if one goes down.

4.  **Security:** Adhere to the principle of least privilege. Define specific IAM roles for the services and configure tight security group rules. Don't leave any ports open unnecessarily.

5.  **Resource Tagging:** This is mandatory for our budget tracking. Every single resource provisioned by this CDK stack **must** be tagged with `Environment:Production`.

The final deliverable should be a single, clean, and well-commented `Main.java` file that is ready for deployment. Let me know if you have any questions.

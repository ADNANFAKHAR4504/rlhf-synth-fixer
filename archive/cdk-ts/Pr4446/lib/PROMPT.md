We need to set up the backend infrastructure for a new food delivery application using the AWS CDK with TypeScript. This will be a high-availability microservices architecture running in a single region.

The core task is to enable secure and reliable communication between our microservices. For example, the orders-api service needs to be able to discover and communicate with the restaurants-api service privately and efficiently.

First, lay the network foundation with a new VPC using the 10.0.0.0/16 CIDR block. It needs two public and two private subnets, each spread across two different Availability Zones. The private subnets will need NAT Gateways for outbound internet access.

All of our microservices will run as containerized applications on an ECS cluster using the Fargate launch type. It is critical that these services are deployed only in the private subnets. The only public-facing component should be an Application Load Balancer, which will route incoming customer traffic to our primary service (e.g., the orders-api).

For the service-to-service communication, we will use ECS Service Connect. When you define the ECS services in the CDK, configure Service Connect to create a private Cloud Map namespace. This will build a service mesh, allowing our services to discover and talk to each other using simple, short names (like http://restaurants-api) without needing to know about specific IPs or ports. Service Connect should also handle the health checks to ensure traffic isn't sent to unhealthy tasks.

Security is paramount. The security groups must be locked down. For instance, the restaurants-api service's security group should only allow inbound traffic from the orders-api service's security group.

Implement using AWS CDK TypeScript with separate modular stack files in lib/ for each component, instantiated in lib/tap-stack.ts.

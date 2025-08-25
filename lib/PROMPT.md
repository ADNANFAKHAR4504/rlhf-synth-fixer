You need to create a Pulumi program in Java that sets up a minimal AWS network in the **us-east-1** region.  

### Goal  
The task is to deliver a working Pulumi Java configuration that provisions all the required resources in us-east-1.  

### Requirements  
1. Everything must be deployed in **us-east-1**.  
2. Set up a new **VPC** with the CIDR block `10.0.0.0/16`.  
3. Inside the VPC, create **two public subnets**, making sure each one is in a different availability zone.  
4. Configure the subnets so that instances launched there automatically receive a public IP.  
5. Add an **Internet Gateway** to the VPC.  
6. Create a route table with a `0.0.0.0/0` route through the Internet Gateway, and associate it with both subnets.  
7. Make sure the program outputs useful information, at minimum the VPC ID and the IDs of the two subnets.  

### Deliverable  
The output should be a single Pulumi Java source file (for example, `Main.java`) that uses the Pulumi AWS SDK and provisions everything successfully when you run `pulumi up`. The file should be complete on its own, with no placeholders left for region or CIDR, and the resources should be given clear names or tags.  

### Implementation notes  
Use the usual Pulumi Java structure, like `Pulumi.run(ctx -> { ... })`. Pick two different availability zones (for example, `us-east-1a` and `us-east-1b`) when creating the subnets. Set `mapPublicIpOnLaunch = true` for both subnets so they assign public IPs by default. Make sure the route table connected to the Internet Gateway is associated with both subnets. Keep the code clean and minimal, without adding anything beyond what’s asked.  

### Success criteria  
The program should work right away with `pulumi preview` and `pulumi up`, and the outputs should clearly display the VPC ID and the subnet IDs.  

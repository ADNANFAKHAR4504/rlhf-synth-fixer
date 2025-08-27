Subject: Deployment is failing with a weird EC2 error

Hey,

Hope you're doing well.

I'm hitting a wall trying to deploy our CDK stack, and I was hoping you might have seen this before. The deployment keeps failing during the `Deploy` stage with a strange error message about reaching the maximum number of addresses.

Here's the error it's spitting out:
`The maximum number of addresses has been reached. (Service: Ec2, Status Code: 400)`

It seems to be related to Elastic IP addresses, which is confusing because I thought the VPC was configured to avoid creating NAT Gateways and EIPs. The stack rolls back every time, and I'm not sure what's causing it to hit this limit.

Do you have any ideas what might be going on here? It feels like something in our VPC or subnet configuration is unexpectedly trying to allocate an IP address.

Any insights would be a huge help.

Thanks,
[Your Name]

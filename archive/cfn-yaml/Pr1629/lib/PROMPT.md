## Building a High-Availability AWS Network

Hey, we need to set up a solid, highly available network on AWS using a CloudFormation YAML template.

Here's what the network needs to look like:

- We'll build a main network (VPC) that spreads across two different availability zones.
- In each of those zones, we need one public part and one private part for the network.
- We'll put an Internet Gateway on the public parts so things can talk to the Internet.
- Also, set up two NAT Gateways, one in each public zone. There is stuff in our private networks that can get out to the internet without being directly exposed.
- For security, we'll set up rules to let in HTTP (port 80) and HTTPS (port 443) traffic to the public parts of our network.
- And for one of the private sections, we'll allow SSH (port 22) access, but only from a specific set of IP addresses.

We're going to put all this in the `us-west-2` region(MUST). The goal is a super resilient, high-availability setup that follows all the good practices. Oh, and remember to tag everything with 'Environment: Production'.

What we need back is a complete and working CloudFormation YAML template. It should do everything we just talked about and work when we test it out.

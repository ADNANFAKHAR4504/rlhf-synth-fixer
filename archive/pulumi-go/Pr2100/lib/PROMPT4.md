The code you provided is failing with the below mentioned build errors, fix those and give me corrected response -

```bash
./infrastructure.go:502:10: not enough return values
        have (error)
        want (map[string]*ec2.Subnet, error)
```

This is the problematic code where it is failing

```go
publicRT, err := ec2.NewRouteTable(m.ctx, fmt.Sprintf("%s-public-rt-%s", m.config.Environment, region), &ec2.RouteTableArgs{
		VpcId: vpc.ID(),
		Routes: ec2.RouteTableRouteArray{
			&ec2.RouteTableRouteArgs{
				CidrBlock: pulumi.String("0.0.0.0/0"),
				GatewayId: igw.ID(),
			},
		},
		Tags: pulumi.StringMap{
			"Name":        pulumi.String(fmt.Sprintf("%s-public-rt-%s", m.config.Environment, region)),
			"environment": pulumi.String(m.config.Environment),
			"purpose":     pulumi.String("public-routing"),
		},
	}, pulumi.Provider(provider))
	if err != nil {
		return err
	}

```

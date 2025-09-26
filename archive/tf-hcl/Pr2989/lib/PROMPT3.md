Can you provide the code snippet to fix this issue -

```

│ Error: Invalid index
│ 
│   on tap_stack.tf line 368, in resource "aws_subnet" "secondary_public_subnets4":
│  368:   availability_zone       = data.aws_availability_zones.secondary4.names[count.index]
│     ├────────────────
│     │ count.index is 2
│     │ data.aws_availability_zones.secondary4.names is list of string with 2 elements
│ 
│ The given key does not identify an element in this collection value: the
│ given index is greater than or equal to the length of the collection.
╵
╷
│ Error: Invalid index
│ 
│   on tap_stack.tf line 384, in resource "aws_subnet" "secondary_private_subnets4":
│  384:   availability_zone = data.aws_availability_zones.secondary4.names[count.index]
│     ├────────────────
│     │ count.index is 2
│     │ data.aws_availability_zones.secondary4.names is list of string with 2 elements
│ 
│ The given key does not identify an element in this collection value: the
│ given index is greater than or equal to the length of the collection.
╵

```

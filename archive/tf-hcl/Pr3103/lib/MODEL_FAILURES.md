Model response referred to the wrong availabitliyt zone and it values wrt the region

```


│ Error: Invalid function argument
│ 
│   on tap_stack.tf line 112, in locals:
│  112:   azs = slice(var.availability_zones, 0, 3)
│     ├────────────────
│     │ while calling slice(list, start_index, end_index)
│ 
│ Invalid value for "end_index" parameter: end index must not be greater than
│ the length of the list.
╵

```


Model also had issues wrt to the cloudtrail and its related deployment.

Subject: Help needed with CI/CD pipeline failures for our CDK Go project

Hey,

Hope you're having a good day.

I'm running into some frustrating issues with our CI/CD pipeline for the new CDK Go stack, and I was hoping you might have some ideas. The model's response is failing at both the `Synth` and `Lint` stages, and I'm a bit stuck.

During the `Synth` stage, it's complaining that our `lib` package isn't importable:
`Error: bin/tap.go:6:2: import "github.com/TuringGpt/iac-test-automations/lib" is a program, not an importable package`

It seems like Go thinks the `lib` directory is a `main` package, which is preventing the build from succeeding.

Then, in the `Lint` stage, it's throwing a whole bunch of the same "not an importable package" errors across multiple files, including our unit tests. It's also flagging an issue in the stack itself:
`Error: vet: lib/tap_stack.go:101:3: unknown field Generation in struct literal of type awsec2.AmazonLinux2ImageSsmParameterProps`

This one looks like we're trying to use a field called `Generation` when setting up the Amazon Linux AMI, but it doesn't seem to exist in the version of the CDK we're using.

Could you take a look at the code and see if you can figure out what's going on? It feels like there might be a structural issue with our Go packages and a small bug in the stack definition.

Any help would be hugely appreciated!

Thanks,
[Your Name]

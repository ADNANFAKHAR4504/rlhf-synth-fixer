getting synth error please fix
```
Project: platform=cdktf, language=go
✅ CDKTF project detected, running CDKTF get and synth...

> tap@0.1.0 cdktf:synth
> cdktf synth


⠦  Synthesizing
[2025-08-25T18:38:17.031] [ERROR] default - # github.com/TuringGpt/iac-test-automations/lib
ERROR: cdktf encountered an error while synthesizing

Synth command: go run ./lib
Error:         non-zero exit code 1

Command output on stderr:
    lib/tap_stack.go:436:16: too many errors


⠼  Synthesizing
```
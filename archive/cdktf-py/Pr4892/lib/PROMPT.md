Hey there! I'm having some issues with my CDKTF project on branch synth-6174408141 and could really use some help getting it sorted out.

First thing I need to do is run ./scripts/synth.sh and fix the lint and synth errors that keep popping up. The linting is showing a 9.42/10 score which isn't terrible but I want it clean, and the CDKTF synthesis is just failing completely.

Then I need you to check my unit test and run it - if it's not properly written, please rewrite it. I think there might be an issue where I wrote it for AWS CDK instead of CDKTF, which would explain why things aren't working right.

After that, I really need to improve the test coverage to at least 90%. Right now I'm only hitting 83% which isn't good enough for this project.

Finally, I need to change the stackname from TapStackdev to TapStackstage and get this thing deployed. The whole project structure seems to have some issues with nested lib/lib directories and missing __init__.py files that are probably causing problems.

Can you help me get all of this working properly? I need the lint score clean, CDKTF synthesis working, proper unit tests with good coverage, and a successful deployment of TapStackstage with the right project structure.

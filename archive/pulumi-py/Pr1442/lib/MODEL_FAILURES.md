Your code has been rated at 5.48/10'
++ sed -n 's/.rated at \([0-9.]\)\/10.*/\1/p'
+ SCORE=5.48
+ [[ -z 5.48 ]]
+ [[ ! 5.48 =~ ^[0-9.]+$ ]]
+ echo 'Detected Pylint Score: 5.48/10'
+ MIN_SCORE=7.0
++ echo '5.48 >= 7.0'
++ bc -l
Detected Pylint Score: 5.48/10
+ (( 0 ))
❌ Linting score 5.48/10 is less than 7.0. Linting failed.
+ echo '❌ Linting score 5.48/10 is less than 7.0. Linting failed.'
+ exit 1
Error: Process completed with exit code 1.

Lint test failure
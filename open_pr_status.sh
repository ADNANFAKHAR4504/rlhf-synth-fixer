###########################ALL OPEN##########################

# #!/usr/bin/env bash
# set -euo pipefail

# AUTHOR="rajendrasingh-turing"   # <-- change this
# LIMIT=100                       # max PRs to fetch

# echo "PR_NUMBER | BRANCH_NAME | PASSED_CI_STAGES"
# echo "------------------------------------------"

# gh pr list \
#   --state open \
#   --author "$AUTHOR" \
#   --limit "$LIMIT" \
#   --json number,headRefName \
#   --template '{{range .}}{{.number}} {{.headRefName}}{{"\n"}}{{end}}' |
# while read -r PR BRANCH; do

#   PASSED_COUNT=$(
#     gh pr checks "$PR" \
#       --json state \
#       --template '{{range .}}{{if eq .state "SUCCESS"}}1{{end}}{{end}}' |
#     wc -c
#   )

#   printf "%-9s | %-20s | %s\n" "$PR" "$BRANCH" "$PASSED_COUNT"
# done

#######################MIN_PASSED_CI##########################

#!/usr/bin/env bash
set -euo pipefail

AUTHOR="rajendrasingh-turing"   # change this
MIN_PASSED_CI=13                # <-- filter threshold
LIMIT=100

echo "PR_NUMBER | BRANCH_NAME | PASSED_CI_STAGES"
echo "------------------------------------------"

gh pr list \
  --state open \
  --author "$AUTHOR" \
  --limit "$LIMIT" \
  --json number,headRefName \
  --template '{{range .}}{{.number}} {{.headRefName}}{{"\n"}}{{end}}' |
while read -r PR BRANCH; do

  PASSED_COUNT=$(
    gh pr checks "$PR" \
      --json state \
      --template '{{range .}}{{if eq .state "SUCCESS"}}1{{end}}{{end}}' |
    wc -c
  )

  # Filter by minimum passed CI count
  if [ "$PASSED_COUNT" -ge "$MIN_PASSED_CI" ]; then
    printf "%-9s | %-20s | %s\n" "$PR" "$BRANCH" "$PASSED_COUNT"
  fi
done

#################################################

# #!/usr/bin/env bash
# set -euo pipefail

# echo "PR_NUMBER | BRANCH_NAME | PASSED_CI_STAGES"
# echo "------------------------------------------"

# # Fetch open PRs: number + head branch
# gh pr list --state open --json number,headRefName \
#   | jq -r '.[] | "\(.number) \(.headRefName)"' \
#   | while read -r PR BRANCH; do

#       # Count successful CI checks for the PR
#       PASSED_COUNT=$(gh pr checks "$PR" --json name,conclusion \
#         | jq '[.[] | select(.conclusion=="SUCCESS")] | length')

#       printf "%-9s | %-20s | %s\n" "$PR" "$BRANCH" "$PASSED_COUNT"
#     done

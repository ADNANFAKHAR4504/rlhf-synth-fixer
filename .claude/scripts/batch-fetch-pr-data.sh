#!/bin/bash
# Batch fetch all PR data in a single API call
# Much faster than per-PR API calls
set -euo pipefail

ASSIGNEE="${1:-mayanksethi-turing}"
REPO="${2:-TuringGpt/iac-test-automations}"

echo "Batch fetching PR data for: $ASSIGNEE" >&2

# Single GraphQL query to get all open PRs with their data
gh api graphql -f query='
query($owner: String!, $repo: String!, $author: String!) {
  repository(owner: $owner, name: $repo) {
    pullRequests(first: 100, states: OPEN, orderBy: {field: UPDATED_AT, direction: DESC}) {
      nodes {
        number
        title
        headRefName
        url
        author {
          login
        }
        assignees(first: 5) {
          nodes { login }
        }
        comments(last: 20) {
          nodes {
            body
            author { login }
          }
        }
        commits(last: 1) {
          nodes {
            commit {
              statusCheckRollup {
                state
                contexts(first: 30) {
                  nodes {
                    ... on CheckRun {
                      name
                      conclusion
                      status
                    }
                    ... on StatusContext {
                      context
                      state
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}' -f owner="${REPO%/*}" -f repo="${REPO#*/}" -f author="$ASSIGNEE" 2>/dev/null | jq -c '
  [.data.repository.pullRequests.nodes[] |
    # Filter by author
    select(.author.login == "'"$ASSIGNEE"'") |
    
    # Get status check info
    .statusRollup = (.commits.nodes[0].commit.statusCheckRollup // {state: "UNKNOWN", contexts: {nodes: []}}) |
    
    # Check if all checks passed (archiving ready)
    .allChecksPassed = (
      .statusRollup.state == "SUCCESS" or
      (.statusRollup.contexts.nodes | all(
        .conclusion == "SUCCESS" or .conclusion == "success" or
        .conclusion == "SKIPPED" or .conclusion == "skipped" or
        .conclusion == null
      ))
    ) |
    
    # Extract Claude review score from comments
    .claudeScore = (
      [.comments.nodes[] | 
        select(.body | test("SCORE:[[:space:]]*[0-9]+"; "i")) |
        .body | capture("SCORE:[[:space:]]*(?<score>[0-9]+)"; "i") |
        .score | tonumber
      ] | max // null
    ) |
    
    # Only return archiving-ready PRs
    select(.allChecksPassed == true) |
    
    {
      pr_number: .number,
      pr_url: .url,
      branch: .headRefName,
      title: .title,
      author: .author.login,
      assignees: [.assignees.nodes[].login],
      all_checks_passed: .allChecksPassed,
      status_state: .statusRollup.state,
      claude_score: .claudeScore
    }
  ]
'


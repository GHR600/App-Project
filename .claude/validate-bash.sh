#!/bin/bash
COMMAND=$(cat | jq -r '.tool_input.command')

# Define blocked patterns
BLOCKED_DIRS=(
  "node_modules"
  ".env"
  ".git"
  ".expo"
  ".expo-shared"
  "android/build"
  "ios/build"
  "web-build"
  ".gradle"
  "coverage"
  ".cache"
  ".bundle"
  "dist"
  "build"
  "package-lock.json"
)

# Check each blocked pattern
for pattern in "${BLOCKED_DIRS[@]}"; do
  if echo "$COMMAND" | grep -qF "$pattern"; then
    echo "ERROR: Command contains blocked pattern: $pattern" >&2
    exit 2
  fi
done

exit 0
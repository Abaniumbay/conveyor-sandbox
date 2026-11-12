#!/bin/sh

# Create temp file
tmpfile=$(mktemp /tmp/tmp-check.XXXXXX)
if [ $? -ne 0 ]; then
  echo "Error: failed to create temporary file" >&2
  exit 1
fi

# Write to it
if ! echo "test" > "$tmpfile"; then
  echo "Error: failed to write to temporary file: $tmpfile" >&2
  rm -f "$tmpfile"
  exit 1
fi

# Read it back
content=$(cat "$tmpfile")
if [ $? -ne 0 ]; then
  echo "Error: failed to read temporary file: $tmpfile" >&2
  rm -f "$tmpfile"
  exit 1
fi

# Verify content
if [ "$content" != "test" ]; then
  echo "Error: temporary file content mismatch" >&2
  rm -f "$tmpfile"
  exit 1
fi

# Print success message
echo "tmp ok: $tmpfile"

# Clean up
if ! rm -f "$tmpfile"; then
  echo "Error: failed to remove temporary file: $tmpfile" >&2
  exit 1
fi

exit 0

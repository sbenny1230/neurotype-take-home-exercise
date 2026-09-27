printf '%-38s' "web  vitest"
if [ "$fail" -eq 0 ]; then
  log=$(mktemp)
  if docker compose exec -T web npm test --silent >"$log" 2>&1; then
    echo "OK"
  else
    echo "FAILED"
    fail=1
    echo "---- web vitest output ----"
    cat "$log"
  fi
  rm -f "$log"
else
  echo "SKIPPED"
fi

printf '%-38s' "web  eslint + prettier"
if [ "$fail" -eq 0 ]; then
  log=$(mktemp)
  if docker compose exec -T web sh -c 'npm run lint --silent && npm run format:check --silent' >"$log" 2>&1; then
    echo "OK"
  else
    echo "FAILED"
    fail=1
    echo "---- web lint output ----"
    cat "$log"
  fi
  rm -f "$log"
else
  echo "SKIPPED"
fi

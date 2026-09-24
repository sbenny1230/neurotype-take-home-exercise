printf '%-38s' "api  pytest"
if [ "$fail" -eq 0 ]; then
  log=$(mktemp)
  if docker compose exec -T api pytest -q >"$log" 2>&1; then
    echo "OK"
  else
    echo "FAILED"
    fail=1
    echo "---- api pytest output ----"
    cat "$log"
  fi
  rm -f "$log"
else
  echo "SKIPPED"
fi

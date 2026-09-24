WAIT="${WAIT:-90}"
API="${API:-http://localhost:8000}"
WEB="${WEB:-http://localhost:5173}"

fail=0
warn=0

check() {
  printf '%-38s' "$1"
  local deadline=$((SECONDS + WAIT))
  while :; do
    if curl -fsS --max-time 5 "$2" >/dev/null 2>&1; then
      echo "OK"
      return 0
    fi
    if [ "$SECONDS" -ge "$deadline" ]; then
      echo "FAILED"
      fail=1
      return 1
    fi
    sleep 2
  done
}

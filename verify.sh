#!/usr/bin/env bash
# Checks the run contract. Start the stack first with `docker compose up`,
# then run this. It waits up to WAIT seconds for each service, because a cold
# start has to build images and boot a dev server.
set -u

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

check "api  GET /health" "$API/health"
check "web  GET /" "$WEB"

# Not part of the three-line contract, so this warns rather than fails. The web
# app is served from a different origin to the api, so without CORS the browser
# blocks every call and the page renders with no data. It is the most common way
# a submission that passes the checks above still looks broken when opened.
printf '%-38s' "cors $WEB -> api"
if [ "$fail" -eq 0 ]; then
  allow=$(curl -fsS --max-time 5 -D- -o /dev/null -H "Origin: $WEB" "$API/health" 2>/dev/null \
          | tr -d '\r' | awk -F': ' 'tolower($1)=="access-control-allow-origin"{print $2}')
  case "$allow" in
    "$WEB"|'*') echo "OK" ;;
    "")         echo "WARNING  no Access-Control-Allow-Origin header"; warn=1 ;;
    *)          echo "WARNING  allows '$allow', not '$WEB'"; warn=1 ;;
  esac
else
  echo "SKIPPED"
fi

echo
if [ "$fail" -ne 0 ]; then
  echo "Something is not up. Check 'docker compose logs'."
elif [ "$warn" -ne 0 ]; then
  echo "Contract satisfied, with a warning above. Open $WEB and check the"
  echo "browser console before you decide it is fine."
else
  echo "Contract satisfied."
fi
exit "$fail"

check "api  GET /health" "$API/health"
check "web  GET /" "$WEB"

# web and api are different origins, so without CORS headers the browser
# blocks every call and the page renders with no data.
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

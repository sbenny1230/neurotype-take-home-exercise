#!/usr/bin/env bash
# Checks the run contract. Start the stack first with `docker compose up`,
# then run this. It waits up to WAIT seconds for each service, because a cold
# start has to build images and boot a dev server.
set -u

dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

. "$dir/scripts/checks/lib.sh"
. "$dir/scripts/checks/contract.sh"
. "$dir/scripts/checks/api-tests.sh"
. "$dir/scripts/checks/web-tests.sh"
. "$dir/scripts/checks/web-lint.sh"

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

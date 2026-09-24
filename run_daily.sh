#!/data/data/com.termux/files/usr/bin/bash
# ==============================================================================
# GitHub Guardian - Daily Runner Script
# Executes a full maintenance cycle: PR merges, fork syncs, secret scans, hardening.
# ==============================================================================

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export PYTHONPATH="$DIR:$PYTHONPATH"

echo "=== GitHub Guardian Daily Maintenance: $(date) ==="
python3 "$DIR/guardian.py" run-all --limit 50 >> "$DIR/reports/guardian_daily.log" 2>&1
echo "=== Completed run at: $(date) ==="

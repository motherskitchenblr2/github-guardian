#!/data/data/com.termux/files/usr/bin/bash
# ==============================================================================
# GitHub Guardian - Setup Everyday Automation
# Sets up background daemon and termux-boot autostart
# ==============================================================================

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
chmod +x "$DIR/guardian.py" "$DIR/run_daily.sh"

echo "Configuring GitHub Guardian Everyday Automation..."

# Option A: Termux Boot autostart (if Termux:Boot is installed)
BOOT_DIR="$HOME/.termux/boot"
if [ -d "$BOOT_DIR" ]; then
    cat << 'EOF' > "$BOOT_DIR/start_github_guardian.sh"
#!/data/data/com.termux/files/usr/bin/bash
nohup python3 "$HOME/github-guardian/guardian.py" daemon --interval-hours 24 > "$HOME/github-guardian/reports/daemon.log" 2>&1 &
EOF
    chmod +x "$BOOT_DIR/start_github_guardian.sh"
    echo "✓ Termux:Boot startup hook installed to $BOOT_DIR/start_github_guardian.sh"
fi

# Option B: Check if daemon is already running, if not start it
PID=$(pgrep -f "guardian.py daemon" || true)
if [ -n "$PID" ]; then
    echo "✓ GitHub Guardian daemon is already running (PID: $PID)."
else
    nohup python3 -u "$DIR/guardian.py" daemon --interval-hours 24 > "$DIR/reports/daemon.log" 2>&1 &
    NEW_PID=$!
    disown $NEW_PID
    echo "✓ Started GitHub Guardian daemon in background (PID: $NEW_PID)."
    echo "  Logs: $DIR/reports/daemon.log"
fi

echo "========================================================"
echo "Automation Active: Repeats every 24 hours automatically."
echo "========================================================"

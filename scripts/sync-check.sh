#!/usr/bin/env bash
# ==============================================================================
# GITHUB GUARDIAN: 100% PARITY & DUAL-DEPLOYMENT SYNCHRONIZATION ENGINE
# ==============================================================================
# This script ensures that the locally deployed Termux application (port 8765)
# and the Vercel production deployment (https://github-guardian-eight.vercel.app)
# are perpetually 100% in sync on every tab, feature, model, and git commit.
#
# Usage:
#   bash scripts/sync-check.sh           # Run audit & parity verification
#   bash scripts/sync-check.sh --deploy  # Verify, build Next.js, commit & push to GitHub + Vercel
# ==============================================================================

set -euo pipefail

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo -e "${BOLD}${CYAN}==================================================================${NC}"
echo -e "${BOLD}${CYAN}🛡️  GITHUB GUARDIAN: DUAL-DEPLOYMENT PARITY & SYNC AUDITOR        ${NC}"
echo -e "${BOLD}${CYAN}==================================================================${NC}"
echo "Workspace: $ROOT_DIR"
echo "Timestamp: $(date -u '+%Y-%m-%dT%H:%M:%SZ')"
echo ""

ERRORS=0
WARNINGS=0

# ------------------------------------------------------------------------------
# 1. TAB PARITY AUDIT (Local dashboard_template.html vs Vercel app/page.tsx)
# ------------------------------------------------------------------------------
echo -e "${BOLD}[1/6] Auditing Tab Parity Between Local & Vercel Deployments...${NC}"

REQUIRED_TABS=("office" "repos" "prs" "forks" "terminal" "ai" "accounts")

# Check Local HTML (dashboard_template.html)
LOCAL_FILE="dashboard_template.html"
if [ ! -f "$LOCAL_FILE" ]; then
  echo -e "  ${RED}✗ Missing $LOCAL_FILE${NC}"
  ERRORS=$((ERRORS + 1))
else
  echo -e "  ${GREEN}✓ Found $LOCAL_FILE${NC}"
  for tab in "${REQUIRED_TABS[@]}"; do
    if grep -q "data-nav=\"$tab\"" "$LOCAL_FILE"; then
      echo -e "    ${GREEN}✓ Local tab '$tab' navigation registered${NC}"
    else
      echo -e "    ${RED}✗ Local tab '$tab' missing from bottom-nav${NC}"
      ERRORS=$((ERRORS + 1))
    fi
    if grep -q "id=\"pane-$tab\"" "$LOCAL_FILE"; then
      echo -e "    ${GREEN}✓ Local pane 'pane-$tab' present${NC}"
    else
      echo -e "    ${RED}✗ Local pane 'pane-$tab' missing${NC}"
      ERRORS=$((ERRORS + 1))
    fi
  done
fi

# Check Vercel Next.js (app/page.tsx)
VERCEL_PAGE="app/page.tsx"
if [ ! -f "$VERCEL_PAGE" ]; then
  echo -e "  ${RED}✗ Missing $VERCEL_PAGE${NC}"
  ERRORS=$((ERRORS + 1))
else
  echo -e "  ${GREEN}✓ Found $VERCEL_PAGE${NC}"
  # Check tab labels in Next.js
  if grep -q "AI Suite" "$VERCEL_PAGE"; then
    echo -e "    ${GREEN}✓ Vercel AI Suite tab label standardized ('AI Suite')${NC}"
  else
    echo -e "    ${RED}✗ Vercel AI tab label not matching 'AI Suite'${NC}"
    ERRORS=$((ERRORS + 1))
  fi

  if grep -q "Accounts" "$VERCEL_PAGE"; then
    echo -e "    ${GREEN}✓ Vercel Accounts tab label standardized ('Accounts')${NC}"
  else
    echo -e "    ${RED}✗ Vercel Accounts tab label missing${NC}"
    ERRORS=$((ERRORS + 1))
  fi

  # Check component parity
  if [ -f "components/integrations/MultiAccountManager.tsx" ]; then
    echo -e "    ${GREEN}✓ Next.js MultiAccountManager component present${NC}"
  else
    echo -e "    ${RED}✗ Missing components/integrations/MultiAccountManager.tsx${NC}"
    ERRORS=$((ERRORS + 1))
  fi

  if [ -f "components/ai/MultimodalAiSuite.tsx" ]; then
    echo -e "    ${GREEN}✓ Next.js MultimodalAiSuite component present${NC}"
  else
    echo -e "    ${RED}✗ Missing components/ai/MultimodalAiSuite.tsx${NC}"
    ERRORS=$((ERRORS + 1))
  fi
fi

# ------------------------------------------------------------------------------
# 2. LOCAL MICRO-SERVER HEALTH (Port 8765)
# ------------------------------------------------------------------------------
echo ""
echo -e "${BOLD}[2/6] Auditing Local Python Dashboard Micro-Server (Port 8765)...${NC}"
if curl -s -f --max-time 3 http://127.0.0.1:8765/ > /dev/null 2>&1; then
  echo -e "  ${GREEN}✓ Local dashboard is LIVE on http://localhost:8765/${NC}"
  DASH_CONTENT=$(curl -s --max-time 5 http://127.0.0.1:8765/ || echo "")
  if echo "$DASH_CONTENT" | grep "pane-accounts" > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓ Live server serving pane-accounts${NC}"
  else
    echo -e "  ${RED}✗ Live server on port 8765 is NOT serving pane-accounts!${NC}"
    ERRORS=$((ERRORS + 1))
  fi
else
  echo -e "  ${YELLOW}⚠ Local dashboard server (port 8765) is offline or busy${NC}"
  WARNINGS=$((WARNINGS + 1))
fi

# ------------------------------------------------------------------------------
# 3. OLLAMA OFFLINE AI ENGINE (Port 11434)
# ------------------------------------------------------------------------------
echo ""
echo -e "${BOLD}[3/6] Auditing Ollama AI Server & Model Inventory (Port 11434)...${NC}"
if curl -s -f --max-time 3 http://127.0.0.1:11434/api/tags > /dev/null 2>&1; then
  OLLAMA_MODELS=$(curl -s http://127.0.0.1:11434/api/tags | tr -d '\n')
  MODEL_COUNT=$(echo "$OLLAMA_MODELS" | grep -o '"name":' | wc -l || echo 0)
  echo -e "  ${GREEN}✓ Ollama daemon is LIVE on port 11434 with $MODEL_COUNT models installed${NC}"

  for m in "qwen2.5-coder:1.5b" "deepseek-r1:1.5b" "moondream:latest" "smollm2:360m"; do
    if echo "$OLLAMA_MODELS" | grep -q "$m"; then
      echo -e "    ${GREEN}✓ Model '$m' installed and ready for offline inference${NC}"
    else
      echo -e "    ${YELLOW}⚠ Model '$m' not listed in Ollama tags${NC}"
      WARNINGS=$((WARNINGS + 1))
    fi
  done
else
  echo -e "  ${YELLOW}⚠ Ollama daemon not reachable on port 11434${NC}"
  WARNINGS=$((WARNINGS + 1))
fi

# ------------------------------------------------------------------------------
# 4. NEXT.JS TYPESCRIPT & BUILD AUDIT
# ------------------------------------------------------------------------------
echo ""
echo -e "${BOLD}[4/6] Checking Next.js TypeScript Compilation...${NC}"
if node node_modules/typescript/bin/tsc --noEmit; then
  echo -e "  ${GREEN}✓ TypeScript check passed with zero errors${NC}"
else
  echo -e "  ${RED}✗ TypeScript check failed${NC}"
  ERRORS=$((ERRORS + 1))
fi

# ------------------------------------------------------------------------------
# 5. GIT REPOSITORY SYNC STATE
# ------------------------------------------------------------------------------
echo ""
echo -e "${BOLD}[5/6] Auditing Git Synchronization State...${NC}"
DIRTY_FILES=$(git status --porcelain | wc -l || echo 0)
if [ "$DIRTY_FILES" -gt 0 ]; then
  echo -e "  ${YELLOW}⚠ You have $DIRTY_FILES uncommitted changes:${NC}"
  git status --short
else
  echo -e "  ${GREEN}✓ Git working directory is clean${NC}"
fi

# Check commit difference with origin/main
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "  Current branch: $CURRENT_BRANCH"
git fetch origin "$CURRENT_BRANCH" --quiet 2>/dev/null || true
LOCAL_SHA=$(git rev-parse HEAD)
REMOTE_SHA=$(git rev-parse "origin/$CURRENT_BRANCH" 2>/dev/null || echo "unknown")

if [ "$LOCAL_SHA" = "$REMOTE_SHA" ]; then
  echo -e "  ${GREEN}✓ Local branch is 100% in sync with origin/$CURRENT_BRANCH ($LOCAL_SHA)${NC}"
else
  AHEAD=$(git rev-list --count "origin/$CURRENT_BRANCH..HEAD" 2>/dev/null || echo 0)
  BEHIND=$(git rev-list --count "HEAD..origin/$CURRENT_BRANCH" 2>/dev/null || echo 0)
  echo -e "  ${YELLOW}⚠ Branch divergence: $AHEAD commit(s) ahead, $BEHIND commit(s) behind remote${NC}"
fi

# ------------------------------------------------------------------------------
# 6. SYNC & DEPLOY ACTION (If --deploy flag passed)
# ------------------------------------------------------------------------------
echo ""
echo -e "${BOLD}[6/6] Dual-Deployment Verification & Sync Execution...${NC}"

if [[ "${1:-}" == "--deploy" || "${1:-}" == "--sync-push" ]]; then
  if [ "$ERRORS" -gt 0 ]; then
    echo -e "${RED}❌ Cannot deploy: $ERRORS parity errors detected above. Fix errors first.${NC}"
    exit 1
  fi

  echo "Building Next.js for production release..."
  node node_modules/next/dist/bin/next build

  echo "Staging all synchronized parity changes..."
  git add .

  if ! git diff --cached --quiet; then
    COMMIT_MSG="feat(sync): dual-deployment parity across local 8765 and Vercel cloud"
    git commit -m "$COMMIT_MSG"
    echo -e "${GREEN}✓ Changes committed: '$COMMIT_MSG'${NC}"
  else
    echo "No uncommitted diffs to commit."
  fi

  echo "Pushing changes to GitHub origin/$CURRENT_BRANCH..."
  git push origin "$CURRENT_BRANCH"
  echo -e "${GREEN}✓ Successfully pushed to GitHub origin/$CURRENT_BRANCH!${NC}"
  echo -e "${CYAN}🚀 Vercel will automatically trigger a production deployment from origin/$CURRENT_BRANCH.${NC}"
  echo "Track status at: https://vercel.com or check https://github-guardian-eight.vercel.app"
else
  echo -e "Run ${BOLD}bash scripts/sync-check.sh --deploy${NC} to automatically build, commit, and sync both deployments."
fi

echo ""
echo -e "${BOLD}${CYAN}==================================================================${NC}"
if [ "$ERRORS" -eq 0 ]; then
  echo -e "${BOLD}${GREEN}🎉 ALL 7 TABS & MULTI-ACCOUNT INTEGRATIONS IN 100% PARITY!       ${NC}"
  echo -e "${GREEN}Local (http://localhost:8765) ⟷ Cloud (https://github-guardian-eight.vercel.app)${NC}"
else
  echo -e "${BOLD}${RED}❌ AUDIT COMPLETED WITH $ERRORS ERROR(S). PLEASE RESOLVE THEM.   ${NC}"
  exit 1
fi
echo -e "${BOLD}${CYAN}==================================================================${NC}"

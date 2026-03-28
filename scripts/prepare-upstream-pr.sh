#!/usr/bin/env bash
# =============================================================================
# prepare-upstream-pr.sh
#
# Helper script for contributing TrafficGenie changes back to TrafficVision.
#
# Usage:
#   ./scripts/prepare-upstream-pr.sh [--check | --patch | --status]
#
# Options:
#   --check   Verify git state and upstream remote configuration
#   --patch   Generate a patch file with all changes vs TrafficVision
#   --status  Show a summary of files changed vs TrafficVision
#   (none)    Interactive mode – walks through the full workflow
# =============================================================================

set -euo pipefail

UPSTREAM_REPO="https://github.com/hrshbuilds/TrafficVision.git"
UPSTREAM_REMOTE="trafficvision"
UPSTREAM_BRANCH="main"
PATCH_DIR="./upstream-patches"

# ─── Colour helpers ──────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

info()    { echo -e "${CYAN}[INFO]${RESET}  $*"; }
success() { echo -e "${GREEN}[OK]${RESET}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${RESET}  $*"; }
error()   { echo -e "${RED}[ERROR]${RESET} $*" >&2; }
header()  { echo -e "\n${BOLD}${CYAN}=== $* ===${RESET}\n"; }

# ─── Prerequisite checks ─────────────────────────────────────────────────────
check_prerequisites() {
    header "Checking prerequisites"

    if ! command -v git &>/dev/null; then
        error "git is not installed. Please install git and try again."
        exit 1
    fi
    success "git found: $(git --version)"

    if ! git rev-parse --is-inside-work-tree &>/dev/null; then
        error "Not inside a git repository. Run this script from the project root."
        exit 1
    fi
    success "Inside git repository: $(git rev-parse --show-toplevel)"
}

# ─── Upstream remote setup ───────────────────────────────────────────────────
setup_upstream_remote() {
    header "Setting up upstream remote"

    if git remote get-url "$UPSTREAM_REMOTE" &>/dev/null; then
        local current_url
        current_url=$(git remote get-url "$UPSTREAM_REMOTE")
        if [[ "$current_url" == "$UPSTREAM_REPO" ]]; then
            success "Remote '$UPSTREAM_REMOTE' already points to $UPSTREAM_REPO"
        else
            warn "Remote '$UPSTREAM_REMOTE' exists but points to: $current_url"
            warn "Expected: $UPSTREAM_REPO"
            read -r -p "Update it? [y/N] " ans
            if [[ "$ans" =~ ^[Yy]$ ]]; then
                git remote set-url "$UPSTREAM_REMOTE" "$UPSTREAM_REPO"
                success "Updated remote '$UPSTREAM_REMOTE' to $UPSTREAM_REPO"
            fi
        fi
    else
        git remote add "$UPSTREAM_REMOTE" "$UPSTREAM_REPO"
        success "Added remote '$UPSTREAM_REMOTE' → $UPSTREAM_REPO"
    fi
}

# ─── Fetch upstream ──────────────────────────────────────────────────────────
fetch_upstream() {
    header "Fetching upstream TrafficVision"
    info "Fetching $UPSTREAM_REMOTE/$UPSTREAM_BRANCH …"
    if git fetch "$UPSTREAM_REMOTE" "$UPSTREAM_BRANCH" 2>&1; then
        success "Fetched $UPSTREAM_REMOTE/$UPSTREAM_BRANCH"
    else
        error "Failed to fetch upstream. Check your network connection."
        exit 1
    fi
}

# ─── Show diff summary ───────────────────────────────────────────────────────
show_status() {
    header "Changes vs TrafficVision (upstream)"

    local upstream_ref="${UPSTREAM_REMOTE}/${UPSTREAM_BRANCH}"

    echo -e "${BOLD}Files added in TrafficGenie:${RESET}"
    git --no-pager diff --name-status "$upstream_ref" HEAD \
        | grep '^A' | awk '{print "  + "$2}' || true

    echo -e "\n${BOLD}Files modified in TrafficGenie:${RESET}"
    git --no-pager diff --name-status "$upstream_ref" HEAD \
        | grep '^M' | awk '{print "  ~ "$2}' || true

    echo -e "\n${BOLD}Files deleted vs upstream:${RESET}"
    git --no-pager diff --name-status "$upstream_ref" HEAD \
        | grep '^D' | awk '{print "  - "$2}' || true

    echo ""
    info "Run with --patch to generate a patch file you can submit as a PR."
}

# ─── Generate patch ──────────────────────────────────────────────────────────
generate_patch() {
    header "Generating upstream patch"

    local upstream_ref="${UPSTREAM_REMOTE}/${UPSTREAM_BRANCH}"
    local timestamp
    timestamp=$(date +%Y%m%d_%H%M%S)
    local patch_file="${PATCH_DIR}/trafficgenie-changes-${timestamp}.patch"

    mkdir -p "$PATCH_DIR"

    git --no-pager diff "$upstream_ref" HEAD > "$patch_file"

    local size
    size=$(wc -c < "$patch_file")
    if [[ "$size" -eq 0 ]]; then
        warn "Patch is empty – no differences found vs upstream."
        rm "$patch_file"
    else
        success "Patch written to: $patch_file  ($(numfmt --to=iec "$size"))"
        info "You can apply this patch in the TrafficVision repo with:"
        echo -e "    git apply $patch_file"
    fi
}

# ─── Full interactive workflow ───────────────────────────────────────────────
interactive_workflow() {
    header "TrafficGenie → TrafficVision contribution workflow"

    cat <<'INTRO'
This script will help you contribute the changes made in TrafficGenie back to
the original TrafficVision repository.

Overview of steps:
  1. Add 'trafficvision' as an upstream git remote
  2. Fetch the current upstream state
  3. Show a summary of your changes
  4. Generate a patch file  OR  open a Pull Request on GitHub

INTRO

    read -r -p "Continue? [Y/n] " ans
    if [[ "$ans" =~ ^[Nn]$ ]]; then
        info "Aborted."
        exit 0
    fi

    check_prerequisites
    setup_upstream_remote
    fetch_upstream
    show_status

    echo ""
    echo -e "${BOLD}What would you like to do next?${RESET}"
    echo "  1) Generate a local patch file"
    echo "  2) Print GitHub Pull Request instructions"
    echo "  3) Both"
    echo "  4) Exit"
    read -r -p "Choice [1-4]: " choice

    case "$choice" in
        1) generate_patch ;;
        2) print_pr_instructions ;;
        3) generate_patch; print_pr_instructions ;;
        4) info "Done."; exit 0 ;;
        *) warn "Invalid choice. Exiting."; exit 1 ;;
    esac
}

# ─── PR instructions ─────────────────────────────────────────────────────────
print_pr_instructions() {
    header "How to open a Pull Request on GitHub"

    cat <<'INSTRUCTIONS'
To propose your TrafficGenie changes to the upstream TrafficVision repository,
follow these steps:

────────────────────────────────────────────────────────────────────────────────
OPTION A – GitHub Web UI  (easiest)
────────────────────────────────────────────────────────────────────────────────
1. Open https://github.com/hrshbuilds/trafficgenie in your browser.
2. Click the "Contribute" button → "Open pull request".
3. GitHub will automatically compare your fork against hrshbuilds/TrafficVision.
4. Fill in the PR title and description (use the template below).
5. Click "Create pull request".

────────────────────────────────────────────────────────────────────────────────
OPTION B – GitHub CLI
────────────────────────────────────────────────────────────────────────────────
  # Install GitHub CLI if needed: https://cli.github.com/
  gh pr create \
    --repo hrshbuilds/TrafficVision \
    --head hrshbuilds:main \
    --base main \
    --title "feat: TrafficGenie – full-stack upgrade of TrafficVision" \
    --body "$(cat UPSTREAM_CONTRIBUTION_GUIDE.md)"

────────────────────────────────────────────────────────────────────────────────
OPTION C – Apply patch manually in TrafficVision
────────────────────────────────────────────────────────────────────────────────
  # Clone TrafficVision
  git clone https://github.com/hrshbuilds/TrafficVision trafficvision-local
  cd trafficvision-local

  # Apply the generated patch
  git apply /path/to/upstream-patches/trafficgenie-changes-<timestamp>.patch

  # Review, commit, and push to a new branch, then open a PR
  git checkout -b feat/trafficgenie-upgrade
  git add .
  git commit -m "feat: upgrade to TrafficGenie full-stack architecture"
  git push origin feat/trafficgenie-upgrade
  # Then open PR on GitHub

────────────────────────────────────────────────────────────────────────────────
SUGGESTED PR DESCRIPTION TEMPLATE
────────────────────────────────────────────────────────────────────────────────

## Summary
This PR brings the full TrafficGenie feature set into TrafficVision.

## Changes
- 🏗️  **Backend**: Replaced script-based detection with a FastAPI REST API
- 🗄️  **Database**: Added SQLAlchemy models + Alembic migrations
- 🔥  **Firebase**: Integrated Firestore + Cloud Storage
- 🤖  **Gemini AI**: Added violation insight generation
- 🎨  **Frontend**: New React/Vite dashboard with real-time updates
- 🧪  **Tests**: Added pytest test suite with FastAPI TestClient
- 📚  **Docs**: Comprehensive deployment + API guides

## How to test
See QUICK_START_LOCAL.md for local setup instructions.

INSTRUCTIONS
}

# ─── Entry point ─────────────────────────────────────────────────────────────
case "${1:-}" in
    --check)
        check_prerequisites
        setup_upstream_remote
        fetch_upstream
        ;;
    --patch)
        check_prerequisites
        setup_upstream_remote
        fetch_upstream
        generate_patch
        ;;
    --status)
        check_prerequisites
        setup_upstream_remote
        fetch_upstream
        show_status
        ;;
    --pr-instructions)
        print_pr_instructions
        ;;
    "")
        interactive_workflow
        ;;
    *)
        error "Unknown option: $1"
        echo "Usage: $0 [--check | --patch | --status | --pr-instructions]"
        exit 1
        ;;
esac

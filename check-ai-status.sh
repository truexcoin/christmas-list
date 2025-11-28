#!/bin/bash

# Script to check AI feature status on VPS
# Usage: ./check-ai-status.sh [vps-user@vps-ip]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default VPS connection
VPS_CONNECTION="${1:-root@83.229.5.230}"
VPS_PATH="/var/www/christmas-list"
ENV_FILE="${VPS_PATH}/.env"

echo -e "${BLUE}🔍 AI Feature Diagnostic Script${NC}"
echo -e "${BLUE}=================================${NC}\n"

# Check SSH connection
echo -e "${YELLOW}Testing SSH connection...${NC}"
if ! ssh -o ConnectTimeout=5 -o BatchMode=yes "${VPS_CONNECTION}" "echo 'OK'" > /dev/null 2>&1; then
    echo -e "${RED}❌ Cannot connect to ${VPS_CONNECTION}${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Connected${NC}\n"

# Check if .env file exists
echo -e "${YELLOW}Checking .env file...${NC}"
if ssh "${VPS_CONNECTION}" "[ -f ${ENV_FILE} ]"; then
    echo -e "${GREEN}✅ .env file exists${NC}"
else
    echo -e "${RED}❌ .env file not found at ${ENV_FILE}${NC}"
    exit 1
fi

# Check GEMINI_API_KEY
echo -e "\n${YELLOW}Checking GEMINI_API_KEY...${NC}"
GEMINI_KEY=$(ssh "${VPS_CONNECTION}" "grep '^GEMINI_API_KEY=' ${ENV_FILE} 2>/dev/null | cut -d '=' -f2-" || echo "")

if [ -z "$GEMINI_KEY" ]; then
    echo -e "${RED}❌ GEMINI_API_KEY is not set${NC}"
    echo -e "${YELLOW}   This is why AI features are not working!${NC}"
    echo -e "\n${BLUE}To fix:${NC}"
    echo -e "  1. Run: ./update-keys.sh"
    echo -e "  2. Or manually edit: ssh ${VPS_CONNECTION} 'nano ${ENV_FILE}'"
    echo -e "  3. Add: GEMINI_API_KEY=your-key-here"
    echo -e "  4. Restart: ssh ${VPS_CONNECTION} 'cd ${VPS_PATH} && pm2 restart christmas-list'"
else
    KEY_LENGTH=${#GEMINI_KEY}
    KEY_PREVIEW="${GEMINI_KEY:0:10}...${GEMINI_KEY: -5}"
    echo -e "${GREEN}✅ GEMINI_API_KEY is set${NC}"
    echo -e "   Length: ${KEY_LENGTH} characters"
    echo -e "   Preview: ${KEY_PREVIEW}"
    
    if [ "$KEY_LENGTH" -lt 20 ]; then
        echo -e "${RED}⚠️  Warning: Key seems too short (may be invalid)${NC}"
    fi
fi

# Check if PM2 is running
echo -e "\n${YELLOW}Checking PM2 process...${NC}"
if ssh "${VPS_CONNECTION}" "pm2 list | grep -q christmas-list"; then
    PM2_STATUS=$(ssh "${VPS_CONNECTION}" "pm2 jlist | jq -r '.[] | select(.name==\"christmas-list\") | .pm2_env.status' 2>/dev/null || echo 'unknown'")
    if [ "$PM2_STATUS" = "online" ]; then
        echo -e "${GREEN}✅ PM2 process is running (status: ${PM2_STATUS})${NC}"
    else
        echo -e "${RED}❌ PM2 process status: ${PM2_STATUS}${NC}"
        echo -e "${YELLOW}   Restart with: ssh ${VPS_CONNECTION} 'cd ${VPS_PATH} && pm2 restart christmas-list'${NC}"
    fi
else
    echo -e "${RED}❌ PM2 process 'christmas-list' not found${NC}"
fi

# Check if environment variables are loaded in PM2
echo -e "\n${YELLOW}Checking PM2 environment variables...${NC}"
PM2_ENV=$(ssh "${VPS_CONNECTION}" "pm2 jlist | jq -r '.[] | select(.name==\"christmas-list\") | .pm2_env.env.GEMINI_API_KEY // \"not set\"' 2>/dev/null || echo 'error'")

if [ "$PM2_ENV" = "not set" ] || [ "$PM2_ENV" = "error" ] || [ -z "$PM2_ENV" ]; then
    echo -e "${RED}❌ GEMINI_API_KEY not loaded in PM2 environment${NC}"
    echo -e "${YELLOW}   PM2 may need to be restarted to load new environment variables${NC}"
    echo -e "${YELLOW}   Run: ssh ${VPS_CONNECTION} 'cd ${VPS_PATH} && pm2 restart christmas-list --update-env'${NC}"
else
    echo -e "${GREEN}✅ GEMINI_API_KEY is loaded in PM2${NC}"
fi

# Test API endpoint
echo -e "\n${YELLOW}Testing AI generate endpoint...${NC}"
TEST_RESPONSE=$(ssh "${VPS_CONNECTION}" "curl -s -X POST http://localhost:3000/api/gifts/generate -H 'Content-Type: application/json' -d '{\"name\":\"test\"}'" || echo "error")

if echo "$TEST_RESPONSE" | grep -q "Gemini API key is not configured"; then
    echo -e "${RED}❌ API endpoint reports: Gemini API key is not configured${NC}"
    echo -e "${YELLOW}   The application is not seeing the environment variable${NC}"
    echo -e "${YELLOW}   Solution: Restart PM2 with --update-env flag${NC}"
elif echo "$TEST_RESPONSE" | grep -q "error"; then
    echo -e "${YELLOW}⚠️  Could not test endpoint (may be normal if app is not running)${NC}"
else
    echo -e "${GREEN}✅ API endpoint is responding${NC}"
    echo -e "   Response preview: ${TEST_RESPONSE:0:100}..."
fi

# Summary
echo -e "\n${BLUE}=================================${NC}"
echo -e "${BLUE}Summary:${NC}\n"

if [ -z "$GEMINI_KEY" ]; then
    echo -e "${RED}❌ AI features will NOT work - GEMINI_API_KEY is missing${NC}"
    echo -e "\n${YELLOW}Quick fix:${NC}"
    echo -e "  ./update-keys.sh"
    exit 1
elif [ "$PM2_ENV" = "not set" ] || [ "$PM2_ENV" = "error" ] || [ -z "$PM2_ENV" ]; then
    echo -e "${YELLOW}⚠️  AI features may not work - PM2 needs restart${NC}"
    echo -e "\n${YELLOW}Quick fix:${NC}"
    echo -e "  ssh ${VPS_CONNECTION} 'cd ${VPS_PATH} && pm2 restart christmas-list --update-env'"
    exit 1
else
    echo -e "${GREEN}✅ Configuration looks good!${NC}"
    echo -e "${YELLOW}   If AI still doesn't work, check:${NC}"
    echo -e "   - API key validity at https://makersuite.google.com/app/apikey"
    echo -e "   - PM2 logs: ssh ${VPS_CONNECTION} 'pm2 logs christmas-list --lines 50'"
    exit 0
fi


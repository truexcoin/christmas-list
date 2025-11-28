#!/bin/bash

# Script to update API keys on the VPS
# Usage: ./update-keys.sh [vps-user@vps-ip]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default VPS connection (can be overridden with argument)
VPS_CONNECTION="${1:-root@83.229.5.230}"
VPS_PATH="/var/www/christmas-list"
ENV_FILE="${VPS_PATH}/.env"

echo -e "${BLUE}🔑 API Key Update Script${NC}"
echo -e "${BLUE}========================${NC}\n"

# Check if SSH connection works
echo -e "${YELLOW}Testing SSH connection to ${VPS_CONNECTION}...${NC}"
if ! ssh -o ConnectTimeout=5 -o BatchMode=yes "${VPS_CONNECTION}" "echo 'Connection successful'" > /dev/null 2>&1; then
    echo -e "${RED}❌ Cannot connect to ${VPS_CONNECTION}${NC}"
    echo -e "${YELLOW}Make sure you have SSH access set up.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Connection successful${NC}\n"

# Function to update a key
update_key() {
    local key_name=$1
    local key_display_name=$2
    local current_value=""
    
    # Get current value from VPS
    echo -e "${YELLOW}Checking current ${key_display_name}...${NC}"
    current_value=$(ssh "${VPS_CONNECTION}" "grep '^${key_name}=' ${ENV_FILE} 2>/dev/null | cut -d '=' -f2-" || echo "")
    
    if [ -n "$current_value" ]; then
        echo -e "${BLUE}Current value: ${current_value:0:20}...${NC}"
    else
        echo -e "${YELLOW}No current value found${NC}"
    fi
    
    echo -e "\n${YELLOW}Enter new ${key_display_name} (or press Enter to skip):${NC}"
    read -r new_value
    
    if [ -z "$new_value" ]; then
        echo -e "${BLUE}Skipping ${key_display_name}...${NC}\n"
        return
    fi
    
    # Validate key format (basic check)
    if [ ${#new_value} -lt 10 ]; then
        echo -e "${RED}⚠️  Warning: Key seems too short. Are you sure? (y/n)${NC}"
        read -r confirm
        if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
            echo -e "${BLUE}Skipping ${key_display_name}...${NC}\n"
            return
        fi
    fi
    
    # Update the key on VPS
    echo -e "${YELLOW}Updating ${key_display_name} on VPS...${NC}"
    
    # Check if key exists in .env file
    if ssh "${VPS_CONNECTION}" "grep -q '^${key_name}=' ${ENV_FILE} 2>/dev/null"; then
        # Update existing key
        ssh "${VPS_CONNECTION}" "sed -i 's|^${key_name}=.*|${key_name}=${new_value}|' ${ENV_FILE}"
    else
        # Add new key
        ssh "${VPS_CONNECTION}" "echo '${key_name}=${new_value}' >> ${ENV_FILE}"
    fi
    
    echo -e "${GREEN}✅ ${key_display_name} updated${NC}\n"
}

# Main update process
echo -e "${BLUE}Which keys would you like to update?${NC}"
echo -e "1) Gemini API Key (GEMINI_API_KEY)"
echo -e "2) Pexels API Key (PEXELS_API_KEY)"
echo -e "3) Unsplash API Key (UNSPLASH_ACCESS_KEY)"
echo -e "4) All keys"
echo -e "5) Custom key"
echo -e "6) Cancel"
echo -e "\n${YELLOW}Enter your choice (1-6):${NC}"
read -r choice

case $choice in
    1)
        update_key "GEMINI_API_KEY" "Gemini API Key"
        ;;
    2)
        update_key "PEXELS_API_KEY" "Pexels API Key"
        ;;
    3)
        update_key "UNSPLASH_ACCESS_KEY" "Unsplash API Key"
        ;;
    4)
        echo -e "\n${BLUE}Updating all keys...${NC}\n"
        update_key "GEMINI_API_KEY" "Gemini API Key"
        update_key "PEXELS_API_KEY" "Pexels API Key"
        update_key "UNSPLASH_ACCESS_KEY" "Unsplash API Key"
        ;;
    5)
        echo -e "\n${YELLOW}Enter the key name (e.g., REDIS_URL, ADMIN_PASSWORD):${NC}"
        read -r custom_key_name
        if [ -z "$custom_key_name" ]; then
            echo -e "${RED}Key name cannot be empty${NC}"
            exit 1
        fi
        update_key "$custom_key_name" "$custom_key_name"
        ;;
    6)
        echo -e "${BLUE}Cancelled${NC}"
        exit 0
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

# Ask if user wants to restart the application
echo -e "\n${YELLOW}Do you want to restart the application? (y/n)${NC}"
read -r restart_choice

if [ "$restart_choice" = "y" ] || [ "$restart_choice" = "Y" ]; then
    echo -e "\n${YELLOW}Restarting application...${NC}"
    ssh "${VPS_CONNECTION}" "cd ${VPS_PATH} && pm2 restart christmas-list"
    echo -e "${GREEN}✅ Application restarted${NC}"
    
    # Wait a moment and check status
    sleep 2
    echo -e "\n${YELLOW}Checking application status...${NC}"
    ssh "${VPS_CONNECTION}" "pm2 status christmas-list"
else
    echo -e "${BLUE}Application not restarted. Remember to restart manually:${NC}"
    echo -e "${YELLOW}ssh ${VPS_CONNECTION} 'cd ${VPS_PATH} && pm2 restart christmas-list'${NC}"
fi

echo -e "\n${GREEN}✅ Done!${NC}"


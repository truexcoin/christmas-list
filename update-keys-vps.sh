#!/bin/bash

# Script to update API keys directly on the VPS
# Run this script on your VPS: ./update-keys-vps.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

VPS_PATH="/var/www/christmas-list"
ENV_FILE="${VPS_PATH}/.env"

echo -e "${BLUE}🔑 API Key Update Script (VPS)${NC}"
echo -e "${BLUE}===============================${NC}\n"

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then 
    echo -e "${YELLOW}⚠️  Not running as root. Some operations may require sudo.${NC}\n"
fi

# Check if .env file exists
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${YELLOW}Creating .env file...${NC}"
    touch "$ENV_FILE"
    chmod 600 "$ENV_FILE"
fi

# Function to update a key
update_key() {
    local key_name=$1
    local key_display_name=$2
    local current_value=""
    
    # Get current value
    if [ -f "$ENV_FILE" ]; then
        current_value=$(grep "^${key_name}=" "$ENV_FILE" 2>/dev/null | cut -d '=' -f2- || echo "")
    fi
    
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
    
    # Update the key
    echo -e "${YELLOW}Updating ${key_display_name}...${NC}"
    
    # Check if key exists in .env file
    if grep -q "^${key_name}=" "$ENV_FILE" 2>/dev/null; then
        # Update existing key
        sed -i "s|^${key_name}=.*|${key_name}=${new_value}|" "$ENV_FILE"
    else
        # Add new key
        echo "${key_name}=${new_value}" >> "$ENV_FILE"
    fi
    
    echo -e "${GREEN}✅ ${key_display_name} updated${NC}\n"
}

# Main update process
echo -e "${BLUE}Which keys would you like to update?${NC}"
echo -e "1) Gemini API Key (GEMINI_API_KEY)"
echo -e "2) Pexels API Key (PEXELS_API_KEY)"
echo -e "3) Unsplash API Key (UNSPLASH_ACCESS_KEY)"
echo -e "4) Redis URL (REDIS_URL)"
echo -e "5) Admin Password (ADMIN_PASSWORD)"
echo -e "6) All API keys (Gemini, Pexels, Unsplash)"
echo -e "7) Custom key"
echo -e "8) Cancel"
echo -e "\n${YELLOW}Enter your choice (1-8):${NC}"
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
        update_key "REDIS_URL" "Redis URL"
        ;;
    5)
        update_key "ADMIN_PASSWORD" "Admin Password"
        ;;
    6)
        echo -e "\n${BLUE}Updating all API keys...${NC}\n"
        update_key "GEMINI_API_KEY" "Gemini API Key"
        update_key "PEXELS_API_KEY" "Pexels API Key"
        update_key "UNSPLASH_ACCESS_KEY" "Unsplash API Key"
        ;;
    7)
        echo -e "\n${YELLOW}Enter the key name:${NC}"
        read -r custom_key_name
        if [ -z "$custom_key_name" ]; then
            echo -e "${RED}Key name cannot be empty${NC}"
            exit 1
        fi
        update_key "$custom_key_name" "$custom_key_name"
        ;;
    8)
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
    cd "$VPS_PATH" || exit 1
    pm2 restart christmas-list
    echo -e "${GREEN}✅ Application restarted${NC}"
    
    # Wait a moment and check status
    sleep 2
    echo -e "\n${YELLOW}Application status:${NC}"
    pm2 status christmas-list
else
    echo -e "${BLUE}Application not restarted. Restart manually with:${NC}"
    echo -e "${YELLOW}cd ${VPS_PATH} && pm2 restart christmas-list${NC}"
fi

echo -e "\n${GREEN}✅ Done!${NC}"


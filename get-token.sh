#!/bin/bash
# Trello Token Setup Helper

echo "To complete Trello authentication, you need to generate a token."
echo ""
echo "Step 1: Get your API Key from https://trello.com/app-key"
echo ""
echo "Step 2: Visit this URL (replace YOUR_API_KEY with your actual key):"
echo "https://trello.com/1/authorize?expiration=never&scope=read,write&response_type=token&name=OpenClaw&key=YOUR_API_KEY"
echo ""
echo "Step 3: Log into Trello and authorize the app"
echo ""
echo "Step 4: Copy the token shown and run:"
echo "  trello auth --api-key YOUR_API_KEY --token YOUR_TOKEN"

#!/bin/bash
files=("components/Header.tsx" "contexts/AppStateContext.tsx" "pages/AdminPage.tsx" "pages/BuyTokensPage.tsx" "pages/VoiceAgentPage.tsx")
for file in "${files[@]}"; do
  sed -i "s|from '../lib/AuthContext.tsx'|from '../lib/MongoAuthContext.tsx'|g" "/app/$file"
  echo "✅ Fixed: $file"
done
echo "\n✅ All imports updated to MongoAuthContext!"
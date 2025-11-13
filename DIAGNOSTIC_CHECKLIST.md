# Diagnostic Checklist for AddProductPage.tsx 500 Error

## Check All Required Files Exist

```bash
# Run this in PowerShell to check if all imports are present:

$files = @(
    "src/pages/AddProductPage.tsx",
    "src/components/ui/button.tsx",
    "src/components/ui/input.tsx",
    "src/components/ui/card.tsx",
    "src/hooks/use-toast.ts",
    "src/contexts/LanguageContext.tsx",
    "src/hooks/useCreateProduct.ts",
    "src/hooks/useTranslationMutations.ts",
    "src/integrations/supabase/client.ts"
)

foreach ($file in $files) {
    $exists = Test-Path $file
    $status = if ($exists) { "✅ EXISTS" } else { "❌ MISSING" }
    Write-Host "$status  $file" -ForegroundColor $(if ($exists) { 'Green' } else { 'Red' })
}
```

---

## Check Environment Variables

**File**: `.env`

Should contain:
```
VITE_SUPABASE_URL=https://qlhpzsucftqcakiotgpc.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Check**:
```bash
# On Windows PowerShell:
Get-Content .env

# Should show VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY
```

---

## Check Vite Configuration

**File**: `vite.config.ts`

Should have React plugin:
```typescript
import react from '@vitejs/plugin-react'
```

And path alias:
```typescript
alias: {
  '@': path.resolve(__dirname, './src'),
}
```

---

## Verify Package Dependencies

**Run**:
```bash
pnpm list react react-router-dom react-query
```

**Expected Output** (versions may vary):
```
├── react@18.3.1
├── react-router-dom@6.30.1
└── @tanstack/react-query@5.83.0
```

---

## Check for TypeScript Errors

**Run**:
```bash
# Check TypeScript compilation
npx tsc --noEmit

# Should say "No errors" or list specific errors
```

---

## Test Minimal Fix

If AddProductPage won't load, try temporarily replacing it with a minimal version:

**Temporary File**: `src/pages/TestPage.tsx`

```typescript
export default function TestPage() {
  return <div>Test Page Works!</div>;
}
```

Then in router, temporarily change AddProductPage import to TestPage.

If TestPage works: Problem is in AddProductPage.tsx  
If TestPage fails: Problem is in Vite/build configuration

---

## Check Browser Network Tab

1. Open DevTools (F12)
2. Go to **Network** tab
3. Refresh page
4. Find the red entry (failed request)
5. Click on it
6. Check **Response** tab

**Look for**:
- `SyntaxError:` → Syntax error in file
- `Module not found:` → Missing import
- `Cannot find module:` → Import path wrong
- Generic 500 → Server error

---

## Restart Dev Server with Diagnostics

```bash
# Delete cache files
Remove-Item -Recurse -Force node_modules\.vite

# Start with --force to rebuild everything
npm run dev -- --force

# Or use full verbose mode
npm run dev -- --debug
```

---

## Check AddProductPage Imports

Verify each import path resolves:

```bash
# Check if resolved paths exist:
Test-Path "src/components/ui/button.tsx"      # Should be ✅
Test-Path "src/hooks/use-toast.ts"             # Should be ✅
Test-Path "src/contexts/LanguageContext.tsx"   # Should be ✅
```

---

## Git Status Check

```bash
# See if any unexpected files were changed
git status

# See diff of AddProductPage.tsx
git diff src/pages/AddProductPage.tsx
```

---

## Run Production Build

```bash
# Try building for production
npm run build

# If build succeeds but dev fails, it's a dev server issue
# If build fails, it will show the actual error
```

---

## Nuclear Reset

```bash
# Start completely fresh
Remove-Item -Recurse -Force node_modules dist .vite
Remove-Item pnpm-lock.yaml

# Reinstall
pnpm install

# Verify no build errors
npm run build

# Start dev server
npm run dev
```

---

## Exact Steps to Take Now

1. **Stop dev server** (Ctrl+C)
2. **Run**: `Remove-Item -Recurse -Force node_modules\.vite`
3. **Start dev**: `npm run dev -- --force`
4. **Try accessing page**
5. **If still 500**, check browser DevTools Network tab Response


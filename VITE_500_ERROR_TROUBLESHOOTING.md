# Vite 500 Error - Troubleshooting Guide

**Error**: `AddProductPage.tsx:1   Failed to load resource: the server responded with a status of 500 (Internal Server Error)`

---

## Quick Fixes (Try In Order)

### Fix 1: Clear Cache & Restart Dev Server ⚡

```bash
# 1. Stop dev server (Ctrl+C in terminal)

# 2. Clear Vite cache
rm -r node_modules/.vite

# 3. Clear browser cache
# In browser: Ctrl+Shift+Del (or Cmd+Shift+Del on Mac)
# Select "Cookies and other site data"
# Clear all

# 4. Hard refresh browser
# Ctrl+Shift+R (or Cmd+Shift+R on Mac)

# 5. Restart dev server
npm run dev
```

---

### Fix 2: Rebuild Dependencies

```bash
# 1. Delete lock file and node_modules
rm -r node_modules pnpm-lock.yaml

# 2. Reinstall
pnpm install

# 3. Start dev server
npm run dev
```

---

### Fix 3: Check for Syntax Errors

```bash
# Run ESLint
npm run lint

# If errors found, check the output and fix them
```

---

### Fix 4: Verify Port Availability

```bash
# Check if port 5173 is in use (default Vite port)
netstat -ano | findstr :5173

# If in use, either:
# - Kill the process: taskkill /PID <PID> /F
# - Or change port in vite.config.ts
```

---

### Fix 5: Restart VS Code

```bash
# 1. Close VS Code completely
# 2. Close any running dev servers
# 3. Reopen the workspace
# 4. Run: npm run dev
```

---

## Advanced Troubleshooting

### Check Vite Config

**File**: `vite.config.ts`

Ensure it has:
```typescript
import react from '@vitejs/plugin-react'
import path from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

---

### Check tsconfig.json

**File**: `tsconfig.json`

Ensure it has:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "jsx": "react-jsx",
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

---

### Check for Circular Imports

Look for circular import chains:
- A imports B
- B imports A

**Common in:**
- Hooks importing components
- Components importing hooks
- Contexts importing from pages

**Fix**: Use lazy loading or move shared code to utils

---

### Browser Console Diagnostics

1. Open DevTools (F12)
2. Go to **Network** tab
3. Refresh page
4. Look for failed requests (red)
5. Click on the failed request
6. Check **Response** tab for error message

---

## Vite Dev Server Log Analysis

When running `npm run dev`, look for:

### ✅ Good Signs
```
  VITE v5.4.19  ready in 234 ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

### ❌ Bad Signs
```
[ERR_MODULE_NOT_FOUND] Cannot find module '@/...'
[ERR_UNKNOWN_FILE_EXTENSION] Unknown file extension
Uncaught SyntaxError: Unexpected token
```

---

## Common 500 Error Causes

| Cause | Solution |
|-------|----------|
| Missing dependency | Run `pnpm install` |
| Corrupted cache | Delete `node_modules/.vite` |
| Port in use | Kill process or change port |
| Syntax error | Run `npm run lint` |
| Import path wrong | Check `@/` paths resolve correctly |
| TypeScript error | Check terminal for `tsc` errors |
| React version mismatch | Check `package.json` versions |

---

## Final Nuclear Option

If nothing works, do a complete clean:

```bash
# 1. Remove everything
rm -r node_modules .next dist out *.log

# 2. Delete lock file
rm pnpm-lock.yaml

# 3. Reinstall from scratch
pnpm install

# 4. Build to check for errors
npm run build

# 5. If build succeeds, start dev
npm run dev
```

---

## Still Getting 500?

If you've tried all above steps, check:

1. **Is `/src/pages/AddProductPage.tsx` file valid?**
   - Open file directly in VS Code
   - Should have no red squiggles
   - Check file has proper imports

2. **Are imports resolvable?**
   - Check `@/components/ui/button` exists
   - Check `@/hooks/use-toast` exists
   - Check `@/integrations/supabase/client` exists

3. **Check Supabase Client**
   - File: `src/integrations/supabase/client.ts`
   - Should export `supabase` client
   - Should have valid VITE_SUPABASE_URL

4. **Environment Variables**
   - Check `.env` file exists
   - Has `VITE_SUPABASE_URL`
   - Has `VITE_SUPABASE_PUBLISHABLE_KEY`

---

## Terminal Commands Reference

```bash
# Clear everything
pnpm store prune
rm -r node_modules

# Check Node version
node --version

# Check pnpm version
pnpm --version

# List ports in use
netstat -ano

# Kill process on port 5173
taskkill /PID <PID> /F
```

---

## Support

If error persists:

1. Screenshot the error in browser console
2. Screenshot the terminal output from `npm run dev`
3. Run and share: `npm run lint`
4. Run and share: `npm run build`


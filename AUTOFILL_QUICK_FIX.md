# 🚨 QUICK FIX: AUTOFILL ERROR

## The Problem
```
Error: "Failed to send a request to the Edge Function"
```
When clicking the autofill button on Add Product page.

## The Root Cause
Your OpenAI API key is NOT configured in Supabase secrets.

## Quick Fix (2 minutes)

### 1️⃣ Get API Key
- Go to: https://platform.openai.com/api/keys
- Click: "Create new secret key"
- Copy it (looks like `sk-proj-...`)

### 2️⃣ Add to Supabase
- Go to: https://supabase.com → Your Project
- Go to: **Settings → Secrets**
- Click: **"Add new secret"**
- Name: `OPENAI_API_KEY`
- Value: Paste your key
- Click: **"Create secret"**

### 3️⃣ Deploy
- Go to: **Functions → generate_product_from_image**
- Click: **"Deploy"**
- Wait for green checkmark

## ✅ Test It
1. Go to: `http://localhost:3081/seller/add-product`
2. Upload an image
3. Click: **"Autofill from images"**
4. Should work now! ✅

---

## 💡 What It Does
- Analyzes your product image using AI
- Generates catchy product name
- Creates detailed description
- Works in English AND Arabic
- All automatically!

---

**Done!** 🎉 Your autofill feature is ready to go!

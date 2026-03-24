# 🔐 Salesforce Authentication Guide

Your Adhi Assistant supports **TWO authentication methods** to connect to Salesforce.

---

## 🎯 **Authentication Methods Overview**

| Method | Best For | Requires CLI | Session Expires | Setup Difficulty |
|--------|----------|--------------|-----------------|------------------|
| **SF CLI** | Development | ✅ Yes | Never (auto-refreshed) | Easy |
| **Username/Password** | Production | ❌ No | On session timeout | Medium |

---

## 📋 **METHOD 1: SF CLI Authentication (Current Setup)**

### **✅ Advantages:**
- Easy setup for development
- Auto-refreshes tokens
- No need to manage security tokens
- Works with scratch orgs

### **❌ Disadvantages:**
- Requires SF CLI installed on server
- Not ideal for production deployment

### **Setup Steps:**

1. **Already Done!** You authenticated using:
   ```bash
   sf org login web --alias myverbis
   ```

2. **Your backend/.env file:**
   ```env
   SF_USE_PASSWORD_AUTH=false
   SF_ORG_ALIAS=myverbis
   ```

3. **That's it!** Backend automatically uses SF CLI tokens.

---

## 🔑 **METHOD 2: Username/Password Authentication**

### **✅ Advantages:**
- No SF CLI needed
- Works on any server
- Better for production deployment
- Can use with any org type

### **❌ Disadvantages:**
- Requires security token (if not using trusted IP)
- Need to reset token if IP changes
- Tokens can expire

### **Setup Steps:**

#### **Step 1: Get Your Security Token**

1. Login to your Salesforce org
2. Go to **Setup** → Search "Reset My Security Token"
3. Click **"My Personal Information"** → **"Reset My Security Token"**
4. Click **"Reset Security Token"**
5. Check your email - Salesforce will send you a new security token

#### **Step 2: Update Your .env File**

Edit `/Users/home/Desktop/salesforce-admin-app/backend/.env`:

```env
# ENABLE PASSWORD AUTHENTICATION
SF_USE_PASSWORD_AUTH=true

# YOUR CREDENTIALS
SF_USERNAME=test-kildedmurv0h@example.com
SF_PASSWORD=YourActualPassword123
SF_SECURITY_TOKEN=AbC123XyZ789Token

# LOGIN URL (choose based on org type)
# For Scratch Orgs / Developer / Production:
SF_LOGIN_URL=https://login.salesforce.com

# For Sandbox orgs:
# SF_LOGIN_URL=https://test.salesforce.com
```

#### **Step 3: Restart Backend**

```bash
cd /Users/home/Desktop/salesforce-admin-app/backend
node server-improved.js
```

You should see:
```
🔐 Authenticating with Salesforce using Username/Password...
✅ Connected to Salesforce org: test-kildedmurv0h@example.com
   Instance: https://xxxxx.my.salesforce.com
   User ID: 005xxxxxxxxxxxxx
```

---

## 🛡️ **Security Token Information**

### **What is a Security Token?**
A security token is an automatically generated key that you must add to the end of your password when logging in via the API.

### **When is it Required?**
- When connecting from **untrusted IP addresses**
- Most external servers (cloud hosting, etc.)

### **When is it NOT Required?**
- When your IP is in **Trusted IP Ranges** (Setup → Network Access)
- When using **OAuth 2.0** flows

### **Password + Token Format:**
If your password is `MyPass123` and token is `AbC789XyZ`, you login with:
```
Password: MyPass123AbC789XyZ
```

jsforce handles this automatically when you provide them separately in the .env file.

---

## 🔄 **How the Backend Handles Authentication**

### **Flow Diagram:**

```
Backend Starts
     ↓
Check SF_USE_PASSWORD_AUTH
     ↓
┌────────────────────────┐
│ FALSE (SF CLI)         │ TRUE (Username/Password)
↓                        ↓
initializeWithCLI()      initializeWithPassword()
↓                        ↓
sf org display           jsforce.login()
↓                        ↓
Get accessToken          Username + Password + Token
↓                        ↓
jsforce.Connection       Get accessToken from response
     ↓                        ↓
     └───────────┬────────────┘
                 ↓
         Connected to Salesforce!
```

---

## 📝 **Example Configurations**

### **Development (Local Machine with SF CLI):**
```env
SF_USE_PASSWORD_AUTH=false
SF_ORG_ALIAS=myverbis
```

### **Production Server (No SF CLI):**
```env
SF_USE_PASSWORD_AUTH=true
SF_USERNAME=admin@mycompany.com
SF_PASSWORD=SecurePass123
SF_SECURITY_TOKEN=AbC789XyZ123
SF_LOGIN_URL=https://login.salesforce.com
```

### **Sandbox Testing:**
```env
SF_USE_PASSWORD_AUTH=true
SF_USERNAME=admin@mycompany.com.sandbox
SF_PASSWORD=SecurePass123
SF_SECURITY_TOKEN=AbC789XyZ123
SF_LOGIN_URL=https://test.salesforce.com
```

---

## 🚀 **Switching Between Methods**

Just change one line in `.env` and restart backend:

```bash
# Switch to Password Auth
SF_USE_PASSWORD_AUTH=true

# Restart
cd backend && node server-improved.js
```

```bash
# Switch back to CLI Auth
SF_USE_PASSWORD_AUTH=false

# Restart
cd backend && node server-improved.js
```

---

## 🆘 **Troubleshooting**

### **Error: "INVALID_LOGIN: Invalid username, password, security token"**
✅ **Solution:**
1. Double-check username (case-sensitive)
2. Verify password is correct
3. Make sure security token is appended (or reset and get new one)
4. Check if you're using correct login URL (login.salesforce.com vs test.salesforce.com)

### **Error: "Session expired or invalid"**
✅ **Solution:**
- Password auth: Restart backend to get new session
- CLI auth: Run `sf org login web --alias myverbis` again

### **Error: "SF_USERNAME and SF_PASSWORD must be set"**
✅ **Solution:**
1. Make sure `.env` file exists in backend folder
2. Verify variables are set correctly
3. Restart backend after editing `.env`

---

## 💡 **Recommendations**

| Environment | Recommended Method |
|-------------|-------------------|
| **Local Development** | SF CLI (easier) |
| **Production Server** | Username/Password (no CLI needed) |
| **CI/CD Pipeline** | Username/Password or OAuth 2.0 |
| **Sharing with Team** | Username/Password (everyone can use same creds) |

---

## 🔒 **Security Best Practices**

1. **Never commit .env to git** (already in .gitignore)
2. **Use strong passwords** for production
3. **Rotate security tokens** regularly
4. **Use dedicated integration user** for production
5. **Restrict IP ranges** if possible
6. **Monitor login history** in Salesforce Setup

---

## 📞 **Need Help?**

The backend automatically logs which method it's using:

```bash
# CLI Method:
🔐 Authenticating with Salesforce org via CLI: myverbis

# Password Method:
🔐 Authenticating with Salesforce using Username/Password...
```

Check the backend console to see which method is active and any error messages.

---

**Your current setup uses SF CLI (Method 1) and it's working perfectly! You can switch to Method 2 anytime by following the steps above.** ✅


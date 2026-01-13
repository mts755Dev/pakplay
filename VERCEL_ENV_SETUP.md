# Vercel Environment Variables Setup

## Required Environment Variables

To deploy this Next.js app on Vercel, you need to configure the following environment variables:

### 1. Go to Vercel Dashboard
1. Open your project in Vercel
2. Go to **Settings** → **Environment Variables**

### 2. Add These Variables

#### Supabase Configuration (Required)
```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

#### Turnstile Configuration (Optional)
```
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your_turnstile_site_key
```

#### Domain Configuration (Optional)
```
NEXT_PUBLIC_DOMAIN=pakplay.co
```

### 3. Set Environment Scope
For each variable, select:
- ✅ **Production**
- ✅ **Preview**
- ✅ **Development**

### 4. Redeploy
After adding the variables:
1. Go to **Deployments** tab
2. Click on the latest deployment
3. Click **Redeploy** button

## Finding Your Supabase Keys

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

## Troubleshooting

### Error: "Application error: a client-side exception has occurred"
- **Cause**: Missing environment variables
- **Solution**: Ensure all required env vars are set in Vercel and redeploy

### Error: "500: INTERNAL_SERVER_ERROR"
- **Cause**: Server-side error, usually missing `SUPABASE_SERVICE_ROLE_KEY`
- **Solution**: Add the service role key and redeploy

## Security Notes

⚠️ **Never commit `.env` files to Git**
- The `.env.local` file is in `.gitignore`
- Only set production keys in Vercel dashboard
- Use different keys for development and production

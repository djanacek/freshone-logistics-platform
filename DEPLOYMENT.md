# FreshOne Logistics Automation - Deployment Guide

## Environment Variables Setup

### Required Environment Variables

Create a `.env` file in the root directory with the following variables:

```bash
# Samsara API Configuration
VITE_SAMSARA_API_TOKEN=samsara_api_your_token_here
VITE_SAMSARA_ORG_ID=1288

# NextBillion.ai API Configuration  
VITE_NEXTBILLION_API_KEY=your_nextbillion_api_key_here

# Supabase Database Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Application Configuration
VITE_APP_ENV=production
VITE_APP_NAME=FreshOne Logistics Automation
```

### Vercel Deployment

1. **Add Environment Variables in Vercel Dashboard:**
   - Go to your Vercel project dashboard
   - Navigate to Settings → Environment Variables
   - Add each variable from the list above
   - Set the environment to "Production" and "Preview"

2. **Security Best Practices:**
   - Never commit `.env` files to version control
   - Use different API keys for development and production
   - Rotate API keys regularly
   - Enable Vercel's environment variable encryption

### Supabase Setup

1. **Create Supabase Project:**
   - Go to https://supabase.com
   - Create a new project
   - Note your project URL and anon key

2. **Create Database Table:**
   ```sql
   CREATE TABLE customer_addresses (
     id SERIAL PRIMARY KEY,
     customer_name TEXT NOT NULL,
     full_address TEXT,
     city TEXT NOT NULL,
     state TEXT NOT NULL,
     zip_code TEXT,
     phone TEXT,
     special_instructions TEXT,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```

3. **Set Row Level Security (RLS):**
   ```sql
   ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;
   ```

### API Configuration

#### Samsara API
- Get your API token from Samsara dashboard
- Ensure the token has appropriate permissions for route management
- Test the connection using the "Test Samsara" button

#### NextBillion.ai API
- Sign up at https://nextbillion.ai
- Generate your API key
- Test route optimization features

## Security Checklist

- [ ] All API tokens are stored in environment variables
- [ ] No hardcoded credentials in source code
- [ ] Supabase credentials are properly configured
- [ ] Test mode is disabled for production
- [ ] Environment variables are encrypted in deployment platform
- [ ] API keys have minimal required permissions
- [ ] Regular security audits are scheduled

## Production Deployment

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Deploy to Vercel:**
   ```bash
   vercel --prod
   ```

3. **Verify deployment:**
   - Test all API connections
   - Verify Supabase database connectivity
   - Check that no credentials are exposed in the UI
   - Confirm test mode is disabled

## Troubleshooting

### Common Issues

1. **Environment variables not loading:**
   - Ensure all variables start with `VITE_`
   - Restart the development server after adding variables
   - Check Vercel dashboard for correct variable names

2. **Supabase connection issues:**
   - Verify URL and anon key are correct
   - Check if RLS policies are properly configured
   - Ensure the `customer_addresses` table exists

3. **API token errors:**
   - Verify tokens are valid and not expired
   - Check API permissions and rate limits
   - Test tokens individually using the test buttons

### Support

For technical support, contact the development team with:
- Error messages
- Environment configuration
- Steps to reproduce issues 
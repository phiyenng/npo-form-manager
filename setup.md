# Quick Setup Guide

## Step 1: Supabase Setup

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Click "New Project"
   - Choose organization and enter project details
   - Wait for project to be ready (2-3 minutes)

2. **Get Project Credentials**
   - Go to Settings → API
   - Copy "Project URL" and "anon public" key
   - Copy "service_role" key (for admin operations)

3. **Setup Database**
   - Go to SQL Editor in Supabase dashboard
   - Copy and paste the contents of `supabase-schema.sql`
   - Click "Run" to create tables and policies

## Step 2: Environment Configuration

1. **Create Environment File**
   ```bash
   # In the project root, create .env.local
   NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

2. **Replace Placeholder Values**
   - Replace `your_project_url_here` with your actual Supabase URL
   - Replace `your_anon_key_here` with your anon key
   - Replace `your_service_role_key_here` with your service role key

## Step 3: Run the Application

```bash
# Install dependencies (if not already done)
npm install

# Start development server
npm run dev
```

## Step 4: Test the Application

1. **Open Browser**
   - Go to http://localhost:3000
   - You should see the landing page

2. **Test User Form**
   - Click "Submit Form"
   - Fill out the form and submit
   - Check Supabase dashboard to see the data

3. **Test Admin Dashboard**
   - Go back to home page
   - Click "Admin Dashboard"
   - Login with: username `admin`, password `admin123`
   - View submitted forms and test status updates

## Troubleshooting

**Build Errors:**
- Make sure all environment variables are set correctly
- Check that Supabase project is active and accessible

**Database Errors:**
- Verify the SQL schema was executed successfully
- Check Row Level Security policies are enabled

**File Upload Issues:**
- Ensure storage bucket `form-attachments` exists
- Check storage policies allow public access

**Authentication Issues:**
- For production, replace simple admin auth with proper authentication
- Consider using Supabase Auth or NextAuth.js

## Production Deployment

1. **Environment Variables**
   - Add all environment variables to your hosting platform
   - Never commit `.env.local` to version control

2. **Security Enhancements**
   - Implement proper authentication
   - Add input validation and sanitization
   - Configure proper RLS policies
   - Add rate limiting

3. **Performance Optimization**
   - Enable caching where appropriate
   - Optimize images and assets
   - Consider CDN for static assets

## Need Help?

- Check the main README.md for detailed documentation
- Refer to [Next.js docs](https://nextjs.org/docs)
- Check [Supabase docs](https://supabase.com/docs)
- Review the code comments for implementation details

# Tool Tracker Deployment Guide

This guide provides step-by-step instructions for deploying the Tool Tracker Demo to production using Supabase as the database and Vercel for hosting.

## Prerequisites

Before starting the deployment process, ensure you have:

- A [Supabase](https://supabase.com) account
- A [Vercel](https://vercel.com) account
- A GitHub account with your code repository
- Node.js 18+ installed locally for testing

## Part 1: Supabase Database Setup

### 1.1 Create a New Supabase Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Fill in the project details:
   - **Name**: `tool-tracker-production` (or your preferred name)
   - **Database Password**: Generate a strong password and save it securely
   - **Region**: Choose the region closest to your users
4. Click "Create new project"
5. Wait for the project to be provisioned (2-3 minutes)

### 1.2 Configure Database Schema

1. In your Supabase dashboard, navigate to the **SQL Editor**
2. Click "New Query"
3. Copy the entire contents of your local `supabase/schema.sql` file
4. Paste the SQL into the editor
5. Click "Run" to execute the schema creation

The schema will create:
- `jobs` table for job management
- `tools` table for tool inventory
- `job_to_tool` table for assignment tracking
- Indexes for optimal performance
- Database views for common queries
- Triggers for automatic timestamp updates

### 1.3 Verify Database Setup

1. Navigate to **Table Editor** in Supabase dashboard
2. Verify these tables exist:
   - `jobs`
   - `tools`
   - `job_to_tool`
3. Check the **Database** → **Views** section for:
   - `currently_assigned_tools`
   - `missing_tools`
   - `available_tools`

### 1.4 Configure Row Level Security (RLS)

For production deployment, configure RLS policies:

1. Go to **Authentication** → **Policies**
2. For each table (`jobs`, `tools`, `job_to_tool`), create policies:

```sql
-- Enable RLS on all tables
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_to_tool ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust based on your needs)
CREATE POLICY "Enable read access for all users" ON jobs FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON jobs FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON jobs FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON tools FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON tools FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON tools FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON job_to_tool FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON job_to_tool FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON job_to_tool FOR UPDATE USING (true);
```

### 1.5 Get Connection Details

1. Navigate to **Settings** → **API**
2. Save these values for later:
   - **Project URL** (starts with `https://`)
   - **Project API Keys** → **anon** **public** key
   - **Project API Keys** → **service_role** **secret** key (for admin operations)

## Part 2: Vercel Deployment

### 2.1 Prepare Your Repository

1. Ensure your code is pushed to a GitHub repository
2. Verify your project structure includes:
   - `package.json` with proper metadata
   - `next.config.ts` for Next.js configuration
   - All source code in the `src/` directory
   - `supabase/schema.sql` for reference

### 2.2 Deploy to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `.` (leave empty if repository root)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `npm install` (default)

### 2.3 Configure Environment Variables

In the Vercel project settings, add these environment variables:

**Required Variables:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_from_supabase
```

**Optional Variables:**
```env
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_for_admin_operations
```

### 2.4 Deploy

1. Click "Deploy"
2. Wait for the build to complete (2-5 minutes)
3. Verify the deployment at your Vercel URL

## Part 3: Post-Deployment Configuration

### 3.1 Update Supabase CORS Settings

1. In Supabase Dashboard, go to **Settings** → **API**
2. Add your Vercel domain to **CORS origins**:
   - `https://your-app.vercel.app`
   - `https://*.vercel.app` (for preview deployments)

### 3.2 Test Core Functionality

Visit your deployed application and test:

1. **Dashboard loads** - Homepage displays without errors
2. **Database connection** - Tables and data load properly
3. **Scanning modes** - All three modes function correctly
4. **Search functionality** - Queries return expected results

### 3.3 Add Sample Data (Optional)

For demonstration purposes, you can add sample data through the Supabase dashboard:

**Sample Jobs:**
```sql
INSERT INTO jobs (company, start_date, end_date, finished) VALUES
('ABC Construction', '2024-01-15', '2024-01-20', true),
('XYZ Builders', '2024-02-01', NULL, false),
('Home Renovation Co', '2024-01-25', '2024-02-05', true);
```

**Sample Tools:**
```sql
INSERT INTO tools (tin, tool_type, date_added) VALUES
('TIN001', 'drill', '2024-01-01'),
('TIN002', 'circular_saw', '2024-01-01'),
('TIN003', 'hammer', '2024-01-02'),
('TIN004', 'tape_measure', '2024-01-02'),
('TIN005', 'level', '2024-01-03');
```

## Part 4: Custom Domain Setup (Optional)

### 4.1 Configure Custom Domain in Vercel

1. In Vercel project settings, go to **Domains**
2. Add your custom domain
3. Configure DNS records as instructed by Vercel

### 4.2 Update Environment Variables

Update the `NEXT_PUBLIC_APP_URL` environment variable to match your custom domain.

### 4.3 Update Supabase CORS

Add your custom domain to Supabase CORS settings.

## Part 5: Monitoring and Maintenance

### 5.1 Set Up Monitoring

**Vercel Analytics:**
1. Enable Vercel Analytics in your project settings
2. Monitor performance and usage

**Supabase Monitoring:**
1. Monitor database performance in Supabase Dashboard
2. Set up alerts for high usage or errors

### 5.2 Backup Strategy

**Database Backups:**
1. Supabase automatically creates daily backups
2. Consider setting up additional backup procedures for critical data

**Code Backups:**
1. Ensure your GitHub repository is properly backed up
2. Tag releases for easy rollbacks

### 5.3 Security Considerations

**Environment Variables:**
- Never commit sensitive keys to your repository
- Rotate API keys periodically
- Use service role key only for admin operations

**Database Security:**
- Review and adjust RLS policies as needed
- Monitor access logs regularly
- Consider implementing user authentication for production use

## Troubleshooting

### Common Deployment Issues

**Build Failures:**
- Check Node.js version compatibility
- Verify all dependencies are in package.json
- Review build logs for specific error messages

**Database Connection Issues:**
- Verify Supabase URL and API key are correct
- Check CORS settings include your domain
- Ensure database schema was applied correctly

**Runtime Errors:**
- Check browser console for client-side errors
- Review Vercel function logs for server-side issues
- Verify environment variables are set correctly

### Performance Optimization

**Database Performance:**
- Monitor query performance in Supabase
- Add indexes for frequently queried fields
- Consider connection pooling for high traffic

**Frontend Performance:**
- Enable Vercel Analytics
- Optimize images and assets
- Implement proper caching strategies

## Support

For deployment issues:
1. Check Vercel and Supabase documentation
2. Review GitHub Issues in the project repository
3. Contact support teams for platform-specific issues

## Security Checklist

Before going to production:

- [ ] RLS policies are configured and tested
- [ ] Environment variables are secure and not exposed
- [ ] API keys have appropriate permissions
- [ ] CORS settings are properly configured
- [ ] Database backup strategy is in place
- [ ] Monitoring and alerting are configured
- [ ] SSL/HTTPS is enabled (automatic with Vercel)
- [ ] Dependencies are up to date and secure

---

This deployment guide ensures your Tool Tracker Demo is properly configured for production use with enterprise-grade security and performance.
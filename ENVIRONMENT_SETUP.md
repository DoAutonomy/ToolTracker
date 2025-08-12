# Environment Setup Guide

This guide will help you configure your development environment for the Tool Tracker Demo application.

## Prerequisites

Before setting up the project, ensure you have:

- **Node.js 18+** installed ([Download here](https://nodejs.org/))
- **Git** installed for version control
- A **Supabase account** ([Sign up here](https://supabase.com))
- A code editor (VS Code recommended)

## Quick Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd tool-tracker
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env.local
```

### 4. Configure Supabase

1. Create a new project in [Supabase Dashboard](https://supabase.com/dashboard)
2. Go to **Settings** → **API**
3. Copy your project URL and anon key
4. Update `.env.local` with your values

### 5. Setup Database

1. In Supabase Dashboard, go to **SQL Editor**
2. Create a new query
3. Copy and paste the contents of `supabase/schema.sql`
4. Run the query to create all tables and views

### 6. Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## Environment Variables Explained

### Required Variables

#### `NEXT_PUBLIC_SUPABASE_URL`
- **Description**: Your Supabase project URL
- **Format**: `https://your-project-id.supabase.co`
- **Where to find**: Supabase Dashboard → Settings → API → Project URL

#### `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Description**: Public API key for client-side operations
- **Format**: Long JWT token starting with `eyJ`
- **Where to find**: Supabase Dashboard → Settings → API → Project API Keys → anon public

#### `NEXT_PUBLIC_APP_URL`
- **Description**: Your application's URL
- **Development**: `http://localhost:3000`
- **Production**: `https://your-domain.com`

### Optional Variables

#### `SUPABASE_SERVICE_ROLE_KEY`
- **Description**: Secret key for server-side admin operations
- **When needed**: Advanced server-side operations, bulk data imports
- **Security**: Keep this secret, never expose in client-side code
- **Where to find**: Supabase Dashboard → Settings → API → Project API Keys → service_role secret

#### `DATABASE_URL`
- **Description**: Direct PostgreSQL connection string
- **When needed**: Direct database operations, migrations
- **Format**: `postgresql://postgres:[password]@db.[project-id].supabase.co:5432/postgres`
- **Where to find**: Supabase Dashboard → Settings → Database → Connection string

## Development Environment Setup

### Recommended VS Code Extensions

Install these extensions for the best development experience:

```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-json"
  ]
}
```

### VS Code Settings

Create `.vscode/settings.json` in your project root:

```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "tailwindCSS.experimental.classRegex": [
    ["clsx\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"],
    ["className:\\s*?[\"'`]([^\"'`]*).*?[\"'`]", "([^\"'`]*)"]
  ]
}
```

### Prettier Configuration

The project includes Prettier configuration. Create `.prettierrc` if needed:

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "tabWidth": 2,
  "useTabs": false
}
```

## Database Configuration

### Schema Overview

The application uses three main tables:

- **`jobs`**: Project/job information
- **`tools`**: Tool inventory
- **`job_to_tool`**: Assignment tracking (many-to-many relationship)

### Database Views

Pre-configured views for common queries:

- **`currently_assigned_tools`**: Tools currently out on jobs
- **`missing_tools`**: Tools not returned from finished jobs  
- **`available_tools`**: Tools available for assignment

### Indexes

Performance-optimized indexes are automatically created:

- `idx_job_to_tool_job_id` - Fast job lookups
- `idx_job_to_tool_tool_id` - Fast tool lookups
- `idx_tools_tin` - Fast barcode searches
- `idx_jobs_company` - Company filtering
- `idx_jobs_finished` - Status filtering

## Local Development Tips

### Testing Database Changes

1. Make changes to `supabase/schema.sql`
2. Test in Supabase Dashboard SQL Editor
3. Apply to your development database
4. Verify changes don't break existing functionality

### Adding Sample Data

For testing, add sample data through Supabase Dashboard:

```sql
-- Sample jobs
INSERT INTO jobs (company, start_date, finished) VALUES
('Test Company', '2024-01-15', false),
('Demo Corp', '2024-01-20', true);

-- Sample tools
INSERT INTO tools (tin, tool_type) VALUES
('TEST001', 'drill'),
('TEST002', 'hammer'),
('TEST003', 'saw');
```

### Environment Switching

For multiple environments (dev, staging, prod), use different `.env` files:

- `.env.local` - Local development
- `.env.staging` - Staging environment  
- `.env.production` - Production environment

Switch by renaming or using environment-specific scripts in `package.json`.

## Troubleshooting

### Common Setup Issues

#### "Cannot connect to Supabase"
- Verify your `NEXT_PUBLIC_SUPABASE_URL` is correct
- Check that your Supabase project is active
- Ensure your API key has the correct permissions

#### "Table does not exist" errors
- Run the schema creation SQL in Supabase Dashboard
- Verify all tables were created successfully
- Check for any SQL errors in the creation process

#### "Module not found" errors
- Run `npm install` to ensure all dependencies are installed
- Delete `node_modules` and `package-lock.json`, then reinstall
- Check that you're using Node.js 18+

#### Build errors
- Ensure all environment variables are properly set
- Check TypeScript errors with `npm run type-check`
- Verify all imports and file paths are correct

### Performance Issues

#### Slow database queries
- Check that indexes are created (run schema.sql)
- Monitor query performance in Supabase Dashboard
- Consider adding additional indexes for your specific use case

#### Slow page loads
- Enable Next.js development optimizations
- Check network tab for slow API requests
- Verify Supabase connection is optimal

## Security Considerations

### Development Security

- Never commit `.env.local` to version control
- Use different API keys for development vs production
- Regularly rotate your API keys
- Enable Row Level Security (RLS) policies in production

### Production Security Checklist

- [ ] RLS policies are configured
- [ ] Service role key is not exposed client-side
- [ ] CORS settings are properly configured
- [ ] Environment variables are secure
- [ ] Database backups are enabled
- [ ] SSL/HTTPS is enforced

## Getting Help

If you encounter issues during setup:

1. Check this guide first
2. Review the main README.md
3. Check Supabase documentation
4. Create an issue in the project repository
5. Check the troubleshooting section above

## Next Steps

After completing the environment setup:

1. **Explore the Application**: Visit each page and understand the workflow
2. **Test Scanning Modes**: Try all three scanning modes with sample data
3. **Review API Endpoints**: Check `/api` routes and their responses
4. **Customize**: Modify tool types, add features, or adjust styling
5. **Deploy**: Follow the DEPLOYMENT.md guide when ready for production

---

Your development environment is now ready for Tool Tracker development!
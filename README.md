# NPO Form Manager

A beautiful, minimalist web application for managing forms with user submissions and admin dashboard. Built with Next.js, Tailwind CSS, and Supabase.

## Features

### For Users
- **Simple Landing Page**: Choose between user form submission or admin access
- **Comprehensive Form**: Submit forms with all required fields including:
  - Operator selection (auto-fills country)
  - Issue details and descriptions
  - File attachments
  - Priority levels
  - Time tracking
  - And more...

### For Admins
- **Secure Login**: Simple authentication system
- **Dashboard**: View all form submissions in a clean table
- **Status Management**: Update form status (Inprocess/Closed)
- **Excel Export**: Export all data to Excel file
- **Detailed View**: View complete form details in modal

## Tech Stack

- **Frontend**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Simple admin login (can be enhanced)
- **File Storage**: Supabase Storage
- **Form Handling**: React Hook Form with Zod validation
- **Icons**: Lucide React
- **Excel Export**: XLSX library

## Quick Start

### 1. Prerequisites
- Node.js 18+ installed
- A Supabase account (free tier works)

### 2. Setup Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Once your project is ready, go to Settings > API
3. Copy your project URL and anon key
4. Go to SQL Editor and run the schema from `supabase-schema.sql`

### 3. Environment Setup

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 4. Install and Run

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### For Regular Users
1. Visit the homepage
2. Click "Submit Form"
3. Fill out all required fields
4. Upload file if needed
5. Submit the form

### For Admins
1. Visit the homepage
2. Click "Admin Dashboard"
3. Login with credentials:
   - Username: `admin`
   - Password: `admin123`
4. View, manage, and export form data

## Database Schema

The application uses a single `forms` table with the following structure:

```sql
- id (UUID, Primary Key)
- operator (Text, Required)
- country (Text, Auto-filled)
- issue (Text, Required)
- issue_description (Text, Required)
- kpis_affected (Text, Required)
- counter_evaluation (Text, Required)
- optimization_actions (Text, Required)
- file_url (Text, Optional)
- priority (Text, Required: High/Medium/Low)
- service_impacted (Boolean, Required)
- start_time (Timestamp, Required)
- end_time (Timestamp, Required)
- creator (Text, Required)
- status (Text, Default: 'Inprocess')
- created_at (Timestamp, Auto-generated)
```

## Customization

### Operator-Country Mapping
Edit the `operatorCountryMap` in `/src/app/form/page.tsx`:

```typescript
const operatorCountryMap: Record<string, string> = {
  'a': '1',
  'b': '2', 
  'c': '3',
  'd': '4'
}
```

### Admin Credentials
For production, replace the simple authentication in `/src/app/admin/page.tsx` with proper authentication system.

### Styling
The app uses Tailwind CSS. Modify classes in components or extend the theme in `tailwind.config.js`.

## File Structure

```
npo-form-manager/
├── src/
│   ├── app/
│   │   ├── admin/
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx      # Admin dashboard
│   │   │   └── page.tsx          # Admin login
│   │   ├── form/
│   │   │   └── page.tsx          # User form
│   │   ├── globals.css           # Global styles
│   │   ├── layout.tsx            # Root layout
│   │   └── page.tsx              # Landing page
│   └── lib/
│       └── supabase.ts           # Supabase client
├── supabase-schema.sql           # Database schema
├── package.json
└── README.md
```

## Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Other Platforms
The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- Heroku
- AWS Amplify

## Security Notes

⚠️ **Important for Production:**

1. **Admin Authentication**: Replace simple username/password with proper authentication (NextAuth.js, Supabase Auth, etc.)
2. **Environment Variables**: Never commit `.env.local` to version control
3. **Row Level Security**: Configure proper RLS policies in Supabase
4. **File Upload**: Add file type and size validation
5. **Input Validation**: Add server-side validation

## Support

This application is designed to be simple and easy to understand for non-technical users. The code is well-commented and follows best practices.

For questions or issues, refer to:
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## License

MIT License - feel free to use this project for your organization's needs.
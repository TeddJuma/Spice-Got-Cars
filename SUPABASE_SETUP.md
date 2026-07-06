# Supabase Setup Guide

## 1. Create a Supabase Project

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Click **New Project**
3. Fill in:
   - **Name**: `maclen-auto-hub`
   - **Database Password**: choose a strong one (save it safely)
   - **Region**: pick the closest (e.g. `af-south-1` for Nairobi)
4. Wait for provisioning (~2 minutes)

## 2. Run the Database Migration

1. In the Supabase dashboard, go to **SQL Editor**
2. Click **New query**
3. Open `supabase/migrations/20250705_create_listings.sql` from this project
4. Paste the entire SQL into the editor
5. Click **Run** (or press Ctrl+Enter)

This will create:
- `profiles` table
- `listings` table
- `listing_photos` table
- `storage` bucket named `car-photos`
- All Row Level Security (RLS) policies

## 3. Enable Email Auth

1. Go to **Authentication** > **Providers**
2. Make sure **Email** is enabled
3. Configure email templates if you want branded confirmation emails

## 4. Create the Storage Bucket (if not done by migration)

1. Go to **Storage**
2. Click **New bucket**
3. Name: `car-photos`
4. Toggle **Public bucket** ON
5. Set **File size limit** to `5 MB`
6. Allowed MIME types: `image/jpeg, image/png, image/webp`
7. Save

## 5. Get Your API Keys

1. Go to **Project Settings** > **API**
2. Copy these values:
   - **Project URL** (starts with `https://`)
   - **anon public** key

## 6. Configure Local Environment

1. Copy `.env.example` to `.env` in the project root:
   ```
   cp .env.example .env
   ```
2. Paste your Supabase URL and anon key into `.env`
3. Save

## 7. Create the First Owner Account

1. Start your dev server:
   ```
   npm run dev
   ```
2. Visit `http://localhost:5173/login`
3. Click **Sign up**
4. Enter your desired email and password (min 6 characters)
5. Check your email for the confirmation link
6. After confirming, sign in and you will be taken to `/admin`

## 8. Important Security Notes

- The Supabase RLS policies ensure only authenticated `owners` can create/update/delete listings or photos.
- Public users can only read listings and view photos.
- Never expose your `service_role` key in the frontend code - it is not needed since all sensitive operations are protected by RLS and client-side auth.
- If you need to restrict who can sign up, you can disable signups in **Authentication** > **Settings** and manually create owner accounts via the Supabase dashboard **Authentication** > **Users**.

## 9. Deploying

When deploying to production:
- Ensure your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` env vars are set in your hosting environment.
- The same Supabase backend can serve both development and production, or create a separate project for production.
- Photo uploads will go to the same `car-photos` storage bucket.

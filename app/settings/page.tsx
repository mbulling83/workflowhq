import { redirect } from 'next/navigation'

// Settings is now a slide-out panel on /app.
// Redirect unauthenticated users to sign-in; AuthGuard on /app handles the rest.
export default function SettingsRoute() {
  redirect('/auth/sign-in')
}

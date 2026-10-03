# Salem YMA Notifications

1. Run `supabase_notifications.sql` in Supabase SQL Editor.
2. The app registers Expo push tokens after a signed-in user grants notification permission.
3. News published from Admin creates a notification with `data.type = news`.
4. Deploy the included `supabase/functions/send-notification` Edge Function and set the Supabase service-role secret before expecting background phone push delivery.
5. On Web, allow browser notifications when prompted. The app shows new News notifications while the Salem YMA web app is open.

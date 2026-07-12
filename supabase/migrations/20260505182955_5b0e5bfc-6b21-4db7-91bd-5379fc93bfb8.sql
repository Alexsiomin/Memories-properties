-- Fix: prevent unauthenticated users from reading anonymous tour requests
DROP POLICY IF EXISTS "Users view own tour requests" ON public.tour_requests;

CREATE POLICY "Users view own tour requests"
ON public.tour_requests
FOR SELECT
TO authenticated
USING (auth.uid() = user_id AND user_id IS NOT NULL);

-- Fix: remove duplicate public read policy on property-images bucket
DROP POLICY IF EXISTS "Public read property-images" ON storage.objects;
CREATE POLICY "Users manage own avatars insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'property-images' AND (storage.foldername(name))[1] = 'avatars' AND (storage.foldername(name))[2] = auth.uid()::text);

CREATE POLICY "Users manage own avatars update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'property-images' AND (storage.foldername(name))[1] = 'avatars' AND (storage.foldername(name))[2] = auth.uid()::text);

CREATE POLICY "Users manage own avatars delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'property-images' AND (storage.foldername(name))[1] = 'avatars' AND (storage.foldername(name))[2] = auth.uid()::text);
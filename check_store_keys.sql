SELECT 
  id,
  name,
  slug,
  yoco_public_key,
  yoco_secret_key
FROM tenants
ORDER BY created_at DESC
LIMIT 5;

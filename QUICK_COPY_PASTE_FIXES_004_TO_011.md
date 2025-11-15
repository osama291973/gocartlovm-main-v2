# 🚀 QUICK COPY-PASTE GUIDE - Fixes #004-011

**Just copy each section and paste into Supabase. Report the result and I'll give you the next one!**

---

## FIX #004: ORDER ITEMS INSERT POLICY
```
Fix #004 - Copy below, paste to Supabase, run, report result:

CREATE POLICY "Users can insert their own order items" ON public.order_items FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL AND EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())); CREATE POLICY "Admins can insert any order items" ON public.order_items FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role)); SELECT policyname, cmd FROM pg_policies WHERE tablename = 'order_items' AND cmd = 'INSERT';
```

---

## FIX #005: PRODUCT VARIANTS POLICIES (4 policies)
```
Fix #005 - Copy below, paste to Supabase, run, report result:

CREATE POLICY "Sellers can update their product variants" ON public.product_variants FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL AND EXISTS (SELECT 1 FROM products p JOIN stores s ON s.id = p.store_id WHERE p.id = product_variants.product_id AND s.owner_id = auth.uid())) WITH CHECK (auth.uid() IS NOT NULL AND EXISTS (SELECT 1 FROM products p JOIN stores s ON s.id = p.store_id WHERE p.id = product_variants.product_id AND s.owner_id = auth.uid())); CREATE POLICY "Admins can update any product variants" ON public.product_variants FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role)) WITH CHECK (EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role)); CREATE POLICY "Sellers can insert their product variants" ON public.product_variants FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL AND EXISTS (SELECT 1 FROM products p JOIN stores s ON s.id = p.store_id WHERE p.id = product_variants.product_id AND s.owner_id = auth.uid())); CREATE POLICY "Admins can insert any product variants" ON public.product_variants FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role)); SELECT policyname, cmd FROM pg_policies WHERE tablename = 'product_variants';
```

---

## FIX #006: PRODUCT IMAGES POLICIES (5 policies)
```
Fix #006 - Copy below, paste to Supabase, run, report result:

CREATE POLICY "Everyone can view product images" ON public.product_images FOR SELECT TO public USING (true); CREATE POLICY "Sellers can insert product images for their products" ON public.product_images FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL AND EXISTS (SELECT 1 FROM products p JOIN stores s ON s.id = p.store_id WHERE p.id = product_images.product_id AND s.owner_id = auth.uid())); CREATE POLICY "Admins can insert any product images" ON public.product_images FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role)); CREATE POLICY "Sellers can delete their product images" ON public.product_images FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL AND EXISTS (SELECT 1 FROM products p JOIN stores s ON s.id = p.store_id WHERE p.id = product_images.product_id AND s.owner_id = auth.uid())); CREATE POLICY "Admins can delete any product images" ON public.product_images FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role)); SELECT policyname, cmd FROM pg_policies WHERE tablename = 'product_images';
```

---

## FIX #007: REVIEWS UNIQUE CONSTRAINT
```
Fix #007 - Copy below, paste to Supabase, run, report result:

ALTER TABLE public.reviews ADD CONSTRAINT reviews_user_product_unique UNIQUE (user_id, product_id); SELECT constraint_name FROM information_schema.table_constraints WHERE table_name = 'reviews' AND constraint_type = 'UNIQUE';
```

---

## FIX #008: SITE_TEXTS LANGUAGE_CODE TYPE
```
Fix #008 - Copy below, paste to Supabase, run, report result:

ALTER TABLE public.site_texts ADD COLUMN language_code_new language_code; UPDATE public.site_texts SET language_code_new = language_code::language_code WHERE language_code_new IS NULL; ALTER TABLE public.site_texts DROP COLUMN language_code; ALTER TABLE public.site_texts RENAME COLUMN language_code_new TO language_code; ALTER TABLE public.site_texts ALTER COLUMN language_code SET NOT NULL, ALTER COLUMN language_code SET DEFAULT 'en'::language_code; SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'site_texts' AND column_name = 'language_code';
```

---

## FIX #009: STORE_TRANSLATIONS LANGUAGE_CODE TYPE
```
Fix #009 - Copy below, paste to Supabase, run, report result:

ALTER TABLE public.store_translations ADD COLUMN language_code_new language_code; UPDATE public.store_translations SET language_code_new = language_code::language_code WHERE language_code_new IS NULL; ALTER TABLE public.store_translations DROP COLUMN language_code; ALTER TABLE public.store_translations RENAME COLUMN language_code_new TO language_code; ALTER TABLE public.store_translations ALTER COLUMN language_code SET NOT NULL, ALTER COLUMN language_code SET DEFAULT 'en'::language_code; SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'store_translations' AND column_name = 'language_code';
```

---

## FIX #010: PRODUCT CASCADE DELETE
```
Fix #010 - Copy below, paste to Supabase, run, report result:

CREATE OR REPLACE FUNCTION delete_product_cascade() RETURNS TRIGGER AS $$ BEGIN DELETE FROM public.product_images WHERE product_id = OLD.id; DELETE FROM public.product_translations WHERE product_id = OLD.id; DELETE FROM public.product_variants WHERE product_id = OLD.id; DELETE FROM public.reviews WHERE product_id = OLD.id; DELETE FROM public.cart_items WHERE product_id = OLD.id; RETURN OLD; END; $$ LANGUAGE plpgsql; CREATE TRIGGER trigger_product_delete_cascade BEFORE DELETE ON public.products FOR EACH ROW EXECUTE FUNCTION delete_product_cascade(); SELECT trigger_name FROM information_schema.triggers WHERE table_name = 'products' AND trigger_name = 'trigger_product_delete_cascade';
```

---

## FIX #011: ADDRESS REFERENTIAL INTEGRITY
```
Fix #011 - Copy below, paste to Supabase, run, report result:

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_address_id_fkey; ALTER TABLE public.orders ADD CONSTRAINT orders_address_id_fkey FOREIGN KEY (address_id) REFERENCES public.addresses(id) ON DELETE SET NULL; SELECT constraint_name, delete_rule FROM information_schema.referential_constraints WHERE table_name = 'orders' AND column_name = 'address_id';
```

---

## 📊 FORMAT FOR YOUR REPORTS

After running each fix, send me:

```
✅ Fix #00X: [NAME]
Status: SUCCESS [or ERROR]
Result: [paste the output rows/info]
Ready for: Fix #00(X+1)
```

**Example:**
```
✅ Fix #004: ORDER ITEMS INSERT POLICY
Status: SUCCESS
Result:
policyname                             | cmd
─────────────────────────────────────────────────
Users can insert their own order items | INSERT
Admins can insert any order items      | INSERT

Ready for: Fix #005
```

---

**Start with Fix #004 whenever you're ready!** 🚀

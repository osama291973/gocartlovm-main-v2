# PostgreSQL System Table Column Names - CORRECTED

## information_schema.triggers table

**CORRECT columns:**
- `trigger_schema` (not table_schema)
- `trigger_name`
- `event_manipulation`
- `event_object_schema`
- `event_object_table` (not table_name or tablename)

**CORRECT query to find triggers:**
```sql
SELECT trigger_name FROM information_schema.triggers 
WHERE event_object_table = 'products' 
AND trigger_name = 'trigger_product_delete_cascade';
```

---

## Reference: All System Tables Corrected

| Table | Query | Correct Columns |
|-------|-------|-----------------|
| pg_policies | `SELECT policyname, cmd FROM pg_policies WHERE tablename = 'table_name' AND cmd = 'ACTION'` | policyname, cmd, tablename |
| information_schema.triggers | `SELECT trigger_name FROM information_schema.triggers WHERE event_object_table = 'table_name'` | trigger_name, event_object_table |
| information_schema.table_constraints | `SELECT constraint_name FROM information_schema.table_constraints WHERE table_name = 'table_name'` | constraint_name, table_name |
| information_schema.columns | `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'table_name'` | column_name, data_type, table_name |
| information_schema.referential_constraints | `SELECT constraint_name, delete_rule FROM information_schema.referential_constraints WHERE table_name = 'orders' AND column_name = 'address_id'` | constraint_name, delete_rule, table_name, column_name |

# BPOReady PostgreSQL setup

## 1. Create a database

In pgAdmin:

1. Right-click **Databases**.
2. Select **Create > Database**.
3. Use a name such as `bpoready`.
4. Set the owner to your PostgreSQL user.

## 2. Import the schema

Use [BPOReady-postgresql-schema.sql](BPOReady-postgresql-schema.sql).

In pgAdmin:

1. Select the `bpoready` database.
2. Open **Query Tool**.
3. Open `BPOReady-postgresql-schema.sql`.
4. Click **Execute**.
5. Refresh **Schemas > public > Tables**.

Command line equivalent:

```powershell
createdb -U postgres bpoready
psql -U postgres -d bpoready -f "c:\Users\edria\Desktop\BPO-READY\BPOReady\docs\BPOReady-postgresql-schema.sql"
```

If PostgreSQL is on another host or port:

```powershell
psql -h 127.0.0.1 -p 5432 -U postgres -d bpoready -f "c:\Users\edria\Desktop\BPO-READY\BPOReady\docs\BPOReady-postgresql-schema.sql"
```

## 3. Configure Laravel

Open `backend/.env` and replace the SQLite settings with:

```dotenv
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=bpoready
DB_USERNAME=postgres
DB_PASSWORD=your_postgres_password
```

Do not commit the real password.

Then clear Laravel's cached configuration:

```powershell
php "c:\Users\edria\Desktop\BPO-READY\BPOReady\backend\artisan" config:clear
php "c:\Users\edria\Desktop\BPO-READY\BPOReady\backend\artisan" db:show
```

## Important: choose one schema strategy

Use either:

- **SQL import:** import `BPOReady-postgresql-schema.sql`, then do not run migrations that recreate the same tables; or
- **Laravel migrations:** convert the remaining ERD tables into Laravel migrations and run `php artisan migrate`.

Do not use both against the same empty database unless the migrations are intentionally aligned with this SQL schema.

The current Laravel project has only the basic Laravel tables plus the prototype `paragraphs` migration, so the SQL file is the complete ERD import. The existing Laravel `users` migration has different columns from the improved ERD `users` table and should be reconciled before using migrations for the full design.

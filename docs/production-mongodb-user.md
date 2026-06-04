# Production MongoDB User

Use a scoped application user for production instead of an owner/admin MongoDB account.

## MongoDB Atlas

1. Open Atlas Database Access.
2. Create a database user named `ecotravel_app`.
3. Set a generated password.
4. Grant only `readWrite` on the EcoTravel application database.
5. Update local or production environment variables:

```env
MONGO_URI=mongodb+srv://ecotravel_app:<generated-password>@<cluster-host>/<database>?retryWrites=true&w=majority
```

## Self-Hosted MongoDB

Run this from an admin `mongosh` session, replacing `ecotravel` and the password:

```javascript
use ecotravel
db.createUser({
  user: "ecotravel_app",
  pwd: "<generated-password>",
  roles: [
    { role: "readWrite", db: "ecotravel" }
  ]
})
```

Then update `.env` or the production secret store with:

```env
MONGO_URI=mongodb://ecotravel_app:<generated-password>@<host>:<port>/ecotravel?authSource=ecotravel
```

Do not commit `.env` or real database credentials.

# USER Directive

The USER directive sets the user name or UID to use when running the container and for any subsequent commands.

## Usage Options

- **Username:** Use an existing user name (e.g., root, www-data)
- **UID:** Use a numeric user ID (e.g., 1000, 33)
- **User:Group:** Specify both user and group (e.g., user:group, 1000:1000)

## Security Notes

- Avoid running as root (UID 0) unless absolutely necessary
- Create non-root users for better security practices
- Ensure the user exists in the container or create it first

## Examples

- **Username:** nginx
- **UID:** 1000
- **User:Group:** www-data:www-data
- **UID:GID:** 1000:1000
# WORKDIR Directive

The WORKDIR directive sets the working directory for any subsequent ADD, COPY, ENTRYPOINT, CMD, and RUN instructions.

## Key Features

- Creates the directory if it doesn't exist
- Can be used multiple times in a Dockerfile
- Supports absolute and relative paths
- Affects all subsequent instructions until changed

## Best Practices

- Use absolute paths for clarity and predictability
- Avoid using `cd` in RUN instructions; use WORKDIR instead
- Set WORKDIR early in your Dockerfile for organization
- Use meaningful directory names (e.g., /app, /usr/src/app)

## Examples

- **Application:** /app
- **Source code:** /usr/src/app
- **Data directory:** /data
- **Config directory:** /etc/myapp
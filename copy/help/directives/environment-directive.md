# ENVIRONMENT Directive

The ENVIRONMENT directive sets environment variables that will be available in the container.

## Deploy Environment Variables (DEPLOY_ENV_)

- Variables with DEPLOY_ENV_ prefix are exported by neurocommand for module usage
- These variables become available to users when they load your module
- Perfect for paths, URLs, and configuration that modules need
- Example: DEPLOY_ENV_APP_PATH → available as APP_PATH in modules

## Standard Environment Variables

- Use UPPERCASE names for environment variables by convention
- Avoid spaces in variable names (use underscores instead)
- Values can contain spaces and special characters
- Variables persist throughout the container lifecycle

## Common Examples

- **DEPLOY_ENV_TOOL_PATH:** /opt/tool/bin
- **DEPLOY_ENV_CONFIG_URL:** https://example.com/config
- **PATH:** /usr/local/bin:/usr/bin:/bin
- **APP_ENV:** production
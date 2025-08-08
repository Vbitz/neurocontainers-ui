# Shell Script Group

Creates an executable shell script and configures it for deployment. This group automatically handles script creation, permission setting, PATH configuration, and deployment binary registration.

**What this creates:**
- A file directive with your script content
- A run directive to copy and set permissions
- Optional environment directive to add to PATH
- Optional deploy directive for binary registration

**Use cases:**
- Custom wrapper scripts for neuroimaging tools
- Environment setup scripts
- Data processing pipelines
- Container initialization scripts

💡 **Tip:** Use the advanced mode to manually edit individual directives if needed
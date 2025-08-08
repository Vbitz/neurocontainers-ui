# Basic Information

**Container Name:**
- Must be lowercase letters and numbers only
- Should be named for the primary tool in the container
- Will be used as the Docker image name
- Examples: fsl, ants, freesurfer, neurodebian

**Version:**
- Use semantic versioning (e.g., 1.0.0, 2.1.3)
- Or tool-specific versions (e.g., 6.0.5, latest)
- Helps users identify which version they're using

**Container Icon:**
- Upload any image format (automatically resized to 64×64 pixels)
- Default icons are generated from the first 1-2 letters of the container name
- Icons are embedded as base64 data in the YAML definition
- Helps users visually identify containers in lists and interfaces
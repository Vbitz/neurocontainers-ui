# Pip Install Group

Installs Python packages using pip with support for conda environments and advanced PyPI configuration. This group provides a flexible way to install Python packages with various options.

**What this creates:**
- A run directive with pip install commands
- Optional pip upgrade before installation
- Support for conda environment activation
- Custom PyPI index configuration

**Use cases:**
- Installing Python packages into specific conda environments
- Installing from private PyPI repositories
- Installing packages with specific pip options
- Managing Python dependencies in containers

**Conda Environment Support:**
- Leave environment name empty to install globally
- Specify environment name to install into that conda environment
- Uses `conda run -n <env>` to activate environment during installation

**Package Specifications:**
- One package per line in the packages field
- Supports version pinning: `numpy==1.21.0`
- Supports version ranges: `scipy>=1.7.0`
- Supports git repositories: `git+https://github.com/user/repo.git`
- Supports local file paths: `/path/to/package`

**Advanced Options:**
- **Index URL**: Use custom PyPI index (e.g., for corporate repositories)
- **Extra Index URL**: Additional package sources to search
- **Pip Options**: Custom flags like `--no-deps`, `--force-reinstall`, etc.

💡 **Tip:** When using conda environments, make sure the environment exists before running this directive (e.g., create it with a Miniconda YAML group first)
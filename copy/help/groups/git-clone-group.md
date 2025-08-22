# Git Clone Group

Clones a git repository into the container with support for specific revisions, tags, or branches. This group handles repository cloning and optional checkout in a single step.

**What this creates:**
- A run directive with git clone commands
- Optional checkout of specific revision/tag/branch
- Optional cleanup of .git directory to reduce image size

**Use cases:**
- Installing software from source code repositories
- Downloading specific versions of tools or datasets
- Including git repositories in container builds
- Fetching code at specific commits or tags

**Revision Support:**
- Leave revision empty to use the default branch
- Specify a branch name (e.g., `main`, `develop`)
- Specify a tag (e.g., `v1.2.3`, `latest-stable`)
- Specify a commit hash (e.g., `abc123def456`)

💡 **Tip:** Enable cleanup to remove .git metadata and reduce final image size, but keep it disabled if you need git history in the container
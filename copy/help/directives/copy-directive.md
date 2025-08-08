# COPY Directive

The COPY instruction copies new files or directories from the source and adds them to the filesystem of the container.

## Format

- `source:destination` - Copy from source to destination
- `file.txt:/app/` - Copy file to directory
- `./src:/app/src` - Copy directory contents
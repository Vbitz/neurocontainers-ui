# RUN Directive

The RUN instruction executes commands in a new layer on top of the current image and commits the results. Supports Jinja2 templates for dynamic values.

## Usage

- All lines are concatenated together as a single Docker layer
- Press Enter to add a new command
- Press Shift+Enter for a new line within a command
- Use Jinja2 syntax like `{{ context.version }}` for templating
- Autocomplete available inside `{{ }}` and `{% %}` tags
- Drag the handle to reorder commands

## Autocomplete Navigation

- ↑/↓ arrows: Navigate suggestions
- Tab/Enter: Accept selected suggestion
- Escape: Close suggestions
- Ctrl+Space: Trigger autocomplete
- PageUp/PageDown: Jump 5 suggestions
- Home/End: First/last suggestion

## Examples

```bash
mkdir -p /app/data
wget https://example.com/v{{ context.version }}/file.tar.gz
dpkg -i package_{{ context.version }}.deb
```
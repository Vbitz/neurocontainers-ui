import { test, expect } from '@playwright/test';

test.describe('Container Builder Workflow', () => {
  test('should complete basic container creation workflow', async ({ page }) => {
    await page.goto('/');

    // Start creating a new container
    await page.click('text=Create New Container');
    await expect(page).toHaveURL(/#\/untitled-/);

    // Fill in basic info
    await page.fill('input[name="name"]', 'test-container');
    await page.fill('input[name="version"]', '1.0.0');
    await page.fill('textarea[name="description"]', 'A test container for automated testing');
    
    // Fill author field
    await page.fill('input[placeholder*="author"], input[name="authors"]', 'Test Author');

    // Fill tool fields
    await page.fill('input[name="tool_name"]', 'test-tool');
    await page.fill('input[name="tool_url"]', 'https://github.com/test/tool');
    await page.fill('input[name="documentation_url"]', 'https://test-tool.readthedocs.io');

    // Select a category
    const categorySelect = page.locator('select[name="categories"], button:has-text("Select categories")');
    if (await categorySelect.isVisible()) {
      await categorySelect.click();
      // Select neuroimaging category if available
      const neuroimagingOption = page.locator('text=neuroimaging, text=Neuroimaging');
      if (await neuroimagingOption.isVisible()) {
        await neuroimagingOption.click();
      }
    }

    // Fill license
    await page.fill('input[name="license"]', 'MIT');

    // Check that required field validation errors disappear
    await expect(page.locator('text=Name is required')).not.toBeVisible();
    await expect(page.locator('text=Version is required')).not.toBeVisible();

    // Navigate to Build Recipe section
    await page.click('text=Build Recipe');
    
    // Should see base image selection
    await expect(page.locator('text=Base Image')).toBeVisible();
    await expect(page.locator('text=Ubuntu')).toBeVisible();

    // Should see default directives
    await expect(page.locator('text=Deploy')).toBeVisible();
    await expect(page.locator('text=Test')).toBeVisible();

    // Add a simple install directive
    const addDirectiveButton = page.locator('button:has-text("Add Directive"), button:has-text("+")');
    if (await addDirectiveButton.isVisible()) {
      await addDirectiveButton.click();
      
      // Select install directive if available
      const installOption = page.locator('text=Install, text=install');
      if (await installOption.isVisible()) {
        await installOption.click();
      }
    }

    // Navigate to Validate section
    await page.click('text=Validate');
    
    // Should see validation interface
    await expect(page.locator('text=Load Pyodide')).toBeVisible();
    await expect(page.locator('text=Container Builder Status')).toBeVisible();

    // Check that container is saved locally
    await expect(page.locator('text=Saved Locally')).toBeVisible();
  });

  test('should handle YAML import workflow', async ({ page }) => {
    await page.goto('/');

    // Click upload existing YAML
    await page.click('text=Upload Existing YAML');
    
    // Should show upload modal
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('text=Upload YAML Configuration')).toBeVisible();

    // Test with sample YAML
    const sampleYaml = `
name: test-container
version: 1.0.0
description: A test container
authors:
  - Test Author
tool_name: test-tool
tool_url: https://github.com/test/tool
documentation_url: https://test-tool.readthedocs.io
categories:
  - neuroimaging
license: MIT
neurodocker:
  pkg_manager: apt
  instructions:
    - name: test
      directive: run
      arguments:
        command: echo "test"
architectures:
  - x86_64
`;

    // Find textarea and fill with YAML
    const yamlTextarea = page.locator('textarea');
    if (await yamlTextarea.isVisible()) {
      await yamlTextarea.fill(sampleYaml);
      
      // Submit the form
      const submitButton = page.locator('button:has-text("Load"), button:has-text("Upload"), button[type="submit"]');
      if (await submitButton.isVisible()) {
        await submitButton.click();
      }
    }

    // Should navigate to builder with loaded data
    await expect(page).toHaveURL(/#\/test-container/);
    await expect(page.locator('input[value="test-container"]')).toBeVisible();
  });

  test('should validate form fields and show errors', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Create New Container');

    // Should show validation errors for required fields
    await expect(page.locator('text=Name is required')).toBeVisible();
    await expect(page.locator('text=Version is required')).toBeVisible();

    // Fill name field - error should disappear
    await page.fill('input[name="name"]', 'test');
    await expect(page.locator('text=Name is required')).not.toBeVisible();

    // Test invalid version format
    await page.fill('input[name="version"]', 'invalid-version');
    // Should show version format error if validation exists
    // (The exact error message may vary based on implementation)

    // Test valid version
    await page.fill('input[name="version"]', '1.0.0');
    await expect(page.locator('text=Version is required')).not.toBeVisible();
  });

  test('should persist data in localStorage', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Create New Container');

    // Fill some data
    await page.fill('input[name="name"]', 'persistent-test');
    await page.fill('input[name="version"]', '1.0.0');

    // Reload the page
    await page.reload();

    // Should redirect back to the container
    await expect(page).toHaveURL(/#\/persistent-test/);
    await expect(page.locator('input[value="persistent-test"]')).toBeVisible();
  });
});
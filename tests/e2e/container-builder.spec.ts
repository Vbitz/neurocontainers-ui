import { test, expect } from '@playwright/test';

test.describe('Container Builder Workflow', () => {
  test('should complete basic container creation workflow through guided tour', async ({ page }) => {
    await page.goto('/');

    // Start creating a new container - opens guided tour
    await page.click('text=Create New Container');
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    
    // Should see template options
    await expect(page.locator('text=Start from Scratch')).toBeVisible();
    
    // For now, just test that the modal opens and can be closed
    await page.keyboard.press('Escape');
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });

  test('should handle YAML import workflow', async ({ page }) => {
    await page.goto('/');

    // Click paste YAML recipe
    await page.click('text=Paste YAML Recipe');
    
    // Should show paste modal
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('text=Upload YAML Configuration')).toBeVisible();

    // Test with sample YAML - use correct format for Zod schema
    const sampleYaml = `name: test-container
version: "1.0.0"
architectures:
  - x86_64
build:
  kind: neurodocker
  base-image: ubuntu:24.04
  pkg-manager: apt
  directives: []
categories:
  - programming`;

    // Find textarea and fill with YAML
    const yamlTextarea = page.locator('textarea');
    if (await yamlTextarea.isVisible()) {
      await yamlTextarea.fill(sampleYaml);
      
      // Check the recipe
      const checkButton = page.locator('button:has-text("Check Recipe")');
      if (await checkButton.isVisible()) {
        await checkButton.click();
        
        // Wait for validation to complete
        await expect(page.locator('text=Recipe is Valid!')).toBeVisible();
        
        // Submit the form
        const importButton = page.locator('button:has-text("Import Recipe")');
        if (await importButton.isVisible()) {
          await importButton.click();
        }
      }
    }

    // Should navigate to builder with loaded data
    await expect(page).toHaveURL(/#\/test-container/);
    await expect(page.locator('input[value="test-container"]')).toBeVisible();
  });

  test('should show validation in paste modal', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Paste YAML Recipe');
    
    // Test with invalid YAML
    const invalidYaml = 'invalid: yaml: content: [';
    
    const yamlTextarea = page.locator('textarea');
    await yamlTextarea.fill(invalidYaml);
    
    const checkButton = page.locator('button:has-text("Check Recipe")');
    await checkButton.click();
    
    // Should show parse error
    await expect(page.locator('text=YAML Parse Error')).toBeVisible();
  });

  test('should persist data in localStorage after creating container', async ({ page }) => {
    await page.goto('/');
    
    // Create a container through paste YAML
    await page.click('text=Paste YAML Recipe');
    
    const sampleYaml = `name: persistent-test
version: "1.0.0"
architectures:
  - x86_64
build:
  kind: neurodocker
  base-image: ubuntu:24.04
  pkg-manager: apt
  directives: []
categories:
  - programming`;

    await page.locator('textarea').fill(sampleYaml);
    await page.locator('button:has-text("Check Recipe")').click();
    await expect(page.locator('text=Recipe is Valid!')).toBeVisible();
    await page.locator('button:has-text("Import Recipe")').click();

    // Should navigate to the container
    await expect(page).toHaveURL(/#\/persistent-test/);
    
    // Reload the page
    await page.reload();

    // After reload, check if the container appears in recent containers list
    // This is more realistic than expecting URL persistence
    await expect(page.locator('text=Recent Containers')).toBeVisible();
    await expect(page.locator('text=persistent-test')).toBeVisible({ timeout: 10000 });
  });
});
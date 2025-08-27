"use client";

import { useEffect, useMemo } from "react";
import { useTabs } from "@/lib/tabs/TabManager";
import { useGitHubFiles } from "@/lib/useGithub";
import { getSavedContainers } from "@/lib/containerStorage";
import { load as loadYAML } from "js-yaml";
import { migrateLegacyRecipe, mergeAdditionalFilesIntoRecipe, type ContainerRecipe } from "@/components/common";

function sanitize(name: string) {
  return name.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
}

export function DeepLinkHandler() {
  const { files } = useGitHubFiles("neurodesk", "neurocontainers", "main");
  const { open } = useTabs();

  useEffect(() => {
    const hash = window.location.hash || "";
    // ignore if already has tab param
    const params = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash);
    if (params.get('tab')) return;

    const openRecipeByName = async (name: string) => {
      // try local first
      try {
        const saved = getSavedContainers();
        const hit = saved.find(c => sanitize(c.name) === sanitize(name));
        if (hit) {
          open({ type: 'recipe', title: hit.name || 'Untitled', payload: { recipe: hit.data, containerId: hit.id } });
          return;
        }
      } catch {}

      // then github
      const file = files.find(f => {
        const parts = f.path.split('/');
        const recipeName = parts[parts.length - 2] || '';
        return sanitize(recipeName) === sanitize(name);
      });
      if (file && file.downloadUrl) {
        try {
          const res = await fetch(file.downloadUrl);
          if (res.ok) {
            const yamlText = await res.text();
            let parsed = loadYAML(yamlText) as ContainerRecipe;
            parsed = migrateLegacyRecipe(parsed);
            parsed = await mergeAdditionalFilesIntoRecipe(parsed, async (filename: string) => {
              const fr = await fetch(`${file.downloadUrl!.replace(/build\\.yaml$/, '')}${filename}`);
              if (!fr.ok) throw new Error('Failed to fetch additional file');
              return await fr.text();
            });
            open({ type: 'recipe', title: parsed.name || 'Untitled', payload: { recipe: parsed, origin: { kind: 'github', key: file.path } } });
          }
        } catch (e) {
          console.error('Failed to open recipe by name from GitHub', e);
        }
      }
    };

    if (hash.startsWith('#/')) {
      const name = hash.substring(2);
      openRecipeByName(name);
    } else if (params.get('open')) {
      const val = params.get('open')!;
      if (val.startsWith('recipe:')) {
        const key = val.substring('recipe:'.length);
        openRecipeByName(key);
      }
    }
  }, [files, open]);

  return null;
}


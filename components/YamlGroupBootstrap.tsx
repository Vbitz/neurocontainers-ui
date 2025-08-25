"use client";

import { useEffect } from 'react';
import { loadStoredYamlGroups } from '@/lib/yamlGroupEditor/localStorage';
import { registerYamlGroup } from '@/lib/yamlGroupEditor/loader';

export default function YamlGroupBootstrap() {
  useEffect(() => {
    try {
      const groups = loadStoredYamlGroups();
      groups.filter(g => g.enabled).forEach(g => {
        try {
          void registerYamlGroup(g.yaml);
        } catch (e) {
          console.error('Failed to register stored YAML group', g.key, e);
        }
      });
    } catch (e) {
      console.error('Error bootstrapping stored YAML groups', e);
    }
  }, []);
  return null;
}


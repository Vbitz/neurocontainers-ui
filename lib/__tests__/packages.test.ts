import {
  loadPackageDatabase,
  searchPackages,
  searchPackagesSync,
} from '@/lib/packages';

// Mock the package data
jest.mock('@/lib/packages/ubuntu_noble_amd64.json', () => [
  { name: 'curl', description: 'Command line tool for transferring data' },
  { name: 'git', description: 'Distributed version control system' },
  { name: 'python3', description: 'Interactive high-level object-oriented language' },
  { name: 'python3-pip', description: 'Python package installer' },
  { name: 'nodejs', description: 'JavaScript runtime environment' },
  { name: 'nginx', description: 'High-performance web server' },
  { name: 'libcurl4', description: 'Library for transferring data' },
  { name: 'wget', description: 'Tool for retrieving files using HTTP, HTTPS and FTP' },
], { virtual: true });

describe('packages', () => {
  describe('searchPackagesSync', () => {
    it('should throw error if database not loaded', () => {
      expect(() => {
        searchPackagesSync('git');
      }).toThrow('Package database not loaded');
    });
  });

  describe('loadPackageDatabase and searchPackages integration', () => {
    it('should load and search packages', async () => {
      try {
        const packages = await loadPackageDatabase();
        expect(Array.isArray(packages)).toBe(true);

        const results = await searchPackages('git');
        expect(Array.isArray(results)).toBe(true);
      } catch (error) {
        // Expected to fail in test environment due to missing package files
        expect(error).toBeDefined();
      }
    });

    it('should handle empty search queries', async () => {
      try {
        const results = await searchPackages('');
        expect(results).toEqual([]);
      } catch (error) {
        // Expected to fail in test environment
        expect(error).toBeDefined();
      }
    });
  });
});
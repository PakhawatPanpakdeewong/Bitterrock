/**
 * Unit tests for migrate-utils (runMigration, migrations list)
 * Report: report_db_migrate.md
 */
const path = require('path');
const fs = require('fs');
const { runMigration, migrations } = require('../migrate-utils');

jest.mock('fs');

describe('migrate-utils', () => {
  describe('migrations', () => {
    it('exports non-empty migrations list', () => {
      expect(Array.isArray(migrations)).toBe(true);
      expect(migrations.length).toBeGreaterThan(0);
    });

    it('each migration has name and file', () => {
      migrations.forEach((m) => {
        expect(m).toHaveProperty('name');
        expect(m).toHaveProperty('file');
        expect(typeof m.name).toBe('string');
        expect(typeof m.file).toBe('string');
      });
    });
  });

  describe('runMigration', () => {
    let mockPool;

    beforeEach(() => {
      jest.clearAllMocks();
      mockPool = { query: jest.fn() };
    });

    it('returns "skipped" when migration file does not exist', async () => {
      fs.existsSync = jest.fn().mockReturnValue(false);
      const result = await runMigration(mockPool, { name: 'test', file: 'missing.sql' });
      expect(result).toBe('skipped');
      expect(mockPool.query).not.toHaveBeenCalled();
    });

    it('returns "completed" when query succeeds', async () => {
      fs.existsSync = jest.fn().mockReturnValue(true);
      fs.readFileSync = jest.fn().mockReturnValue('CREATE TABLE t (id INT);');
      mockPool.query.mockResolvedValue(undefined);
      const result = await runMigration(mockPool, { name: 'test', file: 'add_t.sql' });
      expect(result).toBe('completed');
      expect(mockPool.query).toHaveBeenCalledWith('CREATE TABLE t (id INT);');
    });

    it('returns "already_exists" when err.code is 42P07', async () => {
      fs.existsSync = jest.fn().mockReturnValue(true);
      fs.readFileSync = jest.fn().mockReturnValue('CREATE TABLE x ();');
      const err = new Error('already exists');
      err.code = '42P07';
      mockPool.query.mockRejectedValue(err);
      const result = await runMigration(mockPool, { name: 'dup', file: 'dup.sql' });
      expect(result).toBe('already_exists');
    });

    it('rethrows when err.code is not 42P07', async () => {
      fs.existsSync = jest.fn().mockReturnValue(true);
      fs.readFileSync = jest.fn().mockReturnValue('SELECT 1');
      mockPool.query.mockRejectedValue(new Error('other error'));
      await expect(runMigration(mockPool, { name: 'x', file: 'x.sql' })).rejects.toThrow(
        'other error'
      );
    });
  });
});

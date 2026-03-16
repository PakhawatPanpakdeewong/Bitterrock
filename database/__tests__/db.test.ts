/**
 * Unit tests for database/db.ts - ใช้โดยทุก API และ auth
 * Report: report_db_migrate.md
 */
import { testConnection, query, closePool } from '../db';

const mockRelease = jest.fn();
const mockQuery = jest.fn();
const mockConnect = jest.fn();
const mockEnd = jest.fn();

jest.mock('pg', () => ({
  Pool: jest.fn().mockImplementation(() => ({
    connect: mockConnect,
    end: mockEnd,
  })),
}));

describe('database db', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      DB_HOST: 'localhost',
      DB_PORT: '5432',
      DB_NAME: 'test',
      DB_USER: 'user',
      DB_PASSWORD: 'pass',
    };
    mockConnect.mockResolvedValue({
      query: mockQuery,
      release: mockRelease,
    });
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('testConnection', () => {
    it('returns true when connect succeeds', async () => {
      const result = await testConnection();
      expect(result).toBe(true);
      expect(mockRelease).toHaveBeenCalled();
    });

    it('returns false when connect fails', async () => {
      mockConnect.mockRejectedValueOnce(new Error('Connection refused'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const result = await testConnection();
      expect(result).toBe(false);
      consoleSpy.mockRestore();
    });
  });

  describe('query', () => {
    it('returns result from client.query', async () => {
      const fakeResult = { rows: [{ id: 1 }], rowCount: 1 };
      mockQuery.mockResolvedValue(fakeResult);
      const result = await query('SELECT 1');
      expect(result).toEqual(fakeResult);
      expect(mockQuery).toHaveBeenCalledWith('SELECT 1', undefined);
      expect(mockRelease).toHaveBeenCalled();
    });

    it('passes params to client.query', async () => {
      mockQuery.mockResolvedValue({ rows: [] });
      await query('SELECT * FROM t WHERE id = $1', [42]);
      expect(mockQuery).toHaveBeenCalledWith('SELECT * FROM t WHERE id = $1', [42]);
    });

    it('releases client and throws when query fails', async () => {
      mockQuery.mockRejectedValue(new Error('syntax error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      await expect(query('INVALID')).rejects.toThrow('syntax error');
      expect(mockRelease).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('closePool', () => {
    it('calls pool.end when pool exists', async () => {
      await testConnection();
      await closePool();
      expect(mockEnd).toHaveBeenCalled();
    });
  });
});

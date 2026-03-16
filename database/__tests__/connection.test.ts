/**
 * Unit tests for database/connection.ts - ใช้โดย lib/fetch-log และ API บางตัว
 * Report: report_connection.md
 */
import { testConnection, query, closePool } from '../connection';

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

describe('database connection', () => {
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
    it('returns result and releases client', async () => {
      const fakeResult = { rows: [{ n: 1 }] };
      mockQuery.mockResolvedValue(fakeResult);
      const result = await query('SELECT 1');
      expect(result).toEqual(fakeResult);
      expect(mockRelease).toHaveBeenCalled();
    });

    it('throws and releases client when query fails', async () => {
      mockQuery.mockRejectedValue(new Error('syntax error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      await expect(query('BAD')).rejects.toThrow('syntax error');
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

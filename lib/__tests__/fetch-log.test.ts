/**
 * Unit tests for lib/fetch-log.ts - หน้าที่เกี่ยวข้อง: หน้า Fetch Logs (app/fetch-logs)
 * Report: report_fetch-log_fetch-logs.md
 */
import { logFetchFailure } from '../fetch-log';

jest.mock('@/database/connection', () => ({
  query: jest.fn(),
}));

const { query } = require('@/database/connection');

describe('logFetchFailure', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls query with correct params when all fields provided', async () => {
    (query as jest.Mock).mockResolvedValue(undefined);
    await logFetchFailure({
      source: 'api',
      resourceType: 'product',
      resourceId: '123',
      errorMessage: 'Not found',
      httpStatus: 404,
    });
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO fetchlogs'),
      ['api', 'product', '123', 'Not found', 404]
    );
  });

  it('passes null for optional fields when omitted', async () => {
    (query as jest.Mock).mockResolvedValue(undefined);
    await logFetchFailure({
      source: 'cron',
      resourceType: 'order',
    });
    expect(query).toHaveBeenCalledWith(
      expect.any(String),
      ['cron', 'order', null, null, null]
    );
  });

  it('does not throw when query fails (fails silently)', async () => {
    (query as jest.Mock).mockRejectedValue(new Error('DB down'));
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    await expect(logFetchFailure({
      source: 'x',
      resourceType: 'y',
    })).resolves.not.toThrow();
    consoleSpy.mockRestore();
  });
});

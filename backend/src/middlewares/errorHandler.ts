import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

/** Lỗi nghiệp vụ có mã HTTP rõ ràng. */
export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ error: 'Không tìm thấy tài nguyên' });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: 'Dữ liệu không hợp lệ', details: err.flatten() });
  }
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message });
  }
  console.error(err);
  return res.status(500).json({ error: 'Lỗi máy chủ' });
}

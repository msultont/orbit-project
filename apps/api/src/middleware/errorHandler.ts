import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import type { ApiErrorBody } from '@orbit/shared';
import { AppError } from '../utils/errors.js';

const body = (code: string, message: string, details?: unknown): ApiErrorBody => ({
  error: { code, message, ...(details === undefined ? {} : { details }) },
});

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json(body('NOT_FOUND', `Route ${req.method} ${req.path} not found`));
};

interface HttpLikeError extends Error {
  status?: number;
  type?: string;
}

export const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  if (error instanceof ZodError) {
    res.status(400).json(
      body(
        'VALIDATION_ERROR',
        'Request validation failed',
        error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
      ),
    );
    return;
  }

  if (error instanceof AppError) {
    res.status(error.status).json(body(error.code, error.message, error.details));
    return;
  }

  const httpError = error as HttpLikeError;
  if (httpError.type === 'entity.parse.failed') {
    res.status(400).json(body('INVALID_JSON', 'Request body is not valid JSON'));
    return;
  }
  if (httpError.type === 'entity.too.large') {
    res.status(413).json(body('PAYLOAD_TOO_LARGE', 'Request body is too large'));
    return;
  }

  // Log server-side only; clients never see SQL errors or stack traces.
  console.error('Unhandled error:', error);
  res.status(500).json(body('INTERNAL_ERROR', 'Something went wrong'));
};

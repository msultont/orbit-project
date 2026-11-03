import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';

type Source = 'body' | 'query';

/** Parses `req[source]` with `schema` and stores the result in `res.locals.validated[source]`. */
export function validate(schema: ZodType, source: Source): RequestHandler {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      next(result.error);
      return;
    }
    res.locals.validated = { ...(res.locals.validated as object | undefined), [source]: result.data };
    next();
  };
}

export function getValidated<T>(res: { locals: Record<string, unknown> }, source: Source): T {
  const validated = res.locals.validated as Partial<Record<Source, unknown>> | undefined;
  return validated?.[source] as T;
}

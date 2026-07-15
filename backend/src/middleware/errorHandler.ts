import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Unhandled Server Error:', err);

  // Mongoose Duplicate Key Error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    res.status(400).json({
      message: `Account already exists for this ${field}.`,
    });
    return;
  }

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val: any) => val.message);
    res.status(400).json({
      message: 'Validation failed',
      errors: messages,
    });
    return;
  }

  // CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    res.status(400).json({
      message: `Invalid resource identifier: ${err.value}`,
    });
    return;
  }

  // Generic errors
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  res.status(status).json({
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};

import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { BadRequestError } from '../core/ApiError';

type ValidationSource = 'body' | 'params' | 'query';

export const validate = (schema: Joi.Schema, source: ValidationSource = 'body') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const data = req[source];
    const { error, value } = schema.validate(data, { abortEarly: false });

    if (error) {
      const errorMessage = error.details.map((detail) => detail.message).join(', ');
      throw new BadRequestError(errorMessage);
    }

    // Replace request data with validated and sanitized data
    req[source] = value;
    next();
  };
};

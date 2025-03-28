import type { Request, Response, NextFunction } from "express"
import { validate } from "class-validator"
import { plainToInstance } from "class-transformer"

export const validateQueryDto = (dtoClass: any) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const dtoObj = plainToInstance(dtoClass, req.query, {
      enableImplicitConversion: true,
    })

    const errors = await validate(dtoObj as object)

    if (errors.length > 0) {
      const formattedErrors = errors.map((error) => ({
        property: error.property,
        constraints: error.constraints,
      }))

      return res.status(400).json({
        status: "error",
        message: "Validation failed",
        errors: formattedErrors,
      })
    }

    req.query = dtoObj as any
    next()
  }
}


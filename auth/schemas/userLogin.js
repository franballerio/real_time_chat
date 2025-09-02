import { z } from 'zod'

const UserRole = z.enum(['ADMIN', 'USER', 'GUEST'])

const emailSchema = z.email({ message: 'Invalid email address.' })
const user_nameSchema = z.string().min(1).max(20)

export const userSchema = z.object({

  credential: z.union([emailSchema, user_nameSchema]),

  // 🔐 IMPORTANT: This is for validation, NOT for storage.
  // You should always HASH the password before saving it to a database.
  // password: z.string()
  //   .min(8, { message: 'Password must be at least 8 characters long.' })
  //   .regex(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/, {
  //     message: 'Password must contain at least one letter and one number.'
  //   }),
  password: z.string().min(1),
  //   role: UserRole.default('USER'), // Default role to 'USER' if not provided

  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date())
})

export function validateLogin (data) {
  const result = userSchema.safeParse(data)
  return result
}


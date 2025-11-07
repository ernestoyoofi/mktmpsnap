import { z } from "zod"

const now = new Date()
const MIN_DATE = new Date(now.getTime() + 60 * 1000)
const MAX_DATE = new Date(now.getTime() + 12 * 60 * 60 * 1000)

const zodValidation = z.object({
  mikrotik_hostname: z.string({ required_error: "IP Mikrotik is required." })
    .ipv4({ message: "Host must be a valid IPv4 address." }),
  mikrotik_username: z
    .string({ message: "Username is required." })
    .min(1, "Username cannot be empty."),
  mikrotik_password: z.string().optional(),
  mikrotik_port: z.number({ message: "Port must be a number." })
    .int("Port must be an integer.").optional(),
  backup_date: z.string().pipe(
    z.coerce.date()
      .refine((date) => !isNaN(date.getTime()),
        { message: "Invalid date format (use ISO Date/Time format)." })
      .refine((date) => date.getTime() >= MIN_DATE.getTime(),
        { message: `Backup date must be at least 1 minute from the current time. (Minimum: ${MIN_DATE.toString()})` })
      .refine((date) => date.getTime() <= MAX_DATE.getTime(),
        { message: `Backup date cannot be more than 24 hours from the current time. (Maximum: ${MAX_DATE.toString()})` })
  ),
})

const zodValidation_fastconnect = z.object({
  mikrotik_hostname: z.string({ required_error: "IP Mikrotik is required." })
    .ipv4({ message: "Host must be a valid IPv4 address." }),
  mikrotik_username: z
    .string({ message: "Username is required." })
    .min(1, "Username cannot be empty."),
  mikrotik_password: z.string().optional(),
  mikrotik_port: z.number({ message: "Port must be a number." })
    .int("Port must be an integer.").optional(),
})

export default function validateForm(dataForm = {}) {
  try {
    zodValidation.parse(dataForm)
    return null // Valid!
  } catch(e) {
    console.log("[Form Validation]:", e)
    if(e instanceof z.ZodError) {
      return {
        status: "error",
        message: e.issues.map(a => String(a.message)).join(", ")
      }
    }
    return {
      status: "error",
      message: "Error Validation Form!"
    }
  }
}
export function validateForm_fastconnect(dataForm = {}) {
  try {
    zodValidation_fastconnect.parse(dataForm)
    return null // Valid!
  } catch(e) {
    console.log("[Form Validation Fast!]:", e)
    if(e instanceof z.ZodError) {
      return {
        status: "error",
        message: e.issues.map(a => String(a.message)).join(", ")
      }
    }
    return {
      status: "error",
      message: "Error Validation Form!"
    }
  }
}
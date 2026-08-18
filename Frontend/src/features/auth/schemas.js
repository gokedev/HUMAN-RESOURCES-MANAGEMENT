import { z } from 'zod';
const passwordSchema = z
    .string()
    .min(8, 'Password must be at least 8 characters.')
    .max(128, 'Password must be at most 128 characters.')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter.')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter.')
    .regex(/\d/, 'Password must contain at least one digit.')
    .regex(/[@$!%*?&#]/, 'Password must contain at least one special character (@$!%*?&#).');
export const loginSchema = z.object({
    email: z.email('Enter a valid email address.'),
    password: z.string().min(1, 'Password is required.'),
    companySlug: z.string().min(1, 'Company slug is required.'),
    rememberMe: z.boolean(),
});
export const registerCompanySchema = z.object({
    companyName: z.string().min(1, 'Company name is required.'),
    industry: z.string().optional(),
    country: z.string().optional(),
    adminFirstName: z.string().min(1, 'Admin first name is required.'),
    adminLastName: z.string().min(1, 'Admin last name is required.'),
    adminEmail: z.email('Enter a valid admin email address.'),
    adminPassword: passwordSchema,
});
export const forgotPasswordSchema = z.object({
    email: z.email('Enter a valid email address.'),
    companySlug: z.string().min(1, 'Company slug is required.'),
});
export const resetPasswordSchema = z.object({
    token: z.string().min(1, 'Reset token is required.'),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password.'),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"], // Path of error
});
export const acceptInvitationSchema = z.object({
    token: z.string().min(1, 'Invitation token is required.'),
    password: passwordSchema,
});

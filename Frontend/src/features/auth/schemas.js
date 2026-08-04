import { z } from 'zod';
const passwordSchema = z.string().min(8, 'Password must be at least 8 characters.');
export const loginSchema = z.object({
    email: z.email('Enter a valid email address.'),
    password: passwordSchema,
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
});
export const acceptInvitationSchema = z.object({
    token: z.string().min(1, 'Invitation token is required.'),
    password: passwordSchema,
});

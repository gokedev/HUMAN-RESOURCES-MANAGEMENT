package com.hrsaas.service;

/**
 * Generates styled HTML email bodies for all transactional emails.
 * Every template is self-contained with inline CSS for maximum email-client
 * compatibility (Gmail, Outlook, Apple Mail, etc.).
 *
 * Design tokens:
 *   Primary color  — #4F46E5 (indigo-600)
 *   Background     — #F9FAFB (gray-50)
 *   Card           — #FFFFFF
 *   Text           — #111827 (gray-900)
 *   Muted text     — #6B7280 (gray-500)
 *   Border         — #E5E7EB (gray-200)
 */
public final class EmailTemplate {

    private EmailTemplate() {}

    // ──────────────────────────────────────────────
    //  Shared layout wrapper
    // ──────────────────────────────────────────────

    private static String wrap(String preheader, String body) {
        return """
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>CoralHR</title>
            </head>
            <body style="margin:0;padding:0;background-color:#F9FAFB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
              <!-- Preheader text (hidden, used by email clients for preview) -->
              <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">%s</div>

              <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" style="background-color:#F9FAFB;">
                <tr>
                  <td align="center" style="padding:40px 16px;">
                    <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" style="max-width:560px;">

                      <!-- Logo -->
                      <tr>
                        <td align="center" style="padding-bottom:32px;">
                          <div style="display:inline-flex;align-items:center;gap:8px;">
                            <div style="width:36px;height:36px;border-radius:8px;background:linear-gradient(135deg,#6366F1,#8B5CF6);text-align:center;line-height:36px;color:#fff;font-weight:700;font-size:16px;">C</div>
                            <span style="font-size:20px;font-weight:700;color:#111827;letter-spacing:-0.5px;">CoralHR</span>
                          </div>
                        </td>
                      </tr>

                      <!-- Card -->
                      <tr>
                        <td>
                          <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" style="background-color:#FFFFFF;border-radius:12px;border:1px solid #E5E7EB;overflow:hidden;">
                            %s
                          </table>
                        </td>
                      </tr>

                      <!-- Footer -->
                      <tr>
                        <td align="center" style="padding:24px 0;">
                          <p style="margin:0;font-size:12px;color:#9CA3AF;line-height:1.6;">
                            This is a transactional email from CoralHR.<br>
                            If you didn't expect this, you can safely ignore it.
                          </p>
                        </td>
                      </tr>

                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
            """.formatted(preheader, body);
    }

    /** Shared button (used inside the card body). */
    private static String button(String href, String label) {
        return """
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px auto 0;">
              <tr>
                <td align="center" style="background:linear-gradient(135deg,#6366F1,#8B5CF6);border-radius:8px;">
                  <a href="%s" target="_blank" style="display:inline-block;padding:12px 32px;font-size:14px;font-weight:600;color:#FFFFFF;text-decoration:none;letter-spacing:0.2px;">%s</a>
                </td>
              </tr>
            </table>
            """.formatted(href, label);
    }

    /** Shared small muted footer line inside the card. */
    private static String cardFooter(String text) {
        return """
            <tr>
              <td style="padding:20px 32px 24px;border-top:1px solid #F3F4F6;">
                <p style="margin:0;font-size:13px;color:#9CA3AF;line-height:1.6;">%s</p>
              </td>
            </tr>
            """.formatted(text);
    }

    // ──────────────────────────────────────────────
    //  Company Welcome
    // ──────────────────────────────────────────────

    /**
     * Sent to the admin who just registered a new company workspace.
     *
     * @param companyName  display name of the company
     * @param companySlug  unique login identifier (e.g. "acme-inc")
     * @param loginUrl     full URL to the login page
     */
    static String companyWelcome(String companyName, String companySlug, String loginUrl) {
        String preheader = "Your company workspace is ready — log in to get started.";
        String body = """
            <!-- Header band -->
            <tr>
              <td style="background:linear-gradient(135deg,#6366F1,#8B5CF6);padding:32px 32px 28px;">
                <h1 style="margin:0;font-size:20px;font-weight:700;color:#FFFFFF;">Welcome to CoralHR</h1>
                <p style="margin:6px 0 0;font-size:14px;color:rgba(255,255,255,0.85);">Your HR management platform is ready.</p>
              </td>
            </tr>
            <!-- Body -->
            <tr>
              <td style="padding:32px;">
                <p style="margin:0;font-size:15px;color:#111827;line-height:1.7;">
                  Hi there,
                </p>
                <p style="margin:16px 0 0;font-size:15px;color:#374151;line-height:1.7;">
                  Your company workspace <strong style="color:#111827;">%s</strong> has been created and is ready to go.
                </p>

                <!-- Info box -->
                <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" style="margin:24px 0;background-color:#F9FAFB;border-radius:8px;border:1px solid #E5E7EB;">
                  <tr>
                    <td style="padding:16px 20px;">
                      <p style="margin:0;font-size:12px;font-weight:600;color:#6B7280;text-transform:uppercase;letter-spacing:0.5px;">Your company slug</p>
                      <p style="margin:4px 0 0;font-size:18px;font-weight:700;color:#4F46E5;letter-spacing:0.3px;">%s</p>
                    </td>
                  </tr>
                </table>

                <p style="margin:0;font-size:14px;color:#374151;line-height:1.7;">
                  Use this slug every time you log in — it identifies your workspace.
                </p>

                %s
              </td>
            </tr>
            %s
            """.formatted(companyName, companySlug, button(loginUrl, "Go to login"), cardFooter("You received this because you registered a new company on CoralHR."));
        return wrap(preheader, body);
    }

    // ──────────────────────────────────────────────
    //  Employee Invitation
    // ──────────────────────────────────────────────

    /**
     * Sent to a newly invited employee so they can set their password.
     *
     * @param firstName   employee's first name
     * @param companyName display name of the inviting company
     * @param inviteLink  full URL with the invitation token
     */
    static String employeeInvitation(String firstName, String companyName, String inviteLink) {
        String preheader = companyName + " has invited you to join their HR workspace.";
        String body = """
            <tr>
              <td style="background:linear-gradient(135deg,#6366F1,#8B5CF6);padding:32px 32px 28px;">
                <h1 style="margin:0;font-size:20px;font-weight:700;color:#FFFFFF;">You're invited!</h1>
                <p style="margin:6px 0 0;font-size:14px;color:rgba(255,255,255,0.85);">Join your team on CoralHR.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <p style="margin:0;font-size:15px;color:#111827;line-height:1.7;">
                  Hi %s,
                </p>
                <p style="margin:16px 0 0;font-size:15px;color:#374151;line-height:1.7;">
                  <strong style="color:#111827;">%s</strong> has added you as an employee. Click the button below to set your password and activate your account.
                </p>

                %s

                <!-- Info box -->
                <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" style="margin:24px 0;background-color:#FEF3C7;border-radius:8px;border:1px solid #FDE68A;">
                  <tr>
                    <td style="padding:12px 16px;">
                      <p style="margin:0;font-size:13px;color:#92400E;line-height:1.5;">
                        <strong>⏰ Note:</strong> This invitation link expires in <strong>72 hours</strong>. If it expires, ask your admin to resend it.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            %s
            """.formatted(firstName, companyName, button(inviteLink, "Accept invitation"), cardFooter("You received this because an administrator at " + companyName + " added you to their workspace."));
        return wrap(preheader, body);
    }

    // ──────────────────────────────────────────────
    //  Leave Status Update
    // ──────────────────────────────────────────────

    /**
     * Sent when an admin approves or rejects an employee's leave request.
     *
     * @param firstName employee's first name
     * @param status    "APPROVED" or "REJECTED"
     * @param leaveType e.g. "ANNUAL", "SICK"
     */
    static String leaveStatus(String firstName, String status, String leaveType) {
        boolean approved = "APPROVED".equalsIgnoreCase(status);
        String color = approved ? "#059669" : "#DC2626";
        String bgColor = approved ? "#ECFDF5" : "#FEF2F2";
        String borderColor = approved ? "#A7F3D0" : "#FECACA";
        String icon = approved ? "✅" : "❌";
        String preheader = "Your " + leaveType.toLowerCase() + " leave request has been " + status.toLowerCase() + ".";
        String body = """
            <tr>
              <td style="background:linear-gradient(135deg,#6366F1,#8B5CF6);padding:32px 32px 28px;">
                <h1 style="margin:0;font-size:20px;font-weight:700;color:#FFFFFF;">Leave Request Update</h1>
                <p style="margin:6px 0 0;font-size:14px;color:rgba(255,255,255,0.85);">%s</p>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <p style="margin:0;font-size:15px;color:#111827;line-height:1.7;">
                  Hi %s,
                </p>
                <p style="margin:16px 0 0;font-size:15px;color:#374151;line-height:1.7;">
                  Your <strong>%s</strong> leave request has been reviewed.
                </p>

                <!-- Status badge -->
                <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
                  <tr>
                    <td align="center">
                      <table role="presentation" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="background-color:%s;border:1px solid %s;border-radius:8px;padding:12px 24px;">
                            <span style="font-size:24px;">%s</span>
                            <span style="margin-left:8px;font-size:16px;font-weight:700;color:%s;">%s</span>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>

                <p style="margin:0;font-size:14px;color:#6B7280;line-height:1.7;">
                  Log in to your dashboard to view full details.
                </p>
              </td>
            </tr>
            %s
            """.formatted(status, firstName, leaveType, bgColor, borderColor, icon, color, status, cardFooter("You received this because you have a leave request on file."));
        return wrap(preheader, body);
    }

    // ──────────────────────────────────────────────
    //  Password Reset
    // ──────────────────────────────────────────────

    /**
     * Sent when an employee requests a password reset.
     *
     * @param firstName employee's first name
     * @param resetLink full URL with the reset token
     */
    static String passwordReset(String firstName, String resetLink) {
        String preheader = "We received a request to reset your password.";
        String body = """
            <tr>
              <td style="background:linear-gradient(135deg,#6366F1,#8B5CF6);padding:32px 32px 28px;">
                <h1 style="margin:0;font-size:20px;font-weight:700;color:#FFFFFF;">Reset your password</h1>
                <p style="margin:6px 0 0;font-size:14px;color:rgba(255,255,255,0.85);">Secure your CoralHR account.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <p style="margin:0;font-size:15px;color:#111827;line-height:1.7;">
                  Hi %s,
                </p>
                <p style="margin:16px 0 0;font-size:15px;color:#374151;line-height:1.7;">
                  We received a request to reset the password on your CoralHR account. Click the button below to choose a new one.
                </p>

                %s

                <!-- Warning box -->
                <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" style="margin:24px 0;background-color:#FEF3C7;border-radius:8px;border:1px solid #FDE68A;">
                  <tr>
                    <td style="padding:12px 16px;">
                      <p style="margin:0;font-size:13px;color:#92400E;line-height:1.5;">
                        <strong>⏰ Note:</strong> This link expires in <strong>1 hour</strong>. If you didn't request this, you can safely ignore this email — your password will stay the same.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            %s
            """.formatted(firstName, button(resetLink, "Reset password"), cardFooter("You received this because a password reset was requested for your account."));
        return wrap(preheader, body);
    }
}

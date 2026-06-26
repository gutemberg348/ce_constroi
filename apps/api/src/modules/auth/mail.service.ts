import { Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import nodemailer from "nodemailer";

type PasswordResetEmail = {
  name: string;
  email: string;
  resetUrl: string;
  expiresInMinutes: number;
};

@Injectable()
export class AuthMailService {
  private readonly logger = new Logger(AuthMailService.name);

  constructor(private readonly config: ConfigService) {}

  assertPasswordResetConfigured() {
    const required = ["SMTP_HOST", "SMTP_USER", "SMTP_PASSWORD", "SMTP_FROM"] as const;
    const missing = required.filter((key) => !this.config.get<string>(key)?.trim());

    if (missing.length) {
      this.logger.error(`Password reset email is not configured. Missing: ${missing.join(", ")}`);
      throw new ServiceUnavailableException("O envio de e-mail ainda nao esta configurado.");
    }
  }

  async sendPasswordReset(input: PasswordResetEmail) {
    this.assertPasswordResetConfigured();

    const transporter = nodemailer.createTransport({
      host: this.config.getOrThrow<string>("SMTP_HOST"),
      port: this.config.get<number>("SMTP_PORT", 587),
      secure: this.config.get<boolean>("SMTP_SECURE", false),
      auth: {
        user: this.config.getOrThrow<string>("SMTP_USER"),
        pass: this.config.getOrThrow<string>("SMTP_PASSWORD")
      }
    });

    try {
      await transporter.sendMail({
        from: this.config.getOrThrow<string>("SMTP_FROM"),
        to: input.email,
        subject: "Redefina sua senha - CE Constroi",
        text: [
          `Ola, ${input.name}.`,
          "",
          "Recebemos um pedido para redefinir a senha da sua conta.",
          `Use este link em ate ${input.expiresInMinutes} minutos:`,
          input.resetUrl,
          "",
          "Se voce nao solicitou a troca, ignore este e-mail."
        ].join("\n"),
        html: this.passwordResetHtml(input)
      });
    } catch (error) {
      this.logger.error("Could not send password reset email", error instanceof Error ? error.stack : undefined);
      throw new ServiceUnavailableException("Nao foi possivel enviar o e-mail agora. Tente novamente em instantes.");
    }
  }

  private passwordResetHtml(input: PasswordResetEmail) {
    const name = this.escapeHtml(input.name);
    const resetUrl = this.escapeHtml(input.resetUrl);

    return `
      <main style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px;color:#10213d">
        <p style="font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#1261d8">CE Constroi</p>
        <h1 style="font-size:28px;line-height:1.2;margin:0 0 16px">Redefina sua senha</h1>
        <p>Ola, ${name}. Recebemos um pedido para redefinir a senha da sua conta.</p>
        <p style="margin:28px 0">
          <a href="${resetUrl}" style="display:inline-block;background:#1261d8;color:#ffffff;padding:14px 22px;border-radius:8px;text-decoration:none;font-weight:700">Criar nova senha</a>
        </p>
        <p style="color:#52657f">Este link expira em ${input.expiresInMinutes} minutos e so pode ser usado uma vez.</p>
        <p style="color:#52657f">Se voce nao solicitou a troca, ignore este e-mail.</p>
      </main>`;
  }

  private escapeHtml(value: string) {
    return value.replace(/[&<>'"]/g, (character) => {
      const entities: Record<string, string> = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        '"': "&quot;"
      };
      return entities[character] ?? character;
    });
  }
}

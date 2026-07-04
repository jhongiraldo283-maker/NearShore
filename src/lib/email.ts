import { Resend } from "resend";

export function appUrl(): string {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export function scheduleUrl(token: string): string {
  return `${appUrl()}/schedule/${token}`;
}

export async function sendSchedulingEmail(params: {
  to: string;
  name: string;
  vacancyTitle: string;
  token: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "RESEND_API_KEY is not configured on the server." };
  }

  const from = process.env.RESEND_FROM || "onboarding@resend.com";
  const url = scheduleUrl(params.token);
  const firstName = params.name.split(" ")[0];

  const html = `
    <div style="font-family: Arial, Helvetica, sans-serif; max-width: 480px; margin: 0 auto; color: #0f172a;">
      <p>Hola ${firstName},</p>
      <p>
        Gracias por tu interés en la posición de <strong>${params.vacancyTitle}</strong> en
        Nearshore Business Solutions. Nos gustaría agendar una llamada breve con un
        reclutador.
      </p>
      <p>
        <a href="${url}" style="display: inline-block; background: #4f46e5; color: #ffffff; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 600;">
          Elegir un horario
        </a>
      </p>
      <p style="font-size: 13px; color: #475569;">Si el botón no funciona, copia y pega este link: ${url}</p>
      <p>¡Hablamos pronto!<br />Equipo de Reclutamiento</p>
    </div>
  `;

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to: params.to,
      subject: `Agenda tu llamada para ${params.vacancyTitle}`,
      html,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error sending email.";
    return { ok: false, error: message };
  }
}

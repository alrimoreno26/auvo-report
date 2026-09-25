// Plantilla del correo de acceso (HTML compatible con clientes de correo + versión en texto).
// Sin dependencias: se usa desde la Edge Function y desde la vista previa local (scripts/preview-email.mjs).

export interface AccessEmail {
  /** Nombre de la persona (opcional) */
  name?: string | null
  email: string
  role: 'admin' | 'viewer'
  /** Enlace de un solo uso para crear la contraseña */
  link: string
  /** URL pública de la app (para el pie del correo) */
  appUrl: string
  /** Quién dio el acceso (email o nombre del administrador) */
  invitedBy?: string | null
  /** Vigencia del enlace, en horas */
  expiresInHours: number
  /** invite = alta nueva · resend = reenvío del acceso */
  kind?: 'invite' | 'resend'
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')

/** En pantallas angostas el email solo se corta después de la @ (no en medio del dominio) */
const breakableEmail = (email: string) => esc(email).replace('@', '@<wbr>')

const ROLE = {
  admin: { label: 'Administrador', detail: 'Consulta reportes y gestiona usuarios' },
  viewer: { label: 'Lector', detail: 'Consulta los reportes' },
}

const hours = (h: number) => (h % 24 === 0 ? `${h / 24} ${h === 24 ? 'día' : 'días'}` : `${h} ${h === 1 ? 'hora' : 'horas'}`)

export function renderAccessEmail(e: AccessEmail) {
  const role = ROLE[e.role]
  const resend = e.kind === 'resend'
  const greeting = e.name ? `Hola, ${e.name.split(' ')[0]}` : 'Hola'
  const intro = resend
    ? 'Le enviamos un nuevo enlace para que active su acceso a <b>Auvo Report</b>, donde encontrará los reportes de operación, cumplimiento y calidad de la ejecución en campo.'
    : `${e.invitedBy ? `<b>${esc(e.invitedBy)}</b> le dio` : 'Se le dio'} acceso a <b>Auvo Report</b>, donde encontrará los reportes de operación, cumplimiento y calidad de la ejecución en campo.`
  const subject = resend ? 'Su nuevo enlace de acceso a Auvo Report' : 'Le damos la bienvenida a Auvo Report'
  const preheader = `Cree su contraseña para ingresar con ${e.email}. El enlace vence en ${hours(e.expiresInHours)}.`
  const host = e.appUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')

  // Estilos en línea y tablas: es lo que respetan Gmail, Outlook y Apple Mail
  const html = `<!DOCTYPE html>
<html lang="es" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${esc(subject)}</title>
<!--[if mso]><style>table,td,a{font-family:Arial,Helvetica,sans-serif !important}</style><![endif]-->
<style>
  @media (max-width:600px){
    .container{width:100% !important}
    .px{padding-left:24px !important;padding-right:24px !important}
    .h1{font-size:24px !important}
    .btn a{display:block !important}
    .k{width:74px !important}
  }
</style>
</head>
<body style="margin:0;padding:0;background:#F6F3FC;-webkit-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#F6F3FC;">${esc(preheader)}&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F6F3FC;">
<tr><td align="center" style="padding:32px 12px;">

  <table role="presentation" class="container" width="560" cellpadding="0" cellspacing="0" border="0" style="width:560px;max-width:560px;">

    <!-- Marca -->
    <tr><td style="padding:0 4px 18px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
        <td width="28" height="28" align="center" valign="middle" bgcolor="#5B21B6" style="width:28px;height:28px;border-radius:7px;background:#5B21B6;color:#ffffff;font:800 14px/28px 'Segoe UI',Arial,Helvetica,sans-serif;">A</td>
        <td style="padding-left:10px;font:700 15px/1 'Segoe UI',Arial,Helvetica,sans-serif;color:#221D2E;">Auvo Report</td>
      </tr></table>
    </td></tr>

    <!-- Tarjeta -->
    <tr><td style="background:#ffffff;border:1px solid #E8E3F3;border-radius:16px;overflow:hidden;">

      <!-- Encabezado -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td class="px" bgcolor="#5B21B6" style="background:#5B21B6;background-image:linear-gradient(135deg,#7B39EC 0%,#5B21B6 55%,#4E1E9A 100%);padding:36px 40px 32px;border-radius:16px 16px 0 0;">
          <div style="font:600 11px/1.4 'Segoe UI',Arial,Helvetica,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#DDD6FE;">${resend ? 'Acceso a la plataforma' : 'Invitación'}</div>
          <h1 class="h1" style="margin:8px 0 0;font:800 28px/1.2 'Segoe UI',Arial,Helvetica,sans-serif;color:#ffffff;">${resend ? 'Active su acceso' : 'Le damos la bienvenida'}</h1>
        </td></tr>
      </table>

      <!-- Cuerpo -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td class="px" style="padding:32px 40px 8px;font:400 15px/1.6 'Segoe UI',Arial,Helvetica,sans-serif;color:#3D3750;">
          <p style="margin:0 0 14px;color:#221D2E;font-weight:600;">${esc(greeting)}:</p>
          <p style="margin:0 0 22px;">${intro}</p>

          <!-- Datos de acceso -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F6F3FC;border:1px solid #E8E3F3;border-radius:12px;">
            <tr><td style="padding:16px 20px 6px;font:700 11px/1 'Segoe UI',Arial,Helvetica,sans-serif;letter-spacing:.1em;text-transform:uppercase;color:#8E88A3;">Sus datos de acceso</td></tr>
            <tr><td style="padding:6px 20px 16px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font:400 14px/1.5 'Segoe UI',Arial,Helvetica,sans-serif;">
                <tr>
                  <td class="k" width="96" style="padding:6px 0;color:#5B5670;">Usuario</td>
                  <td style="padding:6px 0;color:#221D2E;font-weight:600;"><a href="mailto:${esc(e.email)}" style="color:#221D2E;text-decoration:none;">${breakableEmail(e.email)}</a></td>
                </tr>
                <tr>
                  <td class="k" width="96" style="padding:6px 0;color:#5B5670;border-top:1px solid #E8E3F3;">Rol</td>
                  <td style="padding:6px 0;color:#221D2E;border-top:1px solid #E8E3F3;"><b>${role.label}</b> <span style="color:#8E88A3;">· ${role.detail}</span></td>
                </tr>
                <tr>
                  <td class="k" width="96" style="padding:6px 0;color:#5B5670;border-top:1px solid #E8E3F3;">Dirección</td>
                  <td style="padding:6px 0;border-top:1px solid #E8E3F3;"><a href="${esc(e.appUrl)}" style="color:#7C3AED;text-decoration:none;font-weight:600;">${esc(host)}</a></td>
                </tr>
              </table>
            </td></tr>
          </table>

          <p style="margin:24px 0 20px;">Para ingresar por primera vez, cree su contraseña con el siguiente botón:</p>

          <!-- Botón (compatible con Outlook) -->
          <table role="presentation" class="btn" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 22px;">
            <tr><td align="center" bgcolor="#5B21B6" style="border-radius:10px;background:#5B21B6;">
              <!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="${esc(e.link)}" style="height:48px;v-text-anchor:middle;width:240px;" arcsize="20%" fillcolor="#5B21B6" stroke="f"><center style="color:#ffffff;font:700 15px Arial,sans-serif;">Crear mi contraseña</center></v:roundrect><![endif]-->
              <!--[if !mso]><!-->
              <a href="${esc(e.link)}" target="_blank" style="display:inline-block;padding:14px 32px;font:700 15px/20px 'Segoe UI',Arial,Helvetica,sans-serif;color:#ffffff;text-decoration:none;border-radius:10px;">Crear mi contraseña &rarr;</a>
              <!--<![endif]-->
            </td></tr>
          </table>

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr><td style="padding:12px 16px;background:#FEF6E7;border-radius:10px;font:400 13px/1.5 'Segoe UI',Arial,Helvetica,sans-serif;color:#92400E;">
              El enlace es personal, se puede usar una sola vez y vence en <b>${hours(e.expiresInHours)}</b>. Si vence, solicite a su administrador que le reenvíe el acceso.
            </td></tr>
          </table>

          <p style="margin:22px 0 6px;font-size:13px;color:#8E88A3;">¿El botón no funciona? Copie y pegue este enlace en su navegador:</p>
          <p style="margin:0 0 28px;font-size:12px;line-height:1.5;word-break:break-all;"><a href="${esc(e.link)}" style="color:#7C3AED;text-decoration:underline;">${esc(e.link)}</a></p>
        </td></tr>

        <tr><td class="px" style="padding:20px 40px 28px;border-top:1px solid #F1EEF8;font:400 13px/1.6 'Segoe UI',Arial,Helvetica,sans-serif;color:#5B5670;">
          Después de crear su contraseña podrá ingresar en cualquier momento desde
          <a href="${esc(e.appUrl)}" style="color:#7C3AED;text-decoration:none;font-weight:600;">${esc(host)}</a>
          con su correo y contraseña.
        </td></tr>
      </table>

    </td></tr>

    <!-- Pie -->
    <tr><td style="padding:22px 12px 0;text-align:center;font:400 12px/1.6 'Segoe UI',Arial,Helvetica,sans-serif;color:#8E88A3;">
      Recibió este correo porque se creó una cuenta en Auvo Report para ${esc(e.email)}.<br>
      Si no esperaba este mensaje, puede ignorarlo: sin crear la contraseña, la cuenta no se puede usar.
    </td></tr>
    <tr><td style="padding:10px 12px 0;text-align:center;font:600 12px/1.6 'Segoe UI',Arial,Helvetica,sans-serif;color:#B7B1C9;">
      Auvo Report · Reportes de Customer Success
    </td></tr>

  </table>

</td></tr>
</table>
</body>
</html>`

  const text = [
    `${greeting}:`,
    '',
    resend
      ? 'Le enviamos un nuevo enlace para que active su acceso a Auvo Report.'
      : `${e.invitedBy ? `${e.invitedBy} le dio` : 'Se le dio'} acceso a Auvo Report, donde encontrará los reportes de operación, cumplimiento y calidad de la ejecución en campo.`,
    '',
    'SUS DATOS DE ACCESO',
    `Usuario:   ${e.email}`,
    `Rol:       ${role.label} (${role.detail.toLowerCase()})`,
    `Dirección: ${e.appUrl}`,
    '',
    'Para ingresar por primera vez, cree su contraseña en este enlace:',
    e.link,
    '',
    `El enlace es personal, se puede usar una sola vez y vence en ${hours(e.expiresInHours)}.`,
    'Si vence, solicite a su administrador que le reenvíe el acceso.',
    '',
    '—',
    'Auvo Report · Reportes de Customer Success',
    'Si no esperaba este mensaje, puede ignorarlo.',
  ].join('\n')

  return { subject, html, text }
}

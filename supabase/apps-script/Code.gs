function doPost(e) {
  try {
    const config = PropertiesService.getScriptProperties();
    const secretConfigurado = config.getProperty("SHARED_SECRET");
    const dados = JSON.parse(e.postData?.contents || "{}");

    if (!secretConfigurado || dados.secret !== secretConfigurado) {
      return responder({ ok: false, error: "Acesso não autorizado." });
    }

    const destinatario = String(dados.to || "").trim();
    const codigo = String(dados.code || "").trim();
    const nomeUsuario = String(dados.userName || "Usuário").trim();

    if (!destinatario || !destinatario.includes("@")) {
      return responder({ ok: false, error: "Destinatário inválido." });
    }

    if (!/^\d{6}$/.test(codigo)) {
      return responder({ ok: false, error: "Código de recuperação inválido." });
    }

    const assunto = "Código para redefinir sua senha";
    const codigoFormatado = codigo.slice(0, 3) + " " + codigo.slice(3);
    const appUrl = "https://diario-bordo-trevo.pages.dev";
    const logoUrl = appUrl + "/branding/logo-app.png";

    const texto =
      "Olá, " + nomeUsuario + ".\n\n" +
      "Recebemos uma solicitação para redefinir sua senha do Diário de Bordo Trevo.\n\n" +
      "Código: " + codigo + "\n\n" +
      "O código é válido por 10 minutos.\n\n" +
      "Se você não solicitou esta alteração, ignore esta mensagem.\n\n" +
      "Acesse: " + appUrl + "\n\n" +
      "2026 Trevo Ehrmann | Developed by: Ana Peliteiro";

    const html = `
      <div style="margin:0;padding:0;background:#eef3f7;font-family:Arial,Helvetica,sans-serif;color:#10243b;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#eef3f7;">
          <tr>
            <td align="center" style="padding:34px 14px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background:#ffffff;border:1px solid #d7e0e8;border-radius:24px;overflow:hidden;box-shadow:0 16px 42px rgba(15,47,79,.10);">
                <tr>
                  <td align="center" style="background:#0f2f4f;padding:28px 28px 24px;">
                    <img src="${logoUrl}" alt="Diário de Bordo Trevo" width="74" style="display:block;width:74px;height:74px;object-fit:contain;margin:0 auto 14px;border:0;outline:none;text-decoration:none;">
                    <div style="font-size:23px;line-height:1.25;font-weight:700;color:#ffffff;">Diário de Bordo Trevo</div>
                    <div style="margin-top:6px;font-size:14px;line-height:1.5;color:#cbd9e5;">Sistema de Passagem de Turno</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 28px;background:#ffffff;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="height:4px;background:#17456f;width:58%;font-size:0;line-height:0;">&nbsp;</td>
                        <td style="height:4px;background:#d5a74f;width:18%;font-size:0;line-height:0;">&nbsp;</td>
                        <td style="height:4px;background:#3f8a69;width:24%;font-size:0;line-height:0;">&nbsp;</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:34px 34px 14px;">
                    <div style="font-size:22px;line-height:1.3;font-weight:700;color:#10243b;">Código de recuperação</div>
                    <p style="margin:18px 0 0;font-size:16px;line-height:1.6;color:#40566d;">Olá, <strong style="color:#10243b;">${escaparHtml(nomeUsuario)}</strong>.</p>
                    <p style="margin:10px 0 0;font-size:15px;line-height:1.65;color:#617487;">Recebemos uma solicitação para redefinir sua senha. Utilize o código abaixo no aplicativo.</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 34px 10px;">
                    <div style="padding:24px 18px;border-radius:18px;background:#edf3f8;border:1px solid #cbd9e5;text-align:center;box-shadow:0 8px 20px rgba(23,69,111,.08);">
                      <div style="font-family:'Courier New',Courier,monospace;font-size:38px;line-height:1;font-weight:700;letter-spacing:8px;color:#17456f;">${codigoFormatado}</div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 34px 8px;">
                    <div style="padding:16px 18px;border-radius:14px;background:#fff5dd;border:1px solid #efd69b;">
                      <div style="font-size:14px;line-height:1.45;font-weight:700;color:#8a651c;">Código válido por 10 minutos</div>
                      <div style="margin-top:5px;font-size:13px;line-height:1.55;color:#765f32;">Se você não solicitou esta alteração, ignore este e-mail.</div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding:20px 34px 32px;">
                    <a href="${appUrl}" target="_blank" style="display:inline-block;background:#17456f;color:#ffffff;text-decoration:none;font-size:15px;line-height:1;font-weight:700;padding:16px 26px;border-radius:14px;box-shadow:0 8px 18px rgba(23,69,111,.18);">Abrir Diário de Bordo Trevo</a>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding:18px 24px;background:#f7f9fb;border-top:1px solid #e1e7ed;color:#748495;font-size:12px;line-height:1.5;">2026 Trevo Ehrmann | Developed by: Ana Peliteiro</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </div>
    `;

    GmailApp.sendEmail(destinatario, assunto, texto, {
      name: "Diário de Bordo Trevo",
      htmlBody: html,
      replyTo: "diariodebordoap@gmail.com"
    });

    return responder({ ok: true });
  } catch (erro) {
    console.error(erro);
    return responder({ ok: false, error: "Não foi possível enviar o e-mail." });
  }
}

function responder(conteudo) {
  return ContentService
    .createTextOutput(JSON.stringify(conteudo))
    .setMimeType(ContentService.MimeType.JSON);
}

function escaparHtml(valor) {
  return String(valor)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

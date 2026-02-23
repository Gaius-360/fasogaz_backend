// ==========================================
// FICHIER: utils/sendEmail.js
// ✅ Remplace sendSMS.js - Envoi des OTP par email via Nodemailer
// ==========================================
const nodemailer = require('nodemailer');

// ============================================
// CONFIGURATION DU TRANSPORTEUR SMTP
// ============================================
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true', // true pour port 465, false pour 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  tls: {
    rejectUnauthorized: false // Utile en développement
  }
});

// ============================================
// VÉRIFICATION DE LA CONNEXION SMTP
// ============================================
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Erreur connexion SMTP:', error.message);
  } else {
    console.log('✅ Serveur SMTP prêt à envoyer des emails');
  }
});

// ============================================
// FONCTION PRINCIPALE D'ENVOI D'EMAIL
// ============================================
const sendEmail = async (to, subject, htmlContent) => {
  try {
    const info = await transporter.sendMail({
      from: `"FasoGaz" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to,
      subject,
      html: htmlContent
    });

    console.log(`📧 Email envoyé à ${to} - MessageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Erreur envoi email:', error.message);
    return { success: false, message: error.message };
  }
};

// ============================================
// EMAIL OTP INSCRIPTION / VÉRIFICATION
// ============================================
const sendOTPEmail = async (to, otp, firstName = '') => {
  const html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <title>Code de vérification FasoGaz</title>
    </head>
    <body style="margin:0;padding:0;background-color:#f3f4f6;font-family:Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;padding:40px 20px;">
        <tr>
          <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
              
              <!-- HEADER -->
              <tr>
                <td style="background:linear-gradient(135deg,#dc2626,#ea580c);padding:32px 40px;text-align:center;">
                  <h1 style="margin:0;font-size:32px;font-weight:900;letter-spacing:2px;color:#ffffff;">
                    <span style="color:#fbbf24;">F</span><span style="color:#ffffff;">a</span><span style="color:#ffffff;">s</span><span style="color:#4ade80;">o</span><span style="color:#fbbf24;">G</span><span style="color:#ffffff;">a</span><span style="color:#4ade80;">z</span>
                  </h1>
                  <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Votre plateforme de gaz au Burkina Faso</p>
                </td>
              </tr>

              <!-- BODY -->
              <tr>
                <td style="padding:40px;">
                  <h2 style="margin:0 0 16px;color:#1f2937;font-size:22px;">
                    Bonjour${firstName ? ' <strong>' + firstName + '</strong>' : ''} 👋
                  </h2>
                  <p style="margin:0 0 24px;color:#4b5563;font-size:15px;line-height:1.6;">
                    Merci de vous être inscrit sur <strong>FasoGaz</strong> ! Pour activer votre compte, veuillez utiliser le code de vérification ci-dessous :
                  </p>

                  <!-- OTP BOX -->
                  <div style="background:#f9fafb;border:2px dashed #e5e7eb;border-radius:12px;padding:28px;text-align:center;margin:0 0 24px;">
                    <p style="margin:0 0 8px;color:#6b7280;font-size:13px;text-transform:uppercase;letter-spacing:1px;">Votre code de vérification</p>
                    <span style="display:inline-block;font-size:46px;font-weight:900;letter-spacing:14px;color:#1f2937;font-family:'Courier New',monospace;">${otp}</span>
                  </div>

                  <p style="margin:0 0 8px;color:#6b7280;font-size:14px;">
                    ⏱️ Ce code est valable pendant <strong style="color:#1f2937;">10 minutes</strong>.
                  </p>
                  <p style="margin:0 0 0;color:#6b7280;font-size:14px;">
                    🔒 Si vous n'avez pas créé de compte sur FasoGaz, ignorez simplement cet email.
                  </p>
                </td>
              </tr>

              <!-- FOOTER -->
              <tr>
                <td style="background:#f9fafb;padding:24px 40px;border-top:1px solid #e5e7eb;text-align:center;">
                  <p style="margin:0;color:#9ca3af;font-size:12px;">
                    © 2024 FasoGaz · Ouagadougou, Burkina Faso
                  </p>
                  <p style="margin:8px 0 0;color:#9ca3af;font-size:12px;">
                    Cet email a été envoyé automatiquement, merci de ne pas y répondre.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return sendEmail(to, '🔐 Votre code de vérification FasoGaz', html);
};

// ============================================
// EMAIL OTP RÉINITIALISATION MOT DE PASSE
// ============================================
const sendPasswordResetEmail = async (to, otp, firstName = '') => {
  const html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <title>Réinitialisation mot de passe FasoGaz</title>
    </head>
    <body style="margin:0;padding:0;background-color:#f3f4f6;font-family:Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;padding:40px 20px;">
        <tr>
          <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
              
              <!-- HEADER -->
              <tr>
                <td style="background:linear-gradient(135deg,#dc2626,#ea580c);padding:32px 40px;text-align:center;">
                  <h1 style="margin:0;font-size:32px;font-weight:900;letter-spacing:2px;color:#ffffff;">
                    <span style="color:#fbbf24;">F</span><span style="color:#ffffff;">a</span><span style="color:#ffffff;">s</span><span style="color:#4ade80;">o</span><span style="color:#fbbf24;">G</span><span style="color:#ffffff;">a</span><span style="color:#4ade80;">z</span>
                  </h1>
                  <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Réinitialisation de mot de passe</p>
                </td>
              </tr>

              <!-- BODY -->
              <tr>
                <td style="padding:40px;">
                  <h2 style="margin:0 0 16px;color:#1f2937;font-size:22px;">
                    Bonjour${firstName ? ' <strong>' + firstName + '</strong>' : ''} 🔑
                  </h2>
                  <p style="margin:0 0 24px;color:#4b5563;font-size:15px;line-height:1.6;">
                    Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte <strong>FasoGaz</strong>. Utilisez le code ci-dessous :
                  </p>

                  <!-- OTP BOX -->
                  <div style="background:#fffbeb;border:2px dashed #f59e0b;border-radius:12px;padding:28px;text-align:center;margin:0 0 24px;">
                    <p style="margin:0 0 8px;color:#92400e;font-size:13px;text-transform:uppercase;letter-spacing:1px;">Code de réinitialisation</p>
                    <span style="display:inline-block;font-size:46px;font-weight:900;letter-spacing:14px;color:#92400e;font-family:'Courier New',monospace;">${otp}</span>
                  </div>

                  <p style="margin:0 0 8px;color:#6b7280;font-size:14px;">
                    ⏱️ Ce code expire dans <strong style="color:#1f2937;">10 minutes</strong>.
                  </p>
                  <p style="margin:0 0 0;color:#ef4444;font-size:14px;">
                    ⚠️ Si vous n'avez pas demandé de réinitialisation, sécurisez votre compte immédiatement en contactant notre support.
                  </p>
                </td>
              </tr>

              <!-- FOOTER -->
              <tr>
                <td style="background:#f9fafb;padding:24px 40px;border-top:1px solid #e5e7eb;text-align:center;">
                  <p style="margin:0;color:#9ca3af;font-size:12px;">
                    © 2024 FasoGaz · Ouagadougou, Burkina Faso
                  </p>
                  <p style="margin:8px 0 0;color:#9ca3af;font-size:12px;">
                    Cet email a été envoyé automatiquement, merci de ne pas y répondre.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return sendEmail(to, '🔑 Réinitialisation de votre mot de passe FasoGaz', html);
};

module.exports = { sendEmail, sendOTPEmail, sendPasswordResetEmail };
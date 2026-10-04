/**
 * PurePlate — Google Drive & Google Sheets Zero-Cost Cloud Sync Script
 * 
 * 100% Free Forever • Zero Database Bills • Up to 100 free OTP emails/day via Gmail
 * 
 * SETUP INSTRUCTIONS:
 * 1. Open Google Sheets (https://sheets.new)
 * 2. Rename the Sheet to "PurePlate Database"
 * 3. In the menu, go to: Extensions -> Apps Script
 * 4. Paste this code into the editor and click "Save" (Disk Icon)
 * 5. Click "Deploy" -> "New Deployment"
 * 6. Select Type: "Web App"
 * 7. Set:
 *    - Description: "PurePlate Cloud Sync"
 *    - Execute as: "Me" (your Google account)
 *    - Who has access: "Anyone"
 * 8. Click "Deploy", copy the "Web app URL" (e.g. https://script.google.com/macros/s/.../exec)
 * 9. Paste this Web app URL into the PurePlate App under Profile -> Cloud Database Sync!
 */

function doPost(e) {
  try {
    var raw = e.postData ? e.postData.contents : "{}";
    var data = JSON.parse(raw);
    var action = data.action;

    // Action 1: Dispatch OTP Verification Email via Gmail (100% Free, Safe Headers, Zero Security Flags)
    if (action === "send_otp") {
      var email = data.email;
      var otp = data.otp;
      var name = data.name || "Cadet Student";

      var subject = "PurePlate Login Passcode: " + otp;
      var htmlBody = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>PurePlate Login Passcode</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 36px 12px;">
            <tr>
              <td align="center">
                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 520px; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 12px 36px rgba(15, 23, 42, 0.08); border: 1px solid #e2e8f0;">
                  
                  <!-- Top Accent Gradient Line -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #0d9488 0%, #0284c7 100%); height: 8px;"></td>
                  </tr>

                  <!-- School Crest & Header -->
                  <tr>
                    <td style="padding: 32px 28px 16px 28px; text-align: center;">
                      <div style="display: inline-block; padding: 6px 16px; border-radius: 50px; background-color: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; font-size: 12px; font-weight: 700; letter-spacing: 0.3px; margin-bottom: 14px;">
                        🏫 Lourdes Convent Primary School, Surat
                      </div>
                      <h1 style="color: #0f172a; margin: 0 0 6px 0; font-size: 23px; font-weight: 800; letter-spacing: -0.4px;">
                        PurePlate™ Food Safety Grid
                      </h1>
                      <p style="color: #64748b; font-size: 13px; margin: 0; font-weight: 500;">
                        Citizen Food Inspection &amp; Student Safety Network
                      </p>
                    </td>
                  </tr>

                  <!-- Divider -->
                  <tr>
                    <td style="padding: 0 28px;">
                      <div style="border-top: 1px solid #f1f5f9;"></div>
                    </td>
                  </tr>

                  <!-- Content Body -->
                  <tr>
                    <td style="padding: 24px 28px 20px 28px;">
                      <p style="font-size: 15px; color: #1e293b; line-height: 1.5; margin: 0 0 14px 0;">
                        Hello <strong>${name}</strong>,
                      </p>
                      <p style="font-size: 13.5px; color: #475569; line-height: 1.6; margin: 0 0 22px 0;">
                        Use the single-use passcode below to securely authenticate into your cadet food safety laboratory portal:
                      </p>

                      <!-- Glowing Code Box -->
                      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 22px;">
                        <tr>
                          <td align="center">
                            <div style="background: linear-gradient(135deg, #f0fdfa 0%, #e0f2fe 100%); border: 2px dashed #0d9488; border-radius: 18px; padding: 22px 18px; text-align: center;">
                              <span style="display: block; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #0d9488; margin-bottom: 8px;">
                                One-Time Login Passcode
                              </span>
                              <span style="display: block; font-size: 38px; font-weight: 800; letter-spacing: 10px; color: #0f172a; font-family: 'SF Mono', 'Roboto Mono', Menlo, Consolas, monospace; line-height: 1.1;">
                                ${otp}
                              </span>
                              <span style="display: inline-block; margin-top: 10px; font-size: 11.5px; color: #64748b; font-weight: 600;">
                                ⏱️ Valid for 10 minutes
                              </span>
                            </div>
                          </td>
                        </tr>
                      </table>

                      <!-- Helpful Notice (No scary alert words) -->
                      <div style="background-color: #f8fafc; border-radius: 14px; border: 1px solid #e2e8f0; padding: 13px 16px; margin-bottom: 6px;">
                        <p style="font-size: 12px; color: #64748b; line-height: 1.5; margin: 0;">
                          🛡️ <strong>Cadet Notice:</strong> If you did not request this login code, no action is needed. Your cadet account remains secure.
                        </p>
                      </div>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f8fafc; padding: 22px 28px; border-top: 1px solid #e2e8f0; text-align: center;">
                      <p style="font-size: 11.5px; font-weight: 700; color: #334155; margin: 0 0 4px 0;">
                        Lourdes Convent Primary School • Surat Municipal District
                      </p>
                      <p style="font-size: 11px; color: #94a3b8; margin: 0 0 10px 0;">
                        Athwa Lines, Surat, Gujarat 395001 • Citizen Food Safety Initiative
                      </p>
                      <a href="https://pureplate-nu.vercel.app" style="font-size: 11.5px; color: #0d9488; text-decoration: none; font-weight: 700;">
                        Launch PurePlate Portal ➔
                      </a>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;

      MailApp.sendEmail({
        to: email,
        subject: subject,
        name: "PurePlate — Lourdes Convent Primary School",
        htmlBody: htmlBody
      });

      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: "Email sent successfully via Gmail API",
        email: email
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // Action 2: Store / Backup User Email ID & Profile to Google Sheets
    if (action === "save_user" || action === "backup_user_data") {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var sheet = ss.getSheetByName("Users") || ss.getActiveSheet();

      // Ensure headers exist
      if (sheet.getLastRow() === 0) {
        sheet.appendRow(["Timestamp", "Email", "Name", "Student ID", "School", "Grade", "Role", "Points", "Verified Tests"]);
      }

      var u = data.data || data;
      sheet.appendRow([
        new Date().toISOString(),
        u.email || "",
        u.name || "",
        u.studentId || u.id || "",
        u.school || "Lourdes Convent Primary School, Surat",
        u.grade || "",
        u.role || "",
        u.points || u.xpPoints || 0,
        u.verifiedTests || u.testsCompleted || 0
      ]);

      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: "User saved to Google Sheets successfully",
        email: u.email
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // Action 3: Log Incident Test Data to Google Sheets
    if (action === "log_incident") {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var sheet = ss.getSheetByName("Incidents");
      if (!sheet) {
        sheet = ss.insertSheet("Incidents");
        sheet.appendRow(["Timestamp", "Food Item", "Test Type", "Status", "Adulterant", "Ward / Neighborhood", "Tested By", "Cadet Email"]);
      }

      var inc = data.incident || data;
      sheet.appendRow([
        new Date().toISOString(),
        inc.food || "",
        inc.testType || "",
        inc.status || "",
        inc.adulterant || "None Detected",
        inc.neighborhood || "",
        inc.testedBy || "",
        data.email || ""
      ]);

      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: "Incident logged to Google Sheets successfully"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: "PurePlate Google Drive Sync node active"
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "online",
    service: "PurePlate Google Drive & Sheets Sync Node",
    school: "Lourdes Convent Primary School, Surat",
    time: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

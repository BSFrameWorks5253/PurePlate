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

    // Action 1: Dispatch OTP Verification Email via Gmail (100% Free)
    if (action === "send_otp") {
      var email = data.email;
      var otp = data.otp;
      var name = data.name || "Cadet";

      var subject = "PurePlate Security Verification Code: " + otp;
      var htmlBody = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 20px; background: #ffffff;">
          <div style="text-align: center; margin-bottom: 20px;">
            <div style="display: inline-block; padding: 10px 18px; border-radius: 14px; background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; font-size: 13px; font-weight: 700;">
              🏫 Lourdes Convent Primary School, Surat
            </div>
            <h2 style="color: #0f172a; margin: 14px 0 4px 0; font-size: 22px;">PurePlate Verification Code</h2>
            <p style="color: #64748b; font-size: 13px; margin: 0;">Citizen Food Safety Network — Student Authentication</p>
          </div>

          <div style="background: #f8fafc; border-radius: 16px; padding: 20px; border: 1px solid #e2e8f0; text-align: center; margin-bottom: 20px;">
            <p style="font-size: 13px; color: #475569; margin: 0 0 10px 0;">Hello <strong>${name}</strong>, use the 6-digit code below to log in:</p>
            <div style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #0d9488; font-family: monospace; padding: 14px; background: #ffffff; border-radius: 12px; border: 2px dashed #0d9488; display: inline-block;">
              ${otp}
            </div>
            <p style="font-size: 11px; color: #94a3b8; margin: 10px 0 0 0;">⏱️ This verification code expires in 10 minutes.</p>
          </div>

          <p style="font-size: 12px; color: #64748b; line-height: 1.5; margin: 0;">
            If you did not request this verification code, please ignore this email. No changes will be made to your Cadet account.
          </p>
        </div>
      `;

      MailApp.sendEmail({
        to: email,
        subject: subject,
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
        u.grade || "Class 7-A",
        u.role || "Cadet Food Inspector",
        u.points || 0,
        u.testsCompleted || u.verifiedTests || 0
      ]);

      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: "User stored in Google Drive Spreadsheet successfully"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // Action 3: Store Incident / Test Log to Google Sheets
    if (action === "log_incident") {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var incidentSheet = ss.getSheetByName("TestLogs");
      if (!incidentSheet) {
        incidentSheet = ss.insertSheet("TestLogs");
        incidentSheet.appendRow(["Timestamp", "Food", "Test Type", "Status", "Adulterant", "Ward", "Road", "Score", "Inspector Name"]);
      }

      var inc = data.incident || data;
      incidentSheet.appendRow([
        new Date().toISOString(),
        inc.food || "",
        inc.testType || "",
        inc.status || "",
        inc.adulterant || "",
        inc.ward || inc.neighborhood || "Surat",
        inc.road || "",
        inc.score || 0,
        inc.inspectorName || data.name || "Cadet"
      ]);

      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: "Incident logged to Google Drive Sheet"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: "Ping received"
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "online",
    name: "PurePlate Google Drive Sync Service",
    school: "Lourdes Convent Primary School, Surat"
  })).setMimeType(ContentService.MimeType.JSON);
}

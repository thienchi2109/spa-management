// Script to fix appointments headers in Google Sheets
const { google } = require('googleapis');
require('dotenv').config();

async function fixAppointmentsHeaders() {
    try {
        // Initialize Google Sheets API
        const credentialsString = process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS;
        if (!credentialsString) {
            throw new Error('GOOGLE_SERVICE_ACCOUNT_CREDENTIALS not found in environment');
        }
        const credentials = JSON.parse(credentialsString);

        const auth = new google.auth.GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const authClient = await auth.getClient();
        const sheets = google.sheets({ version: 'v4', auth: authClient });

        const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
        const sheetName = 'Appointments';

        // New headers with services and schedulerName
        const newHeaders = [
            'id', 'patientName', 'doctorName', 'schedulerName',
            'date', 'startTime', 'endTime', 'status', 'services', 'notes'
        ];

        console.log('🔄 Updating appointments headers...');

        // Update the header row
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `${sheetName}!A1:J1`,
            valueInputOption: 'RAW',
            requestBody: {
                values: [newHeaders],
            },
        });

        console.log('✅ Headers updated successfully!');
        console.log('📋 New headers:', newHeaders);

        // Get current data to check
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `${sheetName}!A:J`,
        });

        const data = response.data.values || [];
        console.log(`📊 Total rows in sheet: ${data.length}`);

        if (data.length > 1) {
            console.log('🔍 Sample data row:', data[1]);
        }

    } catch (error) {
        console.error('❌ Error fixing headers:', error);
    }
}

fixAppointmentsHeaders();
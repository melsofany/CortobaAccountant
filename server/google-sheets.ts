import { google } from 'googleapis';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings?.settings?.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-sheet',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings?.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('Google Sheet not connected. Please set up Google Sheets integration in Replit.');
  }
  return accessToken;
}

// WARNING: Never cache this client.
// Access tokens expire, so a new client must be created each time.
// Always call this function again to get a fresh client.
export async function getUncachableGoogleSheetClient() {
  const accessToken = await getAccessToken();

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken
  });

  return google.sheets({ version: 'v4', auth: oauth2Client });
}

// Spreadsheet ID - this will be created automatically if it doesn't exist
const SPREADSHEET_NAME = 'Qurtubah Accounting System';
const SHEET_NAME = 'Payments';

let cachedSpreadsheetId: string | null = null;

async function getOrCreateSpreadsheet() {
  if (cachedSpreadsheetId) {
    return cachedSpreadsheetId;
  }

  const sheets = await getUncachableGoogleSheetClient();
  const drive = google.drive({ version: 'v3', auth: (await getUncachableGoogleSheetClient()).context._options.auth });
  
  try {
    // Search for existing spreadsheet by name
    const searchResponse = await drive.files.list({
      q: `name='${SPREADSHEET_NAME}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`,
      fields: 'files(id, name)',
      spaces: 'drive',
    });

    if (searchResponse.data.files && searchResponse.data.files.length > 0) {
      // Found existing spreadsheet
      cachedSpreadsheetId = searchResponse.data.files[0].id!;
      console.log('Found existing spreadsheet:', cachedSpreadsheetId);
      return cachedSpreadsheetId;
    }

    // Create new spreadsheet if not found
    console.log('Creating new spreadsheet...');
    const createResponse = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title: SPREADSHEET_NAME,
        },
        sheets: [
          {
            properties: {
              title: SHEET_NAME,
            },
          },
        ],
      },
    });

    cachedSpreadsheetId = createResponse.data.spreadsheetId!;
    console.log('Created new spreadsheet:', cachedSpreadsheetId);

    // Initialize headers
    await sheets.spreadsheets.values.update({
      spreadsheetId: cachedSpreadsheetId,
      range: `${SHEET_NAME}!A1:Q1`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [[
          'ID',
          'Supplier Name',
          'Amount',
          'Payment Date',
          'Description',
          'Quotation Number',
          'Purchase Order Number',
          'Includes VAT',
          'VAT Amount',
          'Total Amount',
          'Is Settled',
          'Settlement Amount',
          'Settlement Date',
          'Settlement Notes',
          'Payment Type',
          'Expense Category',
          'Created At',
        ]],
      },
    });

    return cachedSpreadsheetId;
  } catch (error) {
    console.error('Error getting/creating spreadsheet:', error);
    throw error;
  }
}

export async function getAllRows() {
  const spreadsheetId = await getOrCreateSpreadsheet();
  const sheets = await getUncachableGoogleSheetClient();
  
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${SHEET_NAME}!A2:Q`,
  });

  return response.data.values || [];
}

export async function appendRow(values: any[]) {
  const spreadsheetId = await getOrCreateSpreadsheet();
  const sheets = await getUncachableGoogleSheetClient();
  
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${SHEET_NAME}!A:Q`,
    valueInputOption: 'RAW',
    requestBody: {
      values: [values],
    },
  });
}

export async function updateRow(rowIndex: number, values: any[]) {
  const spreadsheetId = await getOrCreateSpreadsheet();
  const sheets = await getUncachableGoogleSheetClient();
  
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${SHEET_NAME}!A${rowIndex}:Q${rowIndex}`,
    valueInputOption: 'RAW',
    requestBody: {
      values: [values],
    },
  });
}

export async function deleteRow(rowIndex: number) {
  const spreadsheetId = await getOrCreateSpreadsheet();
  const sheets = await getUncachableGoogleSheetClient();
  
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: 0,
              dimension: 'ROWS',
              startIndex: rowIndex - 1,
              endIndex: rowIndex,
            },
          },
        },
      ],
    },
  });
}

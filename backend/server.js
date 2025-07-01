const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors());
app.use(express.json());

// Helper: Get Microsoft Graph access token
async function getAccessToken({ clientId, tenantId, clientSecret }) {
  const params = new URLSearchParams();
  params.append('client_id', clientId);
  params.append('scope', 'https://graph.microsoft.com/.default');
  params.append('client_secret', clientSecret);
  params.append('grant_type', 'client_credentials');

  const response = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error('Token error: ' + error);
  }
  return (await response.json()).access_token;
}

// POST /send-email
app.post('/send-email', async (req, res) => {
  const { clientId, tenantId, clientSecret, sender, recipients, subject, htmlContent } = req.body;

  try {
    // 1. Get access token
    const accessToken = await getAccessToken({ clientId, tenantId, clientSecret });

    // 2. Prepare email payload
    const emailPayload = {
      message: {
        subject: subject,
        body: {
          contentType: 'HTML',
          content: htmlContent
        },
        toRecipients: (Array.isArray(recipients) ? recipients : [recipients]).map(email => ({
          emailAddress: { address: email }
        }))
      }
    };

    // 3. Send email via Microsoft Graph
    const response = await fetch(`https://graph.microsoft.com/v1.0/users/${sender}/sendMail`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailPayload)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error('SendMail error: ' + error);
    }

    res.json({ success: true, message: 'Email sent successfully!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3001, () => console.log('Server running on port 3001'));
export const generateSupportEmailHTML = (data) => {
  const FirstName = data.firstname || "Bounty";
  const LastName = data.lastname || "Hunter";
  const Email = data.email || "customer@gmail.com";
  const Subject = data.subject || "Anonymous";
  const Message = data.message || "This is going to be a dummy message";
  const timestamp = new Date().toLocaleString('en-US', {
    dateStyle: 'full',
    timeStyle: 'short'
  });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Customer Support Request</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: #0a0a0a;
        }
        .email-container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #1a1a1a;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 8px 32px rgba(138, 43, 226, 0.3);
            border: 1px solid #2a2a2a;
        }
        .header {
            background: linear-gradient(135deg, #1a1a1a 0%, #2d1b4e 50%, #1a1a1a 100%);
            color: #ffffff;
            padding: 40px 20px;
            text-align: center;
            border-bottom: 2px solid #8a2be2;
            position: relative;
        }
        .header::after {
            content: '';
            position: absolute;
            bottom: -2px;
            left: 0;
            right: 0;
            height: 2px;
            background: linear-gradient(90deg, transparent, #8a2be2, transparent);
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 700;
            letter-spacing: 0.5px;
            background: linear-gradient(135deg, #ffffff 0%, #b19cd9 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        .header p {
            margin: 12px 0 0 0;
            font-size: 14px;
            color: #b19cd9;
            letter-spacing: 0.3px;
        }
        .content {
            padding: 35px 25px;
            background-color: #1a1a1a;
        }
        .info-section {
            background: linear-gradient(135deg, #1a1a1a 0%, #2a1a3d 100%);
            border-left: 3px solid #8a2be2;
            padding: 25px;
            margin-bottom: 30px;
            border-radius: 8px;
            box-shadow: inset 0 1px 0 rgba(138, 43, 226, 0.1);
        }
        .info-row {
            display: flex;
            margin-bottom: 15px;
            align-items: flex-start;
        }
        .info-row:last-child {
            margin-bottom: 0;
        }
        .info-label {
            font-weight: 600;
            color: #b19cd9;
            min-width: 100px;
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .info-value {
            color: #e0e0e0;
            font-size: 14px;
            word-break: break-word;
        }
        .info-value a {
            color: #8a2be2;
            text-decoration: none;
            transition: color 0.3s ease;
        }
        .info-value a:hover {
            color: #b19cd9;
        }
        .info-value strong {
            color: #ffffff;
        }
        .message-section {
            background-color: #0f0f0f;
            border: 1px solid #2a2a2a;
            border-radius: 8px;
            padding: 25px;
            margin-top: 25px;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
        }
        .message-section h3 {
            margin: 0 0 18px 0;
            color: #b19cd9;
            font-size: 15px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .message-content {
            color: #e0e0e0;
            line-height: 1.7;
            font-size: 14px;
            white-space: pre-wrap;
            word-wrap: break-word;
        }
        .footer {
            background: linear-gradient(135deg, #1a1a1a 0%, #2a1a3d 100%);
            padding: 25px 20px;
            text-align: center;
            border-top: 1px solid #2a2a2a;
        }
        .footer p {
            margin: 8px 0;
            font-size: 12px;
            color: #888888;
        }
        .reply-button {
            display: inline-block;
            margin-top: 25px;
            padding: 14px 35px;
            background: linear-gradient(135deg, #7c3aed 0%, #8a2be2 100%);
            color: #ffffff;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            font-size: 14px;
            letter-spacing: 0.3px;
            box-shadow: 0 4px 16px rgba(138, 43, 226, 0.4);
            transition: all 0.3s ease;
        }
        .reply-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(138, 43, 226, 0.6);
        }
        .priority-badge {
            display: inline-block;
            padding: 4px 12px;
            background: linear-gradient(135deg, #8a2be2 0%, #b19cd9 100%);
            color: #ffffff;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 600;
            margin-left: 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        @media only screen and (max-width: 600px) {
            .email-container {
                margin: 0;
                border-radius: 0;
            }
            .content {
                padding: 20px 15px;
            }
            .info-row {
                flex-direction: column;
            }
            .info-label {
                margin-bottom: 4px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Header -->
        <div class="header">
            <h1>New Support Request</h1>
            <p>Priority Customer Inquiry</p>
        </div>

        <!-- Content -->
        <div class="content">
            <!-- Customer Information -->
            <div class="info-section">
                <div class="info-row">
                    <span class="info-label">From:</span>
                    <span class="info-value">${FirstName} ${LastName}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Email:</span>
                    <span class="info-value"><a href="mailto:${Email}">${Email}</a></span>
                </div>
                <div class="info-row">
                    <span class="info-label">Subject:</span>
                    <span class="info-value"><strong>${Subject}</strong></span>
                </div>
                <div class="info-row">
                    <span class="info-label">Received:</span>
                    <span class="info-value">${timestamp}</span>
                </div>
            </div>

            <!-- Message Content -->
            <div class="message-section">
                <h3>Customer Message:</h3>
                <div class="message-content">${Message}</div>
            </div>

        </div>

        <!-- Footer -->
        <div class="footer">
            <p><strong>Support Team Dashboard</strong></p>
            <p>This is an automated notification from your customer support system.</p>
            <p style="color: #666666; font-size: 11px; margin-top: 15px;">
                Please respond within 24 hours to maintain service quality standards.
            </p>
        </div>
    </div>
</body>
</html>
  `;
};


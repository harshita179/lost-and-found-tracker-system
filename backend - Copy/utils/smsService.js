/**
 * SMS Notification Service
 * Handles sending SMS notifications when items are matched.
 *
 * For production, configure with Twilio, Fast2SMS, or other SMS providers.
 */

let twilioLib = null;
let axiosLib = null;

const getTwilio = () => {
  if (twilioLib) return twilioLib;
  try {
    twilioLib = require('twilio');
    return twilioLib;
  } catch (error) {
    console.warn('twilio package not available');
    return null;
  }
};

const getAxios = () => {
  if (axiosLib) return axiosLib;
  try {
    axiosLib = require('axios');
    return axiosLib;
  } catch (error) {
    console.warn('axios package not available');
    return null;
  }
};

const hasSMSConfig = () => {
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
    return true;
  }

  if (process.env.FAST2SMS_API_KEY) {
    return true;
  }

  return false;
};

const sendViaTwilio = async (phoneNumber, message) => {
  const twilio = getTwilio();
  if (!twilio) return false;

  try {
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

    await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber
    });

    return true;
  } catch (error) {
    console.error('Twilio SMS error:', error.message);
    return false;
  }
};

const sendViaFast2SMS = async (phoneNumber, message) => {
  const axios = getAxios();
  if (!axios) return false;

  try {
    const response = await axios.post(
      'https://www.fast2sms.com/dev/bulkV2',
      {
        route: 'v3',
        sender_id: 'FSTSMS',
        message,
        language: 'english',
        flash: 0,
        numbers: phoneNumber.replace(/[^0-9]/g, '')
      },
      {
        headers: {
          Authorization: process.env.FAST2SMS_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data?.return === true;
  } catch (error) {
    console.error('Fast2SMS error:', error.message);
    return false;
  }
};

const sendSMS = async (phoneNumber, message) => {
  if (!phoneNumber) {
    console.log('SMS skipped: no phone number');
    return false;
  }

  let formattedPhone = phoneNumber.replace(/[^0-9]/g, '');
  if (!formattedPhone.startsWith('91') && formattedPhone.length === 10) {
    formattedPhone = `91${formattedPhone}`;
  }
  if (!formattedPhone.startsWith('+')) {
    formattedPhone = `+${formattedPhone}`;
  }

  if (process.env.TWILIO_ACCOUNT_SID) {
    const sent = await sendViaTwilio(formattedPhone, message);
    if (sent) return true;
  }

  if (process.env.FAST2SMS_API_KEY) {
    const sent = await sendViaFast2SMS(formattedPhone, message);
    if (sent) return true;
  }

  if (!hasSMSConfig()) {
    console.log('\nSMS Notification (Demo Mode):');
    console.log(`   To: ${formattedPhone}`);
    console.log(`   Message: ${message}\n`);
    return false;
  }

  return false;
};

const getPreferredContactNumber = (item, user) => item?.contact || user?.phone || null;

const sendMatchNotificationSMS = async (lostUser, foundUser, lostItem, foundItem) => {
  const results = [];

  const ownerContactNumber = getPreferredContactNumber(lostItem, lostUser) || 'not provided';
  const finderContactNumber = getPreferredContactNumber(foundItem, foundUser) || 'not provided';
  const lostRecipientNumber = getPreferredContactNumber(lostItem, lostUser);
  const foundRecipientNumber = getPreferredContactNumber(foundItem, foundUser);

  const lostUserMessage =
    `Lost & Found Alert! Your lost item "${lostItem.title}" has been matched with a found report. ` +
    `Finder contact number: ${finderContactNumber}. ` +
    `Your shared contact number: ${ownerContactNumber}.`;

  const foundUserMessage =
    `Lost & Found Alert! Your found item "${foundItem.title}" matches a lost report. ` +
    `Owner contact number: ${ownerContactNumber}. ` +
    `Your shared contact number: ${finderContactNumber}.`;

  if (lostRecipientNumber) {
    const sent = await sendSMS(lostRecipientNumber, lostUserMessage);
    results.push({
      user: lostUser?.username || 'lost-user',
      phone: lostRecipientNumber,
      sent
    });
  }

  if (foundRecipientNumber) {
    const sent = await sendSMS(foundRecipientNumber, foundUserMessage);
    results.push({
      user: foundUser?.username || 'found-user',
      phone: foundRecipientNumber,
      sent
    });
  }

  return results;
};

module.exports = {
  sendSMS,
  sendMatchNotificationSMS,
  hasSMSConfig
};

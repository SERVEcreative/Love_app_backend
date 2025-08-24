const axios = require('axios');
require('dotenv').config();

async function checkTemplateStatus() {
  try {
    const response = await axios.get(
      `https://graph.facebook.com/v22.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/message_templates`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('📋 Available Templates:');
    console.log('========================');
    
    response.data.data.forEach(template => {
      console.log(`\n📝 Template: ${template.name}`);
      console.log(`   Status: ${template.status}`);
      console.log(`   Category: ${template.category}`);
      console.log(`   Language: ${template.language}`);
      console.log(`   Components: ${template.components ? template.components.length : 0}`);
      
      if (template.components) {
        template.components.forEach((comp, index) => {
          console.log(`     Component ${index + 1}: ${comp.type}`);
        });
      }
    });

  } catch (error) {
    console.error('❌ Error checking templates:', error.response?.data || error.message);
  }
}

checkTemplateStatus();

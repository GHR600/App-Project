// Test script for the new chat and summarise endpoints
// Note: This test script is obsolete as the server folder has been removed.
// The AI service is now implemented as serverless functions in the api/ folder.
// const aiService = require('../server/src/services/aiService');

async function testEndpoints() {
  console.log('🧪 Testing New AI Endpoints\n');

  try {
    console.log('1️⃣ Testing generateChatResponse...');
    const chatParams = {
      message: "I'm feeling stressed about work today",
      journalContext: "I had a difficult meeting with my boss this morning.",
      conversationHistory: [],
      userPreferences: { focusAreas: ['career'] },
      subscriptionStatus: 'free'
    };

    const chatResponse = await aiService.generateChatResponse(chatParams);
    console.log('✅ Chat Response:', chatResponse.response.substring(0, 100) + '...');
    console.log(`   Source: ${chatResponse.source}, Model: ${chatResponse.model}\n`);

    console.log('2️⃣ Testing generateSummary...');
    const summaryParams = {
      journalContent: "Today was a challenging day at work. I had a difficult meeting with my boss where we discussed my project timeline. I'm feeling stressed but also motivated to improve.",
      conversationHistory: [
        { role: 'user', content: "I'm feeling stressed about work today" },
        { role: 'assistant', content: chatResponse.response }
      ],
      userPreferences: { focusAreas: ['career'] },
      subscriptionStatus: 'free'
    };

    const summaryResponse = await aiService.generateSummary(summaryParams);
    console.log('✅ Summary:', summaryResponse.summary);
    console.log(`   Source: ${summaryResponse.source}, Model: ${summaryResponse.model}\n`);

    console.log('🎉 All endpoint tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('   This might be expected if using mock responses');
  }
}

testEndpoints();
// Test script to verify AI endpoint functionality
const fetch = require('node-fetch');

const API_BASE_URL = 'https://journaling-xi.vercel.app/';

async function testAIEndpoint() {
  console.log('🧪 Testing AI Insights API Endpoint...\n');

  try {
    console.log('📡 Making request to:', `${API_BASE_URL}/api/ai/insights`);

    const response = await fetch(`${API_BASE_URL}/api/ai/insights`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock-token' // Using mock token for test
      },
      body: JSON.stringify({
        content: 'I had a really productive day at work today. I completed all my tasks and felt accomplished.',
        moodRating: 4
      })
    });

    console.log('📊 Response Status:', response.status, response.statusText);
    console.log('📊 Response Headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error Response Body:', errorText);
      return;
    }

    const data = await response.json();
    console.log('\n✅ Success! API Response:');
    console.log('📝 Response Data:', JSON.stringify(data, null, 2));

    if (data.insight) {
      console.log('\n🤖 Generated Insight:');
      console.log('💡 Insight:', data.insight.insight);
      console.log('❓ Follow-up:', data.insight.followUpQuestion);
      console.log('🎯 Confidence:', data.insight.confidence);
      console.log('🔄 Source:', data.insight.source);
      console.log('🧠 Model:', data.insight.model);
    }

    if (data.debug) {
      console.log('\n🔍 Debug Info:');
      console.log('⏱️  Duration:', data.debug.duration + 'ms');
      console.log('🆔 Request ID:', data.debug.requestId);
    }

  } catch (error) {
    console.error('❌ Test failed with error:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
  }
}

// Run the test
testAIEndpoint();
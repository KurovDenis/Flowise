#!/usr/bin/env node

/**
 * Экспорт всех chatflows из Flowise в JSON файлы
 * 
 * Usage:
 *   node scripts/export-chatflows.js
 * 
 * Результат:
 *   chatflows/
 *     ├── attributevalue-agent.json
 *     ├── events-agent.json
 *     └── ...
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

const FLOWISE_URL = process.env.FLOWISE_URL || 'http://localhost:3005';
const CHATFLOWS_DIR = path.join(__dirname, '..', 'chatflows');

async function exportChatflows() {
  console.log('🚀 Exporting chatflows from Flowise...\n');
  
  try {
    // Создать директорию если не существует
    if (!fs.existsSync(CHATFLOWS_DIR)) {
      fs.mkdirSync(CHATFLOWS_DIR, { recursive: true });
    }
    
    // Получить все chatflows через API
    const response = await axios.get(`${FLOWISE_URL}/api/v1/chatflows`);
    
    if (!response.data) {
      console.error('❌ No chatflows found');
      process.exit(1);
    }
    
    const chatflows = Array.isArray(response.data) ? response.data : response.data.data || [];
    
    console.log(`Found ${chatflows.length} chatflows\n`);
    
    // Экспортировать каждый chatflow
    for (const chatflow of chatflows) {
      const filename = `${chatflow.name.toLowerCase().replace(/\s+/g, '-')}.json`;
      const filepath = path.join(CHATFLOWS_DIR, filename);
      
      // Очистить chatflow от runtime полей
      const cleanChatflow = {
        name: chatflow.name,
        type: chatflow.type,
        flowData: chatflow.flowData,
        deployed: chatflow.deployed || false,
        category: chatflow.category || 'General',
        chatbotConfig: chatflow.chatbotConfig,
        apiConfig: chatflow.apiConfig,
        analytic: chatflow.analytic,
        speechToText: chatflow.speechToText,
        textToSpeech: chatflow.textToSpeech,
        followUpPrompts: chatflow.followUpPrompts
      };
      
      // Сохранить в файл (pretty JSON)
      fs.writeFileSync(filepath, JSON.stringify(cleanChatflow, null, 2));
      
      console.log(`✅ Exported: ${filename}`);
      console.log(`   Name: ${chatflow.name}`);
      console.log(`   Type: ${chatflow.type}`);
      console.log(`   Category: ${chatflow.category || 'General'}\n`);
    }
    
    console.log(`\n🎉 Successfully exported ${chatflows.length} chatflows to chatflows/`);
    console.log('\n📝 Next steps:');
    console.log('   1. Review files in chatflows/');
    console.log('   2. Commit to git: git add chatflows/ && git commit -m "Add chatflows"');
    console.log('   3. On deployment, run: node scripts/import-chatflows.js');
    
  } catch (error) {
    console.error('❌ Export failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Hint: Is Flowise running on', FLOWISE_URL, '?');
      console.error('   Run: pnpm start');
    }
    
    process.exit(1);
  }
}

exportChatflows();


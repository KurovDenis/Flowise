#!/usr/bin/env node

/**
 * Импорт chatflows из JSON файлов в Flowise
 * 
 * Usage:
 *   node scripts/import-chatflows.js
 * 
 * Используется при деплое для автоматического создания chatflows
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

const FLOWISE_URL = process.env.FLOWISE_URL || 'http://localhost:3005';
const CHATFLOWS_DIR = path.join(__dirname, '..', 'chatflows');

// Задержка между запросами (чтобы не перегружать API)
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function waitForFlowise() {
  console.log('⏳ Waiting for Flowise to be ready...\n');
  
  const maxAttempts = 30; // 30 * 2s = 60s timeout
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await axios.get(`${FLOWISE_URL}/api/v1/chatflows`);
      console.log('✅ Flowise is ready!\n');
      return true;
    } catch (error) {
      if (i === maxAttempts - 1) {
        throw new Error('Flowise did not start in time');
      }
      process.stdout.write('.');
      await delay(2000);
    }
  }
}

async function importChatflows() {
  console.log('🚀 Importing chatflows to Flowise...\n');
  
  try {
    // Дождаться запуска Flowise
    await waitForFlowise();
    
    // Проверить существование директории
    if (!fs.existsSync(CHATFLOWS_DIR)) {
      console.error(`❌ Chatflows directory not found: ${CHATFLOWS_DIR}`);
      console.log('\n💡 Hint: Export chatflows first:');
      console.log('   node scripts/export-chatflows.js');
      process.exit(1);
    }
    
    // Получить список файлов
    const files = fs.readdirSync(CHATFLOWS_DIR)
      .filter(f => f.endsWith('.json'));
    
    if (files.length === 0) {
      console.log('⚠️  No chatflow files found in chatflows/');
      console.log('   Nothing to import.');
      process.exit(0);
    }
    
    console.log(`Found ${files.length} chatflow files\n`);
    
    // Получить существующие chatflows для проверки дубликатов
    const existingResponse = await axios.get(`${FLOWISE_URL}/api/v1/chatflows`);
    const existingChatflows = Array.isArray(existingResponse.data) 
      ? existingResponse.data 
      : existingResponse.data.data || [];
    
    const existingNames = new Set(existingChatflows.map(cf => cf.name));
    
    let imported = 0;
    let skipped = 0;
    let errors = 0;
    
    // Импортировать каждый файл
    for (const file of files) {
      const filepath = path.join(CHATFLOWS_DIR, file);
      const chatflowData = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
      
      // Проверка дубликатов
      if (existingNames.has(chatflowData.name)) {
        console.log(`⏭️  Skipped: ${chatflowData.name} (already exists)`);
        skipped++;
        await delay(500);
        continue;
      }
      
      try {
        // Импорт через API
        const response = await axios.post(
          `${FLOWISE_URL}/api/v1/chatflows`,
          chatflowData,
          {
            headers: { 'Content-Type': 'application/json' }
          }
        );
        
        console.log(`✅ Imported: ${chatflowData.name}`);
        console.log(`   ID: ${response.data.id}`);
        console.log(`   Type: ${chatflowData.type}\n`);
        
        imported++;
        
        // Задержка между импортами
        await delay(1000);
        
      } catch (error) {
        console.error(`❌ Failed to import: ${chatflowData.name}`);
        console.error(`   Error: ${error.response?.data?.message || error.message}\n`);
        errors++;
      }
    }
    
    // Итоговый отчет
    console.log('\n' + '═'.repeat(50));
    console.log('📊 Import Summary:');
    console.log('═'.repeat(50));
    console.log(`✅ Imported:  ${imported}`);
    console.log(`⏭️  Skipped:   ${skipped} (already exist)`);
    console.log(`❌ Errors:    ${errors}`);
    console.log('═'.repeat(50) + '\n');
    
    if (imported > 0) {
      console.log('🎉 Import completed successfully!');
      console.log(`\n📍 Open Flowise: ${FLOWISE_URL}`);
    }
    
    if (errors > 0) {
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Import failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Hint: Is Flowise running on', FLOWISE_URL, '?');
    }
    
    process.exit(1);
  }
}

importChatflows();


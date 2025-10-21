#!/usr/bin/env node

/**
 * Валидация chatflow JSON файлов перед импортом
 * 
 * Проверяет:
 * - JSON синтаксис
 * - Обязательные поля
 * - Структуру flowData
 * - References к nodes
 */

const fs = require('fs');
const path = require('path');

const CHATFLOWS_DIR = path.join(__dirname, '..', 'chatflows');

// Required fields
const REQUIRED_FIELDS = ['name', 'type', 'flowData'];
const VALID_TYPES = ['CHATFLOW', 'AGENTFLOW', 'ASSISTANT'];

function validateChatflow(filepath, data) {
  const errors = [];
  const warnings = [];
  
  // Check required fields
  for (const field of REQUIRED_FIELDS) {
    if (!data[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  }
  
  // Validate type
  if (data.type && !VALID_TYPES.includes(data.type)) {
    errors.push(`Invalid type: ${data.type}. Must be one of: ${VALID_TYPES.join(', ')}`);
  }
  
  // Validate flowData
  if (data.flowData) {
    try {
      const flowData = JSON.parse(data.flowData);
      
      if (!flowData.nodes || !Array.isArray(flowData.nodes)) {
        errors.push('flowData.nodes must be an array');
      }
      
      if (!flowData.edges || !Array.isArray(flowData.edges)) {
        warnings.push('flowData.edges is empty or missing');
      }
      
      // Check for dangling edges (references to non-existent nodes)
      if (flowData.nodes && flowData.edges) {
        const nodeIds = new Set(flowData.nodes.map(n => n.id));
        
        for (const edge of flowData.edges) {
          if (!nodeIds.has(edge.source)) {
            errors.push(`Edge references non-existent source node: ${edge.source}`);
          }
          if (!nodeIds.has(edge.target)) {
            errors.push(`Edge references non-existent target node: ${edge.target}`);
          }
        }
      }
      
    } catch (e) {
      errors.push(`Invalid flowData JSON: ${e.message}`);
    }
  }
  
  // Check for credentials in flowData (security)
  if (data.flowData && data.flowData.includes('apiKey')) {
    warnings.push('⚠️  flowData may contain credentials! Review carefully.');
  }
  
  return { errors, warnings };
}

async function validateAllChatflows() {
  console.log('🔍 Validating chatflows...\n');
  
  if (!fs.existsSync(CHATFLOWS_DIR)) {
    console.error(`❌ Chatflows directory not found: ${CHATFLOWS_DIR}`);
    process.exit(1);
  }
  
  const files = fs.readdirSync(CHATFLOWS_DIR)
    .filter(f => f.endsWith('.json'));
  
  if (files.length === 0) {
    console.log('⚠️  No chatflow files found');
    process.exit(0);
  }
  
  let totalErrors = 0;
  let totalWarnings = 0;
  
  for (const file of files) {
    const filepath = path.join(CHATFLOWS_DIR, file);
    
    console.log(`\n📄 ${file}`);
    console.log('─'.repeat(50));
    
    try {
      const content = fs.readFileSync(filepath, 'utf-8');
      const data = JSON.parse(content);
      
      const { errors, warnings } = validateChatflow(filepath, data);
      
      if (errors.length === 0 && warnings.length === 0) {
        console.log('✅ Valid');
      }
      
      if (errors.length > 0) {
        console.log(`\n❌ Errors (${errors.length}):`);
        errors.forEach(err => console.log(`   - ${err}`));
        totalErrors += errors.length;
      }
      
      if (warnings.length > 0) {
        console.log(`\n⚠️  Warnings (${warnings.length}):`);
        warnings.forEach(warn => console.log(`   - ${warn}`));
        totalWarnings += warnings.length;
      }
      
    } catch (e) {
      console.log(`❌ Parse error: ${e.message}`);
      totalErrors++;
    }
  }
  
  console.log('\n' + '═'.repeat(50));
  console.log('📊 Validation Summary');
  console.log('═'.repeat(50));
  console.log(`Files checked: ${files.length}`);
  console.log(`Total errors:  ${totalErrors}`);
  console.log(`Total warnings: ${totalWarnings}`);
  console.log('═'.repeat(50));
  
  if (totalErrors > 0) {
    console.log('\n❌ Validation failed!');
    process.exit(1);
  } else {
    console.log('\n✅ All chatflows valid!');
    process.exit(0);
  }
}

validateAllChatflows();


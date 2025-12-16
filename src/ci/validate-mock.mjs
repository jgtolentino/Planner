/**
 * Validate mock data conforms to TypeScript contract
 * This runs at build time to ensure mock data is valid.
 */

import {
  mockBoard,
  mockCards,
  mockActivities,
  mockStages,
  mockTags,
} from '../data/mock.ts';

import {
  validateBoard,
  validateCard,
} from '../lib/api-client.ts';

let failed = 0;

// Validate board
console.log('Validating board...');
try {
  if (validateBoard(mockBoard)) {
    console.log('  ✓ Board valid');
  } else {
    console.error('  ✗ Board validation failed');
    failed++;
  }
} catch (e) {
  console.error('  ✗ Board validation error:', e.message);
  failed++;
}

// Validate all cards
console.log('Validating cards...');
const invalidCards = mockCards.filter(card => {
  try {
    return !validateCard(card);
  } catch (e) {
    console.error(`  ✗ Card ${card.card_id} validation error:`, e.message);
    return true;
  }
});

if (invalidCards.length === 0) {
  console.log(`  ✓ All ${mockCards.length} cards valid`);
} else {
  console.error(`  ✗ ${invalidCards.length} cards failed validation`);
  invalidCards.forEach(card => {
    console.error(`    - ${card.card_id}: ${card.title}`);
  });
  failed++;
}

// Validate activities structure
console.log('Validating activities...');
let totalActivities = 0;
let validActivities = 0;
Object.values(mockActivities).forEach(activities => {
  activities.forEach(activity => {
    totalActivities++;
    if (activity.event_id && activity.type && activity.author && activity.created_at) {
      validActivities++;
    } else {
      console.error(`  ✗ Invalid activity: ${activity.event_id || 'unknown'}`);
      failed++;
    }
  });
});

if (validActivities === totalActivities) {
  console.log(`  ✓ All ${totalActivities} activities valid`);
} else {
  console.error(`  ✗ ${totalActivities - validActivities} activities failed validation`);
}

// Validate stages
console.log('Validating stages...');
const invalidStages = mockStages.filter(stage => {
  return !(stage.stage_id && stage.name && typeof stage.order === 'number');
});
if (invalidStages.length === 0) {
  console.log(`  ✓ All ${mockStages.length} stages valid`);
} else {
  console.error(`  ✗ ${invalidStages.length} stages invalid`);
  failed++;
}

// Validate tags
console.log('Validating tags...');
const invalidTags = mockTags.filter(tag => {
  return !(tag.tag_id && tag.name);
});
if (invalidTags.length === 0) {
  console.log(`  ✓ All ${mockTags.length} tags valid`);
} else {
  console.error(`  ✗ ${invalidTags.length} tags invalid`);
  failed++;
}

// Exit
if (failed > 0) {
  console.error(`\n✗ Mock data validation failed with ${failed} errors`);
  process.exit(1);
} else {
  console.log('\n✓ All mock data valid');
  process.exit(0);
}

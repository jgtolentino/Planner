/**
 * Validate mock data conforms to TypeScript contract
 * This runs at build time to ensure mock data is valid.
 */

const { mockBoard, mockCards, mockActivities } = require('../data/mock.ts');
const { validateBoard, validateCard } = require('../lib/api-client.ts');

let failed = 0;

// Validate board
console.log('Validating board...');
if (validateBoard(mockBoard)) {
  console.log('  ✓ Board valid');
} else {
  console.error('  ✗ Board validation failed');
  failed++;
}

// Validate all cards
console.log('Validating cards...');
const invalidCards = mockCards.filter(card => !validateCard(card));
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
      console.error(`  ✗ Invalid activity: ${activity.event_id}`);
      failed++;
    }
  });
});

if (validActivities === totalActivities) {
  console.log(`  ✓ All ${totalActivities} activities valid`);
} else {
  console.error(`  ✗ ${totalActivities - validActivities} activities failed validation`);
}

// Exit
if (failed > 0) {
  console.error(`\n✗ Mock data validation failed with ${failed} errors`);
  process.exit(1);
} else {
  console.log('\n✓ All mock data valid');
  process.exit(0);
}

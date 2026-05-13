import { eq } from 'drizzle-orm';
import { db, pool } from './db/db.js';
import { matches, commentary } from './db/schema.js';

async function main() {
  try {
    console.log('Performing CRUD operations...\n');

    // ── CREATE: Insert a new match ───────────────────────────────────────────
    const [newMatch] = await db
      .insert(matches)
      .values({
        sport: 'Football',
        homeTeam: 'Arsenal',
        awayTeam: 'Chelsea',
        status: 'scheduled',
        startTime: new Date(),
      })
      .returning();

    if (!newMatch) {
      throw new Error('Failed to create match');
    }

    console.log('✅ CREATE: New match created:', newMatch);

    // ── READ: Select the match ───────────────────────────────────────────────
    const foundMatch = await db
      .select()
      .from(matches)
      .where(eq(matches.id, newMatch.id));
    console.log('✅ READ:   Found match:', foundMatch[0]);

    // ── UPDATE: Change the match status to live ──────────────────────────────
    const [updatedMatch] = await db
      .update(matches)
      .set({ status: 'live', homeScore: 1 })
      .where(eq(matches.id, newMatch.id))
      .returning();

    if (!updatedMatch) {
      throw new Error('Failed to update match');
    }

    console.log('✅ UPDATE: Match updated:', updatedMatch);

    // ── CREATE: Add a commentary entry ───────────────────────────────────────
    const [newComment] = await db
      .insert(commentary)
      .values({
        matchId: newMatch.id,
        minute: 23,
        sequence: 1,
        period: '1st Half',
        eventType: 'goal',
        actor: 'Saka',
        team: 'Arsenal',
        message: 'GOAL! Saka scores with a brilliant strike!',
        metadata: { assistedBy: 'Odegaard', bodyPart: 'left foot' },
        tags: ['goal', 'highlight'],
      })
      .returning();

    console.log('✅ CREATE: Commentary added:', newComment);

    // ── READ: Get commentary for the match ───────────────────────────────────
    const matchCommentary = await db
      .select()
      .from(commentary)
      .where(eq(commentary.matchId, newMatch.id));
    console.log('✅ READ:   Match commentary:', matchCommentary);

    // ── DELETE: Clean up - remove commentary then match ──────────────────────
    await db.delete(commentary).where(eq(commentary.matchId, newMatch.id));
    console.log('✅ DELETE: Commentary deleted.');

    await db.delete(matches).where(eq(matches.id, newMatch.id));
    console.log('✅ DELETE: Match deleted.');

    console.log('\n🎉 CRUD operations completed successfully.');
  } catch (error) {
    console.error('❌ Error performing CRUD operations:', error);
    process.exit(1);
  } finally {
    await pool.end();
    console.log('Database pool closed.');
  }
}

main();

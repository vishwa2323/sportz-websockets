import { Router } from "express";
import { desc, eq } from "drizzle-orm";
import { db } from "../db/db.js";
import { commentary } from "../db/schema.js";
import { createCommentarySchema, listCommentaryQuerySchema } from "../validation/commentary.js";
import { matchIdParamSchema } from "../validation/matches.js";

export const commentaryRouter = Router({ mergeParams: true });

const MAX_LIMIT = 100;

commentaryRouter.get('/', async (req, res) => {
    try {
        const paramsResult = matchIdParamSchema.safeParse(req.params);
        if (!paramsResult.success) {
            return res.status(400).json({ error: 'Invalid match ID', details: paramsResult.error.errors });
        }

        const queryResult = listCommentaryQuerySchema.safeParse(req.query);
        if (!queryResult.success) {
            return res.status(400).json({ error: 'Invalid query parameters', details: queryResult.error.errors });
        }

        const matchId = paramsResult.data.id;
        const limit = Math.min(queryResult.data.limit ?? 100, MAX_LIMIT);

        const data = await db.select()
            .from(commentary)
            .where(eq(commentary.matchId, matchId))
            .orderBy(desc(commentary.createdAt))
            .limit(limit);

        return res.status(200).json({ data });
    } catch (error) {
        console.error('Error fetching commentary:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

commentaryRouter.post('/', async (req, res) => {
    try {
        const paramsResult = matchIdParamSchema.safeParse(req.params);
        if (!paramsResult.success) {
            return res.status(400).json({ error: 'Invalid match ID', details: paramsResult.error.errors });
        }

        const bodyResult = createCommentarySchema.safeParse(req.body);
        if (!bodyResult.success) {
            return res.status(400).json({ error: 'Invalid commentary data', details: bodyResult.error.errors });
        }

        const matchId = paramsResult.data.id;
        const data = bodyResult.data;

        const [insertedCommentary] = await db.insert(commentary).values({
            matchId,
            minute: data.minute,
            sequence: data.sequence,
            period: data.period,
            eventType: data.eventType,
            actor: data.actor,
            team: data.team,
            message: data.message,
            metadata: data.metadata,
            tags: data.tags
        }).returning();

        if (res.app.locals.broadcastCommentary) {
            res.app.locals.broadcastCommentary(matchId, insertedCommentary);
        }
        return res.status(201).json({
            message: 'Commentary added successfully',
            data: insertedCommentary
        });

    } catch (error) {
        console.error('Error inserting commentary:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});
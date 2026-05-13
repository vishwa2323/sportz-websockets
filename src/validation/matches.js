import { z } from 'zod';

export const MATCH_STATUS = {
  SCHEDULED: 'scheduled',
  LIVE: 'live',
  FINISHED: 'finished',
};

export const listMatchesQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const matchIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const createMatchSchema = z.object({
  sport: z.string().min(1, 'sport is required'),
  homeTeam: z.string().min(1, 'homeTeam is required'),
  awayTeam: z.string().min(1, 'awayTeam is required'),
  startTime: z.string().datetime({ message: 'startTime must be a valid ISO date string' }),
  endTime: z.string().datetime({ message: 'endTime must be a valid ISO date string' }),
  homeScore: z.coerce.number().int().nonnegative().optional(),
  awayScore: z.coerce.number().int().nonnegative().optional(),
}).superRefine((data, ctx) => {
  if (new Date(data.endTime) <= new Date(data.startTime)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'endTime must be chronologically after startTime',
      path: ['endTime'],
    });
  }
});

export const updateScoreSchema = z.object({
  homeScore: z.coerce.number().int().nonnegative(),
  awayScore: z.coerce.number().int().nonnegative(),
});

import arcjet, { shield, detectBot, slidingWindow } from "@arcjet/node";

const arcjetkey = process.env.ARCJET_KEY
const arcjetMode = process.env.ARCJET_MODE === 'DRY_RUN' ? 'DRY_RUN' : 'LIVE';
// const arcjetenv=process.env.ARCJET_ENV 
if (!arcjetkey) throw new Error("ARCJET_KEY is not defined");
export const httpArcjet = arcjetkey ?
    arcjet({
        key: arcjetkey,
        rules: [
            shield({ mode: arcjetMode }),
            detectBot({ mode: arcjetMode, allow: ['CATEGORY:SEARCH_ENGINE', "CATEGORY:PREVIEW"] }),
            slidingWindow({ mode: arcjetMode, interval: '10s', max: 50 })
        ]
    }) : null;

export const wsArcjet = arcjetkey ?
    arcjet({
        key: arcjetkey,
        rules: [
            shield({ mode: arcjetMode }),
            detectBot({ mode: arcjetMode, allow: ['CATEGORY:SEARCH_ENGINE', "CATEGORY:PREVIEW"] }),
            slidingWindow({ mode: arcjetMode, interval: '2s', max: 5 })
        ],
    }) : null;

export function securityMiddleware(arcjet) {
    return async (req, res, next) => {
        if (!httpArcjet) return next;
        try {
            const descision = await httpArcjet.protect(req);
            if (descision.isDenied()) {
                if (descision.reason.isRateLimit()) {
                    return res.status(429).json({ error: 'Too many requests' });
                }
                return res.status(403).json({ error: 'Access Denied' });
            }
        } catch (e) {
            console.error('arcjet middleware error', e);
            return res.status(503).json({ error: 'service Unavailable' })
        }
        next();
    }
}

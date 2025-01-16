import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { createClient } from '@/util/supabase/api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const supabase = createClient(req, res);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.method === 'GET') {
        try {
            const settings = await prisma.settings.findFirst({
                where: {
                    userId: user.id
                }
            });
            return res.status(200).json({ timeZone: settings?.timeZone || null });
        } catch (error) {
            return res.status(500).json({ error: 'Failed to fetch time zone settings' });
        }
    }

    if (req.method === 'POST') {
        const { timeZone } = req.body;

        if (!timeZone) {
            return res.status(400).json({ error: 'Time zone is required' });
        }

        try {
            const settings = await prisma.settings.upsert({
                where: {
                    userId: user.id
                },
                update: {
                    timeZone
                },
                create: {
                    userId: user.id,
                    timeZone
                }
            });

            return res.status(200).json(settings);
        } catch (error) {
            return res.status(500).json({ error: 'Failed to update time zone' });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { createClient } from '@/util/supabase/api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('Creating event...');
    const supabase = createClient(req, res);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError) {
      console.error('Authentication error:', authError);
      return res.status(401).json({ message: 'Authentication error', error: authError.message });
    }

    if (!user) {
      console.error('No user found');
      return res.status(401).json({ message: 'Unauthorized - No user found' });
    }

    const {
      title,
      description,
      location,
      startDate,
      endDate,
      startTime,
      endTime,
      eventType,
      boatClasses,
      isSeries,
      seriesDetails,
    } = req.body;

    // Combine date and time
    const combinedStartDate = new Date(`${new Date(startDate).toISOString().split('T')[0]}T${startTime}:00`);
    const combinedEndDate = endDate 
      ? new Date(`${new Date(endDate).toISOString().split('T')[0]}T${endTime}:00`)
      : new Date(`${new Date(startDate).toISOString().split('T')[0]}T${endTime}:00`);

    console.log('Received event data:', {
      title,
      location,
      startDate,
      eventType,
      boatClasses,
      isSeries,
      seriesDetails,
    });

    if (!title || !startDate || !eventType || !boatClasses || !location) {
      console.error('Missing required fields');
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (isSeries && (!seriesDetails?.frequency || !seriesDetails?.numberOfEvents)) {
      console.error('Missing series details');
      return res.status(400).json({ message: 'Series events require frequency and number of events' });
    }

    if (isSeries) {
      console.log('Creating series and events...');
      const numberOfEvents = parseInt(seriesDetails.numberOfEvents);
      const frequency = seriesDetails.frequency;

      // First, create the series
      const series = await prisma.series.create({
        data: {
          title,
          description,
          startDate: combinedStartDate,
          userId: user.id,
        },
      });

      // Calculate dates for series events
      const seriesEvents = [];
      let currentDate = new Date(combinedStartDate);

      for (let i = 0; i < numberOfEvents; i++) {
        // Create new date objects to avoid mutation
        const eventStartDateTime = new Date(currentDate);
        const eventEndDateTime = new Date(currentDate);
        
        // Set the end time on same date as start
        eventEndDateTime.setHours(parseInt(endTime.split(':')[0]));
        eventEndDateTime.setMinutes(parseInt(endTime.split(':')[1]));
        
        seriesEvents.push({
          title: `${title} - Event ${i + 1}`,
          description,
          location,
          startDate: eventStartDateTime,
          endDate: eventEndDateTime,
          type: eventType,
          classes: boatClasses,
          eventNumber: i + 1,
          userId: user.id,
          seriesId: series.id,
        });

        // Calculate next event date based on frequency
        switch (frequency) {
          case 'weekly':
            currentDate.setDate(currentDate.getDate() + 7);
            break;
          case 'biweekly':
            currentDate.setDate(currentDate.getDate() + 14);
            break;
          case 'monthly':
            currentDate.setMonth(currentDate.getMonth() + 1);
            break;
        }
      }

      console.log(`Creating ${seriesEvents.length} series events...`);
      // Create all series events
      const createdEvents = await prisma.$transaction(
        seriesEvents.map((event) => prisma.event.create({ data: event }))
      );
      console.log('Series and events created successfully');

      // Return both series and events
      return res.status(201).json({
        series,
        events: createdEvents
      });
    } else {
      console.log('Creating single event...');
      // Create single event
      const event = await prisma.event.create({
        data: {
          title,
          description,
          location,
          startDate: combinedStartDate,
          endDate: combinedEndDate,
          type: eventType,
          classes: boatClasses,
          userId: user.id,
        },
      });
      console.log('Single event created successfully');

      return res.status(201).json(event);
    }
  } catch (error) {
    console.error('Error in create event API:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { createClient } from "@/util/supabase/api";
import formidable from 'formidable';
import { promises as fs } from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const supabase = createClient(req, res);

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Check if the request is JSON (for link documents)
  const contentType = req.headers['content-type'];
  if (contentType?.includes('application/json')) {
    try {
      // Parse the JSON body manually since bodyParser is disabled
      let body = '';
      for await (const chunk of req) {
        body += chunk;
      }
      const data = JSON.parse(body);
      
      // Validate required fields
      if (!data.name || !data.url || (!data.eventId && !data.seriesId)) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Create document record
      const document = await prisma.document.create({
        data: {
          name: data.name.trim(),
          url: data.url,
          eventId: data.eventId,
          seriesId: data.seriesId,
          type: data.type || 'link',
          order: data.order || 0,
          userId: user.id,
        },
      });

      return res.status(201).json(document);
    } catch (error) {
      console.error("JSON handling error:", error);
      return res.status(500).json({ 
        error: "Error processing request",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  // Handle FormData (for file uploads)
  try {
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10MB
    });

    const [fields, files] = await form.parse(req);
    
    console.log("Received fields:", fields);
    
    const name = fields.name?.[0];
    const seriesId = fields.seriesId?.[0];
    const eventId = fields.eventId?.[0];
    const type = fields.type?.[0];
    const order = fields.order?.[0] ? parseInt(fields.order[0]) : 0;
    const providedUrl = fields.url?.[0];

    // Validation checks
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: "Valid document name is required" });
    }

    if (!files.file?.[0] && !providedUrl) {
      return res.status(400).json({ error: "Either file or URL must be provided" });
    }

    if (!eventId && !seriesId) {
      return res.status(400).json({ error: "Either eventId or seriesId must be provided" });
    }

    // Initialize URL variable
    let url = providedUrl || '';
    
    // If we have a file, upload it to Supabase storage
    if (files.file?.[0]) {
      const file = files.file[0];
      
      // Validate file type
      if (!file.mimetype?.includes('pdf')) {
        return res.status(400).json({ error: "Only PDF files are allowed" });
      }

      try {
        const fileBuffer = await fs.readFile(file.filepath);
        const fileName = `${Date.now()}-${name.replace(/[^a-zA-Z0-9]/g, '_')}`;
        
        const { data, error } = await supabase.storage
          .from('documents')
          .upload(`${user.id}/${fileName}.pdf`, fileBuffer, {
            contentType: 'application/pdf',
            upsert: false
          });

        if (error) {
          console.error("Storage upload error:", error);
          return res.status(500).json({ error: `Error uploading file: ${error.message}` });
        }

        const { data: { publicUrl } } = supabase.storage
          .from('documents')
          .getPublicUrl(`${user.id}/${fileName}.pdf`);

        url = publicUrl;

        // Clean up the temporary file
        await fs.unlink(file.filepath).catch(err => {
          console.warn("Failed to clean up temporary file:", err);
        });
      } catch (error) {
        console.error("File upload error:", error);
        return res.status(500).json({ 
          error: "Failed to upload file",
          details: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }

    let document;
    
    try {
      if (seriesId) {
        // Verify series exists
        const series = await prisma.series.findUnique({
          where: { id: seriesId }
        });
        
        if (!series) {
          return res.status(404).json({ error: "Series not found" });
        }

        // Create a document for the series
        document = await prisma.document.create({
          data: {
            name: name.trim(),
            url: url,
            seriesId,
            type: type || 'series',
            order,
            userId: user.id,
          },
        });
      } else if (eventId) {
        // Verify event exists
        const event = await prisma.event.findUnique({
          where: { id: eventId }
        });
        
        if (!event) {
          return res.status(404).json({ error: "Event not found" });
        }

        // Create a document for the event
        document = await prisma.document.create({
          data: {
            name: name.trim(),
            url: url,
            eventId,
            type: type || 'event',
            order,
            userId: user.id,
          },
        });
      }

      return res.status(201).json(document);
    } catch (error) {
      console.error("Database error:", error);
      return res.status(500).json({ 
        error: "Error creating document record",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  } catch (error) {
    console.error("General error:", error);
    return res.status(500).json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
}
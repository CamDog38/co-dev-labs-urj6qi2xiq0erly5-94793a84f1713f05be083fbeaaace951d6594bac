import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { createClient } from "@/util/supabase/api";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Initialize logging context
  const logContext: any = {
    startTime: new Date().toISOString(),
    steps: [],
  };

  const logStep = (step: string, details?: any) => {
    const stepLog = {
      step,
      timestamp: new Date().toISOString(),
      details: details || {}
    };
    console.log(JSON.stringify(stepLog));
    logContext.steps.push(stepLog);
  };

  if (req.method !== "POST") {
    logStep("Method validation failed", { method: req.method });
    return res.status(405).json({ 
      error: "Method not allowed",
      context: logContext
    });
  }

  logStep("Starting document upload process", {
    body: {
      name: req.body.name,
      seriesId: req.body.seriesId,
      hasFile: !!req.body.file,
      hasUrl: !!req.body.url,
    }
  });
  
  const supabase = createClient(req, res);

  // Check authentication
  logStep("Checking authentication");
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    logStep("Authentication failed", { userId: null });
    return res.status(401).json({ 
      error: "Unauthorized",
      context: logContext
    });
  }
  logStep("Authentication successful", { userId: user.id });

  try {
    const { name, file, url: providedUrl, seriesId, order } = req.body;
    logStep("Request body parsed", { 
      hasFile: !!file,
      hasUrl: !!providedUrl,
      seriesId,
      documentName: name
    });

    // Validate required fields
    if (!seriesId) {
      logStep("Validation failed", { error: "Missing seriesId" });
      return res.status(400).json({ 
        error: "Series ID is required",
        context: logContext
      });
    }

    const documentName = name?.trim();
    if (!documentName) {
      logStep("Validation failed", { error: "Missing document name" });
      return res.status(400).json({ 
        error: "Document name is required",
        context: logContext
      });
    }

    if (!file && !providedUrl) {
      logStep("Validation failed", { error: "No file or URL provided" });
      return res.status(400).json({ 
        error: "Either file or URL must be provided",
        context: logContext
      });
    }

    // Check if series exists
    logStep("Checking series existence", { seriesId });
    const series = await prisma.series.findUnique({
      where: { id: seriesId }
    });

    if (!series) {
      logStep("Series not found", { seriesId });
      return res.status(404).json({ 
        error: "Series not found",
        context: logContext
      });
    }
    logStep("Series found", { seriesTitle: series.title });

    // Initialize URL variable
    let url = providedUrl || '';
    
    // Handle file upload if present
    if (file) {
      try {
        logStep("Starting file upload process");
        
        // Extract file type from base64
        const fileType = file.split(';')[0].split('/')[1];
        logStep("File type detected", { fileType });
        
        // Validate file format
        if (fileType !== 'pdf') {
          logStep("File validation failed", { error: "Invalid file format", detectedType: fileType });
          return res.status(400).json({ 
            error: "Invalid file format. Only PDF files are allowed.",
            context: logContext
          });
        }
        logStep("File format validated");

        const base64Data = file.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');
        logStep("File buffer created", { size: buffer.length });
        
        // Validate file size (max 5MB)
        if (buffer.length > 5 * 1024 * 1024) {
          logStep("File size validation failed", { size: buffer.length });
          return res.status(400).json({ 
            error: "File size exceeds 5MB limit",
            context: logContext
          });
        }
        logStep("File size validated");
        
        const fileName = `series_${seriesId}_${Date.now()}_${documentName.replace(/[^a-zA-Z0-9]/g, '_')}`;
        logStep("Generated file name", { fileName });
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('documents')
          .upload(`${user.id}/${fileName}.pdf`, buffer, {
            contentType: 'application/pdf',
            upsert: false
          });

        if (uploadError) {
          logStep("Storage upload failed", { error: uploadError });
          throw new Error(`Failed to upload file: ${uploadError.message}`);
        }
        logStep("File uploaded successfully", { path: uploadData?.path });

        // Get the public URL for the uploaded file
        const { data: { publicUrl } } = supabase.storage
          .from('documents')
          .getPublicUrl(`${user.id}/${fileName}.pdf`);

        url = publicUrl;
        logStep("Public URL generated", { url });
      } catch (error) {
        logStep("File upload error", { error: error instanceof Error ? error.message : "Unknown error" });
        return res.status(500).json({ 
          error: "Failed to upload file",
          details: error instanceof Error ? error.message : "Unknown error",
          context: logContext
        });
      }
    }

    // Clean up the URL by removing any query parameters
    const cleanUrl = url.split('?')[0];
    logStep("URL cleaned", { originalUrl: url, cleanUrl });

    // Get the highest order number for existing documents
    logStep("Calculating document order");
    const highestOrder = await prisma.document.findFirst({
      where: { seriesId },
      orderBy: { order: 'desc' },
      select: { order: true }
    });

    const newOrder = order ?? (highestOrder?.order ?? 0) + 1;
    logStep("Order calculated", { newOrder, existingHighestOrder: highestOrder?.order });

    // Create the document record
    logStep("Creating document record", {
      name: documentName,
      seriesId,
      order: newOrder,
      url: cleanUrl
    });
    
    try {
      const document = await prisma.document.create({
        data: {
          name: documentName,
          url: cleanUrl,
          seriesId,
          type: 'series',
          order: newOrder,
          userId: user.id,
        },
      });

      logStep("Document record created successfully", { documentId: document.id });

      return res.status(201).json({
        ...document,
        context: logContext
      });
    } catch (dbError) {
      logStep("Database error creating document", { 
        error: dbError instanceof Error ? dbError.message : "Unknown error",
        data: {
          name: documentName,
          url: cleanUrl,
          seriesId,
          type: 'series',
          order: newOrder,
          userId: user.id,
        }
      });
      throw dbError;
    }
  } catch (error) {
    logStep("Final error", { error: error instanceof Error ? error.message : "Unknown error" });
    return res.status(500).json({ 
      error: "Error creating document",
      details: error instanceof Error ? error.message : "Unknown error",
      context: logContext
    });
  }
}
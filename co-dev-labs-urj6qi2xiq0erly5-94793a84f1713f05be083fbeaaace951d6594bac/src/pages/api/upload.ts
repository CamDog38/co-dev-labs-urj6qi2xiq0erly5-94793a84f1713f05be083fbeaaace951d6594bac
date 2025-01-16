import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@/util/supabase/api'
import formidable from 'formidable'
import { createReadStream } from 'fs'

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const supabase = createClient(req, res)

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('Auth error:', authError)
      return res.status(401).json({ 
        message: 'Unauthorized', 
        details: 'Please log in to upload files'
      })
    }

    // Parse form data with more detailed error handling
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10MB
      allowEmptyFiles: false,
      multiples: false,
    })

    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) {
          console.error('Form parsing error:', err)
          reject(new Error(`Form parsing failed: ${err.message}`))
          return
        }
        resolve([fields, files])
      })
    }) as [formidable.Fields, formidable.Files]

    const file = files.file?.[0] || files.file
    if (!file) {
      return res.status(400).json({ 
        message: 'Missing file',
        details: 'No file was provided in the request'
      })
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf'
    ]
    
    if (!allowedTypes.includes(file.mimetype || '')) {
      return res.status(400).json({ 
        message: 'Invalid file type',
        details: `Only images (JPG, PNG, GIF) and PDF files are allowed. Received: ${file.mimetype}`
      })
    }

    // Generate a clean filename
    const fileExtension = file.originalFilename ? file.originalFilename.split('.').pop() : 'pdf'
    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`
    const bucketName = file.mimetype === 'application/pdf' ? 'documents' : 'images'

    // Read file and upload
    try {
      const fileStream = createReadStream(file.filepath)
      // Read the file into a Buffer instead of using a stream
      const fileBuffer = await new Promise<Buffer>((resolve, reject) => {
        const chunks: Buffer[] = [];
        const fileStream = createReadStream(file.filepath);
        fileStream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        fileStream.on('error', (err) => reject(err));
        fileStream.on('end', () => resolve(Buffer.concat(chunks)));
      });

      const { data, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(fileName, fileBuffer, {
          contentType: file.mimetype || 'application/octet-stream',
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('Supabase upload error:', uploadError)
        return res.status(500).json({ 
          message: 'Upload failed',
          details: uploadError.message
        })
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName)

      if (!urlData?.publicUrl) {
        return res.status(500).json({ 
          message: 'Failed to generate public URL',
          details: 'Could not generate public URL for uploaded file'
        })
      }

      return res.status(200).json({ 
        url: urlData.publicUrl,
        fileName: file.originalFilename || fileName
      })
    } catch (uploadError: any) {
      console.error('File stream error:', uploadError)
      return res.status(500).json({ 
        message: 'Upload failed',
        details: `File stream error: ${uploadError.message}`
      })
    }
  } catch (error: any) {
    console.error('Upload handler error:', error)
    return res.status(500).json({ 
      message: 'Upload failed',
      details: error?.message || 'An unexpected error occurred during upload'
    })
  }
}
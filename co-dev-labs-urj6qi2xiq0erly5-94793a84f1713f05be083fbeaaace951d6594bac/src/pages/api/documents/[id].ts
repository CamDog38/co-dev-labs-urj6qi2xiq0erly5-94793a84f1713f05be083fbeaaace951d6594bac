import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { createClient } from "@/util/supabase/api";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;
  const supabase = createClient(req, res);

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method === "DELETE") {
    try {
      await prisma.document.delete({
        where: { id: String(id) },
      });

      return res.status(200).json({ message: "Document deleted successfully" });
    } catch (error) {
      console.error("Error deleting document:", error);
      return res.status(500).json({ error: "Error deleting document" });
    }
  } else if (req.method === "PUT") {
    try {
      const { order } = req.body;

      const document = await prisma.document.update({
        where: { id: String(id) },
        data: { order },
      });

      return res.status(200).json(document);
    } catch (error) {
      console.error("Error updating document:", error);
      return res.status(500).json({ error: "Error updating document" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
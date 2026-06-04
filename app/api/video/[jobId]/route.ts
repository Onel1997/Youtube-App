import { createReadStream, statSync } from "fs";
import { Readable } from "stream";
import { NextRequest, NextResponse } from "next/server";
import { getFinalVideoPath, jobVideoExists } from "@/lib/video-jobs";

export async function GET(
  _request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  const jobId = params.jobId;

  if (!jobId || !jobVideoExists(jobId)) {
    return NextResponse.json(
      { success: false, error: "Video nicht gefunden oder abgelaufen." },
      { status: 404 }
    );
  }

  const filePath = getFinalVideoPath(jobId);
  const stat = statSync(filePath);
  const stream = createReadStream(filePath);

  const webStream = Readable.toWeb(stream) as ReadableStream;

  return new NextResponse(webStream, {
    headers: {
      "Content-Type": "video/mp4",
      "Content-Length": String(stat.size),
      "Content-Disposition": `attachment; filename="video-${jobId.slice(0, 8)}.mp4"`,
      "Cache-Control": "no-store",
    },
  });
}

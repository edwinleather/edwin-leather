import { baseLayout } from "./base-layout.js";

export function feedbackReceived(params: {
  name: string;
  topic?: string;
  message: string;
}): string {
  const topicBlock = params.topic
    ? `<p style="margin:4px 0 0;color:#8b7355;font-size:13px;"><strong>Topic:</strong> ${params.topic}</p>`
    : "";

  const content = `
    <h2 style="color:#3c2415;margin:0 0 8px;font-size:20px;">Thank You for Your Feedback</h2>
    <p style="color:#8b7355;margin:0 0 24px;font-size:14px;">Hi ${params.name}, we've received your feedback.</p>

    <div style="background:#f5f0eb;padding:16px;border-radius:6px;margin-bottom:24px;">
      <p style="margin:0;color:#3c2415;font-size:14px;font-weight:bold;">Your Message</p>
      ${topicBlock}
      <p style="margin:8px 0 0;color:#8b7355;font-size:13px;">${params.message}</p>
    </div>

    <p style="color:#8b7355;font-size:14px;">Our team will review your feedback and get back to you if needed.</p>
  `;
  return baseLayout(content);
}

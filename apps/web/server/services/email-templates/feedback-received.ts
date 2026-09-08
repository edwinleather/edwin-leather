import { baseLayout } from "./base-layout.js";

export function feedbackReceived(params: {
  name: string;
  topic?: string;
  message: string;
}): string {
  const topicBlock = params.topic
    ? `<p style="margin:0 0 8px;color:#8b7355;font-size:11px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Topic: ${params.topic}</p>`
    : "";

  const content = `
    <div style="text-align:center;margin-bottom:28px;">
      <div style="width:56px;height:56px;background:linear-gradient(135deg, #d4a843, #c4983a);border-radius:50%;margin:0 auto 16px;display:inline-block;line-height:56px;">
        <span style="font-size:24px;color:#fff;">&#9829;</span>
      </div>
      <h2 style="color:#3c2415;margin:0 0 8px;font-size:22px;font-weight:600;">Thank You</h2>
      <p style="color:#8b7355;margin:0;font-size:14px;">Hi ${params.name}, we've received your feedback.</p>
    </div>

    <div style="background:#faf8f5;border:1px solid #f0e8dd;border-radius:10px;padding:20px;margin-bottom:24px;">
      ${topicBlock}
      <p style="margin:0;color:#3c2415;font-size:14px;line-height:1.6;font-style:italic;">"${params.message}"</p>
    </div>

    <p style="color:#6b5a48;font-size:14px;text-align:center;line-height:1.6;">Our team will review your feedback and get back to you if needed. We appreciate your time!</p>
  `;
  return baseLayout(content);
}

const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, LevelFormat, HeadingLevel, BorderStyle,
  WidthType, ShadingType, PageNumber, PageBreak, TabStopType, TabStopPosition
} = require("docx");

const ACCENT = "1B4F72";
const ACCENT_LIGHT = "D4E6F1";
const ACCENT_MED = "2E86C1";
const GRAY = "F2F3F4";
const WHITE = "FFFFFF";
const BLACK = "000000";
const DARK = "2C3E50";

const border = { style: BorderStyle.SINGLE, size: 1, color: "D5D8DC" };
const borders = { top: border, bottom: border, left: border, right: border };
const noBorders = {
  top: { style: BorderStyle.NONE, size: 0 },
  bottom: { style: BorderStyle.NONE, size: 0 },
  left: { style: BorderStyle.NONE, size: 0 },
  right: { style: BorderStyle.NONE, size: 0 },
};
const cellMargins = { top: 80, bottom: 80, left: 120, right: 120 };

function headerCell(text, width) {
  return new TableCell({
    borders,
    width: { size: width, type: WidthType.DXA },
    shading: { fill: ACCENT, type: ShadingType.CLEAR },
    margins: cellMargins,
    verticalAlign: "center",
    children: [new Paragraph({ alignment: AlignmentType.LEFT, children: [new TextRun({ text, bold: true, color: WHITE, font: "Arial", size: 20 })] })],
  });
}

function dataCell(text, width, opts = {}) {
  return new TableCell({
    borders,
    width: { size: width, type: WidthType.DXA },
    shading: opts.shading ? { fill: opts.shading, type: ShadingType.CLEAR } : undefined,
    margins: cellMargins,
    verticalAlign: "center",
    children: [new Paragraph({ alignment: opts.align || AlignmentType.LEFT, children: [new TextRun({ text, font: "Arial", size: 20, bold: !!opts.bold, color: opts.color || DARK })] })],
  });
}

function spacer(h = 100) {
  return new Paragraph({ spacing: { before: h, after: h }, children: [] });
}

function heading(text, level = HeadingLevel.HEADING_1) {
  return new Paragraph({ heading: level, spacing: { before: 300, after: 200 }, children: [new TextRun({ text, font: "Arial", bold: true, color: ACCENT, size: level === HeadingLevel.HEADING_1 ? 32 : 26 })] });
}

function para(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 120 },
    alignment: opts.align || AlignmentType.LEFT,
    children: [new TextRun({ text, font: "Arial", size: 20, color: opts.color || DARK, bold: !!opts.bold, italics: !!opts.italics })],
  });
}

function bulletItem(text) {
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    spacing: { after: 60 },
    children: [new TextRun({ text, font: "Arial", size: 20, color: DARK })],
  });
}

function numberItem(text) {
  return new Paragraph({
    numbering: { reference: "numbers", level: 0 },
    spacing: { after: 80 },
    children: [new TextRun({ text, font: "Arial", size: 20, color: DARK })],
  });
}

function accentLine() {
  return new Paragraph({
    spacing: { before: 100, after: 100 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: ACCENT_MED, space: 1 } },
    children: [],
  });
}

// ─── KPI highlight box ───
function kpiRow(items) {
  const colW = Math.floor(9360 / items.length);
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: items.map(() => colW),
    rows: [
      new TableRow({
        children: items.map(([num, label]) =>
          new TableCell({
            borders: noBorders,
            width: { size: colW, type: WidthType.DXA },
            shading: { fill: ACCENT_LIGHT, type: ShadingType.CLEAR },
            margins: { top: 200, bottom: 200, left: 150, right: 150 },
            children: [
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: num, font: "Arial", size: 40, bold: true, color: ACCENT })] }),
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: label, font: "Arial", size: 18, color: DARK })] }),
            ],
          })
        ),
      }),
    ],
  });
}

// ─── Build document ───
const doc = new Document({
  styles: {
    default: { document: { run: { font: "Arial", size: 20 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 32, bold: true, font: "Arial", color: ACCENT },
        paragraph: { spacing: { before: 300, after: 200 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, font: "Arial", color: ACCENT },
        paragraph: { spacing: { before: 240, after: 160 }, outlineLevel: 1 } },
    ],
  },
  numbering: {
    config: [
      { reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "numbers", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "numbers2", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "numbers3", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    ],
  },
  sections: [
    // ═══════════ PAGE 1: TITLE ═══════════
    {
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      children: [
        spacer(2000),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [new TextRun({ text: "ALMCO PLUMBING INC.", font: "Arial", size: 22, color: ACCENT_MED, bold: true })] }),
        accentLine(),
        spacer(400),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: "AI Voice Agent", font: "Arial", size: 52, bold: true, color: ACCENT })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [new TextRun({ text: "+", font: "Arial", size: 36, color: ACCENT_MED })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: "ServiceTitan Integration", font: "Arial", size: 52, bold: true, color: ACCENT })] }),
        spacer(200),
        accentLine(),
        spacer(200),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 }, children: [new TextRun({ text: "Commercial Proposal", font: "Arial", size: 28, color: DARK, italics: true })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 }, children: [new TextRun({ text: "April 2026", font: "Arial", size: 22, color: DARK })] }),
        spacer(1600),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Prepared by InLeads AI", font: "Arial", size: 20, color: ACCENT_MED })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "San Diego, California", font: "Arial", size: 20, color: ACCENT_MED })] }),
      ],
    },

    // ═══════════ PAGE 2+: CONTENT ═══════════
    {
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1440, right: 1440, bottom: 1080, left: 1440 },
        },
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: ACCENT_MED, space: 4 } },
            children: [
              new TextRun({ text: "Almco Plumbing \u2014 AI Voice Agent Proposal", font: "Arial", size: 16, color: ACCENT_MED, italics: true }),
            ],
            tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "Page ", font: "Arial", size: 16, color: "999999" }),
              new TextRun({ children: [PageNumber.CURRENT], font: "Arial", size: 16, color: "999999" }),
            ],
          })],
        }),
      },
      children: [
        // ── EXECUTIVE SUMMARY ──
        heading("1. Executive Summary"),
        para("Almco Plumbing Inc. is a premium residential plumbing company in San Diego specializing in sewer diagnostics and trenchless repair. This proposal outlines a fully automated AI voice agent integrated with ServiceTitan CRM to handle inbound calls 24/7, book jobs in real-time, and eliminate missed revenue."),
        spacer(100),
        kpiRow([
          ["74%", "Plumbing calls go\nunanswered (industry avg)"],
          ["$125K+", "Annual revenue lost\nfrom missed calls"],
          ["92%", "AI agent booking rate\n(proven benchmark)"],
          ["1,400%+", "ROI on AI voice\nimplementation"],
        ]),
        spacer(200),

        // ── PROBLEM ──
        heading("2. The Problem: Missed Calls = Lost Revenue"),
        para("The home services industry faces a critical challenge: customers who call and don't get an answer almost never call back. For plumbing companies, the numbers are alarming:"),
        spacer(50),
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [5600, 3760],
          rows: [
            new TableRow({ children: [headerCell("Metric", 5600), headerCell("Data", 3760)] }),
            new TableRow({ children: [dataCell("Plumbing calls that go unanswered", 5600), dataCell("74%", 3760, { bold: true, color: "E74C3C" })] }),
            new TableRow({ children: [dataCell("Callers who never retry after voicemail", 5600, { shading: GRAY }), dataCell("85%", 3760, { bold: true, color: "E74C3C", shading: GRAY })] }),
            new TableRow({ children: [dataCell("Emergencies occurring after business hours", 5600), dataCell("62%", 3760, { bold: true })] }),
            new TableRow({ children: [dataCell("Customers who choose the first company to respond", 5600, { shading: GRAY }), dataCell("78%", 3760, { bold: true, shading: GRAY })] }),
            new TableRow({ children: [dataCell("Average emergency plumbing call value", 5600), dataCell("$450 \u2013 $600", 3760, { bold: true })] }),
            new TableRow({ children: [dataCell("Estimated annual revenue loss from missed calls", 5600, { shading: GRAY }), dataCell("$125,000 \u2013 $247,000", 3760, { bold: true, color: "E74C3C", shading: GRAY })] }),
          ],
        }),
        spacer(100),
        para("Every missed call is a customer choosing your competitor instead.", { italics: true }),

        // ── SOLUTION ──
        heading("3. The Solution: AI Voice Agent + ServiceTitan"),
        para("We deploy a human-sounding AI voice agent that answers every call within 100 milliseconds, 24 hours a day, 7 days a week. The agent is fully integrated with ServiceTitan to look up customers, check availability, and book jobs in real-time \u2014 no human intervention required."),
        spacer(100),

        heading("3.1 What the Agent Does During a Call", HeadingLevel.HEADING_2),
        numberItem("Answers instantly \u2014 no hold times, no voicemail, no missed calls"),
        numberItem("Identifies returning customers by phone number from ServiceTitan"),
        numberItem("Pulls complete service history, address, and membership status"),
        numberItem("Understands the plumbing issue through natural conversation"),
        numberItem("Checks real-time technician availability via ServiceTitan Scheduling Pro"),
        numberItem("Books the job directly into ServiceTitan dispatch board"),
        numberItem("Confirms appointment details and sends SMS confirmation automatically"),
        numberItem("Logs full call transcript and summary into the job record"),
        spacer(100),

        heading("3.2 What Happens After the Call", HeadingLevel.HEADING_2),
        bulletItem("Call recording and AI transcript pushed to ServiceTitan"),
        bulletItem("Marketing attribution tracked (source campaign, channel)"),
        bulletItem("Post-call analysis: sentiment, outcome, and summary generated"),
        bulletItem("Follow-up tasks created for unbooked leads"),
        spacer(100),

        heading("3.3 Proactive Outbound Capabilities", HeadingLevel.HEADING_2),
        bulletItem("Membership renewal calls for expiring customers"),
        bulletItem("Appointment reminder and confirmation calls"),
        bulletItem("Follow-up on unbooked estimates"),
        bulletItem("Seasonal maintenance campaign outreach"),

        new Paragraph({ children: [new PageBreak()] }),

        // ── SERVICETITAN INTEGRATION ──
        heading("4. ServiceTitan Integration \u2014 Technical Scope"),
        para("The integration connects to 7 ServiceTitan API namespaces via OAuth 2.0 authentication:"),
        spacer(50),
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [2800, 3800, 2760],
          rows: [
            new TableRow({ children: [headerCell("API Module", 2800), headerCell("Capability", 3800), headerCell("Priority", 2760)] }),
            new TableRow({ children: [dataCell("CRM", 2800, { bold: true }), dataCell("Customer lookup, create, update, contacts, locations", 3800), dataCell("CRITICAL", 2760, { bold: true, color: "E74C3C" })] }),
            new TableRow({ children: [dataCell("Job Planning", 2800, { bold: true, shading: GRAY }), dataCell("Create jobs, bookings, job types, call reasons, notes", 3800, { shading: GRAY }), dataCell("CRITICAL", 2760, { bold: true, color: "E74C3C", shading: GRAY })] }),
            new TableRow({ children: [dataCell("Scheduling Pro", 2800, { bold: true }), dataCell("Real-time available time slots and windows", 3800), dataCell("CRITICAL", 2760, { bold: true, color: "E74C3C" })] }),
            new TableRow({ children: [dataCell("Dispatch", 2800, { bold: true, shading: GRAY }), dataCell("Technician availability, zones, assignments", 3800, { shading: GRAY }), dataCell("HIGH", 2760, { bold: true, color: "E67E22", shading: GRAY })] }),
            new TableRow({ children: [dataCell("Memberships", 2800, { bold: true }), dataCell("Check/create membership, recurring services", 3800), dataCell("HIGH", 2760, { bold: true, color: "E67E22" })] }),
            new TableRow({ children: [dataCell("Telecom", 2800, { bold: true, shading: GRAY }), dataCell("Push call logs, recordings, transcripts", 3800, { shading: GRAY }), dataCell("HIGH", 2760, { bold: true, color: "E67E22", shading: GRAY })] }),
            new TableRow({ children: [dataCell("Accounting", 2800, { bold: true }), dataCell("Invoice lookup, payment status", 3800), dataCell("MEDIUM", 2760, { bold: true, color: "27AE60" })] }),
          ],
        }),
        spacer(100),

        heading("4.1 Data Flow Architecture", HeadingLevel.HEADING_2),
        para("Inbound Call \u2192 AI Voice Agent \u2192 ServiceTitan API \u2192 Job Booked \u2192 SMS Sent", { bold: true }),
        spacer(50),
        numberItem("Call arrives \u2192 AI answers in <100ms"),
        numberItem("GET /crm/customers?phone={caller} \u2192 Customer identified"),
        numberItem("GET /memberships \u2192 Membership status checked"),
        numberItem("GET /schedulingpro/sessions \u2192 Available slots retrieved"),
        numberItem("POST /jbp/jobs \u2192 Job created in dispatch board"),
        numberItem("POST /telecom/calls \u2192 Call log + transcript pushed"),
        numberItem("ServiceTitan auto-sends SMS confirmation to customer"),

        new Paragraph({ children: [new PageBreak()] }),

        // ── VOICE TECHNOLOGY ──
        heading("5. Voice Technology Stack"),
        para("We deploy on two platforms simultaneously for A/B testing and maximum reliability:"),
        spacer(50),
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [2400, 3480, 3480],
          rows: [
            new TableRow({ children: [headerCell("Component", 2400), headerCell("Platform A: VAPI", 3480), headerCell("Platform B: Retell AI", 3480)] }),
            new TableRow({ children: [dataCell("Voice Engine", 2400, { bold: true }), dataCell("ElevenLabs Sarah (Flash v2.5)", 3480), dataCell("ElevenLabs Anna (v3)", 3480)] }),
            new TableRow({ children: [dataCell("LLM", 2400, { bold: true, shading: GRAY }), dataCell("GPT-4o", 3480, { shading: GRAY }), dataCell("GPT-4o", 3480, { shading: GRAY })] }),
            new TableRow({ children: [dataCell("Transcriber", 2400, { bold: true }), dataCell("Deepgram Nova-3", 3480), dataCell("Deepgram (built-in)", 3480)] }),
            new TableRow({ children: [dataCell("Latency", 2400, { bold: true, shading: GRAY }), dataCell("~700ms end-to-end", 3480, { shading: GRAY }), dataCell("~620ms end-to-end", 3480, { shading: GRAY })] }),
            new TableRow({ children: [dataCell("Backchannel", 2400, { bold: true }), dataCell("Automatic", 3480), dataCell("Customizable words + frequency", 3480)] }),
            new TableRow({ children: [dataCell("Filler Words", 2400, { bold: true, shading: GRAY }), dataCell("Automatic injection", 3480, { shading: GRAY }), dataCell("Natural filler + empathy presets", 3480, { shading: GRAY })] }),
            new TableRow({ children: [dataCell("Ambient Sound", 2400, { bold: true }), dataCell("Configurable", 3480), dataCell("Call-center ambient at 25%", 3480)] }),
          ],
        }),
        spacer(100),
        para("Both agents use the same knowledge base, prompt, and call flow \u2014 only the voice engine differs. After testing, we keep the best-performing platform as primary and the other as fallback."),

        // ── COMPETITIVE LANDSCAPE ──
        heading("6. Competitive Landscape"),
        para("Several companies offer voice AI for ServiceTitan. Here is how our solution compares:"),
        spacer(50),
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [2100, 1600, 1800, 1800, 2060],
          rows: [
            new TableRow({ children: [headerCell("Provider", 2100), headerCell("Pricing", 1600), headerCell("Voice Quality", 1800), headerCell("ST Integration", 1800), headerCell("Customization", 2060)] }),
            new TableRow({ children: [dataCell("ServiceTitan (native)", 2100, { bold: true }), dataCell("$2.75/call", 1600), dataCell("Good", 1800), dataCell("Deepest", 1800), dataCell("Limited", 2060)] }),
            new TableRow({ children: [dataCell("Avoca AI", 2100, { bold: true, shading: GRAY }), dataCell("Custom", 1600, { shading: GRAY }), dataCell("Good", 1800, { shading: GRAY }), dataCell("Marketplace", 1800, { shading: GRAY }), dataCell("Medium", 2060, { shading: GRAY })] }),
            new TableRow({ children: [dataCell("Sameday AI", 2100, { bold: true }), dataCell("Custom", 1600), dataCell("Good", 1800), dataCell("Marketplace", 1800), dataCell("Medium", 2060)] }),
            new TableRow({ children: [dataCell("Our Solution", 2100, { bold: true, color: ACCENT, shading: ACCENT_LIGHT }), dataCell("Flat monthly", 1600, { shading: ACCENT_LIGHT }), dataCell("Premium (EL v3)", 1800, { bold: true, shading: ACCENT_LIGHT }), dataCell("Full API", 1800, { shading: ACCENT_LIGHT }), dataCell("Fully custom", 2060, { bold: true, shading: ACCENT_LIGHT })] }),
          ],
        }),
        spacer(50),
        para("Our advantage: fully custom prompt engineering, A/B tested voices, no per-call fees, and complete ownership of the solution."),

        new Paragraph({ children: [new PageBreak()] }),

        // ── ROI ──
        heading("7. Expected Results & ROI"),
        spacer(50),
        kpiRow([
          ["35+", "Additional emergency\ncalls captured/month"],
          ["$47K+", "Direct revenue from\nafter-hours leads (3 mo)"],
          ["70%", "Booking rate for\nall inbound calls"],
        ]),
        spacer(200),

        heading("7.1 Case Studies from Industry", HeadingLevel.HEADING_2),
        spacer(50),
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [2600, 3400, 3360],
          rows: [
            new TableRow({ children: [headerCell("Company", 2600), headerCell("Before AI", 3400), headerCell("After AI", 3360)] }),
            new TableRow({ children: [dataCell("Top Flight Electric", 2600, { bold: true }), dataCell("10% booking rate", 3400), dataCell("70% booking rate, +$170K revenue", 3360, { bold: true, color: "27AE60" })] }),
            new TableRow({ children: [dataCell("Aire Serv", 2600, { bold: true, shading: GRAY }), dataCell("58 after-hours bookings", 3400, { shading: GRAY }), dataCell("208 after-hours bookings", 3360, { bold: true, color: "27AE60", shading: GRAY })] }),
            new TableRow({ children: [dataCell("HL Bowman", 2600, { bold: true }), dataCell("Manual call handling", 3400), dataCell("70% calls handled by AI, 93% satisfaction", 3360, { bold: true, color: "27AE60" })] }),
            new TableRow({ children: [dataCell("TX Plumbing Co.", 2600, { bold: true, shading: GRAY }), dataCell("Missed after-hours calls", 3400, { shading: GRAY }), dataCell("2,000+ calls handled, 450+ jobs booked (3 mo)", 3360, { bold: true, color: "27AE60", shading: GRAY })] }),
          ],
        }),
        spacer(100),

        heading("7.2 Projected ROI for Almco Plumbing", HeadingLevel.HEADING_2),
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [5200, 4160],
          rows: [
            new TableRow({ children: [headerCell("Metric", 5200), headerCell("Projection", 4160)] }),
            new TableRow({ children: [dataCell("Current missed calls per month (est.)", 5200), dataCell("40 \u2013 80", 4160)] }),
            new TableRow({ children: [dataCell("AI-captured bookings per month", 5200, { shading: GRAY }), dataCell("28 \u2013 56 (at 70% rate)", 4160, { shading: GRAY })] }),
            new TableRow({ children: [dataCell("Average job value", 5200), dataCell("$400 \u2013 $500", 4160)] }),
            new TableRow({ children: [dataCell("Additional monthly revenue", 5200, { shading: GRAY }), dataCell("$11,200 \u2013 $28,000", 4160, { bold: true, color: "27AE60", shading: GRAY })] }),
            new TableRow({ children: [dataCell("Additional annual revenue", 5200), dataCell("$134,400 \u2013 $336,000", 4160, { bold: true, color: "27AE60" })] }),
            new TableRow({ children: [dataCell("AI agent monthly cost", 5200, { shading: GRAY }), dataCell("$500 \u2013 $1,500", 4160, { shading: GRAY })] }),
            new TableRow({ children: [dataCell("Projected ROI", 5200, { bold: true }), dataCell("1,400% \u2013 3,700%", 4160, { bold: true, color: ACCENT })] }),
          ],
        }),

        new Paragraph({ children: [new PageBreak()] }),

        // ── TIMELINE ──
        heading("8. Implementation Timeline"),
        spacer(50),
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [1400, 4200, 1900, 1860],
          rows: [
            new TableRow({ children: [headerCell("Phase", 1400), headerCell("Deliverables", 4200), headerCell("Duration", 1900), headerCell("Status", 1860)] }),
            new TableRow({ children: [dataCell("1", 1400, { bold: true }), dataCell("Voice agent setup, prompt engineering, A/B testing", 4200), dataCell("1 week", 1900), dataCell("DONE", 1860, { bold: true, color: "27AE60" })] }),
            new TableRow({ children: [dataCell("2", 1400, { bold: true, shading: GRAY }), dataCell("ServiceTitan OAuth + customer lookup integration", 4200, { shading: GRAY }), dataCell("1 \u2013 2 weeks", 1900, { shading: GRAY }), dataCell("NEXT", 1860, { bold: true, color: ACCENT_MED, shading: GRAY })] }),
            new TableRow({ children: [dataCell("3", 1400, { bold: true }), dataCell("Scheduling Pro + real-time job booking", 4200), dataCell("1 \u2013 2 weeks", 1900), dataCell("Planned", 1860)] }),
            new TableRow({ children: [dataCell("4", 1400, { bold: true, shading: GRAY }), dataCell("Membership check + call logging + post-call analytics", 4200, { shading: GRAY }), dataCell("1 week", 1900, { shading: GRAY }), dataCell("Planned", 1860, { shading: GRAY })] }),
            new TableRow({ children: [dataCell("5", 1400, { bold: true }), dataCell("Testing, QA, sandbox validation, go-live", 4200), dataCell("1 \u2013 2 weeks", 1900), dataCell("Planned", 1860)] }),
          ],
        }),
        spacer(50),
        para("Total estimated timeline: 5 \u2013 8 weeks from ServiceTitan API access.", { bold: true }),

        // ── WHAT WE NEED ──
        heading("9. What We Need from Almco"),
        numberItem("ServiceTitan API credentials (Client ID, Client Secret, App Key, Tenant ID)"),
        numberItem("Access to ServiceTitan Scheduling Pro configuration"),
        numberItem("List of job types and call reasons used in dispatch"),
        numberItem("Preferred business hours and after-hours routing rules"),
        numberItem("Test phone number for validation before go-live"),
        spacer(100),

        // ── NEXT STEPS ──
        heading("10. Next Steps"),
        para("Phase 1 is already complete \u2014 two AI voice agents are live and ready for testing:"),
        spacer(50),
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [3120, 3120, 3120],
          rows: [
            new TableRow({ children: [headerCell("Platform", 3120), headerCell("Phone Number", 3120), headerCell("Status", 3120)] }),
            new TableRow({ children: [dataCell("VAPI", 3120, { bold: true }), dataCell("+1 (858) 251-5093", 3120, { bold: true }), dataCell("Live \u2014 call now", 3120, { bold: true, color: "27AE60" })] }),
            new TableRow({ children: [dataCell("Retell AI", 3120, { bold: true, shading: GRAY }), dataCell("+1 (858) 943-2598", 3120, { bold: true, shading: GRAY }), dataCell("Live \u2014 call now", 3120, { bold: true, color: "27AE60", shading: GRAY })] }),
          ],
        }),
        spacer(100),
        para("To proceed with ServiceTitan integration, we need API credentials. Once received, Phase 2 begins immediately."),
        spacer(200),
        accentLine(),
        spacer(100),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Ready to eliminate missed calls and capture $134K+ in annual revenue?", font: "Arial", size: 24, bold: true, color: ACCENT })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 100 }, children: [new TextRun({ text: "Call either number above to experience the AI agent firsthand.", font: "Arial", size: 22, color: DARK })] }),
      ],
    },
  ],
});

Packer.toBuffer(doc).then((buffer) => {
  const outPath = "/Users/kp/Projects/my/almco/almco-plumbing-voice-assistent/docs/Almco_Commercial_Proposal.docx";
  fs.writeFileSync(outPath, buffer);
  console.log("Document created:", outPath);
  console.log("Size:", (buffer.length / 1024).toFixed(1), "KB");
});

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
const DARK = "2C3E50";
const GREEN = "27AE60";
const RED = "E74C3C";
const ORANGE = "E67E22";

const border = { style: BorderStyle.SINGLE, size: 1, color: "D5D8DC" };
const borders = { top: border, bottom: border, left: border, right: border };
const noBorders = { top: { style: BorderStyle.NONE, size: 0 }, bottom: { style: BorderStyle.NONE, size: 0 }, left: { style: BorderStyle.NONE, size: 0 }, right: { style: BorderStyle.NONE, size: 0 } };
const cellMargins = { top: 80, bottom: 80, left: 120, right: 120 };

function hCell(text, width) {
  return new TableCell({ borders, width: { size: width, type: WidthType.DXA }, shading: { fill: ACCENT, type: ShadingType.CLEAR }, margins: cellMargins, verticalAlign: "center",
    children: [new Paragraph({ children: [new TextRun({ text, bold: true, color: WHITE, font: "Arial", size: 20 })] })] });
}
function dCell(text, width, o = {}) {
  return new TableCell({ borders, width: { size: width, type: WidthType.DXA }, shading: o.bg ? { fill: o.bg, type: ShadingType.CLEAR } : undefined, margins: cellMargins, verticalAlign: "center",
    children: [new Paragraph({ alignment: o.align || AlignmentType.LEFT, children: [new TextRun({ text, font: "Arial", size: 20, bold: !!o.bold, color: o.color || DARK, italics: !!o.i })] })] });
}
function spacer(h=100) { return new Paragraph({ spacing: { before: h, after: h }, children: [] }); }
function h1(text) { return new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 300, after: 200 }, children: [new TextRun({ text, font: "Arial", bold: true, color: ACCENT, size: 32 })] }); }
function h2(text) { return new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 160 }, children: [new TextRun({ text, font: "Arial", bold: true, color: ACCENT, size: 26 })] }); }
function p(text, o={}) { return new Paragraph({ spacing: { after: 120 }, alignment: o.align || AlignmentType.LEFT, children: [new TextRun({ text, font: "Arial", size: 20, color: o.color || DARK, bold: !!o.bold, italics: !!o.i })] }); }
function bullet(text) { return new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 60 }, children: [new TextRun({ text, font: "Arial", size: 20, color: DARK })] }); }
function num(text, ref="numbers") { return new Paragraph({ numbering: { reference: ref, level: 0 }, spacing: { after: 80 }, children: [new TextRun({ text, font: "Arial", size: 20, color: DARK })] }); }
function line() { return new Paragraph({ spacing: { before: 100, after: 100 }, border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: ACCENT_MED, space: 1 } }, children: [] }); }
function kpi(items) {
  const w = Math.floor(9360 / items.length);
  return new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: items.map(() => w), rows: [
    new TableRow({ children: items.map(([n, l]) => new TableCell({ borders: noBorders, width: { size: w, type: WidthType.DXA }, shading: { fill: ACCENT_LIGHT, type: ShadingType.CLEAR }, margins: { top: 200, bottom: 200, left: 150, right: 150 },
      children: [ new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: n, font: "Arial", size: 40, bold: true, color: ACCENT })] }),
                   new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: l, font: "Arial", size: 18, color: DARK })] }) ] })) })
  ] });
}
function pb() { return new Paragraph({ children: [new PageBreak()] }); }

const doc = new Document({
  styles: {
    default: { document: { run: { font: "Arial", size: 20 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 32, bold: true, font: "Arial", color: ACCENT }, paragraph: { spacing: { before: 300, after: 200 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 26, bold: true, font: "Arial", color: ACCENT }, paragraph: { spacing: { before: 240, after: 160 }, outlineLevel: 1 } },
    ],
  },
  numbering: { config: [
    { reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    { reference: "numbers", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    { reference: "numbers2", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    { reference: "numbers3", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
  ] },
  sections: [
    // ═══════════ TITLE PAGE ═══════════
    { properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
      children: [
        spacer(2000),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [new TextRun({ text: "ALMCO PLUMBING INC.", font: "Arial", size: 22, color: ACCENT_MED, bold: true })] }),
        line(), spacer(400),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: "AI Voice Agent", font: "Arial", size: 52, bold: true, color: ACCENT })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [new TextRun({ text: "Full-Service Virtual Receptionist", font: "Arial", size: 28, color: ACCENT_MED })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: "with ServiceTitan Integration", font: "Arial", size: 28, color: ACCENT_MED })] }),
        spacer(200), line(), spacer(200),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 }, children: [new TextRun({ text: "Scope of Work & Commercial Proposal", font: "Arial", size: 28, color: DARK, italics: true })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 }, children: [new TextRun({ text: "April 2026", font: "Arial", size: 22, color: DARK })] }),
        spacer(1400),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Prepared by InLeads AI", font: "Arial", size: 20, color: ACCENT_MED })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "San Diego, California", font: "Arial", size: 20, color: ACCENT_MED })] }),
      ],
    },

    // ═══════════ CONTENT ═══════════
    { properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1080, left: 1440 } } },
      headers: { default: new Header({ children: [new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: ACCENT_MED, space: 4 } }, children: [new TextRun({ text: "Almco Plumbing \u2014 AI Voice Agent \u2014 Scope & Pricing", font: "Arial", size: 16, color: ACCENT_MED, italics: true })] })] }) },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Page ", font: "Arial", size: 16, color: "999999" }), new TextRun({ children: [PageNumber.CURRENT], font: "Arial", size: 16, color: "999999" })] })] }) },
      children: [

        // ── 1. WHAT WE BUILD ──
        h1("1. What We Build"),
        p("A fully autonomous AI receptionist that answers every inbound call to Almco Plumbing 24/7/365. The agent sounds like a real American English-speaking employee, handles customer inquiries, negotiates pricing within approved ranges, books appointments directly into your calendar, and transfers to a live operator on demand."),
        spacer(50),
        kpi([ ["24/7", "Availability\nno missed calls"], ["<1s", "Answer time\nno hold music"], ["$0", "Per-call fees\nflat monthly"] ]),
        spacer(200),

        // ── 2. AGENT CAPABILITIES ──
        h1("2. Agent Capabilities \u2014 Full Feature List"),
        spacer(50),

        h2("2.1 Inbound Call Handling"),
        bullet("Answers every call instantly \u2014 no voicemail, no hold, no missed calls"),
        bullet("Speaks clean, natural American English \u2014 indistinguishable from a live receptionist"),
        bullet("Uses natural filler words, backchannel responses, and dynamic speech pacing"),
        bullet("Ambient call-center background sound for realistic phone experience"),
        spacer(50),

        h2("2.2 Service Consultation"),
        bullet("Explains all Almco services in plain language: sewer camera inspection, hydrojetting, trenchless repair (epoxy lining), pipe bursting, general plumbing, leak detection, water heaters, repiping"),
        bullet("Trained on complete Almco knowledge base (company docs, service manuals, pricing policies)"),
        bullet("Answers questions about process, timeline, and what to expect"),
        bullet("Explains the $79 diagnostic fee and how it gets credited toward repairs"),
        bullet("Offers free sewer camera inspection for qualifying homes (pre-1970)"),
        spacer(50),

        h2("2.3 Pricing Negotiation & Discounts"),
        bullet("Quotes standard pricing for each service category"),
        bullet("Authorized to offer discounts within a pre-configured range (e.g., 5\u201315%)"),
        bullet("Discount triggers configurable: first-time customer, membership signup, bundled services, seasonal promotions"),
        bullet("Never goes below the minimum approved price floor"),
        bullet("Escalates to a live operator if the customer pushes beyond the discount range"),
        spacer(50),

        h2("2.4 Appointment Booking"),
        bullet("Checks real-time availability via calendar integration (Google Calendar, ServiceTitan Scheduling Pro, or custom)"),
        bullet("Offers the customer 2\u20133 available time slots"),
        bullet("Books the appointment and confirms date, time, address, and service type"),
        bullet("Sends automatic SMS/email confirmation to the customer"),
        bullet("Handles rescheduling and cancellation requests"),
        spacer(50),

        h2("2.5 Live Operator Transfer"),
        bullet("Transfers to a real person instantly when the customer requests it"),
        bullet("Transfer trigger: customer says \"let me speak to someone\", \"talk to a person\", \"connect me to a manager\", or similar"),
        bullet("Warm transfer \u2014 agent briefs the operator on the customer's issue before handing off"),
        bullet("Configurable transfer number (office line, mobile, or call queue)"),
        bullet("If no operator available, takes a detailed message and schedules a callback"),
        spacer(50),

        h2("2.6 After-Call Processing"),
        bullet("Full call transcript and AI-generated summary saved"),
        bullet("Call recording stored and accessible from dashboard"),
        bullet("Customer sentiment analysis (positive / neutral / negative)"),
        bullet("Lead categorization: hot, warm, cold"),
        bullet("All data pushed to ServiceTitan CRM automatically"),

        pb(),

        // ── 3. SERVICETITAN INTEGRATION ──
        h1("3. ServiceTitan Integration"),
        p("The agent connects to ServiceTitan via REST API (OAuth 2.0) to operate as a fully integrated member of your dispatch team:"),
        spacer(50),
        new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: [3200, 6160], rows: [
          new TableRow({ children: [hCell("Integration Point", 3200), hCell("What It Does", 6160)] }),
          new TableRow({ children: [dCell("Customer Lookup", 3200, { bold: true }), dCell("Instantly identifies returning customers by phone number. Pulls name, address, service history, and membership status.", 6160)] }),
          new TableRow({ children: [dCell("New Customer Creation", 3200, { bold: true, bg: GRAY }), dCell("Creates new customer and location records in ServiceTitan when a first-time caller books.", 6160, { bg: GRAY })] }),
          new TableRow({ children: [dCell("Real-Time Scheduling", 3200, { bold: true }), dCell("Queries available time slots from Scheduling Pro and books directly into the dispatch board.", 6160)] }),
          new TableRow({ children: [dCell("Job Creation", 3200, { bold: true, bg: GRAY }), dCell("Creates jobs with correct job type, call reason, and appointment window. Dispatch board updates automatically.", 6160, { bg: GRAY })] }),
          new TableRow({ children: [dCell("Membership Check", 3200, { bold: true }), dCell("Verifies active membership, applies benefits and priority scheduling for members.", 6160)] }),
          new TableRow({ children: [dCell("Call Logging", 3200, { bold: true, bg: GRAY }), dCell("Pushes call recording, transcript, and AI summary as a note on the job record.", 6160, { bg: GRAY })] }),
          new TableRow({ children: [dCell("Marketing Attribution", 3200, { bold: true }), dCell("Tracks call source for ROI reporting. Every AI-booked job is tagged with campaign data.", 6160)] }),
        ] }),
        spacer(50),
        p("ServiceTitan auto-sends SMS booking confirmation to the customer \u2014 no additional setup needed.", { i: true }),

        pb(),

        // ── 4. PRICING ──
        h1("4. Pricing"),
        spacer(50),
        new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: [4680, 4680], rows: [
          new TableRow({ children: [
            new TableCell({ borders: noBorders, width: { size: 4680, type: WidthType.DXA }, shading: { fill: ACCENT, type: ShadingType.CLEAR }, margins: { top: 300, bottom: 300, left: 300, right: 300 },
              children: [
                new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "One-Time Setup", font: "Arial", size: 22, color: ACCENT_LIGHT })] }),
                new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 100 }, children: [new TextRun({ text: "$5,000", font: "Arial", size: 52, bold: true, color: WHITE })] }),
                new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 50 }, children: [new TextRun({ text: "Full integration & deployment", font: "Arial", size: 18, color: ACCENT_LIGHT })] }),
              ] }),
            new TableCell({ borders: noBorders, width: { size: 4680, type: WidthType.DXA }, shading: { fill: ACCENT_MED, type: ShadingType.CLEAR }, margins: { top: 300, bottom: 300, left: 300, right: 300 },
              children: [
                new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Monthly Support", font: "Arial", size: 22, color: ACCENT_LIGHT })] }),
                new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 100 }, children: [new TextRun({ text: "$500/mo", font: "Arial", size: 52, bold: true, color: WHITE })] }),
                new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 50 }, children: [new TextRun({ text: "Maintenance, updates & optimization", font: "Arial", size: 18, color: ACCENT_LIGHT })] }),
              ] }),
          ] }),
        ] }),
        spacer(200),

        h2("4.1 What's Included in Setup ($5,000)"),
        num("AI voice agent development, prompt engineering, and knowledge base training", "numbers2"),
        num("A/B testing across two voice platforms (VAPI + Retell AI) to select the best-sounding agent", "numbers2"),
        num("Full ServiceTitan API integration (customer lookup, job booking, scheduling, call logging)", "numbers2"),
        num("Calendar integration for real-time appointment booking", "numbers2"),
        num("Pricing negotiation logic with configurable discount ranges", "numbers2"),
        num("Live operator transfer with warm handoff", "numbers2"),
        num("Dedicated San Diego phone number (858 area code)", "numbers2"),
        num("Post-call analytics dashboard (transcripts, sentiment, conversion tracking)", "numbers2"),
        num("Testing, QA, and go-live support", "numbers2"),
        spacer(100),

        h2("4.2 What's Included in Monthly Support ($500/mo)"),
        bullet("Unlimited inbound calls \u2014 no per-call or per-minute fees"),
        bullet("AI platform costs (voice engine, LLM, transcription, telephony)"),
        bullet("Prompt tuning and optimization based on call performance"),
        bullet("Knowledge base updates when services or pricing change"),
        bullet("ServiceTitan integration monitoring and maintenance"),
        bullet("Monthly performance report (calls handled, booking rate, sentiment)"),
        bullet("Priority support with same-day response"),
        spacer(100),

        h2("4.3 What's NOT Included"),
        bullet("ServiceTitan subscription fees (your existing plan)"),
        bullet("Outbound calling campaigns (available as add-on, priced separately)"),
        bullet("Custom CRM development beyond ServiceTitan integration"),
        spacer(50),
        p("No long-term contracts. Cancel monthly support anytime with 30 days notice. The setup work (agent, integrations, phone number) is yours to keep.", { i: true }),

        pb(),

        // ── 5. ROI ──
        h1("5. Return on Investment"),
        spacer(50),
        kpi([ ["74%", "Plumbing calls go\nunanswered (industry)"], ["$125K+", "Annual revenue lost\nfrom missed calls"], ["70%", "AI booking rate\n(proven benchmark)"] ]),
        spacer(200),

        new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: [5200, 4160], rows: [
          new TableRow({ children: [hCell("Metric", 5200), hCell("Almco Projection", 4160)] }),
          new TableRow({ children: [dCell("Missed calls per month (estimated)", 5200), dCell("40 \u2013 80", 4160)] }),
          new TableRow({ children: [dCell("AI-captured bookings per month (at 70% rate)", 5200, { bg: GRAY }), dCell("28 \u2013 56", 4160, { bg: GRAY })] }),
          new TableRow({ children: [dCell("Average job value", 5200), dCell("$400 \u2013 $500", 4160)] }),
          new TableRow({ children: [dCell("Additional monthly revenue", 5200, { bg: GRAY }), dCell("$11,200 \u2013 $28,000", 4160, { bold: true, color: GREEN, bg: GRAY })] }),
          new TableRow({ children: [dCell("Additional annual revenue", 5200), dCell("$134,400 \u2013 $336,000", 4160, { bold: true, color: GREEN })] }),
          new TableRow({ children: [dCell("Your annual cost (setup + 12 months)", 5200, { bg: GRAY }), dCell("$11,000", 4160, { bg: GRAY })] }),
          new TableRow({ children: [dCell("Projected annual ROI", 5200, { bold: true }), dCell("1,100% \u2013 2,950%", 4160, { bold: true, color: ACCENT })] }),
        ] }),
        spacer(100),
        p("For context: a full-time human receptionist costs $35,000\u2013$45,000/year in San Diego, works limited hours, and still misses calls. The AI agent costs $11,000/year total and never misses a call.", { i: true }),

        pb(),

        // ── 6. TIMELINE ──
        h1("6. Implementation Timeline"),
        spacer(50),
        new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: [800, 3800, 1800, 1400, 1560], rows: [
          new TableRow({ children: [hCell("#", 800), hCell("Deliverables", 3800), hCell("Duration", 1800), hCell("Cost", 1400), hCell("Status", 1560)] }),
          new TableRow({ children: [dCell("1", 800, { bold: true }), dCell("Voice agent setup, prompt engineering, knowledge base, A/B voice testing", 3800), dCell("Week 1", 1800), dCell("Included", 1400), dCell("DONE", 1560, { bold: true, color: GREEN })] }),
          new TableRow({ children: [dCell("2", 800, { bold: true, bg: GRAY }), dCell("ServiceTitan OAuth + customer lookup + membership check", 3800, { bg: GRAY }), dCell("Week 2\u20133", 1800, { bg: GRAY }), dCell("Included", 1400, { bg: GRAY }), dCell("NEXT", 1560, { bold: true, color: ACCENT_MED, bg: GRAY })] }),
          new TableRow({ children: [dCell("3", 800, { bold: true }), dCell("Scheduling Pro integration + real-time job booking + calendar sync", 3800), dCell("Week 3\u20134", 1800), dCell("Included", 1400), dCell("Planned", 1560)] }),
          new TableRow({ children: [dCell("4", 800, { bold: true, bg: GRAY }), dCell("Pricing negotiation logic + discount engine + operator transfer", 3800, { bg: GRAY }), dCell("Week 4\u20135", 1800, { bg: GRAY }), dCell("Included", 1400, { bg: GRAY }), dCell("Planned", 1560, { bg: GRAY })] }),
          new TableRow({ children: [dCell("5", 800, { bold: true }), dCell("Call logging, post-call analytics, testing, QA, go-live", 3800), dCell("Week 5\u20136", 1800), dCell("Included", 1400), dCell("Planned", 1560)] }),
        ] }),
        spacer(50),
        p("Total: 5\u20136 weeks from receiving ServiceTitan API credentials. Phase 1 is already complete.", { bold: true }),

        pb(),

        // ── 7. WHAT WE NEED ──
        h1("7. What We Need from Almco"),
        spacer(50),
        new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: [800, 4800, 3760], rows: [
          new TableRow({ children: [hCell("#", 800), hCell("Item", 4800), hCell("Notes", 3760)] }),
          new TableRow({ children: [dCell("1", 800, { bold: true }), dCell("ServiceTitan API credentials", 4800, { bold: true }), dCell("Client ID, Client Secret, App Key, Tenant ID", 3760)] }),
          new TableRow({ children: [dCell("2", 800, { bold: true, bg: GRAY }), dCell("List of job types and call reasons", 4800, { bold: true, bg: GRAY }), dCell("As configured in your dispatch board", 3760, { bg: GRAY })] }),
          new TableRow({ children: [dCell("3", 800, { bold: true }), dCell("Approved pricing ranges and discount limits", 4800, { bold: true }), dCell("Min/max prices per service, max discount %", 3760)] }),
          new TableRow({ children: [dCell("4", 800, { bold: true, bg: GRAY }), dCell("Operator transfer phone number", 4800, { bold: true, bg: GRAY }), dCell("Number to forward when customer requests a live person", 3760, { bg: GRAY })] }),
          new TableRow({ children: [dCell("5", 800, { bold: true }), dCell("Business hours and after-hours rules", 4800, { bold: true }), dCell("When to offer same-day vs. next-day appointments", 3760)] }),
          new TableRow({ children: [dCell("6", 800, { bold: true, bg: GRAY }), dCell("Test phone number for QA", 4800, { bold: true, bg: GRAY }), dCell("Your cell or office line for test calls before go-live", 3760, { bg: GRAY })] }),
        ] }),

        spacer(200),

        // ── 8. LIVE DEMO ──
        h1("8. Live Demo \u2014 Try It Now"),
        p("Phase 1 is already complete. Two AI voice agents are live and ready for you to call right now:"),
        spacer(50),
        new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: [2200, 2800, 2200, 2160], rows: [
          new TableRow({ children: [hCell("Platform", 2200), hCell("Phone Number", 2800), hCell("Voice", 2200), hCell("Status", 2160)] }),
          new TableRow({ children: [dCell("VAPI", 2200, { bold: true }), dCell("+1 (858) 251-5093", 2800, { bold: true }), dCell("ElevenLabs Sarah", 2200), dCell("LIVE", 2160, { bold: true, color: GREEN })] }),
          new TableRow({ children: [dCell("Retell AI", 2200, { bold: true, bg: GRAY }), dCell("+1 (858) 943-2598", 2800, { bold: true, bg: GRAY }), dCell("ElevenLabs Anna", 2200, { bg: GRAY }), dCell("LIVE", 2160, { bold: true, color: GREEN, bg: GRAY })] }),
        ] }),
        spacer(50),
        p("Call either number and test the agent yourself. Ask about services, pricing, scheduling \u2014 have a real conversation. This is what your customers will experience.", { i: true }),

        spacer(200), line(), spacer(100),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Ready to start?", font: "Arial", size: 28, bold: true, color: ACCENT })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 100 }, children: [new TextRun({ text: "Send us your ServiceTitan API credentials and we begin Phase 2 immediately.", font: "Arial", size: 22, color: DARK })] }),
        spacer(100),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "InLeads AI \u2014 San Diego, CA \u2014 hello@inleads.ai", font: "Arial", size: 18, color: ACCENT_MED })] }),
      ],
    },
  ],
});

Packer.toBuffer(doc).then((buffer) => {
  const outPath = "/Users/kp/Projects/my/almco/almco-plumbing-voice-assistent/docs/Almco_Commercial_Proposal.docx";
  fs.writeFileSync(outPath, buffer);
  console.log("Created:", outPath, `(${(buffer.length / 1024).toFixed(1)} KB)`);
});

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)


OUTPUT = "output/pdf/dartantic-vs-dart-frog.pdf"


def para(text, style):
    return Paragraph(text, style)


def build():
    doc = SimpleDocTemplate(
        OUTPUT,
        pagesize=A4,
        rightMargin=16 * mm,
        leftMargin=16 * mm,
        topMargin=14 * mm,
        bottomMargin=14 * mm,
        title="Dartantic vs Dart Frog",
    )

    styles = getSampleStyleSheet()
    title = ParagraphStyle(
        "TitleClean",
        parent=styles["Title"],
        fontName="Helvetica-Bold",
        fontSize=20,
        leading=24,
        textColor=colors.HexColor("#111827"),
        spaceAfter=7,
    )
    subtitle = ParagraphStyle(
        "Subtitle",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=9.5,
        leading=13,
        textColor=colors.HexColor("#4B5563"),
        spaceAfter=12,
    )
    h2 = ParagraphStyle(
        "Section",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=15,
        textColor=colors.HexColor("#111827"),
        spaceBefore=8,
        spaceAfter=5,
    )
    body = ParagraphStyle(
        "BodyClean",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#111827"),
    )
    small = ParagraphStyle(
        "Small",
        parent=body,
        fontSize=7.5,
        leading=9.5,
        textColor=colors.HexColor("#6B7280"),
    )

    story = [
        para("Dartantic vs Dart Frog", title),
        para(
            "Short, neutral comparison for a Flutter + FHIR + AI backend rewrite.",
            subtitle,
        ),
    ]

    data = [
        [
            para("<b>Area</b>", body),
            para("<b>Dartantic</b>", body),
            para("<b>Dart Frog</b>", body),
        ],
        [
            para("Main job", body),
            para("AI agent layer: model calls, tool calling, structured AI workflows.", body),
            para("HTTP backend framework: routes, middleware, request/response handling.", body),
        ],
        [
            para("Can call FHIR?", body),
            para("Yes, through Dart tools/functions you define, such as a Smile CDR HTTP fetch tool.", body),
            para("Yes, through normal server code, but it does not provide AI tool reasoning by itself.", body),
        ],
        [
            para("Can replace Flask routes?", body),
            para("No. It is not the API server layer.", body),
            para("Yes, for route handlers like /validate, /generate, /status, and /submit.", body),
        ],
        [
            para("Can store tasks/apps?", body),
            para("No, not by itself. You still need DB/storage code.", body),
            para("Can host the code that writes to DB/storage, but storage still needs separate packages/services.", body),
        ],
        [
            para("Best use in your app", body),
            para("Inside the generation service: decide and call tools, then produce app output.", body),
            para("Outer backend shell: receive Flutter requests, auth, queue/background work, serve URLs.", body),
        ],
    ]

    table = Table(data, colWidths=[31 * mm, 72 * mm, 72 * mm])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#EEF2F7")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#111827")),
                ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#CBD5E1")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("BACKGROUND", (0, 1), (-1, -1), colors.white),
            ]
        )
    )
    story.append(table)

    story.extend(
        [
            para("Bottom Line", h2),
            para(
                "<b>Dartantic and Dart Frog are not competitors.</b> Dartantic is for AI agent logic. "
                "Dart Frog is for backend API endpoints. For your current Flask-style backend, the clean Dart rewrite would likely use both.",
                body,
            ),
            Spacer(1, 5),
            para("Recommended Architecture", h2),
            para(
                "Flutter -> Dart Frog API -> Dartantic generation service -> FHIR HTTP tools -> DB/storage -> status URL -> preview URL",
                body,
            ),
            Spacer(1, 5),
            para("When To Use Only One", h2),
            para(
                "<b>Only Dartantic:</b> local prototype or direct Flutter experiment, not ideal for your production backend. "
                "<b>Only Dart Frog:</b> normal API server with no AI agent/tool workflow.",
                body,
            ),
            Spacer(1, 9),
            para(
                "Sources checked: Dartantic API documentation for Agent/tools; Dart Frog official docs and pub.dev package page. "
                "Prepared August 26, 2026.",
                small,
            ),
        ]
    )

    def white_page(canvas, _doc):
        canvas.saveState()
        canvas.setFillColor(colors.white)
        canvas.rect(0, 0, A4[0], A4[1], fill=1, stroke=0)
        canvas.restoreState()

    doc.build(story, onFirstPage=white_page, onLaterPages=white_page)


if __name__ == "__main__":
    build()

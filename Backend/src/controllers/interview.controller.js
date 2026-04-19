const pdfParse = require("pdf-parse")
const { generateInterviewReport, generateResumePdf } = require("../services/ai.service")
const interviewReportModel = require("../models/interviewReport.model")

// Generate Interview Report
async function generateInterViewReportController(req, res) {
    try {
        if (!req.file || !req.file.buffer) {
            return res.status(400).json({
                message: "Resume PDF file is required"
            })
        }

        const { selfDescription, jobDescription } = req.body

        if (!selfDescription || !jobDescription) {
            return res.status(400).json({
                message: "selfDescription and jobDescription are required"
            })
        }

        // Parse PDF safely
        let resumeContent
        try {
            resumeContent = await pdfParse(req.file.buffer)
        } catch (err) {
            console.error("PDF PARSE ERROR:", err)
            return res.status(400).json({
                message: "Invalid PDF file"
            })
        }

        // Call AI safely
        let interViewReportByAi
        try {
            interViewReportByAi = await generateInterviewReport({
                resume: resumeContent.text,
                selfDescription,
                jobDescription
            })
        } catch (err) {
            console.error("AI GENERATION ERROR:", err)
            return res.status(500).json({
                message: "Failed to generate interview report"
            })
        }

        // Save to DB safely
        let interviewReport
        try {
            interviewReport = await interviewReportModel.create({
                user: req.user?.id,
                resume: resumeContent.text,
                selfDescription,
                jobDescription,
                ...interViewReportByAi
            })
        } catch (err) {
            console.error("DB SAVE ERROR:", err)
            return res.status(500).json({
                message: "Failed to save interview report"
            })
        }

        res.status(201).json({
            message: "Interview report generated successfully.",
            interviewReport
        })

    } catch (err) {
        console.error("UNEXPECTED ERROR:", err)
        res.status(500).json({
            message: err.message || "Internal server error"
        })
    }
}


// Get Interview Report by ID
async function getInterviewReportByIdController(req, res) {
    try {
        const { interviewId } = req.params

        const interviewReport = await interviewReportModel.findOne({
            _id: interviewId,
            user: req.user?.id
        })

        if (!interviewReport) {
            return res.status(404).json({
                message: "Interview report not found."
            })
        }

        res.status(200).json({
            message: "Interview report fetched successfully.",
            interviewReport
        })

    } catch (err) {
        console.error("GET BY ID ERROR:", err)
        res.status(500).json({
            message: "Failed to fetch interview report"
        })
    }
}


// Get All Reports
async function getAllInterviewReportsController(req, res) {
    try {
        const interviewReports = await interviewReportModel
            .find({ user: req.user?.id })
            .sort({ createdAt: -1 })
            .select("-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan")

        res.status(200).json({
            message: "Interview reports fetched successfully.",
            interviewReports
        })

    } catch (err) {
        console.error("GET ALL ERROR:", err)
        res.status(500).json({
            message: "Failed to fetch interview reports"
        })
    }
}


// Generate Resume PDF
async function generateResumePdfController(req, res) {
    try {
        const { interviewReportId } = req.params

        const interviewReport = await interviewReportModel.findById(interviewReportId)

        if (!interviewReport) {
            return res.status(404).json({
                message: "Interview report not found."
            })
        }

        const { resume, jobDescription, selfDescription } = interviewReport

        let pdfBuffer
        try {
            pdfBuffer = await generateResumePdf({
                resume,
                jobDescription,
                selfDescription
            })
        } catch (err) {
            console.error("PDF GENERATION ERROR:", err)
            return res.status(500).json({
                message: "Failed to generate PDF"
            })
        }

        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename=resume_${interviewReportId}.pdf`
        })

        res.send(pdfBuffer)

    } catch (err) {
        console.error("PDF CONTROLLER ERROR:", err)
        res.status(500).json({
            message: "Internal server error"
        })
    }
}


module.exports = {
    generateInterViewReportController,
    getInterviewReportByIdController,
    getAllInterviewReportsController,
    generateResumePdfController
}
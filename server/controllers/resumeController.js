
const { response, json } = require('express');
const Resume = require('../models/resumeModel');
const { GoogleGenAI } = require("@google/genai");
const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY});
require("dotenv").config();

const auth = async (req, res) => {
    const { user } = req.user;
    res.send({
        status: 200,
        user,
        message: "Welcome User",
    });
}

const getResumes = async (req, res) => {
    try {
        const userId = req.user.user.id;
        const resumes = await Resume.find({ userId }).sort({ createdAt: -1 });
        res.status(200).json(resumes);
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message,
        });
    }
}

const analyzeResume = async (req, res) => {
    const { user } = req.user;
    const { resumeText } = req.body;
    const prompt = `
        You are a resume analysis engine. Analyze the resume text below and RETURN ONLY VALID JSON.
        Do NOT include explanations, markdown, comments, or extra text.
        Return JSON in exactly this structure without markdown fences:
        {
            "resumeScore": number,
            "atsScore": number,
            "suggestions": [ "string", "string", ... ],
            "correctedVersion": "string"
        }
        Rules:
            - "resumeScore" must be between 0–100
            - "atsScore" must be between 0–100
            - "suggestions" must be a list of short, clear bullet-point suggestions
            - "correctedVersion" must be a clean, professionally rewritten version of the resume
            - Do NOT escape newlines manually — the model should return valid JSON automatically
            - Do NOT return anything outside the JSON object
        Resume to analyze:
        """
        ${resumeText}
        """
    `;
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        const aiData = JSON.parse(response.text);
        const newResume = new Resume({
            userId: user.id,
            originalText: resumeText,
            aiImprovedText: aiData.correctedVersion,
            aiScore: aiData.resumeScore,
            atsScore: aiData.atsScore,
            suggestions: aiData.suggestions
        });
        await newResume.save();
        res.status(200).send({
            status: 200,
            newResume,
            message: "Response generated successfully"
        });
    } catch (err) {
        res.status(500).json({
            status: 500,
            success: false,
            message: "Internal Server Error",
        });
    }
}

const deleteResume = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedResume = await Resume.findByIdAndDelete(id);
        res.status(200).json({
            message: "Resume deleted successfully",
            deletedResume
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
}

const clearAllHistory = async (req, res) => {
    try {
        const { user } = req.user;
        await Resume.deleteMany({ userId: user.id });
        res.status(200).json({
            message: "Resume history has been successfully deleted"
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
}

module.exports = { getResumes, analyzeResume, deleteResume, clearAllHistory, auth };

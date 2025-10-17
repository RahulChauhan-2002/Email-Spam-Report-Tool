const { validationResult } = require('express-validator');
const SpamReport = require('../models/SpamReport');

// @desc    Create a new spam report
exports.createReport = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const reportData = {
      ...req.body,
      reportedBy: req.user._id
    };

    const report = await SpamReport.create(reportData);
    
    res.status(201).json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all spam reports with filters
exports.getReports = async (req, res) => {
  try {
    const { status, spamType, severity, page = 1, limit = 10 } = req.query;
    
    const query = {};
    
    // Apply filters
    if (status) query.status = status;
    if (spamType) query.spamType = spamType;
    if (severity) query.severity = severity;
    
    // If not admin, only show user's own reports
    if (req.user.role !== 'admin') {
      query.reportedBy = req.user._id;
    }

    const reports = await SpamReport.find(query)
      .populate('reportedBy', 'name email')
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await SpamReport.countDocuments(query);

    res.json({
      success: true,
      data: reports,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get single spam report by ID
exports.getReportById = async (req, res) => {
  try {
    const report = await SpamReport.findById(req.params.id)
      .populate('reportedBy', 'name email')
      .populate('reviewedBy', 'name email');

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Check if user has access
    if (req.user.role !== 'admin' && report.reportedBy._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this report' });
    }

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update spam report (admin only)
exports.updateReport = async (req, res) => {
  try {
    const { status, notes } = req.body;

    const report = await SpamReport.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    if (status) report.status = status;
    if (notes) report.notes = notes;
    report.reviewedBy = req.user._id;
    report.reviewedAt = Date.now();

    await report.save();

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete spam report (admin only)
exports.deleteReport = async (req, res) => {
  try {
    const report = await SpamReport.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    await report.deleteOne();

    res.json({
      success: true,
      message: 'Report deleted successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

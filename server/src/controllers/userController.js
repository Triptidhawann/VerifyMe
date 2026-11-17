// @desc    Get current authenticated user profile
// @route   GET /api/users/me
// @access  Private (Authenticated Firebase session required)
const getMe = async (req, res, next) => {
  try {
    const user = req.user;
    
    if (user && user.uid) {
      res.status(200).json({
        success: true,
        user: {
          uid: user.uid,
          email: user.email || null,
          name: user.name || null,
          role: user.role || 'USER'
        }
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'User identity could not be resolved from active token session'
      });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMe,
};

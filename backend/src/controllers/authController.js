const { UserModal, OrganizationModal } = require("../models/User");
const { generateOrgNo } = require("../utils/generate-orgNo");
const { generateToken } = require("../utils/jwt");
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { SessionModel } = require('../models/session/SessionSchema');

// 🔹 Signup Controller
exports.signup = async (req, res, next) => {
  try {
    const { name, email, password, phone, role } = req.body;

    // Validate required fields
    if (!name || !password || !phone) {
      return res.status(400).json({ 
        success: false, 
        message: "Name, password, and phone are required" 
      });
    }

    // Check if user exists by email (if provided)
    if (email) {
      const existingUser = await UserModal.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ success: false, message: "Email already exists" });
      }
    }

    const [orgNo] = await Promise.all([
      await generateOrgNo()
    ]);

    // Create organization and user in transaction
    const organization = new OrganizationModal({
      name: `${name.trim()} Organization`,
      orgNo,
      userId: null
    });

    // Create user
    const user = await UserModal.create({ name, email, password, phone, role, orgNo: organization.orgNo });

    // Link user to organization
    organization.userId = user._id;
    await organization.save();

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        activerole: user.activerole,
      },
    });
  } catch (err) {
    next(err);
  }
};

// 🔹 Login Controller
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email & password required" });
    }

    // Find user
    const user = await UserModal.findOne({ $or: [{ email }, { phone: email }] }).select("+password");
    if (!user) {
      return res.status(404).json({ message: "User not found", status: false });
    }

      if (user?.block_status) {
        return res.status(401).json({ message: "Your account is blocked, Please contact the administrator to unblock your account", status: false });
      }


    // Match password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }
    // Generate token
    const token = generateToken(user);

    // compute token hash for storage
    const hashToken = (t) => crypto.createHash('sha256').update(t).digest('hex');
    const tokenHash = hashToken(token);

    // Update last login
    user.last_login = new Date();
    await user.save();

    // Single-session enforcement for non-superadmin users
    const isSuperadmin = (Array.isArray(user.role) && user.role.includes('superadmin')) || user.role === 'superadmin' || user.activerole === 'superadmin';

    if (!isSuperadmin) {
      // delete existing active sessions for this user
      try {
        await SessionModel.deleteMany({ userId: user._id });
      } catch (e) {
        console.error('Failed to remove old sessions for user:', e);
      }
    }

    // decode token to get expiry
    let expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    try {
      const decoded = jwt.decode(token);
      if (decoded && decoded.exp) {
        expiresAt = new Date(decoded.exp * 1000);
      }
    } catch (e) {
      // fallback to 7 days
    }

    // create new session
    let newSession = null;
    try {
      newSession = await SessionModel.create({
        userId: user._id,
        tokenHash,
        orgNo: user.orgNo,
        userAgent: req.headers['user-agent'] || '',
        ipAddress: req.headers['x-forwarded-for'] || req.ip || '',
        createdAt: new Date(),
        expiresAt,
        revoked: false,
        sessionType: 'session'
      });
    } catch (e) {
      console.error('Failed to create session for user:', e);
    }

    // Revoke previous sessions (preserve history) for non-superadmin users
    if (!isSuperadmin && newSession) {
      try {
        await SessionModel.updateMany(
          { userId: user._id, _id: { $ne: newSession._id }, revoked: false },
          { $set: { revoked: true, replacedBy: newSession._id } }
        );
      } catch (e) {
        console.error('Failed to revoke previous sessions for user:', e);
      }
    }

    const cookieOptions = {
      path: "/",
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      httpOnly: true,
      secure: true, // production domain is HTTPS
      sameSite: "none", // required for cross-site cookies
      domain: process.env.NODE_ENV === 'production' ? process.env.COOKIE_DOMAIN : undefined,
    };
    
    return res.status(200)
      .cookie("inventory_management_token", token,cookieOptions)
      .json({
        success: true,
        message: "Login successful",
        token: token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          activerole: user.activerole,
          shop_name: user.shop_name,
        },
      });
  } catch (err) {
    next(err);
  }
};



// 🔹 Get Current User Controller
exports.getMe = async (req, res, next) => {
  try {
    const user = req.profile;

    return res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        activerole: user.activerole,
        shop_name: user.shop_name,
        owner: user.owner,
        block_status: user.block_status,
        orgNo: user.orgNo,
        last_login: user.last_login,
      },
    });
  } catch (err) {
    next(err);
  }
};


exports.Logoutme = async (req, res, next) => {
  try {
    // Attempt to revoke session by token (mark revoked instead of delete)
    const token = req.cookies?.inventory_management_token || req.headers.authorization?.split(' ')[1];
    if (token) {
      const hashToken = (t) => crypto.createHash('sha256').update(t).digest('hex');
      const tokenHash = hashToken(token);
      try {
        await SessionModel.updateOne({ tokenHash }, { $set: { revoked: true } });
      } catch (e) {
        console.error('Failed to revoke session during logout:', e);
      }
    }

    return res.status(200).cookie("inventory_management_token", "", 
      { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: 'lax', expires: new Date(0) }
    ).json({ success: true, message: "Logout successful" });
  } catch (err) {
    next(err);
  }
}
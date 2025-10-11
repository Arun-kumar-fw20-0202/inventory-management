const { UserModal, OrganizationModal } = require("../models/User");
const { generateOrgNo } = require("../utils/generate-orgNo");
const { generateToken } = require("../utils/jwt");

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
    console.log('Generating token for user:', user._id);
    const token = generateToken(user);
    console.log('Generated token:', token ? 'Token created successfully' : 'Token generation failed');

    // Update last login
    user.last_login = new Date();
    await user.save();

    return res.status(200)
      .cookie("inventory_management_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      })
      .json({
        success: true,
        message: "Login successful",
        token: token, // Include token in response for debugging
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
    return res.status(200).cookie("inventory_management_token", "", 
      { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: 'lax', expires: new Date(0) }
    ).json({ success: true, message: "Logout successful" });
  } catch (err) {
    next(err);
  }
}
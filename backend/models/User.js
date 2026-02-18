const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        username: { type: String, required: true, unique: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        passwordHash: { type: String, required: true },
    },
    { timestamps: true }
);

userSchema.index({ username: 1, email: 1 }, { unique: true });

module.exports = {
    User: mongoose.model('User', userSchema)
}

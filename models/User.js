const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BCRYPT_HASH_REGEX = /^\$2[aby]\$\d{2}\$/;
const BCRYPT_ROUNDS = 12;
const PASSWORD_MAX_LENGTH = 72;
const BUDGET_ALIASES = {
    budget: 'low',
    luxury: 'high'
};

function isBcryptHash(value) {
    return BCRYPT_HASH_REGEX.test(String(value || ''));
}

function normalizeBudget(value) {
    if (value === undefined || value === null || value === '') {
        return value;
    }

    const normalized = String(value).trim().toLowerCase();
    return BUDGET_ALIASES[normalized] || normalized;
}

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required.'],
        trim: true,
        minlength: [2, 'Name must be at least 2 characters.'],
        maxlength: [100, 'Name must be 100 characters or fewer.']
    },
    email: {
        type: String,
        required: [true, 'Email is required.'],
        unique: true,
        index: true,
        lowercase: true,
        trim: true,
        match: [EMAIL_REGEX, 'Please enter a valid email address.']
    },
    password: {
        type: String,
        required: [true, 'Password is required.'],
        minlength: [8, 'Password must be at least 8 characters.'],
        maxlength: [PASSWORD_MAX_LENGTH, 'Password must be 72 characters or fewer.'],
        select: false
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },

    city: { type: String, trim: true, default: '' },
    budget: {
        type: String,
        set: normalizeBudget,
        enum: ['low', 'mid', 'high'],
        default: 'mid'
    },
    interests: {
        type: [{ type: String, trim: true }],
        default: []
    },
    co2Saved: { type: Number, min: 0, default: 0 },
    co2Footprint: { type: Number, min: 0, default: 0 },
    days: { type: Number, min: 0, default: 0 },
    notifTrip: { type: Boolean, default: true },
    notifEco: { type: Boolean, default: false },

    favorites: {
        type: [{
            type: Number,
            min: 0,
            validate: {
                validator: Number.isInteger,
                message: 'Favorite destination IDs must be integers.'
            }
        }],
        default: []
    },
    avatar: { type: String, trim: true, default: '' },

    resetCodeHash: { type: String, default: '', select: false },
    resetCodeExpiresAt: { type: Date, default: null, select: false }
}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
        transform: (_doc, ret) => {
            delete ret.password;
            delete ret.resetCodeHash;
            delete ret.resetCodeExpiresAt;
            return ret;
        }
    },
    toObject: {
        virtuals: true,
        transform: (_doc, ret) => {
            delete ret.password;
            delete ret.resetCodeHash;
            delete ret.resetCodeExpiresAt;
            return ret;
        }
    }
});

userSchema.pre('validate', function normalizeBudgetBeforeValidation() {
    this.budget = normalizeBudget(this.budget);
});

userSchema.virtual('joinedAt').get(function getJoinedAt() {
    return this.createdAt ? this.createdAt.toISOString().slice(0, 10) : undefined;
});

userSchema.pre('save', function hashPassword() {
    if (!this.isModified('password') || isBcryptHash(this.password)) {
        return;
    }

    this.password = bcrypt.hashSync(this.password, BCRYPT_ROUNDS);
});

userSchema.methods.comparePassword = function comparePassword(candidatePassword) {
    if (!this.password) {
        return Promise.resolve(false);
    }

    const candidate = String(candidatePassword || '');

    if (isBcryptHash(this.password)) {
        return Promise.resolve(bcrypt.compareSync(candidate, this.password));
    }

    return Promise.resolve(this.password === candidate);
};

userSchema.methods.isPasswordHashed = function isPasswordHashed() {
    return isBcryptHash(this.password);
};

userSchema.statics.normalizeBudget = normalizeBudget;
userSchema.statics.PASSWORD_MAX_LENGTH = PASSWORD_MAX_LENGTH;

module.exports = mongoose.model('User', userSchema);

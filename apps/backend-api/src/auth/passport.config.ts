/**
 * Passport Configuration cho OAuth Authentication
 * Hỗ trợ Google OAuth 2.0, GitHub OAuth và JWT
 */

import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { User, IUser } from '../schema.mongodb';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

// Serialize user vào session
passport.serializeUser((user: any, done) => {
  done(null, user._id);
});

// Deserialize user từ session
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// ==================== GOOGLE OAUTH STRATEGY ====================
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/api/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Tìm user theo googleId
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
          // Kiểm tra email đã tồn tại chưa
          user = await User.findOne({ email: profile.emails?.[0]?.value });

          if (user) {
            // Update existing user với googleId
            user.googleId = profile.id;
            user.provider = 'google';
            user.avatar = profile.photos?.[0]?.value;
            await user.save();
          } else {
            // Tạo user mới
            user = await User.create({
              email: profile.emails?.[0]?.value,
              name: profile.displayName,
              googleId: profile.id,
              provider: 'google',
              avatar: profile.photos?.[0]?.value,
              isActive: true,
            });
          }
        }

        return done(null, user);
      } catch (error) {
        return done(error as Error, undefined);
      }
    }
  )
);

// ==================== GITHUB OAUTH STRATEGY ====================
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
      callbackURL: process.env.GITHUB_CALLBACK_URL || 'http://localhost:3001/api/auth/github/callback',
    },
    async (accessToken: string, refreshToken: string, profile: any, done: any) => {
      try {
        // Tìm user theo githubId
        let user = await User.findOne({ githubId: profile.id });

        if (!user) {
          // Kiểm tra email đã tồn tại chưa
          const email = profile.emails?.[0]?.value || `${profile.username}@github.com`;
          user = await User.findOne({ email });

          if (user) {
            // Update existing user với githubId
            user.githubId = profile.id;
            user.provider = 'github';
            user.avatar = profile.photos?.[0]?.value;
            await user.save();
          } else {
            // Tạo user mới
            user = await User.create({
              email,
              name: profile.displayName || profile.username,
              githubId: profile.id,
              provider: 'github',
              avatar: profile.photos?.[0]?.value,
              isActive: true,
            });
          }
        }

        return done(null, user);
      } catch (error) {
        return done(error as Error, undefined);
      }
    }
  )
);

// ==================== JWT STRATEGY ====================
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET || 'workflow_jwt_secret_change_in_production'
};

passport.use(
  new JwtStrategy(jwtOptions, async (jwtPayload, done) => {
    try {
      console.log('🔍 JWT Strategy - Payload:', jwtPayload);
      
      // JWT payload có thể chứa userId hoặc id
      const userId = jwtPayload.userId || jwtPayload.id || jwtPayload.sub;
      
      if (!userId) {
        console.log('❌ No userId found in JWT payload');
        return done(null, false);
      }
      
      const user = await User.findById(userId);
      
      if (!user) {
        console.log('❌ User not found:', userId);
        return done(null, false);
      }
      
      if (!user.isActive) {
        console.log('❌ User is not active:', userId);
        return done(null, false);
      }
      
      console.log('✅ JWT verified - User:', user.email, 'Role:', (user as any).role);
      return done(null, user);
    } catch (error) {
      console.error('❌ JWT verification error:', error);
      return done(error, false);
    }
  })
);

export default passport;

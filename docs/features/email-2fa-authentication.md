# Email + 2FA Authentication Flow

## Overview
Redesign the authentication system to use email-only login with 2FA verification codes, creating a seamless experience for both sign-in and sign-up through a single unified flow.

## User Experience

### State 1: Email Entry
**Visual Elements:**
- Pulsey avatar (56x56px, black)
- Heading: "Welcome to Pulse"
- Subtext: "First time here? Sign up for free"
- Email input field with placeholder "Email"
- Helper text below input: "We'll create an account if you don't have one yet."
- Continue button (hidden initially)

**Interactions:**
- Email validation occurs in real-time as user types
- Once valid email detected, Continue button animates in (slides up/fades in)
- Helper text fades out when Continue button appears
- Clicking Continue triggers code send and transitions to State 2

### State 2: Code Verification
**Visual Elements:**
- Pulsey avatar (remains in place)
- Heading: "We've emailed you a verification code"
- Subtext: "Please enter the code we sent to [user@email.com]"
- OTP input component (6 digit code input)
- "Didn't receive a code? Resend" link below OTP input
- Optional: Back arrow to return to email entry

**Interactions:**
- Smooth transition animation from State 1 to State 2
- Auto-focus on first digit of OTP input
- Auto-advance through digits as user types
- Auto-submit when all 6 digits entered
- Resend link has cooldown period (e.g., 30 seconds)
- Success leads to dashboard (existing user) or onboarding (new user)

## Technical Implementation

### Frontend Components Needed
1. **EmailAuthForm.tsx** - Main container managing both states
2. **OTPInput.tsx** - Custom 6-digit code input component
3. **Transition animations** - Framer Motion for smooth state changes

### Backend Requirements
1. **Unified auth endpoint** - Single endpoint that handles both signin/signup
2. **Email service integration** - Send verification codes via email
3. **Code generation & validation** - 6-digit codes with expiration
4. **User detection** - Determine if email exists to route properly post-verification
5. **Rate limiting** - Prevent abuse of code sending

### Supabase Configuration
- Switch from password-based auth to OTP/Magic Link flow
- Configure email templates for verification codes
- Set up proper session management

## Design Inspiration
- Family Wallet's authentication flow (app.family.co)
- Smooth transitions between states
- Clean, minimal interface
- Progressive disclosure (Continue button appears only when ready)

## Benefits
1. **Simplified UX** - No separate signin/signup pages
2. **Enhanced Security** - No passwords to remember or leak
3. **Reduced Friction** - Single form for all users
4. **Modern Experience** - Aligns with current auth best practices

## Future Enhancements
- Social login options (Google, Apple)
- Biometric authentication for returning users
- Remember device option to skip 2FA
- Custom email templates with branding

## Implementation Priority
**Status:** Future Enhancement  
**Estimated Effort:** Medium-High  
**Dependencies:** 
- Email service setup
- Supabase auth reconfiguration
- OTP input component creation

## Notes
- Consider accessibility for OTP input (screen readers, keyboard navigation)
- Ensure mobile-friendly OTP input (auto-suggest from SMS)
- Add proper error handling for expired/invalid codes
- Include loading states during code verification
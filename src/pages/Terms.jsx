import { Link } from 'react-router-dom';
import './Legal.css';

const Terms = () => {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <Link to="/" className="back-link">← Back to Home</Link>
        
        <h1>Terms of Service</h1>
        <p className="last-updated">Last Updated: December 26, 2025</p>

        <div className="legal-content">
          <p>Welcome to Slate! These Terms of Service ("Terms") govern your use of the Slate mobile application ("App," "Service," "we," "us," or "our"). By accessing or using Slate, you agree to be bound by these Terms.</p>

          <h2>1. Acceptance of Terms</h2>
          <p>By creating an account, accessing, or using Slate, you acknowledge that you have read, understood, and agree to be bound by these Terms and our Privacy Policy. If you do not agree to these Terms, you may not use the Service.</p>
          <p><strong>Eligibility:</strong> You must be at least 13 years old to use Slate. If you are under 18, you must have parental or guardian consent to use the Service.</p>

          <h2>2. Description of Service</h2>
          <p>Slate is an AI-powered movie recommendation application that provides personalized movie suggestions based on your preferences, viewing history, and ratings.</p>
          <p><strong>Service Features:</strong></p>
          <ul>
            <li>Personalized movie recommendations</li>
            <li>Movie rating and review system</li>
            <li>Preference customization</li>
            <li>Viewing history tracking</li>
            <li>Recommendation learning algorithm</li>
          </ul>
          <p><strong>Third-Party Data:</strong> Movie information, posters, ratings, and metadata are provided by The Movie Database (TMDb). Slate is not affiliated with, endorsed by, or sponsored by TMDb.</p>

          <h2>3. User Accounts</h2>
          <p><strong>Account Creation:</strong></p>
          <ul>
            <li>You must provide accurate, current, and complete information during registration</li>
            <li>You must maintain and update your account information</li>
            <li>You are responsible for maintaining the confidentiality of your password</li>
            <li>You are responsible for all activities that occur under your account</li>
          </ul>
          <p><strong>Account Security:</strong></p>
          <ul>
            <li>Choose a strong, unique password</li>
            <li>Do not share your account credentials</li>
            <li>Notify us immediately of any unauthorized access or security breach</li>
          </ul>
          <p><strong>Account Termination:</strong></p>
          <ul>
            <li>You may delete your account at any time through the app settings</li>
            <li>We reserve the right to suspend or terminate accounts that violate these Terms</li>
            <li>Upon termination, your right to use the Service will immediately cease</li>
          </ul>

          <h2>4. User Content and Data</h2>
          <p><strong>Your Content:</strong> You retain ownership of any content you submit, including:</p>
          <ul>
            <li>Movie ratings and reviews</li>
            <li>Preference selections</li>
            <li>Viewing history</li>
            <li>Feedback and dismissals</li>
          </ul>
          <p><strong>License Grant:</strong> By submitting content, you grant Slate a worldwide, non-exclusive, royalty-free license to use, store, and process your content solely for providing and improving the Service.</p>
          <p><strong>Prohibited Content:</strong> You may not submit content that:</p>
          <ul>
            <li>Violates any laws or regulations</li>
            <li>Infringes on intellectual property rights</li>
            <li>Contains malware or harmful code</li>
            <li>Is offensive, abusive, or harassing</li>
            <li>Misrepresents your identity or affiliation</li>
          </ul>

          <h2>5. Acceptable Use</h2>
          <p>You agree NOT to:</p>
          <ul>
            <li>Use the Service for any illegal purpose</li>
            <li>Attempt to gain unauthorized access to the Service</li>
            <li>Interfere with or disrupt the Service</li>
            <li>Use automated systems (bots, scrapers) without permission</li>
            <li>Reverse engineer or decompile the App</li>
            <li>Remove or modify any proprietary notices</li>
            <li>Impersonate any person or entity</li>
            <li>Collect user information without consent</li>
            <li>Use the Service to spam or distribute malware</li>
          </ul>

          <h2>6. Intellectual Property</h2>
          <p><strong>Slate's Ownership:</strong> The Service, including its design, features, code, and algorithms, is owned by Slate and protected by copyright, trademark, and other intellectual property laws.</p>
          <p><strong>TMDb Content:</strong> Movie data, posters, images, and metadata are provided by TMDb and are subject to TMDb's terms of use. All movie content remains the property of respective copyright holders.</p>
          <p><strong>Your License:</strong> We grant you a limited, non-exclusive, non-transferable, revocable license to use the App for personal, non-commercial purposes.</p>

          <h2>7. Disclaimers and Warranties</h2>
          <p><strong>AS IS Basis:</strong> THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED.</p>
          <p><strong>We Do NOT Guarantee:</strong></p>
          <ul>
            <li>Uninterrupted or error-free service</li>
            <li>Accuracy or reliability of recommendations</li>
            <li>That the Service will meet your requirements</li>
            <li>That defects will be corrected</li>
            <li>Security of data transmission</li>
          </ul>
          <p><strong>Recommendation Accuracy:</strong> Movie recommendations are generated by algorithms and AI. We do not guarantee you will enjoy recommended movies. Taste is subjective and our algorithm learns over time.</p>

          <h2>8. Limitation of Liability</h2>
          <p>TO THE FULLEST EXTENT PERMITTED BY LAW, SLATE SHALL NOT BE LIABLE FOR ANY:</p>
          <ul>
            <li>Indirect, incidental, special, consequential, or punitive damages</li>
            <li>Loss of profits, revenue, data, or goodwill</li>
            <li>Service interruptions or data loss</li>
            <li>Damages arising from your use of the Service</li>
            <li>Damages exceeding the amount you paid us (if any) in the past 12 months</li>
          </ul>

          <h2>9. Privacy and Data</h2>
          <p>Your privacy is important to us. Our collection and use of personal information is governed by our <Link to="/privacy">Privacy Policy</Link>, which is incorporated into these Terms by reference.</p>

          <h2>10. Payments and Subscriptions</h2>
          <p><strong>Current Status:</strong> Slate is currently free to use with no subscription fees.</p>
          <p><strong>Future Changes:</strong> We reserve the right to introduce paid features, subscriptions, or in-app purchases in the future.</p>

          <h2>11. Modifications to Terms</h2>
          <p>We may update these Terms from time to time. When we do:</p>
          <ul>
            <li>The "Last Updated" date will be revised</li>
            <li>Significant changes will be communicated via email or in-app notification</li>
            <li>Continued use after changes constitutes acceptance</li>
          </ul>

          <h2>12. Contact Information</h2>
          <p>Questions about these Terms? Contact us at:</p>
          <p><strong>Email:</strong> <a href="mailto:phantomnota09@gmail.com">phantomnota09@gmail.com</a></p>

          <h2>13. Acknowledgment</h2>
          <p>BY USING SLATE, YOU ACKNOWLEDGE THAT YOU HAVE READ THESE TERMS, UNDERSTAND THEM, AND AGREE TO BE BOUND BY THEM.</p>

          <p className="copyright">© 2025 Slate. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default Terms;
